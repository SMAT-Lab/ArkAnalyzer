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

import { ExportType } from '../../../../src/core/model/ArkExport';
import { ArkMethod, DEFAULT_ARK_CLASS_NAME, ArkClass, ArkNamespace } from '../../../../src';

export const MY_HEADER_EXPORT_INFO1 = {
    _default: false,
    exportClauseName: 'Color',
    exportClauseType: ExportType.CLASS,
    arkExport: {
        type: ArkClass,
        classSignature: `@crossFileCase/include/myHeader.h: Color`,
    },
};

export const MY_HEADER_EXPORT_INFO2 = {
    _default: false,
    exportClauseName: 'FuncDoSomething',
    exportClauseType: ExportType.METHOD,
    arkExport: {
        type: ArkMethod,
        methodSignature: `@crossFileCase/src/myHeader.cpp: ${DEFAULT_ARK_CLASS_NAME}.FuncDoSomething(int, int)`,
        methodDeclareSignature: `@crossFileCase/include/myHeader.h: ${DEFAULT_ARK_CLASS_NAME}.FuncDoSomething(int, int)`,
    },
};

export const MY_HEADER_EXPORT_INFO3 = {
    _default: false,
    exportClauseName: 'Circle',
    exportClauseType: ExportType.CLASS,
    arkExport: {
        type: ArkClass,
        classSignature: `@crossFileCase/include/myHeader.h: Circle`,
    },
};

export const MY_HEADER_EXPORT_INFO4 = {
    _default: false,
    exportClauseName: 'nsA',
    exportClauseType: ExportType.NAME_SPACE,
    arkExport: {
        type: ArkNamespace,
        namespaceSignature: `@crossFileCase/include/namespace.h: nsA`,
    },
};

export const NAMESPACE_EXPORT_INFO = {
    _default: false,
    exportClauseName: 'nsA',
    exportClauseType: ExportType.NAME_SPACE,
    arkExport: {
        type: ArkNamespace,
        namespaceSignature: `@crossFileCase/include/namespace.h: nsA`,
    },
};

export const MAIN_CASE = {
    blocks: [
        {
            id: 0,
            stmts: [
                'this = this: @crossFileCase/main.cpp: %dflt',
                '%0 = new @crossFileCase/include/namespace.h: nsA.DefaultClass',
                'instanceinvoke %0.<@crossFileCase/include/namespace.h: nsA.DefaultClass.constructor(char, int)>(A, 18)',
                'dClass = %0',
                'instanceinvoke dClass.<@crossFileCase/include/namespace.h: nsA.DefaultClass.PrintInfo()>()',
                'staticinvoke <@crossFileCase/include/namespace.h: nsA.%dflt.FuncInNamespace()>()',
                '%1 = new @crossFileCase/include/namespace.h: nsA.Point',
                'instanceinvoke %1.<@crossFileCase/include/namespace.h: nsA.Point.constructor()>(1, 2)',
                'p = %1',
                '%2 = new @crossFileCase/include/myHeader.h: Circle',
                '%3 = @crossFileCase/include/myHeader.h: Color.[static]GREEN',
                'instanceinvoke %2.<@crossFileCase/include/myHeader.h: Circle.constructor(@crossFileCase/include/namespace.h: nsA.Point&, double, @crossFileCase/include/myHeader.h: Color)>(p, 1, %3)',
                'c = %2',
                'area = instanceinvoke c.<@crossFileCase/include/myHeader.h: Circle.CalculateArea()>()',
                "staticinvoke <@%unk/%unk: .cout()>('Area of circle is : ', area)",
                'instanceinvoke c.<@crossFileCase/include/myHeader.h: Circle.PrintInfo()>()',
                'return 0'
            ],
            preds: [],
            succes: [],
        },
    ],
};