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
#include "compile_db_utils.h"
#include "clang/Tooling/CompilationDatabase.h"
#include "llvm/ADT/SmallString.h"
#include "llvm/Support/FileSystem.h"
#include "llvm/Support/Path.h"

#include <algorithm>
#include <cstring>

namespace ast_dumper {

std::string getBuildPathFromArgv(int argc, const char **argv)
{
    for (int i = 0; i + 1 < argc; ++i) {
        if (std::strcmp(argv[i], "-p") == 0) {
            return std::string(argv[i + 1]);
        }
    }
    return {};
}

void printBuildPathDiagnostics(llvm::StringRef BuildPath)
{
    if (BuildPath.empty()) {
        return;
    }

    llvm::outs() << "[ASTDumper] -p = " << BuildPath << "\n";
    llvm::outs() << "[ASTDumper] exists(build dir) = "
       << (llvm::sys::fs::exists(BuildPath) ? "yes" : "no") << "\n";

    llvm::SmallString<SMALL_STRING_SIZE_512> CC(BuildPath);
    llvm::sys::path::append(CC, "compile_commands.json");
    llvm::outs() << "[ASTDumper] exists(compile_commands.json) = "
       << (llvm::sys::fs::exists(CC) ? "yes" : "no") << "\n";

    std::string err;
    auto TestDB = clang::tooling::CompilationDatabase::loadFromDirectory(BuildPath, err);
    llvm::outs() << "[ASTDumper] loadFromDirectory = " << (TestDB ? "OK" : "FAILED") << "\n";
    if (!TestDB && !err.empty()) {
        llvm::outs() << "[ASTDumper] load error: " << err << "\n";
    }
}

void insertArgumentAdjuster(ClangTool &Tool, llvm::StringRef sourceFile)
{
    std::string cppStandard = "";
    if (sourceFile.ends_with(".c")) {
        cppStandard = "-std=c99";
    } else if (sourceFile.ends_with(".cc") || sourceFile.ends_with(".cpp") || sourceFile.ends_with(".cxx") ||
               sourceFile.ends_with(".h") || sourceFile.ends_with(".hpp")) {
        cppStandard = "-std=c++17";
    }
    Tool.appendArgumentsAdjuster(
        getinsertArgumentAdjuster(
            {"-std=c++17", "-stdlib=libc++"}, ArgumentInsertPosition::BEGIN
        )
    );
}

} // namespace ast_dumper
