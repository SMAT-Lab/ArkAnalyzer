/*
 * Copyright (c) 2026 Huawei Device Co., Ltd.
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

import fs from 'fs';
import ts from 'ohos-typescript';

import { ArkFile } from '../../core/model/ArkFile';
import { FullPosition } from '../../core/base/Position';
import { BodyBuilder } from '../../core/model/builder/BodyBuilder';
import { ModelUtils } from '../../core/common/ModelUtils';
import { ETS_COMPILER_OPTIONS } from '../../core/common/EtsConst';
import { cloneText } from '../../core/common/StringUtils';
import { parseArkSourceFile } from '../../utils/parseArkSourceFile';
import Logger, { LOG_MODULE_TYPE } from '../../utils/logger';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'FileBodyRemount');

/**
 * Build a file's method bodies from a fresh parse of the file, so the signature round does not
 * have to keep every file's AST (and the BodyBuilders mounted on it) alive until the body phase.
 *
 * The signature round records each implementation method's source position on its ArkMethod
 * (`implOriginFullPosition`), so a re-parsed tree can be indexed by position and every builder
 * reconstructed exactly as the signature round built it.
 *
 * `implOriginFullPosition` is 1-based (FullPosition) while `getLineAndCharacterOfPosition` is
 * 0-based: the +1 belongs on both sides of the packed key or nothing matches. Methods whose
 * position is absent or synthetic (0,0,0,0) never had a builder in the signature round - %dflt
 * (built with the signature round's AST), instanceInit/staticInit and generated constructors -
 * and are skipped; static blocks are generated but carry a real position and are re-built here.
 */
export function buildFileBodies(arkFile: ArkFile): void {
    let sourceText: string;
    try {
        sourceText = fs.readFileSync(arkFile.getFilePath(), 'utf8');
    } catch (error) {
        logger.error(`Failed to read file for body build: ${arkFile.getFilePath()} ${error}`);
        return;
    }
    const sourceFile = parseArkSourceFile(arkFile.getName(), sourceText, true, ETS_COMPILER_OPTIONS);
    const nodesByPosition = new Map<number, ts.Node>();
    collectBuilderNodes(sourceFile, sourceFile, nodesByPosition);
    // Generated methods are included on purpose: static blocks are generated but carry a real
    // position and had a builder, unlike instanceInit/staticInit (synthetic (0,0,0,0) position).
    for (const cls of ModelUtils.getAllClassesInFile(arkFile)) {
        for (const method of cls.getMethods(true)) {
            const position = method.getImplOriginFullPosition();
            if (!position || position.getFirstLine() === 0) {
                continue;
            }
            if (!method.isGenerated() && !method.getImplementationSignature()) {
                continue;
            }
            const node = nodesByPosition.get(positionKey(position));
            if (!node) {
                logger.warn(
                    `Body build missed a method (position not found in the fresh parse): ` +
                        `${arkFile.getName()}#${method.getName()}@${position.getFirstLine()}:${position.getFirstCol()}`
                );
                continue;
            }
            try {
                const builder = new BodyBuilder(method.getSignature(), node, method, sourceFile);
                builder.setParamsPositions(buildParamsPositions(node, sourceFile));
                method.setBodyBuilder(builder);
                method.buildBody();
            } catch (error) {
                logger.error('Error building body:', method.getSignature(), error);
            } finally {
                method.freeBodyBuilder();
            }
        }
    }
}

function positionKey(position: FullPosition): number {
    return position.getFirstLine() * 0x100000 + position.getFirstCol();
}

function collectBuilderNodes(node: ts.Node, sourceFile: ts.SourceFile, into: Map<number, ts.Node>): void {
    if (
        ts.isFunctionDeclaration(node) ||
        ts.isMethodDeclaration(node) ||
        ts.isConstructorDeclaration(node) ||
        ts.isGetAccessorDeclaration(node) ||
        ts.isSetAccessorDeclaration(node) ||
        ts.isArrowFunction(node) ||
        ts.isFunctionExpression(node) ||
        ts.isClassStaticBlockDeclaration(node)
    ) {
        const { line, character } = ts.getLineAndCharacterOfPosition(sourceFile, node.getStart(sourceFile));
        into.set((line + 1) * 0x100000 + (character + 1), node);
    }
    ts.forEachChild(node, child => collectBuilderNodes(child, sourceFile, into));
}

function buildParamsPositions(node: ts.Node, sourceFile: ts.SourceFile): Map<string, FullPosition> {
    const map = new Map<string, FullPosition>();
    const parameters = (node as ts.FunctionLikeDeclaration).parameters;
    if (!parameters) {
        return map;
    }
    for (const parameter of parameters) {
        if (ts.isIdentifier(parameter.name)) {
            map.set(cloneText(parameter.name.text), FullPosition.buildFromNode(parameter.name, sourceFile));
        } else if (ts.isObjectBindingPattern(parameter.name)) {
            map.set('ObjectBindingPattern', FullPosition.buildFromNode(parameter.name, sourceFile));
        } else if (ts.isArrayBindingPattern(parameter.name)) {
            map.set('ArrayBindingPattern', FullPosition.buildFromNode(parameter.name, sourceFile));
        }
    }
    return map;
}
