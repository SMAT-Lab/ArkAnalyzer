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

#pragma once
#include <string>
#include <string_view>
#include "json.hpp"
#include <clang-c/Index.h>

// Keep project alias consistent
using json = nlohmann::json;

// --- Small generic helper (template must live in header) ---
template<typename F>
void forEachChild(json& node, F&& f)
{
    if (node.contains("inner") && node["inner"].is_array()) {
        for (auto& child : node["inner"]) f(child);
    }
}

// --- Forward declarations for helpers defined elsewhere ---
// These are already implemented in your original .cpp; we just declare them here.
void changeChildNodeType(json& children);

// --- Public API: move these 5 postprocess helpers into a separate TU ---
void operatorCallExprPostProcess(json& node, json& children);
void implicitCastExprPostProcess(json& node, json& children, std::string codeStr);
void callExprPostProcess(json& node, json& children);
void PostprocessPseudoDestructor(json& node, const json& children, std::string_view codeStr);

bool ConstructCallExpr(std::string codeStr, std::string typeStr);


std::vector<std::string> ParseTemplateArgsAfterEqual(
    const std::string& codeRaw,
    const std::string& tplNameHint);

bool IsBuiltinNameNoSpace(const std::string& tokNoSpace);

json MakeMinimalTypeNodeFromToken(const std::string& tokNoSpace);

void RewriteTypeAliasTemplateArgs(json& typeAliasDecl, json& children);

void mergeTypeAliasDeclChild(json& newChildren, json& children, json& parent);

// TrimView: Return a subview of `s` with leading and trailing ASCII whitespace (<= ' ') removed.
// No allocation/copy; only adjusts view bounds (O(n) time, O(1) extra space).
// Does not modify the original string; if `s` is all whitespace, returns an empty view.
// The returned view must not outlive the underlying character buffer.
// Only ASCII whitespace is considered (space, tab, CR, LF, etc.), not Unicode whitespace.
inline std::string_view TrimView(std::string_view s) noexcept
{
    size_t i = 0;
    size_t j = s.size();
    while (i < j && (unsigned char) s[i] <= ' ') {
        ++i;
    }
    while (j > i && (unsigned char) s[j - 1] <= ' ') {
        --j;
    }
    return s.substr(i, j - i);
}

bool LooksLikeSimpleLeftFold(std::string_view s, char& opOut) noexcept;

// ------ type/name helpers ------
bool IsClassLikeQualType(const std::string& qt) noexcept;
std::string StripTemplates(std::string s);
std::string ShortTypeNameFromQual(const std::string& qt);

// Only intended in VarDecl context: whether node looks like a parenthesized init
bool LooksLikeParenInitNode(const json& n);

// Promote VarDecl’s parenthesized init to CXXConstructExpr if it’s a class-like type
void RecoverCtorForVarDecl(json& varDecl);

// Returns true if s is at least 2 chars long and is wrapped by a single
// leading '(' and trailing ')'. Does not check for balanced parentheses.
bool IsParenWrapped(std::string_view s) noexcept;

// Convenience overload so existing call sites with std::string keep working.
bool IsParenWrapped(const std::string& s) noexcept;

// — Public, reusable fold-expression patcher —
// Recursively walks the subtree and rewrites wrapper nodes of the form
// `(... <op> ident)` (ImplicitCastExpr / UnexposedExpr / ParenExpr) in place
// into CXXFoldExpr.
void patchFoldExpr(json& node);

// --- CXX ctor-initializer helpers ---
void HandleCxxCtorInitializerOfCallExpr(nlohmann::json& child);
nlohmann::json buildCXXCtorInitializer(nlohmann::json& memberRef,
                                       nlohmann::json& arg,
                                       nlohmann::json& parent);
nlohmann::json addCXXCtorInitializer(nlohmann::json& children,
                                     nlohmann::json& parent);

// Build child node's range based on parent node
void buildNodeRange(json& node, json& parent);

// Recursively build typedef child nodes from a CXType
void buildTypedefChild(const CXType& type, json& newChildren, json& children, json& parent);