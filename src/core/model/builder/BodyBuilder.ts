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

import { ArkBody } from '../ArkBody';
import { ArkMethod } from '../ArkMethod';
import { FieldSignature, MethodSignature, methodSignatureCompare, MethodSubSignature } from '../ArkSignature';
import { CfgBuilder } from '../../graph/builder/CfgBuilder';
import * as ts from 'ohos-typescript';
import { Local } from '../../base/Local';
import { MethodParameter } from './ArkMethodBuilder';
import { LEXICAL_ENV_NAME_PREFIX, NAME_DELIMITER, NAME_PREFIX } from '../../common/Const';
import { ArkParameterRef, ArkStaticFieldRef, ClosureFieldRef, GlobalRef } from '../../base/Ref';
import { ArkAliasTypeDefineStmt, ArkAssignStmt, ArkInvokeStmt, ArkReturnStmt } from '../../base/Stmt';
import { AliasType, ArrayType, ClosureType, FunctionType, LexicalEnvType, Type, UnclearReferenceType, UnionType } from '../../base/Type';
import { AbstractInvokeExpr, ArkPtrInvokeExpr } from '../../base/Expr';

type NestedMethodChain = {
    parent: ArkMethod;
    children: NestedMethodChain[] | null;
};

export class BodyBuilder {
    private cfgBuilder: CfgBuilder;
    private globals?: Map<string, GlobalRef>;

    constructor(methodSignature: MethodSignature, sourceAstNode: ts.Node, declaringMethod: ArkMethod, sourceFile: ts.SourceFile) {
        this.cfgBuilder = new CfgBuilder(sourceAstNode, methodSignature.getMethodSubSignature().getMethodName(), declaringMethod, sourceFile);
    }

    public build(): ArkBody | null {
        this.cfgBuilder.buildCfgBuilder();
        if (!this.cfgBuilder.isBodyEmpty()) {
            const { cfg, locals, globals, aliasTypeMap, traps } = this.cfgBuilder.buildCfg();
            if (globals !== null) {
                this.setGlobals(globals);
            }
            cfg.buildDefUseStmt(locals);

            return new ArkBody(locals, cfg, aliasTypeMap, traps.length ? traps : undefined);
        }
        return null;
    }

    public getCfgBuilder(): CfgBuilder {
        return this.cfgBuilder;
    }

    public getGlobals(): Map<string, GlobalRef> | undefined {
        return this.globals;
    }

    public setGlobals(globals: Map<string, GlobalRef>): void {
        this.globals = globals;
    }

    /**
     * Find out all locals in the parent method which are used by the childrenChain, these locals are the closures of the root node of the childrenChain.
     * childrenChain contains all nested method from the root node of the childrenChain.
     * baseLocals are all locals defined in the outer function.
     * allNestedLocals are collect all locals defined in all outer functions of this childrenChain.
     * Only the globals of the root of the childrenChain, which are in the baseLocals but not in the allNestedLocals are the actual closures that in baseLocals.
     */
    private findClosuresUsedInNested(childrenChain: NestedMethodChain, baseLocals: Map<string, Local>, allNestedLocals: Map<string, Local>): Local[] | null {
        let closuresRes: Local[] = [];

        const nestedMethod = childrenChain.parent;
        let nestedGlobals = nestedMethod.getBodyBuilder()?.getGlobals();
        if (nestedGlobals !== undefined) {
            for (let global of nestedGlobals.values()) {
                const nestedLocal = allNestedLocals.get(global.getName());
                const closure = baseLocals.get(global.getName());
                if (nestedLocal === undefined && closure !== undefined) {
                    closuresRes.push(closure);
                }
            }
        }
        const children = childrenChain.children;
        if (children === null) {
            return closuresRes;
        }
        for (let chain of children) {
            const nestedLocals = nestedMethod.getBody()?.getLocals();
            if (nestedLocals !== undefined) {
                nestedLocals.forEach((value, key) => {
                    allNestedLocals.set(key, value);
                });
            }
            const closures = this.findClosuresUsedInNested(chain, baseLocals, allNestedLocals);
            if (closures) {
                closuresRes.push(...closures);
            }
        }
        return closuresRes;
    }

    /**
     * 1. Find out all locals in the parent method which are used by the childrenChain, these locals are the closures of the root node of the childrenChain.
     * 2. Create a lexical env local in the parent method, and pass it to root node of the childrenChain through the method signature.
     * 3. Update the root node of the childrenChain to add parameterRef assign stmt and closureRef assign stmt.
     * 4. Recursively do this for all nested method level by level.
     */
    private buildLexicalEnv(childrenChain: NestedMethodChain, baseLocals: Map<string, Local>, index: number): number {
        let usedClosures = this.findClosuresUsedInNested(childrenChain, baseLocals, new Map<string, Local>());
        const nestedMethod = childrenChain.parent;
        const nestedSignature = nestedMethod.getImplementationSignature();
        if (nestedSignature !== null && usedClosures !== null && usedClosures.length > 0) {
            let lexicalEnv = new LexicalEnvType(nestedSignature, usedClosures);
            const closuresLocal = new Local(`${LEXICAL_ENV_NAME_PREFIX}${index++}`, lexicalEnv);
            baseLocals.set(closuresLocal.getName(), closuresLocal);
            this.updateNestedMethodWithClosures(nestedMethod, closuresLocal);
        } else if (usedClosures === null || usedClosures.length === 0) {
            this.moveCurrentMethodLocalToGlobal(nestedMethod);
        }

        const nextNestedChains = childrenChain.children;
        if (nextNestedChains === null) {
            return index;
        }
        for (let nextChain of nextNestedChains) {
            const newBaseLocals = nestedMethod.getBody()?.getLocals();
            if (newBaseLocals === undefined) {
                return index;
            }
            index = this.buildLexicalEnv(nextChain, newBaseLocals, index);
        }
        return index;
    }

    /**
     * Find out and tag all closures from globals, and remove closures from both globals and locals.
     * Precondition: body build has been done. All locals, globals and closures are both set as Local in body,
     * while potential globals and closures are also recorded in bodybuilder.
     * Constraint: only the outermost function can call this method to recursively handle closures of itself as well as all nested methods.
     */
    public handleGlobalAndClosure(): void {
        /**
         * Step1: Handle the outermost function, take it as Level 0.
         * There must be no closures in Level 0. So only need to remove the locals which with the same name as the ones in globals.
         */
        let outerMethod = this.getCfgBuilder().getDeclaringMethod();
        let outerGlobals = outerMethod.getBodyBuilder()?.getGlobals();
        outerMethod.freeBodyBuilder();
        let outerLocals = outerMethod.getBody()?.getLocals();
        if (outerGlobals !== undefined && outerLocals !== undefined) {
            outerGlobals.forEach((value, key) => {
                const local = outerLocals!.get(key);
                if (local !== undefined) {
                    value.addUsedStmts(local.getUsedStmts());
                    outerLocals!.delete(key);
                }
            });
            if (outerGlobals.size > 0) {
                outerMethod.getBody()?.setUsedGlobals(outerGlobals);
            }
        }

        let nestedMethodChains = this.generateNestedMethodChains(outerMethod).children;
        if (nestedMethodChains === null || outerLocals === undefined) {
            return;
        }
        let closuresIndex = 0;
        for (let nestedChain of nestedMethodChains) {
            /**
             * Step2: Handle each nested function in Level 1 one by one.
             * Find out all closures from Level 0 used by these Level 1 functions as well as all their children nested functions.
             * This will be done level by level recursively.
             */
            closuresIndex = this.buildLexicalEnv(nestedChain, outerLocals, closuresIndex);

            /**
             * Step3: Delete old globals which are recognized as closures, then the rest globals are the true globals.
             * The redundancy locals should be deleted but the used stmts of them should be restored to globals.
             * This will be done level by level recursively.
             */
            this.reorganizeGlobalAndLocal(nestedChain);

            /**
             * Step4: Infer UnclearReferenceType to check whether it is the type alias define in its parent function..
             */
            this.inferTypesDefineInOuter(outerMethod, nestedChain);

            /**
             * Step5: For each nested function, find out whether it is called by its parent function and update the related locals, globals and stmts.
             */
            this.updateNestedMethodUsedInOuter(nestedChain);

            this.freeBodyBuilder(nestedChain);
        }
    }

    private freeBodyBuilder(nestedChain: NestedMethodChain): void {
        nestedChain.parent.freeBodyBuilder();
        const childrenChains = nestedChain.children;
        if (childrenChains === null) {
            return;
        }
        for (const chain of childrenChains) {
            this.freeBodyBuilder(chain);
        }
    }

    private updateLocalTypesWithTypeAlias(locals: Map<string, Local>, typeAliases: Map<string, [AliasType, ArkAliasTypeDefineStmt]>): void {
        for (let local of locals.values()) {
            const newType = this.inferUnclearReferenceTypeWithTypeAlias(local.getType(), typeAliases);
            if (newType !== null) {
                local.setType(newType);
            }
        }
    }

    private inferUnclearReferenceTypeWithTypeAlias(localType: Type, typeAliases: Map<string, [AliasType, ArkAliasTypeDefineStmt]>): Type | null {
        if (localType instanceof ArrayType && localType.getBaseType() instanceof UnclearReferenceType) {
            const typeAlias = typeAliases.get((localType.getBaseType() as UnclearReferenceType).getName());
            if (typeAlias !== undefined) {
                localType.setBaseType(typeAlias[0]);
                return localType;
            }
            return null;
        }
        if (localType instanceof UnionType) {
            const optionTypes = localType.getTypes();
            for (let i = 0; i < optionTypes.length; i++) {
                const newType = this.inferUnclearReferenceTypeWithTypeAlias(optionTypes[i], typeAliases);
                if (newType !== null) {
                    optionTypes[i] = newType;
                }
            }
            return localType;
        }
        if (localType instanceof UnclearReferenceType) {
            const typeAlias = typeAliases.get(localType.getName());
            if (typeAlias !== undefined) {
                return typeAlias[0];
            }
        }
        return null;
    }

    private generateNestedMethodChains(outerMethod: ArkMethod): NestedMethodChain {
        let candidateMethods: ArkMethod[] = [];
        outerMethod
            .getDeclaringArkClass()
            .getMethods()
            .forEach(method => {
                if (method.getName().startsWith(NAME_PREFIX) && method.getName().endsWith(`${NAME_DELIMITER}${outerMethod.getName()}`)) {
                    candidateMethods.push(method);
                }
            });
        const childrenChains = this.getNestedChildrenChains(outerMethod, candidateMethods);
        if (childrenChains.length > 0) {
            return { parent: outerMethod, children: childrenChains };
        }
        return { parent: outerMethod, children: null };
    }

    private getNestedChildrenChains(parentMethod: ArkMethod, candidateMethods: ArkMethod[]): NestedMethodChain[] {
        let nestedMethodChain: NestedMethodChain[] = [];
        for (let method of candidateMethods) {
            const outerMethodSignature = method.getOuterMethod()?.getSignature();
            if (outerMethodSignature !== undefined && methodSignatureCompare(parentMethod.getSignature(), outerMethodSignature)) {
                const childrenChains = this.getNestedChildrenChains(method, candidateMethods);
                if (childrenChains.length > 0) {
                    nestedMethodChain.push({ parent: method, children: childrenChains });
                } else {
                    nestedMethodChain.push({ parent: method, children: null });
                }
            }
        }
        return nestedMethodChain;
    }

    private moveCurrentMethodLocalToGlobal(method: ArkMethod): void {
        const globals = method.getBodyBuilder()?.getGlobals();
        const locals = method.getBody()?.getLocals();
        if (locals === undefined || globals === undefined) {
            return;
        }
        globals.forEach((value, key) => {
            const local = locals.get(key);
            if (local !== undefined) {
                value.addUsedStmts(local.getUsedStmts());
                locals.delete(key);
            }
        });

        if (globals.size > 0) {
            method.getBody()?.setUsedGlobals(globals);
        }
    }

    private reorganizeGlobalAndLocal(nestedChain: NestedMethodChain): void {
        const nestedMethod = nestedChain.parent;
        const params = nestedMethod.getSubSignature().getParameters();
        const globals = nestedMethod.getBodyBuilder()?.getGlobals();
        if (params.length > 0 && params[0].getType() instanceof LexicalEnvType && globals !== undefined) {
            const closures = (params[0].getType() as LexicalEnvType).getClosures();
            for (let closure of closures) {
                globals.delete(closure.getName());
            }
        }

        this.moveCurrentMethodLocalToGlobal(nestedMethod);

        const childrenChains = nestedChain.children;
        if (childrenChains === null) {
            return;
        }
        for (const chain of childrenChains) {
            this.reorganizeGlobalAndLocal(chain);
        }
    }

    // 对嵌套函数中的UnclearReferenceType类型的变量进行类型推导，类型是否为外层函数中定义的类型别名
    private inferTypesDefineInOuter(outerMethod: ArkMethod, childrenChain: NestedMethodChain): void {
        const typeAliases = outerMethod.getBody()?.getAliasTypeMap();
        const nestedLocals = childrenChain.parent.getBody()?.getLocals();
        if (typeAliases !== undefined && nestedLocals !== undefined) {
            this.updateLocalTypesWithTypeAlias(nestedLocals, typeAliases);
        }
        const childrenChains = childrenChain.children;
        if (childrenChains === null) {
            return;
        }
        for (const chain of childrenChains) {
            this.inferTypesDefineInOuter(childrenChain.parent, chain);
        }
    }

    private updateNestedMethodUsedInOuter(nestedChain: NestedMethodChain): void {
        const nestedMethod = nestedChain.parent;
        const outerMethod = nestedMethod.getOuterMethod();
        if (outerMethod === undefined) {
            return;
        }
        const outerLocals = outerMethod.getBody()?.getLocals();
        if (outerLocals !== undefined) {
            for (let local of outerLocals.values()) {
                if (
                    local.getType() instanceof LexicalEnvType &&
                    methodSignatureCompare((local.getType() as LexicalEnvType).getNestedMethod(), nestedMethod.getSignature())
                ) {
                    this.updateOuterMethodWithClosures(outerMethod, nestedMethod, local);
                    break;
                }
            }
        }

        const nestedMethodName = nestedMethod.getName();
        const originalMethodName = this.getOriginalNestedMethodName(nestedMethodName) ?? '';
        const outerGlobals = outerMethod.getBody()?.getUsedGlobals();
        const callGlobal = outerGlobals?.get(nestedMethodName) ?? outerGlobals?.get(originalMethodName);
        if (callGlobal !== undefined && callGlobal instanceof GlobalRef && callGlobal.getRef() === null) {
            const fieldSignature = new FieldSignature(
                nestedMethodName,
                nestedMethod.getDeclaringArkClass().getSignature(),
                new FunctionType(nestedMethod.getSignature())
            );
            callGlobal.setRef(new ArkStaticFieldRef(fieldSignature));
        }

        const childrenChains = nestedChain.children;
        if (childrenChains === null) {
            return;
        }
        for (const chain of childrenChains) {
            this.updateNestedMethodUsedInOuter(chain);
        }
    }

    private updateNestedMethodWithClosures(nestedMethod: ArkMethod, closuresLocal: Local): void {
        if (!(closuresLocal.getType() instanceof LexicalEnvType)) {
            return;
        }

        const declareSignatures = nestedMethod.getDeclareSignatures();
        declareSignatures?.forEach((signature, index) => {
            nestedMethod.setDeclareSignatureWithIndex(this.createNewSignatureWithClosures(closuresLocal, signature), index);
        });

        const implementSignature = nestedMethod.getImplementationSignature();
        if (implementSignature !== null) {
            nestedMethod.setImplementationSignature(this.createNewSignatureWithClosures(closuresLocal, implementSignature));
        }

        this.addClosureParamsAssignStmts(closuresLocal, nestedMethod);
    }

    private updateOuterMethodWithClosures(outerMethod: ArkMethod, nestedMethod: ArkMethod, closuresLocal: Local): void {
        const nestedMethodName = nestedMethod.getName();
        const nestedMethodLocal = outerMethod.getBody()?.getLocals().get(nestedMethodName);
        if (nestedMethodLocal !== undefined) {
            this.updateLocalInfoWithClosures(nestedMethodLocal, outerMethod, nestedMethod, closuresLocal);
        } else {
            const nestedMethodGlobal = outerMethod.getBody()?.getUsedGlobals()?.get(nestedMethodName);
            if (nestedMethodGlobal !== undefined && nestedMethodGlobal instanceof GlobalRef) {
                this.updateGlobalInfoWithClosures(nestedMethodGlobal, outerMethod, nestedMethod, closuresLocal);
            }
        }

        const originalMethodName = this.getOriginalNestedMethodName(nestedMethodName);
        if (originalMethodName === null) {
            return;
        }
        const originalMethodLocal = outerMethod.getBody()?.getLocals().get(originalMethodName);
        if (originalMethodLocal !== undefined) {
            this.updateLocalInfoWithClosures(originalMethodLocal, outerMethod, nestedMethod, closuresLocal);
        } else {
            const originalMethodGlobal = outerMethod.getBody()?.getUsedGlobals()?.get(originalMethodName);
            if (originalMethodGlobal !== undefined && originalMethodGlobal instanceof GlobalRef) {
                this.updateGlobalInfoWithClosures(originalMethodGlobal, outerMethod, nestedMethod, closuresLocal);
            }
        }
    }

    private getOriginalNestedMethodName(nestedMethodName: string): string | null {
        if (nestedMethodName.startsWith(NAME_PREFIX) && nestedMethodName.includes(NAME_DELIMITER)) {
            const nameComponents = nestedMethodName.slice(1).split(NAME_DELIMITER);
            if (nameComponents.length > 1) {
                return nameComponents[0];
            }
        }
        return null;
    }

    private updateGlobalInfoWithClosures(globalRef: GlobalRef, outerMethod: ArkMethod, nestedMethod: ArkMethod, closuresLocal: Local): void {
        if (globalRef.getRef() !== null) {
            return;
        }
        const methodSignature = nestedMethod.getImplementationSignature();
        if (methodSignature === null) {
            return;
        }
        const lexicalEnv = closuresLocal.getType();
        if (!(lexicalEnv instanceof LexicalEnvType)) {
            return;
        }
        const fieldSignature = new FieldSignature(
            methodSignature.getMethodSubSignature().getMethodName(),
            methodSignature.getDeclaringClassSignature(),
            new ClosureType(lexicalEnv, methodSignature)
        );
        globalRef.setRef(new ArkStaticFieldRef(fieldSignature));
        this.updateAbstractInvokeExprWithClosures(globalRef, outerMethod.getSignature(), nestedMethod.getSignature(), closuresLocal);
    }

    private updateLocalInfoWithClosures(local: Local, outerMethod: ArkMethod, nestedMethod: ArkMethod, closuresLocal: Local): void {
        const localType = local.getType();
        if (!(localType instanceof FunctionType)) {
            return;
        }

        const lexicalEnv = closuresLocal.getType();
        if (!(lexicalEnv instanceof LexicalEnvType)) {
            return;
        }

        // 更新local的类型为ClosureType，methodSignature为内层嵌套函数
        const nestedMethodSignature = nestedMethod.getImplementationSignature();
        if (nestedMethodSignature !== null) {
            local.setType(new ClosureType(lexicalEnv, nestedMethodSignature, localType.getRealGenericTypes()));
        } else {
            local.setType(new ClosureType(lexicalEnv, localType.getMethodSignature(), localType.getRealGenericTypes()));
        }

        this.updateAbstractInvokeExprWithClosures(local, outerMethod.getSignature(), nestedMethod.getSignature(), closuresLocal);
    }

    // 更新所有stmt中调用内层函数处的AbstractInvokeExpr中的函数签名和实参args，加入闭包参数
    // 更新所有stmt中定义的函数指针的usedStmt中的函数签名和实参args，加入闭包参数
    private updateAbstractInvokeExprWithClosures(
        value: Local | GlobalRef,
        outerMethodSignature: MethodSignature,
        nestedMethodSignature: MethodSignature,
        closuresLocal: Local
    ): void {
        for (const usedStmt of value.getUsedStmts()) {
            if (usedStmt instanceof ArkInvokeStmt) {
                this.updateSignatureAndArgsInArkInvokeExpr(usedStmt, nestedMethodSignature, closuresLocal);
            } else if (usedStmt instanceof ArkAssignStmt) {
                const rightOp = usedStmt.getRightOp();
                if (rightOp instanceof AbstractInvokeExpr) {
                    this.updateSignatureAndArgsInArkInvokeExpr(usedStmt, nestedMethodSignature, closuresLocal);
                }
                const leftOp = usedStmt.getLeftOp();
                if (leftOp instanceof Local) {
                    leftOp.setType(rightOp.getType());
                }
            } else if (usedStmt instanceof ArkReturnStmt) {
                outerMethodSignature.getMethodSubSignature().setReturnType(value.getType());
            }
            const defValue = usedStmt.getDef();
            if (defValue === null) {
                continue;
            }
            if ((defValue instanceof Local || defValue instanceof GlobalRef) && defValue.getType() instanceof FunctionType) {
                this.updateAbstractInvokeExprWithClosures(defValue, outerMethodSignature, nestedMethodSignature, closuresLocal);
            }
        }
    }

    private createNewSignatureWithClosures(closuresLocal: Local, oldSignature: MethodSignature): MethodSignature {
        let oldSubSignature = oldSignature.getMethodSubSignature();
        const params = oldSubSignature.getParameters();
        const closuresParam = new MethodParameter();
        closuresParam.setName(closuresLocal.getName());
        closuresParam.setType(closuresLocal.getType());
        params.unshift(closuresParam);
        let newSubSignature = new MethodSubSignature(oldSubSignature.getMethodName(), params, oldSubSignature.getReturnType(), oldSubSignature.isStatic());
        return new MethodSignature(oldSignature.getDeclaringClassSignature(), newSubSignature);
    }

    private updateSignatureAndArgsInArkInvokeExpr(stmt: ArkInvokeStmt | ArkAssignStmt, methodSignature: MethodSignature, closuresLocal: Local): void {
        let expr: AbstractInvokeExpr;
        if (stmt instanceof ArkInvokeStmt) {
            expr = stmt.getInvokeExpr();
        } else {
            const rightOp = stmt.getRightOp();
            if (!(rightOp instanceof AbstractInvokeExpr)) {
                return;
            }
            expr = rightOp;
        }
        const exprMethodName = expr.getMethodSignature().getMethodSubSignature().getMethodName();
        const nestedMethodName = methodSignature.getMethodSubSignature().getMethodName();
        if (exprMethodName === nestedMethodName) {
            expr.setMethodSignature(this.createNewSignatureWithClosures(closuresLocal, methodSignature));
            expr.getArgs().unshift(closuresLocal);
            closuresLocal.addUsedStmt(stmt);
            return;
        }

        const originalMethodName = this.getOriginalNestedMethodName(nestedMethodName);
        if (originalMethodName !== null) {
            if (exprMethodName === originalMethodName || expr instanceof ArkPtrInvokeExpr) {
                expr.setMethodSignature(methodSignature);
                expr.getArgs().unshift(closuresLocal);
                closuresLocal.addUsedStmt(stmt);
            }
        }
    }

    private addClosureParamsAssignStmts(closuresParam: Local, method: ArkMethod): void {
        const lexicalEnv = closuresParam.getType();
        if (!(lexicalEnv instanceof LexicalEnvType)) {
            return;
        }
        const closures = lexicalEnv.getClosures();
        if (closures.length === 0) {
            return;
        }
        const oldParamRefs = method.getParameterRefs();
        let body = method.getBody();
        if (body === undefined) {
            return;
        }
        let stmts = Array.from(body.getCfg().getBlocks())[0].getStmts();
        let index = 0;
        const parameterRef = new ArkParameterRef(index, lexicalEnv);
        const closuresLocal = new Local(closuresParam.getName(), lexicalEnv);
        body.addLocal(closuresLocal.getName(), closuresLocal);
        let assignStmt = new ArkAssignStmt(closuresLocal, parameterRef);
        assignStmt.setCfg(body.getCfg());
        stmts.splice(index, 0, assignStmt);
        closuresLocal.setDeclaringStmt(assignStmt);

        oldParamRefs?.forEach(paramRef => {
            index++;
            paramRef.setIndex(index);
        });

        for (let closure of closures) {
            let local = body.getLocals().get(closure.getName());
            if (local === undefined) {
                local = new Local(closure.getName(), closure.getType());
                body.addLocal(local.getName(), local);
            } else {
                local.setType(closure.getType());
            }
            index++;
            const closureFieldRef = new ClosureFieldRef(closuresParam, closure.getName(), closure.getType());
            let assignStmt = new ArkAssignStmt(local, closureFieldRef);
            assignStmt.setCfg(body.getCfg());
            stmts.splice(index, 0, assignStmt);
            local.setDeclaringStmt(assignStmt);
            closuresLocal.addUsedStmt(assignStmt);
        }
    }
}
