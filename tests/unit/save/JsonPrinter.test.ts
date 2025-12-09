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

import path from 'path';
import fs from 'fs';
import { describe, expect, it } from 'vitest';
import { ArkFile, Scene, SceneConfig } from '../../../src/index';
import { JsonPrinter } from '../../../src/save/json/JsonPrinter';

function compareClassJson(arkClass: any, expectedClass: any): void {
    for (const [index, arkMethod] of arkClass.methods.entries()) {
        expect(arkMethod).toEqual(expectedClass.methods[index]);
    }
    expect(arkClass).toEqual(expectedClass);
}

describe('JsonPrinterTest', () => {
    let config: SceneConfig = new SceneConfig();
    config.buildFromProjectDir(path.join(__dirname, '../../resources/save'));
    let scene = new Scene();
    scene.buildSceneFromProjectDir(config);
    scene.inferTypes();
    let arkfile: ArkFile = scene.getFiles().find((value) => {
        return value.getName().endsWith('sample.ts');
    })!;

    let printer = new JsonPrinter(arkfile);
    let json = printer.dump();
    let ir = JSON.parse(json);

    it('ArkIR for Scene for sample.ts', () => {
        let expected = JSON.parse(fs.readFileSync(path.join(__dirname, '../../resources/save/expected_sample.json'), 'utf8'));
        expect(ir.signature).toEqual(expected.signature);
        expect(ir.namespaces).toEqual(expected.namespaces);
        expect(ir.importInfos).toEqual(expected.importInfos);
        expect(ir.exportInfos).toEqual(expected.exportInfos);
        for (const [index, clazz] of ir.classes.entries()) {
            compareClassJson(clazz, expected.classes[index]);
        }
    });
});
