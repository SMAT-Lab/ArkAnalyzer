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
#include <map>
#include "json.hpp"

// 文件内容缓存（可以用 extern 声明在头文件里）
extern std::map<std::string, std::string> g_fileContents;

// 加载文件内容进缓存
void LoadFileContent(const std::string& filename);

// 获取默认输出路径
std::string get_default_output_path(const std::string &inputPath);

// 保存AST到文件
void saveASTToFile(const nlohmann::json& ast, const std::string& outputFile);
