// Native如何调ArkTS的方法

#include "NativeMap.h"

static napi_value NativeCallArkTS(napi_env env, napi_callback_info info)
{
    size_t argc = 1;
    // 声明参数数组
    napi_value args[1] = { nullptr };

    // 获取传入的参数并依次放入参数数组中
    napi_get_cb_info(env, info, &argc, args , nullptr, nullptr);

    // 创建一个int，作为ArkTS的入参
    napi_value argv = nullptr;
    napi_create_int32(env, 2, &argv );

    // 调用传入的callback，并将其结果返回
    napi_value result = nullptr;
    napi_call_function(env, nullptr, args[0], 1, &argv, &result);
    return result;
}