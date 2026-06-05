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
#include "llvm/ADT/StringRef.h"
#include "llvm/Support/FileSystem.h"
#include "llvm/Support/Path.h"

#include <algorithm>
#include <cstdio>
#include <cstring>
#include <memory>
#include <optional>

#if defined(__linux__)
#include <array>
#endif

namespace ast_dumper {

namespace {
constexpr size_t STRING_BUFFER_SIZE = 512;
constexpr size_t SMALL_STRING_BUFFER_SIZE = 256;
constexpr int MINUS_ONE = -1;
constexpr size_t ZERO = 0;
constexpr size_t ONE = 1;
constexpr size_t TWO = 2;
constexpr int DECIMAL_BASE = 10;
constexpr int CXX_VERSION_17 = 17;
std::optional<std::string> DetectClangResourceDir(llvm::StringRef llvmRoot)
{
    llvm::SmallString<STRING_BUFFER_SIZE> libClang(llvmRoot);
    llvm::sys::path::append(libClang, "lib", "clang");
    if (!llvm::sys::fs::is_directory(libClang)) {
        return std::nullopt;
    }
    std::vector<std::string> versions;
    std::error_code errorCode;
    for (llvm::sys::fs::directory_iterator It(libClang.str(), errorCode), End; It != End && !errorCode;
         It.increment(errorCode)) {
        if (errorCode) {
            break;
        }
        if (llvm::sys::fs::is_directory(It->path())) {
            versions.emplace_back(It->path());
        }
    }
    if (versions.empty()) {
        return std::nullopt;
    }
    std::sort(versions.begin(), versions.end());
    return versions.back();
}

/** LLVM 14 had startswith; LLVM 15+ uses starts_with — avoid relying on either name. */
bool refHasPrefix(llvm::StringRef S, llvm::StringRef Prefix)
{
    return S.size() >= Prefix.size() && S.slice(0, Prefix.size()) == Prefix;
}

/** LLVM 14 had endswith; LLVM 15+ uses ends_with — avoid relying on either name. */
bool refHasSuffix(llvm::StringRef S, llvm::StringRef Suffix)
{
    return S.size() >= Suffix.size() &&
           S.slice(S.size() - Suffix.size(), S.size()) == Suffix;
}

bool ManifestUsesOhLibcxx(const std::vector<std::string> &manifestIncludeDirs)
{
    for (const std::string &inc : manifestIncludeDirs) {
        if (llvm::StringRef(inc).find("c++/v1") != llvm::StringRef::npos) {
            return true;
        }
    }
    return false;
}

bool ArgsSpecifyStdlib(const CommandLineArguments &Args)
{
    for (const auto &A : Args) {
        if (refHasPrefix(llvm::StringRef(A), "-stdlib=")) {
            return true;
        }
    }
    return false;
}

#if defined(__linux__)

static std::string ReadTrimmedLineFromCommand(const char *cmd)
{
    std::array<char, STRING_BUFFER_SIZE> buf{};
    std::unique_ptr<FILE, int (*)(FILE *)> pipe(popen(cmd, "r"), pclose);
    if (!pipe) {
        return {};
    }
    if (std::fgets(buf.data(), static_cast<int>(buf.size()), pipe.get()) == nullptr) {
        return {};
    }
    std::string s(buf.data());
    while (!s.empty() && (s.back() == '\n' || s.back() == '\r')) {
        s.pop_back();
    }
    return s;
}

static std::string QueryResourceDirFromEnv()
{
    if (const char* clangPathEnv = std::getenv("ARKANALYZER_CLANG_PATH")) {
        std::string cmd = std::string(clangPathEnv) + " -print-resource-dir 2>/dev/null";
        std::string out = ReadTrimmedLineFromCommand(cmd.c_str());
        if (!out.empty() && llvm::sys::fs::is_directory(out)) {
            return out;
        }
    }
    return {};
}

static std::string QueryResourceDirFromLlvmConfig(const char* llvmConfigCmd)
{
    std::string libDirCmd = std::string(llvmConfigCmd) + " --libdir 2>/dev/null";
    std::string libDir = ReadTrimmedLineFromCommand(libDirCmd.c_str());
    if (libDir.empty()) {
        return {};
    }

    llvm::SmallString<STRING_BUFFER_SIZE> resDir(libDir);
    llvm::sys::path::append(resDir, "clang");
    if (!llvm::sys::fs::is_directory(resDir)) {
        return {};
    }

    std::vector<std::string> versions;
    std::error_code errorCode;
    for (llvm::sys::fs::directory_iterator It(resDir.str(), errorCode), End;
         It != End && !errorCode; It.increment(errorCode)) {
        if (llvm::sys::fs::is_directory(It->path())) {
            versions.emplace_back(It->path());
        }
    }

    if (versions.empty()) {
        return {};
    }
    std::sort(versions.begin(), versions.end());
    return versions.back();
}

static std::string QueryResourceDirFromClang(const char* clangCmd)
{
    std::string cmd = std::string(clangCmd) + " -print-resource-dir 2>/dev/null";
    std::string out = ReadTrimmedLineFromCommand(cmd.c_str());
    if (!out.empty() && llvm::sys::fs::is_directory(out)) {
        return out;
    }
    return {};
}

static std::string QueryClangPrintResourceDirOnce()
{
    static std::string cached;
    static bool tried = false;
    if (tried) {
        return cached;
    }
    tried = true;

    // 1. Try ARKANALYZER_CLANG_PATH environment variable first
    std::string result = QueryResourceDirFromEnv();
    if (!result.empty()) {
        cached = std::move(result);
        return cached;
    }

    // 2. Try to find resource dir from llvm-config
    const char* llvmConfigs[] = {"llvm-config-19", "llvm-config", nullptr};
    for (const char* llvmConfigCmd : llvmConfigs) {
        if (!llvmConfigCmd) {
            continue;
        }
        result = QueryResourceDirFromLlvmConfig(llvmConfigCmd);
        if (!result.empty()) {
            cached = std::move(result);
            return cached;
        }
    }

    // 3. Try to find clang and get resource dir directly
    const char* clangCmds[] = {"clang-19", "clang", nullptr};
    for (const char* clangCmd : clangCmds) {
        if (!clangCmd) {
            continue;
        }
        result = QueryResourceDirFromClang(clangCmd);
        if (!result.empty()) {
            cached = std::move(result);
            return cached;
        }
    }

    return cached;
}

static bool appendLibstdcxxIncludeDirs(std::vector<std::string> &out)
{
    static constexpr const char kCppRoot[] = "/usr/include/c++";
    if (!llvm::sys::fs::is_directory(kCppRoot)) {
        return false;
    }
    int bestScore = MINUS_ONE;
    std::string bestVerDir;
    std::error_code errorCode;
    for (llvm::sys::fs::directory_iterator It(kCppRoot, errorCode), End;
         It != End && !errorCode; It.increment(errorCode)) {
        if (!llvm::sys::fs::is_directory(It->path())) {
            continue;
        }
        llvm::StringRef name = llvm::sys::path::filename(It->path());
        int ver = ZERO;
        if (name.getAsInteger(DECIMAL_BASE, ver)) {
            continue;
        }
        if (ver > bestScore) {
            bestScore = ver;
            bestVerDir = It->path();
        }
    }
    if (bestVerDir.empty()) {
        return false;
    }
    out.emplace_back("-isystem");
    out.emplace_back(bestVerDir);
    static constexpr const char *kMachineDirs[] = {"x86_64-linux-gnu", "aarch64-linux-gnu"};
    for (const char *m : kMachineDirs) {
        llvm::SmallString<SMALL_STRING_BUFFER_SIZE> sub(bestVerDir);
        llvm::sys::path::append(sub, m);
        if (llvm::sys::fs::is_directory(sub)) {
            out.emplace_back("-isystem");
            out.emplace_back(sub.str().str());
            break;
        }
    }
    llvm::SmallString<SMALL_STRING_BUFFER_SIZE> backward(bestVerDir);
    llvm::sys::path::append(backward, "backward");
    if (llvm::sys::fs::is_directory(backward)) {
        out.emplace_back("-isystem");
        out.emplace_back(backward.str().str());
    }
    return true;
}

static void collectHostLinuxFallbackPrefix(std::vector<std::string> &prefix,
                                           const std::vector<std::string> &manifestIncludeDirs,
                                           bool addResourceDir)
{
    if (ManifestUsesOhLibcxx(manifestIncludeDirs)) {
        return;
    }
    if (addResourceDir) {
        std::string res = QueryClangPrintResourceDirOnce();
        if (!res.empty()) {
            prefix.emplace_back("-resource-dir");
            prefix.emplace_back(std::move(res));
        }
    }
    // Do not add GCC's lib/gcc/.../include or include-fixed: those headers target g++ and pull
    // xmmintrin.h with __builtin_ia32_* that Clang does not accept. Use Clang's -resource-dir
    // for intrinsics + libstdc++ /usr/include below.
    appendLibstdcxxIncludeDirs(prefix);
    static constexpr const char *kUsrIncludes[] = {"/usr/include/x86_64-linux-gnu",
                                                   "/usr/include/aarch64-linux-gnu", "/usr/include"};
    for (const char *p : kUsrIncludes) {
        if (llvm::sys::fs::is_directory(p)) {
            prefix.emplace_back("-isystem");
            prefix.emplace_back(p);
        }
    }
}

#endif // __linux__

} // namespace

std::string GetBuildPathFromArgv(int argc, const char **argv)
{
    for (int i = ZERO; i + ONE < argc; ++i) {
        if (std::strcmp(argv[i], "-p") == 0) {
            return std::string(argv[i + ONE]);
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

    llvm::SmallString<STRING_BUFFER_SIZE> CC(BuildPath);
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
    // Language standard only here. OH SDK + manifest libc++ replay adds -stdlib=libc++ in
    // prependResourceDirAndManifestIncludes / prependOhSdkHeaderCompileFlags to avoid mixing
    // libc++ with host GCC libstdc++ on Linux LibTooling.
    std::vector<std::string> prefix;
    if (sourceFile.ends_with(".c")) {
        prefix.emplace_back("-std=c99");
    } else if (sourceFile.ends_with(".cc") || sourceFile.ends_with(".cpp") ||
               sourceFile.ends_with(".cxx") || sourceFile.ends_with(".h") ||
               sourceFile.ends_with(".hpp") || sourceFile.ends_with(".hh")) {
        prefix.emplace_back("-std=c++" + std::to_string(CXX_VERSION_17));
    }
#if defined(__APPLE__) && defined(__MACH__)
    if (!sourceFile.ends_with(".c")) {
        prefix.emplace_back("-stdlib=libc++");
    }
#endif
    if (!prefix.empty()) {
        Tool.appendArgumentsAdjuster(getInsertArgumentAdjuster(prefix, ArgumentInsertPosition::BEGIN));
    }
}

void prependResourceDirAndManifestIncludes(ClangTool &Tool,
                                           const std::vector<std::string> &manifestIncludeDirs)
{
    Tool.appendArgumentsAdjuster(
        [manifestIncludeDirs](const CommandLineArguments &Args, llvm::StringRef) -> CommandLineArguments {
            const bool ohLibcxx = ManifestUsesOhLibcxx(manifestIncludeDirs);
            CommandLineArguments R;
            std::string llvmRoot;
            for (const auto &A : Args) {
                llvm::StringRef S(A);
                if (refHasPrefix(S, "--gcc-toolchain=")) {
                    llvmRoot = S.drop_front(std::strlen("--gcc-toolchain=")).str();
                    break;
                }
            }
            if (!llvmRoot.empty()) {
                if (auto rd = DetectClangResourceDir(llvmRoot)) {
                    R.emplace_back("-resource-dir");
                    R.emplace_back(*rd);
                }
            }
            if (ohLibcxx && !ArgsSpecifyStdlib(Args)) {
                R.emplace_back("-stdlib=libc++");
            }
            for (const std::string &inc : manifestIncludeDirs) {
                if (!inc.empty()) {
                    R.emplace_back("-I");
                    R.emplace_back(inc);
                }
            }
            for (const auto &A : Args) {
                if (ohLibcxx && refHasPrefix(llvm::StringRef(A), "--gcc-toolchain=")) {
                    continue;
                }
                R.emplace_back(A);
            }
            return R;
        });
}

void prependResourceDirFromManifestIncludes(std::vector<std::string> &compileArgs,
                                            const std::vector<std::string> &manifestIncludeDirs)
{
    for (const std::string &inc : manifestIncludeDirs) {
        llvm::StringRef P(inc);
        if (!P.contains("include/c++/v1")) {
            continue;
        }
        std::string s = inc;
        const std::string kSuffix = "include/c++/v1";
        const size_t pos = s.rfind(kSuffix);
        if (pos == std::string::npos) {
            continue;
        }
        std::string root = s.substr(0, pos);
        while (!root.empty() && (root.back() == '/' || root.back() == '\\')) {
            root.pop_back();
        }
        if (auto rd = DetectClangResourceDir(root)) {
            compileArgs.insert(compileArgs.begin(), *rd);
            compileArgs.insert(compileArgs.begin(), "-resource-dir");
        }
        break;
    }
}

void prependOhSdkHeaderCompileFlags(std::vector<std::string> &compileArgs,
                                    const std::vector<std::string> &manifestIncludeDirs)
{
    prependResourceDirFromManifestIncludes(compileArgs, manifestIncludeDirs);
    if (!ManifestUsesOhLibcxx(manifestIncludeDirs)) {
        return;
    }
    auto pos = compileArgs.begin();
    if (compileArgs.size() >= TWO && compileArgs[ZERO] == "-resource-dir") {
        pos = compileArgs.begin() + TWO;
    }
    compileArgs.insert(pos, "-stdlib=libc++");
}

#if defined(__linux__)
static bool isGccToolchainIntrinsicIncludePath(llvm::StringRef p)
{
    return p.contains("/lib/gcc/") &&
           (refHasSuffix(p, "/include") || refHasSuffix(p, "/include-fixed"));
}

/** Drop -I/-isystem pointing at GCC's lib/gcc/.../{include,include-fixed}: those headers use g++
 * builtins that Clang rejects; Clang should use its own resource-dir SIMD/intrinsic headers.
 */
static void appendArgsWithoutGccIntrinsicIncludes(CommandLineArguments &R, const CommandLineArguments &Args)
{
    for (size_t i = ZERO; i < Args.size(); ++i) {
        if (i + ONE < Args.size() && (Args[i] == "-I" || Args[i] == "-isystem")) {
            if (isGccToolchainIntrinsicIncludePath(Args[i + ONE])) {
                ++i;
                continue;
            }
        }
        llvm::StringRef a = Args[i];
        if (refHasPrefix(a, "-I") && a.size() > TWO) {
            if (isGccToolchainIntrinsicIncludePath(a.drop_front(TWO))) {
                continue;
            }
        } else if (refHasPrefix(a, "-isystem")) {
            llvm::StringRef rest = a.drop_front(strlen("-isystem"));
            (void)rest.consume_front("=");
            if (!rest.empty() && isGccToolchainIntrinsicIncludePath(rest)) {
                continue;
            }
        }
        R.push_back(Args[i]);
    }
}
#endif

void appendHostLinuxFallbackSystemIncludes(std::vector<std::string> &compileArgs,
                                           const std::vector<std::string> &manifestIncludeDirs)
{
#if defined(__linux__)
    std::vector<std::string> prefix;
    collectHostLinuxFallbackPrefix(prefix, manifestIncludeDirs, true);
    compileArgs.insert(compileArgs.begin(), prefix.begin(), prefix.end());
#else
    (void)compileArgs;
    (void)manifestIncludeDirs;
#endif
}

void prependHostLinuxFallbackToClangTool(ClangTool &Tool,
                                         const std::vector<std::string> &manifestIncludeDirs)
{
#if defined(__linux__)
    if (ManifestUsesOhLibcxx(manifestIncludeDirs)) {
        return;
    }
    Tool.appendArgumentsAdjuster(
        [manifestIncludeDirs](const CommandLineArguments &Args, llvm::StringRef) -> CommandLineArguments {
            bool hasResourceDir = false;
            for (size_t i = ZERO; i < Args.size(); ++i) {
                if (Args[i] == "-resource-dir") {
                    hasResourceDir = true;
                    break;
                }
            }
            std::vector<std::string> prefix;
            collectHostLinuxFallbackPrefix(prefix, manifestIncludeDirs, !hasResourceDir);
            CommandLineArguments R;
            R.reserve(prefix.size() + Args.size());
            R.insert(R.end(), prefix.begin(), prefix.end());
            appendArgsWithoutGccIntrinsicIncludes(R, Args);
            return R;
        });
#else
    (void)Tool;
    (void)manifestIncludeDirs;
#endif
}

} // namespace ast_dumper
