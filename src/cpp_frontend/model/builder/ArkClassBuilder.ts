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
import { buildArkMethodFromArkClass, buildDefaultArkMethodFromArkClass, buildInitMethod } from './ArkMethodBuilder';
import { buildDecorators, buildModifiers, buildModifiersForCxxClass, buildTypeParameters } from './builderUtils';
import { buildProperty2ArkField } from './ArkFieldBuilder';
import { ArkAliasTypeDefineStmt, ArkAssignStmt, Stmt } from '../../../core/base/Stmt';
import { ANONYMOUS_CLASS_DELIMITER, ANONYMOUS_CLASS_PREFIX, DEFAULT_ARK_CLASS_NAME } from '../../../core/common/Const';
import { IRUtils } from '../../common/IRUtils';
import { ClassSignature } from '../../../core/model/ArkSignature';
import { init4InstanceInitMethod, init4StaticInitMethod } from '../../../core/model/builder/ArkClassBuilder';
import { ArkCxxIRTransformer } from '../../common/ArkIRTransformer';
import { CxxAstNode, CxxTranslationUnit, getNodeStartLineAndCol } from '../../ast/ArkCxxAstNode';
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

export function buildNormalArkClassFromArkMethod(clsNode: CxxAstNode, cls: ArkClass, sourceFile: CxxAstNode, declaringClass?:ArkClass): void {
    const namespace = cls.getDeclaringArkNamespace();
    if (namespace) {
        buildNormalArkClassFromArkNamespace(clsNode, namespace, cls, sourceFile, declaringClass);
    } else {
        buildNormalArkClassFromArkFile(clsNode, cls.getDeclaringArkFile(), cls, sourceFile, declaringClass);
    }
}

export function buildNormalArkClassFromArkFile(clsNode: CxxAstNode, arkFile: ArkFile, cls: ArkClass,
                                               sourceFile: CxxAstNode, declaringClass?:ArkClass): void {
    cls.setDeclaringArkFile(arkFile);
    cls.setCode(clsNode.code);
    const nodePos = getNodeStartLineAndCol(clsNode);
    cls.setLine(nodePos.line);
    cls.setColumn(nodePos.col);
    buildNormalArkClass(clsNode, cls, sourceFile, declaringClass);
    arkFile.addArkClass(cls);
}

export function buildNormalArkClassFromArkNamespace(
    clsNode: CxxAstNode,
    arkNamespace: ArkNamespace,
    cls: ArkClass,
    sourceFile: CxxAstNode,
    declaringClass?:ArkClass
): void {
    cls.setDeclaringArkNamespace(arkNamespace);
    cls.setDeclaringArkFile(arkNamespace.getDeclaringArkFile());
    cls.setCode(clsNode.code);
    const nodePos = getNodeStartLineAndCol(clsNode);
    cls.setLine(nodePos.line);
    cls.setColumn(nodePos.col);
    buildNormalArkClass(clsNode, cls, sourceFile, declaringClass);
    arkNamespace.addArkClass(cls);
}

export function buildNormalArkClass(clsNode: CxxAstNode, cls: ArkClass, sourceFile: CxxAstNode, declaringClass?:ArkClass): void {
    if (clsNode.kind === 'CXXRecordDecl') {
        switch (clsNode.tagUsed) {
            case 'struct':
                buildStruct2ArkClass(clsNode, cls, sourceFile, declaringClass);
                break;
            case 'class':
                buildClass2ArkClass(clsNode, cls, sourceFile, declaringClass);
                break;
            case 'enum':
                buildEnum2ArkClass(clsNode, cls, sourceFile, declaringClass);
                break;
            case 'union':
                buildUnion2ArkClass(clsNode, cls, sourceFile, declaringClass);
                break;
            default:
        }
    }
    if (clsNode.kind === 'ClassTemplate') {
        buildClass2ArkClass(clsNode, cls, sourceFile); // The kind attribute of template classes will not be automatically classified as 'class' in tagUsed
    } else if (clsNode.kind === 'EnumDecl') {
        buildEnum2ArkClass(clsNode, cls, sourceFile, declaringClass);
    }
    IRUtils.setComments(cls, clsNode, sourceFile, cls.getDeclaringArkFile().getScene().getOptions());
}

function buildUnion2ArkClass(clsNode: CxxAstNode, cls: ArkClass, sourceFile: CxxAstNode, declaringClass?:ArkClass): void {
    const className = genClassName(clsNode.name ? clsNode.name : '', cls, declaringClass);
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

function buildStruct2ArkClass(clsNode: CxxAstNode, cls: ArkClass, sourceFile: CxxAstNode, declaringClass?:ArkClass): void {
    const className = genClassName(clsNode.name ? clsNode.name : '', cls, declaringClass);
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


function buildClass2ArkClass(clsNode: CxxAstNode, cls: ArkClass, sourceFile: CxxAstNode, declaringClass?:ArkClass): void {
    const className = genClassName(clsNode.name ? clsNode.name : '', cls, declaringClass);
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
    cls.setCategory(clsNode.tagUsed === 'struct' ? ClassCategory.STRUCT : ClassCategory.CLASS);
    init4InstanceInitMethod(cls);
    init4StaticInitMethod(cls);
    buildArkClassMembers(clsNode, cls, sourceFile);
    cls.setModifiers(buildModifiersForCxxClass(cls));
}

function genClassName(declaringName: string, cls: ArkClass, declaringClass?:ArkClass): string {
    if (!declaringName) {
        const declaringArkNamespace = cls.getDeclaringArkNamespace();
        const num = declaringArkNamespace ? declaringArkNamespace.getAnonymousClassNumber() : cls.getDeclaringArkFile().getAnonymousClassNumber();
        declaringName = ANONYMOUS_CLASS_PREFIX + num;
    }
    const suffix = declaringClass ? ANONYMOUS_CLASS_DELIMITER + declaringClass.getName() : '';
    return declaringName + suffix;
}

function processCXXHeritage(clsNode: CxxAstNode, cls: ArkClass): void {
    for (let i = 0; i < clsNode.inner.length; i++) {
        if (clsNode.inner[i].kind === 'C++ base class specifier') {
            cls.addHeritageClassName(clsNode.inner[i].type.qualType);
        }
    }
}

function buildEnum2ArkClass(clsNode: CxxAstNode, cls: ArkClass, sourceFile: CxxAstNode, declaringClass?:ArkClass): void {
    const className = genClassName(clsNode.name ? clsNode.name : '', cls, declaringClass);
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
    for (let i = 0; i < clsNode.inner.length; i++) {
        let member = clsNode.inner[i];
        if (i === 0 && member.kind === 'CXXRecordDecl') {
            continue;
        }
        switch (member.kind) {
            case 'FieldDecl':
            case 'VarDecl': {
                const arkField = buildProperty2ArkField(member, sourceFile, cls);
                // If the parameter inner is not empty, it means it contains initialization information
                if (member.inner.length > 0 && !member.inner[member.inner.length - 1].kind.endsWith('Ref')) {
                    staticIRTransformer = new ArkCxxIRTransformer(sourceFile as CxxTranslationUnit, cls.getStaticInitMethod());
                    getInitStmts(staticIRTransformer, arkField, member.inner[member.inner.length - 1]);
                }
                arkField.getInitializer().forEach(stmt => instanceInitStmts.push(stmt));
                break;
            }
            case 'EnumConstantDecl': {
                const arkField = buildProperty2ArkField(member, sourceFile, cls);
                staticIRTransformer = new ArkCxxIRTransformer(sourceFile as CxxTranslationUnit, cls.getStaticInitMethod());
                getInitStmts(staticIRTransformer, arkField, member.inner[0], enumFieldInfo);
                arkField.getInitializer().forEach(stmt => staticInitStmts.push(stmt));
                break;
            }
            case 'CXXMethodDecl':
            case 'CXXConstructorDecl':
            case 'CXXAccessSpecifier':
            case 'CXXDestructorDecl':
                // ignore
                break;
            case 'EnumDecl':
            case 'CXXRecordDecl': {
                processClassDeclInClass(member, cls, sourceFile);
                break;
            }
            case 'UsingDecl':
                processUsingDeclInClass(member, cls);
                break;
            case 'TypeAliasDecl':
                processTypeAliasDeclInClass(member, cls, sourceFile, instanceInitStmts);
                break;
            default:
                logger.warn('Please contact developers to support new member type: ', member.kind);
                break;
        }
    }
    buildInitMethodsForClassTag(tagStr, cls, sourceFile, instanceInitStmts, staticInitStmts);
}

function processClassDeclInClass(classDeclNode: CxxAstNode, cls: ArkClass, sourceFile: CxxAstNode): void {
    const newCls = new ArkClass();
    const namespace = cls.getDeclaringArkNamespace();
    if (namespace) {
        buildNormalArkClassFromArkNamespace(classDeclNode, namespace, newCls, sourceFile, cls);
    } else {
        buildNormalArkClassFromArkFile(classDeclNode, cls.getDeclaringArkFile(), newCls, sourceFile, cls);
    }
}

function processUsingDeclInClass(usingDecl: CxxAstNode, cls: ArkClass): void {
    if (usingDecl.inner.length !== 2) {
        return;
    }
    const curFile = cls.getDeclaringArkFile();
    const usingClass = curFile.getClassWithName(usingDecl.inner[0].name.replace(/struct |class /g, ''));
    if (!usingClass) {
        return;
    }
    const usingMemberName = usingDecl.inner[1].name;
    const member = usingClass.getMethodWithName(usingMemberName) ?? usingClass.getStaticFieldWithName(usingMemberName);
    // CXXTodo: classSignature belongs to the base class and needs special handling during the inferType process.
    if (member instanceof ArkMethod) {
        cls.addMethod(member);
    }
    if (member instanceof ArkField) {
        cls.addField(member);
    }
}

function processTypeAliasDeclInClass(typeAliasDecl: CxxAstNode, cls: ArkClass, sourceFile: CxxAstNode, instanceInitStmts: Stmt[]): void {
    const arkField = buildProperty2ArkField(typeAliasDecl, sourceFile, cls);
    //  it's a  type alias declaration
    const staticIRTransformer = new ArkCxxIRTransformer(sourceFile as CxxTranslationUnit, cls.getStaticInitMethod());
    const stmts = staticIRTransformer.cxxNodeToStmts(typeAliasDecl);
    if (stmts.length === 0) {
        return;
    }
    stmts.forEach(stmt => instanceInitStmts.push(stmt));
    arkField.getInitializer().push(...stmts);
    if (stmts[0] instanceof ArkAliasTypeDefineStmt) {
        arkField.getSignature().setType(stmts[0].getAliasType());
    }
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
// Get initialization statement when member variables contain default values
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