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

// How Native side modifies Object type data and properties passed from ArkTS
#include <iostream>
#include <cstdint>
#include "napi/native_api.h"
#include "RevArkTSObj.h"

#define TWO 2

// *Originally RevArkTSObj::ModifyObject => When RevArkTSObj.h file cannot be found,
// Class::Method functions declared outside class have no corresponding AST nodes
napi_value ModifyObject(napi_env env, napi_callback_info info)
{
    size_t argc = 1;
    napi_value args[1] = {nullptr};
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
    napi_value obj = args[0];
    napi_value obj1;
    napi_value hello1;
    napi_value arr1;
    napi_value typedArray1;
    napi_get_named_property(env, obj, "obj", &obj1);
    char *buf = "this is modified";
    napi_value str1;
    // *Unknown macro NAPI_AUTO_LENGTH causes AST node missing on the right side of assignment expression
    napi_create_string_utf8(env, buf, NAPI_AUTO_LENGTH, &str1);
    napi_set_named_property(env, obj1, "str", str1);
    napi_set_named_property(env, obj, "obj", obj1);
    // *Unknown macro NAPI_AUTO_LENGTH causes AST node missing on the right side of assignment expression
    napi_create_string_utf8(env, "world0", NAPI_AUTO_LENGTH, &hello1);
    napi_set_named_property(env, obj, "hello", hello1);
    napi_get_named_property(env, obj, "arr", &arr1);
    uint32_t arrLen;
    napi_get_array_length(env, arr1, &arrLen);
    for (int i = 0; i < arrLen; i++) {
        napi_value tmp;
        napi_create_uint32(env, i, &tmp);
        napi_set_element(env, arr1, i, tmp);
    }
    napi_delete_element(env, arr1, TWO, nullptr);
    napi_get_named_property(env, obj, "typedArray", &typedArray1);
    bool isTypedArray;
    // *Unknown function napi_is_typedarray(env, typedArray1, &isTypedArray) causes if statement cannot form BinaryOp
    if (napi_ok != napi_is_typedarray(env, typedArray1, &isTypedArray)) {
        return nullptr;
    }
    napi_typedarray_type type;
    napi_value inputBuffer;
    size_t length;
    size_t byteOffset;
    napi_get_typedarray_info(env, typedArray1, &type, &length, nullptr, &inputBuffer, &byteOffset);
    // Get the underlying data buffer 'data' of inputBuffer, and the length 'byteLength' of the underlying data buffer.
    void *data;
    size_t byteLength;
    napi_get_arraybuffer_info(env, inputBuffer, &data, &byteLength);
    // Create a new ArrayBuffer, &output_ptr points to the pointer of the underlying data buffer of ArrayBuffer
    napi_value outputBuffer;
    void *outputPrt = nullptr;
    napi_create_arraybuffer(env, byteLength, &outputPrt, &outputBuffer);
    // Create typedarray using outputBuffer
    napi_value outputArray;
    napi_create_typedarray(env, type, length, outputBuffer, byteOffset, &outputArray);
    // data consists of consecutive memory locations, reinterpret_cast<uint8_t *>(data) represents the memory address of
    // its first element. data is the old arraybuffer data pointer
    uint8_t *inputBytes = reinterpret_cast<uint8_t *>(data) + byteOffset;
    // Assign output_ptr pointer to outputBytes
    // output_ptr is the new arraybuffer data pointer
    uint8_t *outputBytes = reinterpret_cast<uint8_t *>(outputPrt);
    for (int i = 0; i < length; i++) {
        // Multiply each element of old arraybuffer data by 2, and assign to new arraybuffer data
        outputBytes[i] = inputBytes[i] * 2;
    }
    // Assign new typedArray to obj['typedArray']
    napi_set_named_property(env, obj, "typedArray", outputArray);
    return obj;
}