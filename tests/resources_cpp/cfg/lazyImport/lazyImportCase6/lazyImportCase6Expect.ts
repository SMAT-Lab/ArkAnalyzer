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

export const CallFunction_EXPECT = {
    blocks: [
        {
            id: 0,
            stmts: [
                'env = parameter0: int',
                'info = parameter1: int',
                'this = this: @lazyImportCase6/lazyImportCase6.cpp: %dflt',
                'argc = 1',
                '%0 = newarray (void[])[1]',
                '%0[0] = null',
                'args = %0',
                '%1 = &argc',
                'staticinvoke <@%unk/%unk: .napi_get_cb_info()>(env, info, %1, args)',
                'onCall = undefined',
                '%2 = args[0]',
                '%3 = &onCall',
                "staticinvoke <@%unk/%unk: .napi_get_named_property()>(env, %2, 'onCall', %3)",
                'res = undefined',
                '%4 = args[0]',
                '%5 = &res',
                'staticinvoke <@%unk/%unk: .napi_call_function()>(env, %4, onCall, 0, null, %5)',
                'return onCall',
            ],
            preds: [],
            succes: [],
        },
    ],
};
