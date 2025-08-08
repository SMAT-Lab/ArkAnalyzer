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

// Native侧如何对ArkTS传递的Object类型的数据、属性进行修改
#include <iostream>
#include <cstdint>
#include "napi/native_api.h"
#include "RevArkTSObj.h"
// *原本RevArkTSObj::ModifyObject =》 找不到RevArkTSObj.h文件时，这种类外声明的函数Class::Method没有对应AST节点
napi_value ModifyObject(napi_env env, napi_callback_info info) {
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
    napi_create_string_utf8(env, buf, NAPI_AUTO_LENGTH, &str1);  // *未知宏NAPI_AUTO_LENGTH导致赋值右侧表达式的AST节点缺失
    napi_set_named_property(env, obj1, "str", str1);
    napi_set_named_property(env, obj, "obj", obj1);


    napi_create_string_utf8(env, "world0", NAPI_AUTO_LENGTH, &hello1);  // *未知宏NAPI_AUTO_LENGTH导致赋值右侧表达式的AST节点缺失
    napi_set_named_property(env, obj, "hello", hello1);


    napi_get_named_property(env, obj, "arr", &arr1);
    uint32_t arrLen;
    napi_get_array_length(env, arr1, &arrLen);
    for (int i = 0; i < arrLen; i++) {
        napi_value tmp;
        napi_create_uint32(env, i, &tmp);
        napi_set_element(env, arr1, i, tmp);
    }
    napi_delete_element(env, arr1, 2, nullptr);




    napi_get_named_property(env, obj, "typedArray", &typedArray1);
    bool is_typedArray;
    if (napi_ok != napi_is_typedarray(env, typedArray1, &is_typedArray)) {  // *未知函数napi_is_typedarray(env, typedArray1, &is_typedArray)导致if判断语句构不成BinaryOp
        return nullptr;
    }
    napi_typedarray_type type;
    napi_value input_buffer;
    size_t length;
    size_t byte_offset;
    napi_get_typedarray_info(env, typedArray1, &type, &length, nullptr, &input_buffer, &byte_offset);
    // 获取 input_buffer 的基础数据缓冲区 data，和基础数据缓冲区的长度 byte_length。
    void *data;
    size_t byte_length;
    napi_get_arraybuffer_info(env, input_buffer, &data, &byte_length);
    // 创建新的ArrayBuffer，&output_ptr 指向 ArrayBuffer 的底层数据缓冲区的指针
    napi_value output_buffer;
    void *output_prt = nullptr;
    napi_create_arraybuffer(env, byte_length, &output_prt, &output_buffer);
    // 使用 output_buffer 创建 typedarray
    napi_value output_array;
    napi_create_typedarray(env, type, length, output_buffer, byte_offset, &output_array);
    // data 是由连续的内存位置组成，reinterpret_cast<uint8_t *>(data)  表示其第一个元素的内存地址。
    // data 是旧的 arraybuffer 数据指针
    uint8_t *input_bytes = reinterpret_cast<uint8_t *>(data) + byte_offset;
    // 把 output_ptr 指针赋值给 output_bytes
    // output_ptr 是新的 arraybuffer 数据指针
    uint8_t *output_bytes = reinterpret_cast<uint8_t *>(output_prt);
    for (int i = 0; i < length; i++) {
        // 将旧 arraybuffer 数据每一个元素乘 2，赋值给新 arraybuffer 数据
        output_bytes[i] = input_bytes[i] * 2;
    }
    // 将新 typedArray 赋值给 obj['typedArray']
    napi_set_named_property(env, obj, "typedArray", output_array);
    return obj;
}