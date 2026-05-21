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

#include "serialization/astFlatStreamer.h"

#include "llvm/Support/FileSystem.h"
#include "llvm/Support/Path.h"

#include <gtest/gtest.h>

#include <vector>

namespace {

TEST(FlatIoTest, WriteFlatPayloadToFileRoundTrip)
{
    const std::vector<uint8_t> bytes = {0x10, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03};
    llvm::SmallString<128> tmp;
    ASSERT_FALSE(llvm::sys::fs::createUniqueDirectory("arkanalyzer-flat-io-test", tmp));
    llvm::sys::path::append(tmp, "sample.ast.flat");
    const std::string outPath = tmp.str().str();

    EXPECT_TRUE(ark_cxx_ast_flat::WriteFlatPayloadToFile(bytes, outPath));
    EXPECT_TRUE(llvm::sys::fs::exists(outPath));

    uint64_t fileSize = 0;
    ASSERT_FALSE(llvm::sys::fs::file_size(outPath, fileSize));
    EXPECT_EQ(fileSize, bytes.size());

    std::error_code ec = llvm::sys::fs::remove(outPath);
    EXPECT_FALSE(ec);
}

TEST(FlatIoTest, WriteToEmptyPathFails)
{
    const std::vector<uint8_t> bytes = {0x01};
    EXPECT_FALSE(ark_cxx_ast_flat::WriteFlatPayloadToFile(bytes, ""));
}

} // namespace
