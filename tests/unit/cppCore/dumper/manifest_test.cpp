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

#include "test_support.h"

#include "llvm/Support/FileSystem.h"
#include "llvm/Support/JSON.h"

#include <gtest/gtest.h>

#include <cstring>
#include <string>

namespace {

TEST(ManifestTest, EmptyManifestFails)
{
    ast_cpp_test::CallbackState state;
    const int rc = ast_cpp_test::ParseCppAstWithManifest("", 0, ast_cpp_test::CollectAstRecord, &state);
    EXPECT_NE(rc, 0);
    EXPECT_TRUE(state.records.empty());
}

TEST(ManifestTest, InvalidJsonFails)
{
    ast_cpp_test::CallbackState state;
    const char *manifest = "{not-json";
    const int rc =
        ast_cpp_test::ParseCppAstWithManifest(manifest, std::strlen(manifest), ast_cpp_test::CollectAstRecord, &state);
    EXPECT_NE(rc, 0);
    EXPECT_TRUE(state.records.empty());
}

TEST(ManifestTest, MissingOutputDirFails)
{
    llvm::json::Object root;
    root["files"] = llvm::json::Array{std::string("/tmp/example.cpp")};
    std::string manifest = llvm::formatv("{0}", llvm::json::Value(std::move(root))).str();

    ast_cpp_test::CallbackState state;
    const int rc = ast_cpp_test::ParseCppAstWithManifest(manifest.data(), manifest.size(),
                                                         ast_cpp_test::CollectAstRecord, &state);
    EXPECT_NE(rc, 0);
    EXPECT_TRUE(state.records.empty());
}

} // namespace
