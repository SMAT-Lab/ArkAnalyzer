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

#include "ast_call_postprocess.h"
#include <algorithm>
#include <vector>
#define TWO 2
#define THREE 3

void swapChildNode(json &children)
{
    json child = children[1];
    children[1] = children[0];
    children[0] = child;
}

bool ConstructCallExpr(std::string codeStr, std::string typeStr)
{
    size_t index = codeStr.find('(');
    if (index > codeStr.length()) {
        return false;
    }
    std::string newStr = typeStr + codeStr.substr(index);
    if (newStr == codeStr) {
        return true;
    }
    return false;
}

// Modify child node types under CXXConstructExpr node
void changeChildNodeType(json &children)
{
    if (children.size() == 1) {
        std::string typeStr = children[0]["type"]["qualType"];
        std::string codeStr = children[0]["code"];
        std::string kindStr = children[0]["kind"];
        if (typeStr == "iterator" || typeStr == "std::basic_string<char>" ||
        (kindStr == "ImplicitCastExpr" && ConstructCallExpr(codeStr, typeStr))) {
            children[0]["kind"] = "MaterializeTemporaryExpr";
        }
    }
}


// -------- operatorCallExprPostProcess --------
void operatorCallExprPostProcess(
    json& node,
    json& children
)
{
    if (children.size() >= TWO) {
        std::string childName1 = children[1]["name"].is_null() ? "" : children[1]["name"];
        if (children[1]["code"] == "<<" || childName1.find("operator") != std::string::npos)
            swapChildNode(children);
        std::string childName0 = children[0]["name"].is_null() ? "" : children[0]["name"];
        if (childName0.find("operator") != std::string::npos) children[0]["castKind"] = "FunctionToPointerDecay";
    }
    if (children.size() == THREE) children[1]["valueCategory"] = "lvalue";
}

// -------- implicitCastExprPostProcess --------
void implicitCastExprPostProcess(
    json& node,
    json& children,
    std::string codeStr
)
{
    if (!children.empty() && children[0]["kind"] == "CallExpr") {
        node["kind"] = "ExprWithCleanups";
    } else if (!children.empty() && children[0]["kind"] == "DeclRefExpr" &&
        codeStr.find(children[0]["code"]) == 0 && codeStr.find("(") != std::string::npos) {
        node["kind"] = "RecoveryExpr";
    }
}

// Post-process a CallExpr node: adjust kind for member calls or fix missing kinds
void callExprPostProcess(json& node, json& children)
{
    // If the first child is a MemberExpr, upgrade the call to CXXMemberCallExpr
    if (!children.empty() && children[0]["kind"] == "MemberExpr") {
        node["kind"] = "CXXMemberCallExpr";
    } else {
        // Otherwise, try to normalize child node types
        changeChildNodeType(children);
    }
    // If it's still a plain CallExpr and the first child is missing kind info,
    // infer its kind from referencedDecl or code pattern.
    if (node.value("kind", "") == "CallExpr" && !children.empty()) {
        auto &child0 = children[0];
        bool missingKind = (!child0.contains("kind") || child0["kind"].is_null() ||
                            (child0["kind"].is_string() && child0["kind"].get_ref<const std::string&>().empty()));
        if (missingKind) {
            const std::string code0 = child0.value("code", "");
            if (child0.contains("referencedDecl") && child0["referencedDecl"].contains("kind") &&
                !child0["referencedDecl"]["kind"].is_null()) {
                // Use referencedDecl.kind if available
                child0["kind"] = child0["referencedDecl"]["kind"];
            } else if (code0.find('.') != std::string::npos || code0.find("->") != std::string::npos) {
                // Guess member access based on code text
                child0["kind"] = "MemberExpr";
            } else if (child0.contains("referencedDecl") &&
                       child0["referencedDecl"].value("kind", "") == "OverloadedDeclRef") {
                // Special case: overloaded function reference
                child0["kind"] = "OverloadedDeclRef";
            } else {
                // Default to DeclRefExpr
                child0["kind"] = "DeclRefExpr";
            }
        }
    }
}

// Detect pseudo-destructor expression: MemberExpr + '~' + TypeRef
void PostprocessPseudoDestructor(json& node,
                                        const json& children,
                                        std::string_view codeStr)
{
    if (node.value("kind", "") != "MemberExpr") {
        return;
    }
    if (codeStr.find('~') == std::string::npos) {
        return;
    }
    if (children.size() < TWO || children[1].value("kind", "") != "TypeRef") {
        return;
    }
    node["kind"] = "CXXPseudoDestructorExpr";
    node["pseudoDestructorType"] = children[1]["type"]["qualType"];
}

// -------- PostprocessFoldExpr --------
static bool LooksLikeSimpleLeftFold(std::string_view s, char& opOut)
{
    // Look for "(..."
    size_t p = s.find("(...");                 // common pretty-printed form
    if (p == std::string::npos) {
        return false;
    }
    size_t i = p + 4;                          // skip "(..."
    while (i < s.size() && static_cast<unsigned char>(s[i]) <= ' ') {
        ++i; // skip spaces
    }
    if (i >= s.size()) {
        return false;
    }
    char c = s[i];
    switch (c) {
        case '+': case '-': case '*': case '/':
        case '&': case '|': case '^':
            break;
        default:
            return false;
    }
    opOut = c;
    // Roughly check matching right parenthesis
    return s.find(')', i) != std::string::npos;
}

// Detect simple fold expressions without regex (fast path)
void PostprocessFoldExpr(json& node, std::string_view codeStr)
{
    if (node.value("kind", "") != "ImplicitCastExpr") {
        return;
    }
    if (codeStr.empty()) {
        return;
    }
    char op = 0;
    if (LooksLikeSimpleLeftFold(codeStr, op)) {
        node["kind"]    = "CXXFoldExpr";
        node["op"]      = std::string(1, op);
        node["pattern"] = "left";
    }
}