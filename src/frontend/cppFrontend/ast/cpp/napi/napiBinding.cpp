/*
 * Copyright (c) 2026 Huawei Device Co., Ltd.
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
#include <node_api.h>

#include <cstdint>
#include <string>
#include <vector>

int RunAstJsonDump(int argc, const char **argv);

namespace {

constexpr const char *AST_JSON_DUMPER_ARGV0 = "astJsonDumper";

napi_value ThrowTypeError(napi_env env, const char *msg)
{
    napi_throw_type_error(env, nullptr, msg);
    return nullptr;
}

napi_value RunArgv(napi_env env, napi_callback_info info)
{
    size_t argcCb = 1;
    napi_value argsCb[1];
    napi_get_cb_info(env, info, &argcCb, argsCb, nullptr, nullptr);
    if (argcCb < 1) {
        return ThrowTypeError(env, "runArgv expects an array of strings");
    }

    bool isArray = false;
    napi_is_array(env, argsCb[0], &isArray);
    if (!isArray) {
        return ThrowTypeError(env, "runArgv expects an array of strings");
    }

    uint32_t len = 0;
    napi_get_array_length(env, argsCb[0], &len);
    std::vector<std::string> storage;
    storage.reserve(len + 1);
    storage.emplace_back(AST_JSON_DUMPER_ARGV0);
    for (uint32_t i = 0; i < len; ++i) {
        napi_value el;
        napi_get_element(env, argsCb[0], i, &el);
        napi_valuetype vt;
        napi_typeof(env, el, &vt);
        if (vt != napi_string) {
            return ThrowTypeError(env, "runArgv array elements must be strings");
        }
        size_t strLen = 0;
        napi_get_value_string_utf8(env, el, nullptr, 0, &strLen);
        std::string s(strLen, '\0');
        napi_get_value_string_utf8(env, el, s.data(), strLen + 1, &strLen);
        s.resize(strLen);
        storage.push_back(std::move(s));
    }

    std::vector<const char *> argv;
    argv.reserve(storage.size());
    for (const auto &s : storage) {
        argv.push_back(s.c_str());
    }

    int rc = RunAstJsonDump(static_cast<int>(argv.size()), argv.data());
    napi_value result;
    napi_create_int32(env, rc, &result);
    return result;
}

} // namespace

NAPI_MODULE_INIT()
{
    napi_value fn;
    napi_create_function(env, "runArgv", NAPI_AUTO_LENGTH, RunArgv, nullptr, &fn);
    napi_set_named_property(env, exports, "runArgv", fn);
    return exports;
}
