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

#pragma once

#include <cstdint>
#include <fstream>
#include <string>
#include <vector>

#ifndef ARKANALYZER_ROOT
#define ARKANALYZER_ROOT "."
#endif

namespace ast_cpp_test {

inline std::string RepoRoot()
{
    return ARKANALYZER_ROOT;
}

inline std::string CppNativeFixture(const char *name)
{
    return std::string(ARKANALYZER_ROOT) + "/tests/cppResources/dumper/" + name;
}

std::vector<uint8_t> ReadFileBytes(const std::string &path);

struct AstRecord {
    uint32_t fileIndex = 0;
    uint32_t taskRc = 0;
    std::string flatPath;
};

struct CallbackState {
    std::vector<AstRecord> records;
};

inline bool CollectAstRecord(void *userData, uint32_t fileIndex, uint32_t taskRc,
                             const char *flatPathData, size_t flatPathSize)
{
    auto *state = static_cast<CallbackState *>(userData);
    state->records.push_back(
        AstRecord{fileIndex, taskRc, std::string(flatPathData == nullptr ? "" : flatPathData, flatPathSize)});
    return true;
}

extern "C" int ParseCppAstWithManifest(const char *manifest, size_t manifestLength,
                                       bool (*callback)(void *userData, uint32_t fileIndex, uint32_t taskRc,
                                                        const char *flatPathData, size_t flatPathSize),
                                       void *callbackUserData);

} // namespace ast_cpp_test
