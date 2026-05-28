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

#include "llvm/ADT/StringExtras.h"
#include "llvm/Support/FileSystem.h"
#include "llvm/Support/FormatVariadic.h"
#include "llvm/Support/Path.h"
#include "llvm/Support/xxhash.h"

namespace ast_dumper {

std::string FlatOutBasename(llvm::StringRef sourceFile)
{
    llvm::SmallString<FLAT_OUT_PATH_BUFFER_SIZE> absPath(sourceFile);
    if (std::error_code ec = llvm::sys::fs::make_absolute(absPath); ec) {
        absPath = sourceFile;
    }
    std::string slug;
    slug.reserve(absPath.size());
    for (char c : absPath) {
        if (llvm::sys::path::is_separator(static_cast<char>(c))) {
            if (!slug.empty() && slug.back() != '_') {
                slug.push_back('_');
            }
        } else if (llvm::isAlnum(static_cast<unsigned char>(c)) || c == '.' || c == '-' || c == '_') {
            slug.push_back(c);
        } else {
            slug.push_back('_');
        }
    }
    while (!slug.empty() && slug.front() == '_') {
        slug.erase(slug.begin());
    }
    if (slug.size() > FLAT_OUT_MAX_STEM_LEN) {
        const uint64_t digest = llvm::xxh3_64bits(llvm::StringRef(absPath));
        slug = llvm::formatv("{0:x16}_{1}", digest, llvm::sys::path::filename(absPath)).str();
    }
    return slug;
}

std::string ComputeFlatOutPath(llvm::StringRef sourceFile, llvm::StringRef flatOutputDir)
{
    llvm::SmallString<FLAT_OUT_PATH_BUFFER_SIZE> fileName(FlatOutBasename(sourceFile));
    llvm::sys::path::replace_extension(fileName, ".ast.flat");
    llvm::SmallString<FLAT_OUT_PATH_BUFFER_SIZE> out(flatOutputDir);
    llvm::sys::path::append(out, fileName);
    return out.str().str();
}

} // namespace ast_dumper
