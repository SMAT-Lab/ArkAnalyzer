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

export const Napi_AddPropertyInt32_EXPECT = {
    blocks: [
        {
            id: 0,
            stmts: [
                'env = parameter0: napi_env',
                'obj = parameter1: napi_value',
                'key = parameter2: char*',
                'value = parameter3: int32_t',
                'this = this: @lazyImportCase5/lazyImportCase5.cpp: %dflt',
                'key_napi = null',
                '%0 = &key_napi',
                'status = staticinvoke <@%unk/%unk: .napi_create_string_utf8()>(env, key, -1, %0)',
                'value_napi = null',
                '%1 = &value_napi',
                'status = staticinvoke <@%unk/%unk: .napi_create_int32()>(env, value, %1)',
                'status = staticinvoke <@%unk/%unk: .napi_set_property()>(env, obj, key_napi, value_napi)',
                'return true',
            ],
            preds: [],
            succes: [],
        },
    ],
};

export const CallbackToArkTS_EXPECT = {
    blocks: [
        {
            id: 0,
            stmts: [
                'env = parameter0: napi_env',
                'info = parameter1: napi_callback_info',
                'this = this: @lazyImportCase5/lazyImportCase5.cpp: %dflt',
                'argc = 1',
                '%0 = newarray (napi_value[])[1]',
                '%0[0] = null',
                'args = %0',
                '%1 = &argc',
                'staticinvoke <@%unk/%unk: .napi_get_cb_info()>(env, info, %1, args, null, null)',
                'argv = null',
                '%2 = &argv',
                'staticinvoke <@%unk/%unk: .napi_create_object()>(env, %2)',
                "staticinvoke <@lazyImportCase5/lazyImportCase5.cpp: %dflt.Napi_AddPropertyInt32(napi_env, napi_value, char*, int32_t)>(env, argv, 'type', 1)",
                "staticinvoke <@lazyImportCase5/lazyImportCase5.cpp: %dflt.Napi_AddPropertyInt32(napi_env, napi_value, char*, int32_t)>(env, argv, 'index', 2)",
                'result = null',
                '%3 = args[0]',
                '%4 = &argv',
                '%5 = &result',
                'staticinvoke <@%unk/%unk: .napi_call_function()>(env, %3, 1, %4, %5)',
                'typeNumber = null',
                '%6 = &typeNumber',
                "staticinvoke <@%unk/%unk: .napi_get_named_property()>(env, result, 'type', %6)",
                'number = undefined',
                '%7 = &number',
                'staticinvoke <@%unk/%unk: .napi_get_value_int32()>(env, typeNumber, %7)',
                'return result',
            ],
            preds: [],
            succes: [],
        },
    ],
};