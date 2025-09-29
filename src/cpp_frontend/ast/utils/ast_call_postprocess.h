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
void PostprocessFoldExpr(json& node, std::string_view codeStr);

bool ConstructCallExpr(std::string codeStr, std::string typeStr);


std::vector<std::string>
ParseTemplateArgsAfterEqual(const std::string& codeRaw, const std::string& tplNameHint);

bool IsBuiltinNameNoSpace(const std::string& tokNoSpace);

json MakeMinimalTypeNodeFromToken(const std::string& tokNoSpace);

void RewriteTypeAliasTemplateArgs(json& typeAliasDecl, json& children);