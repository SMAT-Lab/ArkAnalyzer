/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
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

// Remove leading and trailing whitespace
void Trim(std::string &s)
{
    s.erase(0, s.find_first_not_of(" \t\r\n"));
    s.erase(s.find_last_not_of(" \t\r\n") + 1);
}

// Convert CXString to std::string + auto release
std::string Cx2Str(const CXString &s)
{
    std::string r = clang_getCString(s) ? clang_getCString(s) : "" ;
    clang_disposeString(s);
    if (r == "*****") {
        r = "null"; // Handling Linux features
    }
    if (r == "NULL") {
        r = "0"; // Handling Linux features
    }
    // If contains \../, process with canonical
    if (r.find("\\../") != std::string::npos) {
        try {
            return std::filesystem::canonical(r).string();
        } catch (...) {
            return r;
        }
    }
    return r;
}

// Extract content within parentheses
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

// String splitting
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

// Path separator
std::string GetPathSeparator()
{
#ifdef _WIN32
    return "\\";
#else
    return "/";
#endif
}

// Path normalization to check same file name
bool IsSameFile(const std::string& pathA, const std::string& pathB)
{
    try {
        return std::filesystem::path(pathA).filename() == std::filesystem::path(pathB).filename();
    } catch (const std::filesystem::filesystem_error &e) {
        return false;
    }
}

// Determine if it is a built-in data type
bool IsBuiltInType(std::string& type)
{
    // Built-in types list
    std::set<std::string> builtInTypes = {
        "int", "float", "double", "char", "bool",
        "short", "long", "unsigned int", "unsigned char",
        "unsigned short", "unsigned long", "void"
    };
    return builtInTypes.count(type);
}

// 将类型字符串做“语义无损”的统一化，便于后续做规则匹配/等价判断。
// 典型输入来自 libclang 的 clang_getTypeSpelling：
//   - "std::string"
//   - "std::map<std::string, int>"
//   - "vector<int>"（某些场景下少了 std:: 前缀）
//   - "pair<_Unrefwrap_t<const char, int>>"（MSVC STL 的实现细节名）
// 统一输出示例：
//   - "std::basic_string<char>"
//   - "std::map<std::basic_string<char>, int>"
//   - "std::vector<int>"
//   - "std::pair<const char *, int>"
void SafeReplaceStdString(std::string& s)
{
    // 要查找的原始记法。注意不要硬编码长度，避免替换区间越界（比如误吞掉
    // "std::map<std::string, int>" 里的逗号）。
    static const char* kFrom = "std::string";
    const size_t nFrom = std::strlen(kFrom);
    // 统一后的目标记法：标准库 string 的“真实类型别名” basic_string<char>
    // 这么做能把 string 和 basic_string<char> 当作同类处理，便于比较。
    const std::string kTo = "std::basic_string<char>";
    size_t pos = 0;
    while ((pos = s.find(kFrom, pos)) != std::string::npos) {
        // 判断是否是“独立的标识符”，避免把 string_view/stringify 等误伤。
        // 规则：左右两边若接的是标识符字符（字母/数字/_/::），就不替换。
        auto isIdentChar = [](char ch)->bool {
            return std::isalnum(static_cast<unsigned char>(ch)) || ch == '_' || ch == ':';
        };

        // 左侧边界：pos==0 或 左侧不是标识符字符，才视为独立 token 的左边界
        bool leftOK  = (pos == 0) || !isIdentChar(s[pos - 1]);

        // 右侧边界：pos+nFrom 要么到末尾，要么下一个不是标识符字符
        size_t end = pos + nFrom;
        bool rightOK = (end >= s.size()) || !isIdentChar(s[end]);
        if (leftOK && rightOK) {
            // 确认是“独立的 std::string”
            // 典型命中场景：
            //   1) 模板参数：std::map<std::string, int> ->  std::map<std::basic_string<char>, int>
            //   2) 变量/返回值：std::string ->  std::basic_string<char>
            //   3) 嵌套模板：std::vector<std::string> ->  std::vector<std::basic_string<char>>
            s.replace(pos, nFrom, kTo);
            pos += kTo.size();  // 继续向后搜索，避免死循环
        } else {
            // 非独立 token（如 std::string_view / std::stringify），跳过这一段
            pos = end;
        }
    }
};