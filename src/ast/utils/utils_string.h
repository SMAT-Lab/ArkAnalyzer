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
bool HasSuffix(const std::string& str, const std::string& suffix);

// 路径分隔符（适配跨平台）
std::string getPathSeparator();

// 路径归一化后判断是否同文件（实现见 .cpp）
bool isSameFile(const std::string& pathA, const std::string& pathB);

