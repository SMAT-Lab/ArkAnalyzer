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