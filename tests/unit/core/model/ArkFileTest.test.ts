/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
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

import { assert, describe, expect, it } from 'vitest';
import { buildScene } from '../../common';
import path from 'path';
import { Language } from '../../../../src/core/model/ArkFile';
import { ArkClass, Scene } from '../../../../src';

function checkLanguageOfModelWithinClass(cls: ArkClass, expectedLanguage: Language): void {
    assert.equal(cls.getLanguage(), expectedLanguage);
    cls.getFields().forEach(field => {
        assert.equal(field.getLanguage(), expectedLanguage);
    });
    cls.getMethods().forEach(method => {
        assert.equal(method.getLanguage(), expectedLanguage);
    });
}

function checkLanguageOfModelWithinFile(scene: Scene, fileName: string, expectedLanguage: Language): void {
    const file = scene.getFiles().find((file) => file.getName().endsWith(fileName));
    assert.isDefined(file);
    assert.equal(file!.getLanguage(), expectedLanguage);
    file!.getNamespaces().forEach((namespace) => {
        assert.equal(namespace.getLanguage(), expectedLanguage);
        namespace.getClasses().forEach((cls) => {
            checkLanguageOfModelWithinClass(cls, expectedLanguage);
        });
    });
    file!.getClasses().forEach((cls) => {
        checkLanguageOfModelWithinClass(cls, expectedLanguage);
    });
    file!.getExportInfos().forEach((exportInfo) => {
        assert.equal(exportInfo.getLanguage(), expectedLanguage);
    });
    file!.getImportInfos().forEach((importInfo) => {
        assert.equal(importInfo.getLanguage(), expectedLanguage);
    });
}

describe('File Test', () => {
    const scene = buildScene(path.join(__dirname, '../../../resources/model/file'));

    it('unhandled file', async () => {
        const expectUnhandledFileNames = ['CompilationErrorFile.ts'];
        const unhandledFileNames = scene.getUnhandledFilePaths().map((filePath) => path.basename(filePath));
        expect(unhandledFileNames).toEqual(expectUnhandledFileNames);
    });

    it('handled files', async () => {
        const expectHandledFileNames = ['ArkTS1_1File.ets', 'ArkTS1_2File.ets', 'NormalFile.ts'];
        const handledFileNames = scene.getFiles().map((f) => path.basename(f.getFilePath()));
        expect(handledFileNames).toEqual(expectHandledFileNames);
    });

    it('get language of models', async () => {
        const fileNames = ['ArkTS1_1File.ets', 'ArkTS1_2File.ets', 'NormalFile.ts'];

        checkLanguageOfModelWithinFile(scene, fileNames[0], Language.ARKTS1_1);
        checkLanguageOfModelWithinFile(scene, fileNames[1], Language.ARKTS1_2);
        checkLanguageOfModelWithinFile(scene, fileNames[2], Language.TYPESCRIPT);
    });
});

describe('ArkFile Source Code Test', () => {
    const scene = buildScene(path.join(__dirname, '../../../resources/model/method'));
    const arkFile = scene.getFiles().find((file) => file.getName() === 'method.ts');

    it('test getCode for method.ts', async () => {
        assert.isDefined(arkFile);
        const code = arkFile!.getCode();
        assert.isDefined(code);
        const expectedCodeStart = `/*
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
 */`;
        expect(code!.replace(/\r\n/g, '\n').substring(0, expectedCodeStart.length)).eq(expectedCodeStart);
    });

    it('test getCode ends with expected content', async () => {
        assert.isDefined(arkFile);
        const code = arkFile!.getCode();
        assert.isDefined(code);
        const expectedCodeEnd = `function constructor(): void {}

namespace ConstructorTest {
    export function constructor(): void {}
}
`;
        expect(code!.replace(/\r\n/g, '\n').endsWith(expectedCodeEnd)).eq(true);
    });
});