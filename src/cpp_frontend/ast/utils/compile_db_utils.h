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
#include "clang/Tooling/Tooling.h"
#include "llvm/ADT/ArrayRef.h"
#include "llvm/ADT/StringRef.h"
#include "llvm/Support/raw_ostream.h"

#include <memory>
#include <string>
#include <vector>

#define SMALL_STRING_SIZE_256 256
#define SMALL_STRING_SIZE_512 512

using namespace clang::tooling;

namespace ast_dumper {

// Parse "-p <build_dir>" from argv (for debug/diagnostics only).
std::string getBuildPathFromArgv(int argc, const char **argv);

// Print basic checks for build dir + compile_commands.json + loadFromDirectory().
void printBuildPathDiagnostics(llvm::StringRef BuildPath);

// Add compiler line(-std=c++17)
void insertArgumentAdjuster(ClangTool &Tool, llvm::StringRef sourceFile);

} // namespace ast_dumper
