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

import { Language } from '../../core/model/ArkFile';
import { Scene } from '../../Scene';
import { ArkFile } from '../../core/model/ArkFile';
import Logger, { LOG_MODULE_TYPE } from '../../utils/logger';
import { isAstJsonDumperAvailable } from './ast/ts/astUtils';
import { buildArkFileFromFile } from './model/builder/ArkFileBuilder';
import { FrontendParseFailure, FrontendParseResult } from '../FrontendBuilder';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'CppFrontend');

/**
 * C++ language frontend. Matches the former {@link Scene} branches for {@link Language#CXX}.
 */
export class CppFrontend {

    public buildProjectFile(scene: Scene, filePath: string, arkFile: ArkFile): void {
        if (!this.requireAstJsonDumper()) {
            return;
        }
        buildArkFileFromFile(filePath, scene.getRealProjectDir(), arkFile, scene.getProjectName(), scene.getIncludeDirs());
    }

    public buildProjectFiles(scene: Scene, filePaths: string[]): FrontendParseResult {
        if (!this.requireAstJsonDumper()) {
            return { arkFiles: [], failedFiles: [] };
        }
        const arkFiles: ArkFile[] = [];
        const failedFiles: FrontendParseFailure[] = [];
        for (const filePath of filePaths) {
            try {
                const arkFile = new ArkFile(Language.CXX);
                arkFile.setScene(scene);
                buildArkFileFromFile(filePath, scene.getRealProjectDir(), arkFile, scene.getProjectName(), scene.getIncludeDirs());
                arkFiles.push(arkFile);
            } catch (error) {
                failedFiles.push({ filePath, reason: error });
            }
        }
        return { arkFiles, failedFiles };
    }

    /** Returns true if astJsonDumper is available; otherwise logs a warning. */
    private requireAstJsonDumper(): boolean {
        if (isAstJsonDumperAvailable()) {
            return true;
        }
        logger.warn('astJsonDumper.node is not available; skip C++ frontend build.');
        return false;
    }
}
