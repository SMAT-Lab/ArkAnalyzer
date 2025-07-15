// utils_string.h
#pragma once
#include <string>
#include <vector>
#include <clang-c/Index.h>

// 去除首尾空白
void trim(std::string &s);

// CXString 转 std::string 并自动释放
std::string cx2str(const CXString &s);

// 提取括号内容
std::string extractParentContent(const std::string &code, size_t lpos = std::string::npos, char open = '(', char close = ')');

// 字符串分割
std::vector<std::string> split(const std::string &s, char delimiter);

// 判断结尾
bool hasSuffix(const std::string& str, const std::string& suffix);

// 路径分隔符（适配跨平台）
std::string getPathSeparator();

// 路径归一化后判断是否同文件（实现见 .cpp）
bool isSameFile(const std::string& pathA, const std::string& pathB);

