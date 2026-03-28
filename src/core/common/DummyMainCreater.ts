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

import { Scene } from '../../Scene';
import { COMPONENT_LIFECYCLE_METHOD_NAME, LIFECYCLE_METHOD_NAME } from '../../utils/entryMethodUtils';
import { Constant } from '../base/Constant';
import { AbstractInvokeExpr, ArkConditionExpr, ArkInstanceInvokeExpr, ArkNewExpr, ArkStaticInvokeExpr, RelationalBinaryOperator } from '../base/Expr';
import { Local } from '../base/Local';
import { ArkAssignStmt, ArkIfStmt, ArkInvokeStmt, ArkReturnVoidStmt, Stmt } from '../base/Stmt';
import { ClassType, NumberType, Type } from '../base/Type';
import { BasicBlock } from '../graph/BasicBlock';
import { Cfg } from '../graph/Cfg';
import { ArkBody } from '../model/ArkBody';
import { ArkClass } from '../model/ArkClass';
import { ArkFile, Language } from '../model/ArkFile';
import { ArkMethod } from '../model/ArkMethod';
import { ClassSignature, FileSignature, MethodSignature } from '../model/ArkSignature';
import { ArkSignatureBuilder } from '../model/builder/ArkSignatureBuilder';
import { CONSTRUCTOR_NAME, THIS_NAME } from './TSConst';
import { checkAndUpdateMethod } from '../model/builder/ArkMethodBuilder';
import { ValueUtil } from './ValueUtil';
import {
    ABILITY_CREATE_METHOD,
    ABILITY_DESTROY_METHOD,
    ABILITY_STAGE_CREATE_METHOD,
    ABILITY_STAGE_DESTROY_METHOD,
    ABILITY_STAGE_WILL_DESTROY_METHOD,
    COMPONENT_DETACHED_METHOD,
    COMPONENT_DISAPPEAR_METHOD,
    COMPONENT_START_METHOD,
    DUMMY_CLASS,
    DUMMY_FILE,
    DUMMY_METHOD,
} from './Const';
import { ArkThisRef } from '../base/Ref';
import { COMPONENT } from './EtsConst';
import { CallGraph, CallGraphNode } from '../../callgraph/model/CallGraph';

const COMPONENT_BASE_CLASSES = ['CustomComponent', 'ViewPU'];
const ABILITY_BASE_CLASSES = ['UIExtensionAbility', 'Ability', 'FormExtensionAbility', 'UIAbility', 'BackupExtensionAbility'];

/**
收集所有的 Ability 和 Component 类，构造一个虚拟函数进行类的实例生成、初始化、生命周期函数调用等操作，具体为：
classA.%statInit()
const %1 = new classA()
%1.%instInit()
%1.aboutToAppear()
const %2 = new abilityA()
...
count = 0
while (true) {
    if (count === 1) {
        %1.onPageShow()
    }
    if (count === 2) {
        %2.onBackground()
    }
    ...
}
%1.aboutToDisappear()
%1.onDetached()
%2.onWindowStageDestroy()
...
return
 */
export class DummyMainCreater {
    // entryMethods includes all UIAbility and Component lifecycle methods as well as all callback methods, but exclude the start and end methods
    private entryMethods: ArkMethod[] = [];
    private entryClasses: ArkClass[] = [];
    private abilityCreateMethods: ArkMethod[] = [];
    private abilityStageCreateMethods: ArkMethod[] = [];
    private abilityStageWillDestroyMethods: ArkMethod[] = [];
    private abilityStageDestroyMethods: ArkMethod[] = [];
    private abilityDestroyMethods: ArkMethod[] = [];
    private componentAppearMethods: ArkMethod[] = [];
    private componentDisappearMethods: ArkMethod[] = [];
    private componentDetachedMethods: ArkMethod[] = [];
    // every declaring class of method in entryMethods have its instance local which is used to be the base of instance invoke expr
    private classLocalMap: Map<ArkClass, Local> = new Map();
    private dummyMain: ArkMethod = new ArkMethod();
    private scene: Scene;
    private tempLocalIndex: number = 0;
    private tempBlockIndex: number = 0;
    private classScope?: ArkClass[];
    private dummyMethodName?: string;

    /**
     * Create dummy entry method and add it to the specified scene.
     * @param scene
     * @param dummyMethodName if not provided, using the default method name '@dummyMain'
     * @param classScope if not provided, collect all Ability class and Component struct.
     */
    constructor(scene: Scene, dummyMethodName?: string, classScope?: ArkClass[]) {
        this.scene = scene;
        this.dummyMethodName = dummyMethodName;
        this.classScope = classScope;
        // Currently get entries from module.json5 can't visit all of abilities
        // Todo: handle ability/component jump, then get entries from module.json5
        this.getMethodsFromAllAbilities();
        this.getEntryMethodsFromComponents();
    }

    public setEntryMethods(methods: ArkMethod[]): void {
        this.entryMethods = methods;
    }

    public createDummyMain(): void {
        // The first choice is to use the existing dummy class and add the new created dummy method into it.
        // Then it can create more than one dummy methods with different names by using this creation api several times.
        // step1: find out or create the dummy file
        const dummyMainFileSignature = new FileSignature(this.scene.getProjectName(), DUMMY_FILE);
        let dummyMainFile = this.scene.getFile(dummyMainFileSignature);
        if (!dummyMainFile) {
            dummyMainFile = new ArkFile(Language.ARKTS1_1);
            dummyMainFile.setScene(this.scene);
            dummyMainFile.setFileSignature(dummyMainFileSignature);
            this.scene.setFile(dummyMainFile);
        }

        // step2: find out or create dummy class
        let dummyMainClass = dummyMainFile.getClassWithName(DUMMY_CLASS);
        if (!dummyMainClass) {
            dummyMainClass = new ArkClass();
            dummyMainClass.setDeclaringArkFile(dummyMainFile);
            const dummyMainClassSignature = new ClassSignature(DUMMY_CLASS, dummyMainFileSignature);
            dummyMainClass.setSignature(dummyMainClassSignature);
            dummyMainFile.addArkClass(dummyMainClass);
        }

        // step3: create dummy method
        this.dummyMain.setDeclaringArkClass(dummyMainClass);
        const methodSubSignature = ArkSignatureBuilder.buildMethodSubSignatureFromMethodName(this.dummyMethodName ?? DUMMY_METHOD);
        const methodSignature = new MethodSignature(this.dummyMain.getDeclaringArkClass().getSignature(), methodSubSignature);
        this.dummyMain.setImplementationSignature(methodSignature);
        this.dummyMain.setLineCol(0);
        this.dummyMain.setIsGeneratedFlag(true);
        checkAndUpdateMethod(this.dummyMain, dummyMainClass);
        dummyMainClass.addMethod(this.dummyMain);
        this.scene.addToMethodsMap(this.dummyMain);

        // step4: create instance local for each class
        for (const cls of this.entryClasses) {
            if (cls.isDefaultArkClass()) {
                continue;
            }

            let newLocal = this.classLocalMap.get(cls);
            if (!newLocal) {
                newLocal = new Local('%' + this.tempLocalIndex++, new ClassType(cls.getSignature()));
                this.classLocalMap.set(cls, newLocal);
            }
        }

        // step5: create dummy method body
        const localSet = new Set(this.classLocalMap.values());
        const dummyCfg = new Cfg();
        this.dummyMain.setBody(new ArkBody(localSet, dummyCfg));
        dummyCfg.setDeclaringMethod(this.dummyMain);
        this.createDummyMainCfg();
        this.addCfg2Stmt();
    }

    private addStaticInit(firstBlock: BasicBlock): void {
        for (const method of this.scene.getStaticInitMethods()) {
            const staticInvokeExpr = new ArkStaticInvokeExpr(method.getSignature(), []);
            const invokeStmt = new ArkInvokeStmt(staticInvokeExpr);
            firstBlock.addStmt(invokeStmt);
        }
    }

    private addClassInit(firstBlock: BasicBlock): void {
        for (const [cls, local] of this.classLocalMap) {
            const assStmt = new ArkAssignStmt(local, new ArkNewExpr(cls.getSignature().getType()));
            firstBlock.addStmt(assStmt);
            local.setDeclaringStmt(assStmt);
            let consMtd = cls.getMethodWithName(CONSTRUCTOR_NAME);
            if (consMtd) {
                let ivkExpr = new ArkInstanceInvokeExpr(local, consMtd.getSignature(), []);
                let ivkStmt = new ArkAssignStmt(local, ivkExpr);
                firstBlock.addStmt(ivkStmt);
            }
        }
    }

    private addParamInit(method: ArkMethod, paramLocals: Local[], invokeBlock: BasicBlock): void {
        let paramIdx = 0;
        for (const param of method.getParameters()) {
            let paramType: Type | undefined = param.getType();
            // In ArkIR from abc scenario, param type is undefined in some cases
            // Then try to get it from super class(SDK)
            // TODO - need handle method overload to get the correct method
            if (!paramType) {
                let superCls = method.getDeclaringArkClass().getSuperClass();
                let methodInSuperCls = superCls?.getMethodWithName(method.getName());
                if (methodInSuperCls) {
                    paramType = methodInSuperCls.getParameters()[paramIdx]?.getType();
                    method = methodInSuperCls;
                }
            }
            const paramLocal = new Local('%' + this.tempLocalIndex++, paramType);
            paramLocals.push(paramLocal);
            if (paramType instanceof ClassType) {
                const assStmt = new ArkAssignStmt(paramLocal, new ArkNewExpr(paramType));
                paramLocal.setDeclaringStmt(assStmt);
                invokeBlock.addStmt(assStmt);
            }
            paramIdx++;
        }
    }

    private addBranches(whileBlock: BasicBlock, countLocal: Local, dummyCfg: Cfg): void {
        let lastBlocks: BasicBlock[] = [whileBlock];
        let count = 0;
        for (let method of this.entryMethods) {
            count++;
            const condition = new ArkConditionExpr(countLocal, new Constant(count.toString(), NumberType.getInstance()), RelationalBinaryOperator.Equality);
            const ifStmt = new ArkIfStmt(condition);
            const ifBlock = new BasicBlock(this.tempBlockIndex++);
            ifBlock.addStmt(ifStmt);
            dummyCfg.addBlock(ifBlock);

            for (const block of lastBlocks) {
                this.linkBlocks(block, ifBlock);
            }

            const invokeBlock = new BasicBlock(this.tempBlockIndex++);
            this.addMethodsInvokeStmt(invokeBlock, [method]);
            dummyCfg.addBlock(invokeBlock);
            this.linkBlocks(ifBlock, invokeBlock);

            lastBlocks = [ifBlock, invokeBlock];
        }
        for (const block of lastBlocks) {
            this.linkBlocks(block, whileBlock);
        }
    }

    private createDummyMainCfg(): void {
        const dummyCfg = this.dummyMain.getCfg()!;

        // step1: create the first block which includes:
        // 1. all static invoke of static init methods
        // 2. all class new expr
        // 3. all instance invoke of instance init methods
        // 4. all start lifecycle methods in sequence
        const firstBlock = new BasicBlock(this.tempBlockIndex++);
        const dummyClassType = new ClassType(this.dummyMain.getDeclaringArkClass().getSignature());
        const startingStmt = new ArkAssignStmt(new Local(THIS_NAME, dummyClassType), new ArkThisRef(dummyClassType));
        firstBlock.addStmt(startingStmt);
        dummyCfg.setStartingStmt(startingStmt);

        this.addStaticInit(firstBlock);

        this.addClassInit(firstBlock);

        this.addMethodsInvokeStmt(firstBlock, this.abilityCreateMethods);
        this.addMethodsInvokeStmt(firstBlock, this.abilityStageCreateMethods);
        this.addMethodsInvokeStmt(firstBlock, this.componentAppearMethods);

        const countLocal = new Local('count', NumberType.getInstance());
        this.dummyMain.getBody()!.addLocal(countLocal.getName(), countLocal);

        const zero = ValueUtil.getOrCreateNumberConst(0);
        const countAssignStmt = new ArkAssignStmt(countLocal, zero);
        firstBlock.addStmt(countAssignStmt);
        dummyCfg.addBlock(firstBlock);

        // step2: create the while condition block
        const whileBlock = new BasicBlock(this.tempBlockIndex++);
        const conditionTrue = new ArkConditionExpr(
            ValueUtil.getBooleanConstant(true),
            ValueUtil.getBooleanConstant(false),
            RelationalBinaryOperator.InEquality);
        const whileStmt = new ArkIfStmt(conditionTrue);
        whileBlock.addStmt(whileStmt);
        dummyCfg.addBlock(whileBlock);
        this.linkBlocks(firstBlock, whileBlock);

        // step3: create the following cfgs
        this.addBranches(whileBlock, countLocal, dummyCfg);

        // step4: create the last return block
        const returnBlock = new BasicBlock(this.tempBlockIndex++);
        this.addMethodsInvokeStmt(returnBlock, this.componentDisappearMethods);
        this.addMethodsInvokeStmt(returnBlock, this.abilityStageWillDestroyMethods);
        this.addMethodsInvokeStmt(returnBlock, this.abilityStageDestroyMethods);
        this.addMethodsInvokeStmt(returnBlock, this.componentDetachedMethods);
        this.addMethodsInvokeStmt(returnBlock, this.abilityDestroyMethods);
        const returnStmt = new ArkReturnVoidStmt();
        returnBlock.addStmt(returnStmt);
        dummyCfg.addBlock(returnBlock);
        this.linkBlocks(whileBlock, returnBlock);
    }

    private addMethodsInvokeStmt(block: BasicBlock, methods: ArkMethod[]): void {
        for (const method of methods) {
            const paramLocals: Local[] = [];
            this.addParamInit(method, paramLocals, block);
            const local = this.classLocalMap.get(method.getDeclaringArkClass());
            let invokeExpr: AbstractInvokeExpr;
            if (local) {
                invokeExpr = new ArkInstanceInvokeExpr(local, method.getSignature(), paramLocals);
            } else {
                invokeExpr = new ArkStaticInvokeExpr(method.getSignature(), paramLocals);
            }
            const invokeStmt = new ArkInvokeStmt(invokeExpr);
            block.addStmt(invokeStmt);
        }
    }

    private linkBlocks(firstBlock: BasicBlock, nextBlock: BasicBlock): void {
        firstBlock.addSuccessorBlock(nextBlock);
        nextBlock.addPredecessorBlock(firstBlock);
    }

    private addCfg2Stmt(): void {
        const cfg = this.dummyMain.getCfg();
        if (!cfg) {
            return;
        }
        for (const block of cfg.getBlocks()) {
            for (const stmt of block.getStmts()) {
                stmt.setCfg(cfg);
            }
        }
    }

    public getDummyMain(): ArkMethod {
        return this.dummyMain;
    }

    private getEntryMethodsFromComponents(): void {
        this.scene
            .getClasses()
            .filter(cls => {
                if (this.classScope && this.classScope.length > 0 && !this.classScope.includes(cls)) {
                    return false;
                }
                if (COMPONENT_BASE_CLASSES.includes(cls.getSuperClassName())) {
                    return true;
                }
                return cls.hasDecorator(COMPONENT);
            })
            .forEach(cls => {
                this.entryClasses.push(cls);
                for (const mtd of cls.getMethods()) {
                    const name = mtd.getName();
                    if (name === COMPONENT_START_METHOD) {
                        this.componentAppearMethods.push(mtd);
                        continue;
                    }
                    if (name === COMPONENT_DISAPPEAR_METHOD) {
                        this.componentDisappearMethods.push(mtd);
                        continue;
                    }
                    if (name === COMPONENT_DETACHED_METHOD) {
                        this.componentDetachedMethods.push(mtd);
                        continue;
                    }
                    if (COMPONENT_LIFECYCLE_METHOD_NAME.includes(name)) {
                        this.entryMethods.push(mtd);
                    }
                }
            });
    }

    private classInheritsAbility(arkClass: ArkClass): boolean {
        if (ABILITY_BASE_CLASSES.includes(arkClass.getSuperClassName())) {
            return true;
        }
        let superClass = arkClass.getSuperClass();
        let visitedClasses: Set<ArkClass> = new Set();
        while (superClass) {
            if (visitedClasses.has(superClass)) {
                break;
            }
            visitedClasses.add(superClass);
            if (ABILITY_BASE_CLASSES.includes(superClass.getSuperClassName())) {
                return true;
            }
            superClass = superClass.getSuperClass();
        }
        return false;
    }

    private getMethodsFromAllAbilities(): void {
        this.scene
            .getClasses()
            .filter(cls => {
                if (this.classScope && this.classScope.length > 0 && !this.classScope.includes(cls)) {
                    return false;
                }
                return this.classInheritsAbility(cls);
            })
            .forEach(cls => {
                this.entryClasses.push(cls);
                for (const mtd of cls.getMethods()) {
                    const name = mtd.getName();
                    if (name === ABILITY_CREATE_METHOD) {
                        this.abilityCreateMethods.push(mtd);
                        continue;
                    }
                    if (name === ABILITY_STAGE_CREATE_METHOD) {
                        this.abilityStageCreateMethods.push(mtd);
                        continue;
                    }
                    if (name === ABILITY_STAGE_WILL_DESTROY_METHOD) {
                        this.abilityStageWillDestroyMethods.push(mtd);
                        continue;
                    }
                    if (name === ABILITY_STAGE_DESTROY_METHOD) {
                        this.abilityStageDestroyMethods.push(mtd);
                        continue;
                    }
                    if (name === ABILITY_DESTROY_METHOD) {
                        this.abilityDestroyMethods.push(mtd);
                        continue;
                    }
                    if (LIFECYCLE_METHOD_NAME.includes(name)) {
                        this.entryMethods.push(mtd);
                    }
                }
            });
    }

    /**
     * Analysis the coverage of files, methods, stmts when starting from the dummy main method according to the given call graph.
     * @param callGraph - the call graph create within ArkAnalyzer
     * @param generated - whether to include the generated methods
     */
    public analysisCoverage(callGraph: CallGraph, generated: boolean = true): Coverage {
        const analysis: CoverageAnalysis = new CoverageAnalysis(this.scene, this.dummyMain, callGraph, generated);
        return analysis.calculateCoverage();
    }
}

interface Coverage {
    filesCoverage: number;
    methodsCoverage: number;
    stmtsCoverage: number;
    totalFiles: number;
    totalMethods: number;
    totalStmts: number;
    visitedFiles: number;
    visitedMethods: number;
    visitedStmts: number;
}

class CoverageAnalysis {
    private visitedFiles: Set<ArkFile> = new Set();
    private visitedMethods: Set<ArkMethod> = new Set();
    private visitedStmts: Set<Stmt> = new Set();
    private totalFiles: Set<ArkFile>;
    private totalMethods: Set<ArkMethod>;
    private totalStmts: Set<Stmt>;
    private scene: Scene;
    private entry: ArkMethod;
    private callGraph: CallGraph;

    constructor(scene: Scene, entry: ArkMethod, callGraph: CallGraph, generated: boolean = true) {
        this.scene = scene;
        this.callGraph = callGraph;
        this.entry = entry;
        this.totalFiles = new Set(scene.getFiles());
        this.totalMethods = new Set();
        this.totalFiles.forEach(file => {
            file.getClasses().forEach(cls => {
                cls.getMethods(generated).forEach(method => {
                    this.totalMethods.add(method);
                });
            });
        });
        // if entry method is dummy main, then it is also generated, but still need to include it
        this.totalMethods.add(entry);

        this.totalStmts = new Set();
        this.totalMethods.forEach(method => {
            method.getCfg()?.getStmts().forEach(stmt => {
                this.totalStmts.add(stmt);
            });
        });
    }

    public addVisitedFile(file: ArkFile): void {
        this.visitedFiles.add(file);
    }

    public addVisitedMethod(method: ArkMethod): void {
        this.visitedMethods.add(method);
    }

    public addVisitedStmt(stmt: Stmt): void {
        this.visitedStmts.add(stmt);
    }

    public calculateCoverage(): Coverage {
        this.goThroughMethod(this.entry);

        return {
            filesCoverage: this.visitedFiles.size / this.totalFiles.size,
            methodsCoverage: this.visitedMethods.size / this.totalMethods.size,
            stmtsCoverage: this.visitedStmts.size / this.totalStmts.size,
            totalFiles: this.totalFiles.size,
            totalMethods: this.totalMethods.size,
            totalStmts: this.totalStmts.size,
            visitedFiles: this.visitedFiles.size,
            visitedMethods: this.visitedMethods.size,
            visitedStmts: this.visitedStmts.size,
        };
    }

    /**
     * Scan all invoke stmts of the given method, and go through all callee methods of this given method recursively.
     * @param method
     * @private
     */
    private goThroughMethod(method: ArkMethod): void {
        const file = method.getDeclaringArkFile();
        if (!this.totalFiles.has(file) || !this.totalMethods.has(method) || this.visitedMethods.has(method)) {
            return;
        }
        this.addVisitedMethod(method);
        this.addVisitedFile(file);
        const stmts = method.getCfg()?.getStmts();
        if (!stmts) {
            return;
        }

        stmts.forEach(stmt => {
            this.addVisitedStmt(stmt);
        });

        const node = this.callGraph.getCallGraphNodeByMethod(method.getSignature());
        const outgoingEdges = node.getOutgoingEdges();
        if (!outgoingEdges) {
            return;
        }

        for (const outEdge of outgoingEdges) {
            const calleeSig = (outEdge.getDstNode() as CallGraphNode).getMethod();
            const callee = this.scene.getMethod(calleeSig);
            if (!callee) {
                continue;
            }
            this.goThroughMethod(callee);
        }
    }
}
