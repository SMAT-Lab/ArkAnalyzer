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
    size_t lastDot = input_path.find_last_of('.');
    std::string filename = (lastDot != std::string::npos) ? input_path.substr(0, lastDot) : input_path;
    return filename + ".json";
}

void saveASTToFile(const nlohmann::json& ast, const std::string& output_file) {
    std::ofstream(output_file) << ast.dump(-1, ' ', false, nlohmann::json::error_handler_t::replace);
    std::cout << "[STEP4] AST written to: " << output_file << std::endl;
}
