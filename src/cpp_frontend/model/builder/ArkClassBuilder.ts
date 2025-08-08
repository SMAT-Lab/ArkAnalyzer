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

import { ArkFile } from '../../../core/model/ArkFile';
import { ArkMethod } from '../../../core/model/ArkMethod';
import { ArkNamespace } from '../../../core/model/ArkNamespace';
import Logger, { LOG_MODULE_TYPE } from '../../../utils/logger';
import { ArkClass, ClassCategory } from '../../../core/model/ArkClass';
import { buildArkMethodFromArkClass, buildInitMethod } from './ArkMethodBuilder';
import { buildModifiers, buildTypeParameters, buildModifiersForCxxCls } from './builderUtils';
import { buildProperty2ArkField } from './ArkFieldBuilder';
import { Stmt } from '../../../core/base/Stmt';
import { ANONYMOUS_CLASS_DELIMITER, ANONYMOUS_CLASS_PREFIX, DEFAULT_ARK_CLASS_NAME } from '../../../core/common/Const';
import { IRUtils } from '../../../core/common/IRUtils';
import { ClassSignature } from '../../../core/model/ArkSignature';
import { ClassLikeNode, getInitStmts, init4InstanceInitMethod, init4StaticInitMethod } from '../../../core/model/builder/ArkClassBuilder';
import { ArkIRTransformerCpp } from '../../common/ArkIRTransformer';
import { buildDecorators } from '../../../core/model/builder/builderUtils';
import { buildDefaultArkMethodFromArkClass } from './ArkMethodBuilder';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'ArkClassBuilder');

export function buildNormalArkClassFromArkMethod(clsNode: ClassLikeNode, cls: ArkClass, sourceFile: any, declaringMethod?: ArkMethod): void {
    const namespace = cls.getDeclaringArkNamespace();
    if (namespace) {
        buildNormalArkClassFromArkNamespace(clsNode, namespace, cls, sourceFile, declaringMethod);
    } else {
        buildNormalArkClassFromArkFile(clsNode, cls.getDeclaringArkFile(), cls, sourceFile, declaringMethod);
    }
}

export function buildNormalArkClassFromArkFile(clsNode: any, arkFile: ArkFile, cls: ArkClass, sourceFile: any, declaringMethod?: ArkMethod): void {
    cls.setDeclaringArkFile(arkFile);
    cls.setCode(clsNode.name);
    cls.setLine(clsNode.range.begin.line);
    cls.setColumn(clsNode.range.begin.col);
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
    if (clsNode.range?.begin) {
        cls.setLine(clsNode.range.begin.line);
        cls.setColumn(clsNode.range.begin.col);
    }
    buildNormalArkClass(clsNode, cls, sourceFile, declaringMethod);
    //arkNamespace.addArkClass(cls);
}

export function buildNormalArkClass(clsNode: any, cls: ArkClass, sourceFile: any, declaringMethod?: ArkMethod): void {
    if (clsNode.kind === 'CXXRecordDecl') {
        switch (clsNode.tagUsed) {
            case 'struct':
                buildStruct2ArkClass(clsNode, cls, sourceFile, declaringMethod);
                break;
            case 'class':
                buildClass2ArkClass(clsNode, cls, sourceFile);
                break;
            case 'enum':
                buildEnum2ArkClass(clsNode, cls, sourceFile, declaringMethod);
                break;
            case 'union':
                buildUnion2ArkClass(clsNode, cls, sourceFile, declaringMethod);
                break;
            default:
        }
    }
    if (clsNode.kind === 'ClassTemplate') {
        buildClass2ArkClass(clsNode, cls, sourceFile); // 模板类的kind属性不会自动被归入tagUsed为'class'
    } else if (clsNode.kind === 'EnumDecl') {
        buildEnum2ArkClass(clsNode, cls, sourceFile, declaringMethod);
    }
    IRUtils.setComments(cls, clsNode, sourceFile, cls.getDeclaringArkFile().getScene().getOptions());
}

function buildUnion2ArkClass(clsNode: any, cls: ArkClass, sourceFile: any, declaringMethod?: ArkMethod): void {
    let className: string;
    if (clsNode.name) {
        className = clsNode.name;
    } else {
        className = genAnonymousClassName(clsNode, cls, declaringMethod);
    }
    const classSignature = new ClassSignature(
        className,
        cls.getDeclaringArkFile().getFileSignature(),
        cls.getDeclaringArkNamespace()?.getSignature() || null,
        ClassCategory.UNION
    );
    cls.setSignature(classSignature);
    cls.setCategory(ClassCategory.UNION);

    init4InstanceInitMethod(cls);
    init4StaticInitMethod(cls);
    buildArkClassMembers(clsNode, cls, sourceFile);
}

function buildStruct2ArkClass(clsNode: any, cls: ArkClass, sourceFile: any, declaringMethod?: ArkMethod): void {
    let className: string;
    if (clsNode.name) {
        className = clsNode.name;
    } else {
        className = genAnonymousClassName(clsNode, cls, declaringMethod);
    }

    const classSignature = new ClassSignature(
        className,
        cls.getDeclaringArkFile().getFileSignature(),
        cls.getDeclaringArkNamespace()?.getSignature() || null,
        ClassCategory.STRUCT
    );
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

function genAnonymousClassName(clsNode: ClassLikeNode, cls: ArkClass, declaringMethod?: ArkMethod): string {
    const declaringArkNamespace = cls.getDeclaringArkNamespace();
    const declaringArkFile = cls.getDeclaringArkFile();
    let anonymousClassName: string;
    let declaringMethodName = '';
    if (declaringMethod) {
        declaringMethodName =
            declaringMethod.getDeclaringArkClass().getName() + ANONYMOUS_CLASS_DELIMITER + declaringMethod.getName() + ANONYMOUS_CLASS_DELIMITER;
    }
    if (declaringArkNamespace) {
        anonymousClassName = ANONYMOUS_CLASS_PREFIX + ANONYMOUS_CLASS_DELIMITER + declaringMethodName + declaringArkNamespace.getAnonymousClassNumber();
    } else {
        anonymousClassName = ANONYMOUS_CLASS_PREFIX + ANONYMOUS_CLASS_DELIMITER + declaringMethodName + declaringArkFile.getAnonymousClassNumber();
    }
    return anonymousClassName;
}

function buildClass2ArkClass(clsNode: any, cls: ArkClass, sourceFile: any): void {
    const className = clsNode.name ? clsNode.name : '';
    const classSignature = new ClassSignature(className, cls.getDeclaringArkFile().getFileSignature(), cls.getDeclaringArkNamespace()?.getSignature() || null);
    cls.setSignature(classSignature);

    if (clsNode.inner) {
        processCXXHeritage(clsNode, cls);
    }

    if (clsNode.kind === 'ClassTemplate') {
        buildTypeParameters(clsNode, sourceFile, cls).forEach(typeParameter => {
            cls.addGenericType(typeParameter);
        });
    }
    cls.setCategory(ClassCategory.CLASS);
    init4InstanceInitMethod(cls);
    init4StaticInitMethod(cls);
    buildArkClassMembers(clsNode, cls, sourceFile);
    cls.setModifiers(buildModifiersForCxxCls(cls));
}

function processCXXHeritage(clsNode: any, cls: ArkClass) {
    for (let i = 0; i < clsNode.inner.length; i++) {
        if (clsNode.inner[i].kind === 'C++ base class specifier') {
            cls.addHeritageClassName(clsNode.inner[i].type.qualType);
        }
    }
}

function buildEnum2ArkClass(clsNode: any, cls: ArkClass, sourceFile: any, declaringMethod?: ArkMethod): void {
    let className: string;
    if (clsNode.name) {
        className = clsNode.name;
    } else {
        className = genAnonymousClassName(clsNode, cls, declaringMethod);
    }

    const classSignature = new ClassSignature(
        className,
        cls.getDeclaringArkFile().getFileSignature(),
        cls.getDeclaringArkNamespace()?.getSignature() || null,
        ClassCategory.ENUM
    );
    cls.setSignature(classSignature);

    cls.setCategory(ClassCategory.ENUM);

    init4StaticInitMethod(cls);
    buildArkClassMembers(clsNode, cls, sourceFile);
}

function buildArkClassMembers(clsNode: any, cls: ArkClass, sourceFile: any): void {
    buildMethodsForClass(clsNode, cls, sourceFile);
    let instanceIRTransformer: ArkIRTransformerCpp;
    let staticIRTransformer: ArkIRTransformerCpp;
    // 判断是否有tagUsed属性
    const hasTagUsed = clsNode && 'tagUsed' in clsNode && clsNode.tagUsed !== undefined && clsNode.tagUsed !== null;
    const tagStr = hasTagUsed ? clsNode.tagUsed.toString() : '';

    if (tagStr === 'class' || tagStr === 'struct' || tagStr === 'union') {
        instanceIRTransformer = new ArkIRTransformerCpp(sourceFile, cls.getInstanceInitMethod());
        staticIRTransformer = new ArkIRTransformerCpp(sourceFile, cls.getStaticInitMethod());
    }
    if (tagStr === 'enum') {
        staticIRTransformer = new ArkIRTransformerCpp(sourceFile, cls.getStaticInitMethod());
    }
    const staticInitStmts: Stmt[] = [];
    const instanceInitStmts: Stmt[] = [];
    clsNode.inner.forEach((member: any) => {
        if (member.kind === 'FieldDecl' || member.kind === 'VarDecl') {
            const arkField = buildProperty2ArkField(member, sourceFile, cls);
            if (clsNode.kind === 'CXXRecordDecl' && (tagStr === 'class' || tagStr === 'struct')) {
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
    if (tagStr === 'class') {
        buildInitMethod(cls.getInstanceInitMethod(), instanceInitStmts, instanceIRTransformer!.getThisLocal());
        buildInitMethod(cls.getStaticInitMethod(), staticInitStmts, staticIRTransformer!.getThisLocal());
    }
    if (tagStr === 'enum') {
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
        if (
            member.kind.toString() === 'CXXMethodDecl' ||
            member.kind.toString() === 'CXXConstructorDecl' ||
            member.kind.toString() === 'CXXDestructorDecl' ||
            member.kind.toString() === 'FriendDecl'
        ) {
            let method: ArkMethod = new ArkMethod();
            buildArkMethodFromArkClass(member, cls, method, sourceFile);
        }
    });
}

export function buildDefaultArkClassFromArkFile(arkFile: ArkFile, defaultClass: ArkClass, astRoot: any): void {
    defaultClass.setDeclaringArkFile(arkFile);
    defaultClass.setCategory(ClassCategory.CLASS);
    buildDefaultArkClass(defaultClass, astRoot);
}

function buildDefaultArkClass(cls: ArkClass, sourceFile: any, node?: any): void {
    const defaultArkClassSignature = new ClassSignature(
        DEFAULT_ARK_CLASS_NAME,
        cls.getDeclaringArkFile().getFileSignature(),
        cls.getDeclaringArkNamespace()?.getSignature() || null
    );
    cls.setSignature(defaultArkClassSignature);

    genDefaultArkMethod(cls, sourceFile, node);
}

function genDefaultArkMethod(cls: ArkClass, sourceFile: any, node?: any): void {
    let defaultMethod = new ArkMethod();
    buildDefaultArkMethodFromArkClass(cls, defaultMethod, sourceFile, node);
    cls.setDefaultArkMethod(defaultMethod);
}
