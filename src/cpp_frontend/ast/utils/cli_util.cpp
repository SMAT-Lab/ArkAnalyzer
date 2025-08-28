/*
 * Copyright (c) 2024 Huawei Device Co., Ltd.
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
           EndsWith(arg, "clang-cl") || EndsWith(arg, "clang_~1.exe");
}

// Shell-like split: supports quotes, \" and \<space>.
std::vector<std::string> SplitCommandLine(const std::string& cmd)
{
    std::vector<std::string> out;
    std::string cur;
    bool inQuotes = false;
    for (size_t i = 0; i < cmd.size(); ++i) {
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
                i = i + 1;
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

void FilterAndNormalizeArgs(const std::vector<std::string>& argv,
                            const std::string& entryFile,
                            const std::string& inputFile,
                            std::vector<std::string>& outArgs)
{
    const std::string entryNorm = NormalizePath(entryFile);
    const std::string inputNorm = NormalizePath(inputFile);

    bool skipNext = false;
    bool pendingX = false;
    bool stdTwoPart = false;
    bool stopAfterDD = false;
    bool hasLang = false;
    bool hasStd = false;

    auto EatsNextArg = [](const std::string& s) {
        return (s == "-o" || s == "-c" || s == "-MF" || s == "-MT" || s == "-MQ" ||
                s == "--sysroot" || s == "-isysroot" || s == "-include" || s == "-imacros");
    };

    auto DropSingleOpt = [](const std::string& s) {
        return (s == "-c" || s == "-shared" || s == "-fPIC");
    };

    for (size_t i = 0; i < argv.size(); ++i) {
        std::string arg = argv[i];
        const std::string norm = NormalizePath(arg);
        if (arg.empty() || stopAfterDD || (i == 0 && IsCompilerExecutable(arg)) || DropSingleOpt(arg) ||
            StartsWithAny(arg, {"-o", "-MF", "-MT", "-MQ", "-c"}) || norm == entryNorm || norm == inputNorm) {
            continue;
        }
        if (skipNext) {
            skipNext = false;
            continue;
        }
        if (arg == "--") {
            stopAfterDD = true;
            continue;
        }
        if (arg == "-x") {
            pendingX = true;
            continue;
        }
        if (pendingX) {
            outArgs.push_back(std::string("-x") + arg);
            hasLang = true;
            pendingX = false;
            continue;
        }

        if (arg == "-std") {
            stdTwoPart = true;
            continue;
        }
        if (stdTwoPart) {
            outArgs.push_back(std::string("-std=") + arg);
            hasStd = true;
            stdTwoPart = false;
            continue;
        }
        if (arg.rfind("-std=", 0) == 0) {
            hasStd = true;
            outArgs.push_back(std::move(arg));
            continue;
        }
        if (arg == "-xc" || arg == "-xc++" || arg == "-xc-header" || arg == "-xc++-header") {
            hasLang = true;
            outArgs.push_back(std::move(arg));
            continue;
        }
        outArgs.push_back(std::move(arg));
    }

    // Fallbacks
    if (!hasLang) {
        fs::path p(entryFile);
        std::string ext = p.extension().string();
        std::transform(ext.begin(), ext.end(), ext.begin(), [](unsigned char c) {
            return (char)std::tolower(c);
        });
        const bool isHeader = (ext==".h" || ext==".hh" || ext==".hpp" || ext==".hxx");
        outArgs.push_back(isHeader? "-xc++-header" : (ext==".c"? "-xc" : "-xc++"));
    }
    if (!hasStd) {
        outArgs.push_back("-std=c++17");
    }
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
    for (int i = 1; i < argc; ++i) {
        std::string arg = argv[i];
        if (arg == "-o" && i + 1 < argc) {
            i = i + 1;
            opts.outputFile = argv[i];
        } else if (arg == "-c" && i + 1 < argc) {
            i = i + 1;
            opts.compileCommandsFile = argv[i];
        } else if (arg == "-i" && i + 1 < argc) {
            i = i + 1;
            opts.userIncludeDirs.push_back(argv[i]);
        } else if (arg == "-f") {
            opts.flag = argv[++i];
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

ClangArgs cliutil::LoadCompileCommands(const CommandLineOptions& opts) {
    ClangArgs result;

    json ccjson;
    if (!LoadCompileCommandsJSON(opts.compileCommandsFile, ccjson)) {
        return result;
    }
    const json* hit = FindMatchingEntry(ccjson, opts.inputFile);
    if (!hit) {
        std::cerr << "No matching file in compile_commands.json: " << opts.inputFile << "\n";
        return result;
    }
    const std::string workdir = ExtractWorkDir(*hit);
    if (!workdir.empty()) {
        result.strArgs.push_back(std::string("-working-directory=") + workdir);
    }
    const std::vector<std::string> argv = BuildArgvFromEntry(*hit);
    if (argv.empty()) {
        BuildCStrArgs(result); return result;
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

            {"cxtranslationunit_includebriefcommentsincodecompletion", CXTranslationUnit_IncludeBriefCommentsInCodeCompletion},
            {"includebriefcommentsincodecompletion",                 CXTranslationUnit_IncludeBriefCommentsInCodeCompletion},
            {"briefcomments",                                       CXTranslationUnit_IncludeBriefCommentsInCodeCompletion},

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
static void PrintTUFlags(unsigned flags) {
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
