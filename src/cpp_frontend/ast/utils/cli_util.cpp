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

#include "cli_util.h"
#include "json.hpp"
#include "utils_string.h"
#include <fstream>
#include <iostream>
#include <filesystem>
#include <sstream>
#include <cstdlib>
#include <cctype>
#include <clang-c/Index.h>

using json = nlohmann::json;
namespace fs = std::filesystem;
#define FOUR 4
#define THREE 3
#define TWO 2

// Normalize a Windows drive path.
// Example: "?C:\Users\xxx\file.cpp" → "C:\Users\xxx\file.cpp"
// "\\?\C:\Users\xxx\file.cpp" → "C:\Users\xxx\file.cpp"
static std::string ExtractFirstDrivePath(std::string_view s)
{
#ifdef _WIN32
    // Case 1: Extended-length device prefix "\\?\" at the beginning
    // Example: "\\?\C:\path\to\file.cpp" → "C:\path\to\file.cpp"
    // Case 2: Alternate prefix "\?\" at the beginning
    // Example: "\?\C:\path\to\file.cpp" → "C:\path\to\file.cpp"
    if (s.rfind("\\\\?\\", 0) == 0) {
        s.remove_prefix(FOUR);
    } else if (s.size() >= THREE && s[0] == '\\' && s[1] == '?' &&
             (s[TWO] == '\\' || s[TWO] == '/')) {
        s.remove_prefix(THREE);
    }
#endif
    // Scan the string to find the first valid drive anchor: "<Letter>:\"
    // Conditions:
    //   - One alphabet character [A-Za-z]
    //   - Followed by a colon ':'
    //   - Followed by either '\' or '/'
    for (size_t i = 0; i + TWO < s.size(); ++i) {
        char c = s[i];
        if (std::isalpha(static_cast<unsigned char>(c)) &&
            s[i + 1] == ':' &&
            (s[i + TWO] == '\\' || s[i + TWO] == '/')) {
            // Return substring starting from the detected drive letter
            return std::string(s.substr(i));
        }
    }
    // Fallback: no drive anchor found → return input unchanged
    return std::string(s);
}

static std::string Slashify(std::string s)
{
    for (auto& ch : s) {
        if (ch == '\\') {
            ch = '/';
        }
    }
    return s;
}
#ifdef _WIN32
std::string Lower(std::string s)
{
    std::transform(s.begin(), s.end(), s.begin(),
                   [](unsigned char c) { return (char)std::tolower(c); });
    return s;
}
#else
std::string Lower(std::string s) { return s; }
#endif

fs::path CanonicalOr(const fs::path& p)
{
    std::error_code ec;
    fs::path r = fs::weakly_canonical(p, ec);
    if (ec) {
        r = p;
    }
    return r;
}

std::string NormalizePath(const std::string& p)
{
    auto c = CanonicalOr(fs::path(p)).string();
    return Lower(Slashify(c));
}

bool EndsWith(const std::string& s, const char* suf)
{
    const size_t n = std::strlen(suf);
    return s.size() >= n && s.compare(s.size() - n, n, suf) == 0;
}

bool IsCompilerExecutable(std::string arg)
{
    for (auto& ch : arg) {
        ch = (char)std::tolower((unsigned char)ch);
    }
    return EndsWith(arg, "clang.exe") || EndsWith(arg, "clang++.exe") ||
           EndsWith(arg, "clang-cl.exe") || EndsWith(arg, "clang") || EndsWith(arg, "clang++") ||
           EndsWith(arg, "clang-cl") || EndsWith(arg, "clang_~1.exe") || EndsWith(arg, "cl.exe") || EndsWith(arg, "cl");
}

// Shell-like split: supports quotes, \" and \<space>.
std::vector<std::string> SplitCommandLine(const std::string& cmd)
{
    std::vector<std::string> out;
    std::string cur;
    bool inQuotes = false;
    bool isSkip = false;
    for (size_t i = 0; i < cmd.size(); ++i) {
        if (isSkip) {
            isSkip = false;
            continue;
        }
        char ch = cmd[i];
        // --- handle escape ---
        if (ch == '\\') {
            if (i + 1 >= cmd.size()) {
                // last char is '\'
                cur.push_back(ch);
                continue;
            }
            char nxt = cmd[i + 1];
            if (nxt == '"' || nxt == '\\' || nxt == ' ') {
                cur.push_back(nxt);
                isSkip = true;
                continue;
            }
            cur.push_back(ch);
            continue;
        }
        // --- handle quotes ---
        if (ch == '"') {
            inQuotes = !inQuotes;
            continue;
        }
        // --- handle space outside quotes ---
        if (std::isspace(static_cast<unsigned char>(ch)) && !inQuotes) {
            if (!cur.empty()) {
                out.push_back(std::move(cur));
                cur.clear();
            }
            continue;
        }
        // --- default case ---
        cur.push_back(ch);
    }
    if (!cur.empty()) {
        out.push_back(std::move(cur));
    }
    return out;
}


void BuildCStrArgs(ClangArgs& a)
{
    a.cstrArgs.clear();
    a.cstrArgs.reserve(a.strArgs.size());
    for (auto& s : a.strArgs) {
        a.cstrArgs.push_back(s.c_str());
    }
}

bool LoadCompileCommandsJSON(const std::string& path, json& out)
{
    std::ifstream f(path);
    if (!f.is_open()) {
        std::cerr << "Failed to open compile_commands.json: " << path << "\n";
        return false;
    }
    try { f >> out; }
    catch (const json::exception& e) {
        std::cerr << "JSON parse error: " << e.what() << "\n";
        return false;
    }
    return true;
}

const json* FindMatchingEntry(const json& ccjson, const std::string& inputFile)
{
    const std::string inputNorm = NormalizePath(inputFile);
    for (const auto& entry : ccjson) {
        if (!entry.contains("file")) {
            continue;
        }
        std::string fileField = "";
        try { fileField = entry["file"].get<std::string>(); } catch (...) { continue; }
        if (NormalizePath(fileField) == inputNorm) {
            return &entry;
        }
    }
    return nullptr;
}

std::string ExtractWorkDir(const json& entry)
{
    if (!entry.contains("directory")) {
        return {};
    }
    try { return Slashify(entry["directory"].get<std::string>()); }
    catch (...) { return {}; }
}

std::vector<std::string> BuildArgvFromEntry(const json& entry)
{
    std::vector<std::string> argv;
    if (entry.contains("arguments")) {
        try { for (const auto& a : entry["arguments"]) argv.push_back(a.get<std::string>()); }
        catch (...) { argv.clear(); }
    }
    if (argv.empty() && entry.contains("command")) {
        try { argv = SplitCommandLine(entry["command"].get<std::string>()); }
        catch (...) { argv.clear(); }
    }
    if (argv.empty()) {
        std::cerr << "compile_commands.json has neither valid 'arguments' nor 'command'\n";
    }
    return argv;
}

bool StartsWithAny(const std::string& s, std::initializer_list<const char*> ps)
{
    for (auto p : ps) {
        const size_t n = std::strlen(p);
        if (s.size() >= n && s.compare(0, n, p) == 0) {
            return true;
        }
    }
    return false;
}

struct NormalizeArgs {
    bool skipNext = false;
    bool pendingX = false;
    bool stdTwoPart = false;
    bool stopAfterDD = false;
    bool hasLang = false;
    bool hasStd = false;
};

bool IsFilterArgs(std::string arg, NormalizeArgs& normalizeArgs, std::string entryNorm, std::string inputNorm, int i)
{
    if (normalizeArgs.stopAfterDD) {
        return true;
    }
    if (normalizeArgs.skipNext) {
        normalizeArgs.skipNext = false;
        return true;
    }
    if (i == 0 && IsCompilerExecutable(arg)) {
        return true;
    }
    const std::string norm = NormalizePath(arg);
    if (norm == entryNorm || norm == inputNorm) {
        return true;
    }
    if (arg == "--") {
        normalizeArgs.stopAfterDD = true;
        return true;
    }
    if (arg == "-x") {
        normalizeArgs.pendingX = true;
        return true;
    }
    return false;
}

bool IsNormalizeArgs(std::string arg, NormalizeArgs& normalizeArgs, std::vector<std::string>& outArgs)
{
    if (normalizeArgs.pendingX) {
        outArgs.push_back(std::string("-x") + arg);
        normalizeArgs.hasLang = true;
        normalizeArgs.pendingX = false;
        return true;
    }
    if (arg == "-std") {
        normalizeArgs.stdTwoPart = true;
        return true;
    }
    if (normalizeArgs.stdTwoPart) {
        outArgs.push_back(std::string("-std=") + arg);
        normalizeArgs.hasStd = true;
        normalizeArgs.stdTwoPart = false;
        return true;
    }
    if (arg.rfind("-std=", 0) == 0) {
        normalizeArgs.hasStd = true;
        outArgs.push_back(std::move(arg));
        return true;
    }
    if (arg == "-xc" || arg == "-xc++" || arg == "-xc-header" || arg == "-xc++-header") {
        normalizeArgs.hasLang = true;
        outArgs.push_back(std::move(arg));
        return true;
    }
    auto dropSingleOpt = [](const std::string& s) {
        return (s == "-c" || s == "-shared" || s == "-fPIC");
    };
    if (dropSingleOpt(arg)) {
        return true;
    }
    auto eatsNextArg = [](const std::string& s) {
        return (s == "-o" || s == "-c" || s == "-MF" || s == "-MT" || s == "-MQ" ||
                s == "--sysroot" || s == "-isysroot" || s == "-include" || s == "-imacros");
    };
    if (eatsNextArg(arg)) {
        normalizeArgs.skipNext = true;
        return true;
    }
    if (StartsWithAny(arg, {"-o", "-MF", "-MT", "-MQ", "-c"})) {
        return true;
    }
    return false;
}

namespace {
enum class EffectiveLang { C, CXX, UNKNOWN };

constexpr const char* K_DEFAULT_C_STD   = "-std=c99";
constexpr const char* K_DEFAULT_CXX_STD = "-std=c++17";

void NormalizeStdFlags(std::vector<std::string>& outArgs, EffectiveLang lang)
{
    auto hasArg = [&outArgs](const auto& pred) -> bool {
        return std::any_of(outArgs.begin(), outArgs.end(), pred);
    };
    auto removeIfPred = [&outArgs](const auto& pred) {
        outArgs.erase(std::remove_if(outArgs.begin(), outArgs.end(), pred), outArgs.end());
    };

    auto isStdAny = [](const std::string& s) { return s.rfind("-std=", 0) == 0; };
    auto isStdCXX = [](const std::string& s) { return s.rfind("-std=c++", 0) == 0; };
    auto isStdC   = [](const std::string& s) {
        return s.rfind("-std=c", 0) == 0 && s.rfind("-std=c++", 0) != 0;
    };

    const bool hadStdAtEntry = hasArg(isStdAny);

    if (lang == EffectiveLang::C) {
        removeIfPred(isStdCXX);
        if (!hasArg(isStdAny)) outArgs.push_back(K_DEFAULT_C_STD);
    } else if (lang == EffectiveLang::CXX) {
        removeIfPred(isStdC);
        if (!hasArg(isStdAny)) outArgs.push_back(K_DEFAULT_CXX_STD);
    } else {
        if (!hadStdAtEntry && !hasArg(isStdAny)) outArgs.push_back(K_DEFAULT_CXX_STD);
    }
}
} // namespace

// Normalize and filter compiler arguments coming from compile_commands.json.
void FilterAndNormalizeArgs(const std::vector<std::string>& argv,
                            const std::string& entryFile,
                            const std::string& inputFile,
                            std::vector<std::string>& outArgs)
{
    const std::string entryNorm = NormalizePath(entryFile);
    const std::string inputNorm = NormalizePath(inputFile);

    NormalizeArgs normalizeArgs;
    for (size_t i = 0; i < argv.size(); ++i) {
        std::string arg = argv[i];
        // Skip empty tokens; drop tool/exe, current file path, `--` tail, and
        // consume stateful options (`-x` next, etc.). Also normalize things like
        // two-part `-std c++17` -> `-std=c++17`. If any of those handlers
        // processed this `arg`, continue to next token.
        if (arg.empty() || IsFilterArgs(arg, normalizeArgs, entryNorm, inputNorm, static_cast<int>(i)) ||
            IsNormalizeArgs(arg, normalizeArgs, outArgs)) {
            continue;
        }
        // Pass-through: anything not filtered/normalized is forwarded as-is.
        outArgs.push_back(std::move(arg));
    }
    // ---------------------------
    // Language fallback (preserve original policy):
    //   - `.c`          => C (`-xc`)
    //   - `.h`/`.hpp`…  => C++ header (`-xc++-header`)
    //   - otherwise     => C++ (`-xc++`)
    // ---------------------------
    if (!normalizeArgs.hasLang) {
        fs::path p(entryFile);
        std::string ext = p.extension().string();
        std::transform(ext.begin(), ext.end(), ext.begin(), [](unsigned char c) { return (char)std::tolower(c); });
        const bool isHeader = (ext == ".h" || ext == ".hh" || ext == ".hpp" || ext == ".hxx");
        outArgs.push_back(isHeader ? "-xc++-header" : (ext == ".c" ? "-xc" : "-xc++"));
    }
    // ---------------------------
    // Standard fallback and cleanup:
    //   - Decide the effective language (prefer explicit `-x`, else infer).
    //   - Remove mismatched `-std=` flags (e.g., drop `-std=c++17` under C).
    //   - If no `-std=` remains, add a language-appropriate default.
    // ---------------------------
    // Helpers
    auto hasArg = [&outArgs](auto pred) {
        return std::any_of(outArgs.begin(), outArgs.end(), pred);
    };
    auto removeIfPred = [&outArgs](const auto& pred) {
        outArgs.erase(std::remove_if(outArgs.begin(), outArgs.end(), pred), outArgs.end());
    };
    // Any -std=...
    auto isStdAny = [](const std::string& s) {
        return s.rfind("-std=", 0) == 0;
    };
    // C++ standards: -std=c++11/14/17/20/23/...
    auto isStdCXX = [](const std::string& s) {
        return s.rfind("-std=c++", 0) == 0;
    };
    // C standards: -std=c89/c90/c99/c11/... (but NOT c++)
    auto isStdC   = [](const std::string& s) {
        if (s.rfind("-std=c", 0) != 0) {
            return false;
        }
        return s.rfind("-std=c++", 0) != 0; // exctd::any_of(outArgs.begin(), outArgs.lude c++
    };

    // Determine effective language:
    // prefer explicit `-x` flags; if absent, infer from file extension
    bool isCFlag = hasArg([](const std::string& s) { return s == "-xc" || s == "-x c"; });
    bool isCXXFlag = hasArg([](const std::string& s) { return s == "-xc++" || s == "-x c++"; });
    bool isCHeader = hasArg([](const std::string& s) { return s == "-xc-header"; });
    bool isCXXHeader = hasArg([](const std::string& s) { return s == "-xc++-header"; });
    EffectiveLang lang = EffectiveLang::UNKNOWN;
    if (isCFlag || isCHeader) {
        lang = EffectiveLang::C;
    } else if (isCXXFlag || isCXXHeader) {
        lang = EffectiveLang::CXX;
    }
    NormalizeStdFlags(outArgs, lang);
}


void MaybeAddSourceDirInclude(const std::string& entryFile, std::vector<std::string>& outArgs)
{
    fs::path p = CanonicalOr(fs::path(entryFile));
    std::string dir = Slashify(p.parent_path().string());
    if (!dir.empty()) {
        outArgs.push_back("-I"+dir);
    }
}

CommandLineOptions cliutil::ParseCommandLineArgs(int argc, char** argv)
{
    CommandLineOptions opts;
    bool isSkip = false;
    for (int i = 1; i < argc; ++i) {
        if (isSkip) {
            isSkip = false;
            continue;
        }
        std::string arg = argv[i];
        if (arg == "-o" && i + 1 < argc) {
            isSkip = true;
            opts.outputFile = argv[i + 1];
        } else if (arg == "-c" && i + 1 < argc) {
            isSkip = true;
            opts.compileCommandsFile = argv[i + 1];
        } else if (arg == "-i" && i + 1 < argc) {
            isSkip = true;
            opts.userIncludeDirs.push_back(argv[i + 1]);
        } else if (arg == "-f") {
            isSkip = true;
            opts.flag = argv[i + 1];
        } else if (opts.inputFile.empty()) {
            opts.inputFile = arg;
        }
    }
    return opts;
}

void cliutil::AddMainFileDirToInclude(CommandLineOptions& opts)
{
    if (opts.inputFile.empty()) {
        return;
    }
    const std::string mainDir = std::filesystem::absolute(opts.inputFile).parent_path().string();
    const auto absDir = std::filesystem::absolute(mainDir);
    const bool dirExists = std::filesystem::exists(absDir);
    bool found = false;
    for (const auto& dir : opts.userIncludeDirs) {
        const auto absMainDir = std::filesystem::absolute(dir);
        const bool mainDirExists = std::filesystem::exists(absMainDir);
        // If any of them do not exist: print debugging information and continue to the next directory (guard statement)
        if (!(dirExists && mainDirExists)) {
            std::cout << "[DEBUG] Does absDir exist?       " << (dirExists ? "YES" : "NO") << std::endl;
            std::cout << "[DEBUG] Does absMainDir exist?  " << (mainDirExists ? "YES" : "NO") << std::endl;
            continue;
        }
        try {
            if (std::filesystem::equivalent(absDir, absMainDir)) {
                found = true;
                break;
            }
        } catch (const std::exception& e) {
            std::cerr << "Caught std::exception in equivalent(): " << e.what() << std::endl;
        }
    }
    std::cout << "[DEBUG] Included Path Comparison Finished" << std::endl;
    if (!found) {
        opts.userIncludeDirs.push_back(mainDir);
    }
}


bool cliutil::ValidateInput(CommandLineOptions& opts)
{
    if (opts.inputFile.empty()) {
        std::cerr << "Error: No input file provided.\n";
        return false;
    }
    if (opts.outputFile.empty()) {
        size_t lastDot = opts.inputFile.find_last_of('.');
        std::string filename = (lastDot != std::string::npos) ? opts.inputFile.substr(0, lastDot) : opts.inputFile;
        opts.outputFile = filename + ".json";
    }
    return true;
}

void cliutil::PrintUsage(const char* progName)
{
    std::cerr << "Usage: " << progName <<
    " <file.cpp> [-o <output.json>] [-c <compile_commands.json>] [-i <include_dir> ...]\n";
}

bool cliutil::HasSuffix(const std::string& str, const std::string& suffix)
{
    if (suffix.size() > str.size()) {
        return false;
    }
    return str.compare(str.size() - suffix.size(), suffix.size(), suffix) == 0;
}

ClangArgs cliutil::PrepareClangArgs(const CommandLineOptions& opts)
{
    ClangArgs res;
    // Select standard
    if (HasSuffix(opts.inputFile, ".c")) {
        res.strArgs.push_back("-std=c99");
    } else {
        res.strArgs.push_back("-xc++");
        res.strArgs.push_back("-std=c++17");
    }
    res.strArgs.push_back("-stdlib=libc++");

    // Add user include
    for (const auto& dir : opts.userIncludeDirs) {
        res.strArgs.push_back("-I" + dir);
    }
    // Convert string to c_str pointer
    for (const auto& arg : res.strArgs) {
        res.cstrArgs.push_back(arg.c_str());
    }
    return res;
}

ClangArgs cliutil::LoadCompileCommands(const CommandLineOptions& opts)
{
    ClangArgs result;

    json ccjson;
    if (!LoadCompileCommandsJSON(opts.compileCommandsFile, ccjson)) {
        result = cliutil::PrepareClangArgs(opts);
        return result;
    }
    const json* hit = FindMatchingEntry(ccjson, opts.inputFile);
    if (!hit) {
        std::cerr << "No matching file in compile_commands.json: " << opts.inputFile << "\n";
        result = cliutil::PrepareClangArgs(opts);
        return result;
    }
    const std::string workdir = ExtractWorkDir(*hit);
    if (!workdir.empty()) {
        result.strArgs.push_back(std::string("-working-directory=") + workdir);
    }
    const std::vector<std::string> argv = BuildArgvFromEntry(*hit);
    if (argv.empty()) {
        BuildCStrArgs(result);
        return result;
    }
    const std::string entryFile = (*hit)["file"].get<std::string>();

    // Filter & normalize
    std::vector<std::string> filtered;
    // Reserve space for argv plus up to 4 extra fallback arguments (-x, -std, -I, etc.)
    filtered.reserve(argv.size() + FOUR);
    FilterAndNormalizeArgs(argv, entryFile, opts.inputFile, filtered);

    // Optional: add source dir include
    MaybeAddSourceDirInclude(entryFile, filtered);

    // Assemble final args
    result.strArgs.insert(result.strArgs.end(),
                          std::make_move_iterator(filtered.begin()),
                          std::make_move_iterator(filtered.end()));
    BuildCStrArgs(result);
    return result;
}

ClangArgs cliutil::GetClangArgs(const CommandLineOptions& opts)
{
    ClangArgs clangArgs;
    if (!opts.compileCommandsFile.empty()) {
        clangArgs = cliutil::LoadCompileCommands(opts);
    } else {
        clangArgs = cliutil::PrepareClangArgs(opts);
    }
    return clangArgs;
}

// ======================= TU flags parsing =========================
// Internal helpers live in an anonymous namespace to avoid ODR/symbol clashes.
namespace {
    // Lowercase ASCII safely (cross-platform)
    inline std::string ToLowerAscii(std::string s)
    {
        for (char& c : s) {
            c = (char)std::tolower((unsigned char)c);
        }
        return s;
    }

    inline std::string TrimAscii(const std::string& s)
    {
        size_t b = s.find_first_not_of(" \t\r\n");
        if (b == std::string::npos) {
            return {};
        }
        size_t e = s.find_last_not_of(" \t\r\n");
        return s.substr(b, e - b + 1);
    }

    // Split by ',', '|' or whitespace.
    std::vector<std::string> TokenizeFlags(const std::string& raw)
    {
        std::string s = raw;
        for (char& ch : s) {
            if (ch == ',' || ch == '|') {
                ch = ' ';
            }
        }
        std::istringstream iss(s);
        std::vector<std::string> toks;
        std::string t;
        while (iss >> t) {
            toks.push_back(std::move(t));
        }
        return toks;
    }

    // Map tokens -> CXTranslationUnit_* bit flags.
    // Add aliases freely; matching is case-insensitive.
    unsigned ParseTUFlags(const std::string& flagStrRaw)
    {
        if (flagStrRaw.empty()) {
            return 0u;
        }
        const auto toks = TokenizeFlags(flagStrRaw);
        struct Map { const char* k; unsigned v; };
        static const Map kMap[] = {
            {"cxtranslationunit_detailedpreprocessingrecord", CXTranslationUnit_DetailedPreprocessingRecord},
            {"detailedpreprocessingrecord",                   CXTranslationUnit_DetailedPreprocessingRecord},
            {"dpp",                                           CXTranslationUnit_DetailedPreprocessingRecord},

            {"cxtranslationunit_incomplete",                  CXTranslationUnit_Incomplete},
            {"incomplete",                                    CXTranslationUnit_Incomplete},

            {"cxtranslationunit_precompiledpreamble",         CXTranslationUnit_PrecompiledPreamble},
            {"precompiledpreamble",                           CXTranslationUnit_PrecompiledPreamble},
            {"preamble",                                      CXTranslationUnit_PrecompiledPreamble},

            {"cxtranslationunit_cachecompletionresults",      CXTranslationUnit_CacheCompletionResults},
            {"cachecompletionresults",                        CXTranslationUnit_CacheCompletionResults},

            {"cxtranslationunit_forserialization",            CXTranslationUnit_ForSerialization},
            {"forserialization",                              CXTranslationUnit_ForSerialization},

            {"cxtranslationunit_cxxchainedpch",               CXTranslationUnit_CXXChainedPCH},
            {"cxxchainedpch",                                 CXTranslationUnit_CXXChainedPCH},

            {"cxtranslationunit_skipfunctionbodies",          CXTranslationUnit_SkipFunctionBodies},
            {"skipfunctionbodies",                            CXTranslationUnit_SkipFunctionBodies},
            {"skipfuncbodies",                                CXTranslationUnit_SkipFunctionBodies},

            {"cxtranslationunit_includebriefcommentsincodecompletion",
             CXTranslationUnit_IncludeBriefCommentsInCodeCompletion},
            {"includebriefcommentsincodecompletion",
             CXTranslationUnit_IncludeBriefCommentsInCodeCompletion},
            {"briefcomments",                                 CXTranslationUnit_IncludeBriefCommentsInCodeCompletion},

            {"cxtranslationunit_keepgoing",                   CXTranslationUnit_KeepGoing},
            {"keepgoing",                                     CXTranslationUnit_KeepGoing},

            {"cxtranslationunit_singlefileparse",             CXTranslationUnit_SingleFileParse},
            {"singlefileparse",                               CXTranslationUnit_SingleFileParse},
        };
        unsigned out = 0u;
        for (auto t : toks) {
            const auto key = ToLowerAscii(TrimAscii(t));
            bool matched = false;
            for (const auto& m : kMap) {
                if (key == m.k) {
                    out |= m.v;
                    matched = true;
                    break;
                }
            }
        }
        return out;
    }
} // namespace

// Debug helper: pretty-print TU flags
static void PrintTUFlags(unsigned flags)
{
    struct FlagInfo {
        unsigned bit;
        const char* name;
    };
    static const FlagInfo kFlags[] = {
        {CXTranslationUnit_KeepGoing, "KeepGoing"},
        {CXTranslationUnit_DetailedPreprocessingRecord, "DetailedPreprocessingRecord"},
        {CXTranslationUnit_Incomplete, "Incomplete"},
        {CXTranslationUnit_PrecompiledPreamble, "PrecompiledPreamble"},
        {CXTranslationUnit_CacheCompletionResults, "CacheCompletionResults"},
        {CXTranslationUnit_ForSerialization, "ForSerialization"},
        {CXTranslationUnit_CXXChainedPCH, "CXXChainedPCH"},
        {CXTranslationUnit_SkipFunctionBodies, "SkipFunctionBodies"},
        {CXTranslationUnit_IncludeBriefCommentsInCodeCompletion, "IncludeBriefCommentsInCodeCompletion"},
        {CXTranslationUnit_SingleFileParse, "SingleFileParse"},
    };
    std::cout << "[DEBUG] CXTranslationUnit flags = " << flags << " { ";
    for (const auto& f : kFlags) {
        if (flags & f.bit) {
            std::cout << f.name << " ";
        }
    }
    std::cout << "}" << std::endl;
}

// Public API: build final TU flags for clang_parseTranslationUnit.
// Always includes CXTranslationUnit_KeepGoing; ORs in any tokens from opts.flag.
unsigned cliutil::BuildTUFlags(const CommandLineOptions& opts)
{
    unsigned flags = CXTranslationUnit_KeepGoing;
    if (!opts.flag.empty()) {
        flags |= ParseTUFlags(opts.flag);
    }
    PrintTUFlags(flags);
    return flags;
}
