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

import { Scene } from '../../Scene';
import { ArkFile } from '../../core/model/ArkFile';
import Logger, { LOG_MODULE_TYPE } from '../../utils/logger';
import { isAstJsonDumperAvailable } from './ast/ts/astUtils';
import { prepareArkFile, prepareArkFiles } from './model/builder/ArkFileBuilder';
import { FrontendParseFailure, FrontendParseResult } from '../FrontendBuilder';
import os from 'os';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'CppFrontend');

/**
 * C++ language frontend. Matches the former {@link Scene} branches for {@link Language#CXX}.
 */
export class CppFrontend {
    private static readonly AUTO_MAX_PARALLEL_PROCESSES = -1;
    private static readonly AUTO_MAX_PENDING_AST_RESULTS = -1;

    public buildProjectFile(scene: Scene, filePath: string, arkFile: ArkFile): void {
        if (!this.requireAstJsonDumper()) {
            return;
        }
        prepareArkFile(scene, filePath, arkFile,);
    }

    public buildProjectFiles(scene: Scene, filePaths: string[]): FrontendParseResult {
        if (!this.requireAstJsonDumper()) {
            return { arkFiles: [], failedFiles: [] };
        }
        const maxParallelProcesses = this.resolveMaxParallelProcesses(scene);
        const maxPendingAstResults = this.resolveMaxPendingAstResults(scene, maxParallelProcesses);
        const result = prepareArkFiles(scene, filePaths, maxParallelProcesses, maxPendingAstResults,);
        const failedFiles: FrontendParseFailure[] = result.failedFiles;
        return { arkFiles: result.arkFiles, failedFiles };
    }

    /** Returns true if astJsonDumper is available; otherwise logs a warning. */
    private requireAstJsonDumper(): boolean {
        if (isAstJsonDumperAvailable()) {
            return true;
        }
        logger.warn('astJsonDumper.node is not available; skip C++ frontend build.');
        return false;
    }

    private resolveMaxParallelProcesses(scene: Scene): number {
        const configured = scene.getOptions().languages?.cpp?.maxParallelProcesses;
        if (configured === CppFrontend.AUTO_MAX_PARALLEL_PROCESSES) {
            try {
                const cpuCount = os.cpus()?.length ?? 0;
                return Math.max(1, cpuCount - 1);
            } catch {
                return 1;
            }
        }
        if (configured !== undefined && !Number.isInteger(configured)) {
            logger.warn(
                `languages.cpp.maxParallelProcesses must be a positive integer or ` +
                `${CppFrontend.AUTO_MAX_PARALLEL_PROCESSES} for auto; got ${JSON.stringify(configured)}, using 1.`,
            );
        }
        if (Number.isInteger(configured) && configured !== undefined && configured > 0) {
            return configured;
        }
        return 1;
    }

    private resolveMaxPendingAstResults(scene: Scene, maxParallelProcesses: number): number {
        const configured = scene.getOptions().languages?.cpp?.maxPendingAstResults;
        const fallback = Math.max(1, maxParallelProcesses * 2);
        if (configured === CppFrontend.AUTO_MAX_PENDING_AST_RESULTS || configured === undefined) {
            return fallback;
        }
        if (!Number.isInteger(configured)) {
            logger.warn(
                `languages.cpp.maxPendingAstResults must be a positive integer or ` +
                `${CppFrontend.AUTO_MAX_PENDING_AST_RESULTS} for auto; got ${JSON.stringify(configured)}, using ` +
                `${fallback}.`,
            );
            return fallback;
        }
        if (configured > 0) {
            return configured;
        }
        return fallback;
    }
}
