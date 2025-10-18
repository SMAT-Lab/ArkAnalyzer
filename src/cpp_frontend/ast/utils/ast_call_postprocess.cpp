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
#include <string_view>
#include <map>
#define TWO 2
#define THREE 3
#define FOUR 4
#define FIVE 5

bool IsParenWrapped(std::string_view s) noexcept
{
    return s.size() >= TWO && s.front() == '(' && s.back() == ')';
}

bool IsParenWrapped(const std::string& s) noexcept
{
    return IsParenWrapped(std::string_view{s});
}

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

// Fast, allocation-free check for the pattern of a simple *left* fold expression,
// i.e. "(... <op> <anything>)" after trimming ASCII whitespace.
//   - Accepts only the operators: +, -, *, /, &, |, ^
//   - Requires the string (after TrimView) to be fully parenthesized and to start with "(..."
//   - Skips ASCII spaces after "(..." and then expects a single operator
//   - On success, writes that operator to `opOut` and returns true
//   - On failure, returns false and leaves `opOut` unchanged
//   - This is a syntactic quick check: it does not validate the right-hand expression.
//   - Only ASCII whitespace (<= ' ') is skipped; no Unicode whitespace handling.
//   - Time: O(n) due to the initial trim; Space: O(1).
bool LooksLikeSimpleLeftFold(std::string_view s, char& opOut) noexcept
{
    const std::string_view t = TrimView(s);
    // Require a fully parenthesized expression: "( ... )"
    if (t.size() < FIVE || t.front() != '(' || t.back() != ')') {
        return false;
    }
    // Must start with the fold ellipsis: "(..."
    if (t.rfind("(...", 0) != 0) { // starts-with
        return false;
    }
    size_t i = 4; // skip "(..."
    while (i < t.size() && (unsigned char)t[i] <= ' ') {
        ++i;
    }
    if (i >= t.size()) {
        return false;
    }
    const char c = t[i];
    switch (c) {
        case '+': case '-': case '*': case '/':
        case '&': case '|': case '^':
            opOut = c;
            return true;
        default:
            return false;
    }
}


// ---- helpers: builtin-name set (tokens must be whitespace-stripped) ----
static bool IsBuiltinNameNoSpaceImpl(const std::string& s)
{
    static const std::set<std::string> kBuiltin = {
        "void", "bool", "char", "wchar_t", "char16_t", "char32_t",
        "short", "unsignedshort", "int", "unsignedint",
        "long", "unsignedlong", "longlong", "unsignedlonglong",
        "float", "double", "longdouble"
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
            {"kind", "BuiltinType"},
            {"name", tokNoSpace},
            {"type", {{"qualType", tokNoSpace}}},
            {"inner", json::array()}
        };
    }
    return json{
        {"kind", "TypeRef"},
        {"name", tokNoSpace},
        {"type", {{"qualType", tokNoSpace}}},
        {"inner", json::array()}
    };
}


static std::vector<std::string> SplitTopLevelTemplateArgs(std::string_view inside)
{
    std::vector<std::string> out;
    int depth = 0;
    size_t seg = 0;
    for (size_t i = 0; i <= inside.size(); ++i) {
        const bool end = (i == inside.size());
        if (end || (inside[i] == ',' && depth == 0)) {
            std::string tok(inside.substr(seg, i - seg));
            if (!tok.empty()) {
                out.push_back(std::move(tok));
            }
            seg = i + 1;
        } else if (inside[i] == '<') {
            ++depth;
        } else if (inside[i] == '>') {
            --depth;
        }
    }
    return out;
}

std::vector<std::string> ParseTemplateArgsAfterEqual(const std::string& codeRaw,
                                                     const std::string& tplNameHint)
{
    // Strip all whitespace
    std::string s;
    s.reserve(codeRaw.size());
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
    size_t lt = (posName != std::string::npos) ? s.find('<', posName) : s.find('<', startSearch);
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

    std::string_view inside = std::string_view{s}.substr(insideBeg, insideEnd - insideBeg);
    return SplitTopLevelTemplateArgs(inside);
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
        if (e.value("kind", "") == "TemplateRef") {
            tplNameHint = e.value("name", "");
            break;
        }
    }

    json newChildren = json::array();
    std::string codeStr = typeAliasDecl.value("code", "");
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
        if (children[i].value("kind", "") == "TemplateRef") {
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
    if (existNamespace) {
        newChildren[0]["name"] = templateName + ">";
        newChildren[0]["code"] = templateName + ">";
    }
}

// ---- IsClassLikeQualType ----
bool IsClassLikeQualType(const std::string& qt) noexcept
{
    if (qt.empty()) {
        return false;
    }
    if (qt == "<dependent type>") {
        return true;
    }
    static const std::set<std::string> kBuiltins = {
        "void", "bool", "char", "wchar_t", "char8_t", "char16_t", "char32_t",
        "signed char", "unsigned char", "short", "unsigned short", "int", "unsigned int",
        "long", "unsigned long", "long long", "unsigned long long",
        "float", "double", "long double"
    };
    if (kBuiltins.count(qt)) {
        return false;
    }
    // roughly exclude arrays/function pointers
    if (qt.find('[') != std::string::npos) {
        return false;
    }
    return true;
}

std::string StripTemplates(std::string s)
{
    int depth = 0;
    std::string out;
    out.reserve(s.size());
    for (char c : s) {
        if (c == '<') {
            ++depth;
            continue;
        }
        if (c == '>') {
            if (depth) {
                --depth;
                continue;
            }
        }
        if (depth == 0) {
            out.push_back(c);
        }
    }
    while (!out.empty() && std::isspace(static_cast<unsigned char>(out.back()))) {
        out.pop_back();
    }
    return out;
}

std::string ShortTypeNameFromQual(const std::string& qt)
{
    std::string base = StripTemplates(qt);
    size_t pos = base.find_last_of(':');
    return (pos == std::string::npos) ? base : base.substr(pos + 1);
}

bool LooksLikeParenInitNode(const json& n)
{
    const std::string k = n.value("kind", "");
    const std::string c = n.value("code", "");
    // Use only in the VarDecl context; avoid indiscriminately promoting
    // generic parenthesized expressions such as fold/cast nodes.
    if (k == "UnexposedExpr" || k == "ParenExpr" || k == "ImplicitCastExpr") {
        return (c.size() >= TWO && c.front() == '(' && c.back() == ')');
    }
    return false;
}

// ---- Restore parenthesized initialization in VarDecl to CXXConstructExpr ----
void RecoverCtorForVarDecl(json& varDecl)
{
    if (varDecl.value("kind", "") != "VarDecl") {
        return;
    }
    if (!varDecl.contains("inner") || !varDecl["inner"].is_array()) {
        return;
    }
    auto& inn = varDecl["inner"];
    if (inn.size() < TWO) {
        return;
    }
    const std::string qt  = varDecl["type"].value("qualType", "");
    const std::string viC = inn[1].value("code", "");

    if (!IsClassLikeQualType(qt)) {
        return;
    }
    // If the code may include surrounding whitespace, TrimView before checking parentheses.
    if (!IsParenWrapped(TrimView(viC))) {
        return;
    }

    json ctor = {
        {"kind", "CXXConstructExpr"},
        {"name", ShortTypeNameFromQual(qt)},
        {"type", {{"qualType", qt}}},
        {"valueCategory", "prvalue"}
    };

    if (inn[1].contains("inner") && inn[1]["inner"].is_array()) {
        ctor["inner"] = inn[1]["inner"];
    } else {
        ctor["inner"] = json::array({inn[1]});
    }

    ctor["code"] = ShortTypeNameFromQual(qt) + viC;
    if (inn[1].contains("range")) {
        ctor["range"] = inn[1]["range"];
    }

    inn[1] = std::move(ctor);
}

void patchFoldExpr(json &node)
{
    // Recurse into children first
    forEachChild(node, [&](json &child) { patchFoldExpr(child); });

    // Require both "code" and "kind"
    if (!node.contains("code") || !node.contains("kind")) {
        return;
    }
    const std::string k = node.value("kind", "");
    // Only transform these wrapper expression kinds
    if (k != "ImplicitCastExpr" && k != "UnexposedExpr" && k != "ParenExpr") {
        return;
    }

    const std::string code = node.value("code", "");
    char op = 0;
    // Fast-path detection of "(... <op> ident)"; leave unchanged if it doesn't match
    if (!LooksLikeSimpleLeftFold(code, op)) {
        return;
    }

    // Rewrite in place as CXXFoldExpr (preserve original type/range/inner/valueCategory)
    json inner = node.contains("inner") ? node["inner"] : json::array();
    json range = node.contains("range") ? node["range"] : json();
    json type = node.contains("type") ? node["type"] : json{{"qualType", "<dependent type>"}};
    std::string vc = node.value("valueCategory", "prvalue");

    node = {
        {"kind", "CXXFoldExpr"},
        {"op", std::string(1, op)},
        {"pattern", "left"},
        {"code", code},
        {"inner", inner},
        {"range", range},
        {"type", type},
        {"valueCategory", vc}
    };
}


// Build child node's range based on parent node
void buildNodeRange(json& node, json& parent)
{
    if (!node.contains("code") || node["code"].is_null() || node["code"] == "") {
        return;
    }
    if (!parent.contains("code") || parent["code"].is_null() || parent["code"] == "") {
        return;
    }
    if (!parent.contains("range") || parent["range"].is_null() || parent["range"] == json()) {
        return;
    }

    const std::string cCode = node["code"];
    const std::string pCode = parent["code"];

    const size_t index1 = pCode.find(cCode);
    if (index1 == std::string::npos) {
        return;
    }

    const json& pRange = parent["range"];
    const size_t baseOffset = static_cast<size_t>(pRange["begin"]["offset"]);

    const int startOffset = static_cast<int>(baseOffset + index1);
    const int endOffset = startOffset + static_cast<int>(cCode.size()) - 1;

    int startLine = pRange["begin"]["line"];
    int endLine = startLine;
    int startCol = pRange["begin"]["col"];
    int endCol = startCol;

    int curOffset = 0;
    int line = startLine;
    int col = startCol;

    for (size_t i = 0; i < pCode.size(); ++i) {
        if (curOffset == startOffset) {
            startLine = line;
            startCol = col;
        }
        if (curOffset == endOffset) {
            endLine = line;
            endCol = col;
            break;
        }

        if (pCode[i] == '\n') {
            ++line;
            col = 0;
        } else {
            ++col;
        }
        ++curOffset;
    }

    node["range"] = {
        {"begin", {{"line", startLine}, {"col", startCol}, {"offset", startOffset},
                   {"tokLen", endOffset - startOffset + 1}} },
        {"end", {{"line", endLine}, {"col", endCol}, {"offset", endOffset}} }
    };
}

// Recursively build typedef child nodes from a CXType
void buildTypedefChild(const CXType& type, json& newChildren, json& children, json& parent)
{
    CXString cxType = clang_getTypeSpelling(type);
    std::string typeStr = clang_getCString(cxType);
    clang_disposeString(cxType);
    json node = json::object();
    node["code"] = typeStr;
    node["name"] = typeStr;

    buildNodeRange(node, parent);

    json inner = json::array();

    if (type.kind == CXType_Pointer) {
        node["kind"] = "PointerType";
        node["type"]["qualType"] = typeStr;
        CXType pointee = clang_getPointeeType(type);
        buildTypedefChild(pointee, inner, children, node);
    } else if (type.kind == CXType_FunctionProto) {
        node["kind"] = "FunctionProtoType";
        CXType result = clang_getResultType(type);
        buildTypedefChild(result, inner, children, node);
        const size_t numArgs = children.size();
        for (size_t i = 0; i < numArgs; ++i) {
            inner.push_back(children[i]);
        }
    } else if (type.kind == CXType_Int || type.kind == CXType_Float || type.kind == CXType_Void) {
        node["kind"] = "BuiltinType";
        node["type"]["qualType"] = typeStr;
    } else {
        node["kind"] = "TypedefType";
        node["type"]["qualType"] = typeStr;
    }
    node["inner"] = std::move(inner);
    newChildren.push_back(std::move(node));
}

// Build CXXInheritedCtorInitExpr
json buildCXXInheritedCtorInitExpr(json &memberRef, json &children)
{
    children["kind"] = "CXXInheritedCtorInitExpr";
    children["type"] = memberRef["type"];
    json CXXCtor = json::object();
    CXXCtor["kind"] = "CXXCtorInitializer";
    CXXCtor["baseInit"] = memberRef["type"];
    json inner = json::array();
    inner.push_back(children);
    CXXCtor["inner"] = inner;
    return CXXCtor;
}

// Process parameter node types in constructor as CallExpr
void HandleCxxCtorInitializerOfCallExpr(nlohmann::json& child)
{
    if (!child.contains("inner") || !child["inner"].is_array() || child["inner"].empty()) {
        return;
    }
    auto& g0 = child["inner"][0];
    const std::string k = g0.value("kind", "");
    if (k == "ImplicitCastExpr" || k == "UnexposedExpr" || k == "ParenExpr") {
        // Lift the value-like wrapper
        child = g0;
    } else if (k == "DeclRefExpr") {
        // Normalize decl ref as a value-like node
        child["kind"] = "ImplicitCastExpr";
    }
}

// Build a minimal CXXCtorInitializer for `member(arg)`.
// - Sets anyInit (FieldDecl) from memberRef
// - Puts arg as the single child in `inner`
// - Synthesizes `code` as "<member>(<arg>)" (strips one pair of outer parens)
// - Calls buildNodeRange(ctor, parent) to fill `range` when possible
nlohmann::json buildCXXCtorInitializer(nlohmann::json& memberRef, nlohmann::json& arg, nlohmann::json& parent)
{
    nlohmann::json ctor;
    ctor["kind"] = "CXXCtorInitializer";
    ctor["anyInit"] = {{"kind", "FieldDecl"}, {"name", memberRef["name"]}, {"type", memberRef["type"]}};

    nlohmann::json argNode = arg;
    nlohmann::json inner = nlohmann::json::array();
    inner.push_back(argNode);
    ctor["inner"] = std::move(inner);
    const std::string base = memberRef.value("code", "");
    std::string argCode = argNode.value("code", "");
    if (argCode.size() >= TWO && argCode.front() == '(' && argCode.back() == ')') {
        argCode = argCode.substr(1, argCode.size() - TWO);
    }
    ctor["code"] = base + "(" + argCode + ")";

    buildNodeRange(ctor, parent);
    return ctor;
}

// Add variable initialization nodes for constructor
nlohmann::json addCXXCtorInitializer(nlohmann::json& children,
                                     nlohmann::json& parent)
{
    nlohmann::json out = nlohmann::json::array();
    nlohmann::json memberRef = nullptr;
    nlohmann::json pendingArg = nullptr;
    constexpr bool kEnableReversePair = true;
    auto isValueLike = [](const std::string& k) {
        return k == "ImplicitCastExpr" || k == "UnexposedExpr" || k == "ParenExpr" ||
               k == "IntegerLiteral"   || k == "StringLiteral" || k == "CharacterLiteral" ||
               k == "FloatingLiteral";
    };
    for (int i = 0; i < static_cast<int>(children.size()); ++i) {
        std::string k = children[i].value("kind", "");
        const std::string c = children[i].value("code", "");
        if (k == "MemberRef" || k == "TypeRef") {
            memberRef = children[i];
            // Reverse pairing: value before field
            if (kEnableReversePair && !pendingArg.is_null()) {
                out.push_back(buildCXXCtorInitializer(memberRef, pendingArg, parent));
                memberRef = nullptr;
                pendingArg = nullptr;
            }
            continue;
        }
        if (k == "CallExpr") {
            HandleCxxCtorInitializerOfCallExpr(children[i]);
            k = children[i].value("kind", "");
        }
        if (isValueLike(k)) {
            if (!memberRef.is_null()) {
                out.push_back(buildCXXCtorInitializer(memberRef, children[i], parent));
                memberRef = nullptr;
                continue;
            }
            if (kEnableReversePair) {
                pendingArg = children[i];
                continue;
            }
            out.push_back(children[i]);
            continue;
        }

        if (k == "OverloadedDeclRef") {
            if (!memberRef.is_null()) {
                out.push_back(buildCXXInheritedCtorInitExpr(memberRef, children[i]));
                memberRef = nullptr;
            } else {
                out.push_back(children[i]);
            }
            continue;
        }
        out.push_back(children[i]);
    }
    return out;
}

inline bool IsBindingNameNode(const json& c)
{
    const std::string ck = c.value("kind", "");
    const std::string cn = c.value("name", "");
    if (cn.empty() || (!cn.empty() && cn.front() == '[')) {
        return false;
    }
    return (ck == "UnexposedDecl" || ck == "BindingDecl");
}

// 初始化器/表达式结点：后缀 "Expr" 或常见包裹层
inline bool IsExprLikeKind(std::string_view ck)
{
    const auto n = ck.size();
    const bool endsWithExpr = (n >= FOUR && ck.rfind("Expr") == n - FOUR);
    return endsWithExpr || ck == "MaterializeTemporaryExpr" || ck == "ExprWithCleanups";
}

// 小工具：string_view 查找
inline bool SvFind(std::string_view s, std::string_view pat) noexcept
{
    return s.find(pat) != std::string_view::npos;
}

// tuple-like 类型识别（大小写敏感；标准库实现通常小写）
inline bool IsTupleLikeType(std::string_view qt) noexcept
{
    return SvFind(qt, "std::pair<")  || SvFind(qt, "pair<")  ||
           SvFind(qt, "std::tuple<") || SvFind(qt, "tuple<") ||
           SvFind(qt, "std::array<") || SvFind(qt, "array<") ||
           SvFind(qt, "initializer_list<");
}

// 粗略数组类型（T[N]）
inline bool LooksArrayType(const std::string& qt)
{
    return qt.find('[') != std::string::npos && qt.find(']') != std::string::npos;
}

// 统计 "[a, b , c]" 中的名字个数：用 string_view 单扫
int CountBindingsInBrackets(std::string_view s) noexcept
{
    if (s.size() >= TWO && s.front() == '[' && s.back() == ']') {
        s.remove_prefix(1);
        s.remove_suffix(1);
    }
    int cnt = 0;
    size_t i = 0;
    size_t n = s.size();
    while (i < n) {
        // 跳前导空白
        while (i < n && (s[i]==' ' || s[i]=='\t' || s[i]=='\n' || s[i]=='\r')) {
            ++i;
        }
        // 读到 ',' 或结尾
        size_t j = i;
        while (j < n && s[j] != ',') {
            ++j;
        }
        // 去 token 尾空白
        size_t end = j;
        while (end > i && (s[end-1]==' ' || s[end-1]=='\t' || s[end-1]=='\n' || s[end-1]=='\r')) {
            --end;
        }
        if (end > i) {
            ++cnt; // 非空 token 计数
        }
        i = (j < n ? j + 1 : j); // 跳过逗号
    }
    return cnt;
}

// 规整类型名（去 const/volatile/struct/class 与末尾 & * 空格）
std::string NormalizeTypeName(std::string qt)
{
    auto stripPrefix = [](std::string& s, std::string_view p) {
        if (s.size() >= p.size() && s.compare(0, p.size(), p) == 0) {
            s.erase(0, p.size());
        }
    };
    // Trim 两端空白
    while (!qt.empty() && (qt.front() == ' ' || qt.front() == '\t' || qt.front() == '\n' || qt.front() == '\r')) {
        qt.erase(qt.begin());
    }
    while (!qt.empty() && (qt.back () == ' ' || qt.back () == '\t' || qt.back() == '\n' || qt.back() == '\r')) {
        qt.pop_back();
    }
    stripPrefix(qt, "const ");
    stripPrefix(qt, "volatile ");
    stripPrefix(qt, "struct ");
    stripPrefix(qt, "class ");
    while (!qt.empty() && (qt.back() == '&' || qt.back() == '*' || qt.back() == ' ')) {
        qt.pop_back();
    }
    return qt;
}

// 派生的 Record 信息里查字段数是否足够
bool IsAggregateRecordWithEnoughFields(const std::string& qt,
                                       int need,
                                       const std::map<std::string,
                                       json>& derivedDataTypeMap)
{
    if (qt.empty()) {
        return false;
    }
    const std::string key = NormalizeTypeName(qt);
    auto it = derivedDataTypeMap.find(key);
    if (it == derivedDataTypeMap.end()) {
        return false;
    }
    const json& rec = it->second;
    if (rec.value("kind", "") != "CXXRecordDecl") {
        return false;
    }
    if (!rec.contains("inner") || !rec["inner"].is_array()) {
        return false;
    }
    int fieldCnt = 0;
    for (const auto& mem : rec["inner"]) {
        if (mem.value("kind", "") == "FieldDecl") {
            ++fieldCnt;
        }
    }
    return fieldCnt >= need && fieldCnt > 0;
}

/**
 * @brief 累加单个子节点的统计信息，用于 DecompositionDecl 判定阶段的一次遍历。
 * 语义（与原循环等价）：
 *  1) 若该子节点是绑定名（BindingDecl 候选），则 bindCnt++；
 *  2) 若该子节点是“表达式样”结点（末尾为 "Expr" 或常见包裹层），则 exprCnt++；
 *     - 同时若还未记录初始化器的类型串（initQualType 为空），尝试从 c["type"]["qualType"] 取一次；
 *  3) 若该子节点类型串里包含 std::tuple_element<> / tuple_element<>，则 anyTupleElementType = true；
 * @param c  单个子节点 JSON（只读，不修改）
 * @param bindCnt  输出/累加：绑定名计数
 * @param exprCnt  输出/累加：表达式样结点计数
 * @param anyTupleElementType 输出/累加：是否出现过 tuple_element<> 类型迹象（任一命中即置 true）
 * @param initQualType 输出/设置：首次遇到表达式样结点时记录其 type.qualType（若已非空则不再改写）
 */
void AccumulateChildStats(const json& c,
                          int& bindCnt,
                          int& exprCnt,
                          bool& anyTupleElementType,
                          std::string& initQualType) noexcept
{
    const std::string ck = c.value("kind", "");
    if (IsBindingNameNode(c)) {
        ++bindCnt;
    }
    if (IsExprLikeKind(ck)) {
        ++exprCnt;
        if (initQualType.empty()) {
            if (auto it = c.find("type"); it != c.end() && it->is_object()) {
                initQualType = it->value("qualType", "");
            }
        }
    }
    if (auto it = c.find("type"); it != c.end() && it->is_object()) {
        const std::string bqt = it->value("qualType", "");
        if (bqt.find("std::tuple_element<") != std::string::npos || bqt.find("tuple_element<") != std::string::npos) {
            anyTupleElementType = true;
        }
    }
}

/**
 * TryNormalizeDecompositionDecl
 * ------------------------------------------------------------
 * 解决的源码场景（libclang 19.x 无 CXCursor_DecompositionDecl/BindingDecl）：
 *
 *  1) tuple/pair 解构：
 *      auto [x, y] = std::make_pair(1, 2);
 *      auto [a, b] = std::pair{3, 4};
 *
 *     在我们当前的 JSON AST 中通常呈现为（父/子节点都被标成 UnexposedDecl）：
 *       DeclStmt
 *         └─ UnexposedDecl name="[x, y]"          ← 本函数要“正名”的父节点
 *             ├─ UnexposedDecl name="x"           ← 绑定名（将被改成 BindingDecl）
 *             ├─ UnexposedDecl name="y"           ← 绑定名（将被改成 BindingDecl）
 *             └─ …（CallExpr / MaterializeTemporaryExpr / ExprWithCleanups 等初始化器）
 *
 *  2) 结构体聚合解构（aggregate structured binding）：
 *      struct Person { std::string name; int age; double salary; };
 *      Person person{"Bob", 30, 50000.0};
 *      auto [name, age, salary] = person;
 *
 *     在 JSON AST 中通常呈现为：
 *       DeclStmt
 *         └─ UnexposedDecl name="[name, age, salary]"
 *             ├─ UnexposedDecl name="name"
 *             ├─ UnexposedDecl name="age"
 *             ├─ UnexposedDecl name="salary"
 *             └─ DeclRefExpr name="person" type="Person"    ← 初始化器（引用变量）
 *
 *  目标：
 *    - 把父节点 UnexposedDecl 正名为 DecompositionDecl；
 *    - 把子节点中的“绑定名”正名为 BindingDecl，并附上 bindingIndex（从左到右：0,1,2,...）。
 *
 *  判断依据（综合启发式 + 类型证据），对应 JSON 关键片段：
 *    - node.kind == "UnexposedDecl" 且 node.name 形如 "[x, y, ...]"。
 *    - children 内：至少一个“绑定名”结点（UnexposedDecl/BindingDecl，且 name 是标识符），
 *                   至少一个“初始化器”表达式（kind 以 "Expr" 结尾，或 MaterializeTemporaryExpr / ExprWithCleanups）。
 *    - 类型侧证据三选一：
 *        (A) 父类型/初始化器类型是 tuple-like（pair/tuple/array/initializer_list）或数组 T[N]；
 *        (B) 绑定名类型出现 tuple_element<k, T>::type 的模式；
 *        (C) 初始化器/父类型可在 derivedDataTypeMap 中命中一个 CXXRecordDecl，
 *            且其 FieldDecl 数量 >= 绑定名个数（判定为结构体聚合解构）。
 *
 *  注意：
 *    - 本函数必须在 nodePostprocess(...) 的最前面调用；
 *      此时子结点仍在形参 `children` 中，还未 swap 到 node["inner"]。
 * @param[in,out] node
 *   待判定与可能被“正名”的父结点 JSON。
 *   - 输入：要求 `node.kind`、`node.name` 等字段可读，`node.type.qualType`（若有）可读；
 *   - 输出：若命中，`node.kind` 将被设置为 `"DecompositionDecl"`。
 *
 * @param[in,out] children
 *   `node` 的子结点数组（JSON array）。
 *   - 输入：遍历读取每个子结点的 `kind`、`name`、`type.qualType`；
 *   - 输出：对被识别为绑定名的子结点，写入 `kind="BindingDecl"` 与 `bindingIndex` 序号。
 *
 * @param[in] derivedDataTypeMap
 *   由“规整后的类型名”映射到派生到的类型定义 JSON（通常为 `CXXRecordDecl`）的查表。
 *   - 用途：判断某些初始化器/父类型是否为“聚合记录体”且字段数 ≥ 绑定个数；
 */
bool TryNormalizeDecompositionDecl(json& node, json& children, const std::map<std::string, json>& derivedDataTypeMap)
{
    // ---------- 0) 父节点的快速筛选 ----------
    const std::string kind = node.value("kind", "");
    if (kind != "UnexposedDecl") {
        return false;
    }
    const std::string nm = node.value("name", ""); // 例如 "[x, y]" 或 "[name, age, salary]"
    if (nm.size() < TWO || nm.front() != '[' || nm.back() != ']') {
        return false;
    }
    if (!children.is_array()) {
        return false;
    }
    // ---------- 2) 单次遍历 children ----------
    int bindCnt = 0;
    int exprCnt = 0;
    bool anyTupleElementType = false;
    std::string initQualType;
    for (const auto& c : children) {
        AccumulateChildStats(c, bindCnt, exprCnt, anyTupleElementType, initQualType);
    }
    // ---------- 3) 语法/形态侧 ----------
    if (bindCnt < 1) {
        return false;
    }
    if (exprCnt < 1) {
        return false;
    }
    const int namesInBracket = CountBindingsInBrackets(std::string_view(nm));
    if (namesInBracket > 0 && bindCnt > 0 && namesInBracket != bindCnt) {
        return false;
    }
    // ---------- 4) 类型侧 ----------
    const std::string parentQT = node.contains("type") ? node["type"].value("qualType", "") : "";
    const bool tupleLikeByParent = IsTupleLikeType(parentQT) || LooksArrayType(parentQT);
    const bool tupleLikeByInit = IsTupleLikeType(initQualType) || LooksArrayType(initQualType);
    const bool aggregateByInit = IsAggregateRecordWithEnoughFields(initQualType, bindCnt, derivedDataTypeMap);
    const bool aggregateByParent = IsAggregateRecordWithEnoughFields(parentQT, bindCnt, derivedDataTypeMap);
    if (!tupleLikeByParent && !tupleLikeByInit && !aggregateByInit && !aggregateByParent && !anyTupleElementType) {
        return false;
    }
    // ---------- 5) 命中：执行正名 ----------
    node["kind"] = "DecompositionDecl";
    int idx = 0;
    for (auto& c : children) {
        if (IsBindingNameNode(c)) {
            c["kind"] = "BindingDecl";
            c["bindingIndex"] = idx++;
        }
    }
    return true;
}

// Fix for std::pair's map InitListExpr
void fixMapPairInitListChildren(json &children, const std::string &typeStr)
{
    for (auto &child:children) {
        if (child["kind"] == "InitListExpr" && child["type"]["qualType"] == "void") {
            child["type"]["qualType"] = typeStr.substr(0, typeStr.find('['));
            child["kind"] = "CXXConstructExpr";
        }
    }
}

void fillMemberExprName(json& node)
{
    if (node["name"] != "") {
        return;
    }
    std::string codeStr = node["code"];
    size_t index1 = codeStr.find("->");
    size_t index2 = codeStr.find(".");
    size_t index = 0;
    if (index1 == std::string::npos && index2 == std::string::npos) {
        return;
    } else if (index1 != std::string::npos && index2 != std::string::npos) {
        index = index1 < index2 ? index1 + TWO : index2 + 1; // 去掉成员访问符的长度
    } else {
        index = index1 != std::string::npos ? index1 + TWO : index2 + 1;
    }
    size_t index3 = codeStr.find("(");
    if (index3 != std::string::npos) {
        node["name"] = codeStr.substr(index, index3 - index);
    } else {
        node["name"] = codeStr.substr(index);
    }
}

// Modify class declaration node type under typedef to constructorExpr
void updateTypedefClassConstructor(json& children)
{
    if (children.size() < TWO || (children[0]["kind"] != "TypeRef" && children[1]["kind"] != "CallExpr")) {
        return;
    }
    if (children[0]["type"]["qualType"] == children[1]["type"]["qualType"] && (children[1]["name"] == "map" ||
        children[1]["name"] == "unordered_map")) {
            children[1]["kind"] = "CXXConstructExpr";
        }
}

// decltype type deduction
void deduceDecltype(json& node, json&children)
{
    if (children.size() == 0 || !node.contains("type") ||
        node["type"].value("qualType", "").find("decltype(") == std::string::npos) {
        return;
    }
    if (children[0].contains("type")) {
        node["type"]["qualType"] = children[0]["type"]["qualType"];
    }
}

// Determine fallback kind from code string
inline bool fillKindBycode(json &node, const std::string &codeStr,
                           const std::string &prefix, const std::string &kind,
                           const std::string &argField = "")
{
    size_t pos = codeStr.find(prefix + "(");
    if (pos != std::string::npos && pos == 0) {
        node["kind"] = kind;
        if (!argField.empty()) {
            node[argField] = ExtractParentContent(codeStr, codeStr.find('(', pos));
        }
        return true;
    }
    return false;
}

// Check and supplement array trait typeid noexpect
void detectAndFillSpecialKind(json &node)
{
    if (!node.contains("code")) {
        return;
    }
    std::string codeStr = node["code"];
    // __arra_rank/extent
    static const std::vector<std::pair<std::string, std::string>> traitFuncs = {
        {"__array_rank", "ArrayTypeTraitExpr"}, {"__array_extent", "ArrayTypeTraitExpr"},
        {"__array_rank_u", "ArrayTypeTraitExpr"}, {"__array_extent_u", "ArrayTypeTraitExpr"}
    };
    for (const auto &[func, kind]: traitFuncs) {
        if (fillKindBycode(node, codeStr, func, kind, "traitArgs")) {
            node["traitFunc"] = func;
            break;
        }
    }
    // noexcept(expr)
    fillKindBycode(node, codeStr, "noexcept", "CXXNoexceptExpr", "noexceptArg");
    // typeid(expr)
    fillKindBycode(node, codeStr, "typeid", "CXXTypeidExpr", "typeArg");
}

// Construct default type node for template function
json buildTemplateDefaultType(const std::string& codeStr)
{
    auto eq = codeStr.find('=');
    std::string typeStr = eq == std::string::npos ? "" : codeStr.substr(eq + 1);
    typeStr.erase(std::remove(typeStr.begin(), typeStr.end(), ' '), typeStr.end());
    if (IsBuiltInType(typeStr))
        return {{"kind", "BuildInType"}, {"type", {{"qualType", typeStr}}}, {"inner", json::array()}};

    json recordNode = {{"kind", "RecordType"}, {"type", {{"qualType", typeStr}}}};
    json elaboratedNode = {{"kind", "ElaboratedType"}, {"type", {{"qualType", typeStr}}}, {"inner", {recordNode}}};
    return {{"kind", "TemplateArgument"}, {"type", {{"qualType", typeStr}}}, {"inner", {elaboratedNode}}};
}

// Recursively extract all dimensions of IntegerLiteral, supporting multi-level ImplicitCastExpr nesting
void extractArraySizes(const json &node, std::vector<std::string> &arraySizes)
{
    if (node.contains("kind")) {
        if (node["kind"] == "IntegerLiteral" && node.contains("value")) {
            arraySizes.push_back(node["value"]);
        } else if (node["kind"] == "ImplicitCastExpr" && node.contains("inner")) {
            forEachChild(const_cast<json&>(node), [&](json &gchild) { extractArraySizes(gchild, arraySizes); });
        }
    }
}

void annotateNewExprArrayInfo(json &node, const json &children)
{
    bool isArray = false;
    std::vector<std::string> arraySizes;
    for (const auto &child:children) {
        extractArraySizes(child, arraySizes);
    }
    std::string codeStr = node["code"];
    if (!arraySizes.empty() && codeStr.find("[") != std::string::npos && codeStr.find("]") != std::string::npos) {
        isArray = true;
        std::reverse(arraySizes.begin(), arraySizes.end());
        node["arraySizes"] = arraySizes;
    }
    node["isArray"] = isArray;
}

void annotateMemberExprIsArrow(json &node)
{
    if (node.contains("code")) {
        std::string codeStr = node["code"];
        node["isArrow"] = (codeStr.find("->") != std::string::npos);
    }
}

void postprocessCallExpr(json& node)
{
    // Extract name from DeclRef/OverloadedDeclRef node; if empty, use referencedDecl.name
    auto nameFromDeclRef = [](const json& n) -> std::string {
        std::string n1 = n.value("name", "");
        if (n1.empty() && n.contains("referencedDecl")) {
            return n["referencedDecl"].value("name", "");
        }
        return n1;
    };
    // Look for the first OverloadedDeclRef name in a child's inner
    auto findOverloadedNameIn = [](const json& parent) -> std::string {
        if (!parent.contains("inner") || parent["inner"].empty()) return "";
        for (const auto& gc : parent["inner"]) {
            if (gc.contains("kind") && gc["kind"] == "OverloadedDeclRef") {
                return gc.value("name", "");
            }
        }
        return "";
    };
    // ---------- Complete name ----------
    const bool missingName = !node.contains("name") || node["name"].is_null() || node["name"] == "";
    const bool hasChildren = node.contains("inner") && !node["inner"].empty();
    if (missingName && hasChildren) {
        for (const auto& child : node["inner"]) {
            const bool isDeclRef = child.contains("kind") &&
            (child["kind"] == "DeclRefExpr" || child["kind"] == "OverloadedDeclRef");
            if (isDeclRef) {
                node["name"] = nameFromDeclRef(child);
                break;
            }
            const std::string cand = findOverloadedNameIn(child);
            if (!cand.empty()) {
                node["name"] = cand;
            }
        }
    }
    // ---------- Identify AtomicCallExpr  ----------
    static const std::vector<std::string> kAtomicFuncs = {
        "atomic_fetch_add", "atomic_fetch_sub", "atomic_fetch_and", "atomic_fetch_or",
        "atomic_fetch_xor", "atomic_exchange", "atomic_load", "atomic_store",
        "atomic_compare_exchange"
    };
    if (!node.contains("name") || node["name"].is_null()) {
        return;
    }
    const std::string name = node["name"];
    if (std::find(kAtomicFuncs.begin(), kAtomicFuncs.end(), name) == kAtomicFuncs.end()) {
        return;
    }

    node["kind"] = "AtomicCallExpr";
    node["atomicFunc"] = name;
}

static inline bool KindIs(const json& n, std::string_view k) noexcept
{
    return n.contains("kind") && n["kind"].is_string() && n["kind"].get_ref<const std::string&>() == k;
}

static inline bool KindIn(const json& n, std::initializer_list<std::string_view> ks) noexcept
{
    if (!n.contains("kind") || !n["kind"].is_string()) {
        return false;
    }
    const auto& s = n["kind"].get_ref<const std::string&>();
    for (auto kk : ks) {
        if (s == kk) {
            return true;
        }
    }
    return false;
}

// Determine if it is an inherited parent class constructor
bool isUsingInheritClass(json& node, json& children, const std::map<std::string, json>& derivedDataTypeMap)
{
    if (children.size() == 0) {
        return false;
    }
    if (children[0]["kind"] == "TypeRef" && children[0].contains("type")) {
        std::string type = children[0]["type"].value("qualType", "");
        if (derivedDataTypeMap.count(type)) {
            return true;
        }
    }
    return false;
}

std::string getMemberInClassName(CXCursor cursor)
{
    CXCursor parentCursor = clang_getCursorSemanticParent(cursor);
    CXCursorKind kind = clang_getCursorKind(parentCursor);
    if (kind != CXCursor_ClassDecl && kind != CXCursor_StructDecl) {
        return "";
    }
    return Cx2Str(clang_getCursorSpelling(parentCursor));
}

void phasePreNormalize(json& node,
                       CXCursor cursor,
                       CXCursorKind kind_cursor,
                       json& children,
                       const std::map<std::string, json>& derivedDataTypeMap)
{
    if (kind_cursor == CXCursor_UnexposedDecl) {
        TryNormalizeDecompositionDecl(node, children, derivedDataTypeMap);
    }
    // Using 继承构造 -> 构造声明
    if (KindIs(node, "UsingDecl") && isUsingInheritClass(node, children, derivedDataTypeMap)) {
        node["kind"] = "CXXConstructorDecl";
        node["mangledName"] = getMemberInClassName(cursor);
    }
}
