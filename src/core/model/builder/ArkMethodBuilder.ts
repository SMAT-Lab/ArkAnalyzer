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

import { ClassType, Type, UnknownType } from '../../base/Type';
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
} from './builderUtils';
import Logger, { LOG_MODULE_TYPE } from '../../../utils/logger';
import { ArkParameterRef, ArkThisRef, ClosureFieldRef } from '../../base/Ref';
import { ArkBody } from '../ArkBody';
import { Cfg } from '../../graph/Cfg';
import { ArkInstanceInvokeExpr } from '../../base/Expr';
import { MethodSignature, MethodSubSignature } from '../ArkSignature';
import { ArkAssignStmt, ArkInvokeStmt, ArkReturnStmt, ArkReturnVoidStmt, Stmt } from '../../base/Stmt';
import { BasicBlock } from '../../graph/BasicBlock';
import { Local } from '../../base/Local';
import { Value } from '../../base/Value';
import { CONSTRUCTOR_NAME, SUPER_NAME, THIS_NAME } from '../../common/TSConst';
import {
    ANONYMOUS_METHOD_PREFIX,
    CALL_SIGNATURE_NAME,
    DEFAULT_ARK_CLASS_NAME,
    DEFAULT_ARK_METHOD_NAME,
    GETTER_PREFIX,
    NAME_DELIMITER,
    NAME_PREFIX,
    SETTER_PREFIX
} from '../../common/Const';
import { ArkSignatureBuilder } from './ArkSignatureBuilder';
import { IRUtils } from '../../common/IRUtils';
import { ArkErrorCode } from '../../common/ArkError';
import { FullPosition } from '../../base/Position';

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

export function buildDefaultArkMethodFromArkClass(declaringClass: ArkClass, mtd: ArkMethod, sourceFile: ts.SourceFile, node?: ts.ModuleDeclaration): void {
    mtd.setDeclaringArkClass(declaringClass);

    const methodSubSignature = ArkSignatureBuilder.buildMethodSubSignatureFromMethodName(DEFAULT_ARK_METHOD_NAME, true);
    const methodSignature = new MethodSignature(mtd.getDeclaringArkClass().getSignature(), methodSubSignature);
    mtd.setImplementationSignature(methodSignature);
    mtd.setLineCol(0);

    const defaultMethodNode = node ? node : sourceFile;

    let bodyBuilder = new BodyBuilder(mtd.getSignature(), defaultMethodNode, mtd, sourceFile);
    mtd.setBodyBuilder(bodyBuilder);
}

export function buildArkMethodFromArkClass(
    methodNode: MethodLikeNode,
    declaringClass: ArkClass,
    mtd: ArkMethod,
    sourceFile: ts.SourceFile,
    declaringMethod?: ArkMethod
): void {
    mtd.setDeclaringArkClass(declaringClass);
    if (declaringMethod !== undefined && !declaringMethod.isGenerated() && !declaringMethod.isDefaultArkMethod()) {
        // If declaringMethod is %dflt, %instInit, %statInit, then the method should be taken as nested method of them.
        // Otherwise, it will fail to handle global vars of this method or failed to do the free of bodyBuilder.
        mtd.setOuterMethod(declaringMethod);
    }

    ts.isFunctionDeclaration(methodNode) && mtd.setAsteriskToken(methodNode.asteriskToken !== undefined);

    // All MethodLikeNode except FunctionTypeNode have questionToken.
    !ts.isFunctionTypeNode(methodNode) && mtd.setQuestionToken(methodNode.questionToken !== undefined);

    mtd.setCode(methodNode.getText(sourceFile));
    mtd.setModifiers(buildModifiers(methodNode));
    mtd.setDecorators(buildDecorators(methodNode, sourceFile));

    if (methodNode.typeParameters) {
        mtd.setGenericTypes(buildTypeParameters(methodNode.typeParameters, sourceFile, mtd));
    }

    // build methodDeclareSignatures and methodSignature as well as corresponding positions
    const methodName = buildMethodName(methodNode, declaringClass, sourceFile, declaringMethod);
    const methodParameters: MethodParameter[] = [];
    let paramsPosition: Map<string, FullPosition> = new Map<string, FullPosition>();
    buildParameters(methodNode.parameters, mtd, sourceFile, paramsPosition).forEach(parameter => {
        buildGenericType(parameter.getType(), mtd);
        methodParameters.push(parameter);
    });
    let returnType = UnknownType.getInstance();
    if (methodNode.type) {
        returnType = buildGenericType(buildReturnType(methodNode.type, sourceFile, mtd), mtd);
    }
    const methodSubSignature = new MethodSubSignature(methodName, methodParameters, returnType, mtd.isStatic());
    const methodSignature = new MethodSignature(mtd.getDeclaringArkClass().getSignature(), methodSubSignature);
    const { line, character } = ts.getLineAndCharacterOfPosition(sourceFile, methodNode.getStart(sourceFile));
    if (isMethodImplementation(methodNode)) {
        mtd.setImplementationSignature(methodSignature);
        mtd.setLine(line + 1);
        mtd.setColumn(character + 1);
        let bodyBuilder = new BodyBuilder(mtd.getSignature(), methodNode, mtd, sourceFile);
        bodyBuilder.setParamsPositions(paramsPosition);
        mtd.setBodyBuilder(bodyBuilder);
    } else {
        mtd.setDeclareSignatures(methodSignature);
        mtd.setDeclareLinesAndCols([line + 1], [character + 1]);
    }

    if (mtd.hasBuilderDecorator()) {
        mtd.setViewTree(buildViewTree(mtd));
    } else if (declaringClass.hasComponentDecorator() && mtd.getSubSignature().toString() === 'build()' && !mtd.isStatic()) {
        declaringClass.setViewTree(buildViewTree(mtd));
    }
    checkAndUpdateMethod(mtd, declaringClass);
    declaringClass.addMethod(mtd);
    IRUtils.setComments(mtd, methodNode, sourceFile, mtd.getDeclaringArkFile().getScene().getOptions());
}

function buildMethodName(node: MethodLikeNode, declaringClass: ArkClass, sourceFile: ts.SourceFile, declaringMethod?: ArkMethod): string {
    let name: string = '';
    if (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node)) {
        name = node.name ? node.name.text : buildAnonymousMethodName(node, declaringClass);
    } else if (ts.isFunctionTypeNode(node)) {
        //TODO: check name type
        name = node.name ? node.name.getText(sourceFile) : buildAnonymousMethodName(node, declaringClass);
    } else if (ts.isMethodDeclaration(node) || ts.isMethodSignature(node)) {
        if (ts.isIdentifier(node.name)) {
            name = (node.name as ts.Identifier).text;
        } else if (ts.isComputedPropertyName(node.name)) {
            if (ts.isIdentifier(node.name.expression)) {
                name = node.name.expression.text;
            } else if (ts.isPropertyAccessExpression(node.name.expression)) {
                name = handlePropertyAccessExpression(node.name.expression);
            } else {
                logger.warn('Other method ComputedPropertyName found!');
            }
        } else {
            logger.warn('Other method declaration type found!');
        }
    }
    //TODO, hard code
    else if (ts.isConstructorDeclaration(node)) {
        name = CONSTRUCTOR_NAME;
    } else if (ts.isConstructSignatureDeclaration(node)) {
        name = 'construct-signature';
    } else if (ts.isCallSignatureDeclaration(node)) {
        name = CALL_SIGNATURE_NAME;
    } else if (ts.isGetAccessor(node) && ts.isIdentifier(node.name)) {
        name = GETTER_PREFIX + node.name.text;
    } else if (ts.isSetAccessor(node) && ts.isIdentifier(node.name)) {
        name = SETTER_PREFIX + node.name.text;
    } else if (ts.isArrowFunction(node)) {
        name = buildAnonymousMethodName(node, declaringClass);
    }

    if (declaringMethod !== undefined && !declaringMethod.isDefaultArkMethod()) {
        name = buildNestedMethodName(name, declaringMethod.getName());
    }
    return name;
}

function buildAnonymousMethodName(node: MethodLikeNode, declaringClass: ArkClass): string {
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
    private restFlag: boolean = false;
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

    public isRest(): boolean {
        return this.restFlag;
    }

    public setRestFlag(restFlag: boolean): void {
        this.restFlag = restFlag;
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
        const superInvokeExpr = new ArkInstanceInvokeExpr(thisLocal, superConstructor.getSignature(), parameterArgs);
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
    const firstBlockStmts = cfg.getStartingBlock()!.getStmts();
    let index = 0;
    for (let i = 0; i < firstBlockStmts.length; i++) {
        const stmt = firstBlockStmts[i];
        if (stmt instanceof ArkInvokeStmt && stmt.getInvokeExpr().getMethodSignature().getMethodSubSignature().getMethodName() === CONSTRUCTOR_NAME) {
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

export function isMethodImplementation(node: MethodLikeNode): boolean {
    if (
        ts.isFunctionDeclaration(node) ||
        ts.isMethodDeclaration(node) ||
        ts.isConstructorDeclaration(node) ||
        ts.isGetAccessorDeclaration(node) ||
        ts.isSetAccessorDeclaration(node) ||
        ts.isFunctionExpression(node) ||
        ts.isArrowFunction(node)
    ) {
        if (node.body !== undefined) {
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

export function replaceSuper2Constructor(constructor: ArkMethod): void {
    if (constructor.getName() !== CONSTRUCTOR_NAME) {
        return;
    }
    const superClass = constructor.getDeclaringArkClass().getSuperClass();
    if (superClass === null) {
        return;
    }
    const superConstructor = superClass.getMethodWithName(CONSTRUCTOR_NAME);
    if (superConstructor === null) {
        if (needDefaultConstructorInClass(superClass)) {
            logger.error(`Can not find constructor method for class ${superClass.getSignature().toString()}`);
        }
        return;
    }
    const startingBlock = constructor.getBody()?.getCfg().getStartingBlock();
    if (startingBlock === undefined) {
        return;
    }
    for (const stmt of startingBlock.getStmts()) {
        if (stmt instanceof ArkInvokeStmt) {
            let invokeExpr = stmt.getInvokeExpr();
            const methodSignature = invokeExpr.getMethodSignature();
            if (methodSignature.getMethodSubSignature().getMethodName() !== SUPER_NAME) {
                continue;
            }
            let base = constructor.getBody()?.getLocals().get(THIS_NAME);
            if (base === undefined) {
                logger.error(`Can not find local this in constructor method ${constructor.getSignature().toString()}`);
                return;
            }

            const newInvokeExpr = new ArkInstanceInvokeExpr(base, superConstructor.getSignature(), invokeExpr.getArgs());
            stmt.replaceInvokeExpr(newInvokeExpr);
            return;
        }
    }
}
