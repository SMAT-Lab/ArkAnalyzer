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

export const NativeCallArkTS8_EXPECT = {
    blocks: [
        {
            id: 0,
            stmts: [
                'env = parameter0: int',
                'info = parameter1: int',
                'this = this: @lazyImportCase8/lazyImportCase8.cpp: %dflt',
                'argc = 1',
                '%0 = newarray (void)[1]',
                '%0[0] = null',
                'args = %0',
                '%1 = &argc',
                'staticinvoke <@%unk/%unk: .napi_get_cb_info()>(env, info, %1, args, null, null)',
                'argv = null',
                '%2 = &argv',
                'staticinvoke <@%unk/%unk: .napi_create_int32()>(env, 2, %2)',
                'result = null',
                '%3 = args.<@%unk/%unk: .0>',
                '%4 = &argv',
                '%5 = &result',
                'staticinvoke <@%unk/%unk: .napi_call_function()>(env, null, %3, 1, %4, %5)',
                'return result',
            ],
            preds: [],
            succes: [],
        },
    ],
};
