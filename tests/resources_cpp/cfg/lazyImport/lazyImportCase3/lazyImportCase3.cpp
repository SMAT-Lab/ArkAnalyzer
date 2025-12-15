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

// How to perform map data interaction between ArkTS side and Native side

#include "napi/native_api.h"
#include <map>
#include <string>
#include <cstdio>

#define A_HUNDRED 100

std::map<std::string, int> testmap;

napi_value MapDemo(napi_env env, napi_callback_info info)
{
    size_t requireArgc = 2;
    size_t argc = 2;
    napi_value args[2] = {nullptr};

    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
    char str1[1024];
    size_t str1Len;
    napi_get_value_string_utf8(env, args[0], str1, A_HUNDRED, &str1Len);
    int num;
    napi_get_value_int32(env, args[1], &num);
    testmap.insert(std::make_pair(str1, num));
    for (auto e: testmap) {
        printf("%d %s\n", e.first, e.second.c_str());
    }

    return nullptr;
}