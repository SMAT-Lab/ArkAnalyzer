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

export const ModifyObject_EXPECT = {
    blocks: [
        {
            id: 0,
            stmts: [
                'env = parameter0: napi_env',
                'info = parameter1: napi_callback_info',
                'this = this: @lazyImportCase7/lazyImportCase7.cpp: %dflt',
                'argc = 1',
                '%0 = newarray (napi_value[])[1]',
                '%0[0] = null',
                'args = %0',
                '%1 = &argc',
                'staticinvoke <@%unk/%unk: .napi_get_cb_info()>(env, info, %1, args, null, null)',
                'obj = args[0]',
                'obj1 = undefined',
                'hello1 = undefined',
                'arr1 = undefined',
                'typedArray1 = undefined',
                '%2 = &obj1',
                'staticinvoke <@%unk/%unk: .napi_get_named_property()>(env, obj, \'obj\', %2)',
                'buf = \'this is modified\'',
                'str1 = undefined',
                '%3 = &str1',
                'staticinvoke <@%unk/%unk: .napi_create_string_utf8()>(env, buf, -1, %3)',
                'staticinvoke <@%unk/%unk: .napi_set_named_property()>(env, obj1, \'str\', str1)',
                'staticinvoke <@%unk/%unk: .napi_set_named_property()>(env, obj, \'obj\', obj1)',
                '%4 = &hello1',
                'staticinvoke <@%unk/%unk: .napi_create_string_utf8()>(env, \'world0\', -1, %4)',
                'staticinvoke <@%unk/%unk: .napi_set_named_property()>(env, obj, \'hello\', hello1)',
                '%5 = &arr1',
                'staticinvoke <@%unk/%unk: .napi_get_named_property()>(env, obj, \'arr\', %5)',
                'arrLen = undefined',
                '%6 = &arrLen',
                'staticinvoke <@%unk/%unk: .napi_get_array_length()>(env, arr1, %6)',
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
                '%7 = &tmp',
                'staticinvoke <@%unk/%unk: .napi_create_uint32()>(env, i, %7)',
                'staticinvoke <@%unk/%unk: .napi_set_element()>(env, arr1, i, tmp)',
                'i = i + 1',
            ],
            preds: [1],
            succes: [1],
        },
        {
            id: 3,
            stmts: [
                'staticinvoke <@%unk/%unk: .napi_delete_element()>(env, arr1, 2, null)',
                '%8 = &typedArray1',
                'staticinvoke <@%unk/%unk: .napi_get_named_property()>(env, obj, \'typedArray\', %8)',
                'isTypedArray = undefined',
                '%9 = @%unk/%unk: napi_status.[static]napi_ok',
                '%10 = &isTypedArray',
                '%11 = staticinvoke <@%unk/%unk: .napi_is_typedarray()>(env, typedArray1, %10)',
                'if %9 != %11',
            ],
            preds: [1],
            succes: [4, 5],
        },
        {
            id: 4,
            stmts: ['return null'],
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
                '%12 = &type',
                '%13 = &length',
                '%14 = &inputBuffer',
                '%15 = &byteOffset',
                'staticinvoke <@%unk/%unk: .napi_get_typedarray_info()>(env, typedArray1, %12, %13, null, %14, %15)',
                'data = undefined',
                'byteLength = undefined',
                '%16 = &data',
                '%17 = &byteLength',
                'staticinvoke <@%unk/%unk: .napi_get_arraybuffer_info()>(env, inputBuffer, %16, %17)',
                'outputBuffer = undefined',
                'outputPrt = null',
                '%18 = &outputPrt',
                '%19 = &outputBuffer',
                'staticinvoke <@%unk/%unk: .napi_create_arraybuffer()>(env, byteLength, %18, %19)',
                'outputArray = undefined',
                '%20 = &outputArray',
                'staticinvoke <@%unk/%unk: .napi_create_typedarray()>(env, type, length, outputBuffer, byteOffset, %20)',
                '%21 = <CXXReinterpretCastExpr: uint8_t*>data',
                'inputBytes = %21 + byteOffset',
                'outputBytes = <CXXReinterpretCastExpr: uint8_t*>outputPrt',
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
            stmts: [
                '%22 = inputBytes[i]',
                '%23 = %22 * 2',
                'outputBytes[i] = %23',
                'i = i + 1',
            ],
            preds: [6],
            succes: [6],
        },
        {
            id: 8,
            stmts: [
                'staticinvoke <@%unk/%unk: .napi_set_named_property()>(env, obj, \'typedArray\', outputArray)',
                'return obj',
            ],
            preds: [6],
            succes: [],
        },
    ],
};
