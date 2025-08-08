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

// Native侧如何获取ArkTS侧Object对象及其成员变量

// 传入实例对象，在C++侧调用对象中的函数
#include <stddef.h>
#include "napi/native_api.h"
static napi_value CallFunction(napi_env env, napi_callback_info info) {
    // 获取实例对象
    size_t argc = 1;
    napi_value args[1] = {nullptr};
    napi_get_cb_info(env, info, &argc, args, NULL, NULL);  // *NULL对应AST节点缺失
    // 获取对象的方法
    napi_value onCall;
    napi_get_named_property(env, args[0], "onCall", &onCall);
    // 调用对象中的函数
    napi_value res;
    napi_call_function(env, args[0], onCall, 0, nullptr, &res);
    return onCall;
}

EXTERN_C_START
static napi_value Init(napi_env env, napi_value exports) {
    napi_property_descriptor desc[] = {
        {"callFunction", nullptr, CallFunction, nullptr, nullptr, nullptr, napi_default, nullptr}};
    napi_define_properties(env, exports, sizeof(desc) / sizeof(desc[0]), desc);
    return exports;
}
EXTERN_C_END