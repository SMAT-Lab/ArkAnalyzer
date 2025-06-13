#pragma execution_character_set("utf-8")

#include <filesystem>
#include <sstream>
#include <clang-c/Index.h>
#include "json.hpp"
#include <fstream>
#include <iostream>
#include <string>
#include <vector>
#include <set>
#include <algorithm>

using json = nlohmann::json;
namespace fs = std::filesystem;

inline void trim(std::string &s){
    s.erase(0, s.find_first_not_of(" \t\r\n"));
    s.erase(s.find_last_not_of(" \t\r\n") + 1);
}

inline std::string cx2str(const CXString &s){
    std::string r = clang_getCString(s) ? clang_getCString(s) : "" ;
    clang_disposeString(s);
    return r;
}

inline std::string 
extractParentContent(const std::string &code, size_t lpos = std::string::npos, char open = '(', char close = ')'){
    if (lpos == std::string::npos) lpos = code.find(open);
    size_t rpos = code.rfind(close);
    if (lpos != std::string::npos && rpos != std::string::npos && rpos > lpos +1){
        std::string inside = code.substr(lpos + 1, rpos - lpos -1);
        trim(inside);
        return inside;
    }
    return std::string();
}

inline std::vector<std::string> split(const std::string &s, char delimiter){
    std::vector<std::string> tokens;
    std::istringstream iss(s);
    std::string token;
    while (getline(iss, token, delimiter)){
        trim(token);
        tokens.push_back(token);
    }
    return tokens;
}

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

inline bool fillKindBycode(json &node, const std::string &codeStr,
                           const std::string &prefix, const std::string &kind,
                           const std::string &argField = ""){
    size_t pos = codeStr.find(prefix + "(");
    if (pos != std::string::npos && pos == 0){
        node["kind"] == kind;
        if (!argField.empty()) node[argField] = extractParentContent(codeStr, codeStr.find('(', pos));
        return true;
    }
    return false;
}

std::map<std::string, std::string> fileContents;

void loadFileContent(const std::string &filename){
    std::ifstream file(filename, std::ios::in | std::ios::binary);
    if (!file) return;
    std::string content((std::istreambuf_iterator<char>(file)),
    std::istreambuf_iterator<char>());
    fileContents[filename] = std::move(content);
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

    if (startFile != endFile || startOffset >= endOffset) return json();

    CXString fileName = clang_getFileName(startFile);
    const char *cFileName = clang_getCString(fileName);
    std::string filename = cFileName ? cFileName : "";
    clang_disposeString(fileName);
    if (filename.empty() || fileContents.find(filename) == fileContents.end()) loadFileContent(filename);

    const std::string &content = fileContents[filename];
    if (startOffset >= content.size() || endOffset > content.size()) return json();
    unsigned tokLen = endOffset > startOffset ? (endOffset - startOffset) : 0;
    return {
        {"id", startOffset + endOffset},
        {"code", content.substr(startOffset, endOffset - startOffset)},
        {"begin", {{"line", startLine}, {"col", startColumn}, {"offset", startOffset}, {"tokLen", tokLen}}},
        {"end", {{"line", endLine}, {"col", endColumn}, {"offset", endOffset}}}
    };

}

void filleUnaryOperatorInfo(json &node, CXCursor cursor){
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
                   codeStr.find(".push") != std::string::npos || typeStr.find("basic_ostream") != std::string::npos || typeStr == "bool" || 
                   typeStr == "mapped_type" || codeStr.find(".erase") != std::string::npos){
            return "ExprWithCleanups";
        }else if (codeStr.find("std::make_pair") != std::string::npos){
             return "MaterializeTemporaryExpr";
        }
    }
    return "ImplicitCaseExpr";
}

void extractArraySizes(const json &node, std::vector<std::string> &arraySizes){
    if (node.contains("kind")){
        if (node["kind"] == "IntegerLiteral" && node.contains("value")){
            arraySizes.push_back(node["value"]);
        } else if (node["kind"] == "ImplicitCaseExpr" && node.contains("inner")){
            for (const auto &gchild:node["inner"]){
                extractArraySizes(gchild, arraySizes);
            }
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

void swapChildNode(json &children){
    json child = children[1];
    children[1] = children[0];
    children[0] = child;
}

bool constructCallExpr(std::string codeStr, std::string typeStr){
    size_t index = codeStr.find('(');
    if (index > codeStr.length()) return false;
    std::string newStr = typeStr + codeStr.substr(index);
    if (newStr == codeStr) return true;
    return false;
}

bool templateConstructCallExpr(std::string nameStr, std::string typeStr){
    if (typeStr.find(nameStr) == 0 && typeStr.find('<') != std::string::npos && typeStr.find('>') != std::string::npos){
        return true;
    }
    return false;
}

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

void detectAndFillSpecialKind(json &node){
    if (!node.contains("code")) return;
    std::string codeStr = node["code"];
    static const std::vector<std::pair<std::string, std::string>> traitFuncs = {
        {"__array_rank", "ArrayTypeTraitExpr"},
        {"__array_extent", "ArrayTypeTraitExpr"},
        {"__array_rank_u", "ArrayTypeTraitExpr"},
        {"__array_extent_u", "ArrayTypeTraitExpr"}
    };
    for (const auto &[func, kind]: traitFuncs) {
        if (fillKindBycode(node, codeStr, func, kind, "traitArgs")) {
            node["traitFunc"] = func;
            break;
        }
    }
    fillKindBycode(node, codeStr, "noexcept", "CXXNoexceptExpr", "noexceptArg");
    fillKindBycode(node, codeStr, "typeid", "CXXTypeidExpr", "typeArg");
}

void postprocessCallExpr(json &node){
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

std::map<std::string, int> labelNameToId;

void collectLabelStmt(const json &node, std::map<std::string, int> &labelMap){
    if (node.contains("kind") && node["kind"] == "LabelStmt" && node.contains("name"))
        labelMap[node["name"]] = node["id"];
    if (node.contains("inner")){
        for (const auto &child: node["inner"]){
            collectLabelStmt(child, labelMap);
        }
    }
}

void patchGotoTarget(json &node, const std::map<std::string, int> &labelMap){
    if (node.contains("kind") && node["kind"] == "GotoStmt"){
        if (node.contains("inner") && !node["inner"].empty()){
            const json &labelRef = node["inner"][0];
            std::string labelName = labelRef.value("name", "");
            if (!labelName.empty() && labelMap.count(labelName)) node["targetLabelId"] = labelMap.at(labelName);
        }
    }
    if (node.contains("inner")){
        for (auto & child:node["inner"]){
            patchGotoTarget(child, labelMap);
        }
    }
}

void patchPseudoDestructorExpr(json &node){
    // 检查当前是否是MemberExpr + TypeRef组合 并且包含 ~ 推断为伪析构
    if (node.contains("kind") && node["kind"] == "MemberExpr"
        && node.contains("code") && node["code"].is_string() && node["code"].get<std::string>().find("~") != std::string::npos
        && node.contains("inner") && node["inner"].is_array()
        && node["inner"].size() == 2
        && node["inner"][1].contains("kind")
        && node["inner"][1]["kind"] == "TypeRef"){
            node["kind"] = "CXXPseudoDestructorExpr";
            node["pseudoDestructorType"] = node["inner"][1]["type"]["qualType"];
    }
    // 递归对子节点处理
    if (node.contains("inner") && node["inner"].is_array()){
        for (auto &child:node["inner"]){
            patchPseudoDestructorExpr(child);
        }
    }
}

void patchCastExprWithParent(json &node, const std::string &parent_code = "") {
    // 获取当前节点 code
    std::string self_code = node.value("code", "");
    std::string merged_code = parent_code.empty() ? self_code : parent_code;

    // 需要处理的 C++ cast 类型
    struct CastInfo {
        const char* keyword;
        const char* kind;
    } cast_types[] = {
        {"reinterpret_cast", "CXXReinterpretCastExpr"},
        {"static_cast",      "CXXStaticCastExpr"},
        {"const_cast",       "CXXConstCastExpr"},
        {"dynamic_cast",     "CXXDynamicCastExpr"},
    };
    // 检查并修正类型
    if (node.value("kind", "") == "ImplicitCastExpr") {
        for (const auto& cast : cast_types) {
            std::string kw = std::string(cast.keyword) + "<";
            auto lpos = merged_code.find(kw);
            if (lpos != std::string::npos) {
                node["kind"] = cast.kind;
                auto rpos = merged_code.find('>', lpos);
                if (rpos != std::string::npos && rpos > lpos) {
                    node["castType"] = merged_code.substr(lpos + kw.length(), rpos - (lpos + kw.length()));
                }
                break;
            }
        }
    }
    // 递归处理子节点
    if (node.contains("inner") && node["inner"].is_array()) {
        std::string next_code = self_code.empty() ? parent_code : self_code;
        for (auto& child : node["inner"]) {
            patchCastExprWithParent(child, next_code);
        }
    }
}



void filterVarDeclArrayDims(json &node){
    if (node.contains("kind") && node["kind"] == "VarDecl" &&
        node.contains("type") && node["type"].contains("qualType")){
            std::string qualType = node["type"]["qualType"];
            if (qualType.find('[') != std::string::npos && qualType.find(']') != std::string::npos){
                if (node.contains("inner") && node["inner"].is_array()){
                    json filtered = json::array();
                    for (auto &child:node["inner"]){
                        if (child.contains("kind") && child["kind"] == "IntegerLiteral") continue;
                        filtered.push_back(child);
                    }
                    node["inner"] = filtered;
                }
            }
        }

    if (node.contains("inner") && node["inner"].is_array()){
        for (auto &child: node["inner"]){
            filterVarDeclArrayDims(child);
        }
    }
}

std::unordered_map<std::string, std::string> collectAllScopeVarTypeMap(const json &node){
    std::unordered_map<std::string, std::string> varTypeMap;
    if (node.contains("inner") && node["inner"].is_array()){
        for (const auto &child:node["inner"]){
            if (child.contains("kind") && child["kind"] == "ParmDecl" || child["kind"] == "VarDecl" &&
                child.contains("name") && child.contains("type") && child["type"].contains("qualType")){
                    varTypeMap[child["name"]] = child["type"]["qualType"];
                }
            auto subVarMap = collectAllScopeVarTypeMap(child);
            varTypeMap.insert(subVarMap.begin(), subVarMap.end());

        }
    }
    return varTypeMap;
}

void fixImplicitCastExprAndDeclRef(json &node, const std::unordered_map<std::string, std::string> &varTypeMap){
    if (node.contains("kind") && node["kind"] == "ImplicitCastExpr"
       && node.contains("code") && varTypeMap.count(node["code"])){
        if (node.contains("type") && node["type"].contains("qualType"))
            node["type"]["qualType"] = varTypeMap.at(node["code"]);

        if (node.contains("inner") && node["inner"].is_array() && node["inner"].empty()){
            node["kind"] = "DeclRefExpr";
            node["name"] = node["code"];
        }
    }
    if (node.contains("inner") && node["inner"].is_array()){
        for (auto &child: node["inner"]){
            fixImplicitCastExprAndDeclRef(child, varTypeMap);
        }
    }
}

void fixAllVarRefTypes(json &node){
    if (node.contains("kind") && (
        node["kind"] == "FunctionDecl" ||
        node["kind"] == "CXXMethodDecl" ||
        node["kind"] == "CXXConstructorDecl")){
            auto typeMap = collectAllScopeVarTypeMap(node);
            fixImplicitCastExprAndDeclRef(node, typeMap);
        }
    if (node.contains("inner") && node["inner"].is_array()){
        for (auto &child: node["inner"]){
            fixAllVarRefTypes(child);
        }
    }
}

std::map<std::string, json> derivedDataTypeMap;

void relateMemberType(std::string typeStr, json &children){
    json classNode = derivedDataTypeMap[typeStr];
    if (!classNode.is_null() && children.size() == classNode["inner"].size()){
        for (int i =0; i< children.size(); i++){
            if (children[i]["type"]["qualTYpe"] != classNode["inner"][i]["type"]["qualType"]){
                json constructNode;
                constructNode["id"] = children[i]["id"];
                constructNode["code"] = children[i]["code"];
                constructNode["name"] = children[i]["name"];
                constructNode["range"] = children[i]["range"];
                constructNode["type"] = classNode["inner"][i]["type"];
                constructNode["kind"] = "CXXConstructExpr";
                json childInner = json::array();
                childInner.push_back(children[i]);
                constructNode["inner"] = childInner;
                children[i] = constructNode;
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

bool isConstructorByCodeStr(std::string codeStr, std::string nameStr, std::string typeStr){
    return typeStr == nameStr || (typeStr == "iterator" && codeStr.find(".find") != std::string::npos) ||
    (codeStr.find("]") != std::string::npos && nameStr == "basic_string") || codeStr.find("std::string") == 0 ||
    constructCallExpr(codeStr,typeStr) || templateConstructCallExpr(nameStr, typeStr);
}

std::vector<CXCursorKind> locCursorKind = {CXCursor_FunctionDecl, CXCursor_ClassDecl, CXCursor_Destructor, CXCursor_TemplateTypeParameter,
                                           CXCursor_StructDecl, CXCursor_UnionDecl, CXCursor_VarDecl, CXCursor_EnumDecl, CXCursor_ClassTemplate,
                                           CXCursor_Constructor, CXCursor_CXXMethod, CXCursor_TypedefDecl, CXCursor_FunctionTemplate};

bool isBuiltInType(std::string& type){
    std::set<std::string> builtInTypes = {
        "int", "float", "double", "char", "bool",
        "short", "long", "unsigned int", "unsigned char",
        "unsigned short", "unsigned long", "void"
    };
    return builtInTypes.count(type);
}

json buildTemplateDefaultType(std::string codeStr){
    size_t ind = codeStr.find("=");
    std::string typeStr = codeStr.substr(ind + 1, codeStr.length() - ind);
    typeStr.erase(std::remove(typeStr.begin(), typeStr.end(), ' '), typeStr.end());
    json defaultNode = json::object();
    if (isBuiltInType(typeStr)){
        defaultNode["kind"] = "BuildInType";
        defaultNode["type"] = {{"qualType", typeStr}};
        defaultNode["inner"] = json::array();
    } else {
        json recordNode = json::object();
        recordNode["kind"] = "RecordType";
        recordNode["type"] = {{"qualType", typeStr}};

        json elaboratedNode = json::object();
        elaboratedNode["kind"] = "ElaboratedType";
        elaboratedNode["type"] = {{"qualType", typeStr}};
        elaboratedNode["inner"] = json::array({recordNode});

        defaultNode["kind"] = "TemplateArgument";
        defaultNode["type"] = {{"qualType", typeStr}};
        defaultNode["inner"] = json::array({elaboratedNode});
    }
    return defaultNode;
}


json buildASTJson(CXCursor cursor){
    CXSourceLocation loc = clang_getCursorLocation(cursor);
    CXCursorKind kind_cursor = clang_getCursorKind(cursor);
    if ((kind_cursor != CXCursor_TranslationUnit && !clang_Location_isFromMainFile(loc)) ||
        kind_cursor == CXCursor_LinkageSpec){
        return json();
    }
    CXFile file;
    clang_getSpellingLocation(loc, &file, nullptr, nullptr, nullptr);
    json node;
    std::string kindSpelling = cx2str(clang_getCursorKindSpelling(kind_cursor));
    std::string displayName = cx2str(clang_getCursorSpelling(cursor));
    CXSourceRange range = clang_getCursorExtent(cursor);

    node["type"] = {{"qualType", unifyTypeStr(clang_getTypeSpelling(clang_getCursorType(cursor)))}};
    std::string typeStr = node["type"]["qualType"];

    json content = getSourceContent(range);
    if (kind_cursor == CXCursor_TranslationUnit){
        node["fileName"] = file ? cx2str(clang_getFileName(file)) : displayName;
    } else if (kind_cursor == CXCursor_BinaryOperator || kind_cursor == CXCursor_CompoundAssignOperator){
        node["opcode"] = cx2str(clang_Cursor_getBinaryOpcodeStr(clang_Cursor_getBinaryOpcode(cursor)));
    } else {
        node["name"] = displayName;
    }
    std::string nameStr = node["name"].is_null() ? "" : node["name"];

    if (content != "" && kind_cursor != CXCursor_TranslationUnit)
        node["code"] = content["code"];
    std::string codeStr = content["code"];

    if (kind_cursor == CXCursor_IntegerLiteral ||
        kind_cursor == CXCursor_StringLiteral ||
        kind_cursor == CXCursor_CXXBoolLiteralExpr)
        node["value"] = node["code"];

    if (kind_cursor == CXCursor_ClassDecl){
        node["kind"] = "CXXRecordDecl";
        node["tagUsed"] = "class";
    } else if (kind_cursor == CXCursor_StructDecl){
        node["kind"] = "CXXRecordDecl";
        node["tagUsed"] = "struct";
    } else if (kind_cursor == CXCursor_EnumDecl){
        node["kind"] = "EnumDecl";
        node["tagUsed"] = "enum";
    } else if (kind_cursor == CXCursor_UnionDecl){
        node["kind"] = "CXXRecordDecl";
        node["tagUsed"] = "union";
    } else if (kind_cursor == CXCursor_UnexposedExpr){
        node["kind"] = handleUnexposedExpr(node);
    } else if (kind_cursor == CXCursor_UsingDirective){
        node["kind"] = "UsingDirectiveDecl";
        node["isImplicit"] = true;
    } else if (kind_cursor == CXCursor_MemberRef){
        node["kind"] = "MemberExpr";
        fillMemberName(node, displayName);
    } else if (kind_cursor == CXCursor_CallExpr){
        if (typeStr.find("basic_ostream") == 0 ||
            nameStr.find("operator") != std::string::npos){
            node["kind"] = "CXXOperatorCallExpr";
        } else if ((codeStr.find(".") != std::string::npos || codeStr.find("->") != std::string::npos) &&
                    nameStr.find("operator") == std::string::npos && codeStr.find(nameStr)!=0){
                        node["kind"] = "CXXMemberCallExpr";
        } else if (isConstructorByTypeStr(typeStr) || isConstructorByNameStr(nameStr) ||
        isConstructorByCodeStr(codeStr, nameStr, typeStr)){
            node["kind"] = "CXXConstructExpr";
        } else {
            node["kind"] = kindSpelling;
        }
    } else if (kind_cursor == CXCursor_CXXMethod){
        node["kind"] = "CXXMethodDecl";
        node["mangledName"] = getMemberInClassName(cursor);
    } else if (kind_cursor == CXCursor_Constructor){
        node["kind"] = "CXXConstructorDecl";
        node["mangledName"] = getMemberInClassName(cursor);
    } else if (kind_cursor == CXCursor_Destructor){
        node["kind"] = "CXXDestructorDecl";
        node["mangledName"] = getMemberInClassName(cursor);
    } else {
        node["kind"] = kindSpelling;
    }

    if (kind_cursor == CXCursor_VarDecl){
        CXCursor parent = clang_getCursorSemanticParent(cursor);
        if (clang_getCursorKind(parent) == CXCursor_ClassDecl || clang_getCursorKind(parent) == CXCursor_StructDecl){
            node["storageClass"] = "static";
        }
    }

    if (kind_cursor == CXCursor_DeclRefExpr)
        node["referencedDecl"] = getReferenceDecl(cursor, kind_cursor);
    node["id"] = content["id"];
    json begin = content["begin"];
    node["range"] = {{"begin", begin}, {"end", content["end"]}};
    if (file && std::find(locCursorKind.begin(), locCursorKind.end(), kind_cursor) != locCursorKind.end()){
        begin["file"] = cx2str(clang_getFileName(file));
        node["loc"] = begin;
    }
    node["valueCategory"] = (kind_cursor == CXCursor_EnumConstantDecl) ? displayName : "prvalue";

    json children = json::array();
    clang_visitChildren(
        cursor,
        [](CXCursor child, CXCursor parent, CXClientData client_data){
            json *list = static_cast<json *>(client_data);
            json childAst = buildASTJson(child);
            CXCursorKind parent_kind = clang_getCursorKind(parent);
            if (!childAst.is_null() && !(parent_kind == CXCursor_Constructor && (childAst["kind"] == "MemberRef" ||
                                                                                 childAst["kind"] ==
                                                                                "ImplicitCastExpr"))){
                list->push_back(childAst);
            }
            return CXChildVisit_Continue;
        },
        &children
    );
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
    } else if (node["kind"] == "CXXConstructExpr"){
        changeChildNodeType(children);
    }
    if (node["kind"] == "InitListExpr") relateMemberType(typeStr, children);

    if (kind_cursor == CXCursor_TemplateTypeParameter && codeStr.find("=") != std::string::npos){
        children.push_back(buildTemplateDefaultType(codeStr));
    }
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

    detectAndFillSpecialKind(node);
    return node;
}

std::string get_default_output_path(const std::string &input_path){
    size_t last_dot = input_path.find_last_of('.');
    std::string filename = (last_dot != std::string::npos) ? input_path.substr(0, last_dot) : input_path;
    return filename + ".json";
}

bool isSameFile(const std::string &pathA, const std::string &pathB){
    try{
        return std::filesystem::path(pathA).filename() == std::filesystem::path(pathB).filename();
    } catch (const std::filesystem::filesystem_error &e) {
        return false;
    }
}

struct CompileArgs{
    std::vector<std::string> string_args;
    std::vector<const char *> cstr_args;
};

CompileArgs load_compile_commands(const std::string &compile_commands_path, const std::string &input_file){
    std::ifstream file(compile_commands_path);
    CompileArgs result;
    if (!file.is_open()){
        std::cerr << "无法打开 compile_commands.json \n";
        return result;
    }
    json compile_commands_json;
    try {file >> compile_commands_json;}
    catch (const json::exception &e){
        std::cerr << "JSON 解析错误: "<< e.what()<< std::endl;
        return result;
    }
    fs::path input_file_path = fs::canonical(input_file);
    for (const auto &command: compile_commands_json){
        if (command.contains("file") && command.contains("command")){
            std::string command_file = command["file"].get<std::string>();
            fs::path command_file_path;
            try {
                command_file_path = fs::canonical(command_file);
            } catch (const std::filesystem::filesystem_error &e){
                std::cerr << "路径错误: "<< e.what() << std::endl;
                continue;
            }
            if (fs::equivalent(command_file_path, input_file_path)){
                std::string directory_str = command_file_path.parent_path().string();
                result.string_args.push_back("-I" + directory_str);
                result.cstr_args.push_back(result.string_args.back().c_str());
                std::string command_str = command["command"].get<std::string>();
                std::istringstream iss(command_str);
                std::string arg;
                while (iss >>arg){
                    if (!isSameFile(arg, input_file)){
                        result.string_args.push_back(arg);
                        result.cstr_args.push_back(result.string_args.back().c_str());
                    }
                }
                break;
            }
        } else {
            std::cerr<< "compile_commands.json 中 缺少 file 或 command 字段"<< std::endl;
        }
    }
    return result;
}

int main(int argc, char **argv){
    if (argc < 2){
        std::cerr << "Usage: "<< argv[0] << "<file.cpp> [-o <ouput.json>] [-c <compile_commands.json>]\n";
        return 1;
    }
    std::string input_file, output_file, compile_commands_file;
    for (int i = 1; i< argc; ++i){
        std::string arg = argv[i];
        if (arg == "-o" && i + 1 <argc) output_file = argv[++i];
        else if (arg == "-c" && i + 1 < argc) compile_commands_file = argv[++i];
        else if (input_file.empty()) input_file = arg;
    }
    if (input_file.empty()){
        std::cerr << "Error: No input file provided. \n";
        return 1;
    }
    if (output_file.empty()) output_file = get_default_output_path(input_file);

    CXIndex index = clang_createIndex(0,0);
    std::vector<const char *> args;
    CompileArgs compile_args;
    if (!compile_commands_file.empty()){
        compile_args = load_compile_commands(compile_commands_file, input_file);
        args = compile_args.cstr_args;
    } else {
        args.push_back("-std=c++17");
    }
    std::cout << std::endl;
    std::vector<const char *> args_with_null = args;
    CXTranslationUnit unit = clang_parseTranslationUnit(
            index, input_file.c_str(), args_with_null.data(), args_with_null.size() - 1, nullptr, 0,
            CXTranslationUnit_None);
    if (!unit){
        std::cerr << "Parse error \n";
        clang_disposeIndex(index);
        return 2;
    }
    json ast = buildASTJson(clang_getTranslationUnitCursor(unit));
    std::map<std::string, int> labelNameToId;
    patchPseudoDestructorExpr(ast);
    fixAllVarRefTypes(ast);
    filterVarDeclArrayDims(ast);
    collectLabelStmt(ast, labelNameToId);
    patchGotoTarget(ast, labelNameToId);
    std::cout<< "AST built successfully\n";
    std::ofstream(output_file) << ast.dump(-1, ' ', false, json::error_handler_t::replace);
    std::cout << "AST written to: "<< output_file << std::endl;
    clang_disposeTranslationUnit(unit);
    clang_disposeIndex(index);
    return 0;

}