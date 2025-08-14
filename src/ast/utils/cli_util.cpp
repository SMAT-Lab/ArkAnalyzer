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

using json = nlohmann::json;
namespace fs = std::filesystem;

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