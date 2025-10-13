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


// utils_string.h
#pragma once
#include <string>
#include <vector>
#include <clang-c/Index.h>

// Remove leading and trailing whitespace
void Trim(std::string &s);

// Convert CXString to std::string and auto release
std::string Cx2Str(const CXString &s);

// Extract parentheses content
std::string ExtractParentContent(
    const std::string &code, size_t lpos = std::string::npos, char open = '(', char close = ')');

// String splitting
std::vector<std::string> split(const std::string &s, char delimiter);

// Check suffix
bool HasSuffix(const std::string& str, const std::string& suffix);

// Path separator (cross-platform compatible)
std::string GetPathSeparator();

// Check if same file after path normalization(implementation in .cpp)
bool IsSameFile(const std::string& pathA, const std::string& pathB);

inline bool StartsWith(std::string_view s, std::string_view p) noexcept
{
    return s.rfind(p, 0) == 0;
}
