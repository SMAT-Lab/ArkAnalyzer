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

// How to manage Native-side C++ objects on the ArkTS side
#include <cstdint>
#include "napi/native_api.h"
#include "hilog/log.h"
#define LOG_TAG "MY_TAG"

class TestClass {
public:
    int GetValue()
    {
        return this->value;
    }
    void SetValue(int pValue)
    {
        this->value = pValue;
    }
private:
    int value = 999;
};

static napi_value DefineObject(napi_env env, napi_callback_info info)
{
    OH_LOG_INFO(LOG_APP, "enter DefineObject");

    napi_value result;
    auto a = new TestClass();
    int64_t addrValue = static_cast<int64_t>(reinterpret_cast<intptr_t>(a));
    napi_create_bigint_int64(env, addrValue, &result);
    OH_LOG_INFO(LOG_APP, "end DefineObject, addrValue:%{public}ld", addrValue);
    napi_create_double(env, 1, &result);
    return result;
}

static napi_value CallObject(napi_env env, napi_callback_info info)
{
    OH_LOG_INFO(LOG_APP, "enter CallObject");
    size_t argc = 1;
    napi_value args[1] = {nullptr};
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
    int64_t addrValue = 0;
    bool flag = false;
    napi_get_value_bigint_int64(env, args[0], &addrValue, &flag);
    TestClass *a = reinterpret_cast<TestClass *>(addrValue);
    OH_LOG_INFO(LOG_APP, "CallObject, addrValue:%{public}ld", addrValue);
    OH_LOG_INFO(LOG_APP, "CallObject, value:%{public}d", a->GetValue());
    a->SetValue(1);
    return nullptr;
}

EXTERN_C_START
static napi_value Init(napi_env env, napi_value exports)
{
    napi_property_descriptor desc[] = {
        { "DefineObject", nullptr, DefineObject, nullptr, nullptr, nullptr, napi_default, nullptr },
        { "CallObject", nullptr, CallObject, nullptr, nullptr, nullptr, napi_default, nullptr },
    };
    napi_define_properties(env, exports, sizeof(desc) / sizeof(desc[0]), desc);
    return exports;
}
EXTERN_C_END

static napi_module demoModule = {
    .nm_version = 1,
    .nm_flags = 0,
    .nm_filename = nullptr,
    .nm_register_func = Init,
    .nm_modname = "entry",
    .nm_priv = ((void*)0),
    .reserved = { 0 },
};

extern "C" __attribute__((constructor)) void RegisterEntryModule(void)
{
    napi_module_register(&demoModule);
}