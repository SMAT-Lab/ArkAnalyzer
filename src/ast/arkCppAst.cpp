/*
 * Copyright (c) 2024 Huawei Device Co., Ltd.
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

#include <filesystem>
#include <sstream>
#include <clang-c/Index.h>
#include "utils_string.h"
#include "utils_file.h"
#include "cli_util.h"
#include "json.hpp"
#include <fstream>
#include <iostream>
#include <string>
#include <vector>
#include <set>
#include <algorithm>
#include <regex>
#define TWO 2
#define THREE 3
using json = nlohmann::json;
namespace fs = std::filesystem;
std::vector<std::string> g_user_include_dirs;
//===================Tool Functions Area===================
template<typename F>
void forEachChild(json& node, F&& f)
{
    if (node.contains("inner") && node["inner"].is_array())
        for (auto& child : node["inner"]) f(child);
}

json buildASTJson(CXCursor cursor, bool actionScope, std::unordered_map<std::string, std::string>& varTypeMap);

struct VisitContext {
    json& children;
    bool actionScope; // Whether it is the same scope
    // Collect all parameter/variable declarations in the current scope, return name to type mapping
    std::unordered_map<std::string, std::string>& varTypeMap;
};

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

// Determine fallback kind from code string
inline bool fillKindBycode(json &node, const std::string &codeStr,
                           const std::string &prefix, const std::string &kind,
                           const std::string &argField = "")
{
    size_t pos = codeStr.find(prefix + "(");
    if (pos != std::string::npos && pos == 0) {
        node["kind"] = kind;
        if (!argField.empty()) node[argField] = ExtractParentContent(codeStr, codeStr.find('(', pos));
        return true;
    }
    return false;
}

// ========================AST attribute assistance ======================

json getSourceContent(CXSourceRange range)
{
    CXSourceLocation start = clang_getRangeStart(range);
    CXSourceLocation end = clang_getRangeEnd(range);

    CXFile startFile;
    unsigned startLine;
    unsigned startColumn;
    unsigned startOffset;
    clang_getSpellingLocation(start, &startFile, &startLine, &startColumn, &startOffset);

    CXFile endFile;
    unsigned endLine;
    unsigned endColumn;
    unsigned endOffset;
    clang_getSpellingLocation(end, &endFile, &endLine, &endColumn, &endOffset);

    if (startFile == endFile && startOffset >= endOffset) {
        return json();
    }

    CXString fileName = clang_getFileName(startFile);
    const char *cFileName = clang_getCString(fileName);
    std::string filename = cFileName ? cFileName : "";
    clang_disposeString(fileName);
    if (filename.empty() || g_fileContents.find(filename) == g_fileContents.end()) {
        LoadFileContent(filename);
    }

    const std::string &content = g_fileContents[filename];
    if ((startFile != endFile && startOffset >= content.size()) ||
        (startFile == endFile && endOffset > content.size())) {
        return json();
    }
    unsigned tokLen = endOffset > startOffset ? (endOffset - startOffset) : 0;
    return {
        {"id", startOffset + endOffset}, {"code", content.substr(startOffset, endOffset - startOffset)},
        {"begin", {{"line", startLine}, {"col", startColumn}, {"offset", startOffset}, {"tokLen", tokLen}}},
        {"end", {{"line", endLine}, {"col", endColumn}, {"offset", endOffset}}}
    };
}

// Build child node's range based on parent node
void buildNodeRange(json& node, json& parent)
{
    if (!node.contains("code") || node["code"] == "") {
        return;
    }
    if (!parent.contains("code") || parent["code"] == "") {
        return;
    }
    std::string cCode = node["code"];
    std::string pCode = parent["code"];
    if (!parent.contains("range") || parent["range"] == json()) {
        return;
    }
    size_t index1 = pCode.find(cCode);
    if (index1 != std::string::npos) {
        json pRange = parent["range"];
        size_t offset = pRange["begin"]["offset"];
        int startOffset = offset + index1;
        int endOffset = startOffset + cCode.size() - 1; // Existence of substring will not cause out of bounds
        int startLine = pRange["begin"]["line"];
        int endLine = startLine;
        int startCol = pRange["begin"]["col"];
        int endCol = startCol;
        int curOffset = 0;
        int line = startLine;
        int col = startCol;
        for (size_t i = 0; i < pCode.size(); i++) {
            if (curOffset == startOffset) {
                startLine = line;
                startCol = col;
            }
            if (curOffset == endOffset) {
                endLine = line;
                endCol = col;
                break;
            }
            if (pCode[i] == '\n') { // Get line and column numbers based on newline characters
                line++;
                col = 0;
            } else {
                col++;
            }
            curOffset++;
        }
        node["range"] = {{"begin", {{"line", startLine}, {"col", startCol}, {"offset", startOffset},
                         {"tokLen", endOffset - startOffset + 1}}},
                         {"end", {{"line", endLine}, {"col", endCol}, {"offset", endOffset}}}};
    }
}

void fillUnaryOperatorInfo(json &node, CXCursor cursor)
{
    auto opKind = clang_getCursorUnaryOperatorKind(cursor);
    node["opcode"] = Cx2Str(clang_getUnaryOperatorKindSpelling(opKind));
    node["isPostfix"] = (opKind == CXUnaryOperator_PostInc || opKind == CXUnaryOperator_PostDec);
}


std::string handleUnexposedExpr(json node)
{
    if (node["name"] == "") {
        std::string typeStr = node["type"]["qualType"];
        std::string codeStr = node["code"];
        if ((typeStr + "()") == node["code"]) {
            return "CXXScalarValueInitExpr";
        } else if (codeStr.find("?") != std::string::npos) {
            return "BinaryConditionalOperator";
        } else if (codeStr.find(".push_back") != std::string::npos || codeStr.find(".insert") != std::string::npos ||
                   codeStr.find(".push") != std::string::npos || typeStr.find("basic_ostream") != std::string::npos ||
                   typeStr == "bool" || typeStr == "mapped_type" || codeStr.find(".erase") != std::string::npos) {
            return "ExprWithCleanups";
        } else if (codeStr.find("std::make_pair") != std::string::npos) {
            return "MaterializeTemporaryExpr";
        }
    }
    return "ImplicitCastExpr";
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

// Swap CXXOperatorCallExpr child node order
void swapChildNode(json &children)
{
    json child = children[1];
    children[1] = children[0];
    children[0] = child;
}

// Determine if callExpr node is a constructor call
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

// Determine if callExpr node is a template constructor call
bool TemplateConstructCallExpr(std::string nameStr, std::string typeStr)
{
    if (nameStr.empty()) {
        return false;
    }
    if (typeStr.find(nameStr) == 0 && typeStr.find('<') !=
        std::string::npos && typeStr.find('>') != std::string::npos) {
        return true;
    }
    return false;
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

// Unified Node Type
std::string unifyTypeStr(CXString typeSpelling)
{
    std::string typeStr = clang_getCString(typeSpelling);
    if (typeStr.find("set<") == 0 || typeStr.find("vector<") == 0 || typeStr.find("deque<") == 0 ||
        typeStr.find("stack<") == 0 || typeStr.find("list<") == 0) {
            typeStr = "std::" + typeStr;
        }
    clang_disposeString(typeSpelling);
    std::string oldStr = "std::string";
    std::string newStr = "std::basic_string<char>";
    if (typeStr.find(oldStr) != std::string::npos) {
        size_t pos = 0;
        while ((pos = typeStr.find(oldStr, pos)) != std::string::npos) {
            typeStr.replace(pos, oldStr.length(), newStr);
            pos += newStr.length();
        }
    }
    if (typeStr.find("pair<_Unrefwrap_t<const char") != std::string::npos) {
        typeStr = "std::pair<const char *, int>";
    }
    return typeStr;
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

std::string getMemberInClassName(CXCursor cursor)
{
    CXCursor parentCursor = clang_getCursorSemanticParent(cursor);
    CXCursorKind kind = clang_getCursorKind(parentCursor);
    if (kind != CXCursor_ClassDecl && kind != CXCursor_StructDecl) {
        return "";
    }
    return Cx2Str(clang_getCursorSpelling(parentCursor));
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


// Save all label statements and IDs
std::map<std::string, int> labelNameToId;

// Traverse all AST nodes to collect labels
void collectLabelStmt(const json &node, std::map<std::string, int> &labelMap)
{
    if (node.contains("kind") && node["kind"] == "LabelStmt" && node.contains("name"))
        labelMap[node["name"]] = node["id"];
    forEachChild(const_cast<json&>(node), [&](json &child) { collectLabelStmt(child, labelMap); });
}

// Supplement targetLabelId for goto statements
void patchGotoTarget(json &node, const std::map<std::string, int> &labelMap)
{
    if (node.contains("kind") && node["kind"] == "GotoStmt") {
        if (node.contains("inner") && !node["inner"].empty()) {
            const json &labelRef = node["inner"][0];
            std::string labelName = labelRef.value("name", "");
            if (!labelName.empty() && labelMap.count(labelName)) node["targetLabelId"] = labelMap.at(labelName);
        }
    }
    forEachChild(node, [&](json &child) { patchGotoTarget(child, labelMap); });
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

void patchFoldExpr(json &node)
{
    // Recursively process all child nodes
    forEachChild(node, [&](json &child) { patchFoldExpr(child); });
    // Determine if it's a fold expression and fake CXXFoldExpr node, only judge common "(... <op> args)
    if (node.contains("code") && node.contains("kind") && node["kind"] == "ImplicitCastExpr") {
        static std::regex foldRegex(R"(\(\.\.\.\s*([+\-*/&|^])\s*([a-zA-Z0-9_]+)\))");
        std::smatch m;
        std::string code = node["code"];
        if (std::regex_match(code, m, foldRegex)) node = {
            {"kind", "CXXFoldExpr"}, {"op", m[1]},  // 匹配左折叠
            {"pattern", "left"}, {"code", code},
            {"inner", node["inner"]}, {"range", node["range"]},
            {"type", node["type"]}, {"valueCategory", node.value("valueCategory", "prvalue")}
        };
    }
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

bool IsConstructorByTypeStr(std::string typeStr)
{
    return typeStr.find("std::map") == 0 || typeStr.find("std::unordered_map") == 0 ||
           typeStr.find("std::_Tree_const_iterator") != std::string::npos || typeStr == "key_type" ||
           typeStr == "const key_type" || typeStr == "const std::basic_string<char>" ||
           typeStr.find("lambda at") != std::string::npos || typeStr.find("struct") == 0;
}

bool IsConstructorByNameStr(std::string nameStr)
{
    return nameStr == "vector" || nameStr == "_Tree_const_iterator" || nameStr == "set" || nameStr == "queue" ||
    nameStr == "deque" || nameStr == "stack" || nameStr == "list";
}

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

bool IsConstructorByCodeStr(std::string codeStr, std::string nameStr, std::string typeStr)
{
        bool cond1 = (typeStr == nameStr);
        bool cond2 = (typeStr == "iterator" && codeStr.find(".find") != std::string::npos);
        bool cond3 = (codeStr.find("]") != std::string::npos && nameStr == "basic_string");
        bool cond4 = (codeStr.find("std::string") == 0);
        bool cond5 = ConstructCallExpr(codeStr, typeStr);
        bool cond6 = TemplateConstructCallExpr(nameStr, typeStr);
        bool result = cond1 || cond2 || cond3 || cond4 || cond5 || cond6;
        return result;
}

std::vector<CXCursorKind> locCursorKind = {CXCursor_FunctionDecl, CXCursor_ClassDecl, CXCursor_Destructor,
                                           CXCursor_TemplateTypeParameter, CXCursor_StructDecl, CXCursor_UnionDecl,
                                           CXCursor_VarDecl, CXCursor_EnumDecl, CXCursor_ClassTemplate,
                                           CXCursor_Constructor, CXCursor_CXXMethod, CXCursor_TypedefDecl,
                                           CXCursor_FunctionTemplate, CXCursor_MacroExpansion, CXCursor_MacroDefinition,
                                           CXCursor_UsingDirective, CXCursor_Namespace};

// Determine if it is a built-in data type
bool IsBuiltInType(std::string& type)
{
    // 内置类型列表
    std::set<std::string> builtInTypes = {
        "int", "float", "double", "char", "bool",
        "short", "long", "unsigned int", "unsigned char",
        "unsigned short", "unsigned long", "void"
    };
    return builtInTypes.count(type);
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

//  Determine if filename is in -i directory
bool IsInUserInclude(const std::string& fileName)
{
    for (const auto& dir: g_user_include_dirs) {
        // Unify path separators
        std::string prefix = dir;
        if (!prefix.empty() && prefix.back() != '/' && prefix.back() != '\\')
            prefix += GetPathSeparator();
        if (fileName.find(prefix) == 0) {
            return true;
        }
    }
    return false;
}

inline bool isRemovable(const json& j)
{
    return j.is_null() || (j.is_object() && j.empty()) || (j.is_array() && j.empty());
}

void cleanJson(json& node)
{
    if (node.is_array()) {
        for (auto& elem: node) {
            cleanJson(elem);
        }
        node.erase(std::remove_if(node.begin(), node.end(), isRemovable), node.end());
    } else if (node.is_object()) {
        for (auto it = node.begin(); it != node.end();) {
            cleanJson(it.value());
            if (isRemovable(it.value())) {
                it = node.erase(it);
            } else {
                ++it;
            }
        }
    }
}


// Global variable temporarily stores header file AST
std::vector<json> headerUnits;

void filterToMainFileOnly(json& node, const std::string& mainFileName, std::string parentFileName = "")
{
    if (node.is_array()) {
        for (auto& elem : node) {
            filterToMainFileOnly(elem, mainFileName, parentFileName);
        }
        return;
    }
    if (!node.is_object()) {
        return;
    }
    std::string fileName = node.value("fileName", "");
    if (node.contains("locFile"))
        fileName = node["locFile"];
    if (fileName.empty())
        fileName = parentFileName;
    // Standardized path
    if (!fileName.empty() && std::filesystem::exists(fileName)) {
        fileName = std::filesystem::weakly_canonical(fileName).string();
    }
    std::string normMainFileName = mainFileName;
    if (std::filesystem::exists(mainFileName)) {
        normMainFileName = std::filesystem::weakly_canonical(mainFileName).string();
    }
    // Only main file nodes and TranslationUnitDecl have inner, header file nodes are aggregated to headerUnits
    if (node.value("kind", "") == "TranslationUnitDecl") {
            // Root node reservation
    } else if (fileName != normMainFileName) {
        if (IsInUserInclude(fileName) || (IsInUserInclude(node.value("included", "")) &&
            node.value("code", "").find("<") == std::string::npos && node.value("code", "").find(">") ==
            std::string::npos)) {
            headerUnits.push_back(node); // Collect to headerUnits
        }
        node = json(); // Remove nodes from AST (not in main's inner)
        return;
    }
    // Recursive processing of child nodes
    if (node.contains("inner") && node["inner"].is_array()) {
        json filtered = json::array();
        for (size_t i = 0; i < node["inner"].size(); ++i) {
            auto child = node["inner"][i];
            filterToMainFileOnly(child, mainFileName, fileName);
            if (!child.is_null() && !child.empty())
                filtered.push_back(child);
        }
        node["inner"] = filtered;
    }
}

// Process parameter node types in constructor as callExpr
void handleCXXCtorInitializerOfCallExpr(json &child)
{
    std::string kind = child["inner"][0]["kind"];
    if (kind == "ImplicitCastExpr") {
        child = child["inner"][0];
    } else if (kind == "DeclRefExpr") {
        child["kind"] = "ImplicitCastExpr";
    }
}

// Build CXXCtorInitializer
json buildCXXCtorInitializer(json &memberRef, json &children, json& parent)
{
    json CXXCtor = json::object();
    CXXCtor["kind"] = "CXXCtorInitializer";
    CXXCtor["anyInit"] = {{"kind", "FieldDecl"}, {"name", memberRef["name"]}, {"type", memberRef["type"]}};
    json inner = json::array();
    inner.push_back(children);
    CXXCtor["inner"] = inner;
    std::string child = children["code"];
    std::string ctor = memberRef["code"];
    CXXCtor["code"] = ctor + "(" + child + ")";
    buildNodeRange(CXXCtor, parent);
    return CXXCtor;
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

//  Add variable initialization nodes for constructor
json addCXXCtorInitializer(json &children, json& parent)
{
    json newChildren = json::array();
    json memberRef = nullptr;
    for (int i = 0; i < children.size(); i++) {
        if (children[i]["kind"] == "MemberRef" || children[i]["kind"] == "TypeRef") {
            memberRef = children[i];
            continue; // Cache this type of node and build node information with the next node
        }
        if (children[i]["kind"] == "CallExpr") {
            handleCXXCtorInitializerOfCallExpr(children[i]);
        }
        if (children[i]["kind"] == "ImplicitCastExpr" || children[i]["kind"] == "IntegerLiteral" ||
            children[i]["kind"] == "StringLiteral" || children[i]["kind"] == "CharacterLiteral" ||
            children[i]["kind"] == "FloatingLiteral") {
            if (!memberRef.is_null()) {
                newChildren.push_back(buildCXXCtorInitializer(memberRef, children[i], parent));
                memberRef = nullptr;
            }
            continue;
        }
        if (children[i]["kind"] == "OverloadedDeclRef") {
            if (!memberRef.is_null()) {
                newChildren.push_back(buildCXXInheritedCtorInitExpr(memberRef, children[i]));
                memberRef = nullptr;
            }
            continue;
        }
        newChildren.push_back(children[i]);
    }
    return newChildren;
}

// Traverse the child nodes of building typedef
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
        CXType pointee = clang_getPointeeType(type);
        buildTypedefChild(pointee, inner, children, node);
    } else if (type.kind == CXType_FunctionProto) {
        node["kind"] = "FunctionProtoType";
        CXType result = clang_getResultType(type);
        buildTypedefChild(result, inner, children, node);
        size_t numArgs = children.size();
        for (size_t i = 0; i < numArgs; i++) {
            inner.push_back(children[i]);
        }
    } else if (type.kind == CXType_Int || type.kind == CXType_Float|| type.kind == CXType_Void) {
        node["type"]["qualType"] = typeStr;
        node["kind"] = "BuiltinType";
    } else {
        node["type"]["qualType"] = typeStr;
        node["kind"] = "TypedefType";
    }
    node["inner"] = inner;
    newChildren.push_back(node);
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
        else if (typeStr.find("basic_ostream") == 0 || nameStr.find("operator") != std::string::npos)
            node["kind"] = "CXXOperatorCallExpr";
        else if (IsConstructorByTypeStr(typeStr) || IsConstructorByNameStr(nameStr) ||
                 IsConstructorByCodeStr(codeStr, nameStr, typeStr))
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
        node["type"]["qualType"] = "basic_ostream<char>";
        return;
    }
    if (applyDeclLikeKind(node, cursor, kind_cursor)) {
        return;
    }
    node["kind"] = kindSpelling; // Fallback
}

void fillNodeSourceContent(json& node, const json& content, CXCursorKind kind_cursor, CXCursor cursor,
                           CXFile file, const std::string& displayName, const std::string& fileStr)
{
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
        node["kind"] = "InclusionDirective";
        node["fileName"] = Cx2Str(clang_getIncludedFile(cursor) ?
                                  clang_getFileName(clang_getIncludedFile(cursor)) :
                                  clang_getCursorSpelling(cursor));
        node["name"] = displayName;
        node["code"] = codeStr;
        node["locFile"] = node["fileName"];
        node["range"] = {{"begin", content["begin"]}, {"end", content["end"]}};
        node["included"] = fileStr;
        return;
    }

    // Literal node value field
    if (kind_cursor == CXCursor_IntegerLiteral ||
        kind_cursor == CXCursor_StringLiteral ||
        kind_cursor == CXCursor_CXXBoolLiteralExpr) {
        node["value"] = node.value("code", "");
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
        node["id"] = content["id"];
        json begin = content["begin"];
        node["range"] = {{"begin", begin}, {"end", content["end"]}};
    }
    if (file && std::find(locCursorKind.begin(), locCursorKind.end(), kind_cursor) != locCursorKind.end()) {
        node["locFile"] = file ? Cx2Str(clang_getFileName(file)) : "";
    }
    node["valueCategory"] = (kind_cursor == CXCursor_EnumConstantDecl) ? displayName : "prvalue";
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
    node["inner"] = children;
    if (kind_cursor == CXCursor_ClassDecl || kind_cursor == CXCursor_StructDecl) {
        derivedDataTypeMap[node["name"]] = node;
    }
    if (kind_cursor == CXCursor_CXXNewExpr) {
        annotateNewExprArrayInfo(node, children);
    } else if (kind_cursor == CXCursor_MemberRefExpr) {
        annotateMemberExprIsArrow(node);
    } else if (kind_cursor == CXCursor_CallExpr) {
        postprocessCallExpr(node);
    }
}

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

void nodePostprocess(
    json& node,
    CXCursor cursor,
    CXCursorKind kind_cursor,
    json& children
)
{
    std::string codeStr = node.value("code", "");
    std::string typeStr = node["type"]["qualType"];
    if (node["kind"] == "UsingDecl" && isUsingInheritClass(node, children)) {
        node["kind"] = "CXXConstructorDecl";
        node["mangledName"] = getMemberInClassName(cursor);
    }
    if (node["kind"] == "InitListExpr" && typeStr.find("std::pair") != std::string::npos) {
        fixMapPairInitListChildren(children, typeStr);
    } else if (node["kind"] == "CXXOperatorCallExpr") {
        operatorCallExprPostProcess(node, children);
    } else if (node["kind"] == "CXXConstructExpr" || node["kind"] == "CallExpr") {
        if (!children.empty() && children[0]["kind"] == "MemberExpr") {
            node["kind"] = "CXXMemberCallExpr";
        } else {
            changeChildNodeType(children);
        }
    } else if (node["kind"] == "ImplicitCastExpr") {
        implicitCastExprPostProcess(node, children, codeStr);
    } else if (node["kind"] == "CXXConstructorDecl") {
        children = addCXXCtorInitializer(children, node);
    } else if (node["kind"] == "TypedefDecl" && (children.size() == 0 || (children[0]["kind"] !=
                               "CXXRecordDecl" && children[0]["kind"] != "EnumDecl"))) {
        json newChildren = json::array();
        buildTypedefChild(clang_getTypedefDeclUnderlyingType(cursor), newChildren, children, node);
        children = newChildren;
    }
    if (node["kind"] == "CXXMemberCallExpr" || node["kind"] == "MemberExpr") fillMemberExprName(node);
    if (node["kind"] == "InitListExpr") relateMemberType(typeStr, children);
    if (node["kind"] == "VarDecl") {
        updateTypedefClassConstructor(children);
        deduceDecltype(node, children);
    }
    HandleTemplateAndCursorSpecific(node, kind_cursor, codeStr, children);
    detectAndFillSpecialKind(node);  // Automatic fallback for special expression types
}
// ==========================buildASTJson Main Body========================

json buildASTJson(CXCursor cursor, bool actionScope, std::unordered_map<std::string, std::string>& varTypeMap)
{
    CXSourceLocation loc = clang_getCursorLocation(cursor);
    CXCursorKind kind_cursor = clang_getCursorKind(cursor);

    CXFile file;
    clang_getSpellingLocation(loc, &file, nullptr, nullptr, nullptr);
    std::string fileName = file ? Cx2Str(clang_getFileName(file)) : "";

    bool isInclude = IsInUserInclude(fileName);
    if (kind_cursor != CXCursor_TranslationUnit && !clang_Location_isFromMainFile(loc) && !isInclude) {
            return json();
    }
    if (kind_cursor == CXCursor_LinkageSpec) { // extern "C" { ... }
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

    json node;
    std::string kindSpelling = Cx2Str(clang_getCursorKindSpelling(kind_cursor));
    std::string displayName = Cx2Str(clang_getCursorSpelling(cursor));
    CXSourceRange range = clang_getCursorExtent(cursor);
    if (isInclude) {
        node["include"] = true;
    }

    node["type"] = {{"qualType", unifyTypeStr(clang_getTypeSpelling(clang_getCursorType(cursor)))}};
    std::string fileStr = fileName != "" ? fileName : displayName;
    json content = getSourceContent(range);
    fillNodeSourceContent(node, content, kind_cursor, cursor, file, displayName, fileStr);
    fillNodeKindTag(node, cursor, kind_cursor, kindSpelling);
    fillVarDeclStorageClass(node, cursor, kind_cursor);
    fillDeclRefInfo(node, cursor, kind_cursor);
    fillNodeIdRangeLoc(node, content, kind_cursor, file, displayName);
    if (node.contains("kind") && (node["kind"] == "ParmDecl" || node["kind"] == "VarDecl") && node.contains("name")
    && node.contains("type") && node["type"].contains("qualType"))
        varTypeMap[node["name"]] = node["type"]["qualType"];
    fixImplicitCastExprAndDeclRef(node, varTypeMap);

    json children = json::array();
    if (node.contains("kind") && (node["kind"] == "FunctionDecl" || node["kind"] == "CXXMethodDecl" ||
        node["kind"] == "CXXConstructorDecl")) {
        actionScope = true;
        }
    visitAllChildren(cursor, children, actionScope, varTypeMap); // 子节点递归

    nodePostprocess(node, cursor, kind_cursor, children);
    return node;
}

// ======================Project Helper Code==========================

CXTranslationUnit createTranslationUnit(CXIndex index, const CommandLineOptions& opts,
                                        const std::vector<const char*>& args)
{
    return clang_parseTranslationUnit(index, opts.inputFile.c_str(), args.data(), args.size(), nullptr, 0,
        CXTranslationUnit_DetailedPreprocessingRecord);
}

json buildAndProcessAST(CXTranslationUnit unit, const CommandLineOptions& opts)
{
    // Collect all parameter/variable declarations in current scope, return name to type mapping
    std::unordered_map<std::string, std::string> varTypeMap;
    json ast = buildASTJson(clang_getTranslationUnitCursor(unit), false, varTypeMap);
    std::cout << "[STEP1] buildASTJson finished\n";
    std::string mainFileName = fs::canonical(opts.inputFile).string();
    filterToMainFileOnly(ast, mainFileName);
    if (!headerUnits.empty() && ast.contains("kind")) {
        ast["headerUnits"] = headerUnits;
        headerUnits.clear();
    }
    cleanJson(ast);
    if (!ast.contains("headerUnits")) {
        ast["headerUnits"] = json::array();
    }
    std::cout << "[STEP2] filterToMainFileOnly finished\n";
    std::map<std::string, int> labelNameToId;
    patchPseudoDestructorExpr(ast);
    filterVarDeclArrayDims(ast);
    collectLabelStmt(ast, labelNameToId);
    patchGotoTarget(ast, labelNameToId);
    fixCallExprChildKind(ast);
    patchFoldExpr(ast);
    std::cout << "[STEP3] AST built successfully\n";
    return ast;
}

// ===================Main Program Entry==================
int main(int argc, char** argv)
{
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
    CXTranslationUnit unit = createTranslationUnit(index, opts, clangArgs.cstrArgs);
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
    return 0;
}
