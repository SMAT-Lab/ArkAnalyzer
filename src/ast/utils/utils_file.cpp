#include "utils_file.h"
#include <fstream>
#include <filesystem>
#include <iostream>

std::map<std::string, std::string> fileContents;

void loadFileContent(const std::string& filename) {
    std::ifstream file(filename, std::ios::in | std::ios::binary);
    if (!file) return;
    std::string content((std::istreambuf_iterator<char>(file)), std::istreambuf_iterator<char>());
    fileContents[filename] = std::move(content);
}

std::string get_default_output_path(const std::string &input_path) {
    size_t last_dot = input_path.find_last_of('.');
    std::string filename = (last_dot != std::string::npos) ? input_path.substr(0, last_dot) : input_path;
    return filename + ".json";
}

void saveASTToFile(const nlohmann::json& ast, const std::string& output_file) {
    std::ofstream(output_file) << ast.dump(-1, ' ', false, nlohmann::json::error_handler_t::replace);
    std::cout << "[STEP4] AST written to: " << output_file << std::endl;
}
