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

/**
 * Normalizes type strings into a semantically consistent form to enable
 * reliable rule matching and equivalence comparison across platforms or compilers.
 * Typical input examples (from clang_getTypeSpelling):
 *   - "std::string"
 *   - "std::map<std::string, int>"
 *   - "vector<int>"              // sometimes missing std:: prefix
 *   - "pair<_Unrefwrap_t<const char, int>>" // MSVC STL internal name
 * Unified normalized output examples:
 *   - "std::basic_string<char>"
 *   - "std::map<std::basic_string<char>, int>"
 *   - "std::vector<int>"
 *   - "std::pair<const char *, int>"
 * The function replaces standalone occurrences of "std::string"
 * with "std::basic_string<char>", preserving semantics and preventing
 * false matches in cases like "std::string_view" or "std::stringify".
 */
void SafeReplaceStdString(std::string& s)
{
    // The original token to search for. Avoid hardcoded length boundaries to prevent partial replacements
    // (e.g., replacing inside "std::map<std::string, int>").
    static const char* kFrom = "std::string";
    const size_t nFrom = std::strlen(kFrom);
    // Target normalized form — the canonical alias for std::string.
    // This allows "std::string" and "std::basic_string<char>" to be treated as equivalent.
    const std::string kTo = "std::basic_string<char>";
    size_t pos = 0;
    while ((pos = s.find(kFrom, pos)) != std::string::npos) {
        // Check if the match is a standalone identifier.
        // Rule: do not replace if adjacent characters are identifier characters
        // (letters, digits, '_', or ':').
        auto isIdentChar = [](char ch)->bool {
            return std::isalnum(static_cast<unsigned char>(ch)) || ch == '_' || ch == ':';
        };
        // Left boundary: ok if it's the beginning or the previous char is not identifier-like
        bool leftOK = (pos == 0) || !isIdentChar(s[pos - 1]);
        // Right boundary: ok if end of string or next char is not identifier-like
        size_t end = pos + nFrom;
        bool rightOK = (end >= s.size()) || !isIdentChar(s[end]);
        if (leftOK && rightOK) {
            // Confirmed standalone "std::string"
            // Typical cases:
            //   1) Template arg: std::map<std::string, int>
            //   2) Variable/return type: std::string
            //   3) Nested template: std::vector<std::string>
            s.replace(pos, nFrom, kTo);
            pos += kTo.size();  // move forward to continue search
        } else {
            // Skip non-standalone cases like std::string_view or std::stringify
            pos = end;
        }
    }
};

// Utility: Skip an entire '<...>' block starting from `start`, supporting nested brackets.
// Returns true if the outermost pair of angle brackets is balanced,
// and sets `outPos` to the position right after the matching '>'.
// Returns false if no matching brackets are found or if the structure is malformed.
bool SkipAngleBracketBlock(const std::string& code, size_t start, size_t& outPos)
{
    const size_t n = code.size();
    if (start >= n) {
        return false;
    }
    // Find the first '<' starting from `start`
    size_t lt = (code[start] == '<') ? start : code.find('<', start);
    if (lt == std::string::npos) {
        return false;
    }
    int depth = 0;
    for (size_t i = lt; i < n; ++i) {
        char c = code[i];
        if (c == '<') {
            ++depth;
            continue;
        }
        if (c != '>') {
            continue;
        }
        if (depth <= 0) {
            return false; // unmatched or extra '>'
        }
        --depth;
        if (depth != 0) {
            continue;
        }
        // Found the matching outermost '>'
        outPos = i + 1;
        return true;
    }
    // Reached the end without balancing
    return false;
}
