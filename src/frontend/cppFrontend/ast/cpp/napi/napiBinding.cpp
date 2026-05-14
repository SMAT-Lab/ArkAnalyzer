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

extern "C" int ParseCppAstWithManifest(const char *manifest,
                                       size_t manifestLength,
                                       bool (*callback)(void *userData,
                                                        uint32_t fileIndex,
                                                        uint32_t taskRc,
                                                        const char *payloadData,
                                                        size_t payloadSize),
                                       void *callbackUserData);

namespace {

napi_value ThrowTypeError(napi_env env, const char *msg)
{
    napi_throw_type_error(env, nullptr, msg);
    return nullptr;
}

struct JsAstCallbackData {
    napi_env env;
    napi_value jsCallback;
    bool callbackFailed = false;
};

bool SendFileAstToJs(void *userData, uint32_t fileIndex, uint32_t taskRc,
                     const char *payloadData, size_t payloadSize)
{
    auto *data = static_cast<JsAstCallbackData *>(userData);
    napi_env env = data->env;
    napi_value payloadString = nullptr;
    napi_status st = napi_create_string_utf8(
        env, payloadData == nullptr ? "" : payloadData, payloadSize, &payloadString);
    if (st != napi_ok) {
        data->callbackFailed = true;
        return false;
    }
    napi_value astRec = nullptr;
    st = napi_create_object(env, &astRec);
    if (st != napi_ok) {
        data->callbackFailed = true;
        return false;
    }
    napi_value idxJs = nullptr;
    napi_value exitJs = nullptr;
    napi_create_uint32(env, fileIndex, &idxJs);
    napi_create_uint32(env, taskRc, &exitJs);
    napi_set_named_property(env, astRec, "index", idxJs);
    napi_set_named_property(env, astRec, "exitCode", exitJs);
    napi_set_named_property(env, astRec, "payload", payloadString);
    napi_value global = nullptr;
    st = napi_get_global(env, &global);
    if (st != napi_ok || global == nullptr) {
        data->callbackFailed = true;
        return false;
    }
    napi_value callArgv[1] = { astRec };
    napi_value voidRet = nullptr;
    st = napi_call_function(env, global, data->jsCallback, 1, callArgv, &voidRet);
    if (st != napi_ok) {
        data->callbackFailed = true;
        return false;
    }
    return true;
}

void CopyJsStringUtf8(napi_env env, napi_value jsStr, std::string &out)
{
    size_t utf8Len = 0;
    napi_get_value_string_utf8(env, jsStr, nullptr, 0, &utf8Len);
    out.assign(utf8Len, '\0');
    napi_get_value_string_utf8(env, jsStr, out.data(), utf8Len + 1, &utf8Len);
    out.resize(utf8Len);
}

bool TryReadManifestAndCallback(napi_env env, napi_value manifestVal, napi_value cbVal,
                                std::string &manifest)
{
    napi_valuetype tyManifest = napi_undefined;
    napi_valuetype tyCallback = napi_undefined;
    napi_typeof(env, manifestVal, &tyManifest);
    napi_typeof(env, cbVal, &tyCallback);
    if (tyManifest != napi_string || tyCallback != napi_function) {
        ThrowTypeError(env, "parseCppFilesToAst expects (string manifest, function onFileAst)");
        return false;
    }
    CopyJsStringUtf8(env, manifestVal, manifest);
    return true;
}

/** N-API: \c parseCppFilesToAst(manifest, onFileAst). \c manifest is the serialized batch descriptor. */
napi_value ParseCppFilesToAst(napi_env env, napi_callback_info info)
{
    constexpr size_t kArgCount = 2;
    size_t argumentCount = kArgCount;
    napi_value args[kArgCount];
    napi_get_cb_info(env, info, &argumentCount, args, nullptr, nullptr);
    if (argumentCount < kArgCount) {
        return ThrowTypeError(env, "parseCppFilesToAst expects (manifest, onFileAst)");
    }

    std::string manifest;
    if (!TryReadManifestAndCallback(env, args[0], args[1], manifest)) {
        return nullptr;
    }

    JsAstCallbackData cbData{env, args[1], false};
    int rc = ParseCppAstWithManifest(manifest.data(), manifest.size(), SendFileAstToJs, &cbData);
    if (cbData.callbackFailed && rc == 0) {
        rc = 1;
    }
    napi_value result;
    napi_create_int32(env, rc, &result);
    return result;
}

}

NAPI_MODULE_INIT()
{
    napi_value fn = nullptr;
    napi_create_function(env, "parseCppFilesToAst", NAPI_AUTO_LENGTH,
                         ParseCppFilesToAst, nullptr, &fn);
    napi_set_named_property(env, exports, "parseCppFilesToAst", fn);
    return exports;
}
