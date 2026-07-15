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
import { ModuleAnalysisConfig } from '../../src/frontend/common/ModuleAnalysisConfig';
import { ModuleType } from '../../src/core/model/ArkModule';
import { ModuleDepthLevel } from '../../src/frontend/common/ModuleDepth';

describe('ModuleAnalysisConfig tests', () => {
    describe('type filter', () => {
        it('no types included by default', () => {
            const config = new ModuleAnalysisConfig();
            expect(config.isTypeIncluded(ModuleType.PROJECT)).toBe(false);
            expect(config.isTypeIncluded(ModuleType.OH_MODULES)).toBe(false);
            expect(config.isTypeIncluded(ModuleType.SDK)).toBe(false);
        });

        it('setIncludeType toggles a type on', () => {
            const config = new ModuleAnalysisConfig();
            config.setIncludeType(ModuleType.SDK, true);
            expect(config.isTypeIncluded(ModuleType.SDK)).toBe(true);
        });

        it('setIncludeType toggles a type off', () => {
            const config = new ModuleAnalysisConfig();
            config.setIncludeType(ModuleType.PROJECT, true);
            config.setIncludeType(ModuleType.OH_MODULES, false);
            expect(config.isTypeIncluded(ModuleType.OH_MODULES)).toBe(false);
            expect(config.isTypeIncluded(ModuleType.PROJECT)).toBe(true);
        });

        it('returns this to allow chaining', () => {
            const config = new ModuleAnalysisConfig();
            expect(config.setIncludeType(ModuleType.SDK, true)).toBe(config);
        });
    });

    describe('target module IDs (include)', () => {
        it('is empty by default', () => {
            const config = new ModuleAnalysisConfig();
            expect(config.getTargetModuleIds().count()).toBe(0);
        });

        it('setTargetModuleIds replaces the set', () => {
            const config = new ModuleAnalysisConfig();
            config.setTargetModuleIds([1, 3, 5]);
            expect(config.getTargetModuleIds().count()).toBe(3);
            expect(config.getTargetModuleIds().test(1)).toBe(true);
            expect(config.getTargetModuleIds().test(3)).toBe(true);
            expect(config.getTargetModuleIds().test(5)).toBe(true);
            expect(config.getTargetModuleIds().test(2)).toBe(false);
        });

        it('addTargetModuleId adds a single ID', () => {
            const config = new ModuleAnalysisConfig();
            config.addTargetModuleId(7);
            expect(config.getTargetModuleIds().test(7)).toBe(true);
            expect(config.getTargetModuleIds().count()).toBe(1);
        });

        it('setTargetModuleIds clears previous entries', () => {
            const config = new ModuleAnalysisConfig();
            config.addTargetModuleId(1);
            config.addTargetModuleId(2);
            config.setTargetModuleIds([3, 4]);
            expect(config.getTargetModuleIds().test(1)).toBe(false);
            expect(config.getTargetModuleIds().test(2)).toBe(false);
            expect(config.getTargetModuleIds().test(3)).toBe(true);
            expect(config.getTargetModuleIds().test(4)).toBe(true);
        });

        it('deduplicates IDs', () => {
            const config = new ModuleAnalysisConfig();
            config.addTargetModuleId(1);
            config.addTargetModuleId(1);
            config.addTargetModuleId(1);
            expect(config.getTargetModuleIds().count()).toBe(1);
        });

        it('returns this to allow chaining', () => {
            const config = new ModuleAnalysisConfig();
            expect(config.setTargetModuleIds([1])).toBe(config);
            expect(config.addTargetModuleId(2)).toBe(config);
        });
    });

    describe('excluded module IDs', () => {
        it('is empty by default', () => {
            const config = new ModuleAnalysisConfig();
            expect(config.getExcludedModuleIds().count()).toBe(0);
        });

        it('excludeModuleId adds a single ID', () => {
            const config = new ModuleAnalysisConfig();
            config.excludeModuleId(3);
            expect(config.getExcludedModuleIds().test(3)).toBe(true);
            expect(config.getExcludedModuleIds().count()).toBe(1);
        });

        it('setExcludedModuleIds replaces the set', () => {
            const config = new ModuleAnalysisConfig();
            config.excludeModuleId(1);
            config.setExcludedModuleIds([2, 3]);
            expect(config.getExcludedModuleIds().test(1)).toBe(false);
            expect(config.getExcludedModuleIds().test(2)).toBe(true);
            expect(config.getExcludedModuleIds().test(3)).toBe(true);
        });

        it('returns this to allow chaining', () => {
            const config = new ModuleAnalysisConfig();
            expect(config.excludeModuleId(1)).toBe(config);
            expect(config.setExcludedModuleIds([2])).toBe(config);
        });
    });

    describe('load levels', () => {
        it('loadLevel defaults to BODIES', () => {
            const config = new ModuleAnalysisConfig();
            expect(config.getLoadLevel()).toBe(ModuleDepthLevel.BODIES);
        });

        it('dependencyLoadLevel defaults to SIGNATURES', () => {
            const config = new ModuleAnalysisConfig();
            expect(config.getDependencyLoadLevel()).toBe(ModuleDepthLevel.SIGNATURES);
        });

        it('setLoadLevel stores a custom load level', () => {
            const config = new ModuleAnalysisConfig();
            config.setLoadLevel(ModuleDepthLevel.META);
            expect(config.getLoadLevel()).toBe(ModuleDepthLevel.META);
        });

        it('setDependencyLoadLevel stores a custom dependency load level', () => {
            const config = new ModuleAnalysisConfig();
            config.setDependencyLoadLevel(ModuleDepthLevel.BODIES);
            expect(config.getDependencyLoadLevel()).toBe(ModuleDepthLevel.BODIES);
        });

        it('setLoadLevel returns this to allow chaining', () => {
            const config = new ModuleAnalysisConfig();
            expect(config.setLoadLevel(ModuleDepthLevel.SIGNATURES)).toBe(config);
        });

        it('setDependencyLoadLevel returns this to allow chaining', () => {
            const config = new ModuleAnalysisConfig();
            expect(config.setDependencyLoadLevel(ModuleDepthLevel.META)).toBe(config);
        });
    });
});
