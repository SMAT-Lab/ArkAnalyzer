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


#pragma once
#include <string>
#include <vector>

struct CommandLineOptions {
    std::string inputFile;
    std::string output_file;
    std::string compile_commands_file;
    std::vector<std::string> user_include_dirs;
};

struct ClangArgs {
    std::vector<std::string> str_args;   // 字符串本体
    std::vector<const char*> cstr_args;  // 指针
};

namespace cliutil {
    CommandLineOptions parseCommandLineArgs(int argc, char** argv);
    void addMainFileDirToInclude(CommandLineOptions& opts);
    bool ValidateInput(CommandLineOptions& opts);
    void printUsage(const char* progName);
    ClangArgs prepareClangArgs(const CommandLineOptions& opts);
    ClangArgs LoadCompileCommands(const CommandLineOptions& opts);
    bool hasSuffix(const std::string& str, const std::string& suffix); // 内部用
    ClangArgs getClangArgs(const CommandLineOptions& opts);
}