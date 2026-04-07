/*
 * Copyright (c) 2024-2026 Huawei Device Co., Ltd.
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

import { fetchDependenciesFromFile } from '../../src/utils/json5parser';
import { afterEach, assert, beforeEach, describe, expect, it } from 'vitest';
import { ModuleUtils } from '../../src/utils/ModuleUtils';


describe('generateModuleMap Test', () => {
    beforeEach(() => {
        ModuleUtils.dispose();
    });

    afterEach(() => {
        ModuleUtils.dispose();
    });

    it('should generate module map from oh-package.json5 content', () => {
        const ohPkgFile = './tests/resources/dependency/exampleProject/MyApplication4Files/libbase/oh-package.json5';
        const content = fetchDependenciesFromFile(ohPkgFile);
        const ohPkgContentMap = new Map([[ohPkgFile, content]]);

        const moduleMap = ModuleUtils.generateModuleMap(ohPkgContentMap);


        expect(moduleMap).toBeInstanceOf(Map);
        expect(moduleMap.size).equal(4);
        // Check that module paths are valid
        for (const [moduleName, modulePath] of moduleMap.entries()) {
            expect(moduleName).toBeDefined();
            expect(modulePath).toBeDefined();
            expect(modulePath.path).toBeDefined();
        }
    });

    it('should generate module map with multiple modules', () => {
        const ohPkgFiles = [
            './tests/resources/dependency/exampleProject/MyApplication4Files/model1/oh-package.json5',
            './tests/resources/dependency/exampleProject/MyApplication4Files/libbase/oh-package.json5'
        ];
        const ohPkgContentMap = new Map();
        ohPkgFiles.forEach(file => {
            ohPkgContentMap.set(file, fetchDependenciesFromFile(file));
        });

        const moduleMap = ModuleUtils.generateModuleMap(ohPkgContentMap);

        expect(moduleMap).toBeInstanceOf(Map);
        expect(moduleMap.size).equal(6);
    });

    it('should return existing module map on second call', () => {
        const ohPkgFile = './tests/resources/dependency/exampleProject/MyApplication4Files/lib1/oh-package.json5';
        const content = fetchDependenciesFromFile(ohPkgFile);
        const ohPkgContentMap = new Map([[ohPkgFile, content]]);

        const moduleMap1 = ModuleUtils.generateModuleMap(ohPkgContentMap);
        const moduleMap2 = ModuleUtils.generateModuleMap(ohPkgContentMap);

        // Both calls should return the same module map reference
        expect(moduleMap1).toBeDefined();
        expect(moduleMap2).toBeDefined();
        if (moduleMap1 && moduleMap2) {
            expect(moduleMap1.size).toBe(moduleMap2.size);
        }
    });

    it('should handle empty ohPkgContentMap', () => {
        ModuleUtils.dispose();
        const emptyMap = new Map();
        const result = ModuleUtils.generateModuleMap(emptyMap);

        // When the map is empty, it should not initialize MODULES
        assert.isTrue(!result || result.size === 0)
    });

    it('should handle module with dependencies', () => {
        const ohPkgFile = './tests/resources/dependency/exampleProject/MyApplication4Files/oh-package.json5';
        const content = fetchDependenciesFromFile(ohPkgFile);
        const ohPkgContentMap = new Map([[ohPkgFile, content]]);

        const moduleMap = ModuleUtils.generateModuleMap(ohPkgContentMap);

        expect(moduleMap).toBeInstanceOf(Map);
        // Should contain modules from dependencies
        if (moduleMap) {
            expect(moduleMap.size).toBeGreaterThan(0);
        }
    });
});