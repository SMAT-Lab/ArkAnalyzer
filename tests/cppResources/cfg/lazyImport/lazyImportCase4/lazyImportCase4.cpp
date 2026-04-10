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

// How Native calls ArkTS methods

#include "NativeMap.h"
#include "napi/native_api.h"
#define TWO 2

static napi_value NativeCallArkTS(napi_env env, napi_callback_info info)
{
    size_t argc = 1;
    // Declare parameter array
    napi_value args[1] = { nullptr };

    // Get incoming parameters and put them into parameter array one by one
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);

    // Create an int as input parameter for ArkTS
    napi_value argv = nullptr;
    napi_create_int32(env, TWO, &argv);

    // Call the incoming callback and return its result
    napi_value result = nullptr;
    napi_call_function(env, nullptr, args[0], 1, &argv, &result);
    return result;
}