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
                'env = parameter0: int',
                'info = parameter1: int',
                'this = this: @lazyImportCase3/lazyImportCase3.cpp: %dflt',
                'requireArgc = 2',
                'argc = 2',
                '%0 = newarray (void)[1]',
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
                'return null',
            ],
            preds: [],
            succes: [],
        },
    ],
};
