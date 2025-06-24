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

import { ArkField } from '../../../core/model/ArkField';
import { ArkFile } from '../../../core/model/ArkFile';
import { ArkMethod } from '../../../core/model/ArkMethod';
import { ArkNamespace } from '../../../core/model/ArkNamespace';
import Logger, { LOG_MODULE_TYPE } from '../../../utils/logger';
import ts from 'ohos-typescript';
import { ArkClass, ClassCategory } from '../../../core/model/ArkClass';
import {
    buildArkMethodFromArkClass,
    buildDefaultArkMethodFromArkClass,
    buildInitMethod,
    checkAndUpdateMethod,
} from './ArkMethodBuilder';
import {
    buildDecorators,
    buildModifiers,
    buildTypeParameters
} from './builderUtils';
import { buildProperty2ArkField } from './ArkFieldBuilder';
import { ArkIRTransformer } from '../../common/ArkIRTransformer';
import { ArkAssignStmt, Stmt } from '../../../core/base/Stmt';
import { ArkInstanceFieldRef } from '../../../core/base/Ref';
import {
    ANONYMOUS_CLASS_DELIMITER,
    ANONYMOUS_CLASS_PREFIX,
    DEFAULT_ARK_CLASS_NAME,
    INSTANCE_INIT_METHOD_NAME,
    STATIC_INIT_METHOD_NAME,
} from '../../common/Const';
import { IRUtils } from '../../common/IRUtils';
import { ClassSignature, MethodSignature } from '../../../core/model/ArkSignature';
import { ArkSignatureBuilder } from './ArkSignatureBuilder';
import { FullPosition } from '../../../core/base/Position';
import { UnknownType, VoidType } from '../../../core/base/Type';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'ArkClassBuilder');

export type ClassLikeNode =
    | ts.ClassDeclaration
    | ts.InterfaceDeclaration
    | ts.EnumDeclaration
    | ts.ClassExpression
    | ts.TypeLiteralNode
    | ts.StructDeclaration
    | ts.ObjectLiteralExpression;

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
    clsNode: any,
    arkFile: ArkFile,
    cls: ArkClass,
    sourceFile: any,
    declaringMethod?: ArkMethod
): void {
    cls.setDeclaringArkFile(arkFile);
    cls.setCode(clsNode.name);
    cls.setLine(clsNode.loc.line);
    cls.setColumn(clsNode.loc.col);
    buildNormalArkClass(clsNode, cls, sourceFile, declaringMethod);
    arkFile.addArkClass(cls);
}

export function buildNormalArkClassFromArkNamespace(
    clsNode: any,
    arkNamespace: ArkNamespace,
    cls: ArkClass,
    sourceFile: any,
    declaringMethod?: ArkMethod
): void {
    cls.setDeclaringArkNamespace(arkNamespace);
    cls.setDeclaringArkFile(arkNamespace.getDeclaringArkFile());
    cls.setCode(clsNode.code);
    if (clsNode.hasOwnProperty("loc")){
        cls.setLine(clsNode.loc.line);
        cls.setColumn(clsNode.loc.col);
    }
    buildNormalArkClass(clsNode, cls, sourceFile, declaringMethod);
    //arkNamespace.addArkClass(cls);
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

export function buildNormalArkClass(clsNode: any, cls: ArkClass, sourceFile: any, declaringMethod?: ArkMethod): void {
    switch (clsNode.tagUsed) {
        case 'struct':
            buildStruct2ArkClass(clsNode, cls, sourceFile, declaringMethod);
            break;
        case 'class':
            buildClass2ArkClass(clsNode, cls, sourceFile, declaringMethod);
            break;
        case 'enum':
            buildEnum2ArkClass(clsNode, cls, sourceFile, declaringMethod);
            break;
        case 'union':
            buildUnion2ArkClass(clsNode, cls, sourceFile, declaringMethod);
            break;
        default:
    }
    IRUtils.setComments(cls, clsNode, sourceFile, cls.getDeclaringArkFile().getScene().getOptions());
}

function buildUnion2ArkClass(clsNode: any, cls:ArkClass, sourceFile: any, declaringMethod?: ArkMethod): void {
    let className = '';
    if (clsNode.name) {
        className = clsNode.name;
    } else{
        className = genAnonymousClassName(clsNode, cls, declaringMethod);
    }
    const classSignature = new ClassSignature(className,
        cls.getDeclaringArkFile().getFileSignature(), cls.getDeclaringArkNamespace()?.getSignature() ||null, ClassCategory.UNION);
    cls.setSignature(classSignature);
    cls.setCategory(ClassCategory.UNION);

    init4InstanceInitMethod(cls);
    init4StaticInitMethod(cls);
    buildArkClassMembers(clsNode, cls, sourceFile);
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
    const methodSubSignature = ArkSignatureBuilder.buildMethodSubSignatureFromMethodName(STATIC_INIT_METHOD_NAME);
    methodSubSignature.setReturnType(VoidType.getInstance());
    const methodSignature = new MethodSignature(staticInit.getDeclaringArkClass().getSignature(), methodSubSignature);
    staticInit.setImplementationSignature(methodSignature);
    staticInit.setLineCol(0);

    checkAndUpdateMethod(staticInit, cls);
    cls.addMethod(staticInit);
    cls.setStaticInitMethod(staticInit);
}

function buildStruct2ArkClass(clsNode: any, cls: ArkClass, sourceFile: any, declaringMethod?: ArkMethod): void {
    let className = '';
    if (clsNode.name){
        className = clsNode.name;
    } else {
        className = genAnonymousClassName(clsNode, cls, declaringMethod);
    }

    const classSignature = new ClassSignature(className, cls.getDeclaringArkFile().getFileSignature(), cls.getDeclaringArkNamespace()?.getSignature() || null, ClassCategory.STRUCT);
    cls.setSignature(classSignature);

    if (clsNode.inner) {
        processCXXHeritage(clsNode, cls);
    }

    cls.setModifiers(buildModifiers(clsNode));
    cls.setDecorators(buildDecorators(clsNode, sourceFile));

    cls.setCategory(ClassCategory.STRUCT);
    init4InstanceInitMethod(cls);
    init4StaticInitMethod(cls);
    buildArkClassMembers(clsNode, cls, sourceFile);
}

function genAnonymousClassName(clsNode: ClassLikeNode, cls:ArkClass, declaringMethod?: ArkMethod): string {
    const declaringArkNamespace = cls.getDeclaringArkNamespace();
    const declaringArkFile = cls.getDeclaringArkFile();
    let anonymousClassName = '';
    let declaringMethodName = '';
    if (declaringMethod){
        declaringMethodName = declaringMethod.getDeclaringArkClass().getName() + ANONYMOUS_CLASS_DELIMITER + declaringMethod.getName() + ANONYMOUS_CLASS_DELIMITER;
    }
    if (declaringArkNamespace){
        anonymousClassName = ANONYMOUS_CLASS_PREFIX + ANONYMOUS_CLASS_DELIMITER + declaringMethodName + declaringArkNamespace.getAnonymousClassNumber();
    } else {
        anonymousClassName = ANONYMOUS_CLASS_PREFIX + ANONYMOUS_CLASS_DELIMITER + declaringMethodName + declaringArkFile.getAnonymousClassNumber();
    }
    return anonymousClassName;
}

function buildClass2ArkClass(clsNode: any, cls: ArkClass, sourceFile: any, declaringMethod?: ArkMethod): void {
    const className = clsNode.name ? clsNode.name : '';
    const classSignature = new ClassSignature(className, cls.getDeclaringArkFile().getFileSignature(), cls.getDeclaringArkNamespace()?.getSignature() || null);
    cls.setSignature(classSignature);

    if (clsNode.inner) {
        processCXXHeritage(clsNode, cls);
    }

    if (clsNode.kind ==='ClassTemplate'){
        buildTypeParameters(clsNode,sourceFile, cls).forEach(typeParameter => {
            cls.addGenericType(typeParameter);
        })
    }
    cls.setCategory(ClassCategory.CLASS);
    init4InstanceInitMethod(cls);
    init4StaticInitMethod(cls);
    buildArkClassMembers(clsNode, cls, sourceFile);
}

function processCXXHeritage(clsNode: any, cls: ArkClass) {
    for (let i = 0; i< clsNode.inner.length; i++) {
        if (clsNode.inner[i].kind === 'C++ base class specifier') {
            cls.addHeritageClassName(clsNode.inner[i].type.qualType);
        }
    }
}

function buildEnum2ArkClass(clsNode: any, cls: ArkClass, sourceFile: any, declaringMethod?: ArkMethod): void {
    let className = '';
    if (clsNode.name){
        className = clsNode.name;
    } else {
        className = genAnonymousClassName(clsNode, cls, declaringMethod);
    }

    const classSignature = new ClassSignature(className, cls.getDeclaringArkFile().getFileSignature(), cls.getDeclaringArkNamespace()?.getSignature() || null, ClassCategory.ENUM);
    cls.setSignature(classSignature);

    // cls.setModifiers(buildModifiers(clsNode));
    // cls.setDecorators(buildDecorators(clsNode, sourceFile));

    cls.setCategory(ClassCategory.ENUM);

    init4StaticInitMethod(cls);
    buildArkClassMembers(clsNode, cls, sourceFile);
}

function buildArkClassMembers(clsNode: any, cls: ArkClass, sourceFile: any): void {
    buildMethodsForClass(clsNode, cls, sourceFile);
    let instanceIRTransformer: ArkIRTransformer;
    let staticIRTransformer: ArkIRTransformer;
    if (clsNode.tagUsed.toString() === 'class' || clsNode.tagUsed.toString() === 'struct' || clsNode.tagUsed.toString() === 'union') {
        instanceIRTransformer = new ArkIRTransformer(sourceFile, cls.getInstanceInitMethod());
        staticIRTransformer = new ArkIRTransformer(sourceFile, cls.getStaticInitMethod());
    }
    if (clsNode.tagUsed.toString() === 'enum') {
        staticIRTransformer = new ArkIRTransformer(sourceFile, cls.getStaticInitMethod());
    }
    const staticInitStmts: Stmt[] = [];
    const instanceInitStmts: Stmt[] = [];
    clsNode.inner.forEach((member: any) => {
        if (member.kind === 'FieldDecl' || member.kind === 'VarDecl') {
            const arkField = buildProperty2ArkField(member, sourceFile, cls);
            if (clsNode.kind === 'CXXRecordDecl' && (clsNode.tagUsed === 'class' || clsNode.tagUsed === 'struct')) {
                if (arkField.isStatic()) {
                    getInitStmts(staticIRTransformer, arkField, member.initializer);
                    arkField.getInitializer().forEach(stmt => staticInitStmts.push(stmt));
                } else {
                    if (!instanceIRTransformer) {
                        console.log(clsNode.getText(sourceFile));
                    }
                    getInitStmts(instanceIRTransformer, arkField, member.initializer);
                    arkField.getInitializer().forEach(stmt => instanceInitStmts.push(stmt));
                }
            }
        } else if (member.kind === 'EnumConstantDecl') {
            const arkField = buildProperty2ArkField(member, sourceFile, cls);
            getInitStmts(staticIRTransformer, arkField, member.initializer);
            arkField.getInitializer().forEach(stmt => staticInitStmts.push(stmt));
        } else {
            logger.warn('Please contact developers to support new member type: ', member.kind);
        }
    });
    if (clsNode.tagUsed.toString() === 'class') {
        buildInitMethod(cls.getInstanceInitMethod(), instanceInitStmts, instanceIRTransformer!.getThisLocal());
        buildInitMethod(cls.getStaticInitMethod(), staticInitStmts, staticIRTransformer!.getThisLocal());
    }
    if (clsNode.tagUsed.toString() === 'enum') {
        buildInitMethod(cls.getStaticInitMethod(), staticInitStmts, staticIRTransformer!.getThisLocal());
    }
}

function buildMethodsForClass(clsNode: any, cls: ArkClass, sourceFile: any): void {
    let cxxAccessModifier = 'private';
    clsNode.inner.forEach((member: any) => {
        if (member.kind.toString() === 'CXXAccessSpecifier') {
            cxxAccessModifier = member.code.split(':')[0];
        }
        member.access = cxxAccessModifier;
        if (member.kind.toString() === 'CXXMethodDecl' || member.kind.toString() === 'CXXConstructorDecl' ||
            member.kind.toString() === 'CXXDestructorDecl' || member.kind.toString() === 'FriendDecl') {
            let method: ArkMethod = new ArkMethod();
            buildArkMethodFromArkClass(member, cls, method, sourceFile);
        }
    })
}

function getInitStmts(transformer: ArkIRTransformer, field: ArkField, initNode?: ts.Node): void {
    if (initNode) {
        const stmts: Stmt[] = [];
        let { value: initValue, valueOriginalPositions: initPositions, stmts: initStmts } = transformer.tsNodeToValueAndStmts(initNode);
        initStmts.forEach(stmt => stmts.push(stmt));
        if (IRUtils.moreThanOneAddress(initValue)) {
            ({ value: initValue, valueOriginalPositions: initPositions, stmts: initStmts } = transformer.generateAssignStmtForValue(initValue, initPositions));
            initStmts.forEach(stmt => stmts.push(stmt));
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
}
