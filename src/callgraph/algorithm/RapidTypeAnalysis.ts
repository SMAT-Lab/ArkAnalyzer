/*
 * Copyright (c) 2024-2025 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { AbstractInvokeExpr, ArkInstanceInvokeExpr, ArkNewArrayExpr, ArkNewExpr, ArkPtrInvokeExpr, ArkStaticInvokeExpr } from '../../core/base/Expr';
import { Scene } from '../../Scene';
import { ArkAssignStmt, Stmt } from '../../core/base/Stmt';
import { ArkClass } from '../../core/model/ArkClass';
import { ClassSignature } from '../../core/model/ArkSignature';
import { NodeID } from '../../core/graph/BaseExplicitGraph';
import { CallGraph, CallGraphNode, CallSite, FuncID } from '../model/CallGraph';
import { AbstractAnalysis } from './AbstractAnalysis';
import Logger, { LOG_MODULE_TYPE } from '../../utils/logger';
import { AliasType, ClassType, FunctionType, LexicalEnvType, Type } from '../../core/base/Type';
import { CallGraphBuilder } from '../model/builder/CallGraphBuilder';
import { CONSTRUCTOR_NAME, THIS_NAME } from '../../core/common/TSConst';
import { Local } from '../../core/base/Local';
import { DEFAULT_ARK_CLASS_NAME, DEFAULT_ARK_METHOD_NAME } from '../../core/common/Const';
import { SdkUtils } from '../../core/common/SdkUtils';
import { ArkMethod } from '../../core/model/ArkMethod';
import { Value } from '../../core/base/Value';
import { ArkInstanceFieldRef, ArkParameterRef, ClosureFieldRef } from '../../core/base/Ref';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'RTA');

const BUILTIN_ARRAY_CLASS_NAME = 'Array';

/**
 * Built-in container APIs that may take FunctionType args but only store them
 * (do not invoke). These must not get virtual callback CallSites.
 * All other no-CFG built-ins default to synthesizing callback edges (forEach/map/then/...).
 */
const BUILTIN_CONTAINER_NON_INVOKING_METHODS: ReadonlyMap<string, ReadonlySet<string>> = new Map([
    ['Array', new Set(['push', 'unshift', 'splice', 'indexOf', 'lastIndexOf', 'includes'])],
    ['Map', new Set(['set', 'get', 'has', 'delete'])],
    ['Set', new Set(['add', 'has', 'delete'])],
    ['WeakMap', new Set(['set', 'get', 'has', 'delete'])],
    ['WeakSet', new Set(['add', 'has', 'delete'])],
]);

const NON_INVOKING_METHOD_NAMES: ReadonlySet<string> = new Set(
    Array.from(BUILTIN_CONTAINER_NON_INVOKING_METHODS.values()).flatMap(s => Array.from(s))
);

interface VirtualDispatchRows {
    classSignatures: ClassSignature[];
    calleeNodeIDs: FuncID[];
    isUnconditionallyReachable: boolean[];
}

/**
 * Packed (ownerFuncID, logicalArgIndex). logicalArgIndex occupies the low
 * CALLBACK_BINDING_ARG_BITS bits; ownerFuncID is the high quotient.
 * Avoids short-lived {ownerFuncID, logicalArgIndex} object allocation.
 */
type CallbackBindingKey = number;

const CALLBACK_BINDING_ARG_BITS = 8;
const CALLBACK_BINDING_ARG_STRIDE = 1 << CALLBACK_BINDING_ARG_BITS;

interface CallbackBindingState {
    targets: Set<FuncID>;
    subscribers: Map<Stmt, FuncID>;
    // Callee parameter slots that should receive the same targets (param forwarding).
    forwards: Set<CallbackBindingKey>;
    // Instance callback fields assigned from this parameter slot.
    fieldForwards: Set<CallbackFieldKey>;
}

interface IgnoredCall {
    caller: NodeID;
    callee: NodeID;
    callStmt: Stmt;
}

type CallbackFieldKey = string;

interface CallbackFieldSubscriber {
    callerFuncID: FuncID;
    argIndex: number;
}

interface CallbackFieldState {
    targets: Set<FuncID>;
    subscribers: Map<Stmt, CallbackFieldSubscriber[]>;
    // Binding slots that should receive the same targets when this field's
    // targets are populated later (handles field→param ordering in RTA workList).
    bindingForwards: Set<CallbackBindingKey>;
}

export class RapidTypeAnalysis extends AbstractAnalysis {
    // TODO: signature duplicated check
    private instancedClasses: Set<ClassSignature> = new Set();
    private ignoredCalls: Map<ClassSignature, Set<IgnoredCall>> = new Map();
    private virtualDispatchIndex: Map<ClassSignature, Map<string, VirtualDispatchRows>> = new Map();
    private enableThisPrune: boolean;

    // ownerFuncID → logical argument index → lazily-created binding state
    private callbackBindings: Map<FuncID, Array<CallbackBindingState | undefined>> = new Map();
    // FieldSignature → callback targets/subscribers. This is intentionally type-based,
    // not allocation-site-sensitive, to keep field callback propagation lightweight.
    private callbackFieldBindings: Map<CallbackFieldKey, CallbackFieldState> = new Map();
    // Reused scratch storage for closure-chain cycle detection.
    private closureTraceVisited: Set<Local> = new Set();
    // Reused scratch for AliasType peeling in unwrapFunctionType.
    private aliasTypeUnwrapVisited: Set<Type> = new Set();
    // Reused scratch list of executable callee FuncIDs for one resolveCall.
    private executableCalleeScratch: FuncID[] = [];
    // Cached @built-in Array class signature for newarray → Array instantiation.
    private builtinArrayClassSignature: ClassSignature | undefined;
    // Whether getBuiltinArrayClassSignature has completed its one-time lookup (hit or miss).
    private builtinArrayClassResolved: boolean = false;

    private static readonly CALLBACK_CLASS_SIG_KEY: string[] = [
        '@ohos.base.d.ts: Callback', '@ohos.window.d.ts: Callback', 'component/common.d.ts: Callback',
        '@ohos.base.d.ts: ErrorCallback',
        '@ohos.base.d.ts: AsyncCallback',
        '@ohos.base.d.ts: BusinessError',
        'lib.es5.d.ts: Function',
    ];

    constructor(scene: Scene, cg: CallGraph, cb: CallGraphBuilder, enableThisPrune: boolean = false) {
        super(scene, cg);
        this.cgBuilder = cb;
        this.enableThisPrune = enableThisPrune;
    }

    protected init(): void {
        this.scene.getClasses().filter((c: ArkClass): boolean => c.getName() === DEFAULT_ARK_CLASS_NAME).forEach((c: ArkClass): void => {
            const dfltMethod = c.getMethodWithName(DEFAULT_ARK_METHOD_NAME)?.getSignature();
            if (dfltMethod) {
                const funcID = this.cg.getCallGraphNodeByMethod(dfltMethod).getID();
                this.workList.push(funcID);
            }
        });

        super.init();
    }

    public resolveCall(callerMethod: NodeID, invokeStmt: Stmt): CallSite[] {
        const invokeExpr = invokeStmt.getInvokeExpr();
        if (!invokeExpr) {
            return [];
        }

        if (invokeExpr instanceof ArkPtrInvokeExpr) {
            return this.resolvePtrInvoke(callerMethod, invokeStmt, invokeExpr);
        }

        const resolveResult: CallSite[] = [];
        const declared = this.resolveInvokeExpr(invokeExpr);
        this.resolveDirectOrVirtual(callerMethod, invokeStmt, invokeExpr, declared, resolveResult);
        this.processCallbackArguments(callerMethod, invokeStmt, invokeExpr, declared, resolveResult);
        return resolveResult;
    }

    private resolveDirectOrVirtual(
        callerMethod: NodeID,
        invokeStmt: Stmt,
        invokeExpr: AbstractInvokeExpr,
        calleeMethod: ArkMethod | undefined,
        resolveResult: CallSite[]
    ): void {
        if (!calleeMethod) {
            return;
        }

        if (invokeExpr instanceof ArkStaticInvokeExpr) {
            resolveResult.push(
                this.newRTACallSite(invokeStmt, callerMethod, this.cg.getCallGraphNodeByMethod(calleeMethod.getSignature()).getID())
            );
            return;
        }

        const declareClass = calleeMethod.getDeclaringArkClass();
        const methodName = calleeMethod.getName();

        // Aggressive heuristic: when enabled and the call is `this.foo()`,
        // only keep the implementation of `foo` in the current declaring class,
        // or the first superclass that defines it (e.g. B.m() calling this.foo() → A.foo() when B extends A).
        const prunedCallSite = this.tryResolveAggressiveThisPruneCall(invokeStmt, methodName, callerMethod);
        if (prunedCallSite) {
            resolveResult.push(prunedCallSite);
            return;
        }

        const directCallSite = this.resolveConstructorClassFromNew(methodName, invokeStmt, callerMethod);
        if (directCallSite) {
            resolveResult.push(directCallSite);
            return;
        }

        // Private methods cannot be overridden; only the declaring class has an implementation.
        if (calleeMethod.isPrivate()) {
            const calleeNode = this.cg.getCallGraphNodeByMethod(calleeMethod.getSignature());
            if (this.instancedClasses.has(declareClass.getSignature())) {
                resolveResult.push(
                    this.newRTACallSite(invokeStmt, callerMethod, calleeNode.getID())
                );
            } else {
                this.addIgnoredCalls(declareClass.getSignature(), callerMethod, calleeNode.getID(), invokeStmt);
            }
            return;
        }

        const virtualDispatchRows = this.getOrBuildVirtualDispatchRows(declareClass, methodName);
        for (let i = 0; i < virtualDispatchRows.classSignatures.length; i++) {
            const classSignature = virtualDispatchRows.classSignatures[i];
            if (virtualDispatchRows.isUnconditionallyReachable[i] || this.instancedClasses.has(classSignature)) {
                resolveResult.push(
                    this.newRTACallSite(invokeStmt, callerMethod, virtualDispatchRows.calleeNodeIDs[i])
                );
            } else {
                this.addIgnoredCalls(classSignature, callerMethod, virtualDispatchRows.calleeNodeIDs[i], invokeStmt);
            }
        }
    }

    /**
     * Single args scan:
     * - if any executable real callee exists (or declared callee has CFG), record callback bindings
     *   (concrete FunctionType) or forward parameter bindings into callee slots;
     * - otherwise, for no-CFG SDK / built-in / unresolved (`%unk`) callees, append virtual
     *   callback CallSites for concrete FunctionType args, parameter bindings, and callback
     *   fields.
     */
    private processCallbackArguments(
        callerMethod: NodeID,
        invokeStmt: Stmt,
        invokeExpr: AbstractInvokeExpr,
        declared: ArkMethod | undefined,
        resolveResult: CallSite[]
    ): void {
        const hasVirtualCallbackCallee = this.scanExecutableCallees(resolveResult);
        const hasExecutableTarget = this.executableCalleeScratch.length > 0;
        const declaredHasCfg = declared !== undefined && declared.getCfg() !== undefined;

        if (!hasExecutableTarget && !declaredHasCfg) {
            this.handleNoExecutableCalleePath(callerMethod, invokeStmt, declared, hasVirtualCallbackCallee, resolveResult);
            return;
        }

        let declaredOwnerFuncID: FuncID | undefined;
        if (declared && !hasExecutableTarget) {
            declaredOwnerFuncID = this.cg.getCallGraphNodeByMethod(declared.getSignature()).getID();
        }

        const args = invokeExpr.getArgs();
        const callerArkMethod = this.cg.getArkMethodByFuncID(callerMethod);
        for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            const functionType = this.unwrapFunctionType(arg.getType());
            if (!functionType && !this.isCallbackType(arg.getType())) {
                continue;
            }
            if (functionType) {
                this.bindFunctionTypeCallback(functionType, i, hasExecutableTarget, declaredOwnerFuncID);
            } else {
                this.bindClassTypeCallback(arg, i, callerArkMethod, hasExecutableTarget, declaredOwnerFuncID);
            }

            // Parameter forwarding: start(cb) { this.schedule(cb); }
            // Propagate caller's parameter binding into each callee's argument slot i.
            if (!(arg instanceof Local) || !callerArkMethod) {
                continue;
            }
            const sourceKey = this.resolveFuncPtrToBindingKey(arg, callerArkMethod);
            if (sourceKey === undefined) {
                continue;
            }
            if (hasExecutableTarget) {
                for (let j = 0; j < this.executableCalleeScratch.length; j++) {
                    this.linkCallbackBinding( sourceKey, this.encodeCallbackBindingKey(this.executableCalleeScratch[j], i));
                }
            } else if (declaredOwnerFuncID !== undefined) {
                this.linkCallbackBinding(sourceKey, this.encodeCallbackBindingKey(declaredOwnerFuncID, i));
            }
        }
    }

    /**
     * Bind a FunctionType callback argument to the callee's parameter binding slot.
     * Extracted from processCallbackArguments for readability.
     */
    private bindFunctionTypeCallback(
        functionType: FunctionType,
        argIndex: number,
        hasExecutableTarget: boolean,
        declaredOwnerFuncID: FuncID | undefined,
    ): void {
        const callbackMethod = this.scene.getMethod(functionType.getMethodSignature());
        if (callbackMethod && callbackMethod.getCfg()) {
            const targetFuncID = this.cg.getCallGraphNodeByMethod(callbackMethod.getSignature()).getID();
            if (hasExecutableTarget) {
                for (let j = 0; j < this.executableCalleeScratch.length; j++) {
                    this.addCallbackTarget(this.executableCalleeScratch[j], argIndex, targetFuncID);
                }
            } else if (declaredOwnerFuncID !== undefined) {
                this.addCallbackTarget(declaredOwnerFuncID, argIndex, targetFuncID);
            }
        }
    }

    /**
     * Bind a ClassType callback (Callback<T>, AsyncCallback<T>, ...) argument to the
     * callee's parameter binding slot via field binding state.
     * Extracted from processCallbackArguments for readability.
     */
    private bindClassTypeCallback(
        arg: Value,
        argIndex: number,
        callerArkMethod: ArkMethod | null,
        hasExecutableTarget: boolean,
        declaredOwnerFuncID: FuncID | undefined,
    ): void {
        let fieldRef: ArkInstanceFieldRef | undefined;
        if (arg instanceof ArkInstanceFieldRef) {
            fieldRef = arg;
        } else if (arg instanceof Local && callerArkMethod) {
            fieldRef = this.resolveFuncPtrToFieldRef(arg, callerArkMethod);
        }
        if (fieldRef) {
            const fieldKey = this.getCallbackFieldKey(fieldRef);
            if (hasExecutableTarget) {
                for (let j = 0; j < this.executableCalleeScratch.length; j++) {
                    const bindingKey = this.encodeCallbackBindingKey(this.executableCalleeScratch[j], argIndex);
                    this.linkFieldToBinding(fieldKey, bindingKey);
                }
            } else if (declaredOwnerFuncID !== undefined) {
                const bindingKey = this.encodeCallbackBindingKey(declaredOwnerFuncID, argIndex);
                this.linkFieldToBinding(fieldKey, bindingKey);
            }
        }
    }

    private scanExecutableCallees(resolveResult: CallSite[]): boolean {
        this.executableCalleeScratch.length = 0;
        let hasVirtualCallbackCallee = false;
        for (let i = 0; i < resolveResult.length; i++) {
            const calleeId = resolveResult[i].getCalleeFuncID();
            if (calleeId === undefined) {
                continue;
            }
            const method = this.cg.getArkMethodByFuncID(calleeId);
            if (method && method.getCfg()) {
                this.executableCalleeScratch.push(calleeId);
            } else if (this.shouldSynthesizeVirtualCallback(calleeId)) {
                hasVirtualCallbackCallee = true;
            }
        }
        return hasVirtualCallbackCallee;
    }

    private handleNoExecutableCalleePath(
        callerMethod: NodeID,
        invokeStmt: Stmt,
        declared: ArkMethod | undefined,
        hasVirtualCallbackCallee: boolean,
        resolveResult: CallSite[]
    ): void {
        const invokeExpr = invokeStmt.getInvokeExpr();
        if (!invokeExpr) {
            return;
        }
        const args = invokeExpr.getArgs();
        let shouldAppendVirtual = hasVirtualCallbackCallee;
        if (!shouldAppendVirtual && declared) {
            const declaredOwnerFuncID = this.cg.getCallGraphNodeByMethod(declared.getSignature()).getID();
            shouldAppendVirtual = this.shouldSynthesizeVirtualCallback(declaredOwnerFuncID);
        }
        // Declaring signature may be `@%unk/%unk:...` with no Scene method / no CFG node that
        // passes the SDK/built-in gates; still synthesize callback edges from the invoke itself.
        if (!shouldAppendVirtual) {
            shouldAppendVirtual = this.shouldSynthesizeVirtualCallbackFromInvoke(invokeExpr);
        }
        if (shouldAppendVirtual) {
            this.appendVirtualCallbackCallSites(callerMethod, invokeStmt, args, resolveResult);
        }
    }

    /**
     * Unresolved declaring file (`@%unk/%unk:...`) — common when type inference fails for
     * built-ins such as Promise.constructor in large apps.
     */
    private isUnresolvedProjectName(projectName: string): boolean {
        return projectName === '%unk';
    }

    /**
     * Built-in container APIs that accept FunctionType values without invoking them
     * (writes such as push/set, and lookups such as indexOf/has). Caller must already
     * know the method is a `@built-in` SDK method.
     */
    private isBuiltInContainerNonInvokingMethod(method: ArkMethod | null | undefined): boolean {
        if (!method) {
            return false;
        }
        const nonInvokingNames = BUILTIN_CONTAINER_NON_INVOKING_METHODS.get(method.getDeclaringArkClass().getName());
        if (!nonInvokingNames) {
            return false;
        }
        return nonInvokingNames.has(method.getName());
    }

    private isBuiltInContainerNonInvokingMethodByMethodName(methodName: string): boolean {
        return NON_INVOKING_METHOD_NAMES.has(methodName);
    }

    /**
     * Whether a no-CFG callee should synthesize virtual edges into callback args.
     * OH SDK and unresolved (`%unk`) APIs always qualify. Built-ins qualify by default
     * except container non-invoking APIs (Array.push / Array.indexOf / Map.set / ...).
     * Resolves the CG node and declaring projectName once.
     */
    private shouldSynthesizeVirtualCallback(id: NodeID): boolean {
        const node = this.cg.getNode(id) as CallGraphNode | undefined;
        if (!node) {
            return false;
        }
        const projectName = node.getMethod().getDeclaringClassSignature().getDeclaringFileSignature().getProjectName();
        // Same order as previous isOHSdkMethod → isUnresolved → isBuiltIn path.
        if (node.isSdkMethod() && projectName !== SdkUtils.BUILT_IN_NAME) {
            return true;
        }
        if (this.isUnresolvedProjectName(projectName)) {
            return !this.isBuiltInContainerNonInvokingMethodByMethodName(node.getMethod().getMethodSubSignature().getMethodName());
        }
        if (node.isSdkMethod() && projectName === SdkUtils.BUILT_IN_NAME) {
            return !this.isBuiltInContainerNonInvokingMethod(this.cg.getArkMethodByFuncID(id));
        }
        return false;
    }

    /**
     * Invoke-site gate when {@link resolveInvokeExpr} cannot produce a usable declared method
     * (e.g. `@%unk/%unk: Promise.constructor` with no Scene body).
     */
    private shouldSynthesizeVirtualCallbackFromInvoke(invokeExpr: AbstractInvokeExpr): boolean {
        const projectName = invokeExpr.getMethodSignature().getDeclaringClassSignature().getDeclaringFileSignature().getProjectName();
        if (!this.isUnresolvedProjectName(projectName)) {
            return false;
        }
        return !this.isBuiltInContainerNonInvokingMethodByMethodName(invokeExpr.getMethodSignature().getMethodSubSignature().getMethodName());
    }

    /**
     * No-CFG callee that invokes callbacks: emit virtual edges into every callback-shaped argument.
     * Caller must have already gated on {@link shouldSynthesizeVirtualCallback}. Built-in container
     * non-invoking APIs (Array.push / Array.indexOf / Map.set / ...) remain excluded by that gate.
     */
    private appendVirtualCallbackCallSites(
        callerMethod: NodeID,
        invokeStmt: Stmt,
        args: readonly Value[],
        resolveResult: CallSite[]
    ): void {
        for (let i = 0; i < args.length; i++) {
            this.appendCallbackValueCallSites(args[i], invokeStmt, callerMethod, resolveResult, i);
        }
    }

    private resolvePtrInvoke(callerMethod: NodeID, invokeStmt: Stmt, invokeExpr: ArkPtrInvokeExpr): CallSite[] {
        const resolveResult: CallSite[] = [];
        const ptr = invokeExpr.getFuncPtrLocal();
        this.appendCallbackValueCallSites(ptr, invokeStmt, callerMethod, resolveResult, -1);
        return resolveResult;
    }

    /**
     * Resolve a callback value through all supported representations.
     * A value may have both a concrete static target and a field/binding origin;
     * both paths are retained so later field targets cannot be hidden by the
     * concrete FunctionType fast path.
     */
    private appendCallbackValueCallSites(
        value: Value,
        invokeStmt: Stmt,
        callerMethod: NodeID,
        resolveResult: CallSite[],
        argIndex: number,
    ): void {
        let functionType = this.unwrapFunctionType(value.getType());
        if (!functionType) {
            if (value instanceof Local && this.isCallbackType(value.getType())) {
                const defStmt = value.getDeclaringStmt();
                if (defStmt instanceof ArkAssignStmt) {
                    functionType = this.unwrapFunctionType(defStmt.getRightOp().getType());
                }
            }
        }
        if (functionType) {
            const concreteMethod = this.scene.getMethod(functionType.getMethodSignature());
            if (concreteMethod && concreteMethod.getCfg()) {
                const targetFuncID = this.cg.getCallGraphNodeByMethod(concreteMethod.getSignature()).getID();
                this.appendCallbackCallSite(
                    invokeStmt,
                    callerMethod,
                    targetFuncID,
                    resolveResult,
                    argIndex
                );
            }
        }

        if (value instanceof ArkInstanceFieldRef) {
            this.subscribeToCallbackField(value, invokeStmt, callerMethod, resolveResult, argIndex);
        }

        const ownerMethod = invokeStmt.getCfg()?.getDeclaringMethod();
        if (!(value instanceof Local) || !ownerMethod) {
            return;
        }

        const bindingState = this.resolveFuncPtrToBindingState(value, ownerMethod);
        if (bindingState) {
            this.subscribeAndCollectBoundTargets(bindingState, invokeStmt, callerMethod, resolveResult, argIndex);
        }

        const fieldRef = this.resolveFuncPtrToFieldRef(value, ownerMethod);
        if (fieldRef && this.isCallbackType(fieldRef.getType())) {
            this.subscribeToCallbackField(fieldRef, invokeStmt, callerMethod, resolveResult, argIndex);
        }
    }

    private appendCallbackCallSite(
        invokeStmt: Stmt,
        callerMethod: NodeID,
        targetFuncID: FuncID,
        resolveResult: CallSite[],
        argIndex: number,
    ): void {
        const hasTarget = resolveResult.some((callSite: CallSite): boolean => {
            return callSite.getCalleeFuncID() === targetFuncID;
        });
        if (hasTarget) {
            return;
        }
        resolveResult.push(
            this.newRTACallSite(invokeStmt, callerMethod, targetFuncID, argIndex)
        );
    }

    private subscribeToCallbackField(
        fieldRef: ArkInstanceFieldRef,
        invokeStmt: Stmt,
        callerMethod: NodeID,
        resolveResult: CallSite[],
        argIndex: number,
    ): void {
        if (!this.isCallbackType(fieldRef.getType())) {
            return;
        }
        const fieldKey = this.getCallbackFieldKey(fieldRef);
        this.subscribeAndCollectFieldTargets(fieldKey, invokeStmt, callerMethod, resolveResult, argIndex);
    }

    /**
     * Subscribe invokeStmt to bindingState and collect already-known targets as CallSites.
     * Late-arriving targets are delivered via addCallbackTarget → emitCallbackEdge.
     */
    private subscribeAndCollectBoundTargets(
        bindingState: CallbackBindingState,
        invokeStmt: Stmt,
        callerMethod: NodeID,
        resolveResult: CallSite[],
        argIndex: number,
    ): void {
        if (bindingState.subscribers.has(invokeStmt)) {
            return;
        }
        bindingState.subscribers.set(invokeStmt, callerMethod);
        for (const targetFuncID of bindingState.targets) {
            this.appendCallbackCallSite(invokeStmt, callerMethod, targetFuncID, resolveResult, argIndex);
        }
    }

    private getTypeFromAliasType(aliasType: AliasType): Type | null {
        const visited = this.aliasTypeUnwrapVisited;
        visited.clear();
        let current: Type | undefined = aliasType;
        while (current instanceof AliasType) {
            if (visited.has(current)) {
                return null;
            }
            visited.add(current);
            current = current.getOriginalType();
        }
        return current;
    }

    /**
     * Whether a type can serve as a callback — FunctionType (direct or aliased)
     * or a ClassType callback wrapper (Callback<T>, AsyncCallback<T>, ...).
     *
     * Unlike {@link unwrapFunctionType}, this accepts ClassType callbacks whose real
     * FunctionType is only discoverable at the assignment site (right-hand side),
     * not from the ClassType itself. This lets the field-subscription and field-store
     * pipelines accept `private cb: Callback<X> = (...) => {...}` fields.
     */
    private isCallbackType(type: Type): boolean {
        let targetType: Type | null = type;
        if (type instanceof AliasType) {
            targetType = this.getTypeFromAliasType(type);
        }

        if (targetType instanceof FunctionType) {
            return true;
        }

        if (targetType instanceof ClassType) {
            const targetSig = targetType.getClassSignature().toString();
            return RapidTypeAnalysis.CALLBACK_CLASS_SIG_KEY.some(sig => targetSig.includes(sig));
        }
        return false;
    }

    /**
     * Peel AliasType layers until a FunctionType is found.
     * Fast-path: FunctionType returns immediately; non-alias types return undefined
     * without touching the visited scratch set.
     */
    private unwrapFunctionType(type: Type): FunctionType | null {
        let targetType: Type | null = type;
        if (type instanceof AliasType) {
            targetType = this.getTypeFromAliasType(type);
        }

        if (targetType instanceof FunctionType) {
            return targetType;
        }
        return null;
    }

    private resolveFuncPtrToBindingState(ptr: Local, ownerMethod: ArkMethod): CallbackBindingState | undefined {
        const key = this.resolveFuncPtrToBindingKey(ptr, ownerMethod);
        if (key === undefined) {
            return undefined;
        }
        return this.getOrCreateBindingState(
            this.decodeOwnerFuncID(key),
            this.decodeLogicalArgIndex(key)
        );
    }

    private resolveFuncPtrToBindingKey(ptr: Local, ownerMethod: ArkMethod): CallbackBindingKey | undefined {
        this.closureTraceVisited.clear();
        const startLocal = this.recoverLocalWithDeclaringStmt(ptr, ownerMethod);
        if (!startLocal) {
            return undefined;
        }
        return this.resolveFuncPtrToBindingKeyRec(startLocal);
    }

    /**
     * Resolve a function-pointer local to an instance callback field.
     * The short-term field model follows one local alias at most; it does not
     * perform receiver points-to analysis.
     */
    private resolveFuncPtrToFieldRef(ptr: Local, ownerMethod: ArkMethod): ArkInstanceFieldRef | undefined {
        this.closureTraceVisited.clear();
        let current = this.recoverLocalWithDeclaringStmt(ptr, ownerMethod);
        while (current) {
            if (this.closureTraceVisited.has(current)) {
                return undefined;
            }
            this.closureTraceVisited.add(current);
            const declaringStmt = current.getDeclaringStmt();
            if (!(declaringStmt instanceof ArkAssignStmt)) {
                return undefined;
            }
            const rightOp = declaringStmt.getRightOp();
            if (rightOp instanceof ArkInstanceFieldRef) {
                return rightOp;
            }
            if (!(rightOp instanceof Local)) {
                return undefined;
            }
            current = this.recoverLocalWithDeclaringStmt(rightOp, ownerMethod);
        }
        return undefined;
    }

    private resolveFuncPtrValueToBindingKey(value: Value, ownerMethod: ArkMethod): CallbackBindingKey | undefined {
        if (value instanceof Local) {
            return this.resolveFuncPtrToBindingKey(value, ownerMethod);
        }
        if (!(value instanceof ArkParameterRef)) {
            return undefined;
        }
        const logicalArgIndex = this.toLogicalArgIndex(ownerMethod, value.getIndex());
        if (logicalArgIndex < 0) {
            return undefined;
        }
        const ownerFuncID = this.cg.getCallGraphNodeByMethod(ownerMethod.getSignature()).getID();
        return this.encodeCallbackBindingKey(ownerFuncID, logicalArgIndex);
    }

    /**
     * AliasType-typed ptr locals on invoke exprs may lack declaringStmt even when the
     * method body has a same-named local that carries the real definition.
     */
    private recoverLocalWithDeclaringStmt(local: Local, ownerMethod: ArkMethod): Local | undefined {
        if (local.getDeclaringStmt()) {
            return local;
        }
        const body = ownerMethod.getBody();
        if (!body) {
            return undefined;
        }
        const candidate = body.getLocals().get(local.getName());
        if (candidate && candidate.getDeclaringStmt()) {
            return candidate;
        }
        return undefined;
    }

    /**
     * Recursively trace a Local back to a parameter binding key.
     * Follows local aliases and unique closure captures until an ArkParameterRef is
     * found; returns the packed (ownerFuncID, logicalArgIndex) key, or undefined if
     * the value does not originate from a parameter slot.
     */
    private resolveFuncPtrToBindingKeyRec(local: Local): CallbackBindingKey | undefined {
        if (this.closureTraceVisited.has(local)) {
            return undefined;
        }
        this.closureTraceVisited.add(local);

        const declaringStmt = local.getDeclaringStmt();
        if (!(declaringStmt instanceof ArkAssignStmt)) {
            return undefined;
        }

        const rightOp = declaringStmt.getRightOp();
        if (rightOp instanceof ArkParameterRef) {
            const ownerMethod = declaringStmt.getCfg()?.getDeclaringMethod();
            if (!ownerMethod) {
                return undefined;
            }
            const logicalArgIndex = this.toLogicalArgIndex(ownerMethod, rightOp.getIndex());
            if (logicalArgIndex < 0) {
                return undefined;
            }
            const ownerFuncID = this.cg.getCallGraphNodeByMethod(ownerMethod.getSignature()).getID();
            return this.encodeCallbackBindingKey(ownerFuncID, logicalArgIndex);
        }

        // Local alias: const invoke = cb;
        if (rightOp instanceof Local) {
            return this.resolveFuncPtrToBindingKeyRec(rightOp);
        }

        if (rightOp instanceof ClosureFieldRef) {
            const baseType = rightOp.getBase().getType();
            if (!(baseType instanceof LexicalEnvType)) {
                return undefined;
            }
            const closures = baseType.getClosures();
            const fieldName = rightOp.getFieldName();
            let match: Local | undefined;
            let matchCount = 0;
            for (let i = 0; i < closures.length; i++) {
                if (closures[i].getName() === fieldName) {
                    match = closures[i];
                    matchCount++;
                }
            }
            if (matchCount !== 1 || !match) {
                return undefined;
            }
            return this.resolveFuncPtrToBindingKeyRec(match);
        }

        return undefined;
    }

    private toLogicalArgIndex(method: ArkMethod, rawParamIndex: number): number {
        const params = method.getParameters();
        let offset = 0;
        if (params && params.length > 0 && params[0].getType() instanceof LexicalEnvType) {
            offset = 1;
        }
        const logicalIndex = rawParamIndex - offset;
        if (logicalIndex < 0) {
            return -1;
        }
        return logicalIndex;
    }

    private encodeCallbackBindingKey(ownerFuncID: FuncID, logicalArgIndex: number): CallbackBindingKey {
        return ownerFuncID * CALLBACK_BINDING_ARG_STRIDE + logicalArgIndex;
    }

    private decodeOwnerFuncID(key: CallbackBindingKey): FuncID {
        return Math.floor(key / CALLBACK_BINDING_ARG_STRIDE);
    }

    private decodeLogicalArgIndex(key: CallbackBindingKey): number {
        return key % CALLBACK_BINDING_ARG_STRIDE;
    }

    private getOrCreateBindingState(ownerFuncID: FuncID, logicalArgIndex: number): CallbackBindingState {
        let states = this.callbackBindings.get(ownerFuncID);
        if (!states) {
            states = [];
            this.callbackBindings.set(ownerFuncID, states);
        }
        while (states.length <= logicalArgIndex) {
            states.push(undefined);
        }
        let state = states[logicalArgIndex];
        if (!state) {
            state = {
                targets: new Set<FuncID>(),
                subscribers: new Map<Stmt, FuncID>(),
                forwards: new Set<CallbackBindingKey>(),
                fieldForwards: new Set<CallbackFieldKey>(),
            };
            states[logicalArgIndex] = state;
        }
        return state;
    }

    private getCallbackFieldKey(fieldRef: ArkInstanceFieldRef): CallbackFieldKey {
        return fieldRef.getFieldSignature().toString();
    }

    private getOrCreateCallbackFieldState(fieldKey: CallbackFieldKey): CallbackFieldState {
        let state = this.callbackFieldBindings.get(fieldKey);
        if (!state) {
            state = {
                targets: new Set<FuncID>(),
                subscribers: new Map<Stmt, CallbackFieldSubscriber[]>(),
                bindingForwards: new Set<CallbackBindingKey>(),
            };
            this.callbackFieldBindings.set(fieldKey, state);
        }
        return state;
    }

    private linkCallbackField(source: CallbackBindingKey, fieldKey: CallbackFieldKey): void {
        const sourceState = this.getOrCreateBindingState(
            this.decodeOwnerFuncID(source),
            this.decodeLogicalArgIndex(source)
        );
        if (sourceState.fieldForwards.has(fieldKey)) {
            return;
        }
        sourceState.fieldForwards.add(fieldKey);
        for (const targetFuncID of sourceState.targets) {
            this.addCallbackFieldTarget(fieldKey, targetFuncID);
        }
    }

    private addCallbackFieldTarget(fieldKey: CallbackFieldKey, targetFuncID: FuncID): void {
        const state = this.getOrCreateCallbackFieldState(fieldKey);
        if (state.targets.has(targetFuncID)) {
            return;
        }
        state.targets.add(targetFuncID);
        for (const [stmt, subscriberList] of state.subscribers) {
            for (const sub of subscriberList) {
                this.emitCallbackEdge(sub.callerFuncID, targetFuncID, stmt, sub.argIndex);
            }
        }
        for (const bindingKey of state.bindingForwards) {
            this.addCallbackTarget(
                this.decodeOwnerFuncID(bindingKey),
                this.decodeLogicalArgIndex(bindingKey),
                targetFuncID
            );
        }
    }

    /**
     * Link a callback field to a callee parameter binding slot. When the field's
     * targets are populated later (e.g. field initializer processed after the
     * call site due to RTA workList ordering), targets propagate to the binding
     * slot via {@link addCallbackFieldTarget} → bindingForwards → addCallbackTarget.
     */
    private linkFieldToBinding(fieldKey: CallbackFieldKey, bindingKey: CallbackBindingKey): void {
        const fieldState = this.getOrCreateCallbackFieldState(fieldKey);
        if (fieldState.bindingForwards.has(bindingKey)) {
            return;
        }
        fieldState.bindingForwards.add(bindingKey);
        for (const targetFuncID of fieldState.targets) {
            this.addCallbackTarget(
                this.decodeOwnerFuncID(bindingKey),
                this.decodeLogicalArgIndex(bindingKey),
                targetFuncID
            );
        }
    }

    private subscribeAndCollectFieldTargets(
        fieldKey: CallbackFieldKey,
        invokeStmt: Stmt,
        callerMethod: NodeID,
        resolveResult: CallSite[],
        argIndex: number,
    ): void {
        const state = this.getOrCreateCallbackFieldState(fieldKey);
        if (!state.subscribers.has(invokeStmt)) {
            state.subscribers.set(invokeStmt, []);
        }
        const list = state.subscribers.get(invokeStmt)!;
        if (list.some(s => s.callerFuncID === callerMethod && s.argIndex === argIndex)) {
            return;
        }
        list.push({ callerFuncID: callerMethod, argIndex });
        for (const targetFuncID of state.targets) {
            this.appendCallbackCallSite(invokeStmt, callerMethod, targetFuncID, resolveResult, argIndex);
        }
    }

    private recordCallbackFieldStore(stmt: ArkAssignStmt, ownerMethod: ArkMethod): void {
        const leftOp = stmt.getLeftOp();
        if (!(leftOp instanceof ArkInstanceFieldRef)) {
            return;
        }
        if (!this.isCallbackType(leftOp.getType())) {
            return;
        }
        const fieldKey = this.getCallbackFieldKey(leftOp);
        const rightOp = stmt.getRightOp();
        const functionType = this.unwrapFunctionType(rightOp.getType());
        if (functionType) {
            const callbackMethod = this.scene.getMethod(functionType.getMethodSignature());
            if (callbackMethod && callbackMethod.getCfg()) {
                const targetFuncID = this.cg.getCallGraphNodeByMethod(callbackMethod.getSignature()).getID();
                this.addCallbackFieldTarget(fieldKey, targetFuncID);
            }
        }
        const sourceKey = this.resolveFuncPtrValueToBindingKey(rightOp, ownerMethod);
        if (sourceKey !== undefined) {
            this.linkCallbackField(sourceKey, fieldKey);
        }
    }

    /**
     * Link source parameter binding to a callee parameter slot and copy existing targets.
     * Future addCallbackTarget calls on the source also propagate through forwards.
     */
    private linkCallbackBinding(source: CallbackBindingKey, target: CallbackBindingKey): void {
        if (source === target) {
            return;
        }
        const sourceState = this.getOrCreateBindingState(
            this.decodeOwnerFuncID(source),
            this.decodeLogicalArgIndex(source)
        );
        sourceState.forwards.add(target);
        const targetOwnerFuncID = this.decodeOwnerFuncID(target);
        const targetLogicalArgIndex = this.decodeLogicalArgIndex(target);
        for (const targetFuncID of sourceState.targets) {
            this.addCallbackTarget(targetOwnerFuncID, targetLogicalArgIndex, targetFuncID);
        }
    }

    private addCallbackTarget(ownerFuncID: FuncID, logicalArgIndex: number, targetFuncID: FuncID): void {
        const state = this.getOrCreateBindingState(ownerFuncID, logicalArgIndex);
        if (state.targets.has(targetFuncID)) {
            return;
        }
        state.targets.add(targetFuncID);
        for (const [stmt, callerFuncID] of state.subscribers) {
            this.emitCallbackEdge(callerFuncID, targetFuncID, stmt, logicalArgIndex);
        }
        for (const forward of state.forwards) {
            this.addCallbackTarget(
                this.decodeOwnerFuncID(forward),
                this.decodeLogicalArgIndex(forward),
                targetFuncID
            );
        }
        for (const fieldKey of state.fieldForwards) {
            this.addCallbackFieldTarget(fieldKey, targetFuncID);
        }
    }

    /**
     * Create a CallbackCallSite, register it via CallSiteManager (for ID allocation
     * and getCallSiteById lookup) and via CallGraph maps (for getCallSiteByStmt and
     * getCallSitesByMethod lookup). The argIndex is set for callback virtual edges
     * and left undefined for regular (direct/virtual/constructor) call sites.
     */
    private newRTACallSite(
        invokeStmt: Stmt,
        callerFuncID: FuncID,
        calleeFuncID: FuncID,
        argIndex?: number,
    ): CallSite {
        const normalized = argIndex !== undefined && argIndex >= 0 ? argIndex : undefined;
        const base = this.cg.getCallSiteManager().newCallSite(invokeStmt, undefined, calleeFuncID, callerFuncID);
        const cs = new CallSite(base.id, base.callStmt, base.args, base.calleeFuncID, base.callerFuncID, normalized);
        this.cg.addStmtToCallSiteMap(invokeStmt, cs);
        this.cg.addMethodToCallSiteMap(calleeFuncID, cs);
        return cs;
    }

    private emitCallbackEdge(callerFuncID: FuncID, calleeFuncID: FuncID, callStmt: Stmt, argIndex: number): void {
        this.cg.addDynamicCallEdge(callerFuncID, calleeFuncID, callStmt);
        this.newRTACallSite(callStmt, callerFuncID, calleeFuncID, argIndex);

        const calleeNode = this.cg.getNode(calleeFuncID) as CallGraphNode | undefined;
        if (!calleeNode || calleeNode.isSdkMethod()) {
            return;
        }
        if (this.processedMethod.contains(calleeFuncID)) {
            return;
        }
        this.workList.push(calleeFuncID);
    }

    private getOrBuildVirtualDispatchRows(declareClass: ArkClass, methodName: string): VirtualDispatchRows {
        const declareSig = declareClass.getSignature();
        let methodIndex = this.virtualDispatchIndex.get(declareSig);
        if (!methodIndex) {
            methodIndex = new Map<string, VirtualDispatchRows>();
            this.virtualDispatchIndex.set(declareSig, methodIndex);
        }

        const cachedRows = methodIndex.get(methodName);
        if (cachedRows) {
            return cachedRows;
        }

        const rows: VirtualDispatchRows = {
            classSignatures: [],
            calleeNodeIDs: [],
            isUnconditionallyReachable: [],
        };

        for (const arkClass of this.getClassHierarchy(declareClass)) {
            const possibleCalleeMethod = arkClass.getMethodWithName(methodName);
            if (!possibleCalleeMethod) {
                continue;
            }

            const classSignature = arkClass.getSignature();
            if (possibleCalleeMethod.isGenerated() && classSignature !== declareSig) {
                continue;
            }

            if (possibleCalleeMethod.isAbstract()) {
                continue;
            }

            const calleeNodeID = this.cg.getCallGraphNodeByMethod(possibleCalleeMethod.getSignature()).getID();
            rows.classSignatures.push(classSignature);
            rows.calleeNodeIDs.push(calleeNodeID);
            // OH SDK declare targets, and invoking built-ins (Promise.then / Array.forEach /
            // ...), need no local `new` to be callable. Container non-invoking APIs still require
            // instancedClasses (e.g. newarray → Array) so push/indexOf/set are not always-on.
            rows.isUnconditionallyReachable.push(
                classSignature === declareSig && this.shouldSynthesizeVirtualCallback(calleeNodeID)
            );
        }

        methodIndex.set(methodName, rows);
        return rows;
    }

    private tryResolveAggressiveThisPruneCall(
        invokeStmt: Stmt,
        methodName: string,
        callerMethod: NodeID
    ): CallSite | null {
        const invokeExpr = invokeStmt.getInvokeExpr();
        if (!this.enableThisPrune || !(invokeExpr instanceof ArkInstanceInvokeExpr)) {
            return null;
        }

        const base = invokeExpr.getBase();
        if (!base.getName || base.getName() !== THIS_NAME) {
            return null;
        }

        // Start from the declaring class of this call site, then walk up the super chain.
        // Pick the first non-abstract implementation of `methodName`.
        let curClass: ArkClass | null = invokeStmt.getCfg().getDeclaringMethod().getDeclaringArkClass();
        while (curClass) {
            const methodInClass = curClass.getMethodWithName(methodName);
            if (methodInClass && !methodInClass.isAbstract()) {
                return this.newRTACallSite(
                    invokeStmt,
                    callerMethod,
                    this.cg.getCallGraphNodeByMethod(methodInClass.getSignature()).getID()
                );
            }
            curClass = curClass.getSuperClass();
        }

        return null;
    }

    private resolveConstructorClassFromNew(methodName: string, invokeStmt: Stmt, callerMethod: NodeID): CallSite | null {
        if (methodName !== CONSTRUCTOR_NAME) {
            return null;
        }

        if (!(invokeStmt instanceof ArkAssignStmt)) {
            return null;
        }

        const leftOp = invokeStmt.getLeftOp();
        if (!(leftOp instanceof Local)) {
            return null;
        }

        const declaringStmt = leftOp.getDeclaringStmt();
        if (!(declaringStmt && declaringStmt instanceof ArkAssignStmt)) {
            return null;
        }

        const rightOp = declaringStmt.getRightOp();
        if (!(rightOp instanceof ArkNewExpr)) {
            return null;
        }

        const classSig = rightOp.getClassType().getClassSignature();
        const constructorMethod = this.scene.getClass(classSig)?.getMethodWithName(CONSTRUCTOR_NAME);
        if (!constructorMethod) {
            return null;
        }
        return this.newRTACallSite(
            invokeStmt,
            callerMethod,
            this.cg.getCallGraphNodeByMethod(constructorMethod.getSignature()).getID()
        );
    }

    protected preProcessMethod(funcID: FuncID): CallSite[] {
        const newCallSites: CallSite[] = [];
        const instancedInMethod = this.collectInstancedClassesInMethod(funcID);
        instancedInMethod.forEach((sig: ClassSignature): void => {
            if (this.instancedClasses.has(sig)) {
                return;
            }
            const ignoredCalls = this.ignoredCalls.get(sig);
            if (ignoredCalls) {
                ignoredCalls.forEach((call: IgnoredCall): void => {
                    this.cg.addDynamicCallEdge(call.caller, call.callee, call.callStmt);
                    const newCallSite = this.newRTACallSite(call.callStmt, call.caller, call.callee);
                    newCallSites.push(newCallSite);
                });
            }
            this.instancedClasses.add(sig);
            this.ignoredCalls.delete(sig);
        });
        return newCallSites;
    }

    private collectInstancedClassesInMethod(funcID: FuncID): Set<ClassSignature> {
        let instancedClasses: Set<ClassSignature> = new Set();
        let arkMethod = this.cg.getArkMethodByFuncID(funcID);

        if (!arkMethod) {
            logger.error(`can not find arkMethod by funcID`);
            return instancedClasses;
        }

        let cfg = arkMethod!.getCfg();
        if (!cfg) {
            return instancedClasses;
        }

        for (let stmt of cfg!.getStmts()) {
            if (!(stmt instanceof ArkAssignStmt)) {
                continue;
            }
            const rightOp = stmt.getRightOp();
            this.recordCallbackFieldStore(stmt, arkMethod);
            if (rightOp instanceof ArkNewExpr) {
                const classSig: ClassSignature = (rightOp.getType() as ClassType).getClassSignature();
                if (classSig !== null && classSig !== undefined) {
                    // TODO: need to check if different stmt has single sig
                    instancedClasses.add(classSig);
                }
                continue;
            }
            // `handlers = []` lowers to newarray, not `new Array`. Treat it as Array instantiation
            // so built-in Array methods (e.g. push) can pass the RTA instancedClasses gate.
            if (rightOp instanceof ArkNewArrayExpr) {
                const arraySig = this.getBuiltinArrayClassSignature();
                if (arraySig) {
                    instancedClasses.add(arraySig);
                }
            }
        }
        return instancedClasses;
    }

    private getBuiltinArrayClassSignature(): ClassSignature | undefined {
        if (this.builtinArrayClassResolved) {
            return this.builtinArrayClassSignature;
        }
        this.builtinArrayClassResolved = true;
        // Built-in Array is not in scene.getClasses(); use the SDK global export
        // (lib.es5 Array) so the signature matches virtual-dispatch declareClass.
        const globalArray = this.scene.getSdkGlobal(BUILTIN_ARRAY_CLASS_NAME);
        if (globalArray instanceof ArkClass) {
            const classSig = globalArray.getSignature();
            if (classSig.getDeclaringFileSignature().getProjectName() === SdkUtils.BUILT_IN_NAME) {
                this.builtinArrayClassSignature = classSig;
            }
        }
        return this.builtinArrayClassSignature;
    }

    public addIgnoredCalls(arkClass: ClassSignature, callerID: FuncID, calleeID: FuncID, invokeStmt: Stmt): void {
        let classMap = this.ignoredCalls.get(arkClass);
        if (!classMap) {
            classMap = new Set();
            this.ignoredCalls.set(arkClass, classMap);
        }
        for (const existing of classMap) {
            if (
                existing.caller === callerID &&
                existing.callee === calleeID &&
                existing.callStmt === invokeStmt
            ) {
                return;
            }
        }
        classMap.add({ caller: callerID, callee: calleeID, callStmt: invokeStmt });
    }
}
