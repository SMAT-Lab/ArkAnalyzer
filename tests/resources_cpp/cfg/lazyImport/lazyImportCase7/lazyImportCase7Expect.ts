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

export const ModifyObject_EXPECT = {
    blocks: [
        {
            id: 0,
            stmts: [
                'env = parameter0: int',
                'info = parameter1: int',
                'this = this: @lazyImportCase7/lazyImportCase7.cpp: %dflt',
                'argc = 1',
                '%0 = newarray (void[])[1]',
                '%0[0] = nullptr',
                'args = %0',
                '%1 = &argc',
                'staticinvoke <@%unk/%unk: .napi_get_cb_info()>(env, info, %1, args, nullptr, nullptr)',
                'obj = args[0]',
                'obj1 = undefined',
                'hello1 = undefined',
                'arr1 = undefined',
                'typedArray1 = undefined',
                '%2 = &obj1',
                "staticinvoke <@%unk/%unk: .napi_get_named_property()>(env, obj, 'obj', %2)",
                "buf = 'this is modified'",
                'str1 = undefined',
                "staticinvoke <@%unk/%unk: .napi_set_named_property()>(env, obj1, 'str', str1)",
                "staticinvoke <@%unk/%unk: .napi_set_named_property()>(env, obj, 'obj', obj1)",
                "staticinvoke <@%unk/%unk: .napi_set_named_property()>(env, obj, 'hello', hello1)",
                '%3 = &arr1',
                "staticinvoke <@%unk/%unk: .napi_get_named_property()>(env, obj, 'arr', %3)",
                'arrLen = undefined',
                '%4 = &arrLen',
                'staticinvoke <@%unk/%unk: .napi_get_array_length()>(env, arr1, %4)',
                'i = 0',
            ],
            preds: [],
            succes: [1],
        },
        {
            id: 1,
            stmts: ['if i < arrLen'],
            preds: [0, 2],
            succes: [2, 3],
        },
        {
            id: 2,
            stmts: [
                'tmp = undefined',
                '%5 = &tmp',
                'staticinvoke <@%unk/%unk: .napi_create_uint32()>(env, i, %5)',
                'staticinvoke <@%unk/%unk: .napi_set_element()>(env, arr1, i, tmp)',
                'i = i + 1',
            ],
            preds: [1],
            succes: [1],
        },
        {
            id: 3,
            stmts: [
                'staticinvoke <@%unk/%unk: .napi_delete_element()>(env, arr1, 2, nullptr)',
                '%6 = &typedArray1',
                `staticinvoke <@%unk/%unk: .napi_get_named_property()>(env, obj, 'typedArray', %6)`,
                'isTypedArray = undefined',
                'if napi_ok != napi_is_typedarray(env, typedArray1, &isTypedArray) != 0',
            ],
            preds: [1],
            succes: [4, 5],
        },
        {
            id: 4,
            stmts: ['return nullptr'],
            preds: [3],
            succes: [],
        },
        {
            id: 5,
            stmts: [
                'type = undefined',
                'inputBuffer = undefined',
                'length = undefined',
                'byteOffset = undefined',
                '%7 = &type',
                '%8 = &length',
                '%9 = &inputBuffer',
                '%10 = &byteOffset',
                'staticinvoke <@%unk/%unk: .napi_get_typedarray_info()>(env, typedArray1, %7, %8, nullptr, %9, %10)',
                'data = undefined',
                'byteLength = undefined',
                '%11 = &data',
                '%12 = &byteLength',
                'staticinvoke <@%unk/%unk: .napi_get_arraybuffer_info()>(env, inputBuffer, %11, %12)',
                'outputBuffer = undefined',
                'outputPrt = nullptr',
                '%13 = &outputPrt',
                '%14 = &outputBuffer',
                'staticinvoke <@%unk/%unk: .napi_create_arraybuffer()>(env, byteLength, %13, %14)',
                'outputArray = undefined',
                '%15 = &outputArray',
                'staticinvoke <@%unk/%unk: .napi_create_typedarray()>(env, type, length, outputBuffer, byteOffset, %15)',
                '%16 = <uint8_t*>data',
                'inputBytes = %16 + byteOffset',
                'outputBytes = <uint8_t*>outputPrt',
                'i = 0',
            ],
            preds: [3],
            succes: [6],
        },
        {
            id: 6,
            stmts: ['if i < length'],
            preds: [5, 7],
            succes: [7, 8],
        },
        {
            id: 7,
            stmts: ['%17 = inputBytes[i]', '%18 = %17 * 2', 'outputBytes[i] = %18', 'i = i + 1'],
            preds: [6],
            succes: [6],
        },
        {
            id: 8,
            stmts: [`staticinvoke <@%unk/%unk: .napi_set_named_property()>(env, obj, 'typedArray', outputArray)`, 'return obj'],
            preds: [6],
            succes: [],
        },
    ],
};
