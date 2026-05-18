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

#include "flatGenerated/astWire_generated.h"
#include "test_support.h"
#include "utils/flat_output_path.h"

#include "llvm/Support/FileSystem.h"
#include "llvm/Support/JSON.h"

#include <gtest/gtest.h>

namespace {

constexpr uint32_t EXPECTED_WIRE_VERSION = 3;
constexpr unsigned TEMP_DIR_PATH_BUFFER_SIZE = 128;
constexpr uint64_t MIN_SIMPLE_CLASS_FLAT_BYTES = 100;
constexpr int MANIFEST_MAX_PARALLEL_PROCESSES = 1;
constexpr int MANIFEST_MAX_PENDING_AST_RESULTS = 2;

std::string MakeManifest(const std::string &sourceFile, const std::string &outputDir)
{
    llvm::json::Object root;
    llvm::json::Array files;
    files.push_back(sourceFile);
    root["files"] = std::move(files);
    root["includeDirs"] = llvm::json::Array{};
    root["maxParallelProcesses"] = MANIFEST_MAX_PARALLEL_PROCESSES;
    root["maxPendingAstResults"] = MANIFEST_MAX_PENDING_AST_RESULTS;
    root["outputDir"] = outputDir;
    return llvm::formatv("{0}", llvm::json::Value(std::move(root))).str();
}

bool ValidateFlatFile(const std::string &path, uint64_t &outBytes)
{
    const std::vector<uint8_t> bytes = ast_cpp_test::ReadFileBytes(path);
    if (bytes.empty()) {
        return false;
    }
    outBytes = bytes.size();
    flatbuffers::Verifier verifier(bytes.data(), bytes.size());
    if (!ArkCxxAstFb::VerifyCxxAstPayloadBuffer(verifier)) {
        return false;
    }
    const auto *payload = ArkCxxAstFb::GetCxxAstPayload(bytes.data());
    if (payload == nullptr || payload->wire_version() != EXPECTED_WIRE_VERSION || payload->root() == nullptr) {
        return false;
    }
    const auto *wire = payload->root();
    if (wire->kind() == nullptr || std::string(wire->kind()->str()) != "TranslationUnitDecl") {
        return false;
    }
    return true;
}

class ClangParseTest : public ::testing::Test {
protected:
    void SetUp() override
    {
        llvm::SmallString<TEMP_DIR_PATH_BUFFER_SIZE> tmp;
        ASSERT_FALSE(llvm::sys::fs::createUniqueDirectory("arkanalyzer-cpp-native-test", tmp));
        outputDir = tmp.str().str();
    }

    std::string outputDir;
};

TEST_F(ClangParseTest, MinimalCppProducesValidFlat)
{
    const std::string source = ast_cpp_test::CppNativeFixture("minimal.cpp");
    ASSERT_TRUE(llvm::sys::fs::exists(source));

    const std::string manifest = MakeManifest(source, outputDir);
    ast_cpp_test::CallbackState state;
    const int rc = ast_cpp_test::ParseCppAstWithManifest(manifest.data(), manifest.size(),
                                                         ast_cpp_test::CollectAstRecord, &state);
    EXPECT_EQ(rc, 0);
    ASSERT_EQ(state.records.size(), 1u);
    EXPECT_EQ(state.records[0].taskRc, 0u);
    EXPECT_FALSE(state.records[0].flatPath.empty());
    EXPECT_TRUE(llvm::sys::fs::exists(state.records[0].flatPath));

    uint64_t flatBytes = 0;
    EXPECT_TRUE(ValidateFlatFile(state.records[0].flatPath, flatBytes));
    EXPECT_GT(flatBytes, 0u);
}

TEST_F(ClangParseTest, SimpleClassProducesNonEmptyAst)
{
    const std::string source = ast_cpp_test::CppNativeFixture("simple_class.cpp");
    const std::string manifest = MakeManifest(source, outputDir);
    ast_cpp_test::CallbackState state;
    const int rc = ast_cpp_test::ParseCppAstWithManifest(manifest.data(), manifest.size(),
                                                         ast_cpp_test::CollectAstRecord, &state);
    EXPECT_EQ(rc, 0);
    ASSERT_EQ(state.records.size(), 1u);
    EXPECT_FALSE(state.records[0].flatPath.empty());

    uint64_t flatBytes = 0;
    EXPECT_TRUE(ValidateFlatFile(state.records[0].flatPath, flatBytes));
    EXPECT_GT(flatBytes, MIN_SIMPLE_CLASS_FLAT_BYTES);
}

TEST_F(ClangParseTest, SyntaxErrorReturnsNonZeroExitCode)
{
    const std::string source = ast_cpp_test::CppNativeFixture("syntax_error.cpp");
    const std::string manifest = MakeManifest(source, outputDir);
    ast_cpp_test::CallbackState state;
    const int rc = ast_cpp_test::ParseCppAstWithManifest(manifest.data(), manifest.size(),
                                                         ast_cpp_test::CollectAstRecord, &state);
    EXPECT_EQ(rc, 0);
    ASSERT_EQ(state.records.size(), 1u);
    EXPECT_NE(state.records[0].taskRc, 0u);
}

TEST_F(ClangParseTest, MissingIncludeReturnsNonZeroExitCode)
{
    const std::string source = ast_cpp_test::CppNativeFixture("missing_include.cpp");
    const std::string manifest = MakeManifest(source, outputDir);
    ast_cpp_test::CallbackState state;
    const int rc = ast_cpp_test::ParseCppAstWithManifest(manifest.data(), manifest.size(),
                                                         ast_cpp_test::CollectAstRecord, &state);
    EXPECT_EQ(rc, 0);
    ASSERT_EQ(state.records.size(), 1u);
    EXPECT_NE(state.records[0].taskRc, 0u);
}

TEST(FlatOutputPathIntegrationTest, ComputeFlatOutPathMatchesCallbackPath)
{
    const std::string source = ast_cpp_test::CppNativeFixture("minimal.cpp");
    llvm::SmallString<TEMP_DIR_PATH_BUFFER_SIZE> tmp;
    ASSERT_FALSE(llvm::sys::fs::createUniqueDirectory("arkanalyzer-flat-path-test", tmp));
    const std::string outputDirLocal = tmp.str().str();

    const std::string manifest = MakeManifest(source, outputDirLocal);
    ast_cpp_test::CallbackState state;
    const int rc = ast_cpp_test::ParseCppAstWithManifest(manifest.data(), manifest.size(),
                                                         ast_cpp_test::CollectAstRecord, &state);
    ASSERT_EQ(rc, 0);
    ASSERT_EQ(state.records.size(), 1u);

    const std::string expected = ast_dumper::ComputeFlatOutPath(source, outputDirLocal);
    EXPECT_EQ(state.records[0].flatPath, expected);
}

} // namespace
