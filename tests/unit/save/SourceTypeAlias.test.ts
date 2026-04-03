/*
 * Copyright (c) 2024 Huawei Device Co., Ltd.
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

import { Scene, SceneConfig, SourceFilePrinter } from '../../../src';
import { describe, expect, it } from 'vitest';
import path from 'path';

const SourceTypeAliasTest_CASE1_EXPECT = `export type Location = {x: number, y: number};
type FileNotFound = 404;
export type TextInput = string;
`;


describe('SourceTypeAliasTest', () => {
    let config: SceneConfig = new SceneConfig();
    config.buildFromProjectDir(path.join(__dirname, '../../resources/save'));
    let scene = new Scene();
    scene.buildSceneFromProjectDir(config);
    scene.inferTypes();

    it('case1: whole file', () => {
        let arkfile = scene.getFiles().find((value) => {
            return value.getName() == 'type_alias.ts';
        });
        if (!arkfile) {
            return;
        }
        let printer = new SourceFilePrinter(arkfile);
        let source = printer.dump();
        expect(source).eq(SourceTypeAliasTest_CASE1_EXPECT);
    });
});
