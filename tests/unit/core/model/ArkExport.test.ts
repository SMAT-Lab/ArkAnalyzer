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

import { assert, describe, expect, it } from 'vitest';
import { buildScene } from '../../common';
import path from 'path';

describe('ArkExport Position Test', () => {
    const scene = buildScene(path.join(__dirname, '../../../resources/exports'));
    const arkFile = scene.getFiles().find((file) => file.getName() === 'exportSample.ts');

    it('test getOriginFullPosition for export z', async () => {
        const exportInfo = arkFile?.getExportInfos().find(e => e.getExportClauseName() === 'z');
        assert.isDefined(exportInfo);
        
        const position = exportInfo!.getOriginFullPosition();
        assert.isDefined(position);
        expect(position!.getFirstLine()).eq(20);
        expect(position!.getFirstCol()).eq(1);
        expect(position!.getLastLine()).eq(20);
        expect(position!.getLastCol()).eq(29);
    });

    it('test getOriginTsPosition for export z', async () => {
        const exportInfo = arkFile?.getExportInfos().find(e => e.getExportClauseName() === 'z');
        assert.isDefined(exportInfo);
        
        const tsPosition = exportInfo!.getOriginTsPosition();
        expect(tsPosition.getLineNo()).eq(20);
        expect(tsPosition.getColNo()).eq(1);
    });

    it('test getOriginFullPosition for export blah', async () => {
        const exportInfo = arkFile?.getExportInfos().find(e => e.getExportClauseName() === 'blah');
        assert.isDefined(exportInfo);
        
        const position = exportInfo!.getOriginFullPosition();
        assert.isDefined(position);
        expect(position!.getFirstLine()).eq(22);
        expect(position!.getFirstCol()).eq(1);
        expect(position!.getLastLine()).eq(22);
        expect(position!.getLastCol()).eq(26);
    });

    it('test getOriginFullPosition for export a', async () => {
        const exportInfo = arkFile?.getExportInfos().find(e => e.getExportClauseName() === 'a');
        assert.isDefined(exportInfo);
        
        const position = exportInfo!.getOriginFullPosition();
        assert.isDefined(position);
        expect(position!.getFirstLine()).eq(26);
        expect(position!.getFirstCol()).eq(1);
        expect(position!.getLastLine()).eq(26);
        expect(position!.getLastCol()).eq(17);
    });

    it('test getOriginFullPosition for export testing', async () => {
        const exportInfo = arkFile?.getExportInfos().find(e => e.getExportClauseName() === 'testing');
        assert.isDefined(exportInfo);
        
        const position = exportInfo!.getOriginFullPosition();
        assert.isDefined(position);
        expect(position!.getFirstLine()).eq(28);
        expect(position!.getFirstCol()).eq(1);
        expect(position!.getLastLine()).eq(31);
        expect(position!.getLastCol()).eq(2);
    });
});