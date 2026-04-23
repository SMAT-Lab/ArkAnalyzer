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

import path from 'path';
import { Language } from '../../core/model/ArkFile';
import { Scene } from '../../Scene';
import { ArkFile } from '../../core/model/ArkFile';
import { buildArkFileFromFile } from './model/builder/ArkFileBuilder';
import { findCompileCommands, getCxxHeaderFileExtensionSet } from './ast';
import { LanguageFrontend } from '../LanguageFrontend';

const CXX_HEADER_EXTENSION_SET = getCxxHeaderFileExtensionSet();

/**
 * C++: builds {@link ArkFile}s using the C++ front-end (see {@link buildArkFileFromFile} in this module).
 * {@link CppBuildProjectFileOptions#refreshCompileDatabasePath} must mirror legacy {@link Scene} behaviour: only the
 * project-wide `genArkFiles` path updated `compile_commands.json` discovery; dependency and module paths did not.
 */
export type CppBuildProjectFileOptions = {
    /** When `true`, apply the same `compile_commands.json` path refresh as the former `Scene.genArkFiles` C++ branch. */
    refreshCompileDatabasePath: boolean;
};

/**
 * C++ language frontend. Matches the former {@link Scene} branches for {@link Language#CXX}.
 */
export class CppFrontend implements LanguageFrontend {
    public readonly id: string = 'cpp';

    public buildProjectFile(scene: Scene, filePath: string, arkFile: ArkFile, options: CppBuildProjectFileOptions): void {
        if (options.refreshCompileDatabasePath) {
            const next = this.findCCJsonPath(filePath, scene.getCcjsonPath());
            scene.setCcjsonPath(next);
        }
        buildArkFileFromFile(filePath, scene.getRealProjectDir(), arkFile, scene.getProjectName(), scene.getIncludeDirs());
    }

    private findCCJsonPath(file: string, ccjsonPath: string): string {
        const ext = path.extname(file).toLowerCase();
        const isHeader = CXX_HEADER_EXTENSION_SET.has(ext);
        let currentCcjsonPath = '';
        if (!isHeader) {
            currentCcjsonPath = findCompileCommands(file);
        }
        return currentCcjsonPath === '' ? ccjsonPath : currentCcjsonPath;
    }
}
