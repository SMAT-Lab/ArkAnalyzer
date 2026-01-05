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

std::string GetBuildPathFromArgv(int argc, const char **argv)
{
    for (int i = 0; i + 1 < argc; ++i) {
        if (std::strcmp(argv[i], "-p") == 0) {
            return std::string(argv[i + 1]);
        }
    }
    return {};
}

void PrintBuildPathDiagnostics(llvm::StringRef BuildPath)
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

clang::tooling::ArgumentsAdjuster MakeOhosLibcxxFixAdjuster()
{
    using clang::tooling::CommandLineArguments;

    return clang::tooling::ArgumentsAdjuster(
        [](const CommandLineArguments &Args, llvm::StringRef File) {
            CommandLineArguments NewArgs = Args;

            // Only touch OHOS TUs.
            bool isOhosTarget = false;
            bool isExistCSystem = false;
            bool isExistStdlib = false;
            bool isExistNostdinc = false;
            for (const auto &a : NewArgs) {
                llvm::outs()<<"arg: "<<a<<"\n";
                llvm::StringRef R(a);
                if (R.starts_with("--target=") && R.contains("ohos")) {
                    isOhosTarget = true;
                } else if (R.contains("-stdlib=")) {
                    isOhosTarget = true;
                } else if (R == "-nostdinc++") {
                    isExistNostdinc = true;
                } else if (R == "-std=c++17") {
                    isExistCSystem = true;
                }
            }

            // support c++17
            if (!isExistCSystem) {
                if (File.ends_with(".c")) {
                   NewArgs.push_back("-std=c99");
                } else if (File.ends_with(".cc") || File.ends_with(".cpp") || File.ends_with(".cxx") ||
                           File.ends_with(".h")  || File.ends_with(".hpp")) {
                   NewArgs.push_back("-std=c++17");
                }
            }

            // Prefer libc++ only if user/ccjson didn't specify.
            if (!isOhosTarget) {
                NewArgs.push_back("-stdlib=libc++");
            }

            // -nostdinc++ disables standard C++ headers; remove for OHOS parsing.
            if (isExistNostdinc) {
                NewArgs.erase(std::remove(NewArgs.begin(), NewArgs.end(), std::string("-nostdinc++")), NewArgs.end());
            }
            return NewArgs;
        }
    );
}

} // namespace ast_dumper
