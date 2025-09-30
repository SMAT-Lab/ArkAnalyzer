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
#include "utils_string.h"
#include <algorithm>
#include <vector>
#include <iostream>
#include <set>
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
void PostprocessPseudoDestructor(json& node, const json& children, std::string_view codeStr)
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

// ---- helpers: builtin-name set (tokens must be whitespace-stripped) ----
static bool IsBuiltinNameNoSpaceImpl(const std::string& s)
{
    static const std::set<std::string> kBuiltin = {
        "void","bool","char","wchar_t","char16_t","char32_t",
        "short","unsignedshort","int","unsignedint",
        "long","unsignedlong","longlong","unsignedlonglong",
        "float","double","longdouble"
    };
    return kBuiltin.count(s) != 0;
}

bool IsBuiltinNameNoSpace(const std::string& tokNoSpace)
{
    return IsBuiltinNameNoSpaceImpl(tokNoSpace);
}

json MakeMinimalTypeNodeFromToken(const std::string& tokNoSpace)
{
    if (IsBuiltinNameNoSpaceImpl(tokNoSpace)) {
        return json{
            {"kind","BuiltinType"},
            {"name", tokNoSpace},
            {"type", {{"qualType", tokNoSpace}}},
            {"inner", json::array()}
        };
    }
    return json{
        {"kind","TypeRef"},
        {"name", tokNoSpace},
        {"type", {{"qualType", tokNoSpace}}},
        {"inner", json::array()}
    };
}

std::vector<std::string>
ParseTemplateArgsAfterEqual(const std::string& codeRaw, const std::string& tplNameHint)
{
    // Strip all whitespace
    std::string s; s.reserve(codeRaw.size());
    for (char c : codeRaw) {
        if (!std::isspace(static_cast<unsigned char>(c))) {
            s.push_back(c);
        }
    }
    size_t eq = s.find('=');
    if (eq == std::string::npos) {
        return {};
    }
    size_t startSearch = eq + 1;
    size_t posName = std::string::npos;
    if (!tplNameHint.empty()) {
        posName = s.find(tplNameHint, startSearch);
    }
    size_t lt = (posName != std::string::npos) ? s.find('<', posName)
                                               : s.find('<', startSearch);
    if (lt == std::string::npos) {
        return {};
    }
    int depth = 0;
    size_t insideBeg = std::string::npos;
    size_t insideEnd = std::string::npos;
    for (size_t i = lt; i < s.size(); ++i) {
        if (s[i] == '<') {
            if (++depth == 1) {
                insideBeg = i + 1;
            }
        } else if (s[i] == '>') {
            if (--depth == 0) {
                insideEnd = i;
                break;
            }
        }
    }
    if (insideBeg == std::string::npos || insideEnd == std::string::npos || insideEnd <= insideBeg) {
        return {};
    }
    std::string inside = s.substr(insideBeg, insideEnd - insideBeg);
    std::vector<std::string> out;
    int d = 0; size_t seg = 0;
    for (size_t i = 0; i <= inside.size(); ++i) {
        if (i == inside.size() || (inside[i] == ',' && d == 0)) {
            std::string tok = inside.substr(seg, i - seg);
            if (!tok.empty()) {
                out.push_back(std::move(tok)); // token is already whitespace-stripped
            }
            seg = i + 1;
        } else if (inside[i] == '<') {
            ++d;
        } else if (inside[i] == '>') {
            --d;
        }
    }
    return out;
}


// RewriteTypeAliasTemplateArgs
// Purpose: When libclang omits template-argument children of a TypeAliasDecl
// (e.g., `using MyMap = std::map<int, T>;`), parse typeAliasDecl["code"] after
// '=' to extract the first top-level '<...>' list and append minimal arg nodes
// (BuiltinType for known builtins, TypeRef otherwise) after existing
// NamespaceRef/TemplateRef in `children`.
// Notes: Handles nested templates by depth counting; ignores non-type and
// template-template args (e.g., `4` in `std::array<int,4>` becomes a TypeRef).
// Requires a TemplateRef in `children`. Linear time in the code length.
void RewriteTypeAliasTemplateArgs(json& typeAliasDecl, json& children)
{
    // Get template name hint from existing TemplateRef
    std::string tplNameHint;
    for (const auto& e : children) {
        if (e.value("kind","") == "TemplateRef") {
            tplNameHint = e.value("name","");
            break;
        }
    }

    json newChildren = json::array();
    std::string codeStr = typeAliasDecl.value("code" ,"");
    if (tplNameHint.empty()) {
        size_t ind = codeStr.find("=");
        std::string tok = codeStr.substr(ind + 1);
        Trim(tok);
        newChildren.push_back(MakeMinimalTypeNodeFromToken(tok));
        children.swap(newChildren);
        return;
    }

    const auto toks = ParseTemplateArgsAfterEqual(codeStr, tplNameHint);
    if (toks.empty()) {
        return;
    }

    // Locate the TemplateRef position (usually after NamespaceRef("std"))
    size_t tplPos = children.size();
    for (size_t i = 0; i < children.size(); ++i)
        if (children[i].value("kind","") == "TemplateRef") {
            tplPos = i;
            break;
        }

    if (tplPos >= children.size()) {
        return;
    }

    for (size_t i = 0; i <= tplPos && i < children.size(); ++i) {
        newChildren.push_back(children[i]);  // keep NamespaceRef and TemplateRef
    }
    for (const auto& t : toks) {
        newChildren.push_back(MakeMinimalTypeNodeFromToken(t)); // append int / T, etc.
    }
    children.swap(newChildren);
}

// Merge the std of namespace and the T of typename into the name attribute of aliasTemplateDecl,
// The source code scenario is as follows:
// template<typename T>
// using MyMap = std::map<int, T>;
void mergeTypeAliasDeclChild(json& newChildren, json& children, json& parent)
{
    bool existNamespace = false;
    std::string templateName = "";
    for (int i = 0; i < children.size(); i++) {
        if (children[i]["kind"] == "NamespaceRef") {
            existNamespace = true;
            continue;
        }
        if (existNamespace && children[i]["kind"] == "TemplateRef") {
            std::string namespaceStr = children[i - 1]["name"]; // get name of NamespaceRef node
            std::string templateStr = children[i]["name"];
            templateName = namespaceStr + "::" + templateStr + "<";
            newChildren.push_back(children[i]);
            continue;
        }
        if (existNamespace) {
            templateName += children[i]["name"];
            if (i < children.size() - 1) {
                templateName += ", ";
            }
            continue;
        }
        newChildren.push_back(children[i]);
    }
    if(existNamespace) {
        newChildren[0]["name"] = templateName + ">";
        newChildren[0]["code"] = templateName + ">";
    }
}
