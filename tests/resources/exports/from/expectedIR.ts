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

import { ExportType } from '../../../../src/core/model/ArkExport';
import { ArkClass, DEFAULT_ARK_CLASS_NAME } from '../../../../src';

export const ExportAllFromThisFile_Expect_IR = {
    _default: false,
    exportClauseName: '*',
    exportClauseType: ExportType.CLASS,
    modifiers: [],
    arkExport: {
        type: ArkClass,
        classSignature: `@exports/from/exportAllFromThisFile.ts: ${DEFAULT_ARK_CLASS_NAME}`,
        modifiers: []
    }
};

export const ExportAllWithAsNameFromThisFile_Expect_IR = {
    _default: false,
    nameBeforeAs: '*',
    exportClauseName: 'newName',
    exportClauseType: ExportType.CLASS,
    modifiers: [],
    arkExport: {
        type: ArkClass,
        classSignature: `@exports/from/exportAllFromThisFile.ts: ${DEFAULT_ARK_CLASS_NAME}`,
        modifiers: []
    }
};

export const ExportAllFromOtherFile_Expect_IR = {
    _default: false,
    exportClauseName: '*',
    exportClauseType: ExportType.CLASS,
    modifiers: [],
    arkExport: {
        type: ArkClass,
        classSignature: `@exports/from/exportAllFromThisFile.ts: ${DEFAULT_ARK_CLASS_NAME}`,
        modifiers: []
    }
};

export const ExportAllWithAsNameFromOtherFile_Expect_IR = {
    _default: false,
    nameBeforeAs: '*',
    exportClauseName: 'newName',
    exportClauseType: ExportType.CLASS,
    modifiers: [],
    arkExport: {
        type: ArkClass,
        classSignature: `@exports/from/exportAllFromThisFile.ts: ${DEFAULT_ARK_CLASS_NAME}`,
        modifiers: []
    }
};