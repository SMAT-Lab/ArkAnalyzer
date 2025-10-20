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
#include <algorithm>
#include <chrono>
#include <cctype>
#include <filesystem>
#include <iomanip>
#include <iostream>
#include <limits>
#include <map>
#include <set>
#include <sstream>
#include <string>
#include <string_view>
#include <unordered_map>
#include <unordered_set>
#include <utility>
#include <vector>
#include <clang-c/Index.h>

#include "json.hpp"
#include "utils_string.h"
#include "utils_file.h"
#include "cli_util.h"
#include "ast_prune_policy.h"
#include "ast_call_postprocess.h"
#define TWO 2
#define THREE 3
#define EIGHT 8
constexpr unsigned SHIFT_BITS_FOR_OFFSET = 32U;
using json = nlohmann::json;
namespace fs = std::filesystem;
std::vector<std::string> g_user_include_dirs;

// Global variable to store the normalized absolute path of the main source file.
// Used to distinguish nodes that are *expanded* in the main file even if their
// spelling location points to an SDK/system header (e.g., macro expansions).
static std::string g_normMainFile;

//===================Tool Functions Area===================
json buildASTJson(CXCursor cursor, bool actionScope, std::unordered_map<std::string, std::string>& varTypeMap);

struct VisitContext {
    json& children;
    bool actionScope; // Whether it is the same scope
    // Collect all parameter/variable declarations in the current scope, return name to type mapping
    std::unordered_map<std::string, std::string>& varTypeMap;
};

// -------- Function-scope context for labels/gotos --------
struct FuncCtx {
    std::unordered_map<std::string, int> labels; // label name -> id
};
// Push when encountering a function/method/constructor/destructor,
// pop when finishing building one.
static thread_local std::vector<FuncCtx> s_funcCtx;


// Only patch targetLabelId for GotoStmt inside the current function subtree;
// Only rewrite when the node is marked "_isGoto", to avoid full-tree scan overhead.
static void PatchGotosInFunction(json& node, const std::unordered_map<std::string, int>& labels)
{
    if (node.is_object()) {
        auto itMark = node.find("_isGoto");
        if (itMark != node.end() && itMark->is_boolean() && *itMark) {
            // Label name comes from inner[0].name
            std::string labelName;
            if (node.contains("inner") && node["inner"].is_array() && !node["inner"].empty()) {
                const json& labelRef = node["inner"][0];
                labelName = labelRef.value("name", "");
            }
            auto itLab = labels.find(labelName);
            if (itLab != labels.end()) {
                node["targetLabelId"] = itLab->second;
            }
        }
        // Recurse into children
        if (auto it = node.find("inner"); it != node.end() && it->is_array()) {
            for (auto& c : *it) PatchGotosInFunction(c, labels);
        }
    } else if (node.is_array()) {
        for (auto& c : node) PatchGotosInFunction(c, labels);
    }
}


inline void visitAllChildren(CXCursor cursor, json& children, bool actionScope,
                             std::unordered_map<std::string, std::string>& varTypeMap)
{
    VisitContext context{children, actionScope, varTypeMap}; //  Encapsulate all parameters

    clang_visitChildren(
        cursor,
        [](CXCursor child, CXCursor parent, CXClientData client_data) {
            VisitContext* ctx = static_cast<VisitContext*>(client_data);
            json childAst = buildASTJson(child, ctx->actionScope, ctx->varTypeMap);
            if (!childAst.is_null()) ctx->children.push_back(childAst);
            return CXChildVisit_Continue;
        },
        &context);
}

json visitLinkageSpec(CXCursor& cursor, bool actionScope, std::unordered_map<std::string, std::string>& varTypeMap)
{
    json children = json::array();
    visitAllChildren(cursor, children, actionScope, varTypeMap);
    if (children.size() == 1) {
        return children[0];
    }
    if (children.empty()) {
        return json();
    }
    return children;
}

// Assign member name
void fillMemberName(json &node, const std::string &displayName)
{
    if (!node["name"].empty()) {
        return;
    }
    node["name"] = displayName;
    if (node["name"] == "" && node.contains("code")) {
        std::string codeStr = node["code"];
        size_t pos = codeStr.find("->");
        size_t arrowLen = TWO;
        if (pos == std::string::npos) {
            pos = codeStr.find(".");
            arrowLen = 1;
        }
        if (pos != std::string::npos) {
            std::string member = codeStr.substr(pos + arrowLen);
            Trim(member);
            node["name"] = member;
        }
    }
}

// ========================AST attribute assistance ======================
struct SourceExtent {
    CXFile beginFile{};
    CXFile endFile{};
    unsigned beginOffset{};
    unsigned endOffset{};
    CXSourceRange fallback{};
};

std::string getSourceCode(CXTranslationUnit tu, const SourceExtent& ext) noexcept
{
    if (!tu) {
        return {};
    }
    // Prefer an offset-based range; fall back to ext.fallback
    CXSourceRange expRange{};
    bool expValid = false;
    if (ext.beginFile && ext.endFile) {
        CXSourceLocation bLoc = clang_getLocationForOffset(tu, ext.beginFile, ext.beginOffset);
        CXSourceLocation eLoc = clang_getLocationForOffset(tu, ext.endFile,   ext.endOffset);
        expRange = clang_getRange(bLoc, eLoc);

        // Validate start/end locations
        CXSourceLocation s = clang_getRangeStart(expRange);
        CXSourceLocation e = clang_getRangeEnd(expRange);
        expValid = !(clang_equalLocations(s, clang_getNullLocation()) ||
                     clang_equalLocations(e, clang_getNullLocation()));
    }

    const CXSourceRange tryRange = expValid ? expRange : ext.fallback;

    CXToken* toks = nullptr;
    unsigned ntok = 0;
    clang_tokenize(tu, tryRange, &toks, &ntok);

    std::string text;
    // Reserve a reasonable size; guard against unsigned underflow
    size_t reserveSize = EIGHT;
    if (ext.endOffset >= ext.beginOffset) {
        reserveSize = std::max<size_t>(EIGHT, static_cast<size_t>(ext.endOffset - ext.beginOffset));
    }
    text.reserve(reserveSize);

    for (unsigned i = 0; i < ntok; ++i) {
        CXString s = clang_getTokenSpelling(tu, toks[i]);
        const char* c = clang_getCString(s);
        if (c) {
            if (!text.empty()) {
                text.push_back(' ');
            }
            text.append(c);
        }
        clang_disposeString(s);
    }
    if (toks) {
        clang_disposeTokens(tu, toks, ntok);
    }
    return text;
}

// Common helpers for source slicing
struct SourceSlice {
    CXFile file = nullptr;
    unsigned beginOffset = 0;
    unsigned endOffset = 0;
    unsigned beginLine = 0;
    unsigned beginCol = 0;
    unsigned endLine = 0;
    unsigned endCol = 0;
    std::string filename;
};

// Get expansion info for a CXSourceRange.
// Returns true if begin/end belong to the same file and offsets form a valid range.
static bool GetExpansionInfo(CXSourceRange range, SourceSlice& out)
{
    CXSourceLocation b = clang_getRangeStart(range);
    CXSourceLocation e = clang_getRangeEnd(range);

    CXFile bf = nullptr;
    CXFile ef = nullptr;
    unsigned bl = 0;
    unsigned bc = 0;
    unsigned bo = 0;
    unsigned el = 0;
    unsigned ec = 0;
    unsigned eo = 0;

    clang_getExpansionLocation(b, &bf, &bl, &bc, &bo);
    clang_getExpansionLocation(e, &ef, &el, &ec, &eo);

    out.file = bf; // if same file, bf == ef
    out.beginOffset = bo;
    out.endOffset = eo;
    out.beginLine = bl;
    out.beginCol = bc;
    out.endLine = el;
    out.endCol = ec;

    if (bf && ef && bf == ef && eo >= bo) {
        CXString sfile = clang_getFileName(bf);
        out.filename = Cx2Str(sfile);
        clang_disposeString(sfile);
        return !out.filename.empty();
    }
    out.filename.clear();
    return false;
}

// Try slicing from cached file content using filename and offsets.
// Returns true when sliced successfully and writes code to outCode.
static bool TrySliceFromCache(const SourceSlice& s, std::string& outCode)
{
    if (s.filename.empty()) {
        return false;
    }
    auto it = g_fileContents.find(s.filename);
    if (it == g_fileContents.end()) {
        LoadFileContent(s.filename);
        it = g_fileContents.find(s.filename);
    }
    if (it == g_fileContents.end()) {
        return false;
    }
    const std::string& content = it->second;
    if (s.endOffset > content.size()) {
        return false;
    }
    outCode = content.substr(s.beginOffset, s.endOffset - s.beginOffset);
    return true;
}

// Lightweight version: returns only the "code" field.
json getSourceContentLight(CXTranslationUnit tu, CXSourceRange range)
{
    SourceSlice s;
    const bool sameFileValid = GetExpansionInfo(range, s);
    if (sameFileValid) {
        std::string code;
        if (TrySliceFromCache(s, code)) {
            return json{{"code", std::move(code)}};
        }
    }
    // 使用结构体封装参数，减少入参数量
    SourceExtent ext{
        s.file, /*beginFile*/
        s.file, /*endFile*/
        s.beginOffset, /*beginOffset*/
        s.endOffset, /*endOffset*/
        range /*fallback*/
    };
    return json{{"code", getSourceCode(tu, ext)}};
}

// Full version: includes begin/end metadata and prefers cached slicing for "code".
json getSourceContent(CXTranslationUnit tu, CXSourceRange range)
{
    SourceSlice s;
    const bool sameFileValid = GetExpansionInfo(range, s);
    json j = json::object();
    // Stable ID composed by high/low 32-bit offsets
    j["id"] = (static_cast<unsigned long long>(s.beginOffset) << SHIFT_BITS_FOR_OFFSET) |
              static_cast<unsigned long long>(s.endOffset);
    auto& jb = j["begin"] = json::object();
    jb["line"]   = s.beginLine;
    jb["col"]    = s.beginCol;
    jb["offset"] = s.beginOffset;

    auto& je = j["end"] = json::object();
    je["line"]   = s.endLine;
    je["col"]    = s.endCol;
    je["offset"] = s.endOffset;

    jb["tokLen"] = (s.endOffset > s.beginOffset ? (s.endOffset - s.beginOffset) : 0);

    if (sameFileValid) {
        std::string code;
        if (TrySliceFromCache(s, code)) {
            j["code"] = std::move(code);
            return j;
        }
    }
    // 封装参数
    const SourceExtent ext{
        s.file, /*beginFile*/
        s.file, /*endFile*/
        s.beginOffset, /*beginOffset*/
        s.endOffset, /*endOffset*/
        range /*fallback*/
    };
    j["code"] = getSourceCode(tu, ext);
    return j;
}


void fillUnaryOperatorInfo(json &node, CXCursor cursor)
{
    auto opKind = clang_getCursorUnaryOperatorKind(cursor);
    node["opcode"] = Cx2Str(clang_getUnaryOperatorKindSpelling(opKind));
    node["isPostfix"] = (opKind == CXUnaryOperator_PostInc || opKind == CXUnaryOperator_PostDec);
}

std::string handleUnexposedExpr(json node)
{
    const std::string code = node.value("code", "");
    const std::string q = node["type"].value("qualType", "");
    const std::string nm = node.value("name", "");
    // If the expression is just a parenthesized wrapper or has a dependent type,
    // keep it as UnexposedExpr (preserve original behavior).
    if (!code.empty() && IsParenWrapped(code)) {
        return "UnexposedExpr";
    }
    if (q == "<dependent type>") {
        return "UnexposedExpr";
    }
    if (nm.empty()) {
        // Prefer classifying outer expressions that likely have side effects (or require cleanups) as ExprWithCleanups.
        if (code.find(".push_back") != std::string::npos || code.find(".insert") != std::string::npos ||
            code.find(".push") != std::string::npos || code.find(".erase") != std::string::npos ||
            q.find("ostream") != std::string::npos || q == "bool" || q == "mapped_type") {
            return "ExprWithCleanups";
        }
        // Only when the entire expression itself is exactly make_pair(...)
        // do we classify it as MaterializeTemporaryExpr.
        const std::string_view t = TrimView(code);
        if (StartsWith(t, "std::make_pair")) {
            return "MaterializeTemporaryExpr";
        }

        // Detect scalar value initialization like: T()
        if ((q + "()") == code) {
            return "CXXScalarValueInitExpr";
        }

        // Ternary operator present -> BinaryConditionalOperator
        if (code.find('?') != std::string::npos) {
            return "BinaryConditionalOperator";
        }
    }

    // Fallback classification
    return "ImplicitCastExpr";
}

// Recursively fix the kind of the first child node of CallExpr, complete missing types
void fixCallExprChildKind(json &node)
{
    forEachChild(node, [&](json &child) { fixCallExprChildKind(child); });

    // Complete the kind of CallExpr's first child node
    if (node.is_object() && node.value("kind", "") == "CallExpr"
        && node.contains("inner") && node["inner"].is_array() && !node["inner"].empty()) {
        auto &child = node["inner"][0];
        // If child node kind is missing
        if (!child.contains("kind") || child["kind"].is_null() || child["kind"] == "") {
            const std::string code = child.value("code", "");
            // Prioritize using kind from referencedDecl
            if (child.contains("referencedDecl") && child["referencedDecl"].contains("kind") &&
                !child["referencedDecl"]["kind"].is_null())
                child["kind"] = child["referencedDecl"]["kind"];
            else if (code.find('.') != std::string::npos || code.find("->") != std::string::npos)
                child["kind"] = "MemberExpr";
            else if (child.contains("referencedDecl") &&
                     child["referencedDecl"].value("kind", "") == "OverloadedDeclRef")
                child["kind"] = "OverloadedDeclRef";
            else
                child["kind"] = "DeclRefExpr";
        }
    }
}

std::string unifyTypeStr(CXString typeSpelling)
{
    // 从 libclang 取出类型拼写
    std::string typeStr = clang_getCString(typeSpelling);
    clang_disposeString(typeSpelling); // 及时释放 CXString
    // --- 场景1：缺少 std:: 前缀的容器名 ---
    // 某些平台/头文件组合下，libclang 可能返回 "vector<int>"、"set<T>" 等没带命名空间的拼写。
    // 这里把常见顺序容器/关联容器统一补上 "std::" 前缀，确保后续匹配一致。
    if (typeStr.find("set<") == 0 || typeStr.find("vector<") == 0 ||
        typeStr.find("deque<") == 0 || typeStr.find("stack<") == 0 ||
        typeStr.find("list<") == 0) {
        // 例："vector<int>" -> "std::vector<int>"
        typeStr = "std::" + typeStr;
    }
    // --- 场景2：统一 string 的别名 ---
    // 把出现的“独立 std::string”替换为 "std::basic_string<char>"。
    // 这能让以下两种来源的类型被视为等价：
    //   - 源码写 std::string
    //   - 模板/推导/实现细节暴露为 std::basic_string<char>
    // 同时通过左右边界检查，避免污染 std::string_view / std::stringbuf 等。
    SafeReplaceStdString(typeStr);
    // --- 场景3：修正 MSVC STL 暴露的实现细节类型名 ---
    // MSVC 有时会把 pair<const char*, int> 这种写成
    // "pair<_Unrefwrap_t<const char, int>>" 之类的内部实现名。
    // 为了稳定下游匹配，这里强制归一化成可阅读、可比较的标准写法。
    if (typeStr.find("pair<_Unrefwrap_t<const char") != std::string::npos) {
        // 注意：此处是一个实用的兜底规则，假设 value 是 int，
        // 可按项目需要扩展泛化（比如解析出第二模板参数的真实类型）。
        typeStr = "std::pair<const char *, int>";
    }
    return typeStr;
}

// Get reference information
json getReferenceDecl(CXCursor cursor, CXCursorKind kind_cursor)
{
    json refNode;
    CXCursor referenced = clang_getCursorReferenced(cursor);
    if (!clang_isInvalid(kind_cursor)) {
        refNode["name"] = Cx2Str(clang_getCursorSpelling(referenced));
        std::string kind = Cx2Str(clang_getCursorKindSpelling(clang_getCursorKind(referenced)));
        if (kind == "ParamDecl") {
            kind = "ParamVarDecl";
        }
        refNode["kind"] = kind;
        refNode["type"] = {{"qualType", unifyTypeStr(clang_getTypeSpelling(clang_getCursorType(referenced)))}};
    }
    return refNode;
}

void patchPseudoDestructorExpr(json &node)
{
    // Check if current is MemberExpr + TypeRef combination and contains ~, infer as pseudo-destructor
    if (node.contains("kind") && node["kind"] == "MemberExpr" && node.contains("code")
        && node["code"].is_string() && node["code"].get<std::string>().find("~") != std::string::npos
        && node.contains("inner") && node["inner"].is_array() && node["inner"].size() == TWO
        && node["inner"][1].contains("kind") && node["inner"][1]["kind"] == "TypeRef") {
            node["kind"] = "CXXPseudoDestructorExpr";
            node["pseudoDestructorType"] = node["inner"][1]["type"]["qualType"];
    }
    forEachChild(node, [&](json &child) { patchPseudoDestructorExpr(child); });
}

// Remove IntegerLiteral type child nodes under VarDecl
void filterVarDeclArrayDims(json &node)
{
    // If not VarDecl, return directly
    if (!node.contains("kind") || node["kind"] != "VarDecl") {
        forEachChild(node, [&](json &child) { filterVarDeclArrayDims(child); });
        return;
    }
    // If no type or type.qualType, return directly
    if (!node.contains("type") || !node["type"].contains("qualType")) {
        forEachChild(node, [&](json &child) { filterVarDeclArrayDims(child); });
        return;
    }
    // If qualType is not array type, return directly
    std::string qualType = node["type"]["qualType"];
    if (qualType.find('[') == std::string::npos || qualType.find(']') == std::string::npos) {
        forEachChild(node, [&](json &child) { filterVarDeclArrayDims(child); });
        return;
    }
    // If no inner or inner is not an array, return directly
    if (!node.contains("inner") || !node["inner"].is_array()) {
        forEachChild(node, [&](json &child) { filterVarDeclArrayDims(child); });
        return;
    }
    // At this point: VarDecl and is array type, inner is an array
    json filtered = json::array();
    for (auto &child : node["inner"]) {
        // Skip IntegerLiteral
        if (child.contains("kind") && child["kind"] == "IntegerLiteral") {
            continue;
        }
        filtered.push_back(child);
    }
    node["inner"] = filtered;
    // Recursively process child nodes
    forEachChild(node, [&](json &child) { filterVarDeclArrayDims(child); });
}


// Uniformly fix ImplicitCastExpr's type and convert to DeclRefExpr when necessary
void fixImplicitCastExprAndDeclRef(json &node, const std::unordered_map<std::string, std::string> &varTypeMap)
{
    if (node.contains("kind") && node["kind"] == "ImplicitCastExpr" &&
        node.contains("code") && varTypeMap.count(node["code"])) {
        // Fix type
        if (node.contains("type") && node["type"].contains("qualType")) {
            node["type"]["qualType"] = varTypeMap.at(node["code"]);
        }
        //  If inner is empty, convert to DeclRefExpr
        if (node.contains("inner") && node["inner"].is_array() && node["inner"].empty()) {
            node["kind"] = "DeclRefExpr";
            node["name"] = node["code"];
        }
    }
}

// Cache all classes, structs
std::map<std::string, json> derivedDataTypeMap;

// Determine if it is an inherited parent class constructor
bool isUsingInheritClass(json& node, json& children)
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

std::vector<CXCursorKind> locCursorKind = {CXCursor_FunctionDecl, CXCursor_ClassDecl, CXCursor_Destructor,
                                           CXCursor_TemplateTypeParameter, CXCursor_StructDecl, CXCursor_UnionDecl,
                                           CXCursor_VarDecl, CXCursor_EnumDecl, CXCursor_ClassTemplate,
                                           CXCursor_Constructor, CXCursor_CXXMethod, CXCursor_TypedefDecl,
                                           CXCursor_FunctionTemplate, CXCursor_MacroExpansion, CXCursor_MacroDefinition,
                                           CXCursor_UsingDirective, CXCursor_Namespace,
                                           CXCursor_TypeAliasTemplateDecl};

inline bool isRemovable(const json& j)
{
    return j.is_null() || (j.is_object() && j.empty()) || (j.is_array() && j.empty());
}

// Global variable temporarily stores header file AST
std::vector<json> headerUnits;
static std::unordered_map<std::string, std::string> g_pathCanonCache; // need to free after use
static std::unordered_map<std::string, bool>        g_pathExistCache; // need to free after use

static inline std::string Slashify(std::string s)
{
    for (auto& ch : s) {
        if (ch == '\\') {
            ch = '/';
        }
    }
    return s;
}

static const std::string& CanonicalCached(const std::string& path)
{
    auto it = g_pathCanonCache.find(path);
    if (it != g_pathCanonCache.end()) return it->second;

    // Check existence cache first
    bool ex = false;
    if (auto it2 = g_pathExistCache.find(path); it2 != g_pathExistCache.end()) {
        ex = it2->second;
    } else {
        ex = !path.empty() && std::filesystem::exists(path);
        g_pathExistCache.emplace(path, ex);
    }

    std::string canon = path;
    if (ex) {
        canon = std::filesystem::weakly_canonical(path).string();
    }
    canon = Slashify(std::move(canon));
    return g_pathCanonCache.emplace(path, std::move(canon)).first->second;
}

// Path fallback: some Windows/MSVC headers are not marked as system headers
// under certain configurations. Use kDenyPrefixes (should include Windows Kits / MSVC / SDK prefixes).
static inline bool IsSystemishByPath(const std::string& fileName)
{
    if (fileName.empty()) {
        return false;
    }
    const std::string norm = CanonicalCached(fileName);
    for (const auto& p : kDenyPrefixes) {
        if (!p.empty() && norm.find(p) != std::string::npos) {
            return true;
        }
    }
    return false;
}

// Only determines whether the file is in the user whitelist path
// (not responsible for pruning system headers)
static bool IsInUserWhitelistPath(const std::string& fileName)
{
    // Normalize (with cache)
    const std::string norm = CanonicalCached(fileName);
    for (const auto& p : kDenyPrefixes) {
        if (!p.empty() && norm.find(p) != std::string::npos) {
            return false;
        }
    }
    // User whitelist directories (from CLI/config -I user paths)
    for (const auto& dir : g_user_include_dirs) {
        std::string prefix = CanonicalCached(dir);
        if (!prefix.empty() && prefix.back() != '/') {
            prefix += '/';
        }
        if (!prefix.empty() && norm.find(prefix) == 0) {
            return true;
        }
    }
    return false;
}

// Lightweight expression whitelist: only serves to complete value semantics
// for expansions inside the main file
static bool IsLightExpansionExpr(CXCursorKind k)
{
    switch (k) {
        case CXCursor_LinkageSpec:
        case CXCursor_IntegerLiteral:
        case CXCursor_FloatingLiteral:
        case CXCursor_CharacterLiteral:
        case CXCursor_StringLiteral:
        case CXCursor_GNUNullExpr:
        case CXCursor_CXXNullPtrLiteralExpr:
        case CXCursor_CStyleCastExpr:
        case CXCursor_ParenExpr:
            return true;
        default:
            return false;
    }
}
// Decide if a cursor should be materialized (kept in AST)
static bool ShouldMaterializeCursor(
    CXCursor cursor,
    CXCursorKind kind_cursor,
    bool fromMainSpell,
    bool fromMainByExpansion,
    const std::string& spellingFileName)
{
    // Always keep the root node
    if (kind_cursor == CXCursor_TranslationUnit) {
        return true;
    }

    // Allow light expressions expanded from the main file
    if (fromMainByExpansion && IsLightExpansionExpr(kind_cursor)) {
        return true;
    }

    // Prune system headers
    if (IsInSystemHeader(cursor)) {
        return false;
    }

    // Prune SDK/MSVC headers by path fallback
    if (IsSystemishByPath(spellingFileName)) {
        return false;
    }

    // Keep anything in the main file
    if (!g_normMainFile.empty()) {
        const std::string norm = CanonicalCached(spellingFileName);
        if (!norm.empty() && norm == g_normMainFile) {
            return true;
        }
    }

    const bool fromMainView = (fromMainSpell || fromMainByExpansion);

    // Keep headers from user whitelist visible to main file
    if (IsInUserWhitelistPath(spellingFileName) && fromMainView) {
        return true;
    }
    return false;
}

static bool applyDeclLikeKind(json& node, CXCursor cursor, CXCursorKind k)
{
    switch (k) {
        case CXCursor_CXXMethod:
            node["kind"] = "CXXMethodDecl";
            node["mangledName"] = getMemberInClassName(cursor);
            return true;
        case CXCursor_Constructor:
            node["kind"] = "CXXConstructorDecl";
            node["mangledName"] = getMemberInClassName(cursor);
            return true;
        case CXCursor_Destructor:
            node["kind"] = "CXXDestructorDecl";
            node["mangledName"] = getMemberInClassName(cursor);
            return true;
        case CXCursor_UsingDeclaration:
            node["kind"] = "UsingDecl";
            return true;
        default:
            return false;
    }
}

void fillNodeKindTag(json& node, CXCursor cursor, CXCursorKind kind_cursor, const std::string& kindSpelling)
{
    std::string nameStr = node.value("name", "");
    std::string codeStr = node.value("code", "");
    std::string typeStr = node["type"]["qualType"];
    switch (kind_cursor) {
        case CXCursor_ClassDecl: node["kind"] = "CXXRecordDecl"; node["tagUsed"] = "class";   return;
        case CXCursor_StructDecl: node["kind"] = "CXXRecordDecl"; node["tagUsed"] = "struct";  return;
        case CXCursor_EnumDecl: node["kind"] = "EnumDecl";      node["tagUsed"] = "enum";    return;
        case CXCursor_UnionDecl: node["kind"] = "CXXRecordDecl"; node["tagUsed"] = "union";   return;
        case CXCursor_UnexposedExpr: node["kind"] = handleUnexposedExpr(node); return;
        case CXCursor_UsingDirective: node["kind"] = "UsingDirectiveDecl"; node["isImplicit"] = true; return;
        case CXCursor_MemberRefExpr: node["kind"] = "MemberExpr"; fillMemberName(node, nameStr); return;
        default: break;
    }
    if (kind_cursor == CXCursor_CallExpr) {
        if (nameStr.find("operator\"\"") != std::string::npos)
            node["kind"] = "UserDefinedLiteral";
        else if (typeStr.find("ostream") == 0 || nameStr.find("operator") != std::string::npos)
            node["kind"] = "CXXOperatorCallExpr";
        else if (IsCtorLikeByCalleeAndType(node))
            node["kind"] = "CXXConstructExpr";
        else if ((codeStr.find(".") != std::string::npos || codeStr.find("->") != std::string::npos) &&
                 nameStr.find("operator") == std::string::npos && codeStr.find(nameStr) != 0)
            node["kind"] = "CXXMemberCallExpr";
        else
            node["kind"] = kindSpelling;
        return;
    }
    if (kind_cursor == CXCursor_BinaryOperator && node.contains("type") &&
        node["type"]["qualType"] == "<dependent type>" && node["opcode"] == "<<") {
        node.erase("opcode");
        node["kind"] = "CXXOperatorCallExpr";
        node["name"] = "operator<<";
        node["type"]["qualType"] = "ostream";
        return;
    }
    if (applyDeclLikeKind(node, cursor, kind_cursor)) {
        return;
    }
    node["kind"] = kindSpelling; // Fallback
}

void fillCXEvalResult(CXEvalResult ev, json& node)
{
    switch (clang_EvalResult_getKind(ev)) {
        case CXEval_Int:
            node["value"] = std::to_string((long long)clang_EvalResult_getAsLongLong(ev));
            break;
        case CXEval_Float: {
            double v = clang_EvalResult_getAsDouble(ev);
            // Render as a shortest, lossless double string
            std::ostringstream oss;
            oss.setf(std::ios::fmtflags(0), std::ios::floatfield);
            oss << std::setprecision(std::numeric_limits<double>::max_digits10) << v;
            std::string s = oss.str();
            // Strip trailing zeros and trailing dot
            if (s.find('.') != std::string::npos) {
                while (!s.empty() && s.back() == '0') {
                    s.pop_back();
                }
                if (!s.empty() && s.back() == '.') {
                    s.pop_back();
                }
            }
            node["value"] = s; // e.g., 3.6
            break;
        }
        default:
            break; // Other kinds (e.g., unexposed): keep codeStr as-is
    }
    clang_EvalResult_dispose(ev);
}

// Fill literal value (only if "code" is available).
// Equivalent to the original inline block:
// For integer/float/char/bool/string literals,
// first store the source text into node["value"];
// for non-string literals, also try evaluating with Clang.
static void FillLiteralValueIfNeeded(json& node,
                                     CXCursor cursor,
                                     CXCursorKind kind_cursor,
                                     bool hasCode)
{
    if (!hasCode) {
        return;
    }
    switch (kind_cursor) {
        case CXCursor_IntegerLiteral:
        case CXCursor_CXXBoolLiteralExpr:
        case CXCursor_CharacterLiteral:
        case CXCursor_FloatingLiteral:
        case CXCursor_StringLiteral: {
            const std::string nodeCodeStr = node.value("code", "");
            node["value"] = nodeCodeStr;
            if (kind_cursor != CXCursor_StringLiteral) {
                if (CXEvalResult ev = clang_Cursor_Evaluate(cursor)) {
                    fillCXEvalResult(ev, node);
                }
            }
            break;
        }
        default:
            break;
    }
}


void fillNodeSourceContent(json& node, const json& content, CXCursorKind kind_cursor, CXCursor cursor,
                           const std::string& fileStr)
{
    std::string displayName = Cx2Str(clang_getCursorSpelling(cursor));
    if (kind_cursor == CXCursor_TranslationUnit) {
        node["fileName"] = fileStr;
        return;
    }
    if (kind_cursor == CXCursor_UnaryOperator) {
        fillUnaryOperatorInfo(node, cursor);
    } else if (kind_cursor == CXCursor_BinaryOperator || kind_cursor == CXCursor_CompoundAssignOperator) {
        node["opcode"] = Cx2Str(clang_Cursor_getBinaryOpcodeStr(clang_Cursor_getBinaryOpcode(cursor)));
    } else {
        node["name"] = displayName;
    }
    // Fill code field
    std::string codeStr = (content.contains("code") && content["code"].is_string())
                          ? content["code"].get<std::string>() : "";
    if (!content.is_null() && kind_cursor != CXCursor_TranslationUnit)
        node["code"] = codeStr;
    // Special handling for InclusionDirective
    if (kind_cursor == CXCursor_InclusionDirective && !content.is_null()) {
        node["kind"] = "inclusion directive";
        node["fileName"] = Cx2Str(clang_getIncludedFile(cursor) ?
                                  clang_getFileName(clang_getIncludedFile(cursor)) :
                                  clang_getCursorSpelling(cursor));
        node["name"] = displayName;
        node["code"] = codeStr;
        node["locFile"] = node["fileName"];
        node["range"] = {{"begin", content["begin"]}, {"end", content["end"]}};
        return;
    }
    // Literal node value field
    if (kind_cursor == CXCursor_IntegerLiteral ||
        kind_cursor == CXCursor_CXXBoolLiteralExpr ||
        kind_cursor == CXCursor_CharacterLiteral ||
        kind_cursor == CXCursor_FloatingLiteral   ||
        kind_cursor == CXCursor_StringLiteral) {
        const std::string nodeCodeStr = node.value("code", "");
        node["value"] = nodeCodeStr;  // Fallback: store the source text first (macro name, literal text, etc.)

        if (kind_cursor == CXCursor_StringLiteral) {
            // Do not Evaluate string literals (avoid truncating L/u/U/u8 to the first character)
        } else {
            if (CXEvalResult ev = clang_Cursor_Evaluate(cursor)) {
                fillCXEvalResult(ev, node);
            }
        }
    }
}


void fillVarDeclStorageClass(json& node, CXCursor cursor, CXCursorKind kind_cursor)
{
    if (kind_cursor == CXCursor_VarDecl) {
        CXCursor parent = clang_getCursorSemanticParent(cursor);
        if (clang_getCursorKind(parent) == CXCursor_ClassDecl ||
            clang_getCursorKind(parent) == CXCursor_StructDecl) {
            node["storageClass"] = "static";
            }
    }
}

void fillDeclRefInfo(json& node, CXCursor cursor, CXCursorKind kind_cursor)
{
    if (kind_cursor == CXCursor_DeclRefExpr)
        node["referencedDecl"] = getReferenceDecl(cursor, kind_cursor);
}

void fillNodeIdRangeLoc(json& node, const json& content, CXCursorKind kind_cursor,
                        CXFile file, const std::string& displayName)
{
    if (!content.is_null()) {
        auto it = content.find("id");
        if (it != content.end()) {
            node["id"] = *it;
        }
        auto itB = content.find("begin");
        auto itE = content.find("end");
        if (itB != content.end() && itE != content.end()) {
            auto& r = node["range"] = json::object();
            r["begin"] = *itB;
            r["end"]   = *itE;
        }
    }
    if (file && std::find(locCursorKind.begin(), locCursorKind.end(), kind_cursor) != locCursorKind.end()) {
        if (file) {
            node["locFile"] = Cx2Str(clang_getFileName(file));
        } else {
            node["locFile"] = "";
        }
    }
    if (kind_cursor == CXCursor_EnumConstantDecl) {
        node["valueCategory"] = displayName;
    } else {
        node["valueCategory"] = "prvalue";
    }
}

static void HandleTemplateAndCursorSpecific(
    json& node,
    CXCursorKind kind_cursor,
    const std::string& codeStr,
    json& children
)
{
    if (kind_cursor == CXCursor_TemplateTypeParameter && codeStr.find("=") != std::string::npos) {
        children.push_back(buildTemplateDefaultType(codeStr));
    }
    if (kind_cursor == CXCursor_CXXNewExpr) {
        annotateNewExprArrayInfo(node, children);
    } else if (kind_cursor == CXCursor_MemberRefExpr) {
        annotateMemberExprIsArrow(node);
    }
    node["inner"] = json::array();
    node["inner"].swap(children);
    if (kind_cursor == CXCursor_CallExpr) {
        postprocessCallExpr(node);
    }
    if (kind_cursor == CXCursor_ClassDecl || kind_cursor == CXCursor_StructDecl) {
        derivedDataTypeMap[node["name"]] = node;
    }
}

// Track labels in function scope (map name -> id)
inline void TrackFunctionScopeLabel(json& node)
{
    if (node.value("kind", "") != "LabelStmt") {
        return;
    }
    if (s_funcCtx.empty()) {
        return;
    }
    s_funcCtx.back().labels[node.value("name", "")] = node.value("id", 0);
}

// Resolve or mark goto target (link to label if available)
void ResolveGotoTarget(json& node)
{
    if (node.value("kind", "") != "GotoStmt") {
        return;
    }
    node["_isGoto"] = true; // mark for patching at function finalization
    if (s_funcCtx.empty()) {
        return;
    }
    if (node.contains("inner") && node["inner"].is_array() && !node["inner"].empty()) {
        const std::string label = node["inner"][0].value("name", "");
        auto it = s_funcCtx.back().labels.find(label);
        if (it != s_funcCtx.back().labels.end()) {
            node["targetLabelId"] = it->second;
        }
    }
}

// Associate object parameters during constructor initialization
void relateMemberType(const std::string& typeStr, json& children)
{
    const auto& classNode = derivedDataTypeMap[typeStr];
    if (!classNode.is_null() && children.size() == classNode["inner"].size()) {
        for (int i = 0; i < children.size(); ++i) {
            const auto& memberType = classNode["inner"][i]["type"]["qualType"];
            auto& child = children[i];
            if (child["type"]["qualType"] != memberType && derivedDataTypeMap.count(child["type"]["qualType"])) {
                child = {
                    {"id", child["id"]}, {"code", child["code"]}, {"name", child["name"]},
                    {"range", child["range"]}, {"type", classNode["inner"][i]["type"]},
                    {"kind", "CXXConstructExpr"}, {"inner", json::array({child})}
                };
            }
        }
    }
}

void nodePostprocess(json& node, CXCursor cursor, CXCursorKind kind_cursor, json& children)
{
    std::string codeStr = node.value("code", "");
    std::string typeStr = node["type"]["qualType"];
    // structured bindings; using-decl → CtorDecl
    phasePreNormalize(node, cursor, kind_cursor, children, derivedDataTypeMap);
    if (node["kind"] == "InitListExpr" && typeStr.find("std::pair") != std::string::npos) {
        fixMapPairInitListChildren(children, typeStr);
    } else if (node["kind"] == "CXXOperatorCallExpr") {
        operatorCallExprPostProcess(node, children);
    } else if (node["kind"] == "CXXConstructExpr" || node["kind"] == "CallExpr") {
        callExprPostProcess(node, children);
    } else if (node["kind"] == "ImplicitCastExpr") {
        implicitCastExprPostProcess(node, children, codeStr);
    } else if (node["kind"] == "CXXConstructorDecl") {
        children = addCXXCtorInitializer(children, node);
    } else if (node["kind"] == "TypedefDecl" && (children.empty() ||
              (children[0]["kind"] != "CXXRecordDecl" && children[0]["kind"] != "EnumDecl"))) {
        json newChildren = json::array();
        buildTypedefChild(clang_getTypedefDeclUnderlyingType(cursor), newChildren, children, node);
        children = newChildren;
    }
    if (node["kind"] == "CXXMemberCallExpr" || node["kind"] == "MemberExpr")
        fillMemberExprName(node);
    if (node["kind"] == "InitListExpr")
        relateMemberType(typeStr, children);
    if (node["kind"] == "VarDecl") {
        updateTypedefClassConstructor(children);
        deduceDecltype(node, children);
    }
    // --- Extracted specialized postprocessing ---
    PostprocessPseudoDestructor(node, children, codeStr);
    TrackFunctionScopeLabel(node);
    ResolveGotoTarget(node);
    if (kind_cursor == CXCursor_TypeAliasDecl) {
        RewriteTypeAliasTemplateArgs(node, children);
        json newChildren = json::array();
        mergeTypeAliasDeclChild(newChildren, children, node);
        children = newChildren;
    }
    // --- Remaining generic handlers ---
    HandleTemplateAndCursorSpecific(node, kind_cursor, codeStr, children);
    patchFoldExpr(node);
    if (node.value("kind", "") == "VarDecl") {
        RecoverCtorForVarDecl(node);
    }
    detectAndFillSpecialKind(node);
}

// Retrieve source content and range information based on the given CXSourceRange and mask.
// - When WANT_CODE is set: extracts the actual source code slice.
// - When WANT_RANGE is set: records line/column/offset information.
// - Always produces a consistent JSON object containing the requested fields.
// - Uses cached slicing when possible for performance.
json getSourceContentMasked(CXTranslationUnit tu, CXSourceRange range, uint32_t want)
{
    SourceSlice s;
    const bool sameFileValid = GetExpansionInfo(range, s);
    json j = json::object();
    const bool needCode  = (want & WANT_CODE)  != 0;
    const bool needRange = (want & WANT_RANGE) != 0;
    if (needRange) {
        auto& begin = j["begin"] = json::object();
        begin["line"]   = s.beginLine;
        begin["col"]    = s.beginCol;
        begin["offset"] = s.beginOffset;
        begin["tokLen"] = (s.endOffset > s.beginOffset) ? (s.endOffset - s.beginOffset) : 0;
        auto& end = j["end"] = json::object();
        end["line"]   = s.endLine;
        end["col"]    = s.endCol;
        end["offset"] = s.endOffset;
        // 64-bit stable ID: high 32 bits = beginOffset, low 32 bits = endOffset
        j["id"] = (static_cast<unsigned long long>(s.beginOffset) << SHIFT_BITS_FOR_OFFSET) |
                  static_cast<unsigned long long>(s.endOffset);
    }
    // If code extraction is not requested, return immediately
    if (!needCode) {
        return j;
    }
    // If the expansion file information is invalid, fall back to direct retrieval
    if (!sameFileValid) {
        const SourceExtent ext{nullptr, nullptr, 0u, 0u, range};
        j["code"] = getSourceCode(tu, ext);
        return j;
    }
    // Try reading from the cached source slice first
    std::string code;
    if (TrySliceFromCache(s, code)) {
        j["code"] = std::move(code);
        return j;
    }
    // Fallback: extract source text directly from file
    const SourceExtent ext{s.file, s.file, s.beginOffset, s.endOffset, range};
    j["code"] = getSourceCode(tu, ext);
    return j;
}

static inline void EnsureDeclRefName(json& node, CXCursorKind kind_cursor)
{
    if (kind_cursor != CXCursor_DeclRefExpr) {
        return;
    }
    // If "name" is missing or empty, fall back to "code";
    // avoids empty names in cases like overloaded functions.
    if ((!node.contains("name")) || node["name"].is_null() || node["name"] == "") {
        const std::string code = node.value("code", "");
        if (!code.empty()) {
            node["name"] = code;
        }
    }
}

static bool HandleInclusionDirective(
    json& node,
    CXCursor cursor,
    const json& content,
    const WantMask& w,
    const std::string& fileStr)
{
    // Only handle inclusion directives (#include ...)
    if (clang_getCursorKind(cursor) != CXCursor_InclusionDirective) {
        return false;
    }

    // Record cursor kind if requested
    if (w.kind) {
        node["kind"] = "inclusion directive";
    }

    // Get the included file: prefer clang_getIncludedFile, fallback to cursor spelling
    const bool hasInc = (clang_getIncludedFile(cursor) != nullptr);
    const std::string incFile = hasInc
        ? Cx2Str(clang_getFileName(clang_getIncludedFile(cursor)))
        : Cx2Str(clang_getCursorSpelling(cursor));

    node["fileName"] = incFile;

    // Note: original logic sets locFile = incFile only inside the include branch
    if (w.loc) {
        node["locFile"] = incFile;
    }

    // Preserve source range if available
    if (w.range && content.contains("begin") && content.contains("end")) {
        node["range"] = {{"begin", content["begin"]}, {"end", content["end"]}};
    }
    return true;
}

// Whether displayName is needed: required only if "name" is requested,
// or when extras need to backfill location/range information.
static inline bool NeedDisplayName(const WantMask& w)
{
    return w.name || (w.extras && (w.range || w.loc));
}

// Fill the "name" and "opcode" fields (only executed when wantName == true)
void FillNameAndOpcode(json& node, CXCursor cursor, CXCursorKind kind_cursor, bool wantName) noexcept
{
    if (!wantName) {
        return;
    }
    if (kind_cursor == CXCursor_UnaryOperator) {
        // Also fills opcode-related fields (as implemented in fillUnaryOperatorInfo)
        fillUnaryOperatorInfo(node, cursor);
        // Write "name" only when spelling is available
        std::string nm = Cx2Str(clang_getCursorSpelling(cursor));
        if (!nm.empty()) {
            node["name"] = nm;
        }
        return;
    }
    if (kind_cursor == CXCursor_BinaryOperator || kind_cursor == CXCursor_CompoundAssignOperator) {
        // Record opcode for binary or compound assignment operators
        node["opcode"] = Cx2Str(clang_Cursor_getBinaryOpcodeStr(clang_Cursor_getBinaryOpcode(cursor)));
        // Write "name" only when spelling is available
        std::string nm = Cx2Str(clang_getCursorSpelling(cursor));
        if (!nm.empty()) {
            node["name"] = nm;
        }
        return;
    }
    // Default case: fill only the spelling name
    node["name"] = Cx2Str(clang_getCursorSpelling(cursor));
}

// ---------- helpers: extras (safe for headers; no static/anon ns) ----------
struct ExtrasRefs {
    const json*        content{nullptr};      // may be null
    CXFile             file{};                // for fillNodeIdRangeLoc
    const std::string* displayName{nullptr};  // may be null
    const std::string* fileName{nullptr};     // for minimal loc fallback
};

// Apply extras + loc/range fallback.
void ApplyExtras(json& node, CXCursor cursor, CXCursorKind kind, const WantMask& w, const ExtrasRefs& refs) noexcept
{
    if (w.extras) {
        // 1) storage class & decl-ref
        fillVarDeclStorageClass(node, cursor, kind);
        fillDeclRefInfo(node, cursor, kind);
        // 2) id/range/loc only when requested
        if (w.range || w.loc) {
            json empty = json::object();  // local fallback (no header-level static)
            const json& c = (refs.content && !refs.content->is_null()) ? *refs.content : empty;
            const std::string& disp = refs.displayName ? *refs.displayName : std::string();
            fillNodeIdRangeLoc(node, c, kind, refs.file, disp);
        }
    } else if (w.loc && !node.contains("locFile")) {
        // Minimal loc fallback without extras
        node["locFile"] = refs.fileName ? *refs.fileName : std::string();
    }
}


void fillNodeProperties(json& node, CXCursor cursor, CXCursorKind kind_cursor, CXFile file)
{
    // ===== 1) Policy unpack =====
    const uint32_t wantBits = SelectFieldMaskForCursorKind(kind_cursor);
    const WantMask w = DecodeWant(wantBits);
    // ===== 2) Basic context =====
    const CXSourceRange range = clang_getCursorExtent(cursor);
    CXTranslationUnit tu = clang_Cursor_getTranslationUnit(cursor);
    const std::string kindSpelling = Cx2Str(clang_getCursorKindSpelling(kind_cursor));
    const std::string fileName = (file ? Cx2Str(clang_getFileName(file)) : std::string());
    // ===== 3) type (on demand) =====
    if (w.type) {
        node["type"] = {{"qualType", unifyTypeStr(clang_getTypeSpelling(clang_getCursorType(cursor)))}};
    } else {
        node["type"] = {{"qualType", ""}}; // placeholder to avoid downstream crashes
    }
    // ===== 4) Source content (only when code or range is needed) =====
    json content;
    const bool needContent = (w.code || w.range);
    if (needContent) {
        content = getSourceContentMasked(tu, range, wantBits);
    }
    const bool hasContent = !content.is_null();
    // ===== 5) displayName / fileStr (lazy computation) =====
    std::string displayName;
    std::string fileStr = fileName;
    if (NeedDisplayName(w)) {
        displayName = Cx2Str(clang_getCursorSpelling(cursor));
        if (fileStr.empty() && !displayName.empty()) {
            fileStr = displayName;
        }
    }
    // ===== 6) name / opcode (on demand) =====
    FillNameAndOpcode(node, cursor, kind_cursor, w.name);
    // ===== 7) code (on demand) =====
    if (w.code) {
        node["code"] = (hasContent && content.contains("code") &&
        content["code"].is_string()) ? content["code"].get<std::string>() : "";
    }
    // ===== 8) #include special case (preserve equivalent behavior) =====
    if (HandleInclusionDirective(node, cursor, content, w, fileStr)) {
        return;
    }
    // ===== 9) range (on demand) =====
    if (w.range && hasContent && content.contains("begin") && content.contains("end")) {
        auto& r = node["range"] = json::object();
        r["begin"] = content["begin"];
        r["end"]   = content["end"];
    }
    // ===== 10) Literal value (only if code is available) =====
    FillLiteralValueIfNeeded(node, cursor, kind_cursor, w.code);
    // ===== 11) kind (on demand) =====
    if (w.kind) {
        fillNodeKindTag(node, cursor, kind_cursor, kindSpelling);
    }
    const ExtrasRefs xrefs{ hasContent ? &content : nullptr,
    file, NeedDisplayName(w) ? &displayName : nullptr, &fileStr };
    ApplyExtras(node, cursor, kind_cursor, w, xrefs);
    // ===== 13) DeclRef name fallback (on demand) =====
    if (w.name) {
        EnsureDeclRefName(node, kind_cursor);
    }
}

// Utility: aggregate source origin information
struct OriginInfo {
    std::string fileName;       // Source file name
    bool isUserHeader = false;  // True if the file is a user header
    bool fromMainSpell = false; // True if spelled directly in the main file
    bool fromMainByExpansion = false; // True if brought in via expansion (e.g., macro)
};

// Compute origin information (file, header type, main-file relation) for a cursor
static OriginInfo ComputeOriginInfo(CXCursor cursor)
{
    OriginInfo oi;
    const CXSourceLocation loc = clang_getCursorLocation(cursor);

    // Spelling location (where the cursor is written in source)
    CXFile spellFile{};
    clang_getSpellingLocation(loc, &spellFile, nullptr, nullptr, nullptr);
    oi.fileName = spellFile ? Cx2Str(clang_getFileName(spellFile)) : "";
    oi.isUserHeader = IsInUserWhitelistPath(oi.fileName);
    oi.fromMainSpell = clang_Location_isFromMainFile(loc);

    // Expansion location (e.g., from macro expansion path)
    CXFile ef{};
    unsigned el = 0;
    unsigned ec = 0;
    unsigned eoff = 0;
    clang_getExpansionLocation(loc, &ef, &el, &ec, &eoff);
    if (ef) {
        const std::string expPath = CanonicalCached(Cx2Str(clang_getFileName(ef)));
        oi.fromMainByExpansion = (!g_normMainFile.empty() && expPath == g_normMainFile);
    }
    return oi;
}

// Utility: check if a cursor kind represents a function
static inline bool IsFunctionCursor(CXCursorKind k)
{
    return k == CXCursor_FunctionDecl || k == CXCursor_CXXMethod || k == CXCursor_Constructor || k == CXCursor_Destructor;
}

// ==========================buildASTJson Main Body========================

json buildASTJson(CXCursor cursor, bool actionScope,
                  std::unordered_map<std::string, std::string>& varTypeMap)
{
    // -------- 1) Origin & kind --------
    const CXCursorKind kind = clang_getCursorKind(cursor);
    const OriginInfo oi = ComputeOriginInfo(cursor);
    // -------- 2) Materialization gate --------
    // Skip nodes that should not be materialized
    if (!ShouldMaterializeCursor(cursor, kind, oi.fromMainSpell, oi.fromMainByExpansion, oi.fileName)) {
        return json(); // drop
    }
    // -------- 3) Special cases (fast path) --------
    // Handle linkage specifications directly
    if (kind == CXCursor_LinkageSpec) {
        return visitLinkageSpec(cursor, actionScope, varTypeMap);
    }
    // -------- 4) Core node properties --------
    json node;
    {
        CXFile spellFile{};
        // Only needed for passing into fillNodeProperties.
        // Simpler to fetch here again; could also be cached in ComputeOriginInfo.
        clang_getSpellingLocation(clang_getCursorLocation(cursor), &spellFile, nullptr, nullptr, nullptr);
        fillNodeProperties(node, cursor, kind, spellFile);
    }
    // Small decoration: mark delete[] expressions
    if (node.value("kind", "") == "CXXDeleteExpr" &&
        node.value("code", "").find("delete[]") != std::string::npos) {
        node["isArray"] = true;
    }
    // Record type of visible parameters/variables for later cast/declref fixes
    if (node.value("kind", "") == "ParmDecl" || node.value("kind", "") == "VarDecl") {
        if (node.contains("name") && node.contains("type") && node["type"].contains("qualType")) {
            varTypeMap[node["name"]] = node["type"]["qualType"];
        }
    }
    // Fix ImplicitCastExpr (add type) / DeclRef (fallback name)
    fixImplicitCastExprAndDeclRef(node, varTypeMap);
    // Enable actionScope when entering a function/method body
    if (node.contains("kind") &&
        (node["kind"] == "FunctionDecl" || node["kind"] == "CXXMethodDecl" ||
         node["kind"] == "CXXConstructorDecl" || node["kind"] == "CXXDestructorDecl")) {
        actionScope = true;
    }
    // -------- 5) Early prune (opaque) --------
    // Convert large InitListExpr into opaque nodes
    if (ShouldPruneInitList(node)) {
        return MakeOpaqueNode(node);
    }
    // -------- 6) Function-scope context (labels/gotos) --------
    const bool isFunc = IsFunctionCursor(kind);
    if (isFunc) {
        s_funcCtx.emplace_back();
    }
    // -------- 7) Children build --------
    json children = json::array();
    visitAllChildren(cursor, children, actionScope, varTypeMap);
    // -------- 8) Postprocess & patch --------
    nodePostprocess(node, cursor, kind, children);
    if (isFunc) {
        PatchGotosInFunction(node, s_funcCtx.back().labels);
        s_funcCtx.pop_back();
    }
    return node;
}


// ======================Project Helper Code==========================

CXTranslationUnit createTranslationUnit(CXIndex index, const CommandLineOptions& opts,
                                        const std::vector<const char*>& args)
{
    const unsigned tuFlags = cliutil::BuildTUFlags(opts);

    std::cout << "[Args] size=" << args.size()
              << " , data()=" << static_cast<const void*>(args.data()) << "\n";

    for (size_t i = 0; i< args.size(); ++i) {
        const char* a = args[i];
        std::cout << " [" << i << "] " << (a ? a : "<null>") << "\n";
    }
    return clang_parseTranslationUnit(index, opts.inputFile.c_str(), args.data(), args.size(), nullptr, 0, tuFlags);
}

struct InclusionCtx {
    std::string normMain; // normalized path to the main source file
    bool onlyFromMain = true; // collect only includes originating from the main file
};

// Callback: construct a "basic" headerUnit element
static void inclusionVisitorBuildHeaderUnits(CXFile includedFile,
                                             CXSourceLocation* inclusionStack,
                                             unsigned includeLen,
                                             CXClientData clientData)
{
    if (!includedFile || includeLen == 0) {
        return;
    }
    auto* ctx = static_cast<InclusionCtx*>(clientData);
    // The inclusion site (the frame closest to the #include)
    CXFile locFile;
    unsigned line = 0;
    unsigned col = 0;
    unsigned offset = 0;
    clang_getSpellingLocation(inclusionStack[0], &locFile, &line, &col, &offset);
    // includer (the file that contains the #include)
    std::string includerPath;
    if (locFile) {
        CXString s = clang_getFileName(locFile);
        includerPath = Cx2Str(s);
        clang_disposeString(s);
    }
    // Only collect includes originating from the main source file (same semantics as filterToMainFileOnly)
    if (ctx && ctx->onlyFromMain && CanonicalCached(includerPath) != ctx->normMain) {
        return;
    }
    // Path of the included file
    CXString incName = clang_getFileName(includedFile);
    std::string incPath = Cx2Str(incName);
    clang_disposeString(incName);
    if (incPath.empty()) {
        return;
    }
    if (!IsInUserWhitelistPath(incPath)) {
        return;
    }
    // Build a "basic" headerUnit
    json beginJ = {{"line", line}, {"col", col}, {"offset", offset}, {"tokLen", 0u}};
    json endJ   = {{"line", line}, {"col", col}, {"offset", offset}};
    json j = {
        {"kind", "inclusion directive"},
        // Without DPP enabled we can't get the original line text; use a fallback code string here
        {"code", "#include \"" + Slashify(incPath) + "\""},
        {"fileName", CanonicalCached(incPath)},         // included file
        {"locFile", CanonicalCached(includerPath)},    // file where the directive resides (typically the main file)
        {"range", {{"begin", beginJ}, {"end", endJ}}}
    };
    headerUnits.push_back(std::move(j));
}

// Collect and attach #include information into ast["headerUnits"]
// - Call libclang to collect inclusions only when headerUnits is empty (avoid duplication)
// - Annotate includes that appear inside function bodies with inFunction / enclosingFunction
// - Attach the collected results to ast["headerUnits"] and clear the global temporary vector
// - Ensure ast["headerUnits"] always exists (even if empty)
static void CollectAndAttachHeaderUnits(json& ast, CXTranslationUnit tu, const std::string& normMain)
{
    // 1) Collect inclusions (only once)
    if (headerUnits.empty()) {
        InclusionCtx ctx{normMain, /*onlyFromMain=*/true};
        clang_getInclusions(tu, inclusionVisitorBuildHeaderUnits, &ctx);
    }
    // 2) Annotate: mark function-local includes with inFunction / enclosingFunction
    AnnotateFunctionLocalIncludes(ast, headerUnits);
    // 3) Attach to AST and clear the global cache
    if (!headerUnits.empty() && ast.contains("kind")) {
        ast["headerUnits"] = headerUnits;
        headerUnits.clear();
    }
    // 4) Fallback: always ensure ast["headerUnits"] exists
    if (!ast.contains("headerUnits")) {
        ast["headerUnits"] = json::array();
    }
}

json buildAndProcessAST(CXTranslationUnit unit, const CommandLineOptions& opts)
{
    g_normMainFile = CanonicalCached(fs::canonical(opts.inputFile).string());
    // Collect all parameter/variable declarations in current scope, return name to type mapping
    std::unordered_map<std::string, std::string> varTypeMap;
    json ast = buildASTJson(clang_getTranslationUnitCursor(unit), false, varTypeMap);
    std::cout << "[STEP] buildASTJson finished\n";
    std::string normMain = CanonicalCached(fs::canonical(opts.inputFile).string());
    CollectAndAttachHeaderUnits(ast, unit, normMain);
    std::cout << "[STEP] AST built successfully\n";
    return ast;
}

// ===================Main Program Entry==================
int main(int argc, char** argv)
{
    auto t0 = std::chrono::high_resolution_clock::now();
    if (argc < TWO) {
        cliutil::PrintUsage(argv[0]);
        return 1;
    }
    auto opts = cliutil::ParseCommandLineArgs(argc, argv);
    cliutil::AddMainFileDirToInclude(opts);
    if (!cliutil::ValidateInput(opts)) {
        return 1;
    }
    ClangArgs clangArgs = cliutil::GetClangArgs(opts);

    g_user_include_dirs = opts.userIncludeDirs;
    CXIndex index = clang_createIndex(0, 0);
    auto t1 = std::chrono::high_resolution_clock::now();
    CXTranslationUnit unit = createTranslationUnit(index, opts, clangArgs.cstrArgs);
    auto t2 = std::chrono::high_resolution_clock::now();
    auto ms1 = std::chrono::duration_cast<std::chrono::milliseconds>(t2 - t1).count();
    std::cout << "create TU time is " << ms1 << "ms" << std::endl;
    if (!unit) {
        std::cerr << "[ERROR] clang_parseTranslationUnit failed!" << std::endl;
        for (size_t i = 0; i < clangArgs.cstrArgs.size(); ++i) {
            std::cerr << clangArgs.cstrArgs[i] << std::endl;
        }
        return TWO;
    }
    json ast = buildAndProcessAST(unit, opts);

    SaveAstToFile(ast, opts.outputFile);

    clang_disposeTranslationUnit(unit);
    clang_disposeIndex(index);
    auto t3 = std::chrono::high_resolution_clock::now();
    auto ms2 = std::chrono::duration_cast<std::chrono::milliseconds>(t3 - t0).count();
    std::cout << "dumper total time is " << ms2 << "ms" << std::endl;
    return 0;
}
