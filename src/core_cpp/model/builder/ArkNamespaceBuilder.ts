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

import { buildDefaultArkClassFromArkNamespace, buildNormalArkClassFromArkNamespace } from './ArkClassBuilder';
import { ArkFile } from '../../../core/model/ArkFile';
import { buildArkMethodFromArkClass } from './ArkMethodBuilder';
import ts from 'ohos-typescript';
import { ArkNamespace } from '../../../core/model/ArkNamespace';
import { buildDecorators, buildModifiers } from './builderUtils';
import Logger, { LOG_MODULE_TYPE } from '../../../utils/logger';
import { ArkClass } from '../../../core/model/ArkClass';
import { ArkMethod } from '../../../core/model/ArkMethod';
import { NamespaceSignature } from '../../../core/model/ArkSignature';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'ArkNamespaceBuilder');

export function buildArkNamespace(node: any, declaringInstance: ArkFile | ArkNamespace, ns: ArkNamespace, sourceFile: any): void {
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
    if (node.loc){
        ns.setLine(node.loc.line);
    } else {
        ns.setLine(-1);
        ns.setColumn(-1)
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
function buildNamespaceMembers(node: any, namespace: ArkNamespace, sourceFile: any): void {
    const statements = node.inner;
    statements.forEach((child:any) => {
        if (child.kind === 'NamespaceDecl') {
            let childNs: ArkNamespace = new ArkNamespace();
            childNs.setDeclaringArkNamespace(namespace);
            childNs.setDeclaringArkFile(namespace.getDeclaringArkFile());

            buildArkNamespace(child, namespace, childNs, sourceFile);
            namespace.addNamespace(childNs);
        } else if ( child.kind === 'CXXRecordDecl' || child.kind === 'ClassTemplate') {
            let cls: ArkClass = new ArkClass();

            buildNormalArkClassFromArkNamespace(child, namespace, cls, sourceFile);
            namespace.addArkClass(cls);

        } else if (child.kind === 'FunctionDecl' || child.kind === 'FriendDecl') {
            logger.trace('This is a MethodDeclaration in ArkNamespace.');
            let mthd: ArkMethod = new ArkMethod();

            buildArkMethodFromArkClass(child, namespace.getDefaultClass(), mthd, sourceFile);

        } else {
            logger.trace('Child joined default method of arkFile: ', ts.SyntaxKind[child.kind]);
            // join default method
        }
    });
}

function genDefaultArkClass(ns: ArkNamespace, node: ts.ModuleDeclaration, sourceFile: ts.SourceFile): void {
    let defaultClass = new ArkClass();

    buildDefaultArkClassFromArkNamespace(ns, defaultClass, node, sourceFile);
    ns.setDefaultClass(defaultClass);
    ns.addArkClass(defaultClass);
}

export function mergeNameSpaces(arkNamespaces: ArkNamespace[]): ArkNamespace[] {
    const namespaceMap = new Map<string, ArkNamespace>();
    for (let i = 0; i < arkNamespaces.length; i++) {
        const currNamespace = arkNamespaces[i];
        const currName = currNamespace.getName();
        if (namespaceMap.has(currName)) {
            const prevNamespace = namespaceMap.get(currName)!;
            const nestedPrevNamespaces = prevNamespace.getNamespaces();
            const nestedCurrNamespaces = currNamespace.getNamespaces();
            const nestedMergedNameSpaces = mergeNameSpaces([...nestedPrevNamespaces, ...nestedCurrNamespaces]);
            nestedMergedNameSpaces.forEach(nestedNameSpace => {
                prevNamespace.addNamespace(nestedNameSpace);
            });
            const classes = currNamespace.getClasses();
            classes.forEach(cls => {
                prevNamespace.addArkClass(cls);
            });
            const preSourceCodes = prevNamespace.getCodes();
            const currSourceCodes = currNamespace.getCodes();
            prevNamespace.setCodes([...preSourceCodes, ...currSourceCodes]);
            const prevLineColPairs = prevNamespace.getLineColPairs();
            const currLineColPairs = currNamespace.getLineColPairs();
            prevNamespace.setLineCols([...prevLineColPairs, ...currLineColPairs]);
        } else {
            namespaceMap.set(currName, currNamespace);
        }
    }
    return [...namespaceMap.values()];
}
