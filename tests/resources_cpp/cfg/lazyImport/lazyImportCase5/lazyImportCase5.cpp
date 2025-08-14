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

// How ArkTS side receives key-value pairs from Native side, modifies them, and returns to Native side
#include <cstddef>
#include "napi/native_api.h"
#include "hilog/log.h"
#undef LOG_DOMAIN
#undef LOG_TAG
#define LOG_DOMAIN 0x3200
#define LOG_TAG "MY_TAG"
#define TWO 2

static bool Napi_AddPropertyInt32(napi_env env, napi_value obj, const char *key, int32_t value)
{
    napi_value key_napi = nullptr;
    napi_status status = napi_create_string_utf8(env, key, NAPI_AUTO_LENGTH, &key_napi);  // AST node missing on the right side due to unknown macro
    napi_value value_napi = nullptr;
    status = napi_create_int32(env, value, &value_napi);
    status = napi_set_property(env, obj, key_napi, value_napi);
    return true;
}

static  napi_value CallbackToArkTS(napi_env env, napi_callback_info info)
{
    size_t argc = 1;
    napi_value args[1] = {nullptr};
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
    // Object for native callback to ArkTS layer
    napi_value argv = nullptr;
    napi_create_object(env, &argv);
    Napi_AddPropertyInt32(env, argv, "type", 1);
    Napi_AddPropertyInt32(env, argv, "index", TWO);
    // Native callback to ArkTS layer
    napi_value result = nullptr;
    napi_call_function(env, NULL, args[0], 1, &argv, &result);  // AST node missing corresponding to NULL
    // Get the object modified by ArkTS
    napi_value typeNumber = nullptr;
    napi_get_named_property(env, result, "type", &typeNumber);
    int32_t number;
    napi_get_value_int32(env, typeNumber, &number);
    OH_LOG_INFO(LOG_APP, "ArkTS侧修改后的type：%{public}d", number);
    // Return the modified object
    return result;
}

EXTERN_C_START
static napi_value Init(napi_env env, napi_value exports)
{
    napi_property_descriptor desc[] = {
        { "callbackToArkTS", nullptr, CallbackToArkTS, nullptr, nullptr, nullptr, napi_default, nullptr }
    };
    napi_define_properties(env, exports, sizeof(desc) / sizeof(desc[0]), desc);
    return exports;
}
EXTERN_C_END