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

describe('ArkImport Position Test', () => {
    const scene = buildScene(path.join(__dirname, '../../../resources/exports'));
    const arkFile = scene.getFiles().find((file) => file.getName() === 'exportSample.ts');

    it('test getOriginFullPosition for import cc', async () => {
        const importInfo = arkFile?.getImportInfos().find(i => i.getImportClauseName() === 'cc');
        assert.isDefined(importInfo);
        
        const position = importInfo!.getOriginFullPosition();
        assert.isDefined(position);
        expect(position!.getFirstLine()).eq(16);
        expect(position!.getFirstCol()).eq(1);
        expect(position!.getLastLine()).eq(16);
        expect(position!.getLastCol()).eq(29);
    });

    it('test getItemOriginFullPosition for import cc', async () => {
        const importInfo = arkFile?.getImportInfos().find(i => i.getImportClauseName() === 'cc');
        assert.isDefined(importInfo);
        
        const itemPosition = importInfo!.getItemOriginFullPosition();
        assert.isDefined(itemPosition);
        expect(itemPosition!.getFirstLine()).eq(16);
        expect(itemPosition!.getFirstCol()).eq(10);
        expect(itemPosition!.getLastLine()).eq(16);
        expect(itemPosition!.getLastCol()).eq(12);
    });

    it('test getOriginTsPosition for import cc', async () => {
        const importInfo = arkFile?.getImportInfos().find(i => i.getImportClauseName() === 'cc');
        assert.isDefined(importInfo);
        
        const tsPosition = importInfo!.getOriginTsPosition();
        expect(tsPosition.getLineNo()).eq(16);
        expect(tsPosition.getColNo()).eq(10);
    });

    it('test getOriginFullPosition for import dfs', async () => {
        const importInfo = arkFile?.getImportInfos().find(i => i.getImportClauseName() === 'dfs');
        assert.isDefined(importInfo);
        
        const position = importInfo!.getOriginFullPosition();
        assert.isDefined(position);
        expect(position!.getFirstLine()).eq(17);
        expect(position!.getFirstCol()).eq(1);
        expect(position!.getLastLine()).eq(17);
        expect(position!.getLastCol()).eq(41);
    });

    it('test getItemOriginFullPosition for import dfs', async () => {
        const importInfo = arkFile?.getImportInfos().find(i => i.getImportClauseName() === 'dfs');
        assert.isDefined(importInfo);
        
        const itemPosition = importInfo!.getItemOriginFullPosition();
        assert.isDefined(itemPosition);
        expect(itemPosition!.getFirstLine()).eq(17);
        expect(itemPosition!.getFirstCol()).eq(8);
        expect(itemPosition!.getLastLine()).eq(17);
        expect(itemPosition!.getLastCol()).eq(11);
    });

    it('test getOriginFullPosition for import something', async () => {
        const importInfo = arkFile?.getImportInfos().find(i => i.getImportClauseName() === 'something');
        assert.isDefined(importInfo);
        
        const position = importInfo!.getOriginFullPosition();
        assert.isDefined(position);
        expect(position!.getFirstLine()).eq(17);
        expect(position!.getFirstCol()).eq(1);
        expect(position!.getLastLine()).eq(17);
        expect(position!.getLastCol()).eq(41);
    });

    it('test getItemOriginFullPosition for import something', async () => {
        const importInfo = arkFile?.getImportInfos().find(i => i.getImportClauseName() === 'something');
        assert.isDefined(importInfo);
        
        const itemPosition = importInfo!.getItemOriginFullPosition();
        assert.isDefined(itemPosition);
        expect(itemPosition!.getFirstLine()).eq(17);
        expect(itemPosition!.getFirstCol()).eq(15);
        expect(itemPosition!.getLastLine()).eq(17);
        expect(itemPosition!.getLastCol()).eq(24);
    });

    it('test getOriginTsPosition for import something', async () => {
        const importInfo = arkFile?.getImportInfos().find(i => i.getImportClauseName() === 'something');
        assert.isDefined(importInfo);
        
        const tsPosition = importInfo!.getOriginTsPosition();
        expect(tsPosition.getLineNo()).eq(17);
        expect(tsPosition.getColNo()).eq(15);
    });
});