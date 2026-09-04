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

import { FullPosition } from '../../base/Position';
import { buildClassSignature, buildDefaultArkClass, buildNormalArkClassFromArkNamespace } from './ArkClassBuilder';
import { ArkFile } from '../ArkFile';
import { buildArkMethodFromArkClass } from './ArkMethodBuilder';
import ts from 'ohos-typescript';
import { ArkNamespace } from '../ArkNamespace';
import { buildDecorators, buildModifiers } from './builderUtils';
import { cloneText } from '../../common/StringUtils';
import Logger, { LOG_MODULE_TYPE } from '../../../utils/logger';
import { buildExportAssignment, buildExportDeclaration, buildExportInfo, buildExportVariableStatement, isExported } from './ArkExportBuilder';
import { ArkClass } from '../ArkClass';
import { ArkMethod } from '../ArkMethod';
import { NamespaceSignature } from '../ArkSignature';
import { IRUtils } from '../../common/IRUtils';
import { SignatureCanonicalizerRegistry } from '../../common/SignatureCanonicalizerRegistry';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'ArkNamespaceBuilder');

export function buildNamespaceSignature(node: ts.ModuleDeclaration, declaringInstance: ArkFile | ArkNamespace): NamespaceSignature {
    const namespaceName = cloneText(node.name.text);
    if (declaringInstance instanceof ArkNamespace) {
        return new NamespaceSignature(namespaceName, declaringInstance.getDeclaringFileID(), declaringInstance.getNamespaceSigID());
    }
    return new NamespaceSignature(namespaceName, declaringInstance.getFileSigID());
}

export function buildArkNamespace(node: ts.ModuleDeclaration, ns: ArkNamespace, sourceFile: ts.SourceFile): void {
    // modifiers
    if (node.modifiers) {
        ns.setModifiers(buildModifiers(node));
        ns.setDecorators(buildDecorators(node, sourceFile));
    }

    // set line and column
    const { line, character } = ts.getLineAndCharacterOfPosition(sourceFile, node.getStart(sourceFile));
    const endPos = ts.getLineAndCharacterOfPosition(sourceFile, node.getEnd());
    ns.setOriginFullPositions([...ns.getOriginFullPositions(), new FullPosition(line + 1, character + 1, endPos.line + 1, endPos.character + 1)]);

    genDefaultArkClass(ns, node, sourceFile);

    // build ns member
    if (node.body) {
        if (ts.isModuleBlock(node.body)) {
            buildNamespaceMembers(node.body, ns, sourceFile);
        }
        // NamespaceDeclaration extends ModuleDeclaration
        //TODO: Check
        else if (ts.isModuleDeclaration(node.body)) {
            logger.trace('This ModuleBody is an NamespaceDeclaration.');
            const namespaceSig = buildNamespaceSignature(node.body, ns);
            let childNs = SignatureCanonicalizerRegistry.getInstance().getArkNamespaceBySig(namespaceSig);
            if (!childNs) {
                childNs = new ArkNamespace(ns.getDeclaringFileID(), ns.getNamespaceSigID(), namespaceSig);
                ns.addNamespace(childNs);
            }
            buildArkNamespace(node.body, childNs, sourceFile);
        } else if (ts.isIdentifier(node.body)) {
            logger.warn('ModuleBody is Identifier');
        } else {
            logger.warn('JSDocNamespaceDeclaration found.');
        }
    } else {
        logger.warn('JSDocNamespaceDeclaration found.');
    }

    IRUtils.setComments(ns, node, sourceFile, ns.getDeclaringArkFile().getScene().getOptions());
}

// TODO: check and update
function buildNamespaceMembers(node: ts.ModuleBlock, namespace: ArkNamespace, sourceFile: ts.SourceFile): void {
    const statements = node.statements;
    statements.forEach(child => {
        if (ts.isModuleDeclaration(child)) {
            const childNsSig = buildNamespaceSignature(child, namespace);
            let childNs = SignatureCanonicalizerRegistry.getInstance().getArkNamespaceBySig(childNsSig);
            if (!childNs) {
                childNs = new ArkNamespace(namespace.getDeclaringFileID(), namespace.getNamespaceSigID(), childNsSig);
                namespace.addNamespace(childNs);
            }
            buildArkNamespace(child, childNs, sourceFile);
            if (childNs.isExported()) {
                namespace.addExportInfo(buildExportInfo(childNs, namespace.getDeclaringArkFile(), FullPosition.buildFromNode(child, sourceFile)));
            }
        } else if (ts.isClassDeclaration(child) || ts.isInterfaceDeclaration(child) || ts.isEnumDeclaration(child) || ts.isStructDeclaration(child)) {
            const classSig = buildClassSignature(child, namespace);
            let cls = SignatureCanonicalizerRegistry.getInstance().getArkClassBySig(classSig);
            if (!cls) {
                cls = new ArkClass(namespace.getDeclaringFileID(), namespace.getNamespaceSigID(), classSig);
                namespace.addArkClass(cls);
            }

            buildNormalArkClassFromArkNamespace(child, cls, sourceFile);

            if (cls.isExported()) {
                namespace.addExportInfo(buildExportInfo(cls, namespace.getDeclaringArkFile(), FullPosition.buildFromNode(child, sourceFile)));
            }
        }
        // TODO: Check
        else if (ts.isMethodDeclaration(child)) {
            logger.trace('This is a MethodDeclaration in ArkNamespace.');
            const defaultClass = namespace.getDefaultClass();
            let mthd: ArkMethod = new ArkMethod(defaultClass.getClassSigID());

            buildArkMethodFromArkClass(child, defaultClass, mthd, sourceFile);

            if (mthd.isExported()) {
                namespace.addExportInfo(buildExportInfo(mthd, namespace.getDeclaringArkFile(), FullPosition.buildFromNode(child, sourceFile)));
            }
        } else if (ts.isFunctionDeclaration(child)) {
            const defaultClass = namespace.getDefaultClass();
            let mthd: ArkMethod = new ArkMethod(defaultClass.getClassSigID());

            buildArkMethodFromArkClass(child, defaultClass, mthd, sourceFile);

            if (mthd.isExported()) {
                namespace.addExportInfo(buildExportInfo(mthd, namespace.getDeclaringArkFile(), FullPosition.buildFromNode(child, sourceFile)));
            }
        } else if (ts.isExportDeclaration(child)) {
            buildExportDeclaration(child, sourceFile, namespace.getDeclaringArkFile()).forEach(item => namespace.addExportInfo(item));
        } else if (ts.isExportAssignment(child)) {
            buildExportAssignment(child, sourceFile, namespace.getDeclaringArkFile()).forEach(item => namespace.addExportInfo(item));
        } else if (ts.isVariableStatement(child) && isExported(child.modifiers)) {
            buildExportVariableStatement(child, sourceFile, namespace.getDeclaringArkFile(), namespace).forEach(item => namespace.addExportInfo(item));
        } else {
            logger.trace('Child joined default method of arkFile: ', ts.SyntaxKind[child.kind]);
            // join default method
        }
    });
}

export function genDefaultArkClass(ns: ArkNamespace, node: ts.ModuleDeclaration, sourceFile: ts.SourceFile): void {
    let defaultClass = new ArkClass(ns.getDeclaringFileID(), ns.getNamespaceSigID());
    buildDefaultArkClass(defaultClass, sourceFile, node);

    ns.setDefaultClass(defaultClass);
    ns.addArkClass(defaultClass);
}
