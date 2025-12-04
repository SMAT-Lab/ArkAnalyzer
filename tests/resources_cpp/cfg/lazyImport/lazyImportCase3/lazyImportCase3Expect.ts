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

export const MapDemo_EXPECT = {
    blocks: [
        {
            id: 0,
            stmts: [
                'env = parameter0: napi_env',
                'info = parameter1: napi_callback_info',
                'this = this: @lazyImportCase3/lazyImportCase3.cpp: %dflt',
                'requireArgc = 2',
                'argc = 2',
                '%0 = newarray (napi_value[])[2]',
                '%0[0] = null',
                'args = %0',
                '%1 = &argc',
                'staticinvoke <@%unk/%unk: .napi_get_cb_info()>(env, info, %1, args, null, null)',
                'str1 = undefined',
                'str1Len = undefined',
                '%2 = args[0]',
                '%3 = &str1Len',
                'staticinvoke <@%unk/%unk: .napi_get_value_string_utf8()>(env, %2, str1, 100, %3)',
                'num = undefined',
                '%4 = args[1]',
                '%5 = &num',
                'staticinvoke <@%unk/%unk: .napi_get_value_int32()>(env, %4, %5)',
                '%6 = new @%unk/%unk: pair<char ()&[],int&>',
                '%7 = staticinvoke <@%unk/%unk: .make_pair()>(str1, num)',
                'instanceinvoke %6.<@%unk/%unk: pair.constructor()>(%7)',
                'instanceinvoke testmap.<@%unk/%unk: .insert()>(%6)',
                '%8 = instanceinvoke testmap.<@%unk/%unk: .iterator()>()',
                '%8 = testmap.<@CXX/std/BuiltinClass: operator*.begin>',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: [
                '%9 = testmap.<@CXX/std/BuiltinClass: operator*.end>',
                'if %8 == %9',
            ],
            preds: [0, 2],
            succes: [2, 3],
        },
        {
            id: 2,
            stmts: [
                '%10 = %8.<@CXX/std/BuiltinClass: IterableIterator.*>',
                'e = <value_type>%10',
                '%11 = e.<@%unk/%unk: .first>',
                '%12 = instanceinvoke e.<@%unk/%unk: .second()>()',
                'staticinvoke <@%unk/%unk: .printf()>(\'%d %s\\n\', %11, %12)',
                '%8 = instanceinvoke %8.<@%unk/%unk: .iterator++()>()',
            ],
            preds: [1],
            succes: [1],
        },
        { id: 3, stmts: ['return null'], preds: [1], succes: [] },
    ],
};
