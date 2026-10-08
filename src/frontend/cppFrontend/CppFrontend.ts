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
import { prepareArkFile, buildImportExportInfoFromFile } from './model/builder/ArkFileBuilder';
import { requireCxxAstParser } from './utils/cxxAstParserTypes';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'CppFrontend');

/**
 * C++ language frontend. Matches the former {@link Scene} branches for {@link Language#CXX}.
 */
export class CppFrontend {
    public buildProjectFile(scene: Scene, filePath: string, arkFile: ArkFile): void {
        if (!this.requireAstJsonDumper()) {
            return;
        }
        prepareArkFile(scene, filePath, arkFile, this.resolveLogAstInfo(scene));
    }

    /**
     * Imports-only build for a single C++ file: parses #include directives and fills
     * ImportInfo without building ArkClass/ArkMethod/ArkBody.
     */
    public buildProjectFileForImports(arkFile: ArkFile): void {
        if (!this.requireAstJsonDumper()) {
            return;
        }
        buildImportExportInfoFromFile(arkFile);
    }

    /** Returns true if astJsonDumper and cxx-ast-parser are available; otherwise logs a warning. */
    private requireAstJsonDumper(): boolean {
        try {
            const runtime = requireCxxAstParser();
            if (!runtime.isCppEnvironmentReady()) {
                logger.warn(
                    'C++ environment is not ready (astJsonDumper.node or @arkanalyzer/cxx-ast-parser); skip C++ frontend build. Run: npm run build:cpp'
                );
                return false;
            }
            return true;
        } catch {
            logger.warn('@arkanalyzer/cxx-ast-parser is not installed; skip C++ frontend build. Run: npm run build:cpp');
            return false;
        }
    }

    private resolveLogAstInfo(scene: Scene): boolean {
        return scene.getOptions().languages?.cpp?.logAstInfo === true;
    }
}
