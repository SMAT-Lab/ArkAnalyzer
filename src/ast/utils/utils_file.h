#pragma once
#include <string>
#include <map>
#include "json.hpp"

// 文件内容缓存（可以用 extern 声明在头文件里）
extern std::map<std::string, std::string> fileContents;

// 加载文件内容进缓存
void loadFileContent(const std::string& filename);

// 获取默认输出路径
std::string get_default_output_path(const std::string &input_path);

// 保存AST到文件
void saveASTToFile(const nlohmann::json& ast, const std::string& output_file);
