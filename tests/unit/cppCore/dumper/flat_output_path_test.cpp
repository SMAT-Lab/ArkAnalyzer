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

#include "utils/flat_output_path.h"

#include "llvm/ADT/StringRef.h"

#include <gtest/gtest.h>

#include <string>

namespace {

TEST(FlatOutputPathTest, UsesAstFlatExtension)
{
    const std::string out =
        ast_dumper::ComputeFlatOutPath("/tmp/project/src/foo.cpp", "/tmp/out");
    EXPECT_NE(out.find(".ast.flat"), std::string::npos);
    EXPECT_NE(out.find("foo"), std::string::npos);
}

TEST(FlatOutputPathTest, DifferentSourcesProduceDifferentBasenames)
{
    const std::string a =
        ast_dumper::FlatOutBasename("/tmp/project/include/foo.h");
    const std::string b = ast_dumper::FlatOutBasename("/tmp/project/src/foo.cpp");
    EXPECT_NE(a, b);
}

TEST(FlatOutputPathTest, SameSourceProducesStableBasename)
{
    const llvm::StringRef source = "/tmp/project/src/stable.cpp";
    EXPECT_EQ(ast_dumper::FlatOutBasename(source), ast_dumper::FlatOutBasename(source));
}

} // namespace
