#pragma once
#include <string>
#include <vector>

struct CommandLineOptions {
    std::string input_file;
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
    bool validateInput(CommandLineOptions& opts);
    void printUsage(const char* progName);
    ClangArgs prepareClangArgs(const CommandLineOptions& opts);
    bool hasSuffix(const std::string& str, const std::string& suffix); // 内部用
}