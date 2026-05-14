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

import { SceneConfig, type SceneLanguagesOptions } from '../../src/Config';
import { assert, describe, expect, it } from 'vitest';

describe('SceneConfig options test', () => {
    it('enable cpp', () => {
        const config = new SceneConfig({
            supportFileExts: ['.ets', '.ts'],
            languages: {
                cpp: {
                    enabled: true,
                    sourceExtensions: ['.cxx'],
                    headerExtensions: ['.h'],
                },
            } as SceneLanguagesOptions,
        });
        const options = config.getOptions();
        expect(options.languages?.cpp?.enabled).toEqual(true);
        expect(options.languages?.cpp?.headerExtensions).toEqual(['.h']);
        expect(options.languages?.cpp?.sourceExtensions).toEqual(['.cxx']);
        expect(options.supportFileExts).toEqual(['.ets', '.ts', '.cxx', '.h']);
    });

    it('enable arkts and cpp', () => {
        const config = new SceneConfig({
            supportFileExts: ['.ts'],
            languages: {
                arkts: {
                    enabled: true,
                    extensions: ['.ets', '.ts'],
                },
                cpp: {
                    enabled: true,
                    sourceExtensions: ['.cc'],
                    headerExtensions: ['.h'],
                },
            } as SceneLanguagesOptions,
        });
        const options = config.getOptions();
        expect(options.languages?.arkts?.enabled).toEqual(true);
        expect(options.languages?.arkts?.extensions).toEqual(['.ets', '.ts']);
        expect(options.languages?.cpp?.enabled).toEqual(true);
        expect(options.languages?.cpp?.headerExtensions).toEqual(['.h']);
        expect(options.languages?.cpp?.sourceExtensions).toEqual(['.cc']);
        expect(options.supportFileExts).toEqual(['.ts', '.ets', '.cc', '.h']);
    });
});

describe('SceneConfig Test', () => {
    it('true case', () => {
        let config: SceneConfig = new SceneConfig();
        config.buildFromJson('./tests/resources/scene/SceneTestConfig.json');
        assert.equal(config.getTargetProjectName(), 'viewtree');
        console.log(config.getTargetProjectDirectory())
        assert.equal(config.getTargetProjectDirectory(), 'tests/resources/viewtree/project');
        assert.equal(config.getSdksObj().length, 1);
    })

    it('config file does not exit case', () => {
        let config: SceneConfig = new SceneConfig();
        config.buildFromJson('./tests/resources/scene/NotExist.json');
        assert.equal(config.getTargetProjectName(), '');
        assert.equal(config.getTargetProjectDirectory(), '');
        assert.equal(config.getSdksObj().length, 0);
    })
})