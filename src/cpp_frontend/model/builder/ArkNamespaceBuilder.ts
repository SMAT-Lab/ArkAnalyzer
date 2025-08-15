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
import { ArkFile } from '../../../core/model/ArkFile';
import { buildArkMethodFromArkClass } from './ArkMethodBuilder';
import { ArkNamespace } from '../../../core/model/ArkNamespace';
import { buildModifiers, buildDecorators } from './builderUtils';
import Logger, { LOG_MODULE_TYPE } from '../../../utils/logger';
import { ArkClass } from '../../../core/model/ArkClass';
import { ArkMethod } from '../../../core/model/ArkMethod';
import { ClassSignature, NamespaceSignature } from '../../../core/model/ArkSignature';
import { CppAstNode } from '../../ast/ArkCxxAstNode';
import { DEFAULT_ARK_CLASS_NAME } from '../../../core/common/Const';
import { buildDefaultArkMethodFromArkClass } from './ArkMethodBuilder';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'ArkNamespaceBuilder');

function buildDefaultArkClass(cls: ArkClass, sourceFile: CppAstNode, node?: CppAstNode): void {
    const defaultArkClassSignature = new ClassSignature(
        DEFAULT_ARK_CLASS_NAME,
        cls.getDeclaringArkFile().getFileSignature(),
        cls.getDeclaringArkNamespace()?.getSignature() || null
    );
    cls.setSignature(defaultArkClassSignature);

    genDefaultArkMethod(cls, sourceFile, node);
}

function genDefaultArkMethod(cls: ArkClass, sourceFile: CppAstNode, node?: CppAstNode): void {
    let defaultMethod = new ArkMethod();
    buildDefaultArkMethodFromArkClass(cls, defaultMethod, sourceFile, node);
    cls.setDefaultArkMethod(defaultMethod);
}

export function buildDefaultArkClassFromArkNamespace(
    arkNamespace: ArkNamespace,
    defaultClass: ArkClass,
    nsNode: CppAstNode,
    sourceFile: CppAstNode
): void {
    defaultClass.setDeclaringArkNamespace(arkNamespace);
    defaultClass.setDeclaringArkFile(arkNamespace.getDeclaringArkFile());
    buildDefaultArkClass(defaultClass, sourceFile, nsNode);
}


export function genDefaultArkClass(ns: ArkNamespace, node: CppAstNode, sourceFile: CppAstNode): void {
    let defaultClass = new ArkClass();

    buildDefaultArkClassFromArkNamespace(ns, defaultClass, node, sourceFile);
    ns.setDefaultClass(defaultClass);
    ns.addArkClass(defaultClass);
}

export function buildArkNamespace(node: CppAstNode, declaringInstance: ArkFile | ArkNamespace, ns: ArkNamespace, sourceFile: CppAstNode): void {
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
    const namespaceName = node.name;
    const namespaceSignature = new NamespaceSignature(
        namespaceName,
        ns.getDeclaringArkFile().getFileSignature(),
        ns.getDeclaringArkNamespace()?.getSignature() || null
    );
    ns.setSignature(namespaceSignature);

    // TODO: whether needed?
    ns.setCode(node.code);

    // set line and column
    if (node.range?.begin) {
        ns.setLine(node.range.begin.line);
    } else {
        ns.setLine(-1);
        ns.setColumn(-1);
    }

    genDefaultArkClass(ns, node, sourceFile);

    // build ns member
    if (node.inner) {
        buildNamespaceMembers(node, ns, sourceFile);
    } else {
        logger.warn('JSDocNamespaceDeclaration found.');
    }
}

// TODO: check and update
function buildNamespaceMembers(node: CppAstNode, namespace: ArkNamespace, sourceFile: CppAstNode): void {
    const statements = node.inner;
    statements.forEach((child: CppAstNode) => {
        if (child.kind === 'Namespace') {
            let childNs: ArkNamespace = new ArkNamespace();
            childNs.setDeclaringArkNamespace(namespace);
            childNs.setDeclaringArkFile(namespace.getDeclaringArkFile());

            buildArkNamespace(child, namespace, childNs, sourceFile);
            namespace.addNamespace(childNs);
        } else if (child.kind === 'CXXRecordDecl' || child.kind === 'ClassTemplate') {
            let cls: ArkClass = new ArkClass();

            buildNormalArkClassFromArkNamespace(child, namespace, cls, sourceFile);
            namespace.addArkClass(cls);
        } else if (child.kind === 'FunctionDecl' || child.kind === 'FriendDecl') {
            logger.trace('This is a MethodDeclaration in ArkNamespace.');
            let mthd: ArkMethod = new ArkMethod();

            buildArkMethodFromArkClass(child, namespace.getDefaultClass(), mthd, sourceFile);
        } else {
            logger.trace('Child joined default method of arkFile: ', child.kind);
            // join default method
        }
    });
}
