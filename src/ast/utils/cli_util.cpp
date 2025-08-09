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

CommandLineOptions cliutil::parseCommandLineArgs(int argc, char** argv) {
    CommandLineOptions opts;
    for(int i = 1; i< argc; ++i) {
        std::string arg = argv[i];
        if (arg == "-o" && i + 1 <argc) {
            opts.output_file = argv[++i];
        } else if (arg == "-c" && i + 1 < argc) {
            opts.compile_commands_file = argv[++i];
        } else if (arg == "-i" && i + 1 < argc) {
            opts.user_include_dirs.push_back(argv[++i]);
        } else if (opts.inputFile.empty()) {
            opts.inputFile = arg;
        }
    }
    return opts;
}

void cliutil::addMainFileDirToInclude(CommandLineOptions& opts) {
    if (opts.inputFile.empty()) return;
    std::string main_dir = std::filesystem::absolute(opts.inputFile).parent_path().string();
    auto abs_dir = std::filesystem::absolute(main_dir);
    auto dir_exists = std::filesystem::exists(abs_dir);
    bool found = false;
    for (const auto& dir : opts.user_include_dirs) {
        auto abs_main_dir = std::filesystem::absolute(dir);
        auto main_dir_exists = std::filesystem::exists(abs_main_dir);

        if (dir_exists && main_dir_exists) {
            try {
                if (std::filesystem::equivalent(abs_dir, abs_main_dir)) {
                    found = true;
                    break;
                }
            } catch (const std::exception& e) {
                std::cerr << "Caught std::exception in equivalent(): " << e.what() << std::endl;
            }
        } else {
            std::cout << "[DEBUG] Does abs_dir exist?       " << (dir_exists ? "YES" : "NO") << std::endl;
            std::cout << "[DEBUG] Does abs_main_dir exist?  " << (main_dir_exists ? "YES" : "NO") << std::endl;
        }
    }
    std::cout << "[DEBUG] Included Path Comparison Finished" << std::endl;
    if (!found) {
        opts.user_include_dirs.push_back(main_dir);
    }
}

bool cliutil::ValidateInput(CommandLineOptions& opts) {
    if (opts.inputFile.empty()) {
        std::cerr << "Error: No input file provided.\n";
        return false;
    }
    if (opts.output_file.empty()) {
        size_t lastDot = opts.inputFile.find_last_of('.');
        std::string filename = (lastDot != std::string::npos) ? opts.inputFile.substr(0, lastDot) : opts.inputFile;
        opts.output_file = filename + ".json";
    }
    return true;
}

void cliutil::printUsage(const char* progName) {
    std::cerr << "Usage: " << progName
              << " <file.cpp> [-o <output.json>] [-c <compile_commands.json>] [-i <include_dir> ...]\n";
}

bool cliutil::hasSuffix(const std::string& str, const std::string& suffix) {
    if (suffix.size() > str.size()) {
        return false;
    }
    return str.compare(str.size() - suffix.size(), suffix.size(), suffix) == 0;
}

ClangArgs cliutil::prepareClangArgs(const CommandLineOptions& opts) {
    ClangArgs res;
    // 选择标准
    if (hasSuffix(opts.inputFile, ".c")) {
        res.str_args.push_back("-std=c99");
    } else {
        res.str_args.push_back("-xc++");
        res.str_args.push_back("-std=c++17");
    }
    // 添加用户 include
    for (const auto& dir : opts.user_include_dirs) {
        res.str_args.push_back("-I" + dir);
    }
    // 将 string 转换为 c_str 指针
    for (const auto& arg : res.str_args) {
        res.cstr_args.push_back(arg.c_str());
    }
    return res;
}

ClangArgs cliutil::LoadCompileCommands(const CommandLineOptions& opts) {
    std::string compile_commands_path = opts.compile_commands_file;
    std::string inputFile = opts.inputFile;
    std::ifstream file(compile_commands_path);
    ClangArgs result;
    if (!file.is_open()) {
        std::cerr << "无法打开 compile_commands.json \n";
        return result;
    }
    json compile_commands_json;
    try {
        file >> compile_commands_json;
    } catch (const json::exception &e) {
        std::cerr << "JSON 解析错误: "<< e.what()<< std::endl;
        return result;
    }
    fs::path input_file_path = fs::canonical(inputFile);
    for (const auto &command: compile_commands_json) {
        if (command.contains("file") && command.contains("command")) {
            std::string command_file = command["file"].get<std::string>();
            fs::path command_file_path;
            try {
                command_file_path = fs::canonical(command_file);
            } catch (const std::filesystem::filesystem_error &e) {
                std::cerr << "路径错误: "<< e.what() << std::endl;
                continue;
            }
            if (fs::equivalent(command_file_path, input_file_path)) {
                std::string directory_str = command_file_path.parent_path().string();
                result.str_args.push_back("-I" + directory_str);
                result.cstr_args.push_back(result.str_args.back().c_str());
                std::string command_str = command["command"].get<std::string>();
                std::istringstream iss(command_str);
                std::string arg;
                while (iss >>arg) {
                    if (!isSameFile(arg, inputFile)) {
                        result.str_args.push_back(arg);
                        result.cstr_args.push_back(result.str_args.back().c_str());
                    }
                }
                break;
            }
        } else {
            std::cerr<< "compile_commands.json 中 缺少 file 或 command 字段"<< std::endl;
        }
    }
    return result;
}

ClangArgs cliutil::getClangArgs(const CommandLineOptions& opts) {
    ClangArgs clang_args;
    if (!opts.compile_commands_file.empty()) {
        clang_args = cliutil::LoadCompileCommands(opts);
    } else {
        clang_args = cliutil::prepareClangArgs(opts);
    }
    return clang_args;
}