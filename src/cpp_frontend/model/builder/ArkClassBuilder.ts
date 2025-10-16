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
import { buildModifiers, buildTypeParameters, buildModifiersForCxxClass } from './builderUtils';
import { buildProperty2ArkField } from './ArkFieldBuilder';
import { ArkAssignStmt, Stmt } from '../../../core/base/Stmt';
import { ANONYMOUS_CLASS_DELIMITER, ANONYMOUS_CLASS_PREFIX, DEFAULT_ARK_CLASS_NAME } from '../../../core/common/Const';
import { IRUtils } from '../../common/IRUtils';
import { ClassSignature } from '../../../core/model/ArkSignature';
import { init4InstanceInitMethod, init4StaticInitMethod } from '../../../core/model/builder/ArkClassBuilder';
import { ArkCxxIRTransformer } from '../../common/ArkIRTransformer';
import { buildDecorators } from './builderUtils';
import { buildDefaultArkMethodFromArkClass } from './ArkMethodBuilder';
import { CxxAstNode, CxxTranslationUnit } from '../../ast/ArkCxxAstNode';
import { buildArkClassFromCxxClass } from './ArkFileBuilder';
import { ArkField } from '../../../core/model/ArkField';
import { Value } from '../../../core/base/Value';
import { NumberConstant } from '../../../core/base/Constant';
import { ValueUtil } from '../../../core/common/ValueUtil';
import { ArkNormalBinopExpr, NormalBinaryOperator } from '../../../core/base/Expr';
import { Local } from '../../../core/base/Local';
import { FullPosition } from '../../../core/base/Position';
import { ArkMetadataKind, EnumInitTypeUserMetadata } from '../../../core/model/ArkMetadata';
import { ArkInstanceFieldRef } from '../../../core/base/Ref';
import { UnknownType } from '../../../core/base/Type';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'ArkClassBuilder');

export function buildNormalArkClassFromArkMethod(clsNode: CxxAstNode, cls: ArkClass, sourceFile: CxxAstNode, declaringMethod?: ArkMethod): void {
    const namespace = cls.getDeclaringArkNamespace();
    if (namespace) {
        buildNormalArkClassFromArkNamespace(clsNode, namespace, cls, sourceFile, declaringMethod);
    } else {
        buildNormalArkClassFromArkFile(clsNode, cls.getDeclaringArkFile(), cls, sourceFile, declaringMethod);
    }
}

export function buildNormalArkClassFromArkFile(clsNode: CxxAstNode, arkFile: ArkFile, cls: ArkClass,
                                               sourceFile: CxxAstNode, declaringMethod?: ArkMethod): void {
    cls.setDeclaringArkFile(arkFile);
    cls.setCode(clsNode.name);
    if (clsNode.range?.begin) {
        cls.setLine(clsNode.range.begin.line);
        cls.setColumn(clsNode.range.begin.col);
    }
    buildNormalArkClass(clsNode, cls, sourceFile, declaringMethod);
    arkFile.addArkClass(cls);
}

export function buildNormalArkClassFromArkNamespace(
    clsNode: CxxAstNode,
    arkNamespace: ArkNamespace,
    cls: ArkClass,
    sourceFile: CxxAstNode,
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
}

export function buildNormalArkClass(clsNode: CxxAstNode, cls: ArkClass, sourceFile: CxxAstNode, declaringMethod?: ArkMethod): void {
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
        buildClass2ArkClass(clsNode, cls, sourceFile); // The kind attribute of template classes will not be automatically classified as 'class' in tagUsed
    } else if (clsNode.kind === 'EnumDecl') {
        buildEnum2ArkClass(clsNode, cls, sourceFile, declaringMethod);
    }
    IRUtils.setComments(cls, clsNode, sourceFile, cls.getDeclaringArkFile().getScene().getOptions());
}

function buildUnion2ArkClass(clsNode: CxxAstNode, cls: ArkClass, sourceFile: CxxAstNode, declaringMethod?: ArkMethod): void {
    let className: string;
    if (clsNode.name) {
        className = clsNode.name;
    } else {
        className = genAnonymousClassName(clsNode, cls, declaringMethod);
    }
    const classSignature = new ClassSignature(
        className,
        cls.getDeclaringArkFile().getFileSignature(),
        cls.getDeclaringArkNamespace()?.getSignature() || null
    );
    cls.setSignature(classSignature);
    cls.setCategory(ClassCategory.UNION);

    init4InstanceInitMethod(cls);
    init4StaticInitMethod(cls);
    buildArkClassMembers(clsNode, cls, sourceFile);
}

function buildStruct2ArkClass(clsNode: CxxAstNode, cls: ArkClass, sourceFile: CxxAstNode, declaringMethod?: ArkMethod): void {
    let className: string;
    if (clsNode.name && !clsNode.name.startsWith('(unnamed')) {
        className = clsNode.name;
    } else {
        className = genAnonymousClassName(clsNode, cls, declaringMethod);
    }

    const classSignature = new ClassSignature(
        className,
        cls.getDeclaringArkFile().getFileSignature(),
        cls.getDeclaringArkNamespace()?.getSignature() || null
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

function genAnonymousClassName(clsNode: CxxAstNode, cls: ArkClass, declaringMethod?: ArkMethod): string {
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

function buildClass2ArkClass(clsNode: CxxAstNode, cls: ArkClass, sourceFile: CxxAstNode): void {
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
    cls.setModifiers(buildModifiersForCxxClass(cls));
}

function processCXXHeritage(clsNode: CxxAstNode, cls: ArkClass): void {
    for (let i = 0; i < clsNode.inner.length; i++) {
        if (clsNode.inner[i].kind === 'C++ base class specifier') {
            cls.addHeritageClassName(clsNode.inner[i].type.qualType);
        }
    }
}

function buildEnum2ArkClass(clsNode: CxxAstNode, cls: ArkClass, sourceFile: CxxAstNode, declaringMethod?: ArkMethod): void {
    let className: string;
    if (clsNode.name) {
        className = clsNode.name;
    } else {
        className = genAnonymousClassName(clsNode, cls, declaringMethod);
    }

    const classSignature = new ClassSignature(
        className,
        cls.getDeclaringArkFile().getFileSignature(),
        cls.getDeclaringArkNamespace()?.getSignature() || null
    );
    cls.setSignature(classSignature);

    cls.setCategory(ClassCategory.ENUM);

    init4StaticInitMethod(cls);
    buildArkClassMembers(clsNode, cls, sourceFile);
}

function buildInitMethodsForClassTag(
    tagStr: string,
    cls: ArkClass,
    sourceFile: CxxAstNode,
    instanceInitStmts: Stmt[],
    staticInitStmts: Stmt[]
): void {
    if (tagStr === 'class') {
        const tu = sourceFile as CxxTranslationUnit;
        const instanceIRTransformer = new ArkCxxIRTransformer(tu, cls.getInstanceInitMethod());
        const staticIRTransformer = new ArkCxxIRTransformer(tu, cls.getStaticInitMethod());
        buildInitMethod(cls.getInstanceInitMethod(), instanceInitStmts, instanceIRTransformer.getThisLocal());
        buildInitMethod(cls.getStaticInitMethod(), staticInitStmts, staticIRTransformer.getThisLocal());
    } else if (tagStr === 'enum') {
        const tu = sourceFile as CxxTranslationUnit;
        const staticIRTransformer = new ArkCxxIRTransformer(tu, cls.getStaticInitMethod());
        buildInitMethod(cls.getStaticInitMethod(), staticInitStmts, staticIRTransformer.getThisLocal());
    }
}

function buildArkClassMembers(clsNode: CxxAstNode, cls: ArkClass, sourceFile: CxxAstNode): void {
    buildMethodsForClass(clsNode, cls, sourceFile);
    let staticIRTransformer: ArkCxxIRTransformer;
    const tagStr = (clsNode.tagUsed ?? '');
    const staticInitStmts: Stmt[] = [];
    const instanceInitStmts: Stmt[] = [];
    const enumFieldInfo = { lastFieldName: '', curValue: 0, isCurValueValid: true };
    for (const member of clsNode.inner as CxxAstNode[]) {
        if (member.kind === 'FieldDecl' || member.kind === 'VarDecl') {
            const arkField = buildProperty2ArkField(member, sourceFile, cls);

            if (clsNode.kind === 'CXXRecordDecl' && (tagStr === 'class' || tagStr === 'struct')) {
                if (member.inner.length > 0) {
                    staticIRTransformer = new ArkCxxIRTransformer(sourceFile as CxxTranslationUnit, cls.getStaticInitMethod());
                    getInitStmts(staticIRTransformer, arkField, member.inner[0]);
                }
                arkField.getInitializer().forEach(stmt => instanceInitStmts.push(stmt));
            }
        } else if (member.kind === 'EnumConstantDecl') {
            const arkField = buildProperty2ArkField(member, sourceFile, cls);
            staticIRTransformer = new ArkCxxIRTransformer(sourceFile as CxxTranslationUnit, cls.getStaticInitMethod());
            getInitStmts(staticIRTransformer, arkField, member.inner[0], enumFieldInfo);
            arkField.getInitializer().forEach(stmt => staticInitStmts.push(stmt));
        } else if (
            member.kind === 'CXXMethodDecl' ||
            member.kind === 'CXXConstructorDecl' ||
            member.kind === 'CXXDestructorDecl'
        ) {
            // ignore
        } else if (member.kind === 'EnumDecl' || member.kind === 'CXXRecordDecl') {
            buildArkClassFromCxxClass(member, cls.getDeclaringArkFile(), sourceFile);
        } else {
            logger.warn('Please contact developers to support new member type: ', member.kind);
        }
    }
    buildInitMethodsForClassTag(tagStr, cls, sourceFile, instanceInitStmts, staticInitStmts);
}


function buildMethodsForClass(clsNode: CxxAstNode, cls: ArkClass, sourceFile: CxxAstNode): void {
    clsNode.inner.forEach((member: CxxAstNode) => {
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

export function buildDefaultArkClassFromArkFile(arkFile: ArkFile, defaultClass: ArkClass, astRoot: CxxAstNode): void {
    defaultClass.setDeclaringArkFile(arkFile);
    defaultClass.setCategory(ClassCategory.CLASS);
    buildDefaultArkClass(defaultClass, astRoot);
}

function buildDefaultArkClass(cls: ArkClass, sourceFile: CxxAstNode, node?: CxxAstNode): void {
    const defaultArkClassSignature = new ClassSignature(
        DEFAULT_ARK_CLASS_NAME,
        cls.getDeclaringArkFile().getFileSignature(),
        cls.getDeclaringArkNamespace()?.getSignature() || null
    );
    cls.setSignature(defaultArkClassSignature);

    genDefaultArkMethod(cls, sourceFile, node);
}

function genDefaultArkMethod(cls: ArkClass, sourceFile: CxxAstNode, node?: CxxAstNode): void {
    let defaultMethod = new ArkMethod();
    buildDefaultArkMethodFromArkClass(cls, defaultMethod, sourceFile, node);
    cls.setDefaultArkMethod(defaultMethod);
}

function getInitStmts(
    transformer: ArkCxxIRTransformer | undefined,
    field: ArkField,
    initNode?: CxxAstNode,
    enumFieldInfo?: {
        lastFieldName: string,
        curValue: number,
        isCurValueValid: boolean
    }
): void {
    let initValue: Value;
    let initPositions;
    const stmts: Stmt[] = [];
    if (!transformer) {
        return;
    }
    if (initNode) {
        let initStmts: Stmt[] = [];
        ({ value: initValue, valueOriginalPositions: initPositions, stmts: initStmts } = transformer.cxxNodeToValueAndStmts(initNode));
        initStmts.forEach(stmt => stmts.push(stmt));
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