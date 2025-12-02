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

import { ExportType } from '../../../../src/core/model/ArkExport';
import { ArkMethod, DEFAULT_ARK_CLASS_NAME } from '../../../../src';

export const MY_HEADER_EXPORT_INFO_EXPECT_IR = {
    _default: false,
    exportClauseName: 'FuncDoSomething',
    exportClauseType: ExportType.METHOD,
    arkExport: {
        type: ArkMethod,
        methodSignature: `@indirectRef/src/myHeader.cpp: ${DEFAULT_ARK_CLASS_NAME}.FuncDoSomething(int, int)`,
        methodDeclareSignature: `@indirectRef/include/myHeader.h: ${DEFAULT_ARK_CLASS_NAME}.FuncDoSomething(int, int)`,
    },
};

export const CAST_SAMPLE_EXPORT_INFO_EXPECT_IR = {
    _default: false,
    exportClauseName: 'CXXStaticCast',
    exportClauseType: ExportType.METHOD,
    arkExport: {
        type: ArkMethod,
        methodSignature: `@indirectRef/src/castSample.cpp: ${DEFAULT_ARK_CLASS_NAME}.CXXStaticCast(int)`,
        methodDeclareSignature: `@indirectRef/include/castSample.h: ${DEFAULT_ARK_CLASS_NAME}.CXXStaticCast(int)`,
    },
};
