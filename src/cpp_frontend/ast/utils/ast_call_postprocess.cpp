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
enum class FoldPattern { Left, Right }; // Left: (... op pack) ; Right: (pack op ...)

// 统一检测：命中左折叠/右折叠之一则返回 true，并写出 opOut 与 patternOut
bool LooksLikeSimpleFold(std::string_view s, char& opOut, FoldPattern& patternOut) noexcept
{
    opOut = 0;
    const std::string_view t = TrimView(s);
    // 完全带括号 "( ... )"
    if (t.size() < FIVE || t.front() != '(' || t.back() != ')') {
        return false;
    }
    // ---- 尝试左折叠：以 "(..." 开头 ----
    if (t.rfind("(...", 0) == 0) { // starts-with
        size_t i = FOUR; // 跳过 "(..."
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
                patternOut = FoldPattern::Left;
                return true;
            default:
                return false;
        }
    }
    // ---- 尝试右折叠：以 "...)" 结尾 ----
    if (t.size() >= FOUR && t.substr(t.size() - FOUR) == "...)") {
        size_t i = t.size() - FOUR; // 指向 "..." 起始
        while (i > 0 && (unsigned char)t[i - 1] <= ' ') {
            --i; // 跳过左侧空白
        }
        if (i == 0){
            return false;
        }
        const char c = t[i - 1];
        switch (c) {
            case '+': case '-': case '*': case '/':
            case '&': case '|': case '^':
                opOut = c;
                patternOut = FoldPattern::Right;
                return true;
            default:
                return false;
        }
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
 * @brief 识别并改写“简单折叠表达式（C++17 fold expression）”的包装节点为 CXXFoldExpr。
 * 适用源码形态（必须“完全带括号”，空白任意；仅支持单字符运算符）：
 *   1) 左折叠（本函数沿用既有命名习惯）：
 *        (... + args)      →  pattern: "left",  op: "+"
 *      其它可识别单字符运算符：+ - * / & | ^
 *   2) 右折叠：
 *        (args + ...)      →  pattern: "right", op: "+"
 *      其它可识别单字符运算符同上。
 * 触发前提（满足全部才改写，否则保持原状）：
 *   - node.kind ∈ { "ImplicitCastExpr", "UnexposedExpr", "ParenExpr" }
 *   - node.code 存在，且 LooksLikeSimpleFold(code, op, pattern) 判真
 *   - 代码串必须是完全括号包裹的形态 "( ... )"
 *   - 左折叠要求以 "(..." 起始；右折叠要求以 "...)" 结束
 * 改写效果：
 *   - node.kind        ← "CXXFoldExpr"
 *   - node.op          ← 运算符（string，当前为单字符）
 *   - node.pattern     ← "left" | "right"
 *   - 保留原 node.code / node.inner / node.range / node.type / node.valueCategory
 *     （若 node.type 缺失则填充 { "qualType": "<dependent type>" }）
 * 典型输入/输出（示例）：
 *   源码：return (... + args);
 *   之前：{ "kind":"UnexposedExpr", "code":"(... + args)", "inner":[{ "kind":"DeclRefExpr","name":"args"}], ... }
 *   之后：{
 *            "kind":"CXXFoldExpr", "op":"+", "pattern":"left",
 *            "code":"(... + args)", "inner":[{ "kind":"DeclRefExpr","name":"args"}], ...
 *          }
 *   源码：return (args + ...);
 *   之后：{ "kind":"CXXFoldExpr", "op":"+", "pattern":"right", "code":"(args + ...)", ... }
 * 设计取舍与限制：
 *   - 仅识别“简单”折叠：单字符运算符（+ - * / & | ^），不含 << >> && || 等双字符。
 *   - 必须是最外层一对括号包裹形态；更复杂/嵌套的折叠需扩展 LooksLikeSimpleFold。
 *   - 依赖字符串匹配，对 tokenize 插入空格具鲁棒性（Trim + 边界判定），
 *     但若未来需要保留精确空白/注释，请确保尽量命中缓存切片 TrySliceFromCache。
 *   - 与 handleUnexposedExpr 的分工：允许其先产出 UnexposedExpr，
 *     最终由本函数在 nodePostprocess 阶段统一改写为 CXXFoldExpr。
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
        {"pattern", (pat == FoldPattern::Left ? "left" : "right")},
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

// 从 "std::vector<int>" 等取“基名”（如 "vector"）
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
    // 1) 去空白、剥外层括号（宽容形如 "(obj.method(...))"）
    std::string_view s = TrimView(code);
    if (IsParenWrapped(s) && s.size() >= TWO) {
        s.remove_prefix(1);
        s.remove_suffix(1);
        s = TrimView(s);
    }

    // 2) 截取 callee 头部（第一个 '(' 或 '{' 之前）
    size_t lb1 = s.find('(');
    size_t lb2 = s.find('{');
    size_t lb  = std::min(lb1 == std::string_view::npos ? s.size() : lb1,
                          lb2 == std::string_view::npos ? s.size() : lb2);
    if (lb == 0 || lb == std::string_view::npos) {
        return false; // 不是调用/构造样式
    }
    std::string_view head = TrimView(s.substr(0, lb));
    // 3) 只在 head 上判断成员语法，避免被参数里的 2.0、1.0e-3 等误伤
    return (head.find("->") != std::string_view::npos) || (head.find('.') != std::string_view::npos);
}

// 若是结构化的调用节点，返回被调用实体（可能有 name）
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
        if (arr[i].value("kind","") == "NamespaceRef") {
            const std::string k2 = arr[i+1].value("kind","");
            if (k2 == "TemplateRef" || k2 == "TypeRef" || k2 == "DeclRefExpr") {
                return &arr[i + 1];
            }
        }
    }
    return nullptr;
}

// base 是结果类型去限定+去模板后的基名（如 "basic_string_view"）
// name 是源码侧看到的标识符（如 "string_view"）
static bool IsNameEquivalent(const std::string& base, const std::string& name)
{
    if (base == name) {
        return true;
    }
    // 常见 std 别名到 basic_* 的映射
    static const std::unordered_map<std::string, std::unordered_set<std::string>> kAliases = {
        // string 系
        {"basic_string",      {"string", "wstring", "u16string", "u32string", "u8string"}},
        // string_view 系
        {"basic_string_view", {"string_view", "wstring_view", "u16string_view", "u32string_view", "u8string_view"}},
    };

    auto it = kAliases.find(base);
    if (it == kAliases.end()) {
        return false;
    }
    return it->second.count(name) != 0;
}
static inline std::string TrimCopy(std::string s) { Trim(s); return s; }

// 目的：基于节点（json）的有限信息（主要是 code / type.qualType / name / callee），
// 尽可能判断这个表达式是否“像构造”（constructor-like）。
// 适配的典型场景：
//   - 显式构造：std::string("hi"), std::pair{1,2.0}, std::array{1,2,3}
//   - 容器/别名触发的隐式构造：map["Alice"] 时对 key_type 的 basic_string("Alice") 构造
//   - 列表初始化：T{...}（含容器 push/emplace 返回的内部构造）
//
// 依赖的外部工具函数：
//   - LooksLikeMemberSyntax(std::string): 代码串是否看起来是成员语法（. 或 ->）
//   - Trim / TrimCopy: 去除首尾空白
//   - IsParenWrapped(std::string): 外层是否用 () 包一层
//   - UnqualTemplateName(std::string): 从 "std::vector<int>" 等取“基名”（如 "vector"）
//   - FindCalleeRef(const json&): 若是结构化的调用节点，返回被调用实体（可能有 name）
//   - IsNameEquivalent(a, b): 名称等价判定（支持 string/basic_string 这类别名等价）
bool IsCtorLikeByCalleeAndType(const json& node)
{
    // ------- 守卫：类型必须是一个对象 -------
    if (!node.is_object()) {
        return false;
    }
    // ------- 提取 code 串并做最基本过滤 -------
    // 需要 code 是因为很多时候无法从结构化字段推断，只能回退到 code 进行启发式判断。
    const std::string code = node.value("code", "");
    if (code.empty()) {
        return false;
    }
    // 成员调用绝不是构造（如 obj.method(...) / obj.member(...)），先排除掉
    if (LooksLikeMemberSyntax(code)) {
        return false;
    }
    // ------- 提取类型（只依赖现有的 type.qualType） -------
    // 很多场景下只有 qualType 可用，所以围绕它做最大化的利用。
    if (!node.contains("type") || !node["type"].contains("qualType")) {
        return false;
    }
    const std::string resultTy = node["type"].value("qualType", "");
    if (resultTy.empty() || resultTy == "<dependent type>") {
        return false;
    }
    // ------- 从 qualType 提取“基名” -------
    // 例如：std::map<std::string,int> => "map"
    //      std::basic_string<char> => "basic_string"（IsNameEquivalent 会兼容 string）
    const std::string baseName = UnqualTemplateName(resultTy);
    if (baseName.empty()) {
        return false;
    }
    // ------- 常用元信息 -------
    const std::string nodeName = node.value("name", "");
    const std::string kind     = node.value("kind", "");
    // ===== step0：使用 node.name 进行“最直观”的匹配 =====
    // 解决的问题：
    //   - 对很多 brace-init / 函数式构造，前端已经把“被调用名”放在 node.name。
    //     如果 node.name（去命名空间后）与基名等价（兼容 string/basic_string），
    //     就可以直接判为构造。
    if (!nodeName.empty()) {
        size_t kk = nodeName.rfind("::");
        std::string nodeSimple = (kk == std::string::npos) ? nodeName : nodeName.substr(kk + TWO);
        Trim(nodeSimple);
        if (IsNameEquivalent(baseName, nodeSimple)) {
            return true; // 命中：由“被调用名 == 结果类型基名”直接推断为构造
        }
    }
    // ===== step1：若有结构化 callee，用 callee.name 再比一次 =====
    // 解决的问题：
    //   - 某些节点 node.name 可能为空或不是想要的名字，但可以通过 callee 引用拿到“真实被调名称”。
    //   - 例如模板实例化或重载包装层次存在时，callee 更接近“可见的构造名”。
    if (const json* callee = FindCalleeRef(node)) {
        std::string calleeName = callee->value("name", "");
        if (!calleeName.empty()) {
            size_t kk = calleeName.rfind("::");
            std::string calleeSimple = (kk == std::string::npos) ? calleeName : calleeName.substr(kk + TWO);
            Trim(calleeSimple);
            if (IsNameEquivalent(baseName, calleeSimple)) {
                return true; // 命中：由 callee 名称与类型基名等价推断为构造
            }
        }
    }
    // ===== step2：回退到 code 字符串，抽取“( 或 { 之前的最后标识符”进行比对 =====
    // 解决的问题：
    //   - 有些场景（如 CXXFunctionalCastExpr 格式：T(args) / T{args}），
    //     结构化信息里拿不到被调名，但 code 仍然呈现出显式的类型名。
    //   - 抽取 "(" 或 "{" 之前的最后一个标识符（去掉模板参数/命名空间）来比对。
    {
        std::string s = code;
        Trim(s);
        // 宽容外层括号：例如 (std::pair{1,2.0})
        if (IsParenWrapped(s) && s.size() >= TWO) {
            s = s.substr(1, s.size() - TWO);
            Trim(s);
        }
        size_t lb1 = s.find('('), lb2 = s.find('{');
        size_t lb = std::min(lb1 == std::string::npos ? s.size() : lb1, lb2 == std::string::npos ? s.size() : lb2);
        // 无法定位“头部标识符”，放弃这条路径
        if (!(lb != std::string::npos && lb > 0 && lb < s.size())) {
            // 跳过
        } else {
            std::string head = s.substr(0, lb); // 例："std::vector" / "std::pair"
            Trim(head);
            // 去掉模板实参尾巴
            size_t lt = head.find('<');
            if (lt != std::string::npos) {
                head = head.substr(0, lt);
            }
            Trim(head);
            // 取最后一段标识符（去命名空间）
            size_t kk = head.rfind("::");
            std::string last = (kk == std::string::npos) ? head : head.substr(kk + TWO);
            Trim(last);
            if (IsNameEquivalent(baseName, last)) {
                return true; // 命中：code 上的“类型名”与结果类型基名等价
            }
        }
    }
    // ===== step3：列表初始化兜底（{...} + 结果像“类”） =====
    // 解决的问题：
    //   - 形如 "{a,b,c}" 这种如果出现在“构造语境”（结果类型像类：带命名空间或模板），
    //     可以基本认定为 list-initialization 的构造。
    {
        std::string t = TrimCopy(code);
        bool braceInit = (!t.empty() && t.front() == '{');
        bool likelyClassResult = (resultTy.find("::") != std::string::npos || resultTy.find('<') != std::string::npos);
        if (braceInit && likelyClassResult) {
            return true; // 命中：这是“类类型”的列表初始化，视为构造
        }
    }
    // ===== step4：容器“别名”兜底（只依赖 qualType + node.name + code 形态） =====
    // 解决的问题：
    //   - 处理 map["Alice"] 这类通过 operator[] 触发的隐式构造：
    //       key_type 为 std::basic_string<char>，右值是字面量/大括号，node.name 往往是 basic_string
    //     在没有更丰富的类型系统信息时，通过“alias + 字面量/brace + ctorish 名字”推断为构造。
    auto IsStdContainerAlias = [](std::string_view s) {
        return (s == "key_type" || s == "mapped_type" || s == "value_type" || s == "size_type" || s == "difference_type");
    };
    if (IsStdContainerAlias(baseName) && !nodeName.empty()) {
        std::string t = TrimCopy(code);
        // 很宽松的“像字面量”判定：字符串/字符/数字开头。
        // 可按需扩展：u8"…", u"…", U"…", L"…", 'x', 数字/0x/0b/浮点/true/false/nullptr 等。
        bool looksLiteral = !t.empty() && (t.front() == '"' || t.front() == '\'' || std::isdigit(static_cast<unsigned char>(t.front())));
        bool braceInit = (!t.empty() && t.front() == '{');
        // 仅当 node.name 像“构造器名”（例如 basic_string 或包含 string 的名字）
        // 且右侧是字面量/大括号时，判定为构造，避免过度泛化。
        bool ctorishName = (nodeName == "basic_string" || nodeName.find("string") != std::string::npos);
        if (ctorishName && (looksLiteral || braceInit)) {
            return true; // 命中：容器别名 + 构造名 + 字面量/列表，推断为隐式构造
        }
    }
    // 所有启发式均未命中，认为不像构造
    return false;
}