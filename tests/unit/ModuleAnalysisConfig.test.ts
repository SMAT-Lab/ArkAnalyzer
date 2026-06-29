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

import { describe, expect, it } from 'vitest';
import path from 'path';
import { ModuleAnalysisConfig } from '../../src/frontend/common/ModuleAnalysisConfig';
import { ModuleType } from '../../src/core/model/ArkModule';
import { ModuleDepthLevel } from '../../src/frontend/common/ModuleDepth';

describe('ModuleAnalysisConfig tests', () => {
    describe('defaults', () => {
        it('hasTargetProjectModules returns false by default', () => {
            const config = new ModuleAnalysisConfig();
            expect(config.hasTargetProjectModules()).toBe(false);
            expect(config.getTargetProjectModules().size).toBe(0);
        });
    });

    describe('addTargetProjectModule', () => {
        it('adds a single absolute module path', () => {
            const config = new ModuleAnalysisConfig();
            config.addTargetProjectModule('/project/entry');
            expect(config.hasTargetProjectModules()).toBe(true);
            expect(config.getTargetProjectModules().has('/project/entry')).toBe(true);
            expect(config.getTargetProjectModules().size).toBe(1);
        });

        it('returns this to allow chaining', () => {
            const config = new ModuleAnalysisConfig();
            const returned = config.addTargetProjectModule('/project/entry');
            expect(returned).toBe(config);
        });

        it('supports chained calls accumulating multiple modules', () => {
            const config = new ModuleAnalysisConfig();
            config.addTargetProjectModule('/project/entry').addTargetProjectModule('/project/library').addTargetProjectModule('/project/shared');
            expect(config.getTargetProjectModules().size).toBe(3);
            expect(config.getTargetProjectModules().has('/project/entry')).toBe(true);
            expect(config.getTargetProjectModules().has('/project/library')).toBe(true);
            expect(config.getTargetProjectModules().has('/project/shared')).toBe(true);
        });
    });

    describe('setTargetProjectModules', () => {
        it('sets multiple absolute module paths at once', () => {
            const config = new ModuleAnalysisConfig();
            config.setTargetProjectModules(['/project/entry', '/project/library']);
            expect(config.getTargetProjectModules().size).toBe(2);
            expect(config.getTargetProjectModules().has('/project/entry')).toBe(true);
            expect(config.getTargetProjectModules().has('/project/library')).toBe(true);
        });

        it('returns this to allow chaining', () => {
            const config = new ModuleAnalysisConfig();
            const returned = config.setTargetProjectModules(['/project/entry']);
            expect(returned).toBe(config);
        });

        it('resets the set, clearing previous entries and adding new ones', () => {
            const config = new ModuleAnalysisConfig();
            config.addTargetProjectModule('/project/entry');
            config.addTargetProjectModule('/project/library');
            expect(config.getTargetProjectModules().size).toBe(2);

            config.setTargetProjectModules(['/project/newEntry', '/project/newLibrary']);
            expect(config.getTargetProjectModules().size).toBe(2);
            expect(config.getTargetProjectModules().has('/project/entry')).toBe(false);
            expect(config.getTargetProjectModules().has('/project/library')).toBe(false);
            expect(config.getTargetProjectModules().has('/project/newEntry')).toBe(true);
            expect(config.getTargetProjectModules().has('/project/newLibrary')).toBe(true);
        });

        it('resets to empty when called with an empty array', () => {
            const config = new ModuleAnalysisConfig();
            config.addTargetProjectModule('/project/entry');
            expect(config.hasTargetProjectModules()).toBe(true);

            config.setTargetProjectModules([]);
            expect(config.hasTargetProjectModules()).toBe(false);
            expect(config.getTargetProjectModules().size).toBe(0);
        });
    });

    describe('deduplication', () => {
        it('stores the same path added multiple times only once via addTargetProjectModule', () => {
            const config = new ModuleAnalysisConfig();
            config.addTargetProjectModule('/project/entry').addTargetProjectModule('/project/entry').addTargetProjectModule('/project/entry');
            expect(config.getTargetProjectModules().size).toBe(1);
            expect(config.getTargetProjectModules().has('/project/entry')).toBe(true);
        });

        it('stores duplicate paths in setTargetProjectModules only once', () => {
            const config = new ModuleAnalysisConfig();
            config.setTargetProjectModules(['/project/entry', '/project/entry', '/project/library']);
            expect(config.getTargetProjectModules().size).toBe(2);
        });
    });

    describe('relative path normalization', () => {
        it('normalizes a relative path via path.resolve in addTargetProjectModule', () => {
            const config = new ModuleAnalysisConfig();
            config.addTargetProjectModule('./relative/path');
            const expected = path.resolve('./relative/path');
            expect(config.getTargetProjectModules().has(expected)).toBe(true);
            expect(config.getTargetProjectModules().has('./relative/path')).toBe(false);
        });

        it('normalizes relative paths via path.resolve in setTargetProjectModules', () => {
            const config = new ModuleAnalysisConfig();
            config.setTargetProjectModules(['./relative/a', './relative/b']);
            expect(config.getTargetProjectModules().has(path.resolve('./relative/a'))).toBe(true);
            expect(config.getTargetProjectModules().has(path.resolve('./relative/b'))).toBe(true);
            expect(config.getTargetProjectModules().size).toBe(2);
        });

        it('keeps absolute paths unchanged', () => {
            const config = new ModuleAnalysisConfig();
            config.setTargetProjectModules(['/abs/path/a', './rel/path/b']);
            expect(config.getTargetProjectModules().has('/abs/path/a')).toBe(true);
            expect(config.getTargetProjectModules().has(path.resolve('./rel/path/b'))).toBe(true);
        });
    });

    describe('load levels', () => {
        it('defaults to META for all ModuleTypes', () => {
            const config = new ModuleAnalysisConfig();
            expect(config.getLoadLevel(ModuleType.SDK)).toBe(ModuleDepthLevel.META);
            expect(config.getLoadLevel(ModuleType.PROJECT)).toBe(ModuleDepthLevel.META);
            expect(config.getLoadLevel(ModuleType.OH_MODULES)).toBe(ModuleDepthLevel.META);
        });

        it('setLoadLevel stores a custom load level', () => {
            const config = new ModuleAnalysisConfig();
            config.setLoadLevel(ModuleType.PROJECT, ModuleDepthLevel.BODIES);
            expect(config.getLoadLevel(ModuleType.PROJECT)).toBe(ModuleDepthLevel.BODIES);
        });

        it('getLoadLevel returns the value set by setLoadLevel', () => {
            const config = new ModuleAnalysisConfig();
            config.setLoadLevel(ModuleType.SDK, ModuleDepthLevel.IMPORTS);
            expect(config.getLoadLevel(ModuleType.SDK)).toBe(ModuleDepthLevel.IMPORTS);
            config.setLoadLevel(ModuleType.OH_MODULES, ModuleDepthLevel.SIGNATURES);
            expect(config.getLoadLevel(ModuleType.OH_MODULES)).toBe(ModuleDepthLevel.SIGNATURES);
        });

        it('setLoadLevel returns this to allow chaining', () => {
            const config = new ModuleAnalysisConfig();
            const returned = config.setLoadLevel(ModuleType.PROJECT, ModuleDepthLevel.SIGNATURES);
            expect(returned).toBe(config);
        });

        it('supports chained setLoadLevel calls', () => {
            const config = new ModuleAnalysisConfig();
            config.setLoadLevel(ModuleType.SDK, ModuleDepthLevel.IMPORTS)
                .setLoadLevel(ModuleType.PROJECT, ModuleDepthLevel.SIGNATURES)
                .setLoadLevel(ModuleType.OH_MODULES, ModuleDepthLevel.BODIES);
            expect(config.getLoadLevel(ModuleType.SDK)).toBe(ModuleDepthLevel.IMPORTS);
            expect(config.getLoadLevel(ModuleType.PROJECT)).toBe(ModuleDepthLevel.SIGNATURES);
            expect(config.getLoadLevel(ModuleType.OH_MODULES)).toBe(ModuleDepthLevel.BODIES);
        });

        it('getLoadLevel falls back to META for an unset type', () => {
            const config = new ModuleAnalysisConfig();
            // ModuleType values 0-2 are set in the constructor; an out-of-range value
            // exercises the ?? META fallback path.
            expect(config.getLoadLevel(99 as ModuleType)).toBe(ModuleDepthLevel.META);
        });

        it('does not affect other types when setting a single type', () => {
            const config = new ModuleAnalysisConfig();
            config.setLoadLevel(ModuleType.PROJECT, ModuleDepthLevel.BODIES);
            expect(config.getLoadLevel(ModuleType.SDK)).toBe(ModuleDepthLevel.META);
            expect(config.getLoadLevel(ModuleType.OH_MODULES)).toBe(ModuleDepthLevel.META);
        });
    });
});
