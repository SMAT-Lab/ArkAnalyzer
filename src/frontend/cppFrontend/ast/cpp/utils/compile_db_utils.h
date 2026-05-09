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
std::string GetBuildPathFromArgv(int argc, const char **argv);

// Print basic checks for build dir + compile_commands.json + loadFromDirectory().
void printBuildPathDiagnostics(llvm::StringRef BuildPath);

// Adds -std / -stdlib for the given source suffix.
void insertArgumentAdjuster(ClangTool &Tool, llvm::StringRef sourceFile);

/**
 * LibTooling does not run the full Clang driver: OHOS compile_commands carry --gcc-toolchain and
 * libc++ paths that the real SDK clang expands, but the host tool misses them. Prepends
 * -resource-dir (under the gcc-toolchain LLVM root) and manifest -I paths (SDK libc++ / config_site).
 */
void prependResourceDirAndManifestIncludes(ClangTool &Tool,
                                           const std::vector<std::string> &manifestIncludeDirs);

/** For FixedCompilationDatabase fallback: prepend -resource-dir when manifest paths include OHOS libc++. */
void prependResourceDirFromManifestIncludes(std::vector<std::string> &compileArgs,
                                            const std::vector<std::string> &manifestIncludeDirs);

/**
 * Combines prependResourceDirFromManifestIncludes with -stdlib=libc++ when manifest lists OHOS
 * libc++ (path contains c++/v1). LibTooling on Linux otherwise mixes libc++ with host GCC libstdc++
 * headers and fails parsing, producing incomplete AST JSON.
 */
void prependOhSdkHeaderCompileFlags(std::vector<std::string> &compileArgs,
                                    const std::vector<std::string> &manifestIncludeDirs);

/**
 * When using FixedCompilationDatabase fallback on Linux hosts (no OHOS libc++ in the manifest),
 * prepend -resource-dir (from the `clang` on PATH) and typical libstdc++/GCC system include paths.
 * LibTooling does not run the full driver, so without this, <stddef.h> and friends often fail.
 */
void appendHostLinuxFallbackSystemIncludes(std::vector<std::string> &compileArgs,
                                           const std::vector<std::string> &manifestIncludeDirs);

/** Same as appendHostLinuxFallbackSystemIncludes but for JSON compile_commands (LibTooling adjuster). */
void prependHostLinuxFallbackToClangTool(ClangTool &Tool,
                                         const std::vector<std::string> &manifestIncludeDirs);

} // namespace ast_dumper
