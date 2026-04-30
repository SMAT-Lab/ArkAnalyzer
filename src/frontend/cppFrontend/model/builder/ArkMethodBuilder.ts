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

import { ClassType, GenericType, Type, UnknownType, VoidType } from '../../../../core/base/Type';
import { CxxBodyBuilder } from './BodyBuilder';
import { ArkClass } from '../../../../core/model/ArkClass';
import { ArkMethod } from '../../../../core/model/ArkMethod';
import {
    buildModifiers,
    buildParameters,
    buildReturnType,
    cxxNode2Type,
    isCxxFunctionPointer,
} from './builderUtils';
import { ArkParameterRef, ArkThisRef } from '../../../../core/base/Ref';
import { ArkBody } from '../../../../core/model/ArkBody';
import { Cfg } from '../../../../core/graph/Cfg';
import { ArkInstanceInvokeExpr, ArkStaticInvokeExpr } from '../../../../core/base/Expr';
import { MethodSignature, MethodSubSignature } from '../../../../core/model/ArkSignature';
import { ArkAssignStmt, ArkInvokeStmt, ArkReturnStmt, ArkReturnVoidStmt, Stmt } from '../../../../core/base/Stmt';
import { BasicBlock } from '../../../../core/graph/BasicBlock';
import { Local } from '../../../../core/base/Local';
import { Value } from '../../../../core/base/Value';
import { ANONYMOUS_METHOD_PREFIX, DEFAULT_ARK_METHOD_NAME } from '../../../../core/common/Const';
import { IRUtils } from '../../common/IRUtils';
import {
    buildNestedMethodName,
    MethodParameter,
    needDefaultConstructorInClass,
    updateMethodSignaturesAndLineCols,
} from '../../../../core/model/builder/ArkMethodBuilder';
import { buildGenericType } from '../../../../core/model/builder/builderUtils';
import { CONSTRUCTOR_NAME, SUPER_NAME, THIS_NAME } from '../../../../core/common/TSConst';
import { ArkSignatureBuilder } from '../../../../core/model/builder/ArkSignatureBuilder';
import Logger, { LOG_MODULE_TYPE } from '../../../../utils/logger';
import { CxxAstNode } from '../../ast';
import { FullPosition } from '../../../../core/base/Position';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'ArkMethodBuilder');

function getSpecificNodes(methodNode: CxxAstNode, targetNode: string): CxxAstNode[] {
    if (!methodNode || !methodNode.inner) {
        return [];
    }
    // Handle Cpp lambda functions
    if (methodNode.type && !(isCxxFunctionPointer(methodNode.type.qualType)) &&
        !['FunctionDecl', 'CXXMethodDecl', 'CXXConstructorDecl', 'CXXDestructorDecl', 'FriendDecl', 'LambdaExpr', 'FunctionTemplateDecl'].includes(
            methodNode.kind
        ) &&
        methodNode.inner
    ) {
        return getSpecificNodes(methodNode.inner[0], targetNode);
    }
    let result: CxxAstNode[] = [];
    methodNode.inner.forEach((childNode: CxxAstNode) => {
        if (childNode.kind.toString() === targetNode) {
            result.push(childNode);
        }
    });
    return result.length > 0 ? result : [];
}

export function buildDefaultArkMethodFromArkClass(declaringClass: ArkClass, mtd: ArkMethod, sourceFile: CxxAstNode, node?: CxxAstNode): void {
    mtd.setDeclaringArkClass(declaringClass);

    const methodSubSignature = ArkSignatureBuilder.buildMethodSubSignatureFromMethodName(DEFAULT_ARK_METHOD_NAME, true);
    const methodSignature = new MethodSignature(mtd.getDeclaringArkClass().getSignature(), methodSubSignature);
    mtd.setImplementationSignature(methodSignature);
    mtd.setImplOriginFullPosition(new FullPosition(0, 0, 0, 0));

    const defaultMethodNode = node ? node : sourceFile;

    let bodyBuilder = new CxxBodyBuilder(mtd.getSignature(), defaultMethodNode, mtd, sourceFile);
    mtd.setCxxBodyBuilder(bodyBuilder);
}

export function handleFunctionTemplateDecl(methodNode: CxxAstNode, mtd: ArkMethod, sourceFile: CxxAstNode): void {
    if (methodNode.kind !== 'FunctionTemplateDecl' && methodNode.kind !== 'LambdaExpr') {
        return;
    }
    mtd.isGenericsMethod();
    let templateTypesArray = [];
    let index = -1;
    for (const innerNode of methodNode.inner) {
        if (innerNode.kind !== 'TemplateTypeParmVarDecl' && innerNode.kind !== 'TemplateTypeParmDecl') {
            continue;
        }
        let typename = innerNode.name;
        // Template for handling parameter folding
        if (innerNode.code.includes('...')) {
            typename = typename + '...';
        }
        let defaultType;
        if (innerNode.defaultArg) {
            defaultType = cxxNode2Type(innerNode, undefined);
        }
        let templateType = new GenericType(typename, defaultType);
        templateType.setIndex(++index);
        templateTypesArray.push(templateType);

    }
    mtd.setGenericTypes(templateTypesArray);
}

export function buildArkMethodFromArkClass(methodNode: CxxAstNode, declaringClass: ArkClass, mtd: ArkMethod,
                                           sourceFile: CxxAstNode, declaringMethod?: ArkMethod): void {
    mtd.setDeclaringArkClass(declaringClass);
    if (declaringMethod !== undefined) {
        mtd.setOuterMethod(declaringMethod);
    }
    if (methodNode.kind === 'FunctionDecl' || methodNode.kind === 'FunctionTemplateDecl') {
        mtd.setAsteriskToken(false);
    }
    handleFunctionTemplateDecl(methodNode, mtd, sourceFile);
    // After processing the template parameters, proceed to the corresponding functions below
    methodNode = methodNode.kind === 'FunctionTemplateDecl' ? methodNode.inner[methodNode.inner.length - 1] : methodNode;
    mtd.setCode(methodNode.code);
    mtd.addModifier(buildModifiers(methodNode));
    if (methodNode.kind === 'FriendDecl' && methodNode.inner.length > 0) {
        methodNode = methodNode.inner[0];
    }
    const methodName = buildMethodName(methodNode, declaringClass, sourceFile, declaringMethod);
    const methodParameters: MethodParameter[] = [];
    const parameters = getSpecificNodes(methodNode, 'ParmVarDecl');
    buildParameters(parameters, mtd, sourceFile).forEach(parameter => {
        buildGenericType(parameter.getType(), mtd);
        methodParameters.push(parameter);
    });
    let returnType: Type = UnknownType.getInstance();
    if (methodNode.type) {
        returnType = buildGenericType(buildReturnType(methodNode, sourceFile, mtd), mtd);
    }
    if (isRelatedToCXXInheritedCtorInitExpr(methodNode)) {
        addParamsToCXXInheritedCtorInitExpr(methodNode, mtd, methodParameters);
        returnType = VoidType.getInstance();
    }
    reCheckModifiers(methodName, declaringClass, mtd, methodParameters);
    const methodSubSignature = new MethodSubSignature(methodName, methodParameters, returnType, mtd.isStatic());
    const methodSignature = new MethodSignature(mtd.getDeclaringArkClass().getSignature(), methodSubSignature);
    if (isMethodImplementation(methodNode)) {
        mtd.setImplementationSignature(methodSignature);
        mtd.setImplOriginFullPosition(FullPosition.cxxBuildFromNode(methodNode, sourceFile));
        let bodyBuilder = new CxxBodyBuilder(mtd.getSignature(), methodNode, mtd, sourceFile);
        mtd.setCxxBodyBuilder(bodyBuilder);
    } else {
        mtd.setDeclareSignatures(methodSignature);
        mtd.setDeclareOriginFullPositions([FullPosition.cxxBuildFromNode(methodNode, sourceFile)]);
    }

    checkAndUpdateCxxMethod(mtd, declaringClass);
    declaringClass.addMethod(mtd);
    IRUtils.setComments(mtd, methodNode, sourceFile, mtd.getDeclaringArkFile().getScene().getOptions());
}

// When a function is implemented outside the class, it retrieves the modifier at the original definition
function reCheckModifiers(methodName: string, cls: ArkClass, method: ArkMethod, parameters: MethodParameter[]): void {
    let methodsWithSameName = cls.getAllMethodsWithName(methodName);
    if (methodsWithSameName.length === 0) {
        return;
    }
    for (const preMtd of methodsWithSameName) {
        let preParameters = preMtd.getSubSignature().getParameters();
        if (compareParameters(preParameters, parameters)) {
            method.addModifier(preMtd.getModifiers());
        }
    }
}

function compareParameters(preParameters: MethodParameter[], parameters: MethodParameter[]): boolean {
    if (preParameters.length !== parameters.length) {
        return false;
    }
    for (let i = 0; i < parameters.length; i++) {
        if (parameters[i].getType().toString() !== preParameters[i].getType().toString()) {
            return false;
        }
    }
    return true;
}

function checkAndUpdateCxxMethod(method: ArkMethod, cls: ArkClass): void {
    const methodName = method.getName();
    const methodSignature = method.getSignature();
    let methodsWithSameName = cls.getAllMethodsWithName(methodName);
    if (methodsWithSameName.length === 0) {
        return;
    }
    for (const preMtd of methodsWithSameName) {
        if (preMtd.getSignature().isMatch(methodSignature)) {
            updateMethodSignaturesAndLineCols(method, preMtd);
            break;
        }
    }
}

function isRelatedToCXXInheritedCtorInitExpr(node: CxxAstNode): boolean {
    if (!node) {
        return false;
    }
    let innerNodes = node.inner;
    while (innerNodes) {
        if (innerNodes.length === 0) {
            return false;
        }
        if (innerNodes[0].kind === 'CXXInheritedCtorInitExpr') {
            return true;
        }
        innerNodes = innerNodes[0]!.inner;
    }
    return false;
}

function addParamsToCXXInheritedCtorInitExpr(mtdNode: CxxAstNode, mtd: ArkMethod, methodParameters: MethodParameter[]): void {
    const cls = mtd.getDeclaringArkClass();
    const superClassName = mtdNode.inner?.[0]?.baseInit?.qualType;
    if (!superClassName) {
        return;
    }
    let superClass = cls.getHeritageClass(superClassName);
    if (!superClass) {
        cls.addHeritageClassName(superClassName);
        superClass = cls.getDeclaringArkFile().getClassWithName(superClassName);
        if (!superClass) {
            return;
        }
    }
    buildDefaultConstructor(superClass);
    const superConstructor = superClass.getMethodWithName(CONSTRUCTOR_NAME);
    if (!superConstructor) {
        return;
    }
    superConstructor.getParameters().forEach(param => {
        buildGenericType(param.getType(), mtd);
        methodParameters.push(param);
    });
}

function buildMethodName(node: CxxAstNode, declaringClass: ArkClass, sourceFile: CxxAstNode, declaringMethod?: ArkMethod): string {
    let name: string = '';
    let declType = node.kind.toString();
    switch (declType) {
        case 'CXXMethodDecl':
        case 'FunctionDecl':
        case 'CXXDestructorDecl':
        case 'FunctionTemplateDecl':
            name = node.name.toString();
            break;
        case 'CXXConstructorDecl':
            name = 'constructor';
            break;
        case 'LambdaExpr':
            name = buildAnonymousMethodName(node, declaringClass);
            break;
        case 'VarDecl':
        case 'ParmVarDecl':
            if (isCxxFunctionPointer(node.type.qualType)) {
                name = buildAnonymousMethodName(node, declaringClass);
            }
            break;
        default:
            break;
    }

    if (declaringMethod !== undefined && !declaringMethod.isDefaultArkMethod()) {
        name = buildNestedMethodName(name, declaringMethod.getName());
    }
    return name;
}

function buildAnonymousMethodName(node: CxxAstNode, declaringClass: ArkClass): string {
    return `${ANONYMOUS_METHOD_PREFIX}${declaringClass.getAnonymousMethodNumber()}`;
}

export function recursivelyCheckAndBuildSuperConstructor(arkClass: ArkClass): void {
    const superClasses: ArkClass[] = arkClass.getAllHeritageClasses();
    if (!superClasses) {
        return;
    }
    for (const superClass of superClasses) {
        if (superClass.getMethodWithName(CONSTRUCTOR_NAME) === null) {
            buildDefaultConstructor(superClass);
        }
        recursivelyCheckAndBuildSuperConstructor(superClass);
    }
}

export function buildDefaultConstructor(arkClass: ArkClass): boolean {
    if (!needDefaultConstructorInClass(arkClass)) {
        return false;
    }

    recursivelyCheckAndBuildSuperConstructor(arkClass);

    const defaultConstructor: ArkMethod = new ArkMethod();
    defaultConstructor.setDeclaringArkClass(arkClass);
    defaultConstructor.setCode(arkClass.getName());
    defaultConstructor.setIsGeneratedFlag(false);

    const thisLocal = new Local(THIS_NAME, new ClassType(arkClass.getSignature()));
    const locals: Set<Local> = new Set([thisLocal]);
    const basicBlock = new BasicBlock();
    basicBlock.setId(0);

    let parameters: MethodParameter[] = [];
    let parameterArgs: Value[] = [];
    const superConstructor = arkClass.getSuperClass()?.getMethodWithName(CONSTRUCTOR_NAME);
    if (superConstructor) {
        parameters = superConstructor.getParameters();
        for (let index = 0; index < parameters.length; index++) {
            const parameterRef = new ArkParameterRef(index, parameters[index].getType());
            const parameterLocal = new Local(parameters[index].getName(), parameterRef.getType());
            locals.add(parameterLocal);
            parameterArgs.push(parameterLocal);
            basicBlock.addStmt(new ArkAssignStmt(parameterLocal, parameterRef));
        }
    }

    basicBlock.addStmt(new ArkAssignStmt(thisLocal, new ArkThisRef(new ClassType(arkClass.getSignature()))));

    if (superConstructor) {
        const superMethodSubSignature = new MethodSubSignature(SUPER_NAME, parameters, superConstructor.getReturnType());
        const superMethodSignature = new MethodSignature(arkClass.getSignature(), superMethodSubSignature);
        const superInvokeExpr = new ArkStaticInvokeExpr(superMethodSignature, parameterArgs);
        basicBlock.addStmt(new ArkInvokeStmt(superInvokeExpr));
    }

    const methodSubSignature = new MethodSubSignature(CONSTRUCTOR_NAME, parameters, thisLocal.getType(), defaultConstructor.isStatic());
    defaultConstructor.setImplementationSignature(new MethodSignature(arkClass.getSignature(), methodSubSignature));
    basicBlock.addStmt(new ArkReturnStmt(thisLocal));

    const cfg = new Cfg();
    cfg.addBlock(basicBlock);
    cfg.setStartingStmt(basicBlock.getHead()!);
    cfg.setDeclaringMethod(defaultConstructor);
    cfg.getStmts().forEach(s => s.setCfg(cfg));

    defaultConstructor.setBody(new ArkBody(locals, cfg));
    checkAndUpdateCxxMethod(defaultConstructor, arkClass);
    arkClass.addMethod(defaultConstructor);

    return true;
}

export function buildInitMethod(initMethod: ArkMethod, fieldInitializerStmts: Stmt[], thisLocal: Local): void {
    const classType = new ClassType(initMethod.getDeclaringArkClass().getSignature());
    const assignStmt = new ArkAssignStmt(thisLocal, new ArkThisRef(classType));
    const block = new BasicBlock();
    block.setId(0);
    block.addStmt(assignStmt);
    const locals: Set<Local> = new Set([thisLocal]);
    for (const stmt of fieldInitializerStmts) {
        block.addStmt(stmt);
        if (stmt.getDef() && stmt.getDef() instanceof Local) {
            locals.add(stmt.getDef() as Local);
        }
    }
    block.addStmt(new ArkReturnVoidStmt());
    const cfg = new Cfg();
    cfg.addBlock(block);
    for (const stmt of block.getStmts()) {
        stmt.setCfg(cfg);
    }
    cfg.setStartingStmt(assignStmt);
    cfg.buildDefUseStmt(locals);
    cfg.setDeclaringMethod(initMethod);
    initMethod.setBody(new ArkBody(locals, cfg));
}

export function addInitInConstructor(constructor: ArkMethod): void {
    const thisLocal = constructor.getBody()?.getLocals().get(THIS_NAME);
    if (!thisLocal) {
        return;
    }
    const cfg = constructor.getCfg();
    if (cfg === undefined) {
        return;
    }
    const blocks = constructor.getCfg()?.getBlocks();
    if (!blocks) {
        return;
    }
    const firstBlockStmts = [...blocks][0].getStmts();
    let index = 0;
    for (let i = 0; i < firstBlockStmts.length; i++) {
        const stmt = firstBlockStmts[i];
        if (
            (stmt.getDef() instanceof Local && (stmt.getDef() as Local).getName() === THIS_NAME) ||
            (stmt instanceof ArkInvokeStmt && stmt.getInvokeExpr().getMethodSignature().getMethodSubSignature().getMethodName() === CONSTRUCTOR_NAME)
        ) {
            index = i + 1;
        }
    }
    let initInvokeStmt: ArkInvokeStmt;
    try {
        initInvokeStmt = new ArkInvokeStmt(new ArkInstanceInvokeExpr(thisLocal, constructor.getDeclaringArkClass().getInstanceInitMethod().getSignature(), []));
    } catch (e) {
        logger.warn('addInitInConstructor: failed to build initInvokeStmt due to exception: ', e);
        return;
    }
    if (initInvokeStmt) {
        initInvokeStmt.setCfg(cfg);
        firstBlockStmts.splice(index, 0, initInvokeStmt);
    }
}

export function isMethodImplementation(node: CxxAstNode): boolean {
    switch (node.kind) {
        case 'LambdaExpr':
            return (node.inner && node.inner.length > 0);
        case 'CXXMethodDecl':
        case 'CXXConstructorDecl':
        case 'CXXDestructorDecl':
        case 'FunctionDecl':
        case 'FunctionTemplateDecl':
        case 'FriendDecl':
            // CXXConstructorDecl-CXXCtorInitializer: using Base::Base
            // ==> The constructor of the subclass has the same implementation as that of the parent class.
            return !!node.inner?.find((inn: CxxAstNode) =>
                (inn.kind === 'CompoundStmt' || inn.kind === 'CXXCtorInitializer')
            );
        default:
            return false;
    }
}
