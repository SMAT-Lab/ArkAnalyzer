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

using json = nlohmann::json;
namespace fs = std::filesystem;
std::vector<std::string> g_user_include_dirs;
//===================工具函数区===================
template<typename F>
void forEachChild(json& node, F&& f) {
    if (node.contains("inner") && node["inner"].is_array())
        for (auto& child : node["inner"]) f(child);
}

json buildASTJson(CXCursor cursor);

inline void visitAllChildren(CXCursor cursor, json& children) {
    clang_visitChildren(
        cursor,
        [](CXCursor child, CXCursor parent, CXClientData client_data) {
            json* list = static_cast<json*>(client_data);
            json childAst = buildASTJson(child);
            if (!childAst.is_null()) list->push_back(childAst);
            return CXChildVisit_Continue;
        },
        &children
    );
}

// 赋成员名
inline void fillMemberName(json &node, const std::string &displayName){
    if (!node["name"].empty()) return;
    node["name"] = displayName;
    if (node["name"] == "" && node.contains("code")){
        std::string codeStr = node["code"];
        size_t pos = codeStr.find("->");
        size_t arrow_len = 2;
        if (pos == std::string::npos){
            pos = codeStr.find(".");
            arrow_len = 1;
        }
        if (pos != std::string::npos){
            std::string member = codeStr.substr(pos + arrow_len);
            trim(member);
            node["name"] = member;
        }
    }
}

// 判断code 字符串兜底 kind
inline bool fillKindBycode(json &node, const std::string &codeStr,
                           const std::string &prefix, const std::string &kind,
                           const std::string &argField = ""){
    size_t pos = codeStr.find(prefix + "(");
    if (pos != std::string::npos && pos == 0){
        node["kind"] = kind;
        if (!argField.empty()) node[argField] = extractParentContent(codeStr, codeStr.find('(', pos));
        return true;
    }
    return false;
}

// ========================AST 属性辅助 ======================

json getSourceContent(CXSourceRange range){
    CXSourceLocation start = clang_getRangeStart(range);
    CXSourceLocation end = clang_getRangeEnd(range);

    CXFile startFile;
    unsigned startLine, startColumn, startOffset;
    clang_getSpellingLocation(start, &startFile, &startLine, &startColumn, &startOffset);

    CXFile endFile;
    unsigned endLine, endColumn, endOffset;
    clang_getSpellingLocation(end, &endFile, &endLine, &endColumn, &endOffset);

    if (startFile == endFile && startOffset >= endOffset) return json();

    CXString fileName = clang_getFileName(startFile);
    const char *cFileName = clang_getCString(fileName);
    std::string filename = cFileName ? cFileName : "";
    clang_disposeString(fileName);
    if (filename.empty() || fileContents.find(filename) == fileContents.end()) loadFileContent(filename);

    const std::string &content = fileContents[filename];
    if ((startFile != endFile && startOffset >= content.size()) || (startFile == endFile && endOffset > content.size())) return json();
    unsigned tokLen = endOffset > startOffset ? (endOffset - startOffset) : 0;
    return {
        {"id", startOffset + endOffset}, {"code", content.substr(startOffset, endOffset - startOffset)},
        {"begin", {{"line", startLine}, {"col", startColumn}, {"offset", startOffset}, {"tokLen", tokLen}}},
        {"end", {{"line", endLine}, {"col", endColumn}, {"offset", endOffset}}}
    };
}

// 根据父节点构建子节点的range
void buildNodeRange(json& node, json& parent) {
    if (!node.contains("code") || node["code"] == "") return;
    if (!parent.contains("code") || parent["code"] == "") return;
    std::string cCode = node["code"];
    std::string pCode = parent["code"];
    if (!parent.contains("range") || parent["range"] == json()) return;
    size_t index1 = pCode.find(cCode);
    if (index1 != std::string::npos) {
        json pRange = parent["range"];
        int startOffset = pRange["begin"]["offset"] + index1;
        int endOffset = startOffset + cCode.size() - 1; // 存在子字符串不会越界
        int startLine = pRange["begin"]["line"];
        int endLine = startLine;
        int startCol = pRange["begin"]["col"];
        int endCol = startCol;
        int curOffset = 0;
        int line = startLine, col = startCol;
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
            if (pCode[i] == '\n') { // 根据换行符获取行列号
                line++;
                col = 0;
            } else {
                col++;
            }
            curOffset++;
        }
        node["range"] = {{"begin", {{"line", startLine}, {"col", startCol}, {"offset", startOffset}, {"tokLen", endOffset - startOffset + 1}}},
                         {"end", {{"line", endLine}, {"col", endCol}, {"offset", endOffset}}}};
    }
}

void fillUnaryOperatorInfo(json &node, CXCursor cursor){
    auto opKind = clang_getCursorUnaryOperatorKind(cursor);
    node["opcode"] = cx2str(clang_getUnaryOperatorKindSpelling(opKind));
    node["isPostfix"] = (opKind == CXUnaryOperator_PostInc || opKind == CXUnaryOperator_PostDec);
}


std::string handleUnexposedExpr(json node){
    if (node["name"] == ""){
        std::string typeStr = node["type"]["qualType"];
        std::string codeStr = node["code"];
        if ((typeStr + "()") == node["code"]){
            return "CXXScalarValueInitExpr";
        } else if (codeStr.find("?") != std::string::npos){
            return "BinaryConditionalOperator";
        } else if (codeStr.find(".push_back") != std::string::npos || codeStr.find(".insert") != std::string::npos ||
                   codeStr.find(".push") != std::string::npos || typeStr.find("basic_ostream") != std::string::npos ||
                   typeStr == "bool" || typeStr == "mapped_type" || codeStr.find(".erase") != std::string::npos){
            return "ExprWithCleanups";
        }else if (codeStr.find("std::make_pair") != std::string::npos){
            return "MaterializeTemporaryExpr";
        }
    }
    return "ImplicitCastExpr";
}

// 递归提取所有维度的IntegerLiteral, 支持多层ImplicitCastExpr嵌套
void extractArraySizes(const json &node, std::vector<std::string> &arraySizes){
    if (node.contains("kind")){
        if (node["kind"] == "IntegerLiteral" && node.contains("value")){
            arraySizes.push_back(node["value"]);
        } else if (node["kind"] == "ImplicitCastExpr" && node.contains("inner")){
            forEachChild(const_cast<json&>(node), [&](json &gchild){ extractArraySizes(gchild, arraySizes); });
        }
    }
}

void annotateNewExprArrayInfo(json &node, const json &children){
    bool isArray = false;
    std::vector<std::string> arraySizes;
    for (const auto &child:children){
        extractArraySizes(child, arraySizes);
    }
    if (!arraySizes.empty()){
        isArray = true;
        std::reverse(arraySizes.begin(), arraySizes.end());
        node["arraySizes"] = arraySizes;
    }
    node["isArray"] = isArray;
}

void annotateMemberExprIsArrow(json &node){
    if (node.contains("code")){
        std::string codeStr = node["code"];
        node["isArrow"] = (codeStr.find("->") != std::string::npos);
    }
}

// 交换CXXOperatorCallExpr子节点顺序
void swapChildNode(json &children){
    json child = children[1];
    children[1] = children[0];
    children[0] = child;
}

// 判断callExpr节点是构造函数调用
bool constructCallExpr(std::string codeStr, std::string typeStr){
    size_t index = codeStr.find('(');
    if (index > codeStr.length()) return false;
    std::string newStr = typeStr + codeStr.substr(index);
    if (newStr == codeStr) return true;
    return false;
}

// 判断callExpr节点是模板构造函数调用
bool templateConstructCallExpr(std::string nameStr, std::string typeStr){
    if (nameStr.empty()) return false;
    if (typeStr.find(nameStr) == 0 && typeStr.find('<') != std::string::npos && typeStr.find('>') != std::string::npos){
        return true;
    }
    return false;
}

// 递归修正 CallExpr 节点的第一个子节点 kind，补全缺失类型
void fixCallExprChildKind(json &node) {
    forEachChild(node, [&](json &child) { fixCallExprChildKind(child); });

    // 补全 CallExpr 的第一个子节点 kind
    if (node.is_object() && node.value("kind", "") == "CallExpr"
        && node.contains("inner") && node["inner"].is_array() && !node["inner"].empty()) {
        auto &child = node["inner"][0];
        // 如果子节点 kind 缺失
        if (!child.contains("kind") || child["kind"].is_null() || child["kind"] == "") {
            const std::string code = child.value("code", "");
            // 优先使用 referencedDecl 中的 kind
            if (child.contains("referencedDecl") && child["referencedDecl"].contains("kind") && !child["referencedDecl"]["kind"].is_null())
                child["kind"] = child["referencedDecl"]["kind"];
            else if (code.find('.') != std::string::npos || code.find("->") != std::string::npos)
                child["kind"] = "MemberExpr";
            else if (child.contains("referencedDecl") && child["referencedDecl"].value("kind", "") == "OverloadedDeclRef")
                child["kind"] = "OverloadedDeclRef";
            else
                child["kind"] = "DeclRefExpr";
        }
    }
}

// 修改CXXConstructExpr节点下子节点类型
void changeChildNodeType(json &children){
    if (children.size() == 1){
        std::string typeStr = children[0]["type"]["qualType"];
        std::string codeStr = children[0]["code"];
        std::string kindStr = children[0]["kind"];
        if (typeStr == "iterator" || typeStr == "std::basic_string<char>" ||
        (kindStr == "ImplicitCastExpr" && constructCallExpr(codeStr, typeStr))){
            children[0]["kind"] = "MaterializeTemporaryExpr";
        }
    }
}

// 统一节点类型
std::string unifyTypeStr(CXString typeSpelling){
    std::string typeStr = clang_getCString(typeSpelling);
    if (typeStr.find("set<") == 0 || typeStr.find("vector<") == 0 || typeStr.find("deque<") == 0 ||
        typeStr.find("stack<") == 0 || typeStr.find("list<") == 0) {
            typeStr = "std::" + typeStr;
        }
    clang_disposeString(typeSpelling);
    std::string oldStr = "std::string";
    std::string newStr = "std::basic_string<char>";
    if (typeStr.find(oldStr) != std::string::npos){
        size_t pos = 0;
        while ((pos = typeStr.find(oldStr, pos)) != std::string::npos){
            typeStr.replace(pos, oldStr.length(), newStr);
            pos += newStr.length();
        }
    }
    if(typeStr.find("pair<_Unrefwrap_t<const char") != std::string::npos) typeStr = "std::pair<const char *, int>";
    return typeStr;
}


// std::pair 的mapo子 InitListExpr修正
void fixMapPairInitListChildren(json &children, const std::string &typeStr){
    for (auto &child:children){
        if (child["kind"] == "InitListExpr" && child["type"]["qualType"] == "void"){
            child["type"]["qualType"] = typeStr.substr(0, typeStr.find('['));
            child["kind"] = "CXXConstructExpr";
        }
    }
}

std::string getMemberInClassName(CXCursor cursor){
    CXCursor parentCursor = clang_getCursorSemanticParent(cursor);
    CXCursorKind kind = clang_getCursorKind(parentCursor);
    if (kind != CXCursor_ClassDecl && kind != CXCursor_StructDecl) return "";
    return cx2str(clang_getCursorSpelling(parentCursor));
}

// 获取引用的信息
json getReferenceDecl(CXCursor cursor, CXCursorKind kind_cursor){
    json refNode;
    CXCursor referenced = clang_getCursorReferenced(cursor);
    if (!clang_isInvalid(kind_cursor)){
        refNode["name"] = cx2str(clang_getCursorSpelling(referenced));
        std::string kind = cx2str(clang_getCursorKindSpelling(clang_getCursorKind(referenced)));
        if (kind == "ParamDecl") kind = "ParamVarDecl";
        refNode["kind"] = kind;
        refNode["type"] = {{"qualType", unifyTypeStr(clang_getTypeSpelling(clang_getCursorType(referenced)))}};
    }
    return refNode;
}

// 检查并补充数组 trait typeid noexpect
void detectAndFillSpecialKind(json &node){
    if (!node.contains("code")) return;
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

void postprocessCallExpr(json &node){
    // 子节点推到 name 自动补全name字段
    if((node["name"].is_null() || node["name"] == "") && node.contains("inner") &&!node["inner"].empty()){
        for (const auto &child:node["inner"]){
            if (child["kind"] == "DeclRefExpr" || child["kind"] == "OverloadedDeclRef"){
                node["name"] = child.value("name", "");
                if ((node["name"] == "" || node["name"].is_null()) && child.contains("referencedDecl"))
                   node["name"] = child["referencedDecl"].value("name", "");
                break;
            }
            if (child.contains("inner")){
                for(const auto &grandchild: child["inner"]){
                    if (grandchild["kind"] == "OverloadedDeclRef"){
                        node["name"] = grandchild.value("name", "");
                        break;
                    }
                }
            }
        }
    }
    // 自动补全 AtomicCallExpr
    static const std::vector<std::string> atomicFuncs = {
        "atomic_fetch_add", "atomic_fetch_sub", "atomic_fetch_and", "atomic_fetch_or", "atomic_fetch_xor",
        "atomic_exchange", "atomic_load", "atomic_store", "atomic_compare_exchange"
    };
    if (node.contains("name") && !node["name"].is_null()){
        std::string name = node["name"];
        if (std::find(atomicFuncs.begin(), atomicFuncs.end(), name) != atomicFuncs.end()){
            node["kind"] = "AtomicCallExpr";
            node["atomicFunc"] = name;
        }
    }
}

// 保存所有标签语句及id
std::map<std::string, int> labelNameToId;

// 遍历AST所有节点 收集label
void collectLabelStmt(const json &node, std::map<std::string, int> &labelMap){
    if (node.contains("kind") && node["kind"] == "LabelStmt" && node.contains("name"))
        labelMap[node["name"]] = node["id"];
    forEachChild(const_cast<json&>(node), [&](json &child) { collectLabelStmt(child, labelMap); });
}

// 为goto语句补充targetlabelId
void patchGotoTarget(json &node, const std::map<std::string, int> &labelMap){
    if (node.contains("kind") && node["kind"] == "GotoStmt"){
        if (node.contains("inner") && !node["inner"].empty()){
            const json &labelRef = node["inner"][0];
            std::string labelName = labelRef.value("name", "");
            if (!labelName.empty() && labelMap.count(labelName)) node["targetLabelId"] = labelMap.at(labelName);
        }
    }
    forEachChild(node, [&](json &child) { patchGotoTarget(child, labelMap); });
}

void patchPseudoDestructorExpr(json &node){
    // 检查当前是否是MemberExpr + TypeRef组合 并且包含 ~ 推断为伪析构
    if (node.contains("kind") && node["kind"] == "MemberExpr" && node.contains("code")
        && node["code"].is_string() && node["code"].get<std::string>().find("~") != std::string::npos
        && node.contains("inner") && node["inner"].is_array() && node["inner"].size() == 2
        && node["inner"][1].contains("kind") && node["inner"][1]["kind"] == "TypeRef"){
            node["kind"] = "CXXPseudoDestructorExpr";
            node["pseudoDestructorType"] = node["inner"][1]["type"]["qualType"];
    }
    forEachChild(node, [&](json &child){ patchPseudoDestructorExpr(child); });
}

void patchFoldExpr(json &node) {
    // 递归处理所有子节点
    forEachChild(node, [&](json &child) { patchFoldExpr(child); });
    // 判断是否为折叠表达式并伪造CXXFoldExpr节点 只判断常见的 "(... <op> ars)
    if (node.contains("code") && node.contains("kind") && node["kind"] == "ImplicitCastExpr") {
        static std::regex fold_regex(R"(\(\.\.\.\s*([+\-*/&|^])\s*([a-zA-Z0-9_]+)\))");
        std::smatch m;
        std::string code = node["code"];
        if (std::regex_match(code, m, fold_regex)) node = {
            {"kind", "CXXFoldExpr"}, {"op", m[1]},  // 匹配左折叠
            {"pattern", "left"}, {"code", code},
            {"inner", node["inner"]}, {"range", node["range"]},
            {"type", node["type"]}, {"valueCategory", node.value("valueCategory", "prvalue")}
        };
    }
}

// 将VarDecl下IntegerLiteral 类型子节点移除
void filterVarDeclArrayDims(json &node){
    // 只处理VarDecl且是数组类型
    if (node.contains("kind") && node["kind"] == "VarDecl" && node.contains("type") && node["type"].contains("qualType")){
        std::string qualType = node["type"]["qualType"];
        if (qualType.find('[') != std::string::npos && qualType.find(']') != std::string::npos){
            if (node.contains("inner") && node["inner"].is_array()){
                json filtered = json::array();
                for (auto &child:node["inner"]){
                    // 仅移除作为数组维度信息的IntegerLiteral
                    if (child.contains("kind") && child["kind"] == "IntegerLiteral") continue;
                    filtered.push_back(child);
                }
                node["inner"] = filtered;
            }
        }
    }
    forEachChild(node, [&](json &child){ filterVarDeclArrayDims(child); });
}

// 收集当前作用域所有参数/变量声明， 返回名到类型的映射
std::unordered_map<std::string, std::string> collectAllScopeVarTypeMap(const json &node){
    std::unordered_map<std::string, std::string> varTypeMap;
    if (node.contains("inner") && node["inner"].is_array()){
        for (const auto &child:node["inner"]){
            // 参数声明
            if (child.contains("kind") && child["kind"] == "ParmDecl" || child["kind"] == "VarDecl" &&
                child.contains("name") && child.contains("type") && child["type"].contains("qualType")){
                    varTypeMap[child["name"]] = child["type"]["qualType"];
                }
            // 递归采集，支持嵌套作用域
            auto subVarMap = collectAllScopeVarTypeMap(child);
            varTypeMap.insert(subVarMap.begin(), subVarMap.end());
        }
    }
    return varTypeMap;
}

// 统一修正 ImplicitCastExpr的类型和必要时转为DeclRefExpr
void fixImplicitCastExprAndDeclRef(json &node, const std::unordered_map<std::string, std::string> &varTypeMap){
    if (node.contains("kind") && node["kind"] == "ImplicitCastExpr"
       && node.contains("code") && varTypeMap.count(node["code"])){
        // 修正类型
        if (node.contains("type") && node["type"].contains("qualType"))
            node["type"]["qualType"] = varTypeMap.at(node["code"]);
        // 如果inner为空则转为DeclRefExpr
        if (node.contains("inner") && node["inner"].is_array() && node["inner"].empty()){
            node["kind"] = "DeclRefExpr";
            node["name"] = node["code"];
        }
    }
    forEachChild(node, [&](json &child){ fixImplicitCastExprAndDeclRef(child, varTypeMap); });
}

void fixAllVarRefTypes(json &node){
    // 只处理函数相关节点
    if (node.contains("kind") && ( node["kind"] == "FunctionDecl" || node["kind"] == "CXXMethodDecl" ||
        node["kind"] == "CXXConstructorDecl")){
            auto typeMap = collectAllScopeVarTypeMap(node);
            fixImplicitCastExprAndDeclRef(node, typeMap);
        }
    forEachChild(node, [&](json &child){ fixAllVarRefTypes(child); });
}

// 缓存所有的类, 结构体
std::map<std::string, json> derivedDataTypeMap;

// 关联构造函数初始化时的对象参数
void relateMemberType(const std::string& typeStr, json& children) {
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

bool isConstructorByTypeStr(std::string typeStr){
    return typeStr.find("std::map") == 0 || typeStr.find("std::unordered_map") == 0 ||
           typeStr.find("std::_Tree_const_iterator") != std::string::npos || typeStr == "key_type" ||
           typeStr == "const key_type" || typeStr == "const std::basic_string<char>" ||
           typeStr.find("lambda at") != std::string::npos || typeStr.find("struct") == 0;
}

bool isConstructorByNameStr(std::string nameStr){
    return nameStr == "vector" || nameStr == "_Tree_const_iterator" || nameStr == "set" || nameStr == "queue" ||
    nameStr == "deque" || nameStr == "stack" || nameStr == "list";
}

// 判断是否为继承父类的构造函数
bool isUsingDecl(std::string codeStr){
    return codeStr.find("using") != std::string::npos && codeStr.find("::") != std::string::npos;
}

bool isConstructorByCodeStr(std::string codeStr, std::string nameStr, std::string typeStr){
        bool cond1 = (typeStr == nameStr);
        bool cond2 = (typeStr == "iterator" && codeStr.find(".find") != std::string::npos);
        bool cond3 = (codeStr.find("]") != std::string::npos && nameStr == "basic_string");
        bool cond4 = (codeStr.find("std::string") == 0);
        bool cond5 = constructCallExpr(codeStr, typeStr);
        bool cond6 = templateConstructCallExpr(nameStr, typeStr);
        bool result = cond1 || cond2 || cond3 || cond4 || cond5 || cond6;
        return result;
}

std::vector<CXCursorKind> locCursorKind = {CXCursor_FunctionDecl, CXCursor_ClassDecl, CXCursor_Destructor, CXCursor_TemplateTypeParameter,
                                           CXCursor_StructDecl, CXCursor_UnionDecl, CXCursor_VarDecl, CXCursor_EnumDecl, CXCursor_ClassTemplate,
                                           CXCursor_Constructor, CXCursor_CXXMethod, CXCursor_TypedefDecl, CXCursor_FunctionTemplate,
                                           CXCursor_MacroExpansion, CXCursor_MacroDefinition, CXCursor_UsingDirective, CXCursor_Namespace};

// 判断是否为内置数据类型
bool isBuiltInType(std::string& type){
    // 内置类型列表
    std::set<std::string> builtInTypes = {
        "int", "float", "double", "char", "bool",
        "short", "long", "unsigned int", "unsigned char",
        "unsigned short", "unsigned long", "void"
    };
    return builtInTypes.count(type);
}

// 构造模板函数的默认类型节点
json buildTemplateDefaultType(const std::string& codeStr) {
    auto eq = codeStr.find('=');
    std::string typeStr = eq == std::string::npos ? "" : codeStr.substr(eq + 1);
    typeStr.erase(std::remove(typeStr.begin(), typeStr.end(), ' '), typeStr.end());
    if (isBuiltInType(typeStr))
        return {{"kind", "BuildInType"}, {"type", {{"qualType", typeStr}}}, {"inner", json::array()}};

    json recordNode = {{"kind", "RecordType"}, {"type", {{"qualType", typeStr}}}};
    json elaboratedNode = {{"kind", "ElaboratedType"}, {"type", {{"qualType", typeStr}}}, {"inner", {recordNode}}};
    return {{"kind", "TemplateArgument"}, {"type", {{"qualType", typeStr}}}, {"inner", {elaboratedNode}}};
}

// 判断文件名是否在-i目录下
bool isInUserInclude(const std::string& fileName){
    for (const auto& dir: g_user_include_dirs){
        // 统一路径分隔符
        std::string prefix = dir;
        if (!prefix.empty() && prefix.back() != '/' && prefix.back() != '\\')
            prefix += getPathSeparator();
        if (fileName.find(prefix) == 0) return true;
    }
    return false;
}

inline bool isRemovable(const json& j){
    return j.is_null() || (j.is_object() && j.empty()) || (j.is_array() && j.empty());
}

void cleanJson(json& node){
    if (node.is_array()){
        for (auto& elem: node) {
            cleanJson(elem);
        }
        node.erase(std::remove_if(node.begin(), node.end(), isRemovable),node.end());
    } else if (node.is_object()) {
        for (auto it = node.begin(); it != node.end(); ) {
            cleanJson(it.value());
            if (isRemovable(it.value())) {
                it = node.erase(it);
            } else {
                ++it;
            }
        }
    }
}


// 全局变量暂存头文件AST
std::vector<json> headerUnits;

void filterToMainFileOnly(json& node, const std::string& mainFileName, std::string parentFileName = "") {
    if (node.is_array()) {
        for (auto& elem : node) {
            filterToMainFileOnly(elem, mainFileName, parentFileName);
        }
        return;
    }
    if (!node.is_object()) return;
    std::string fileName = node.value("fileName", "");
    if (node.contains("locFile"))
        fileName = node["locFile"];
    if (fileName.empty())
        fileName = parentFileName;

    // 规范化路径
    if (!fileName.empty()) {
        try {
            fileName = std::filesystem::weakly_canonical(fileName).string();
        } catch (...) {}
    }
    std::string normMainFileName = mainFileName;
    try {
        normMainFileName = std::filesystem::weakly_canonical(mainFileName).string();
    } catch (...) {}

    // 仅主文件节点和TranslationUnitDecl挂inner，头文件节点聚合到headerUnits
    if (node.value("kind", "") == "TranslationUnitDecl") {
            // 根节点保留
    } else if (fileName != normMainFileName) {
        if (isInUserInclude(fileName) || (isInUserInclude(node.value("included", "")) &&
            node.value("code", "").find("<") == std::string::npos && node.value("code", "").find(">") == std::string::npos)) {
            headerUnits.push_back(node); // 收集到headerUnits
        }
        node = json(); // 移除AST中的节点（不在main的inner里）
        return;
    }

    // 递归处理子节点
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

// 处理构造函数中参数的节点类型为callExpr
void handleCXXCtorInitializerOfCallExpr(json &child) {
    std::string kind = child["inner"][0]["kind"];
    if (kind == "ImplicitCastExpr") {
        child = child["inner"][0];
    } else if (kind == "DeclRefExpr") {
        child["kind"] = "ImplicitCastExpr";
    }
}

// 构建CXXCtorInitializer
json buildCXXCtorInitializer(json &memberRef, json &children, json& parent) {
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

// 构建CXXInheritedCtorInitExpr
json buildCXXInheritedCtorInitExpr(json &memberRef, json &children) {
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

// 添加构造函数的变量初始化节点
json addCXXCtorInitializer(json &children, json& parent) {
    json newChildren = json::array();
    json memberRef = nullptr;
    for (int i = 0; i < children.size(); i++) {
        if (children[i]["kind"] == "MemberRef" || children[i]["kind"] == "TypeRef") {
            memberRef = children[i];
            continue; // 缓存该类型的节点与下一个节点一起构建节点信息
        }
        if (children[i]["kind"] == "CallExpr") {
            handleCXXCtorInitializerOfCallExpr(children[i]);
        }
        if (children[i]["kind"] == "ImplicitCastExpr" || children[i]["kind"] == "IntegerLiteral" ||
        children[i]["kind"] == "StringLiteral" || children[i]["kind"] == "CharacterLiteral" || children[i]["kind"] == "FloatingLiteral") {
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

// 遍历构建typedef的子节点
void buildTypedefChild(CXType& type, json& newChildren, json& children, json& parent) {
    CXString cxType = clang_getTypeSpelling(type);
    std::string typeStr = clang_getCString(cxType);
    clang_disposeString(cxType);
    json node = json::object();
    node["code"] = typeStr;
    node["name"] = typeStr;
    buildNodeRange(node, parent);
    json inner = json::array();
    if(type.kind == CXType_Pointer) {
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

// 修改typedef下类的声明节点类型为constructorExpr
void updateTypedefClassConstructor(json& children) {
    if (children.size() < 2 || (children[0]["kind"] != "TypeRef" && children[1]["kind"] != "CallExpr")) return;
    if (children[0]["type"]["qualType"] == children[1]["type"]["qualType"] && (children[1]["name"] == "map" || children[1]["name"] == "unordered_map"))
        children[1]["kind"] = "CXXConstructExpr";
}


void fillNodeKindTag(json& node, CXCursor cursor, CXCursorKind kind_cursor, const std::string& kindSpelling) {
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
        if (typeStr.find("basic_ostream") == 0 || nameStr.find("operator") != std::string::npos)
            node["kind"] = "CXXOperatorCallExpr";
        else if (isConstructorByTypeStr(typeStr) || isConstructorByNameStr(nameStr) ||
                 isConstructorByCodeStr(codeStr, nameStr, typeStr))
            node["kind"] = "CXXConstructExpr";
        else if ((codeStr.find(".") != std::string::npos || codeStr.find("->") != std::string::npos) &&
                 nameStr.find("operator") == std::string::npos && codeStr.find(nameStr) != 0)
            node["kind"] = "CXXMemberCallExpr";
        else
            node["kind"] = kindSpelling;
        return;
    }
    if (kind_cursor == CXCursor_CXXMethod) {
        node["kind"] = "CXXMethodDecl"; node["mangledName"] = getMemberInClassName(cursor);
    } else if (kind_cursor == CXCursor_Constructor || (kind_cursor == CXCursor_UsingDeclaration && isUsingDecl(codeStr))) {
        node["kind"] = "CXXConstructorDecl"; node["mangledName"] = getMemberInClassName(cursor);
    } else if (kind_cursor == CXCursor_Destructor) {
        node["kind"] = "CXXDestructorDecl"; node["mangledName"] = getMemberInClassName(cursor);
    } else {
        node["kind"] = kindSpelling;
    }
}

void fillNodeSourceContent(
    json& node, const json& content, CXCursorKind kind_cursor, CXCursor cursor,
    CXFile file, const std::string& displayName, const std::string& fileStr
) {
    if (kind_cursor == CXCursor_TranslationUnit) {
        node["fileName"] = fileStr;
        return;
    }

    if (kind_cursor == CXCursor_UnaryOperator) {
        fillUnaryOperatorInfo(node, cursor);
    } else if (kind_cursor == CXCursor_BinaryOperator || kind_cursor == CXCursor_CompoundAssignOperator) {
        node["opcode"] = cx2str(clang_Cursor_getBinaryOpcodeStr(clang_Cursor_getBinaryOpcode(cursor)));
    } else {
        node["name"] = displayName;
    }

    // 填充 code 字段
    std::string codeStr = (content.contains("code") && content["code"].is_string())
                          ? content["code"].get<std::string>() : "";
    if (!content.is_null() && kind_cursor != CXCursor_TranslationUnit)
        node["code"] = codeStr;

    // InclusionDirective 特殊处理
    if (kind_cursor == CXCursor_InclusionDirective && !content.is_null()) {
        node["kind"] = "InclusionDirective";
        node["fileName"] = cx2str(clang_getIncludedFile(cursor) ?
                                  clang_getFileName(clang_getIncludedFile(cursor)) :
                                  clang_getCursorSpelling(cursor));
        node["name"] = displayName;
        node["code"] = codeStr;
        node["locFile"] = node["fileName"];
        node["range"] = {{"begin", content["begin"]}, {"end", content["end"]}};
        node["included"] = fileStr;
        return;
    }

    // 字面量节点 value 字段
    if (kind_cursor == CXCursor_IntegerLiteral ||
        kind_cursor == CXCursor_StringLiteral ||
        kind_cursor == CXCursor_CXXBoolLiteralExpr) {
        node["value"] = node.value("code", "");
        }
}

void fillVarDeclStorageClass(json& node, CXCursor cursor, CXCursorKind kind_cursor) {
    if (kind_cursor == CXCursor_VarDecl) {
        CXCursor parent = clang_getCursorSemanticParent(cursor);
        if (clang_getCursorKind(parent) == CXCursor_ClassDecl ||
            clang_getCursorKind(parent) == CXCursor_StructDecl) {
            node["storageClass"] = "static";
            }
    }
}

void fillDeclRefInfo(json& node, CXCursor cursor, CXCursorKind kind_cursor) {
    if (kind_cursor == CXCursor_DeclRefExpr)
        node["referencedDecl"] = getReferenceDecl(cursor, kind_cursor);
}

void fillNodeIdRangeLoc(json& node, const json& content, CXCursorKind kind_cursor,
                        CXFile file, const std::string& displayName) {
    if (!content.is_null()) {
         node["id"] = content["id"];
         json begin = content["begin"];
         node["range"] = {{"begin", begin}, {"end", content["end"]}};
    }
    if (file && std::find(locCursorKind.begin(), locCursorKind.end(), kind_cursor) != locCursorKind.end()) {
        node["locFile"] = file ? cx2str(clang_getFileName(file)) : "";
    }
    node["valueCategory"] = (kind_cursor == CXCursor_EnumConstantDecl) ? displayName : "prvalue";
}

void fillMemberExprName(json& node) {
    if (node["name"] != "") return;
    std::string codeStr = node["code"];
    size_t index1 = codeStr.find("->");
    size_t index2 = codeStr.find(".");
    size_t index = 0;
    if (index1 == std::string::npos && index2 == std::string::npos) {
        return;
    } else if (index1 != std::string::npos && index2 != std::string::npos) {
        index = index1 < index2 ? index1 + 2 : index2 + 1; // 去掉成员访问符的长度
    } else {
        index = index1 != std::string::npos ? index1 + 2 : index2 + 1;
    }
    size_t index3 = codeStr.find("(");
    if (index3 != std::string::npos) {
        node["name"] = codeStr.substr(index, index3 - index);
    } else {
        node["name"] = codeStr.substr(index);
    }
}

void nodePostprocess(
    json& node,
    CXCursor cursor,
    CXCursorKind kind_cursor,
    json& children
) {
    std::string codeStr = node.value("code", "");
    std::string typeStr = node["type"]["qualType"];
    if (node["kind"] == "InitListExpr" && typeStr.find("std::pair") != std::string::npos){
        fixMapPairInitListChildren(children, typeStr);
    } else if (node["kind"] == "CXXOperatorCallExpr"){
        if (children.size() >= 2){
            std::string chilName1 = children[1]["name"].is_null() ? "": children[1]["name"];
            if (children[1]["code"] == "<<" || chilName1.find("operator") != std::string::npos)
                swapChildNode(children);
            std::string childName0 = children[0]["name"].is_null() ? "" : children[0]["name"];
            if (childName0.find("operator") != std::string::npos) children[0]["castKind"] = "FunctionToPointerDecay";
        }
        if (children.size() == 3) children[1]["valueCategory"] = "lvalue";
    } else if (node["kind"] == "CXXConstructExpr" || node["kind"] == "CallExpr"){
        if (!children.empty() && children[0]["kind"] == "MemberExpr") {
            node["kind"] = "CXXMemberCallExpr";
        }else {
            changeChildNodeType(children);
        }
    } else if (node["kind"] == "ImplicitCastExpr") {
        if (!children.empty() && children[0]["kind"] == "CallExpr") {
            node["kind"] = "ExprWithCleanups";
        } else if (!children.empty() && children[0]["kind"] == "DeclRefExpr" &&
            codeStr.find(children[0]["code"]) == 0 && codeStr.find("(") != std::string::npos) {
            node["kind"] = "RecoveryExpr";
        }
    } else if (node["kind"] == "CXXConstructorDecl") {
        children = addCXXCtorInitializer(children, node);
    } else if (node["kind"] == "TypedefDecl" && (children.size() == 0 || (children[0]["kind"] != "CXXRecordDecl" && children[0]["kind"] != "EnumDecl"))) {
        json newChildren = json::array();
        buildTypedefChild(clang_getTypedefDeclUnderlyingType(cursor), newChildren, children, node);
        children = newChildren;
    }

    if (node["kind"] == "CXXMemberCallExpr" || node["kind"] == "MemberExpr") fillMemberExprName(node);

    if (node["kind"] == "InitListExpr") relateMemberType(typeStr, children);

    if (node["kind"] == "VarDecl") updateTypedefClassConstructor(children);

    if (kind_cursor == CXCursor_TemplateTypeParameter && codeStr.find("=") != std::string::npos)
        children.push_back(buildTemplateDefaultType(codeStr));

    node["inner"] = children;

    if (kind_cursor == CXCursor_ClassDecl || kind_cursor == CXCursor_StructDecl)
        derivedDataTypeMap[node["name"]] = node;

    if (kind_cursor == CXCursor_CXXNewExpr){
        annotateNewExprArrayInfo(node, children);
    } else if (kind_cursor == CXCursor_MemberRefExpr){
        annotateMemberExprIsArrow(node);
    } else if (kind_cursor == CXCursor_CallExpr){
        postprocessCallExpr(node);
    }
    // 特殊表达式类型自动判断兜底
    detectAndFillSpecialKind(node);
}
// ==========================buildASTJson 主体========================

json buildASTJson(CXCursor cursor){
    CXSourceLocation loc = clang_getCursorLocation(cursor);
    CXCursorKind kind_cursor = clang_getCursorKind(cursor);

    CXFile file;
    clang_getSpellingLocation(loc, &file, nullptr, nullptr, nullptr);
    std::string fileName = file ? cx2str(clang_getFileName(file)) : "";

    bool isInclude = isInUserInclude(fileName);
    if (kind_cursor != CXCursor_TranslationUnit && !clang_Location_isFromMainFile(loc) && !isInclude){
            return json();
    }
    if (kind_cursor == CXCursor_LinkageSpec){ // extern "C" { ... }
        json children = json::array();
        visitAllChildren(cursor, children);
        if (children.size() == 1) return children[0];
        if (children.empty()) return json();
        return children;
    }

    json node;
    std::string kindSpelling = cx2str(clang_getCursorKindSpelling(kind_cursor));
    std::string displayName = cx2str(clang_getCursorSpelling(cursor));
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

    json children = json::array();
    visitAllChildren(cursor, children); // 子节点递归
    nodePostprocess(node, cursor, kind_cursor, children);
    return node;
}

// ======================工程辅助代码==========================

CXTranslationUnit createTranslationUnit(CXIndex index, const CommandLineOptions& opts, const std::vector<const char*>& args) {
    return clang_parseTranslationUnit(index, opts.input_file.c_str(), args.data(), args.size(), nullptr, 0,
        CXTranslationUnit_DetailedPreprocessingRecord);
}

json buildAndProcessAST(CXTranslationUnit unit, const CommandLineOptions& opts) {
    json ast = buildASTJson(clang_getTranslationUnitCursor(unit));
    std::cout << "[STEP1] buildASTJson finished\n";
    std::string mainFileName = fs::canonical(opts.input_file).string();
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
    fixAllVarRefTypes(ast);
    filterVarDeclArrayDims(ast);
    collectLabelStmt(ast, labelNameToId);
    patchGotoTarget(ast, labelNameToId);
    fixCallExprChildKind(ast);
    patchFoldExpr(ast);
    std::cout << "[STEP3] AST built successfully\n";
    return ast;
}

// ===================主程序入口==================
int main(int argc, char** argv) {
    if (argc < 2) {
        cliutil::printUsage(argv[0]);
        return 1;
    }

    auto opts = cliutil::parseCommandLineArgs(argc, argv);
    cliutil::addMainFileDirToInclude(opts);

    if (!cliutil::validateInput(opts)) return 1;
    ClangArgs clang_args = cliutil::getClangArgs(opts);

    g_user_include_dirs = opts.user_include_dirs;
    CXIndex index = clang_createIndex(0, 0);
    CXTranslationUnit unit = createTranslationUnit(index, opts, clang_args.cstr_args);
    if (!unit) {
        std::cerr << "[ERROR] clang_parseTranslationUnit failed!" << std::endl;
        for (size_t i = 0; i < clang_args.cstr_args.size(); ++i) {
             std::cerr << clang_args.cstr_args[i] << std::endl;
        }
        return 2;
    }
    json ast = buildAndProcessAST(unit, opts);

    saveASTToFile(ast, opts.output_file);

    clang_disposeTranslationUnit(unit);
    clang_disposeIndex(index);
    return 0;
}
