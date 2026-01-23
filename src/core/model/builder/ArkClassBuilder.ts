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

import { ArkField, FieldCategory } from '../ArkField';
import { ArkFile } from '../ArkFile';
import { ArkMethod } from '../ArkMethod';
import { ArkNamespace } from '../ArkNamespace';
import Logger, { LOG_MODULE_TYPE } from '../../../utils/logger';
import ts, { ClassElement, EnumMember, ParameterDeclaration, TypeElement } from 'ohos-typescript';
import { ArkClass, ClassCategory } from '../ArkClass';
import {
    buildArkMethodFromArkClass,
    buildDefaultArkMethodFromArkClass,
    buildInitMethod,
    checkAndUpdateMethod
} from './ArkMethodBuilder';
import {
    buildDecorators,
    buildGenericType,
    buildHeritageClauses,
    buildModifiers,
    buildTypeParameters,
    tsNode2Type
} from './builderUtils';
import { buildIndexSignature2ArkField, buildProperty2ArkField } from './ArkFieldBuilder';
import { ArkIRTransformer } from '../../common/ArkIRTransformer';
import { ArkAssignStmt, ArkInvokeStmt, Stmt } from '../../base/Stmt';
import { ArkInstanceFieldRef } from '../../base/Ref';
import {
    ANONYMOUS_CLASS_DELIMITER,
    ANONYMOUS_CLASS_PREFIX,
    DEFAULT_ARK_CLASS_NAME,
    INSTANCE_INIT_METHOD_NAME, NESTED_CLASS_METHOD_DELIMITER,
    STATIC_BLOCK_METHOD_NAME_PREFIX,
    STATIC_INIT_METHOD_NAME,
} from '../../common/Const';
import { IRUtils } from '../../common/IRUtils';
import { ClassSignature, FieldSignature, MethodSignature, MethodSubSignature } from '../ArkSignature';
import { ArkSignatureBuilder } from './ArkSignatureBuilder';
import { FullPosition, LineColPosition } from '../../base/Position';
import { Type, UnknownType, VoidType } from '../../base/Type';
import { BodyBuilder } from './BodyBuilder';
import { ArkNormalBinopExpr, ArkStaticInvokeExpr, NormalBinaryOperator } from '../../base/Expr';
import { ModifierType } from '../ArkBaseModel';
import { Value } from '../../base/Value';
import { NumberConstant } from '../../base/Constant';
import { ValueUtil } from '../../common/ValueUtil';
import { Local } from '../../base/Local';
import { ArkMetadataKind, EnumInitTypeUserMetadata } from '../ArkMetadata';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'ArkClassBuilder');

export type ClassLikeNode =
    | ts.ClassDeclaration
    | ts.InterfaceDeclaration
    | ts.EnumDeclaration
    | ts.ClassExpression
    | ts.TypeLiteralNode
    | ts.StructDeclaration
    | ts.ObjectLiteralExpression;

type ClassLikeNodeWithMethod =
    | ts.ClassDeclaration
    | ts.InterfaceDeclaration
    | ts.EnumDeclaration
    | ts.ClassExpression
    | ts.TypeLiteralNode
    | ts.StructDeclaration;

export function buildDefaultArkClassFromArkFile(arkFile: ArkFile, defaultClass: ArkClass, astRoot: ts.SourceFile): void {
    defaultClass.setDeclaringArkFile(arkFile);
    defaultClass.setCategory(ClassCategory.CLASS);
    buildDefaultArkClass(defaultClass, astRoot);
}

export function buildDefaultArkClassFromArkNamespace(
    arkNamespace: ArkNamespace,
    defaultClass: ArkClass,
    nsNode: ts.ModuleDeclaration,
    sourceFile: ts.SourceFile
): void {
    defaultClass.setDeclaringArkNamespace(arkNamespace);
    defaultClass.setDeclaringArkFile(arkNamespace.getDeclaringArkFile());
    buildDefaultArkClass(defaultClass, sourceFile, nsNode);
}

export function buildNormalArkClassFromArkMethod(clsNode: ClassLikeNode, cls: ArkClass, sourceFile: ts.SourceFile, declaringMethod?: ArkMethod): void {
    const namespace = cls.getDeclaringArkNamespace();
    if (namespace) {
        buildNormalArkClassFromArkNamespace(clsNode, namespace, cls, sourceFile, declaringMethod);
    } else {
        buildNormalArkClassFromArkFile(clsNode, cls.getDeclaringArkFile(), cls, sourceFile, declaringMethod);
    }
}

export function buildNormalArkClassFromArkFile(
    clsNode: ClassLikeNode,
    arkFile: ArkFile,
    cls: ArkClass,
    sourceFile: ts.SourceFile,
    declaringMethod?: ArkMethod
): void {
    cls.setDeclaringArkFile(arkFile);
    cls.setCode(clsNode.getText(sourceFile));
    const { line, character } = ts.getLineAndCharacterOfPosition(sourceFile, clsNode.getStart(sourceFile));
    cls.setLine(line + 1);
    cls.setColumn(character + 1);

    buildNormalArkClass(clsNode, cls, sourceFile, declaringMethod);
    arkFile.addArkClass(cls);
}

export function buildNormalArkClassFromArkNamespace(
    clsNode: ClassLikeNode,
    arkNamespace: ArkNamespace,
    cls: ArkClass,
    sourceFile: ts.SourceFile,
    declaringMethod?: ArkMethod
): void {
    cls.setDeclaringArkNamespace(arkNamespace);
    cls.setDeclaringArkFile(arkNamespace.getDeclaringArkFile());
    cls.setCode(clsNode.getText(sourceFile));
    const { line, character } = ts.getLineAndCharacterOfPosition(sourceFile, clsNode.getStart(sourceFile));
    cls.setLine(line + 1);
    cls.setColumn(character + 1);

    buildNormalArkClass(clsNode, cls, sourceFile, declaringMethod);
    arkNamespace.addArkClass(cls);
}

function buildDefaultArkClass(cls: ArkClass, sourceFile: ts.SourceFile, node?: ts.ModuleDeclaration): void {
    const defaultArkClassSignature = new ClassSignature(
        DEFAULT_ARK_CLASS_NAME,
        cls.getDeclaringArkFile().getFileSignature(),
        cls.getDeclaringArkNamespace()?.getSignature() || null
    );
    cls.setSignature(defaultArkClassSignature);

    genDefaultArkMethod(cls, sourceFile, node);
}

function genDefaultArkMethod(cls: ArkClass, sourceFile: ts.SourceFile, node?: ts.ModuleDeclaration): void {
    let defaultMethod = new ArkMethod();
    buildDefaultArkMethodFromArkClass(cls, defaultMethod, sourceFile, node);
    cls.setDefaultArkMethod(defaultMethod);
}

export function buildNormalArkClass(clsNode: ClassLikeNode, cls: ArkClass, sourceFile: ts.SourceFile, declaringMethod?: ArkMethod): void {
    switch (clsNode.kind) {
        case ts.SyntaxKind.StructDeclaration:
            buildStruct2ArkClass(clsNode, cls, sourceFile, declaringMethod);
            break;
        case ts.SyntaxKind.ClassDeclaration:
            buildClass2ArkClass(clsNode, cls, sourceFile, declaringMethod);
            break;
        case ts.SyntaxKind.ClassExpression:
            buildClass2ArkClass(clsNode, cls, sourceFile, declaringMethod);
            break;
        case ts.SyntaxKind.InterfaceDeclaration:
            buildInterface2ArkClass(clsNode, cls, sourceFile, declaringMethod);
            break;
        case ts.SyntaxKind.EnumDeclaration:
            buildEnum2ArkClass(clsNode, cls, sourceFile, declaringMethod);
            break;
        case ts.SyntaxKind.TypeLiteral:
            buildTypeLiteralNode2ArkClass(clsNode, cls, sourceFile, declaringMethod);
            break;
        case ts.SyntaxKind.ObjectLiteralExpression:
            buildObjectLiteralExpression2ArkClass(clsNode, cls, sourceFile, declaringMethod);
            break;
        default:
    }
    IRUtils.setComments(cls, clsNode, sourceFile, cls.getDeclaringArkFile().getScene().getOptions());
}

function init4InstanceInitMethod(cls: ArkClass): void {
    const instanceInit = new ArkMethod();
    instanceInit.setDeclaringArkClass(cls);
    instanceInit.setIsGeneratedFlag(true);
    const methodSubSignature = ArkSignatureBuilder.buildMethodSubSignatureFromMethodName(INSTANCE_INIT_METHOD_NAME);
    methodSubSignature.setReturnType(VoidType.getInstance());
    const methodSignature = new MethodSignature(instanceInit.getDeclaringArkClass().getSignature(), methodSubSignature);
    instanceInit.setImplementationSignature(methodSignature);
    instanceInit.setLineCol(0);

    checkAndUpdateMethod(instanceInit, cls);
    cls.addMethod(instanceInit);
    cls.setInstanceInitMethod(instanceInit);
}

function init4StaticInitMethod(cls: ArkClass): void {
    const staticInit = new ArkMethod();
    staticInit.setDeclaringArkClass(cls);
    staticInit.setIsGeneratedFlag(true);

    staticInit.setModifiers(ModifierType.STATIC);

    const methodSubSignature = ArkSignatureBuilder.buildMethodSubSignatureFromMethodName(STATIC_INIT_METHOD_NAME);
    methodSubSignature.setReturnType(VoidType.getInstance());
    const methodSignature = new MethodSignature(staticInit.getDeclaringArkClass().getSignature(), methodSubSignature);
    staticInit.setImplementationSignature(methodSignature);
    staticInit.setLineCol(0);

    checkAndUpdateMethod(staticInit, cls);
    cls.addMethod(staticInit);
    cls.setStaticInitMethod(staticInit);
}

function buildStruct2ArkClass(clsNode: ts.StructDeclaration, cls: ArkClass, sourceFile: ts.SourceFile, declaringMethod?: ArkMethod): void {
    const className = genClassName(clsNode.name ? clsNode.name.text : '', cls, declaringMethod);
    const classSignature = new ClassSignature(className, cls.getDeclaringArkFile().getFileSignature(), cls.getDeclaringArkNamespace()?.getSignature() || null);
    cls.setSignature(classSignature);

    if (clsNode.typeParameters) {
        buildTypeParameters(clsNode.typeParameters, sourceFile, cls).forEach(typeParameter => {
            cls.addGenericType(typeParameter);
        });
    }

    initHeritage(buildHeritageClauses(clsNode.heritageClauses), cls);

    cls.setModifiers(buildModifiers(clsNode));
    cls.setDecorators(buildDecorators(clsNode, sourceFile));

    cls.setCategory(ClassCategory.STRUCT);
    init4InstanceInitMethod(cls);
    init4StaticInitMethod(cls);
    buildArkClassMembers(clsNode, cls, sourceFile);
}

function buildClass2ArkClass(clsNode: ts.ClassDeclaration | ts.ClassExpression, cls: ArkClass, sourceFile: ts.SourceFile, declaringMethod?: ArkMethod): void {
    const className = genClassName(clsNode.name ? clsNode.name.text : '', cls, declaringMethod);
    const classSignature = new ClassSignature(className, cls.getDeclaringArkFile().getFileSignature(), cls.getDeclaringArkNamespace()?.getSignature() || null);
    cls.setSignature(classSignature);

    if (clsNode.typeParameters) {
        buildTypeParameters(clsNode.typeParameters, sourceFile, cls).forEach(typeParameter => {
            cls.addGenericType(typeParameter);
        });
    }

    initHeritage(buildHeritageClauses(clsNode.heritageClauses), cls);

    cls.setModifiers(buildModifiers(clsNode));
    cls.setDecorators(buildDecorators(clsNode, sourceFile));

    cls.setCategory(ClassCategory.CLASS);
    init4InstanceInitMethod(cls);
    init4StaticInitMethod(cls);
    buildArkClassMembers(clsNode, cls, sourceFile);
}

function initHeritage(heritageClauses: Map<string, string>, cls: ArkClass): void {
    let superName = '';
    for (let [key, value] of heritageClauses) {
        if (value === ts.SyntaxKind[ts.SyntaxKind.ExtendsKeyword]) {
            superName = key;
            break;
        }
    }
    cls.addHeritageClassName(superName);
    for (let key of heritageClauses.keys()) {
        cls.addHeritageClassName(key);
    }
}

function buildInterface2ArkClass(clsNode: ts.InterfaceDeclaration, cls: ArkClass, sourceFile: ts.SourceFile, declaringMethod?: ArkMethod): void {
    const className = genClassName(clsNode.name ? clsNode.name.text : '', cls, declaringMethod);
    const classSignature = new ClassSignature(className, cls.getDeclaringArkFile().getFileSignature(), cls.getDeclaringArkNamespace()?.getSignature() || null);
    cls.setSignature(classSignature);

    if (clsNode.typeParameters) {
        buildTypeParameters(clsNode.typeParameters, sourceFile, cls).forEach(typeParameter => {
            cls.addGenericType(typeParameter);
        });
    }

    initHeritage(buildHeritageClauses(clsNode.heritageClauses), cls);

    cls.setModifiers(buildModifiers(clsNode));
    cls.setDecorators(buildDecorators(clsNode, sourceFile));

    cls.setCategory(ClassCategory.INTERFACE);

    buildArkClassMembers(clsNode, cls, sourceFile);
}

function buildEnum2ArkClass(clsNode: ts.EnumDeclaration, cls: ArkClass, sourceFile: ts.SourceFile, declaringMethod?: ArkMethod): void {
    const className = genClassName(clsNode.name ? clsNode.name.text : '', cls, declaringMethod);
    const classSignature = new ClassSignature(className, cls.getDeclaringArkFile().getFileSignature(), cls.getDeclaringArkNamespace()?.getSignature() || null);
    cls.setSignature(classSignature);

    cls.setModifiers(buildModifiers(clsNode));
    cls.setDecorators(buildDecorators(clsNode, sourceFile));

    cls.setCategory(ClassCategory.ENUM);

    init4StaticInitMethod(cls);
    buildArkClassMembers(clsNode, cls, sourceFile);
}

function buildTypeLiteralNode2ArkClass(clsNode: ts.TypeLiteralNode, cls: ArkClass, sourceFile: ts.SourceFile, declaringMethod?: ArkMethod): void {
    const className = genClassName('', cls, declaringMethod);
    const classSignature = new ClassSignature(className, cls.getDeclaringArkFile().getFileSignature(), cls.getDeclaringArkNamespace()?.getSignature() || null);
    cls.setSignature(classSignature);

    cls.setCategory(ClassCategory.TYPE_LITERAL);
    if (ts.isTypeAliasDeclaration(clsNode.parent) && clsNode.parent.typeParameters) {
        buildTypeParameters(clsNode.parent.typeParameters, sourceFile, cls).forEach(typeParameter => {
            cls.addGenericType(typeParameter);
        });
    }
    buildArkClassMembers(clsNode, cls, sourceFile);
}

function buildObjectLiteralExpression2ArkClass(
    clsNode: ts.ObjectLiteralExpression,
    cls: ArkClass,
    sourceFile: ts.SourceFile,
    declaringMethod?: ArkMethod
): void {
    const className = genClassName('', cls, declaringMethod);
    const classSignature = new ClassSignature(className, cls.getDeclaringArkFile().getFileSignature(), cls.getDeclaringArkNamespace()?.getSignature() || null);
    cls.setSignature(classSignature);

    cls.setCategory(ClassCategory.OBJECT);

    let arkMethods: ArkMethod[] = [];

    init4InstanceInitMethod(cls);
    const instanceIRTransformer = new ArkIRTransformer(sourceFile, cls.getInstanceInitMethod());
    const instanceFieldInitializerStmts: Stmt[] = [];
    clsNode.properties.forEach(property => {
        if (ts.isPropertyAssignment(property) || ts.isShorthandPropertyAssignment(property) || ts.isSpreadAssignment(property)) {
            const arkField = buildProperty2ArkField(property, sourceFile, cls);
            if (ts.isPropertyAssignment(property)) {
                getInitStmts(instanceIRTransformer, arkField, property.initializer);
                arkField.getInitializer().forEach(stmt => instanceFieldInitializerStmts.push(stmt));
            }
        } else {
            let arkMethod = new ArkMethod();
            arkMethod.setDeclaringArkClass(cls);
            buildArkMethodFromArkClass(property, cls, arkMethod, sourceFile);
        }
    });
    buildInitMethod(cls.getInstanceInitMethod(), instanceFieldInitializerStmts, instanceIRTransformer.getThisLocal());
    arkMethods.forEach(mtd => {
        checkAndUpdateMethod(mtd, cls);
        cls.addMethod(mtd);
    });
}

function genClassName(declaringName: string, cls: ArkClass, declaringMethod?: ArkMethod): string {
    if (!declaringName) {
        const declaringArkNamespace = cls.getDeclaringArkNamespace();
        const num = declaringArkNamespace ? declaringArkNamespace.getAnonymousClassNumber() : cls.getDeclaringArkFile().getAnonymousClassNumber();
        declaringName = ANONYMOUS_CLASS_PREFIX + num;
    }
    const suffix = declaringMethod ? `${ANONYMOUS_CLASS_DELIMITER}${declaringMethod.getDeclaringArkClass().getName()}${NESTED_CLASS_METHOD_DELIMITER}${declaringMethod.getName()}` : '';
    return declaringName + suffix;
}

function buildArkClassMembers(clsNode: ClassLikeNode, cls: ArkClass, sourceFile: ts.SourceFile): void {
    if (ts.isObjectLiteralExpression(clsNode)) {
        return;
    }
    buildMethodsForClass(clsNode, cls, sourceFile);
    const staticBlockMethodSignatures = buildStaticBlocksForClass(clsNode, cls, sourceFile);
    let instanceIRTransformer: ArkIRTransformer;
    let staticIRTransformer: ArkIRTransformer;
    if (ts.isClassDeclaration(clsNode) || ts.isClassExpression(clsNode) || ts.isStructDeclaration(clsNode)) {
        instanceIRTransformer = new ArkIRTransformer(sourceFile, cls.getInstanceInitMethod());
        staticIRTransformer = new ArkIRTransformer(sourceFile, cls.getStaticInitMethod());
    }
    if (ts.isEnumDeclaration(clsNode)) {
        staticIRTransformer = new ArkIRTransformer(sourceFile, cls.getStaticInitMethod());
    }
    const staticInitStmts: Stmt[] = [];
    const instanceInitStmts: Stmt[] = [];
    let staticBlockId = 0;
    const enumFieldInfo = { lastFieldName: '', curValue: 0, isCurValueValid: true };
    clsNode.members.forEach(member => {
        if (isClassMethod(member)) {
            // these node types have been handled at the beginning of this function by calling buildMethodsForClass
            return;
        }
        if (ts.isPropertyDeclaration(member) || ts.isPropertySignature(member)) {
            const arkField = buildProperty2ArkField(member, sourceFile, cls);
            if (!ts.isClassDeclaration(clsNode) && !ts.isClassExpression(clsNode) && !ts.isStructDeclaration(clsNode)) {
                return;
            }
            if (arkField.isStatic()) {
                getInitStmts(staticIRTransformer, arkField, member.initializer);
                arkField.getInitializer().forEach(stmt => staticInitStmts.push(stmt));
                return;
            }
            if (!instanceIRTransformer) {
                console.log(clsNode.getText(sourceFile));
            }
            getInitStmts(instanceIRTransformer, arkField, member.initializer);
            arkField.getInitializer().forEach(stmt => instanceInitStmts.push(stmt));
            return;
        }
        if (ts.isEnumMember(member)) {
            const arkField = buildProperty2ArkField(member, sourceFile, cls);
            getInitStmts(staticIRTransformer, arkField, member.initializer, enumFieldInfo);
            arkField.getInitializer().forEach(stmt => staticInitStmts.push(stmt));
        } else if (ts.isIndexSignatureDeclaration(member)) {
            buildIndexSignature2ArkField(member, sourceFile, cls);
        } else if (ts.isClassStaticBlockDeclaration(member)) {
            const currStaticBlockMethodSig = staticBlockMethodSignatures[staticBlockId++];
            const staticBlockInvokeExpr = new ArkStaticInvokeExpr(currStaticBlockMethodSig, []);
            staticInitStmts.push(new ArkInvokeStmt(staticBlockInvokeExpr));
        } else if (ts.isSemicolonClassElement(member)) {
            logger.trace('Skip these members.');
        } else {
            logger.warn(`Please contact developers to support new member in class: ${cls.getSignature().toString()}, member: ${member.getText()}!`);
        }
    });
    if (ts.isClassDeclaration(clsNode) || ts.isClassExpression(clsNode) || ts.isStructDeclaration(clsNode)) {
        buildInitMethod(cls.getInstanceInitMethod(), instanceInitStmts, instanceIRTransformer!.getThisLocal());
        buildInitMethod(cls.getStaticInitMethod(), staticInitStmts, staticIRTransformer!.getThisLocal());
    }
    if (ts.isEnumDeclaration(clsNode)) {
        buildInitMethod(cls.getStaticInitMethod(), staticInitStmts, staticIRTransformer!.getThisLocal());
    }
}

function isClassMethod(member: ClassElement | TypeElement | EnumMember): boolean {
    return (ts.isMethodDeclaration(member) ||
        ts.isConstructorDeclaration(member) ||
        ts.isMethodSignature(member) ||
        ts.isConstructSignatureDeclaration(member) ||
        ts.isAccessor(member) ||
        ts.isCallSignatureDeclaration(member));
}

function buildMethodsForClass(clsNode: ClassLikeNodeWithMethod, cls: ArkClass, sourceFile: ts.SourceFile): void {
    clsNode.members.forEach(member => {
        if (
            ts.isMethodDeclaration(member) ||
            ts.isConstructorDeclaration(member) ||
            ts.isMethodSignature(member) ||
            ts.isConstructSignatureDeclaration(member) ||
            ts.isAccessor(member) ||
            ts.isCallSignatureDeclaration(member)
        ) {
            let mthd: ArkMethod = new ArkMethod();
            buildArkMethodFromArkClass(member, cls, mthd, sourceFile);
            if (ts.isConstructorDeclaration(member)) {
                buildParameterProperty2ArkField(member.parameters, cls, sourceFile);
            }
        }
    });
}

// params of constructor method may have modifiers such as public or private to directly define class properties with constructor
function buildParameterProperty2ArkField(params: ts.NodeArray<ParameterDeclaration>, cls: ArkClass, sourceFile: ts.SourceFile): void {
    if (params.length === 0) {
        return;
    }
    params.forEach(parameter => {
        let fieldName: string;
        if (ts.isIdentifier(parameter.name)) {
            fieldName = parameter.name.text;
        } else if (ts.isObjectBindingPattern(parameter.name)) {
            // TODO
            logger.warn(`Need to support param property with ObjectBindingPattern node type: ${cls.getSignature().toString()}!`);
            return;
        } else if (ts.isArrayBindingPattern(parameter.name)) {
            // TODO
            logger.warn(`Need to support param property with ArrayBindingPattern node type: ${cls.getSignature().toString()}!`);
            return;
        } else {
            logger.warn(`Need to support param property with new node type: ${cls.getSignature().toString()}!`);
            return;
        }
        if (parameter.modifiers === undefined || !ts.isIdentifier(parameter.name)) {
            return;
        }
        let field = new ArkField();
        field.setDeclaringArkClass(cls);

        field.setCode(parameter.getText(sourceFile));
        field.setCategory(FieldCategory.PARAMETER_PROPERTY);
        field.setOriginPosition(LineColPosition.buildFromNode(parameter, sourceFile));

        let fieldType: Type;
        if (parameter.type) {
            fieldType = buildGenericType(tsNode2Type(parameter.type, sourceFile, field), field);
        } else {
            fieldType = UnknownType.getInstance();
        }
        const fieldSignature = new FieldSignature(fieldName, cls.getSignature(), fieldType, false);
        field.setSignature(fieldSignature);
        field.setModifiers(buildModifiers(parameter));
        if (parameter.questionToken) {
            field.setQuestionToken(true);
        }
        cls.addField(field);
    });
}

function buildStaticBlocksForClass(clsNode: ClassLikeNodeWithMethod, cls: ArkClass, sourceFile: ts.SourceFile): MethodSignature[] {
    let staticInitBlockId = 0;
    const staticBlockMethodSignatures: MethodSignature[] = [];
    clsNode.members.forEach(member => {
        if (ts.isClassStaticBlockDeclaration(member)) {
            const staticBlockMethod = new ArkMethod();
            staticBlockMethod.setDeclaringArkClass(cls);
            staticBlockMethod.setIsGeneratedFlag(true);
            staticBlockMethod.setCode(member.getText(sourceFile));
            const methodName = STATIC_BLOCK_METHOD_NAME_PREFIX + staticInitBlockId++;
            const methodSubSignature = new MethodSubSignature(methodName, [], VoidType.getInstance(), true);
            const methodSignature = new MethodSignature(cls.getSignature(), methodSubSignature);
            staticBlockMethodSignatures.push(methodSignature);
            staticBlockMethod.setImplementationSignature(methodSignature);
            const { line, character } = ts.getLineAndCharacterOfPosition(sourceFile, member.getStart(sourceFile));
            staticBlockMethod.setLine(line + 1);
            staticBlockMethod.setColumn(character + 1);

            let bodyBuilder = new BodyBuilder(staticBlockMethod.getSignature(), member, staticBlockMethod, sourceFile);
            staticBlockMethod.setBodyBuilder(bodyBuilder);

            cls.addMethod(staticBlockMethod);
        }
    });
    return staticBlockMethodSignatures;
}

function getInitStmts(
    transformer: ArkIRTransformer,
    field: ArkField,
    initNode?: ts.Node,
    enumFieldInfo?: {
        lastFieldName: string,
        curValue: number,
        isCurValueValid: boolean
    }
): void {
    let initValue: Value;
    let initPositions;
    const stmts: Stmt[] = [];
    if (initNode) {
        let initStmts: Stmt[] = [];
        ({ value: initValue, valueOriginalPositions: initPositions, stmts: initStmts } = transformer.tsNodeToValueAndStmts(initNode));
        initStmts.forEach(stmt => stmts.push(stmt));
        if (IRUtils.moreThanOneAddress(initValue)) {
            ({ value: initValue, valueOriginalPositions: initPositions, stmts: initStmts } = transformer.generateAssignStmtForValue(initValue, initPositions));
            initStmts.forEach(stmt => stmts.push(stmt));
        }
        if (enumFieldInfo !== undefined) {
            if (initValue instanceof NumberConstant) {
                enumFieldInfo.curValue = parseFloat(initValue.getValue()) + 1;
                enumFieldInfo.isCurValueValid = true;
            } else {
                enumFieldInfo.lastFieldName = field.getName();
                enumFieldInfo.isCurValueValid = false;
            }
        }
    }
    else if (enumFieldInfo !== undefined) {
        if (enumFieldInfo.isCurValueValid) {
            initValue = ValueUtil.getOrCreateNumberConst(enumFieldInfo.curValue);
            enumFieldInfo.curValue += 1;
        } else {
            initValue = new ArkNormalBinopExpr(new Local(enumFieldInfo.lastFieldName), ValueUtil.getOrCreateNumberConst(1), NormalBinaryOperator.Addition);
            enumFieldInfo.lastFieldName = field.getName();
        }
        initPositions = [FullPosition.DEFAULT];
        field.setMetadata(ArkMetadataKind.ENUM_INIT_TYPE_USER, new EnumInitTypeUserMetadata(false));
    } else {
        return;
    }
    const fieldRef = new ArkInstanceFieldRef(transformer.getThisLocal(), field.getSignature());
    const fieldRefPositions = [FullPosition.DEFAULT, FullPosition.DEFAULT];
    const assignStmt = new ArkAssignStmt(fieldRef, initValue);
    assignStmt.setOperandOriginalPositions([...fieldRefPositions, ...initPositions]);
    stmts.push(assignStmt);

    const fieldSourceCode = field.getCode();
    const fieldOriginPosition = field.getOriginPosition();
    for (const stmt of stmts) {
        stmt.setOriginPositionInfo(fieldOriginPosition);
        stmt.setOriginalText(fieldSourceCode);
    }
    field.setInitializer(stmts);
    if (field.getType() instanceof UnknownType) {
        field.getSignature().setType(initValue.getType());
    }
}
