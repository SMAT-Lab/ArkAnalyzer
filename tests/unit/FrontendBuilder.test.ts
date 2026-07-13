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
import fs from 'fs';
import os from 'os';
import path from 'path';
import { FrontendBuilder } from '../../src/frontend/FrontendBuilder';
import { ModuleDepthLevel } from '../../src/frontend/common/ModuleDepth';
import { ModuleBuilder } from '../../src/frontend/common/ModuleBuilder';
import { ArkFile } from '../../src/core/model/ArkFile';
import { ArkModule } from '../../src/core/model/ArkModule';
import { Scene } from '../../src/Scene';
import { ModelUtils } from '../../src/core/common/ModelUtils';

/**
 * Create a Scene suitable for FrontendBuilder level-aware tests: supports getRealProjectDir,
 * getProjectName, getOptions (supportFileExts, ignoreFileNames, enableAST, saveSourceCodeByDefault),
 * getFileLanguages, setFile, and buildClassDone (required by the full build path at BODIES level).
 */
function makeFrontendBuilderSceneStub(projectDir: string, projectName: string): Scene {
    const scene = new Scene();
    const filesMap = new Map<string, unknown>();
    (scene as unknown as { getRealProjectDir: () => string }).getRealProjectDir = () => projectDir;
    (scene as unknown as { getProjectName: () => string }).getProjectName = () => projectName;
    (scene as unknown as { getOptions: () => unknown }).getOptions = () => ({
        supportFileExts: ['.ets', '.ts'],
        ignoreFileNames: [],
        enableAST: false,
        saveSourceCodeByDefault: false,
    });
    (scene as unknown as { getFileLanguages: () => Map<string, unknown> }).getFileLanguages = () => new Map();
    // Return false so ArkMethod.setBodyBuilder does not eagerly build bodies during class build
    (scene as unknown as { buildClassDone: () => boolean }).buildClassDone = () => false;
    (scene as unknown as { setFile: (file: ArkFile) => void }).setFile = (file: ArkFile) => {
        filesMap.set(file.getFileSignature().toMapKey(), file);
    };
    return scene;
}

/** Find an ArkFile in a module's filesMap by its basename. */
function findFileByBasename(module: ArkModule, basename: string): ArkFile | undefined {
    for (const arkFile of module.getFilesMap().values()) {
        if (path.basename(arkFile.getFilePath()) === basename) {
            return arkFile;
        }
    }
    return undefined;
}

describe('FrontendBuilder level-aware building', () => {
    it('ArkTS META level - no import/export info', () => {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-meta-'));
        try {
            const modulePath = path.join(tmpDir, 'entry');
            fs.mkdirSync(modulePath, { recursive: true });
            fs.writeFileSync(path.join(modulePath, 'a.ets'), "import { foo } from './b';\n");
            fs.writeFileSync(path.join(modulePath, 'b.ets'), 'export const foo = 1;\n');
            const scene = makeFrontendBuilderSceneStub(tmpDir, 'testProject');
            const builder = new ModuleBuilder(scene);
            const module = builder.registerModule(modulePath, '@ohos/entry');

            // META level skips source reading; import/export info is not populated
            FrontendBuilder.buildModuleFilesToLevel(scene, module, ModuleDepthLevel.META);

            const aFile = findFileByBasename(module, 'a.ets');
            expect(aFile).toBeDefined();
            expect(aFile!.getImportInfos().length).toBe(0);
            expect(aFile!.getExportInfos().length).toBe(0);
        } finally {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    });

    it('ArkTS IMPORTS level - import/export info populated, no ArkClass', () => {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-imports-'));
        try {
            const modulePath = path.join(tmpDir, 'entry');
            fs.mkdirSync(modulePath, { recursive: true });
            fs.writeFileSync(path.join(modulePath, 'a.ets'), "import { foo } from './b';\n");
            fs.writeFileSync(path.join(modulePath, 'b.ets'), 'export const foo = 1;\n');
            const scene = makeFrontendBuilderSceneStub(tmpDir, 'testProject');
            const builder = new ModuleBuilder(scene);
            const module = builder.registerModule(modulePath, '@ohos/entry');

            // IMPORTS level fills import/export info only, skipping class/method/body building
            FrontendBuilder.buildModuleFilesToLevel(scene, module, ModuleDepthLevel.IMPORTS);

            const aFile = findFileByBasename(module, 'a.ets');
            const bFile = findFileByBasename(module, 'b.ets');
            expect(aFile).toBeDefined();
            expect(bFile).toBeDefined();
            expect(aFile!.getImportInfos().length).toBeGreaterThanOrEqual(1);
            expect(bFile!.getExportInfos().length).toBeGreaterThanOrEqual(1);
            // IMPORTS level does not build ArkClass
            expect(aFile!.getClasses().length).toBe(0);
            expect(bFile!.getClasses().length).toBe(0);
        } finally {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    });

    it('ArkTS SIGNATURES level - signatures built, no method bodies', () => {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-sig-'));
        try {
            const modulePath = path.join(tmpDir, 'entry');
            fs.mkdirSync(modulePath, { recursive: true });
            fs.writeFileSync(
                path.join(modulePath, 'cls.ets'),
                'export class MyClass {\n  field: number = 0;\n  foo(a: number): string { return a.toString(); }\n}\n'
            );
            const scene = makeFrontendBuilderSceneStub(tmpDir, 'testProject');
            const builder = new ModuleBuilder(scene);
            const module = builder.registerModule(modulePath, '@ohos/entry');

            // SIGNATURES level builds namespace/class/method signatures without method bodies
            FrontendBuilder.buildModuleFilesToLevel(scene, module, ModuleDepthLevel.SIGNATURES);

            const clsFile = findFileByBasename(module, 'cls.ets');
            expect(clsFile).toBeDefined();
            const classes = ModelUtils.getAllClassesInFile(clsFile!);
            // Unlike IMPORTS (no classes), SIGNATURES builds the declared class plus the default class
            expect(classes.length).toBeGreaterThan(0);
            const myClass = classes.find(c => c.getName() === 'MyClass');
            expect(myClass).toBeDefined();
            // foo method signature is built ...
            const foo = myClass!.getMethods().find(m => m.getName() === 'foo');
            expect(foo).toBeDefined();
            // ... but the method body is NOT built (capped at SIGNATURES)
            expect(foo!.getBody()).toBeUndefined();
        } finally {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    });

    it('ArkTS BODIES level retains BodyBuilders for phase 2 (signatures built, bodies pending)', () => {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-bodies-'));
        try {
            const modulePath = path.join(tmpDir, 'entry');
            fs.mkdirSync(modulePath, { recursive: true });
            fs.writeFileSync(
                path.join(modulePath, 'cls.ets'),
                'export class MyClass {\n  field: number = 0;\n  foo(a: number): string { return a.toString(); }\n}\n'
            );
            const scene = makeFrontendBuilderSceneStub(tmpDir, 'testProject');
            const builder = new ModuleBuilder(scene);
            const module = builder.registerModule(modulePath, '@ohos/entry');

            // BODIES level: ArkClass/method signatures are built and BodyBuilders are retained
            // (not freed) for a subsequent phase 2 body-building step.
            FrontendBuilder.buildModuleFilesToLevel(scene, module, ModuleDepthLevel.BODIES);

            const clsFile = findFileByBasename(module, 'cls.ets');
            expect(clsFile).toBeDefined();
            const classes = ModelUtils.getAllClassesInFile(clsFile!);
            expect(classes.length).toBeGreaterThan(0);
            const myClass = classes.find(c => c.getName() === 'MyClass');
            expect(myClass).toBeDefined();
            const foo = myClass!.getMethods().find(m => m.getName() === 'foo');
            expect(foo).toBeDefined();
            // Body is NOT yet built (phase 2 has not run)
            expect(foo!.getBody()).toBeUndefined();
            // BodyBuilder IS retained (not freed) — available for phase 2
            expect(foo!.getBodyBuilder()).toBeDefined();
            // Manually running phase 2 builds the body from the retained BodyBuilder
            foo!.buildBody();
            expect(foo!.getBody()).toBeDefined();
            expect(foo!.getBody()!.getCfg()).toBeDefined();
        } finally {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    });
});
