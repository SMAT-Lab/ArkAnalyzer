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

CommandLineOptions cliutil::ParseCommandLineArgs(int argc, char** argv) {
    CommandLineOptions opts;
    for (int i = 1; i < argc; ++i) {
        std::string arg = argv[i];
        if (arg == "-o" && i + 1 < argc) {
            opts.outputFile = argv[i + 1];
            ++i;
            continue;
        }
        if (arg == "-c" && i + 1 < argc) {
            opts.compile_commands_file = argv[i + 1];
            ++i;
            continue;
        }
        if (arg == "-i" && i + 1 < argc) {
            opts.userIncludeDirs.push_back(argv[i + 1]);
            ++i;
            continue;
        }
        if (opts.inputFile.empty()) {
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
    const auto abs_dir = std::filesystem::absolute(mainDir);
    const bool dir_exists = std::filesystem::exists(abs_dir);
    bool found = false;
    for (const auto& dir : opts.userIncludeDirs) {
        const auto abs_main_dir = std::filesystem::absolute(dir);
        const bool main_dir_exists = std::filesystem::exists(abs_main_dir);
        // 若任一不存在：打印调试信息并继续下一个目录（卫语句）
        if (!(dir_exists && main_dir_exists)) {
            std::cout << "[DEBUG] Does abs_dir exist?       " << (dir_exists ? "YES" : "NO") << std::endl;
            std::cout << "[DEBUG] Does abs_main_dir exist?  " << (main_dir_exists ? "YES" : "NO") << std::endl;
            continue;
        }
        try {
            if (std::filesystem::equivalent(abs_dir, abs_main_dir)) {
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
    // 选择标准
    if (HasSuffix(opts.inputFile, ".c")) {
        res.strArgs.push_back("-std=c99");
    } else {
        res.strArgs.push_back("-xc++");
        res.strArgs.push_back("-std=c++17");
    }
    // 添加用户 include
    for (const auto& dir : opts.userIncludeDirs) {
        res.strArgs.push_back("-I" + dir);
    }
    // 将 string 转换为 c_str 指针
    for (const auto& arg : res.strArgs) {
        res.cstrArgs.push_back(arg.c_str());
    }
    return res;
}

ClangArgs cliutil::LoadCompileCommands(const CommandLineOptions& opts)
{
    ClangArgs result;
    std::ifstream file(opts.compile_commands_file);
    if (!file.is_open()) {
        std::cerr << "无法打开 compile_commands.json \n";
        return result;
    }
    json compile_commands_json;
    try {
        file >> compile_commands_json;
    } catch (const json::exception &e) {
        std::cerr << "JSON 解析错误: " << e.what() << std::endl;
        return result;
    }
    fs::path input_file_path = fs::canonical(opts.inputFile);
    auto append_args_from_command = [&](const std::string& command_str) {
        std::istringstream iss(command_str);
        std::string arg;
        while (iss >> arg) {
            if (IsSameFile(arg, opts.inputFile)) continue;
            result.strArgs.push_back(arg);
            result.cstrArgs.push_back(result.strArgs.back().c_str());
        }
    };
    for (const auto &command : compile_commands_json) {
        if (!(command.contains("file") && command.contains("command"))) {
            std::cerr << "compile_commands.json 中 缺少 file 或 command 字段" << std::endl;
            continue;
        }

        fs::path command_file_path;
        try {
            const std::string command_file = command["file"].get<std::string>();
            command_file_path = fs::canonical(command_file);
        } catch (const std::filesystem::filesystem_error &e) {
            std::cerr << "路径错误: " << e.what() << std::endl;
            continue;
        }
        if (!fs::equivalent(command_file_path, input_file_path)) {
            continue;
        }
        // 命中目标文件：追加 -I<目录>
        const std::string directory_str = command_file_path.parent_path().string();
        result.strArgs.push_back("-I" + directory_str);
        result.cstrArgs.push_back(result.strArgs.back().c_str());

        // 追加 command 中的其它参数（排除源文件自身）
        const std::string command_str = command["command"].get<std::string>();
        append_args_from_command(command_str);

        break;
    }

    return result;
}

ClangArgs cliutil::GetClangArgs(const CommandLineOptions& opts)
{
    ClangArgs clangArgs;
    if (!opts.compile_commands_file.empty()) {
        clangArgs = cliutil::LoadCompileCommands(opts);
    } else {
        clangArgs = cliutil::PrepareClangArgs(opts);
    }
    return clangArgs;
}