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
#pragma once

#include "clang/Tooling/ArgumentsAdjusters.h"
#include "clang/Tooling/CompilationDatabase.h"
#include "llvm/ADT/ArrayRef.h"
#include "llvm/ADT/StringRef.h"
#include "llvm/Support/raw_ostream.h"

#include <memory>
#include <string>
#include <vector>

namespace ast_dumper {

// Parse "-p <build_dir>" from argv (for debug/diagnostics only).
std::string GetBuildPathFromArgv(int argc, const char **argv);

// Print basic checks for build dir + compile_commands.json + loadFromDirectory().
void PrintBuildPathDiagnostics(llvm::StringRef BuildPath);

// True if DB contains compile commands for any input file (tries slash-normalization on Windows).
bool HasCompileCommandForAnyInput(clang::tooling::CompilationDatabase &DB,
                                  llvm::ArrayRef<std::string> Inputs);

// Create a minimal fallback DB when no compile command is found.
std::unique_ptr<clang::tooling::CompilationDatabase>
MakeFallbackDB(llvm::ArrayRef<std::string> Inputs);

// Select DB for inputs; returns ParserDB or OwnedFallback.get().
clang::tooling::CompilationDatabase *SelectDBForInputs(
    clang::tooling::CompilationDatabase &ParserDB,
    llvm::ArrayRef<std::string> Inputs,
    std::unique_ptr<clang::tooling::CompilationDatabase> &OwnedFallback);

// OHOS: inject libc++ headers (include/c++/v1) + prefer -stdlib=libc++ for OHOS targets only.
clang::tooling::ArgumentsAdjuster MakeOhosLibcxxFixAdjuster();

} // namespace ast_dumper
