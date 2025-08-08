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

export const DEFINE_OBJECT_EXPECT = {
    blocks: [
        {
            id: 0,
            stmts: [
                'env = parameter0: int',
                'info = parameter1: int',
                'this = this: @lazyImportCase2/lazyImportCase2.cpp: %dflt',
                'result = undefined',
                '%0 = new @lazyImportCase2/lazyImportCase2.cpp: TestClass',
                'instanceinvoke %0.<@lazyImportCase2/lazyImportCase2.cpp: TestClass.constructor()>()',
                'a = %0',
                'addrValue = <int64_t>a',
                '%1 = &result',
                'staticinvoke <@%unk/%unk: .napi_create_bigint_int64()>(env, addrValue, %1)',
                '%2 = &result',
                'staticinvoke <@%unk/%unk: .napi_create_double()>(env, 22, %2)',
                'return result',
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const CALL_OBJECT_EXPECT = {
    blocks: [
        {
            id: 0,
            stmts: [
                'env = parameter0: int',
                'info = parameter1: int',
                'this = this: @lazyImportCase2/lazyImportCase2.cpp: %dflt',
                'argc = 1',
                '%0 = newarray (void[])[1]',
                '%0[0] = nullptr',
                'args = %0',
                '%1 = &argc',
                'staticinvoke <@%unk/%unk: .napi_get_cb_info()>(env, info, %1, args, nullptr, nullptr)',
                'addrValue = 0',
                'flag = false',
                '%2 = args[0]',
                '%3 = &addrValue',
                '%4 = &flag',
                'staticinvoke <@%unk/%unk: .napi_get_value_bigint_int64()>(env, %2, %3, %4)',
                'a = <@lazyImportCase2/lazyImportCase2.cpp: TestClass*>addrValue',
                'instanceinvoke a.<@lazyImportCase2/lazyImportCase2.cpp: TestClass.SetValue()>(888)',
                'return nullptr',
            ],
            preds: [],
            succes: [],
        },
    ],
};
