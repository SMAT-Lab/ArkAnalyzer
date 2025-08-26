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

using json = nlohmann::json;
namespace fs = std::filesystem;

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
std::string Lower(std::string s) {
    std::transform(s.begin(), s.end(), s.begin(),
                   [](unsigned char c){ return (char)std::tolower(c); });
    return s;
}
#else
std::string Lower(std::string s) { return s; }
#endif

fs::path CanonicalOr(const fs::path& p) {
    std::error_code ec;
    fs::path r = fs::weakly_canonical(p, ec);
    if (ec) {
        r = p;
    }
    return r;
}

std::string NormalizePath(const std::string& p) {
    auto c = CanonicalOr(fs::path(p)).string();
    return Lower(Slashify(c));
}

bool EndsWith(const std::string& s, const char* suf) {
    const size_t n = std::strlen(suf);
    return s.size() >= n && s.compare(s.size()-n, n, suf) == 0;
}

bool IsCompilerExecutable(std::string arg) {
    for (auto& ch : arg) {
        ch = (char)std::tolower((unsigned char)ch);
    }
    return EndsWith(arg,"clang.exe") || EndsWith(arg,"clang++.exe")
        || EndsWith(arg,"clang-cl.exe") || EndsWith(arg,"clang")
        || EndsWith(arg,"clang++") || EndsWith(arg,"clang-cl")
        || EndsWith(arg,"clang_~1.exe");
}

// Shell-like split: supports quotes, \" and \<space>.
std::vector<std::string> SplitCommandLine(const std::string& cmd) {
    std::vector<std::string> out; std::string cur; bool in_quotes=false;
    for (size_t i=0;i<cmd.size();++i) {
        char ch = cmd[i];
        if (ch=='\\') {
            if (i+1<cmd.size()) {
                char nxt = cmd[i+1];
                if (nxt=='"' || nxt=='\\' || nxt==' ') {
                    cur.push_back(nxt); ++i;
                } else {
                    cur.push_back(ch);
                }
            } else {
                cur.push_back(ch);
            }
        } else if (ch=='"') {
            in_quotes = !in_quotes;
        } else if (std::isspace((unsigned char)ch) && !in_quotes) {
            if (!cur.empty()) {
                out.push_back(std::move(cur)); cur.clear();
            }
        } else {
            cur.push_back(ch);
        }
    }
    if (!cur.empty()) {
        out.push_back(std::move(cur));
    }
    return out;
}

void BuildCStrArgs(ClangArgs& a) {
    a.cstrArgs.clear();
    a.cstrArgs.reserve(a.strArgs.size());
    for (auto& s : a.strArgs) {
        a.cstrArgs.push_back(s.c_str());
    }
}

bool LoadCompileCommandsJSON(const std::string& path, json& out) {
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

const json* FindMatchingEntry(const json& ccjson, const std::string& inputFile) {
    const std::string inputNorm = NormalizePath(inputFile);
    for (const auto& entry : ccjson) {
        if (!entry.contains("file")) {
            continue;
        }
        std::string fileField;
        try { fileField = entry["file"].get<std::string>(); } catch (...) { continue; }
        if (NormalizePath(fileField) == inputNorm) {
            return &entry;
        }
    }
    return nullptr;
}

std::string ExtractWorkDir(const json& entry) {
    if (!entry.contains("directory")) {
        return {};
    }
    try { return Slashify(entry["directory"].get<std::string>()); }
    catch (...) { return {}; }
}

std::vector<std::string> BuildArgvFromEntry(const json& entry) {
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

bool StartsWithAny(const std::string& s, std::initializer_list<const char*> ps) {
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
                            std::vector<std::string>& outArgs) {
    const std::string entryNorm = NormalizePath(entryFile);
    const std::string inputNorm = NormalizePath(inputFile);

    bool skipNext=false, pendingX=false, stdTwoPart=false, stopAfterDD=false;
    bool hasLang=false, hasStd=false;

    for (size_t i=0;i<argv.size();++i) {
        std::string arg = argv[i];
        if (arg.empty()) {
            continue;
        }
        if (stopAfterDD) {
            continue;
        }
        if (skipNext) {
            skipNext=false; continue;
        }
        if (i==0 && IsCompilerExecutable(arg)) {
            continue;
        }
        const std::string norm = NormalizePath(arg);
        if (norm==entryNorm || norm==inputNorm) {
            continue;
        }
        if (arg=="--") {
            stopAfterDD=true; continue;
        }
        if (arg=="-x") {
            pendingX=true; continue;
        }
        if (pendingX) {
            outArgs.push_back(std::string("-x")+arg);
            hasLang=true;
            pendingX=false;
            continue;
        }

        if (arg=="-std") {
            stdTwoPart=true;
            continue;
        }
        if (stdTwoPart) {
            outArgs.push_back(std::string("-std=")+arg);
            hasStd=true;
            stdTwoPart=false;
            continue;
        }
        if (arg.rfind("-std=",0)==0) {
            hasStd=true;
            outArgs.push_back(std::move(arg));
            continue;
        }

        if (arg=="-xc" || arg=="-xc++" || arg=="-xc-header" || arg=="-xc++-header") {
            hasLang=true;
            outArgs.push_back(std::move(arg));
            continue;
        }

        auto EatsNextArg = [](const std::string& s){
            return (s=="-o"||s=="-c"||s=="-MF"||s=="-MT"||s=="-MQ"
                    ||s=="--sysroot"||s=="-isysroot"||s=="-include"||s=="-imacros");
        };
        auto DropSingleOpt = [](const std::string& s){
            return (s=="-c"||s=="-shared"||s=="-fPIC");
        };
        if (DropSingleOpt(arg)) {
            continue;
        }
        if (EatsNextArg(arg)) {
            skipNext=true; continue;
        }
        if (StartsWithAny(arg,{"-o","-MF","-MT","-MQ","-c"})) {
            continue;
        }
        outArgs.push_back(std::move(arg));
    }

    // Fallbacks
    if (!hasLang) {
        fs::path p(entryFile);
        std::string ext = p.extension().string();
        std::transform(ext.begin(), ext.end(), ext.begin(),
                       [](unsigned char c){ return (char)std::tolower(c); });
        const bool isHeader = (ext==".h"||ext==".hh"||ext==".hpp"||ext==".hxx");
        outArgs.push_back(isHeader? "-xc++-header" : (ext==".c"? "-xc" : "-xc++"));
    }
    if (!hasStd) {
        outArgs.push_back("-std=c++17");
    }
}

void MaybeAddSourceDirInclude(const std::string& entryFile, std::vector<std::string>& outArgs) {
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
            opts.outputFile = argv[++i];
        } else if (arg == "-c" && i + 1 < argc) {
            opts.compileCommandsFile = argv[++i];
        } else if (arg == "-i" && i + 1 < argc) {
            opts.userIncludeDirs.push_back(argv[++i]);
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

ClangArgs cliutil::LoadCompileCommands(const CommandLineOptions& opts)
{
    ClangArgs result;
    std::ifstream file(opts.compileCommandsFile);
    if (!file.is_open()) {
        std::cerr << "无法打开 compile_commands.json \n";
        return result;
    }
    json compileCommandsJson;
    try {
        file >> compileCommandsJson;
    } catch (const json::exception &e) {
        std::cerr << "JSON 解析错误: " << e.what() << std::endl;
        return result;
    }
    fs::path inputFilePath = fs::canonical(opts.inputFile);
    auto appendArgsFromCommand = [&opts, &result](const std::string& commandStr) {
        std::istringstream iss(commandStr);
        std::string arg;
        while (iss >> arg) {
            if (IsSameFile(arg, opts.inputFile)) {
                continue;
            }
            result.strArgs.push_back(arg);
            result.cstrArgs.push_back(result.strArgs.back().c_str());
        }
    };
    for (const auto &command : compileCommandsJson) {
        if (!(command.contains("file") && command.contains("command"))) {
            std::cerr << "compile_commands.json 中 缺少 file 或 command 字段" << std::endl;
            continue;
        }
        fs::path commandFilePath;
        try {
            const std::string commandFile = command["file"].get<std::string>();
            commandFilePath = fs::canonical(commandFile);
        } catch (const std::filesystem::filesystem_error &e) {
            std::cerr << "路径错误: " << e.what() << std::endl;
            continue;
        }
        if (!fs::equivalent(commandFilePath, inputFilePath)) {
            continue;
        }
        // Target file hit: Append - I<directory>
        const std::string directoryStr = commandFilePath.parent_path().string();
        result.strArgs.push_back("-I" + directoryStr);
        result.cstrArgs.push_back(result.strArgs.back().c_str());

        // Add other parameters to the command (excluding the source file itself)
        const std::string commandStr = command["command"].get<std::string>();
        appendArgsFromCommand(commandStr);

        break;
    }
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