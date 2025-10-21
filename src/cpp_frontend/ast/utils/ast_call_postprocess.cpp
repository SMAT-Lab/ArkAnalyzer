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
#define THIRTYTWO 32

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
enum class FoldPattern { LEFT, RIGHT }; // Left: (... op pack) ; Right: (pack op ...)

// Try to match a left fold: "(... OP expr)" and return OP via opOut.
// Precondition: t is already trimmed and starts with '(' and ends with ')'.
static bool TryDetectLeftFold(std::string_view t, char& opOut) noexcept
{
    // Must start with "(..."
    if (t.rfind("(...", 0) != 0) {
        return false;
    }
    size_t i = FOUR; // skip "(..."
    while (i < t.size() && static_cast<unsigned char>(t[i]) <= ' ') {
        ++i; // skip whitespace
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

// Try to match a right fold: "(expr OP ...)" and return OP via opOut.
// Precondition: t is already trimmed and starts with '(' and ends with ')'.
static bool TryDetectRightFold(std::string_view t, char& opOut) noexcept
{
    // Must end with "...)"
    if (t.size() < FOUR || t.substr(t.size() - FOUR) != "...)") {
        return false;
    }
    size_t i = t.size() - FOUR; // points to the beginning of "..."
    while (i > 0 && static_cast<unsigned char>(t[i - 1]) <= ' ') {
        --i; // skip whitespace to the left
    }
    if (i == 0) {
        return false;
    }
    const char c = t[i - 1]; // operator should be right before "..."
    switch (c) {
        case '+': case '-': case '*': case '/':
        case '&': case '|': case '^':
            opOut = c;
            return true;
        default:
            return false;
    }
}

// Unified detection for simple fold expressions: returns true if either left or right fold matches,
// and writes the operator symbol (opOut) and fold pattern (patternOut).
bool LooksLikeSimpleFold(std::string_view s, char& opOut, FoldPattern& patternOut) noexcept
{
    opOut = 0;
    const std::string_view t = TrimView(s);
    // Must be fully parenthesized "( ... )"
    if (t.size() < FIVE || t.front() != '(' || t.back() != ')') {
        return false;
    }
    // Left fold: "(... OP expr)"
    if (TryDetectLeftFold(t, opOut)) {
        patternOut = FoldPattern::LEFT;
        return true;
    }
    // Right fold: "(expr OP ...)"
    if (TryDetectRightFold(t, opOut)) {
        patternOut = FoldPattern::RIGHT;
        return true;
    }
    return false;
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

/**
 * @brief Detects and rewrites “simple fold expressions (C++17 fold expressions)”
 *        wrapper nodes into `CXXFoldExpr`.
 * Supported source patterns (must be *fully parenthesized*, whitespace-insensitive;
 * only single-character operators are recognized):
 *   1) Left fold (following existing naming convention):
 *        (... + args)      →  pattern: "left",  op: "+"
 *      Other recognized single-character operators: + - * / & | ^
 *
 *   2) Right fold:
 *        (args + ...)      →  pattern: "right", op: "+"
 *      Other recognized single-character operators are the same as above.
 * Trigger conditions (all must be met for rewriting to occur; otherwise, no change):
 *   - node.kind ∈ { "ImplicitCastExpr", "UnexposedExpr", "ParenExpr" }
 *   - node.code exists, and LooksLikeSimpleFold(code, op, pattern) returns true
 *   - The code string must be *fully wrapped in parentheses*, i.e., "( ... )"
 *   - Left fold requires the code to start with "(..."; right fold requires it to end with "...)"
 * Rewrite behavior:
 *   - node.kind        ← "CXXFoldExpr"
 *   - node.op          ← operator symbol (string, currently single-character)
 *   - node.pattern     ← "left" | "right"
 *   - Preserve original node.code / node.inner / node.range / node.type / node.valueCategory
 *     (if node.type is missing, fill with `{ "qualType": "<dependent type>" }`)
 * Example input/output:
 *   Source: return (... + args);
 *   Before: { "kind":"UnexposedExpr", "code":"(... + args)", "inner":[{ "kind":"DeclRefExpr","name":"args"}], ... }
 *   After:  {
 *              "kind":"CXXFoldExpr", "op":"+", "pattern":"left",
 *              "code":"(... + args)", "inner":[{ "kind":"DeclRefExpr","name":"args"}], ...
 *           }
 *   Source: return (args + ...);
 *   After:  { "kind":"CXXFoldExpr", "op":"+", "pattern":"right", "code":"(args + ...)", ... }
 * Design decisions and limitations:
 *   - Only detects *simple* fold expressions: single-character operators (+ - * / & | ^),
 *     not multi-character ones like << >> && ||.
 *   - Must be strictly parenthesized at the outermost level; nested folds require extending LooksLikeSimpleFold.
 *   - Relies on string pattern matching; robust to inserted spaces via Trim and boundary checks.
 *     If future requirements include preserving whitespace/comments, ensure TrySliceFromCache is used when possible.
 *   - Division of responsibility with handleUnexposedExpr:
 *     this function converts UnexposedExpr → CXXFoldExpr during the nodePostprocess phase.
 */
void patchFoldExpr(json &node)
{
    forEachChild(node, [&](json &child) { patchFoldExpr(child); });
    if (!node.contains("code") || !node.contains("kind")) {
        return;
    }
    const std::string k = node.value("kind", "");
    if (k != "ImplicitCastExpr" && k != "UnexposedExpr" && k != "ParenExpr") {
        return;
    }
    const std::string code = node.value("code", "");
    char op = 0;
    FoldPattern pat;
    if (!LooksLikeSimpleFold(code, op, pat)) {
        return;
    }
    json inner = node.contains("inner") ? node["inner"] : json::array();
    json range = node.contains("range") ? node["range"] : json();
    json type  = node.contains("type") ? node["type"] : json{{"qualType", "<dependent type>"}};
    std::string vc = node.value("valueCategory", "prvalue");
    node = {
        {"kind", "CXXFoldExpr"},
        {"op", std::string(1, op)},
        {"pattern", (pat == FoldPattern::LEFT ? "left" : "right")},
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

// Initializer or expression-like node: ends with "Expr" or matches common wrapper kinds
inline bool IsExprLikeKind(std::string_view ck)
{
    const auto n = ck.size();
    const bool endsWithExpr = (n >= FOUR && ck.rfind("Expr") == n - FOUR);
    return endsWithExpr || ck == "MaterializeTemporaryExpr" || ck == "ExprWithCleanups";
}

// Utility: check if a substring exists in a string_view
inline bool SvFind(std::string_view s, std::string_view pat) noexcept
{
    return s.find(pat) != std::string_view::npos;
}

// Identify tuple-like types (case-sensitive; standard library names are usually lowercase)
inline bool IsTupleLikeType(std::string_view qt) noexcept
{
    return SvFind(qt, "std::pair<")  || SvFind(qt, "pair<")  || SvFind(qt, "std::tuple<") || SvFind(qt, "tuple<") ||
           SvFind(qt, "std::array<") || SvFind(qt, "array<") || SvFind(qt, "initializer_list<");
}

// Rough check for array-like types (pattern T[N])
inline bool LooksArrayType(const std::string& qt)
{
    return qt.find('[') != std::string::npos && qt.find(']') != std::string::npos;
}

// Count the number of names inside a bracketed list like "[a, b, c]" using a single pass over string_view
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
        // Skip leading whitespace
        while (i < n && (s[i] == ' ' || s[i] == '\t' || s[i] == '\n' || s[i] == '\r')) {
            ++i;
        }
        // Read until ',' or end of string
        size_t j = i;
        while (j < n && s[j] != ',') {
            ++j;
        }
        // Trim trailing whitespace in token
        size_t end = j;
        while (end > i && (s[end - 1] == ' ' || s[end - 1] == '\t' || s[end - 1] == '\n' || s[end - 1] == '\r')) {
            --end;
        }
        if (end > i) {
            ++cnt; // Count non-empty token
        }
        i = (j < n ? j + 1 : j); // Skip comma
    }
    return cnt;
}

// Normalize the type name by removing const/volatile/struct/class keywords and trimming trailing &, *, and whitespace
std::string NormalizeTypeName(std::string qt)
{
    auto stripPrefix = [](std::string& s, std::string_view p) {
        if (s.size() >= p.size() && s.compare(0, p.size(), p) == 0) {
            s.erase(0, p.size());
        }
    };
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

// Check whether the derived Record information contains enough fields
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
 * @brief Accumulate statistics for a single child node during the DecompositionDecl detection pass.
 * Semantics (equivalent to the original loop logic):
 *  1) If the child node represents a binding name (BindingDecl candidate),
 *     increment bindCnt.
 *  2) If the child node represents an "expression-like" node
 *     (kind ends with "Expr" or is a common wrapper type),
 *     increment exprCnt.
 *  3) If the child's type string contains "std::tuple_element<>" or "tuple_element<>", set anyTupleElementType = true.
 * @param c                  Input: a single child node in JSON (read-only, not modified)
 * @param bindCnt            Output/accumulator: count of binding name nodes
 * @param exprCnt            Output/accumulator: count of expression-like nodes
 * @param anyTupleElementType Output/accumulator: flag indicating whether any node
 *                            has a tuple_element<> type (set to true once matched)
 * @param initQualType       Output/set-once: records the first encountered expression node’s
 *                            type.qualType (ignored if already non-empty)
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
 * Problem context (libclang 19.x does not expose CXCursor_DecompositionDecl / BindingDecl):
 *
 *  1) Tuple / pair decomposition:
 *      auto [x, y] = std::make_pair(1, 2);
 *      auto [a, b] = std::pair{3, 4};
 *
 *     In our current JSON AST, this usually appears as (both parent/child nodes marked as UnexposedDecl):
 *       DeclStmt
 *         └─ UnexposedDecl name="[x, y]"          ← parent node to be renamed by this function
 *             ├─ UnexposedDecl name="x"           ← binding name (will be changed to BindingDecl)
 *             ├─ UnexposedDecl name="y"           ← binding name (will be changed to BindingDecl)
 *             └─ … (CallExpr / MaterializeTemporaryExpr / ExprWithCleanups, etc. as initializer)
 *
 *  2) Aggregate structured binding:
 *      struct Person { std::string name; int age; double salary; };
 *      Person person{"Bob", 30, 50000.0};
 *      auto [name, age, salary] = person;
 *
 *     In JSON AST, this usually appears as:
 *       DeclStmt
 *         └─ UnexposedDecl name="[name, age, salary]"
 *             ├─ UnexposedDecl name="name"
 *             ├─ UnexposedDecl name="age"
 *             ├─ UnexposedDecl name="salary"
 *             └─ DeclRefExpr name="person" type="Person"    ← initializer (variable reference)
 *
 *  Goal:
 *    - Rename the parent node UnexposedDecl → DecompositionDecl;
 *    - Rename child binding-name nodes to BindingDecl and assign each a bindingIndex (0, 1, 2, ... left to right).
 *
 *  Heuristic and type-based criteria (based on JSON snippets):
 *    - node.kind == "UnexposedDecl" and node.name looks like "[x, y, ...]".
 *    - children contain at least:
 *         • one “binding name” node (UnexposedDecl / BindingDecl with identifier name), and
 *         • one “initializer” expression (kind ends with "Expr" or is MaterializeTemporaryExpr / ExprWithCleanups).
 *    - Type-based evidence (any of the following is true):
 *        (A) The parent/initializer type is tuple-like (pair / tuple / array / initializer_list) or array T[N];
 *        (B) Binding name types show the pattern tuple_element<k, T>::type;
 *        (C) The initializer/parent type exists in derivedDataTypeMap as a CXXRecordDecl
 *            whose FieldDecl count ≥ number of bindings (→ aggregate structured binding).
 *
 *  Notes:
 *    - This function must be called at the very beginning of nodePostprocess(...);
 *      at that point, child nodes are still in the parameter `children`, not yet swapped into node["inner"].
 *
 * @param[in,out] node
 *   The candidate parent node (JSON) to be checked and possibly renamed.
 *   - Input: expects readable fields `node.kind`, `node.name`, and optionally `node.type.qualType`;
 *   - Output: if matched, sets `node.kind` to `"DecompositionDecl"`.
 *
 * @param[in,out] children
 *   The JSON array of child nodes belonging to `node`.
 *   - Input: used to read each child’s `kind`, `name`, and `type.qualType`;
 *   - Output: any node identified as a binding name will be assigned
 *             `kind = "BindingDecl"` and a sequential `bindingIndex`.
 *
 * @param[in] derivedDataTypeMap
 *   A lookup table mapping "normalized type names" to their derived type definitions (usually `CXXRecordDecl` JSONs).
 *   - Used to determine whether the initializer/parent type represents an aggregate record
 *     and whether its field count ≥ number of bindings.
 */
bool TryNormalizeDecompositionDecl(json& node, json& children, const std::map<std::string, json>& derivedDataTypeMap)
{
    // ---------- 0) Quick filter for parent node ----------
    const std::string kind = node.value("kind", "");
    if (kind != "UnexposedDecl") {
        return false;
    }
    const std::string nm = node.value("name", ""); // e.g., "[x, y]" or "[name, age, salary]"
    if (nm.size() < TWO || nm.front() != '[' || nm.back() != ']') {
        return false;
    }
    if (!children.is_array()) {
        return false;
    }
    // ---------- 2) Single-pass traversal over children ----------
    int bindCnt = 0;
    int exprCnt = 0;
    bool anyTupleElementType = false;
    std::string initQualType;
    for (const auto& c : children) {
        AccumulateChildStats(c, bindCnt, exprCnt, anyTupleElementType, initQualType);
    }
    // ---------- 3) Syntax / structural heuristics ----------
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
    // ---------- 4) Type-based heuristics ----------
    const std::string parentQT = node.contains("type") ? node["type"].value("qualType", "") : "";
    const bool tupleLikeByParent = IsTupleLikeType(parentQT) || LooksArrayType(parentQT);
    const bool tupleLikeByInit = IsTupleLikeType(initQualType) || LooksArrayType(initQualType);
    const bool aggregateByInit = IsAggregateRecordWithEnoughFields(initQualType, bindCnt, derivedDataTypeMap);
    const bool aggregateByParent = IsAggregateRecordWithEnoughFields(parentQT, bindCnt, derivedDataTypeMap);
    if (!tupleLikeByParent && !tupleLikeByInit && !aggregateByInit && !aggregateByParent && !anyTupleElementType) {
        return false;
    }
    // ---------- 5) Match confirmed: perform normalization ----------
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
        index = index1 < index2 ? index1 + TWO : index2 + 1; // Remove the length of the member access operator
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
        "atomic_fetch_xor", "atomic_exchange", "atomic_load", "atomic_store", "atomic_compare_exchange"
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
    // Using-declaration for inherited constructors -> constructor declaration
    if (KindIs(node, "UsingDecl") && isUsingInheritClass(node, children, derivedDataTypeMap)) {
        node["kind"] = "CXXConstructorDecl";
        node["mangledName"] = getMemberInClassName(cursor);
    }
}

// Extract the base name from a qualified or templated type string, e.g., "std::vector<int>" → "vector"
static std::string UnqualTemplateName(const std::string& qualType)
{
    if (qualType.empty()) {
        return {};
    }
    size_t lt  = qualType.find('<');
    size_t end = (lt == std::string::npos) ? qualType.size() : lt;
    size_t pos = qualType.rfind("::", end);
    std::string base = (pos == std::string::npos)
        ? qualType.substr(0, end)
        : qualType.substr(pos + TWO, end - (pos + TWO));
    Trim(base);
    return base;
}

static bool LooksLikeMemberSyntax(std::string_view code)
{
    // 1) Trim whitespace and strip outer parentheses (to handle tolerant cases like "(obj.method(...))")
    std::string_view s = TrimView(code);
    if (IsParenWrapped(s) && s.size() >= TWO) {
        s.remove_prefix(1);
        s.remove_suffix(1);
        s = TrimView(s);
    }
    // 2) Extract the callee head (before the first '(' or '{')
    size_t lb1 = s.find('(');
    size_t lb2 = s.find('{');
    size_t lb  = std::min(lb1 == std::string_view::npos ? s.size() : lb1,
                          lb2 == std::string_view::npos ? s.size() : lb2);
    if (lb == 0 || lb == std::string_view::npos) {
        return false; // Not a call or constructor-like pattern
    }
    std::string_view head = TrimView(s.substr(0, lb));
    // 3) Check only the head part for member syntax
    // to avoid false positives from numeric literals in arguments (e.g., 2.0, 1.0e-3)
    return (head.find("->") != std::string_view::npos) || (head.find('.') != std::string_view::npos);
}

// If the node represents a structured call expression, return its callee entity (which may contain a "name" field)
static const json* FindCalleeRef(const json& callNode)
{
    if (!callNode.contains("inner") || !callNode["inner"].is_array()) {
        return nullptr;
    }
    const auto& arr = callNode["inner"];
    for (size_t i = 0; i < arr.size(); ++i) {
        const std::string k = arr[i].value("kind", "");
        if (k == "TemplateRef" || k == "TypeRef" || k == "DeclRefExpr") {
            return &arr[i];
        }
    }
    for (size_t i = 0; i + 1 < arr.size(); ++i) {
        if (arr[i].value("kind", "") == "NamespaceRef") {
            const std::string k2 = arr[i+1].value("kind", "");
            if (k2 == "TemplateRef" || k2 == "TypeRef" || k2 == "DeclRefExpr") {
                return &arr[i + 1];
            }
        }
    }
    return nullptr;
}

// 'base' is the unqualified and untemplated base name of the result type
//     (e.g., "basic_string_view").
// 'name' is the identifier as seen in the source code
//     (e.g., "string_view").
static bool IsNameEquivalent(const std::string& base, const std::string& name)
{
    if (base == name) {
        return true;
    }
    // Common std alias mappings for basic_* types
    static const std::unordered_map<std::string, std::unordered_set<std::string>> kAliases = {
        // string family
        {"basic_string",      {"string", "wstring", "u16string", "u32string", "u8string"}},
        // string_view family
        {"basic_string_view", {"string_view", "wstring_view", "u16string_view", "u32string_view", "u8string_view"}},
    };
    auto it = kAliases.find(base);
    if (it == kAliases.end()) {
        return false;
    }
    return it->second.count(name) != 0;
}

static inline std::string TrimCopy(std::string s)
{
    Trim(s);
    return s;
}

// Try to decide ctor-likeness by parsing the "type-like head" before '(' or '{' in `code`.
//   - "std::vector<int>(n)"   -> compare "vector" with baseName
//   - "std::pair{1,2.0}"      -> compare "pair" with baseName
//   - "(std::pair{1,2.0})"    -> outer parens stripped
static bool MatchCtorByCodeHead(const std::string& code, const std::string& baseName)
{
    std::string s = code;
    Trim(s);
    // Handle outer parentheses gracefully, e.g., (std::pair{1,2.0})
    if (IsParenWrapped(s) && s.size() >= TWO) {
        s = s.substr(1, s.size() - TWO);
        Trim(s);
    }
    // Find the first '(' or '{'
    const size_t lb1 = s.find('(');
    const size_t lb2 = s.find('{');
    const size_t lb  = std::min(lb1 == std::string::npos ? s.size() : lb1, lb2 == std::string::npos ? s.size() : lb2);
    if (lb == std::string::npos || lb == 0 || lb >= s.size()) {
        return false;
    }
    // Take the head before '(' / '{'
    std::string head = s.substr(0, lb); // e.g. "std::vector" / "std::pair"
    Trim(head);
    // Remove template argument tail
    const size_t lt = head.find('<');
    if (lt != std::string::npos) {
        head = head.substr(0, lt);
    }
    Trim(head);
    // Extract last identifier (strip namespaces)
    const size_t kk = head.rfind("::");
    std::string last = (kk == std::string::npos) ? head : head.substr(kk + TWO);
    Trim(last);
    // Compare with the base type name (handles basic_string vs string inside IsNameEquivalent)
    return IsNameEquivalent(baseName, last);
}

// Return whether a baseName is one of common std container alias names,
// e.g. key_type / mapped_type / value_type / size_type / difference_type
static inline bool IsStdContainerAlias(std::string_view s)
{
    return (s == "key_type" || s == "mapped_type" ||
            s == "value_type" || s == "size_type" || s == "difference_type");
}

// Heuristic: infer constructor-like usage from
//   (1) baseName looks like a std container alias (key_type / mapped_type / ...)
//   (2) nodeName looks ctor-ish (basic_string / *string*)
//   (3) code RHS looks like a literal or a brace-init
// Examples: map["Alice"] ... where key_type is basic_string<char>
//           some_alias{...} with class-like nodeName
static bool MatchCtorByContainerAlias(const std::string& baseName,
                                      const std::string& nodeName,
                                      const std::string& code)
{
    if (!IsStdContainerAlias(baseName) || nodeName.empty()) {
        return false;
    }
    std::string t = TrimCopy(code);
    if (t.empty()) {
        return false;
    }
    // Loosely detect "literal-like" tokens: string/char/number start
    const unsigned char c0 = static_cast<unsigned char>(t.front());
    const bool looksLiteral = (t.front() == '"' || t.front() == '\'' || std::isdigit(c0) != 0);
    const bool braceInit = (t.front() == '{');
    // Trigger only if node.name looks constructor-like (e.g., basic_string)
    // and RHS is literal or brace-init, to avoid over-generalization.
    const bool ctorishName  = (nodeName == "basic_string" || nodeName.find("string") != std::string::npos);
    return ctorishName && (looksLiteral || braceInit);
}

// Heuristic: list-initialization of a class-like type.
// Returns true if `code` starts with '{' and `resultTy` looks class-like
// (i.e., contains a namespace qualifier or template arguments).
static bool MatchCtorByListInit(const std::string& resultTy, const std::string& code) noexcept
{
    std::string t = TrimCopy(code);
    if (t.empty()) {
        return false;
    }
    const bool braceInit = (t.front() == '{');
    const bool likelyClassResult =
        (resultTy.find("::") != std::string::npos) ||
        (resultTy.find('<')  != std::string::npos);

    return braceInit && likelyClassResult;
}

// Heuristic: match by callee.name when available.
// Returns true if callee's simple name (namespace stripped) is equivalent to baseName.
static bool MatchCtorByCalleeName(const json& node, const std::string& baseName) noexcept
{
    const json* callee = FindCalleeRef(node);
    if (!callee) {
        return false;
    }
    std::string calleeName = callee->value("name", "");
    if (calleeName.empty()) {
        return false;
    }
    const size_t kk = calleeName.rfind("::");
    std::string calleeSimple = (kk == std::string::npos)
        ? calleeName
        : calleeName.substr(kk + TWO);
    Trim(calleeSimple);
    return IsNameEquivalent(baseName, calleeSimple);
}

// Purpose: Based on limited node (json) information — mainly code / type.qualType / name / callee —
// try to heuristically determine whether the expression is "constructor-like".
//   - Explicit construction: e.g., std::pair{1, 2.0}
//   - Implicit construction triggered by containers or aliases: e.g., map["Alice"]
//     invokes key_type's basic_string("Alice") constructor.
//   - List initialization: T{...} (including internal constructions returned from push/emplace).
//   - LooksLikeMemberSyntax(std::string): checks if the code looks like member syntax (. or ->)
//   - Trim / TrimCopy: removes leading and trailing whitespace
//   - IsParenWrapped(std::string): checks whether the outermost layer is wrapped by parentheses
//   - UnqualTemplateName(std::string): extracts base name from qualified or templated type
//       e.g., "std::vector<int>" → "vector"
//   - FindCalleeRef(const json&): if the node represents a structured call, returns its callee (may have "name")
//   - IsNameEquivalent(a, b): determines if two names are equivalent (handles aliases like string/basic_string)
bool IsCtorLikeByCalleeAndType(const json& node)
{
    // ------- Guard: the node must be an object -------
    if (!node.is_object()) {
        return false;
    }
    // ------- Extract code string and perform basic filtering -------
    // Code is essential since structural fields may not be sufficient;
    // fall back to code string for heuristic judgment.
    const std::string code = node.value("code", "");
    if (code.empty()) {
        return false;
    }
    // Member calls (e.g., obj.method(...), obj.member(...)) are never constructors.
    if (LooksLikeMemberSyntax(code)) {
        return false;
    }
    // ------- Extract type info (only rely on type.qualType) -------
    // In many cases, only qualType is available — maximize its use.
    if (!node.contains("type") || !node["type"].contains("qualType")) {
        return false;
    }
    const std::string resultTy = node["type"].value("qualType", "");
    if (resultTy.empty() || resultTy == "<dependent type>") {
        return false;
    }
    // ------- Extract the "base name" from qualType -------
    // e.g., std::map<std::string,int> → "map"
    //       std::basic_string<char> → "basic_string" (IsNameEquivalent will treat "string" as equivalent)
    const std::string baseName = UnqualTemplateName(resultTy);
    if (baseName.empty()) {
        return false;
    }
    // ------- Common metadata -------
    const std::string nodeName = node.value("name", "");
    const std::string kind = node.value("kind", "");
    // ===== step 0: Direct matching using node.name =====
    // Solves:
    //   - For many brace-init / functional-style constructions, the frontend
    //     already puts the callee name in node.name.
    //     If node.name (after trimming namespace) matches the base type name
    //     (considering string/basic_string alias), treat as constructor.
    if (!nodeName.empty()) {
        size_t kk = nodeName.rfind("::");
        std::string nodeSimple = (kk == std::string::npos) ? nodeName : nodeName.substr(kk + TWO);
        Trim(nodeSimple);
        if (IsNameEquivalent(baseName, nodeSimple)) {
            return true; // Hit: callee name equals base type → constructor
        }
    }
    // ===== step 1: Retry matching using callee.name if available =====
    if (MatchCtorByCalleeName(node, baseName)) {
        return true; // Hit: callee name equivalent to base type name
    }
    // ===== step 2: Fallback — extract the last identifier before '(' or '{' from code =====
    if (MatchCtorByCodeHead(code, baseName)) {
        return true; // Hit: code type name matches base type
    }
    // ===== step 3: List-initialization fallback ({...} + result looks like a class) =====
    if (MatchCtorByListInit(resultTy, code)) {
        return true; // Hit: list initialization of a class type
    }
    // ===== step 4: Container alias fallback =====
    if (MatchCtorByContainerAlias(baseName, nodeName, code)) {
        return true; // Hit: container alias + ctorish name + literal/list → implicit construction
    }
    // None of the heuristics matched → not constructor-like
    return false;
}

// Compute a stable ID: (beginOffset << 32) | endOffset
static inline unsigned long long StableIdFromRange(const json& r)
{
    const auto& b = r.value("begin", json::object());
    const auto& e = r.value("end",   json::object());
    const unsigned bo = b.value("offset", 0u);
    const unsigned eo = e.value("offset", 0u);
    return (static_cast<unsigned long long>(bo) << THIRTYTWO) | static_cast<unsigned long long>(eo);
}

// Return the function node (FunctionDecl / CXXMethodDecl / CXXConstructorDecl / CXXDestructorDecl)
// that contains the given offset 'off'. Return nullptr if no such function is found.
json* FindEnclosingFunction(json& node, unsigned off)
{
    if (!node.is_object()) {
        return nullptr;
    }
    const std::string kind = node.value("kind", "");
    const unsigned off0 = off;
    const auto inRange = [off0](const json& n) -> bool {
        if (!n.contains("range")) {
            return false;
        }
        const auto& r = n["range"];
        const unsigned b = r.value("begin", json::object()).value("offset", 0u);
        const unsigned e = r.value("end",   json::object()).value("offset", 0u);
        return (b <= off0 && off0 <= e);
    };
    const bool isFunc = (kind == "FunctionDecl" || kind == "CXXMethodDecl" ||
    kind == "CXXConstructorDecl" || kind == "CXXDestructorDecl");
    if (isFunc) {
        unsigned b = node.value("range", json::object()).value("begin", json::object()).value("offset", 0u);
        unsigned e = node.value("range", json::object()).value("end",   json::object()).value("offset", 0u);
    }
    if (isFunc && inRange(node)) {
        return &node;
    }
    if (node.contains("inner") && node["inner"].is_array()) {
        for (auto& ch : node["inner"]) {
            if (auto* got = FindEnclosingFunction(ch, off)) {
                return got;
            }
        }
    }
    return nullptr;
}

// Iterate over headerUnits and annotate entries whose #include directives
// appear inside the body of a function.
// For each inclusion directive found within a function range,
// attach metadata describing its enclosing function (id, name, kind, range).
// If location information is missing, the entry will be skipped.
void AnnotateFunctionLocalIncludes(json& ast, std::vector<json>& headerUnits)
{
    for (size_t i = 0; i < headerUnits.size(); ++i) {
        auto& hu = headerUnits[i];
        if (!hu.is_object() || hu.value("kind", "") != "inclusion directive") {
            continue;
        }
        const unsigned off = hu.value("range", json::object()).value("begin", json::object()).value("offset", 0u);
        if (off == 0u) {
            continue; // Skip if location info is missing
        }
        if (json* func = FindEnclosingFunction(ast, off)) {
            unsigned long long fid = 0;
            if (func->contains("id") && (*func)["id"].is_number_unsigned()) {
                fid = (*func)["id"].get<unsigned long long>();
            } else if (func->contains("range")) {
                fid = StableIdFromRange((*func)["range"]);
            }
            hu["enclosingFunction"] = {
                {"id", fid},
                {"name", func->value("name", "")},
                {"kind", func->value("kind", "")},
                {"range", func->value("range", json::object())}
            };
        }
    }
}

