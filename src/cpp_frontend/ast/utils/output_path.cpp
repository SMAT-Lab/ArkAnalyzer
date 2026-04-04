/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
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
#include "utils/output_path.h"

#include "llvm/ADT/SmallString.h"
#include "llvm/Support/FileSystem.h"
#include "llvm/Support/Path.h"

namespace ast_dumper {

std::string DefaultOutPathForInput(llvm::StringRef inFile)
{
    llvm::SmallString<SMALL_STRING_SIZE> dir = llvm::sys::path::parent_path(inFile);
    llvm::SmallString<SMALL_STRING_SIZE> base = llvm::sys::path::filename(inFile);
    llvm::sys::path::replace_extension(base, "");

    llvm::SmallString<SMALL_STRING_SIZE> out = dir;
    llvm::sys::path::append(out, (llvm::Twine(base) + "_AST.json").str());
    return out.str().str();
}

bool LooksLikeDirectoryPath(llvm::StringRef p)
{
    if (p.empty()) {
        return false;
    }
    char last = p.back();
    if (last == '/' || last == '\\') {
        return true;
    }

    llvm::sys::fs::file_status st;
    return (!llvm::sys::fs::status(p, st) && llvm::sys::fs::is_directory(st));
}

std::string ComputeOutPath(llvm::StringRef inFile, llvm::StringRef o, unsigned inputCount)
{
    if (o.empty()) return DefaultOutPathForInput(inFile);
    if (o == "-") {
        return "-";
    }

    if (LooksLikeDirectoryPath(o)) {
        llvm::SmallString<SMALL_STRING_SIZE> dir(o);
        llvm::SmallString<SMALL_STRING_SIZE> base = llvm::sys::path::filename(inFile);
        llvm::sys::path::replace_extension(base, "");

        llvm::SmallString<SMALL_STRING_SIZE> out = dir;
        llvm::sys::path::append(out, (llvm::Twine(base) + "_AST.json").str());
        return out.str().str();
    }

    // -o is a file
    if (inputCount <= 1) {
        return o.str();
    }

    llvm::SmallString<SMALL_STRING_SIZE> oPath(o);
    llvm::SmallString<SMALL_STRING_SIZE> oDir = llvm::sys::path::parent_path(oPath);
    llvm::SmallString<SMALL_STRING_SIZE> oFile = llvm::sys::path::filename(oPath);

    llvm::SmallString<SMALL_STRING_SIZE> oStem = oFile;
    llvm::sys::path::replace_extension(oStem, "");

    llvm::SmallString<SMALL_STRING_SIZE> inBase = llvm::sys::path::filename(inFile);
    llvm::sys::path::replace_extension(inBase, "");

    llvm::SmallString<SMALL_STRING_SIZE> ext = llvm::sys::path::extension(oFile);
    std::string extStr = ext.empty() ? ".json" : ext.str().str();

    llvm::SmallString<SMALL_STRING_SIZE> out = oDir;
    llvm::sys::path::append(out, (llvm::Twine(oStem) + "_" + inBase + extStr).str());
    return out.str().str();
}

} // namespace ast_dumper
