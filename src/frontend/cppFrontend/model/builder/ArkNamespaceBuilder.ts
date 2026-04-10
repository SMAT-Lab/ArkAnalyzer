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

import { buildNormalArkClassFromArkNamespace } from './ArkClassBuilder';
import { ArkFile } from '../../../../core/model/ArkFile';
import { buildArkMethodFromArkClass } from './ArkMethodBuilder';
import { ArkNamespace } from '../../../../core/model/ArkNamespace';
import { buildModifiers, buildDecorators } from './builderUtils';
import Logger, { LOG_MODULE_TYPE } from '../../../../utils/logger';
import { ArkClass } from '../../../../core/model/ArkClass';
import { ArkMethod } from '../../../../core/model/ArkMethod';
import { ClassSignature, NamespaceSignature } from '../../../../core/model/ArkSignature';
import { CxxAstNode, getNodeStartLineAndCol } from '../../ast/ArkCxxAstNode';
import { ANONYMOUS_NAMESPACE_PREFIX, DEFAULT_ARK_CLASS_NAME } from '../../../../core/common/Const';
import { buildDefaultArkMethodFromArkClass } from './ArkMethodBuilder';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'ArkNamespaceBuilder');

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

export function buildDefaultArkClassFromArkNamespace(
    arkNamespace: ArkNamespace,
    defaultClass: ArkClass,
    nsNode: CxxAstNode,
    sourceFile: CxxAstNode
): void {
    defaultClass.setDeclaringArkNamespace(arkNamespace);
    defaultClass.setDeclaringArkFile(arkNamespace.getDeclaringArkFile());
    buildDefaultArkClass(defaultClass, sourceFile, nsNode);
}


export function genDefaultArkClass(ns: ArkNamespace, node: CxxAstNode, sourceFile: CxxAstNode): void {
    let defaultClass = new ArkClass();

    buildDefaultArkClassFromArkNamespace(ns, defaultClass, node, sourceFile);
    ns.setDefaultClass(defaultClass);
    ns.addArkClass(defaultClass);
}

export function buildArkNamespace(node: CxxAstNode, declaringInstance: ArkFile | ArkNamespace, ns: ArkNamespace, sourceFile: CxxAstNode): void {
    // modifiers
    if (node.modifiers) {
        ns.setModifiers(buildModifiers(node));
        ns.setDecorators(buildDecorators(node, sourceFile));
    }

    if (declaringInstance instanceof ArkFile) {
        ns.setDeclaringArkFile(declaringInstance);
    } else {
        ns.setDeclaringArkNamespace(declaringInstance);
        ns.setDeclaringArkFile(declaringInstance.getDeclaringArkFile());
    }
    ns.setDeclaringInstance(declaringInstance);
    const namespaceName = genNamespaceName(node.name ? node.name : '', declaringInstance);
    const namespaceSignature = new NamespaceSignature(
        namespaceName,
        ns.getDeclaringArkFile().getFileSignature(),
        ns.getDeclaringArkNamespace()?.getSignature() || null
    );
    ns.setSignature(namespaceSignature);

    // TODO: whether needed?
    ns.setCode(node.code);

    // set line and column
    const nodePos = getNodeStartLineAndCol(node);
    ns.setLine(nodePos.line);
    ns.setColumn(nodePos.col);

    genDefaultArkClass(ns, node, sourceFile);

    // build ns member
    if (node.inner) {
        buildNamespaceMembers(node, ns, sourceFile);
    } else {
        logger.warn('JSDocNamespaceDeclaration found.');
    }
}

function genNamespaceName(name: string, declaringInstance: ArkFile | ArkNamespace): string {
    if (!name) {
        const num = declaringInstance.getAnonymousNamespaceNumber();
        name = ANONYMOUS_NAMESPACE_PREFIX + num;
    }
    return name;
}

function processUsingDeclInNamespace(usingDeclNode: CxxAstNode, namespace: ArkNamespace): void {
    // CXXTodo: using NS::Member,  scenario 'NS is from other file' is not handled.
    const curArkFile = namespace.getDeclaringArkFile();
    let curNS: ArkNamespace | undefined | null;
    if (usingDeclNode.name.includes('::')) {
        const namespaceName = usingDeclNode.name.substring(0, usingDeclNode.name.indexOf('::'));
        const memberName = usingDeclNode.name.substring(usingDeclNode.name.indexOf('::') + 2);
        curNS = curArkFile.getNamespaceWithName(namespaceName);
        let usingFunc = curNS?.getDefaultClass().getMethodWithName(memberName);
        if (usingFunc) {
            namespace.getDefaultClass().addMethod(usingFunc);
            return;
        }
    }
}

// TODO: check and update
function buildNamespaceMembers(node: CxxAstNode, namespace: ArkNamespace, sourceFile: CxxAstNode): void {
    const statements = node.inner;
    statements.forEach((child: CxxAstNode) => {
        switch (child.kind) {
            case 'NamespaceDecl': {
                let childNs: ArkNamespace = new ArkNamespace();
                childNs.setDeclaringArkNamespace(namespace);
                childNs.setDeclaringArkFile(namespace.getDeclaringArkFile());
                buildArkNamespace(child, namespace, childNs, sourceFile);
                namespace.addNamespace(childNs);
                return;
            }
            case 'CXXRecordDecl':
            case 'ClassTemplateDecl': {
                let cls: ArkClass = new ArkClass();
                buildNormalArkClassFromArkNamespace(child, namespace, cls, sourceFile);
                return;
            }
            case 'CXXConstructorDecl':
            case 'CXXDestructorDecl':
            case 'CXXMethodDecl': {
                buildArkMethodForClassMethodInNamespace(child, namespace, sourceFile);
                return;
            }
            case 'FunctionTemplateDecl':
            case 'FunctionDecl':
            case 'FriendDecl': {
                let mthd: ArkMethod = new ArkMethod();
                buildArkMethodFromArkClass(child, namespace.getDefaultClass(), mthd, sourceFile);
                return;
            }
            case 'UsingDecl':
                // CXXTodo: using NS::Member,  scenario 'NS is from other file' is not handled.
                processUsingDeclInNamespace(child, namespace);
                return;
            default:
                logger.trace('Child joined default method of arkFile: ', child.kind);
            // join default method
        }
    });
}

function buildArkMethodForClassMethodInNamespace(methodNode: CxxAstNode, namespace: ArkNamespace, sourceFile: CxxAstNode): void {
    let className = methodNode.mangledName;
    if (!className) {
        logger.trace('Declaration class not found', methodNode);
        return;
    }
    let arkClass = namespace.getClassWithName(className);
    if (!arkClass) {
        arkClass = new ArkClass();
        arkClass.setDeclaringArkNamespace(namespace);
        arkClass.setDeclaringArkFile(namespace.getDeclaringArkFile());
        const classSignature = new ClassSignature(
            className, arkClass.getDeclaringArkFile().getFileSignature(), arkClass.getDeclaringArkNamespace()?.getSignature() || null);
        arkClass.setSignature(classSignature);
        namespace.addArkClass(arkClass, className);
    }
    let mtd: ArkMethod = new ArkMethod();
    buildArkMethodFromArkClass(methodNode, arkClass, mtd, sourceFile);
}
