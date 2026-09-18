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

import { SceneConfig } from '../../../src/Config';
import { PrinterBuilder, ScenePrinter } from '../../../src/save/PrinterBuilder';
import { assert, beforeAll, describe, expect, it, vi } from 'vitest';
import { Scene } from '../../../src/Scene';
import path from 'path';
import fs from 'fs';
import { SourceDefaultClass } from '../../../src/save/source/SourceClass';
import { SignatureCanonicalizerRegistry } from '../../../src/core/common/SignatureCanonicalizerRegistry';
import { ArkFile } from '../../../src';

function buildScene(): Scene {
    SignatureCanonicalizerRegistry.dispose();
    let config: SceneConfig = new SceneConfig();
    config.buildFromProjectDir(path.join(__dirname, '../../resources/save'));
    let scene = new Scene();
    scene.buildSceneFromProjectDir(config);
    return scene;
}

describe('PrinterBuilderTest', () => {
    let scene: Scene;
    let arkfile: ArkFile | undefined;
    let outputDir = 'out';
    let printer: PrinterBuilder;
    beforeAll(() => {
        scene = buildScene();
        arkfile = scene.getFiles().find((file) => file.getName() == 'namespaces.ts');
        printer = new PrinterBuilder(outputDir);
    });

    it('case1: dumpToDot', () => {
        if (arkfile == null) {
            assert.isNotNull(arkfile);
            return;
        }
        let file = outputDir + '/dumpDot.dot';
        printer.dumpToDot(arkfile, file);
        setTimeout(() => fs.access(file, fs.constants.F_OK, (err) => assert.isNull(err)), 100);
    });
    it('case2: dumpToDot', () => {
        if (arkfile == null) {
            assert.isNotNull(arkfile);
            return;
        }
        printer.dumpToDot(arkfile);
        let file = outputDir + '/namespaces.ts.dot';
        setTimeout(() => fs.access(file, fs.constants.F_OK, (err) => assert.isNull(err)), 100);
    });
    it('case3: dumpToTs', () => {
        if (arkfile == null) {
            assert.isNotNull(arkfile);
            return;
        }
        printer.dumpToTs(arkfile);
        let file = outputDir + '/namespaces.ts';
        setTimeout(() => fs.access(file, fs.constants.F_OK, (err) => assert.isNull(err)), 100);
    });
    it('case4: dumpToTs', () => {
        arkfile = scene.getFiles().find((file) => file.getName() == 'modules.ts');
        if (arkfile == null) {
            assert.isNotNull(arkfile);
            return;
        }
        let file = outputDir + '/modules.ts';
        printer.dumpToTs(arkfile, file);
        setTimeout(() => fs.access(file, fs.constants.F_OK, (err) => assert.isNull(err)), 100);
    });
    it('case5: dumpToTs', () => {
        const spy = vi.spyOn(printer, 'dumpToTs');
        for (let f of scene.getFiles()) {
            for (let cls of f.getClasses()) {
                if (cls.hasViewTree()) {
                    cls.getViewTree();
                }
            }
            printer.dumpToTs(f);
        }
        expect(spy).toHaveBeenCalledTimes(scene.getFiles().length);
    });

    it('case7: SourceDefaultClass dumpOriginalCode', () => {
        SignatureCanonicalizerRegistry.dispose();
        let config: SceneConfig = new SceneConfig();
        config.buildFromProjectDir(path.join(__dirname, '../../../src/core/base'));
        let scene = new Scene();
        scene.buildSceneFromProjectDir(config);
        let arkfile = scene.getFiles().find((file) => file.getName() == 'Local.ts');
        if (arkfile == null) {
            assert.isNotNull(arkfile);
            return;
        }
        let cls = arkfile.getClasses()[0];
        if (cls.isDefaultArkClass()) {
            let sdc = new SourceDefaultClass(cls);
            expect(sdc.dump()).eq('');
        }
    });

    it('case8: dumpToJson', () => {
        arkfile = scene.getFiles().find((file) => file.getName() == 'sample.ts');
        if (arkfile == null) {
            assert.isNotNull(arkfile);
            return;
        }
        let file = outputDir + '/sample.json';
        printer.dumpToJson(arkfile, file);
        setTimeout(() => fs.access(file, fs.constants.F_OK, (err) => assert.isNull(err)), 1000);
    });

    it('case9: sceneDump', () => {
        SignatureCanonicalizerRegistry.dispose();
        let config: SceneConfig = new SceneConfig();
        config.getSdksObj().push({ moduleName: '', name: 'etsSdk', path: path.join(__dirname, '../../resources/Sdk') });
        config.buildFromJson(path.join(__dirname, '../../resources/viewtree/project/test-config.json'));
        let scene2Dump: Scene = new Scene();
        scene2Dump.buildBasicInfo(config);
        scene2Dump.buildScene4HarmonyProject();
        scene2Dump.inferTypes();
        let printer = new ScenePrinter(scene2Dump, 'output', {noMethodBody: true, pureTs: true});
        printer.dumpToTs();
        printer.dumpToIR();
        printer.dumpToDot();
        expect(fs.existsSync(path.join('output', 'entry/src/main/ets/Page.ets'))).eq(true);
    });
});
