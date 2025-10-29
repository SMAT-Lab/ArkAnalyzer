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
                'env = parameter0: napi_env',
                'info = parameter1: napi_callback_info',
                'this = this: @lazyImportCase2/lazyImportCase2.cpp: %dflt',
                'result = undefined',
                '%0 = new @lazyImportCase2/lazyImportCase2.cpp: TestClass',
                'instanceinvoke %0.<@lazyImportCase2/lazyImportCase2.cpp: TestClass.constructor()>()',
                'a = %0',
                '%1 = <CXXReinterpretCastExpr: intptr_t>a',
                'addrValue = <CXXStaticCastExpr: int64_t>%1',
                '%2 = &result',
                'staticinvoke <@%unk/%unk: .napi_create_bigint_int64()>(env, addrValue, %2)',
                '%3 = &result',
                'staticinvoke <@%unk/%unk: .napi_create_double()>(env, 1, %3)',
                'return result'
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
                'env = parameter0: napi_env',
                'info = parameter1: napi_callback_info',
                'this = this: @lazyImportCase2/lazyImportCase2.cpp: %dflt',
                'argc = 1',
                '%0 = newarray (napi_value[])[1]',
                '%0[0] = null',
                'args = %0',
                '%1 = &argc',
                'staticinvoke <@%unk/%unk: .napi_get_cb_info()>(env, info, %1, args, null, null)',
                'addrValue = 0',
                'flag = false',
                '%2 = args[0]',
                '%3 = &addrValue',
                '%4 = &flag',
                'staticinvoke <@%unk/%unk: .napi_get_value_bigint_int64()>(env, %2, %3, %4)',
                'a = <CXXReinterpretCastExpr: @lazyImportCase2/lazyImportCase2.cpp: TestClass*>addrValue',
                'instanceinvoke a.<@lazyImportCase2/lazyImportCase2.cpp: TestClass.SetValue(int)>(1)',
                'return null'
            ],
            preds: [],
            succes: [],
        },
    ],
};
