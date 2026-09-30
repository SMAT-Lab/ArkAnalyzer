/*
 * Copyright (c) 2024-2026 Huawei Device Co., Ltd.
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

import { ModifierType } from '../model/ArkBaseModel';
import { ArkFile } from '../model/ArkFile';
import { ArkAssignStmt, ArkInvokeStmt, ArkReturnStmt, Stmt } from '../base/Stmt';
import { Value } from '../base/Value';
import { ArkModel, Inference, InferenceFlow, InferenceManager } from './Inference';
import Logger, { LOG_MODULE_TYPE } from '../../utils/logger';
import { ExportInfo } from '../model/ArkExport';
import { ImportInfo } from '../model/ArkImport';
import { NamespaceSignature } from '../model/ArkSignature';
import { findArkExport, findExportInfoInfile, ModelUtils } from '../common/ModelUtils';
import { ArkMethod } from '../model/ArkMethod';
import { ClassType, FunctionType, GenericType, NullType, Type, UndefinedType, VoidType } from '../base/Type';
import { TypeInference } from '../common/TypeInference';
import { AbstractFieldRef, ArkParameterRef, ArkStaticFieldRef, GlobalRef } from '../base/Ref';
import { CONSTRUCTOR_NAME, GLOBAL_THIS_NAME, PROMISE } from '../common/TSConst';
import { SdkUtils } from '../common/SdkUtils';
import { IRInference } from '../common/IRInference';
import { Local } from '../base/Local';
import { GETTER_PREFIX, LEXICAL_ENV_NAME_PREFIX, NAME_PREFIX, SETTER_PREFIX } from '../common/Const';
import { ArkClass } from '../model/ArkClass';
import { ValueInference } from './ValueInference';
import { AbstractTypeExpr } from '../base/TypeExpr';
import { AbstractInvokeExpr } from '../base/Expr';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'ModelInference');

interface ValueVisited {
    has(value: Value): boolean;
    add(value: Value): void;
}

class ArrayValueVisited implements ValueVisited {
    private readonly items: Value[] = [];
    private base = 0;
    private top = 0;

    public enter(): number {
        const prev = this.base;
        this.base = this.top;
        return prev;
    }

    public has(value: Value): boolean {
        for (let i = this.base; i < this.top; i++) {
            if (this.items[i] === value) {
                return true;
            }
        }
        return false;
    }

    public add(value: Value): void {
        this.items[this.top++] = value;
    }

    public leave(prevBase: number): void {
        const nullValue = null as unknown as Value;
        for (let i = this.base; i < this.top; i++) {
            this.items[i] = nullValue;
        }
        this.top = this.base;
        this.base = prevBase;
    }
}

const valueVisitedSeg = new ArrayValueVisited();
const GLOBAL_MERGE_SET_PRODUCT_LIMIT = 131072;

/**
 * Snapshot-semantics merge of `incoming` into the global's used-stmt list: membership is
 * checked against the entries present at call start (duplicates inside `incoming` are all
 * appended, exactly like the former `new Set(global.getUsedStmts())` snapshot did).
 *
 * The linear scan is the only path in practice: a pointer compare is ~0.5ns versus ~50ns
 * per Set hash operation, so scanning wins for any incoming count below ~50 regardless of
 * the snapshot size - and incoming is one body's references to one global (typically 1-3).
 * The Set fallback only guards the pathological product (a huge snapshot merged with a huge
 * incoming list in one call), where the quadratic tail would reach milliseconds.
 */
function mergeGlobalUsedStmts(global: Local, incoming: Stmt[]): void {
    const snapshot = global.getUsedStmts();
    const boundary = snapshot.length;
    if (boundary * incoming.length > GLOBAL_MERGE_SET_PRODUCT_LIMIT) {
        const set = new Set<Stmt>();
        for (let i = 0; i < boundary; i++) {
            set.add(snapshot[i]);
        }
        for (const stmt of incoming) {
            if (!set.has(stmt)) {
                global.addUsedStmt(stmt);
            }
        }
        return;
    }
    for (const stmt of incoming) {
        let found = false;
        for (let i = 0; i < boundary; i++) {
            if (snapshot[i] === stmt) {
                found = true;
                break;
            }
        }
        if (!found) {
            global.addUsedStmt(stmt);
        }
    }
}

/**
 * Abstract base class for performing inference on ArkModel instances
 * Implements both Inference and InferenceFlow interfaces to provide
 * a complete inference workflow with pre/post processing capabilities
 */
abstract class ArkModelInference implements Inference, InferenceFlow {
    /**
     * Performs the core inference operation on the provided model
     * @abstract
     * @param model - The ArkModel instance to perform inference on
     * @returns Inference result
     */
    public abstract infer(model: ArkModel): any;

    /**
     * Executes the complete inference workflow with error handling
     * @param model - The ArkModel instance to process
     * @returns Inference result or undefined if an error occurs
     */
    public doInfer(model: ArkModel): any {
        try {
            this.preInfer(model);
            const result = this.infer(model);
            return this.postInfer(model, result);
        } catch (error) {
            logger.warn('infer model failed:' + (error as Error).message);
        }
        return undefined;
    }

    /**
     * Pre-inference hook method for setup and preparation
     * Can be overridden by subclasses to add custom pre-processing logic
     * @param model - The ArkModel instance being processed
     */
    public preInfer(model: ArkModel): void {}

    /**
     * Post-inference hook method for cleanup and finalization
     * Can be overridden by subclasses to add custom post-processing logic
     * @param model - The ArkModel instance that was processed
     * @param result
     */
    public postInfer(model: ArkModel, result?: any): any {}
}

export abstract class ImportInfoInference extends ArkModelInference {
    protected fromFile: ArkFile | null = null;

    /**
     * get arkFile and assign to from file
     * @param fromInfo
     */
    public abstract preInfer(fromInfo: ImportInfo): void;

    /**
     * find export from file
     * @param fromInfo
     */
    public infer(fromInfo: ImportInfo): ExportInfo | null {
        const file = this.fromFile;
        if (!file) {
            if (Logger.isWarnEnabled(logger)) {
                const signature = fromInfo.getDeclaringArkFile()?.getFileSignature()?.toString();
                logger.warn(`${fromInfo.getOriginName()} ${fromInfo.getFrom()} file not found: ${signature}`);
            }
            return null;
        }
        if (file.getFileSigID() === fromInfo.getDeclaringArkFile().getFileSigID()) {
            for (let exportInfo of file.getExportInfos()) {
                if (exportInfo.getOriginName() === fromInfo.getOriginName()) {
                    exportInfo.setArkExport(file.getDefaultClass());
                    return exportInfo;
                }
            }
            return null;
        }
        let exportInfo = findExportInfoInfile(fromInfo, file) || null;
        if (exportInfo === null) {
            if (Logger.isWarnEnabled(logger)) {
                logger.warn('export info not found, ' + fromInfo.getFrom() + ' in file: ' + fromInfo.getDeclaringArkFile().getFileSignature().toString());
            }
            return null;
        }
        const arkExport = findArkExport(exportInfo);
        exportInfo.setArkExport(arkExport);
        if (arkExport) {
            exportInfo.setExportClauseType(arkExport.getExportType());
        }
        return exportInfo;
    }

    /**
     * cleanup fromFile and set exportInfo
     * @param fromInfo
     * @param exportInfo
     */
    public postInfer(fromInfo: ImportInfo, exportInfo: ExportInfo | null): void {
        if (exportInfo) {
            fromInfo.setExportInfo(exportInfo);
        }
        this.fromFile = null;
    }
}

export class FileInference extends ArkModelInference {
    protected importInfoInference: ImportInfoInference;
    private classInference: ClassInference;

    constructor(importInfoInference: ImportInfoInference, classInference: ClassInference) {
        super();
        this.importInfoInference = importInfoInference;
        this.classInference = classInference;
    }

    public getClassInference(): ClassInference {
        return this.classInference;
    }

    /**
     * Pre-inference phase - processes unresolved import information in the file
     * @param {ArkFile} file
     */
    public preInfer(file: ArkFile): void {
        file.getImportInfos()
            .filter(i => i.getExportInfo() === undefined)
            .forEach(info => this.importInfoInference.doInfer(info));
    }

    /**
     * Main inference phase - processes all arkClass definitions in the file
     * @param {ArkFile} file
     */
    public infer(file: ArkFile): void {
        ModelUtils.getAllClassesInFile(file).forEach(arkClass => this.classInference.doInfer(arkClass));
    }

    /**
     * Post-inference phase - processes export information for the file
     * @param {ArkFile} file
     */
    public postInfer(file: ArkFile): void {
        IRInference.inferExportInfos(file);
    }
}

export class ClassInference extends ArkModelInference {
    private methodInference: MethodInference;

    constructor(methodInference: MethodInference) {
        super();
        this.methodInference = methodInference;
    }

    public getMethodInference(): MethodInference {
        return this.methodInference;
    }

    /**
     * Pre-inference phase - processes heritage class information for the class
     * @param {ArkClass} arkClass
     */
    public preInfer(arkClass: ArkClass): void {
        arkClass.getAllHeritageClasses();
    }

    /**
     * Main inference phase - processes all methods in the class
     * @param {ArkClass} arkClass
     */
    public infer(arkClass: ArkClass): void {
        arkClass.forEachMethod(method => {
            this.methodInference.doInfer(method);
            return true;
        }, true);
    }
}

interface InferStmtResult {
    oldStmt: Stmt;
    replacedStmts?: Stmt[];
    impactedStmts?: Stmt[];
}

/**
 * Shared no-change result. postInfer must keep returning a truthy object even when nothing
 * changed (a falsy result makes the worklist consumer skip the entry), so the common
 * unchanged-stmt case returns this singleton instead of a fresh three-field literal per
 * statement per round. Consumers only read replacedStmts/impactedStmts (both undefined here)
 * and never reach oldStmt on this path; the object is never mutated or retained.
 */
const EMPTY_INFER_STMT_RESULT: InferStmtResult = {
    oldStmt: undefined as unknown as Stmt,
    replacedStmts: undefined,
    impactedStmts: undefined,
};

export class MethodInference extends ArkModelInference {
    private stmtInference: StmtInference;

    /** Set to track visited methods for cycle prevention when infer a callback function */
    private callBackVisited: Set<ArkMethod> | undefined;

    private static TIMEOUT_MS = 3000;

    constructor(stmtInference: StmtInference) {
        super();
        this.stmtInference = stmtInference;
    }

    /**
     * Marks a method as visited to prevent infinite recursion
     * @param {ArkMethod} method - The method to mark as visited
     */
    public markVisited(method: ArkMethod): void {
        if (!this.callBackVisited) {
            this.callBackVisited = new Set<ArkMethod>();
        }
        this.callBackVisited.add(method);
    }

    /**
     * Clears the visited methods set
     */
    public cleanVisited(): void {
        this.callBackVisited = undefined;
    }

    /**
     * Main inference phase - processes all statements in the method body
     * @param {ArkMethod} method - The method to analyze
     * @returns {InferStmtResult[]} Array of modified or impacted statements during inference
     */
    public infer(method: ArkMethod): InferStmtResult[] {
        const modifiedStmts: InferStmtResult[] = [];
        // timeout
        const startTime = Date.now();
        // Check for cycle prevention
        if (this.callBackVisited) {
            if (this.callBackVisited.has(method)) {
                return modifiedStmts;
            } else {
                this.callBackVisited.add(method);
            }
        }
        const body = method.getBody();
        if (!body) {
            return modifiedStmts;
        }
        // Process used globals
        const usedGlobals = body.getUsedGlobals();
        if (usedGlobals) {
            for (const key of usedGlobals.keys()) {
                const value = usedGlobals.get(key);
                if (value instanceof GlobalRef && !value.getRef()) {
                    const global = ModelUtils.findGlobalRef(key, method);
                    if (global instanceof Local) {
                        mergeGlobalUsedStmts(global, value.getUsedStmts());
                        value.setRef(global);
                    }
                }
            }
        }

        const workList: Stmt[] = [];
        for (const block of body.getCfg().getBlocks()) {
            const blockStmts = block.getStmts();
            for (let i = 0; i < blockStmts.length; i++) {
                workList.push(blockStmts[i]);
            }
        }
        let nextIdx = 0;
        while (nextIdx < workList.length) {
            const stmt = workList[nextIdx];
            if (Date.now() - startTime > MethodInference.TIMEOUT_MS) {
                logger.error(`Inference timeout for method: ${method.getName()}`);
                return modifiedStmts;
            }
            const result = this.stmtInference.doInfer(stmt);
            if (!result) {
                nextIdx++;
                continue;
            }
            const inferResult = result as InferStmtResult;
            // collect modified Stmts to update CFG
            if (inferResult.replacedStmts) {
                modifiedStmts.push(inferResult);
            }
            // Add impacted statements to work list
            const impactedStmts = inferResult.impactedStmts;
            if (impactedStmts) {
                for (const s of impactedStmts) {
                    if (!workList.includes(s)) {
                        workList.push(s);
                    }
                }
            }
            workList.splice(nextIdx, 1);
        }
        return modifiedStmts;
    }

    /**
     * Post-inference phase - updates CFG and infers return type
     * @param {ArkMethod} method - The method that was analyzed
     * @param {InferStmtResult[]} modifiedStmts - Modified statements from inference phase
     */
    public postInfer(method: ArkMethod, modifiedStmts: InferStmtResult[]): void {
        // Update CFG
        const cfg = method.getCfg();
        if (modifiedStmts.length > 0 && cfg) {
            modifiedStmts.forEach(m => {
                cfg.insertAfter(m.replacedStmts!, m.oldStmt);
                cfg.remove(m.oldStmt);
            });
        }
        //infers return type
        if (!method.getBody() || method.getName() === CONSTRUCTOR_NAME || method.getAsteriskToken()) {
            return;
        }
        const rt = method.getImplementationSignature()?.getMethodSubSignature().getReturnType();
        if (!TypeInference.isUnclearType(rt) || rt instanceof GenericType) {
            return;
        }
        const returnType = TypeInference.inferReturnType(method);
        if (returnType) {
            method.getImplementationSignature()?.getMethodSubSignature().setReturnType(returnType);
        }
    }
}

export class StmtInference extends ArkModelInference {
    private readonly defAndUsesScratch: Value[] = [null as unknown as Value];
    private readonly usesPool: Value[][] = [];

    private valueInferences: Map<string, ValueInference<Value>>;

    private valueInferencesByCtor = new Map<Function, ValueInference<Value> | null>();

    constructor(valueInferences: ValueInference<Value>[]) {
        super();
        this.valueInferences = new Map();
        valueInferences.forEach(v => this.valueInferences.set(v.getValueName(), v));
    }

    /**
     * Main inference phase - processes a statement and its associated values
     * @param {Stmt} stmt - The statement to analyze
     * @returns {Type | undefined} The original definition type before inference
     */
    public infer(stmt: Stmt): Type | undefined {
        const defType = stmt.getDef()?.getType();
        const values = this.defAndUsesScratch;
        while (values.length > 1) {
            values.pop();
        }
        stmt.getDefAndUses(values);
        for (let i = 1; i < values.length; i++) {
            this.inferValue(values[i], stmt);
        }
        return defType;
    }

    /**
     * Post-inference phase - handles type propagation and impact analysis
     * @param {Stmt} stmt - The statement that was analyzed
     * @param {Type | undefined} defType - The original definition type before inference
     * @returns {InferStmtResult | undefined} Inference result with impacted statements
     */
    public postInfer(stmt: Stmt, defType: Type | undefined): InferStmtResult | undefined {
        const method = stmt.getCfg().getDeclaringMethod();
        let replacedStmts: Stmt[] | undefined;
        let impactedStmts: Stmt[] | undefined;
        if (stmt instanceof ArkAssignStmt && stmt.getLeftOp() instanceof AbstractInvokeExpr) {
            const invokeExpr = stmt.getLeftOp() as AbstractInvokeExpr;
            const cls = method.getDeclaringArkFile().getScene().getClass(invokeExpr.getMethodSignature().getDeclaringClassSignature());
            const name = invokeExpr.getMethodSignature().getMethodSubSignature().getMethodName().replace(GETTER_PREFIX, SETTER_PREFIX);
            const invokeMethod = cls?.getMethodWithName(name) ?? cls?.getStaticMethodWithName(name);
            if (invokeMethod) {
                invokeExpr.setMethodSignature(invokeMethod.getSignature());
            }
            invokeExpr.setArgs([stmt.getRightOp()]);
            const invokeStmt = new ArkInvokeStmt(invokeExpr);
            const originFullPosition = stmt.getOriginFullPosition();
            if (originFullPosition) {
                invokeStmt.setOriginFullPosition(originFullPosition);
            }
            invokeStmt.setOperandOriginalPositions(stmt.getOperandOriginalPositions() ?? []);
            invokeStmt.setCfg(stmt.getCfg());
            if (stmt.getOriginFullPosition()) {
                invokeStmt.setOriginFullPosition(stmt.getOriginFullPosition()!);
            }
            invokeStmt.metadata = stmt.metadata;
            replacedStmts = [invokeStmt];
        } else {
            impactedStmts = this.typeSpread(stmt, method);
        }
        const finalDef = stmt.getDef();
        if (
            defType !== finalDef?.getType() &&
            finalDef instanceof Local &&
            (method.getBody()?.getUsedGlobals()?.get(finalDef.getName()) || !finalDef.getName().startsWith(NAME_PREFIX))
        ) {
            impactedStmts = this.mergeImpactedStmts(impactedStmts, finalDef.getUsedStmts());
        }
        if (impactedStmts === undefined && replacedStmts === undefined) {
            return EMPTY_INFER_STMT_RESULT;
        }
        return {
            oldStmt: stmt,
            impactedStmts: impactedStmts,
            replacedStmts: replacedStmts,
        };
    }

    /**
     * Recursively infers types for values and their dependencies
     * @param {Value} value - The value to infer
     * @param {Stmt} stmt - The containing statement
     * @param {Set<Value>} visited - Set of already visited values for cycle prevention
     */
    private inferValue(value: Value, stmt: Stmt, visited?: ValueVisited, depth: number = 0): void {
        if (visited !== undefined) {
            if (visited.has(value)) {
                return;
            }
            visited.add(value);
        }
        const ctor = value.constructor;
        let valueInference = this.valueInferencesByCtor.get(ctor);
        if (valueInference === undefined) {
            valueInference = this.valueInferences.get(ctor.name) ?? null;
            this.valueInferencesByCtor.set(ctor, valueInference);
        }
        if (valueInference === null) {
            if (Logger.isDebugEnabled(logger)) {
                logger.debug(ctor.name + ' valueInference not found');
            }
            return;
        }
        const type = value.getType();
        const owned = visited === undefined;
        let childVisited = visited;
        let prevBase = 0;
        if (owned) {
            prevBase = valueVisitedSeg.enter();
            childVisited = valueVisitedSeg;
        }
        try {
            if (type instanceof AbstractTypeExpr) {
                this.inferSubValues(value, type.getUses(this.acquireUses(depth)), stmt, childVisited!, depth);
            }
            this.inferSubValues(value, value.getUses(this.acquireUses(depth)), stmt, childVisited!, depth);
        } finally {
            if (owned) {
                valueVisitedSeg.leave(prevBase);
            }
        }
        valueInference.doInfer(value, stmt);
    }

    private inferSubValues(parent: Value, subValues: Value[], stmt: Stmt, visited: ValueVisited, depth: number): void {
        const pooled = subValues === this.usesPool[depth];
        if (subValues.length === 0 || (pooled && subValues.length === 1)) {
            return;
        }
        visited.add(parent);
        const start = pooled ? 1 : 0;
        for (let i = start; i < subValues.length; i++) {
            this.inferValue(subValues[i], stmt, visited, depth + 1);
        }
    }

    /**
     * Per-depth pooled acc for the no-arg getUses default parameter: the default `acc = []`
     * allocated (and push-grew) a fresh array on every inferValue visit. A plain shared
     * scratch would be reset by nested inferValue calls while inferSubValues is still
     * iterating it, so each recursion depth owns a slot. The slot keeps a sentinel at index 0
     * and resets by pop (truncating to 0 would drop the V8 backing store); iteration skips
     * the sentinel via the identity check in inferSubValues.
     */
    private acquireUses(depth: number): Value[] {
        let arr = this.usesPool[depth];
        if (arr === undefined) {
            arr = [null as unknown as Value];
            this.usesPool[depth] = arr;
        }
        while (arr.length > 1) {
            arr.pop();
        }
        return arr;
    }

    /**
     * Propagates types through statements and handles special cases
     * @param {Stmt} stmt - The statement to process
     * @param {ArkMethod} method - The containing method
     * @returns {Stmt[] | undefined} Statements impacted by type propagation, if any
     */
    public typeSpread(stmt: Stmt, method: ArkMethod): Stmt[] | undefined {
        let impactedStmts: Stmt[] | undefined;
        const invokeExpr = stmt.getInvokeExpr();
        // Handle method invocation parameter spreading
        if (invokeExpr) {
            impactedStmts = this.paramSpread(invokeExpr, method);
        }
        if (stmt instanceof ArkAssignStmt) {
            impactedStmts = this.transferTypeBidirectional(stmt, method, impactedStmts);
        } else if (stmt instanceof ArkReturnStmt) {
            // Handle return statements with async type resolution
            let returnType = method.getSignature().getType();
            if (method.containsModifier(ModifierType.ASYNC) && returnType instanceof ClassType && returnType.getClassSignature().getClassName() === PROMISE) {
                const realGenericType = returnType.getRealGenericTypes()?.[0];
                if (realGenericType) {
                    returnType = realGenericType;
                }
            }
            IRInference.inferRightWithSdkType(returnType, stmt.getOp().getType(), method.getDeclaringArkClass());
        }

        return impactedStmts;
    }

    private mergeImpactedStmts(target: Stmt[] | undefined, items: Stmt[] | undefined): Stmt[] | undefined {
        if (items === undefined || items.length === 0) {
            return target;
        }
        if (target === undefined) {
            target = [];
        }
        for (const item of items) {
            if (!target.includes(item)) {
                target.push(item);
            }
        }
        return target;
    }

    /**
     * Transfers types bidirectionally in assignment statements
     * @param {ArkAssignStmt} stmt - The assignment statement
     * @param {ArkMethod} method - The containing method
     * @param {Stmt[] | undefined} impactedStmts - Statements collected so far, if any
     */
    private transferTypeBidirectional(stmt: ArkAssignStmt, method: ArkMethod, impactedStmts: Stmt[] | undefined): Stmt[] | undefined {
        const rightType = stmt.getRightOp().getType();
        const leftOp = stmt.getLeftOp();
        let leftType = leftOp.getType();
        // Transfer type from left to right operand
        impactedStmts = this.mergeImpactedStmts(impactedStmts, this.transferLeft2Right(stmt.getRightOp(), leftType, method));
        // Transfer type from right to left operand
        impactedStmts = this.mergeImpactedStmts(impactedStmts, this.transferRight2Left(leftOp, rightType, method));
        // Handle global this references
        if (leftOp instanceof ArkStaticFieldRef) {
            const declaringSignature = leftOp.getFieldSignature().getDeclaringSignature();
            if (declaringSignature instanceof NamespaceSignature && declaringSignature.getNamespaceName() === GLOBAL_THIS_NAME) {
                SdkUtils.computeGlobalThis(leftOp, method);
            }
        }
        return impactedStmts;
    }

    public transferLeft2Right(rightOp: Value, leftType: Type, method: ArkMethod): Stmt[] | undefined {
        const projectName = method.getDeclaringArkFile().getProjectName();
        // Skip if left type is unclear or anonymous
        if (TypeInference.isUnclearType(leftType) || TypeInference.isAnonType(leftType, projectName)) {
            return undefined;
        }
        const rightType = rightOp.getType();
        IRInference.inferRightWithSdkType(leftType, rightType, method.getDeclaringArkClass());
        return this.updateValueType(rightOp, leftType, method);
    }

    public transferRight2Left(leftOp: Value, rightType: Type, method: ArkMethod): Stmt[] | undefined {
        if (TypeInference.isUnclearType(rightType) || rightType instanceof UndefinedType || rightType instanceof NullType) {
            return undefined;
        }
        return this.updateValueType(leftOp, rightType, method);
    }

    /**
     * Updates the type of a target value and returns impacted statements
     * @param {Value} target - The target value to update
     * @param {Type} srcType - The source type to apply
     * @param {ArkMethod} method - The containing method
     * @returns {Stmt[] | undefined} Array of statements impacted by the type update
     */
    public updateValueType(target: Value, srcType: Type, method: ArkMethod): Stmt[] | undefined {
        const type = target.getType();
        if (type !== srcType && (TypeInference.isUnclearType(type) || type instanceof UndefinedType || type instanceof NullType)) {
            if (target instanceof Local) {
                target.setType(srcType);
                return target.getUsedStmts();
            } else if (target instanceof AbstractFieldRef) {
                target.getFieldSignature().setType(srcType);
            } else if (target instanceof ArkParameterRef) {
                target.setType(srcType);
            }
        }
        return undefined;
    }

    /**
     * Handles parameter type propagation for method invocations
     * @param {AbstractInvokeExpr} invokeExpr - The invocation expression
     * @param {ArkMethod} method - The containing method
     * @returns {Set<Stmt>} Set of statements impacted by parameter type propagation
     */
    private paramSpread(invokeExpr: AbstractInvokeExpr, method: ArkMethod): Stmt[] | undefined {
        const realTypes: Type[] = [];
        let result: Stmt[] | undefined;
        const len = invokeExpr.getArgs().length;
        const declaredParameters = invokeExpr.getMethodSignature().getMethodSubSignature().getParameters();
        let parameters = declaredParameters;
        for (let i = 0; i < declaredParameters.length; i++) {
            if (declaredParameters[i].getName().startsWith(LEXICAL_ENV_NAME_PREFIX)) {
                parameters = declaredParameters.filter(p => !p.getName().startsWith(LEXICAL_ENV_NAME_PREFIX));
                break;
            }
        }
        // Map arguments to parameters
        for (let index = 0; index < len; index++) {
            const arg = invokeExpr.getArg(index);
            if (index >= parameters.length) {
                break;
            }
            const paramType = parameters[index].getType();
            result = this.mergeImpactedStmts(result, this.mapArgWithParam(arg, paramType, invokeExpr, method, realTypes));
        }
        // Set real generic types for the invocation
        if (realTypes.length > 0 && !invokeExpr.getRealGenericTypes()) {
            invokeExpr.setRealGenericTypes(realTypes);
        }
        return result;
    }

    /**
     * Maps argument types to parameter types and handles callback inference
     */
    private mapArgWithParam(arg: Value, paramType: Type, invokeExpr: AbstractInvokeExpr, method: ArkMethod, realTypes: Type[]): Stmt[] | undefined {
        const argType = arg.getType();
        const scene = method.getDeclaringArkFile().getScene();
        // Infer argument with parameter type
        IRInference.inferArg(invokeExpr, argType, paramType, scene, realTypes);
        // Handle callback function inference
        if (argType instanceof FunctionType) {
            const callback = scene.getMethod(argType.getMethodSignature());
            const paramLength = callback?.getImplementationSignature()?.getParamLength();
            // Infer callback method if it has parameters
            if (callback && paramLength && paramLength > 0) {
                const inference = InferenceManager.getInstance().getInference(callback.getDeclaringArkFile().getLanguage());
                if (inference instanceof FileInference) {
                    const methodInference = inference.getClassInference().getMethodInference();
                    methodInference.markVisited(method);
                    methodInference.doInfer(callback);
                    methodInference.cleanVisited();
                }
            }
            // Infer map function return type for generic resolution
            const returnType = argType.getMethodSignature().getMethodSubSignature().getReturnType();
            if (!TypeInference.isUnclearType(returnType) && !(returnType instanceof VoidType) && paramType instanceof FunctionType) {
                const declareReturnType = paramType.getMethodSignature().getMethodSubSignature().getReturnType();
                const realGenericTypes = invokeExpr.getRealGenericTypes();
                if (declareReturnType instanceof GenericType && realGenericTypes && !realGenericTypes[declareReturnType.getIndex()]) {
                    realGenericTypes[declareReturnType.getIndex()] = returnType;
                }
            }
        }
        // Update argument type if parameter type is clear
        if (!TypeInference.isUnclearType(paramType) && !TypeInference.isAnonType(paramType, scene.getProjectName())) {
            return this.updateValueType(arg, paramType, method);
        }
        return undefined;
    }
}
