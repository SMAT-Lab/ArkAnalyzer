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


// utils_string.cpp
#include "utils_string.h"
#include <sstream>
#include <algorithm>
#include <filesystem>

// 去除首尾空白
void Trim(std::string &s)
{
    s.erase(0, s.find_first_not_of(" \t\r\n"));
    s.erase(s.find_last_not_of(" \t\r\n") + 1);
}

// CXString 转 std::string + 自动释放
std::string Cx2Str(const CXString &s)
{
    std::string r = clang_getCString(s) ? clang_getCString(s) : "" ;
    clang_disposeString(s);
    // 如果包含\../，用canonical处理
    if (r.find("\\../") != std::string::npos) {
        try {
            return std::filesystem::canonical(r).string();
        } catch (...) {
            return r;
        }
    }
    return r;
}

// 提取括号中的内容
std::string ExtractParentContent(const std::string &code, size_t lpos, char open, char close)
{
    if (lpos == std::string::npos) {
        lpos = code.find(open);
    }
    size_t rpos = code.rfind(close);
    if (lpos != std::string::npos && rpos != std::string::npos && rpos > lpos + 1) {
        std::string inside = code.substr(lpos + 1, rpos - lpos - 1);
        Trim(inside);
        return inside;
    }
    return std::string();
}

// 字符串分割
std::vector<std::string> split(const std::string &s, char delimiter)
{
    std::vector<std::string> tokens;
    std::istringstream iss(s);
    std::string token;
    while (getline(iss, token, delimiter)) {
        Trim(token);
        tokens.push_back(token);
    }
    return tokens;
}

// 路径分隔符
std::string GetPathSeparator()
{
#ifdef _WIN32
    return "\\";
#else
    return "/";
#endif
}

// 路径归一化判断同名
bool IsSameFile(const std::string& pathA, const std::string& pathB)
{
    try {
        return std::filesystem::path(pathA).filename() == std::filesystem::path(pathB).filename();
    } catch (const std::filesystem::filesystem_error &e) {
        return false;
    }
}
