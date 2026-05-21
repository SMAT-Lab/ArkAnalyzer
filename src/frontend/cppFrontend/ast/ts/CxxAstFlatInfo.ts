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

import * as fs from 'fs';

import { ByteBuffer } from 'flatbuffers';

import Logger, { LOG_MODULE_TYPE } from '../../../../utils/logger';
import type { CxxAstNode } from './ArkCxxAstNode';
import { CxxAstPayload } from './serialization/flatGenerated/ark-cxx-ast-fb/cxx-ast-payload';
import { decodeWireNode } from './serialization/WireDecoder';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'CxxAstFlatInfo');

const EXPECTED_WIRE_VERSION = 3;

export type CxxAstFlatStage = 'cpp_dump' | 'read_flat' | 'validate_flat' | 'decode';

export class CxxAstFlatError extends Error {
    public readonly stage: CxxAstFlatStage;

    constructor(stage: CxxAstFlatStage, message: string) {
        super(message);
        this.name = 'CxxAstFlatError';
        this.stage = stage;
    }
}

export interface CxxAstFlatStats {
    sourceFile: string;
    flatPath: string;
    flatBytes: number;
    wireVersion: number;
    exitCode: number;
    nodeCount: number;
    maxDepth: number;
    nodesWithLoc: number;
    topLevelDeclCount: number;
}

export interface CxxAstFlatLoadResult {
    root: CxxAstNode;
    stats: CxxAstFlatStats;
}

/** Flat payload I/O, validation, decode, and stats logging for C++ AST. */
export class CxxAstFlatInfo {
    public static loadAndDecode(
        sourceFile: string,
        astPath: string,
        exitCode: number,
        logAstInfo: boolean = false,
    ): CxxAstFlatLoadResult {
        CxxAstFlatInfo.ensureDumpOutput(sourceFile, astPath, exitCode);
        const bytes = CxxAstFlatInfo.readFlatFile(sourceFile, astPath);
        const { wireVersion, root } = CxxAstFlatInfo.validateAndDecode(bytes);
        const treeStats = CxxAstFlatInfo.collectTreeStats(root);
        const stats: CxxAstFlatStats = {
            sourceFile,
            flatPath: astPath,
            flatBytes: bytes.length,
            wireVersion,
            exitCode,
            ...treeStats,
        };
        if (logAstInfo) {
            CxxAstFlatInfo.logStats(stats);
        }
        return { root, stats };
    }

    public static logError(sourceFile: string, error: Error): void {
        const stage = error instanceof CxxAstFlatError ? error.stage : 'unknown';
        logger.error(`C++ AST flat failed: file=${sourceFile} stage=${stage} message=${error.message}`);
    }

    private static ensureDumpOutput(sourceFile: string, astPath: string, exitCode: number): void {
        if (!astPath.trim()) {
            const reason =
                exitCode !== 0 ? `clang dump failed with exitCode=${exitCode}` : 'missing flat output path';
            throw new CxxAstFlatError('cpp_dump', reason);
        }
        if (exitCode !== 0) {
            logger.warn(
                `C++ AST dump returned non-zero exitCode=${exitCode} but flat payload exists: file=${sourceFile}`
            );
        }
    }

    private static readFlatFile(sourceFile: string, astPath: string): Buffer {
        let bytes: Buffer;
        try {
            bytes = fs.readFileSync(astPath);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            throw new CxxAstFlatError('read_flat', `cannot read ${astPath}: ${message}`);
        }
        if (bytes.length === 0) {
            throw new CxxAstFlatError('read_flat', `flat file is empty: ${astPath} source=${sourceFile}`);
        }
        return bytes;
    }

    private static validateAndDecode(bytes: Buffer): { wireVersion: number; root: CxxAstNode } {
        CxxAstFlatInfo.validateFlatBuffer(bytes);
        try {
            const bb = new ByteBuffer(new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength));
            const payload = CxxAstPayload.getRootAsCxxAstPayload(bb);
            const wireVersion = payload.wireVersion();
            if (wireVersion !== EXPECTED_WIRE_VERSION) {
                throw new CxxAstFlatError(
                    'validate_flat',
                    `wire version mismatch: expected ${EXPECTED_WIRE_VERSION}, got ${wireVersion}`
                );
            }
            const wire = payload.root();
            if (!wire) {
                throw new CxxAstFlatError('validate_flat', 'missing root node in flat payload');
            }
            const root = decodeWireNode(wire);
            if (root.kind !== 'TranslationUnitDecl') {
                throw new CxxAstFlatError(
                    'validate_flat',
                    `unexpected root kind: ${root.kind || '(empty)'}`
                );
            }
            return { wireVersion, root };
        } catch (error) {
            if (error instanceof CxxAstFlatError) {
                throw error;
            }
            const message = error instanceof Error ? error.message : String(error);
            throw new CxxAstFlatError('decode', message);
        }
    }

    private static validateFlatBuffer(bytes: Buffer): void {
        if (bytes.length < 4) {
            throw new CxxAstFlatError('validate_flat', `flat payload too small: ${bytes.length} bytes`);
        }
        const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        const rootOffset = view.getInt32(0, true);
        if (rootOffset <= 0 || rootOffset >= bytes.length) {
            throw new CxxAstFlatError(
                'validate_flat',
                `invalid flat root offset: ${rootOffset} (payloadBytes=${bytes.length})`
            );
        }
    }

    private static collectTreeStats(root: CxxAstNode): Pick<
        CxxAstFlatStats,
        'nodeCount' | 'maxDepth' | 'nodesWithLoc' | 'topLevelDeclCount'
    > {
        let nodeCount = 0;
        let maxDepth = 0;
        let nodesWithLoc = 0;

        const walk = (node: CxxAstNode, depth: number): void => {
            nodeCount++;
            maxDepth = Math.max(maxDepth, depth);
            if (node.loc !== undefined || node.range !== undefined) {
                nodesWithLoc++;
            }
            for (const child of node.inner ?? []) {
                walk(child, depth + 1);
            }
            for (const headerUnit of node.headerUnits ?? []) {
                walk(headerUnit, depth + 1);
            }
        };

        walk(root, 1);
        return {
            nodeCount,
            maxDepth,
            nodesWithLoc,
            topLevelDeclCount: root.inner?.length ?? 0,
        };
    }

    private static logStats(stats: CxxAstFlatStats): void {
        logger.info(
            `C++ AST flat ok: file=${stats.sourceFile} flatBytes=${stats.flatBytes} ` +
                `wireVersion=${stats.wireVersion} exitCode=${stats.exitCode} ` +
                `nodeCount=${stats.nodeCount} maxDepth=${stats.maxDepth} ` +
                `nodesWithLoc=${stats.nodesWithLoc} topLevelDeclCount=${stats.topLevelDeclCount}`
        );
    }
}
