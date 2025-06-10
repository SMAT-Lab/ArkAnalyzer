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

import { ClassType, GenericType, Type, UnknownType } from '../../base/Type';
import { BodyBuilder } from './BodyBuilder';
import { buildViewTree } from '../../graph/builder/ViewTreeBuilder';
import { ArkClass, ClassCategory } from '../ArkClass';
import { ArkMethod } from '../ArkMethod';
import ts from 'ohos-typescript';
import {
    buildDecorators,
    buildGenericType,
    buildModifiers,
    buildParameters,
    buildReturnType,
    buildTypeParameters,
    handlePropertyAccessExpression,
    cppNode2Type,
} from './builderUtils';
import Logger, { LOG_MODULE_TYPE } from '../../../utils/logger';
import { ArkParameterRef, ArkThisRef, ClosureFieldRef } from '../../base/Ref';
import { ArkBody } from '../ArkBody';
import { Cfg } from '../../graph/Cfg';
import { ArkInstanceInvokeExpr, ArkStaticInvokeExpr } from '../../base/Expr';
import { MethodSignature, MethodSubSignature } from '../ArkSignature';
import { ArkAssignStmt, ArkInvokeStmt, ArkReturnStmt, ArkReturnVoidStmt, Stmt } from '../../base/Stmt';
import { BasicBlock } from '../../graph/BasicBlock';
import { Local } from '../../base/Local';
import { Value } from '../../base/Value';
import { CONSTRUCTOR_NAME, SUPER_NAME, THIS_NAME } from '../../common/TSConst';
import { ANONYMOUS_METHOD_PREFIX, CALL_SIGNATURE_NAME, DEFAULT_ARK_CLASS_NAME, DEFAULT_ARK_METHOD_NAME, NAME_DELIMITER, NAME_PREFIX } from '../../common/Const';
import { ArkSignatureBuilder } from './ArkSignatureBuilder';
import { IRUtils } from '../../common/IRUtils';
import { ArkErrorCode } from '../../common/ArkError';
import { de } from 'typedoc-plugin-markdown/dist/internationalization';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'ArkMethodBuilder');

export type MethodLikeNode =
    | ts.FunctionDeclaration
    | ts.MethodDeclaration
    | ts.ConstructorDeclaration
    | ts.ArrowFunction
    | ts.AccessorDeclaration
    | ts.FunctionExpression
    | ts.MethodSignature
    | ts.ConstructSignatureDeclaration
    | ts.CallSignatureDeclaration
    | ts.FunctionTypeNode;

export function buildDefaultArkMethodFromArkClass(declaringClass: ArkClass, mtd: ArkMethod, sourceFile: any, node?:any): void {
    mtd.setDeclaringArkClass(declaringClass);

    const methodSubSignature = ArkSignatureBuilder.buildMethodSubSignatureFromMethodName(DEFAULT_ARK_METHOD_NAME, true);
    const methodSignature = new MethodSignature(mtd.getDeclaringArkClass().getSignature(), methodSubSignature);
    mtd.setImplementationSignature(methodSignature);
    mtd.setLineCol(0);

    const defaultMethodNode = node ? node : sourceFile;

    let bodyBuilder = new BodyBuilder(mtd.getSignature(), defaultMethodNode, mtd, sourceFile);
    mtd.setBodyBuilder(bodyBuilder);
}

function getSpecificNodes(methodNode:any, targetNode:string): any[]{
    if (!methodNode || !methodNode.inner){
        return [];
    }
    // 处理 Cpp 的lambda函数
    if(!['FunctionDecl', 'CXXMethodDecl','CXXConstructorDecl', 'CXXDestructorDecl', 'FriendDecl', 'LambdaExpr',
    'FunctionTemplate'].includes(methodNode.kind) && methodNode.inner){
        return getSpecificNodes(methodNode.inner[0], targetNode);
    }
    let result: any[] = [];
    methodNode.inner.forEach((childNode:any) => {
        if (childNode.kind.toString() === targetNode){
            result.push(childNode);
        }
    });
    return result.length>0?result:[];
}

export function handleFunctionTemplate(methodNode:any, mtd:ArkMethod, sourceFile:any, node?:any){
    if (methodNode.kind !== 'FunctionTemplate'){
        return;
    }
    mtd.isGenericsMethod();
    let templateTypesArray = [];
    for (const innerNode of methodNode.inner){
        if (innerNode.kind !== 'TemplateTypeParameter'){
            continue;
        }
        let typename = innerNode.name;
        let defaultType;
        if (innerNode.inner && innerNode.inner.length > 0){
            innerNode.default = innerNode.inner[0].type.qualType;
        }
        if (innerNode.default){
            defaultType = cppNode2Type(innerNode.default, sourceFile, mtd);
        }
        let templateType = new GenericType(typename, defaultType);
        templateTypesArray.push(templateType);
    }
    mtd.setGenericTypes(templateTypesArray);
}


export function buildArkMethodFromArkClass(
    methodNode: any,
    declaringClass: ArkClass,
    mtd: ArkMethod,
    sourceFile: any,
    declaringMethod?: ArkMethod
): void {
    mtd.setDeclaringArkClass(declaringClass);
    declaringMethod !== undefined && mtd.setOuterMethod(declaringMethod);
    // 判断是否是生产器式函数
    if (methodNode.kind === 'FunctionDecl' || methodNode.kind === 'FunctionTemplate'){
        mtd.setAsteriskToken(false);
    }
    handleFunctionTemplate(methodNode, mtd, sourceFile);

    mtd.setCode(methodNode.code);
    mtd.setModifiers(buildModifiers(methodNode));
    if (methodNode.kind === 'FriendDecl' && methodNode.inner.length > 0){
        methodNode = methodNode.inner[0];
    }


    // build methodDeclareSignatures and methodSignature as well as corresponding positions
    const methodName = buildMethodName(methodNode, declaringClass, sourceFile, declaringMethod);
    const methodParameters: MethodParameter[] = [];
    const parameters = getSpecificNodes(methodNode, 'ParmDecl');

    buildParameters(parameters, mtd, sourceFile).forEach(parameter => {
        buildGenericType(parameter.getType(), mtd);
        methodParameters.push(parameter);
    });
    let returnType = UnknownType.getInstance();
    if (methodNode.type) {
        returnType = buildGenericType(buildReturnType(methodNode, sourceFile, mtd), mtd);
    }
    const methodSubSignature = new MethodSubSignature(methodName, methodParameters, returnType, mtd.isStatic());
    const methodSignature = new MethodSignature(mtd.getDeclaringArkClass().getSignature(), methodSubSignature);
    const line = methodNode.loc?methodNode.loc.line : methodNode.range.begin.line;
    const character = methodNode.loc ? methodNode.loc.col : methodNode.range.begin.col;
    if (isMethodImplementation(methodNode)) {
        mtd.setImplementationSignature(methodSignature);
        mtd.setLine(line);
        mtd.setColumn(character);
    } else {
        mtd.setDeclareSignatures(methodSignature);
        mtd.setDeclareLinesAndCols([line + 1], [character + 1]);
    }

    let bodyBuilder = new BodyBuilder(mtd.getSignature(), methodNode, mtd, sourceFile);
    mtd.setBodyBuilder(bodyBuilder);

    if (mtd.hasBuilderDecorator()) {
        mtd.setViewTree(buildViewTree(mtd));
    } else if (declaringClass.hasComponentDecorator() && mtd.getSubSignature().toString() === 'build()' && !mtd.isStatic()) {
        declaringClass.setViewTree(buildViewTree(mtd));
    }
    checkAndUpdateMethod(mtd, declaringClass);
    declaringClass.addMethod(mtd);
    IRUtils.setComments(mtd, methodNode, sourceFile, mtd.getDeclaringArkFile().getScene().getOptions());
}

function buildMethodName(node: any, declaringClass: ArkClass, sourceFile: any, declaringMethod?: ArkMethod): string {
    let name: string = '';
    let declType = node.kind.toString();
    switch (declType) {
        case 'CXXMethodDecl':
        case 'FunctionDecl':
        case 'CXXDestructorDecl':
        case 'FunctionTemplate':
            name = node.name.toString();
            break;
        case 'CXXConstructorDecl':
            name = 'constructor';
            break;
        case 'LambdaExpr':
            name = buildAnonymousMethodName(node, declaringClass);
            break;
        default:
            break;
    }


    if (declaringMethod !== undefined && !declaringMethod.isDefaultArkMethod()) {
        name = buildNestedMethodName(name, declaringMethod.getName());
    }
    return name;
}

function buildAnonymousMethodName(node: any, declaringClass: ArkClass): string {
    return `${ANONYMOUS_METHOD_PREFIX}${declaringClass.getAnonymousMethodNumber()}`;
}

function buildNestedMethodName(originName: string, declaringMethodName: string): string {
    if (originName.startsWith(NAME_PREFIX)) {
        return `${originName}${NAME_DELIMITER}${declaringMethodName}`;
    }
    return `${NAME_PREFIX}${originName}${NAME_DELIMITER}${declaringMethodName}`;
}

export class ObjectBindingPatternParameter {
    private propertyName: string = '';
    private name: string = '';
    private optional: boolean = false;

    constructor() {}

    public getName(): string {
        return this.name;
    }

    public setName(name: string): void {
        this.name = name;
    }

    public getPropertyName(): string {
        return this.propertyName;
    }

    public setPropertyName(propertyName: string): void {
        this.propertyName = propertyName;
    }

    public isOptional(): boolean {
        return this.optional;
    }

    public setOptional(optional: boolean): void {
        this.optional = optional;
    }
}

export class ArrayBindingPatternParameter {
    private propertyName: string = '';
    private name: string = '';
    private optional: boolean = false;

    constructor() {}

    public getName(): string {
        return this.name;
    }

    public setName(name: string): void {
        this.name = name;
    }

    public getPropertyName(): string {
        return this.propertyName;
    }

    public setPropertyName(propertyName: string): void {
        this.propertyName = propertyName;
    }

    public isOptional(): boolean {
        return this.optional;
    }

    public setOptional(optional: boolean): void {
        this.optional = optional;
    }
}

export class MethodParameter implements Value {
    private name: string = '';
    private type!: Type;
    private optional: boolean = false;
    private dotDotDotToken: boolean = false;
    private objElements: ObjectBindingPatternParameter[] = [];
    private arrayElements: ArrayBindingPatternParameter[] = [];

    constructor() {}

    public getName(): string {
        return this.name;
    }

    public setName(name: string): void {
        this.name = name;
    }

    public getType(): Type {
        return this.type;
    }

    public setType(type: Type): void {
        this.type = type;
    }

    public isOptional(): boolean {
        return this.optional;
    }

    public setOptional(optional: boolean): void {
        this.optional = optional;
    }

    public hasDotDotDotToken(): boolean {
        return this.dotDotDotToken;
    }

    public setDotDotDotToken(dotDotDotToken: boolean): void {
        this.dotDotDotToken = dotDotDotToken;
    }

    public addObjElement(element: ObjectBindingPatternParameter): void {
        this.objElements.push(element);
    }

    public getObjElements(): ObjectBindingPatternParameter[] {
        return this.objElements;
    }

    public setObjElements(objElements: ObjectBindingPatternParameter[]): void {
        this.objElements = objElements;
    }

    public addArrayElement(element: ArrayBindingPatternParameter): void {
        this.arrayElements.push(element);
    }

    public getArrayElements(): ArrayBindingPatternParameter[] {
        return this.arrayElements;
    }

    public setArrayElements(arrayElements: ArrayBindingPatternParameter[]): void {
        this.arrayElements = arrayElements;
    }

    public getUses(): Value[] {
        return [];
    }
}

function needDefaultConstructorInClass(arkClass: ArkClass): boolean {
    const originClassType = arkClass.getCategory();
    return (
        arkClass.getMethodWithName(CONSTRUCTOR_NAME) === null &&
        (originClassType === ClassCategory.CLASS || originClassType === ClassCategory.OBJECT) &&
        arkClass.getName() !== DEFAULT_ARK_CLASS_NAME &&
        !arkClass.isDeclare()
    );
}

function recursivelyCheckAndBuildSuperConstructor(arkClass: ArkClass): void {
    let superClass: ArkClass | null = arkClass.getSuperClass();
    while (superClass !== null) {
        if (superClass.getMethodWithName(CONSTRUCTOR_NAME) === null) {
            buildDefaultConstructor(superClass);
        }
        superClass = superClass.getSuperClass();
    }
}

export function buildDefaultConstructor(arkClass: ArkClass): boolean {
    if (!needDefaultConstructorInClass(arkClass)) {
        return false;
    }

    recursivelyCheckAndBuildSuperConstructor(arkClass);

    const defaultConstructor: ArkMethod = new ArkMethod();
    defaultConstructor.setDeclaringArkClass(arkClass);
    defaultConstructor.setCode('');
    defaultConstructor.setIsGeneratedFlag(true);
    defaultConstructor.setLineCol(0);

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
            index++;
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
    checkAndUpdateMethod(defaultConstructor, arkClass);
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
    const blocks = cfg.getBlocks();
    const firstBlockStmts = [...blocks][0].getStmts();
    let index = 0;
    for (let i = 0; i < firstBlockStmts.length; i++) {
        const stmt = firstBlockStmts[i];
        if (stmt instanceof ArkInvokeStmt && stmt.getInvokeExpr().getMethodSignature().getMethodSubSignature().getMethodName() === SUPER_NAME) {
            index++;
            continue;
        }
        if (stmt instanceof ArkAssignStmt) {
            const rightOp = stmt.getRightOp();
            if (rightOp instanceof ArkParameterRef || rightOp instanceof ArkThisRef || rightOp instanceof ClosureFieldRef) {
                index++;
                continue;
            }
        }
        break;
    }
    const initInvokeStmt = new ArkInvokeStmt(
        new ArkInstanceInvokeExpr(thisLocal, constructor.getDeclaringArkClass().getInstanceInitMethod().getSignature(), [])
    );
    initInvokeStmt.setCfg(cfg);
    firstBlockStmts.splice(index, 0, initInvokeStmt);
}

export function isMethodImplementation(node: any): boolean {
    if (node.kind === 'CXXMethodDecl' || node.kind === 'LambdaExpr'){
        if (node.inner && node.inner.length > 0){
            return true;
        }
    } else if (node.kind.toString() == 'CXXConstructorDecl'){
        if (node.inner.find((inn:any) => inn.kind.toString() === 'CompoundStmt')){
            return true;
        }
    }
    return false;
}

export function checkAndUpdateMethod(method: ArkMethod, cls: ArkClass): void {
    let presentMethod: ArkMethod | null;
    if (method.isStatic()) {
        presentMethod = cls.getStaticMethodWithName(method.getName());
    } else {
        presentMethod = cls.getMethodWithName(method.getName());
    }
    if (presentMethod === null) {
        return;
    }

    if (method.validate().errCode !== ArkErrorCode.OK || presentMethod.validate().errCode !== ArkErrorCode.OK) {
        return;
    }
    const presentDeclareSignatures = presentMethod.getDeclareSignatures();
    const presentDeclareLineCols = presentMethod.getDeclareLineCols();
    const presentImplSignature = presentMethod.getImplementationSignature();
    const newDeclareSignature = method.getDeclareSignatures();
    const newDeclareLineCols = method.getDeclareLineCols();
    const newImplSignature = method.getImplementationSignature();

    if (presentDeclareSignatures !== null && presentImplSignature === null) {
        if (newDeclareSignature === null || presentMethod.getDeclareSignatureIndex(newDeclareSignature[0]) >= 0) {
            method.setDeclareSignatures(presentDeclareSignatures);
            method.setDeclareLineCols(presentDeclareLineCols as number[]);
        } else {
            method.setDeclareSignatures(presentDeclareSignatures.concat(newDeclareSignature));
            method.setDeclareLineCols((presentDeclareLineCols as number[]).concat(newDeclareLineCols as number[]));
        }
        return;
    }
    if (presentDeclareSignatures === null && presentImplSignature !== null) {
        if (newImplSignature === null) {
            method.setImplementationSignature(presentImplSignature);
            method.setLineCol(presentMethod.getLineCol() as number);
        }
        return;
    }
}
