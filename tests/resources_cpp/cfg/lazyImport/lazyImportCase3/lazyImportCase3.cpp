// ArkTS侧与Native侧如何进行map数据交互

#include "NativeMap.h"
#include "hilog/log.h"
#include <map>
#include <string>

std::map<std::string, int> testmap;

napi_value MapDemo(napi_env env, napi_callback_info info) {
    size_t requireArgc = 2;
    size_t argc = 2;
    napi_value args[2] = {nullptr};

    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
    char str1[1024];
    size_t str1_len;
    napi_get_value_string_utf8(env, args[0], str1, 100, &str1_len);
    int num;
    napi_get_value_int32(env, args[1], &num);
    testmap.insert(std::make_pair(str1, num));  // *当前AST缺少该行代码对应的节点
    for(auto e: testmap){  // *当前AST缺少for循环对应节点
        OH_LOG_ERROR(LOG_APP, "key is: %{public}s, value is  %{public}d", (e.first).c_str(), e.second);
    }

    return nullptr;
}