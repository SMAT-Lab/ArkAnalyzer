// 如何在ArkTS侧管理Native侧的C++对象
#include <cstdint>
#include "napi/native_api.h"
#include "hilog/log.h"
#define LOG_TAG "MY_TAG"

class TestClass {
public:
    int GetValue() {
        return this->value;
    }
    void SetValue(int value) {
        this->value = value;
    }
private:
    int value = 999;
};

static napi_value DefineObject(napi_env env, napi_callback_info info) {
    OH_LOG_INFO(LOG_APP, "enter DefineObject");

    napi_value result;
    auto a = new TestClass();
    int64_t addrValue = (int64_t)a;
    napi_create_bigint_int64(env, addrValue, &result);
    OH_LOG_INFO(LOG_APP, "end DefineObject, addrValue:%{public}ld", addrValue);
    napi_create_double(env, 22, &result);
    return result;
}

static napi_value CallObject(napi_env env, napi_callback_info info) {
    OH_LOG_INFO(LOG_APP, "enter CallObject");
    size_t argc = 1;
    napi_value args[1] = {nullptr};
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
    int64_t addrValue = 0;
    bool flag = false;
    napi_get_value_bigint_int64(env, args[0], &addrValue, &flag);
    TestClass *a = (TestClass *)addrValue;
    OH_LOG_INFO(LOG_APP, "CallObject, addrValue:%{public}ld", addrValue);
    OH_LOG_INFO(LOG_APP, "CallObject, value:%{public}d", a->GetValue());
    a->SetValue(888);
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