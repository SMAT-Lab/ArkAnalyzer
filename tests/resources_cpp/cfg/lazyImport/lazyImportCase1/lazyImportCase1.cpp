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
 
// napi_init.cpp
#include "napi/native_api.h"
#include "hilog/log.h"

#define TWO 2

class GlobalConfig {
public:
    static napi_value Init(napi_env env, napi_value exports);
    static void Destructor(napi_env env, void* nativeObject, void* finalizeHint);

private:
    explicit GlobalConfig(double value = 0);
    ~GlobalConfig();

    static napi_value New(napi_env env, napi_callback_info info);
    static napi_value GetValue(napi_env env, napi_callback_info info);
    static napi_value SetValue(napi_env env, napi_callback_info info);
    static napi_value PlusOne(napi_env env, napi_callback_info info);

    double value_;
    napi_env env_;
    napi_ref wrapper_;

    napi_value instance_;
};


static thread_local napi_ref g_ref = nullptr;


GlobalConfig::GlobalConfig(double value)
    : value_(value), env_(nullptr), wrapper_(nullptr) {}  // Initialization list assignment, currently not reflected in ArkIR

GlobalConfig::~GlobalConfig()
{
    napi_delete_reference(env_, wrapper_);
}

void GlobalConfig::Destructor(napi_env env, void* nativeObject, [[maybe_unused]] void* finalizeHint)
{
    OH_LOG_INFO(LOG_APP, "GlobalConfig::Destructor called");
    delete reinterpret_cast<GlobalConfig*>(nativeObject);
}

napi_value GlobalConfig::Init(napi_env env, napi_value exports)
{
    napi_property_descriptor properties[] = {
        { "value", 0, 0, GetValue, SetValue, 0, napi_default, 0 },
        { "plusOne", nullptr, PlusOne, nullptr, nullptr, nullptr, napi_default, nullptr }
    };

    napi_value cons;
    napi_define_class(env, "GlobalConfig", NAPI_AUTO_LENGTH, New, nullptr, TWO, properties, &cons);

    napi_create_reference(env, cons, 1, &g_ref);
    napi_set_named_property(env, exports, "GlobalConfig", cons);
    return exports;
}

napi_value GlobalConfig::New(napi_env env, napi_callback_info info)
{
    OH_LOG_INFO(LOG_APP, "GlobalConfig::New called");

    napi_value newTarget;
    napi_get_new_target(env, info, &newTarget);
    if (newTarget != nullptr) {
        // Using 'new GlobalConfig(...)' calling method
        size_t argc = 1;
        napi_value args[1];
        napi_value jsThis;
        napi_get_cb_info(env, info, &argc, args, &jsThis, nullptr);

        double value = 0.0;
        napi_valuetype valuetype;
        napi_typeof(env, args[0], &valuetype);
        if (valuetype != napi_undefined) {
            napi_get_value_double(env, args[0], &value);
        }

        GlobalConfig* obj = new GlobalConfig(value);

        obj->env_ = env;
        // Bind ArkTS object jsThis with C++ object obj through napi_wrap
        napi_status status = napi_wrap(env,
                                       jsThis,
                                       reinterpret_cast<void*>(obj),
                                       GlobalConfig::Destructor,
                                       nullptr,
                                       &obj->wrapper_);
        if (status != napi_ok) {
            OH_LOG_INFO(LOG_APP, "Failed to bind native object to js object"
                        ", return code: %{public}d", status);
            delete obj;
            return jsThis;
        }

        uint32_t refCount = 0;
        napi_reference_unref(env, obj->wrapper_, &refCount);

        return jsThis;
    } else {
        size_t argc = 1;
        napi_value args[1];
        napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);

        napi_value cons;
        napi_get_reference_value(env, g_ref, &cons);
        napi_value instance;
        napi_new_instance(env, cons, argc, args, &instance);

        return instance;
    }
}

napi_value GlobalConfig::GetValue(napi_env env, napi_callback_info info)
{
    OH_LOG_INFO(LOG_APP, "GlobalConfig::GetValue called");

    napi_value jsThis;
    napi_get_cb_info(env, info, nullptr, nullptr, &jsThis, nullptr);

    GlobalConfig* obj;

    napi_unwrap(env, jsThis, reinterpret_cast<void**>(&obj));
    napi_value num;
    napi_create_double(env, obj->value_, &num);

    return num;
}

napi_value GlobalConfig::SetValue(napi_env env, napi_callback_info info)
{
    OH_LOG_INFO(LOG_APP, "GlobalConfig::SetValue called");

    size_t argc = 1;
    napi_value value;
    napi_value jsThis;

    napi_get_cb_info(env, info, &argc, &value, &jsThis, nullptr);

    GlobalConfig* obj;

    napi_unwrap(env, jsThis, reinterpret_cast<void**>(&obj));
    napi_get_value_double(env, value, &obj->value_);

    return nullptr;
}

napi_value GlobalConfig::PlusOne(napi_env env, napi_callback_info info)
{
    OH_LOG_INFO(LOG_APP, "GlobalConfig::PlusOne called");

    napi_value jsThis;
    napi_get_cb_info(env, info, nullptr, nullptr, &jsThis, nullptr);

    GlobalConfig* obj;

    napi_unwrap(env, jsThis, reinterpret_cast<void**>(&obj));
    obj->value_ += 1;
    napi_value num;
    napi_create_double(env, obj->value_, &num);

    return num;
}

EXTERN_C_START
static napi_value Init(napi_env env, napi_value exports)
{
    GlobalConfig::Init(env, exports);
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