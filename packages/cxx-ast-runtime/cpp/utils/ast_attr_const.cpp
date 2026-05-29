/*
 * Copyright (c) 2026 Huawei Device Co., Ltd.
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

#include "utils/ast_kind_const.h"

#include <llvm/ADT/StringMap.h>

namespace ast_dumper {

namespace {

struct ModifierFlagEntry {
    const char *name;
    uint32_t flag;
};

/// Wire modifier_flags bits; layout matches ModifierType in src/core/model/ArkBaseModel.ts.
constexpr ModifierFlagEntry K_MODIFIER_FLAG_TABLE[] = {
    {"private", 1u},
    {"protected", 1u << 1},
    {"public", 1u << 2},
    {"static", 1u << 4},
    {"const", 1u << 7},
    {"override", 1u << 13},
    {"extern", 1u << 21},
    {"friend", 1u << 22},
    {"virtual", 1u << 23},
    {"pure virtual", 1u << 24},
    {"inline", 1u << 25},
    {"mutable", 1u << 26},
    {"explicit", 1u << 27},
    {"constexpr", 1u << 28},
    {"volatile", 1u << 29},
    {"noexcept", 1u << 30},
};

struct KindEntry {
    const char *name;
    uint16_t id;
};

struct AttrEntry {
    const char *name;
    uint8_t id;
};

constexpr KindEntry K_KIND_TABLE[] = {
    {"TranslationUnit", 1},
    {"ArraySubscriptExpr", 2},
    {"ArrayTypeTraitExpr", 3},
    {"AtomicCallExpr", 4},
    {"BinaryConditionalOperator", 5},
    {"BinaryOperator", 6},
    {"BindingDecl", 7},
    {"BreakStmt", 8},
    {"CallExpr", 9},
    {"CaseStmt", 10},
    {"CharacterLiteral", 11},
    {"ClassTemplateDecl", 12},
    {"CompoundAssignOperator", 13},
    {"CompoundLiteralExpr", 14},
    {"CompoundStmt", 15},
    {"ConditionalOperator", 16},
    {"ConstantExpr", 17},
    {"ContinueStmt", 18},
    {"CStyleCastExpr", 19},
    {"CXXBindTemporaryExpr", 20},
    {"CXXBoolLiteralExpr", 21},
    {"CXXCatchStmt", 22},
    {"CXXConstCastExpr", 23},
    {"CXXConstructorDecl", 24},
    {"CXXConstructExpr", 25},
    {"CXXCtorInitializer", 26},
    {"CXXDefaultArgExpr", 27},
    {"CXXDeleteExpr", 28},
    {"CXXDestructorDecl", 29},
    {"CXXDynamicCastExpr", 30},
    {"CXXFoldExpr", 31},
    {"CXXForRangeStmt", 32},
    {"CXXFunctionalCastExpr", 33},
    {"CXXInheritedCtorInitExpr", 34},
    {"CXXMemberCallExpr", 35},
    {"CXXMethodDecl", 36},
    {"CXXNewExpr", 37},
    {"CXXNoexceptExpr", 38},
    {"CXXNullPtrLiteralExpr", 39},
    {"CXXOperatorCallExpr", 40},
    {"CXXPseudoDestructorExpression", 41},
    {"CXXRecordDecl", 42},
    {"CXXReinterpretCastExpr", 43},
    {"CXXRewrittenBinaryOperator", 44},
    {"CXXScalarValueInitExpr", 45},
    {"CXXStaticCastExpr", 46},
    {"CXXStdInitializerListExpr", 47},
    {"CXXTemporaryObjectExpr", 48},
    {"CXXThisExpr", 49},
    {"CXXThrowExpr", 50},
    {"CXXTryStmt", 51},
    {"CXXTypeidExpr", 52},
    {"DeclRefExpr", 53},
    {"DeclStmt", 54},
    {"DecompositionDecl", 55},
    {"DefaultStmt", 56},
    {"DesignatedInitExpr", 57},
    {"DoStmt", 58},
    {"EnumDecl", 59},
    {"EnumConstantDecl", 60},
    {"ExprWithCleanups", 61},
    {"FloatingLiteral", 62},
    {"ForStmt", 63},
    {"FriendDecl", 64},
    {"FunctionDecl", 65},
    {"FunctionTemplateDecl", 66},
    {"GotoStmt", 67},
    {"IfStmt", 68},
    {"ImplicitCastExpr", 69},
    {"IndirectGotoStmt", 70},
    {"InitListExpr", 71},
    {"IntegerLiteral", 72},
    {"LabelStmt", 73},
    {"LambdaExpr", 74},
    {"LinkageSpecDecl", 75},
    {"MaterializeTemporaryExpr", 76},
    {"MemberExpr", 77},
    {"MemberRef", 78},
    {"NamespaceRef", 79},
    {"NamespaceDecl", 80},
    {"NonTypeTemplateParmDecl", 81},
    {"NullStmt", 82},
    {"OverloadedDeclRef", 83},
    {"ParenExpr", 84},
    {"ParenListExpr", 85},
    {"ParentExpr", 86},
    {"ParmVarDecl", 87},
    {"RecordDecl", 88},
    {"RecoveryExpr", 89},
    {"ReturnStmt", 90},
    {"StringLiteral", 91},
    {"SwitchStmt", 92},
    {"TemplateRef", 93},
    {"TemplateTypeParmDecl", 94},
    {"TranslationUnitDecl", 95},
    {"TypeAliasDecl", 96},
    {"TypeAliasTemplateDecl", 97},
    {"TypedefDecl", 98},
    {"TypeRef", 99},
    {"UnaryExprOrTypeTraitExpr", 100},
    {"UnaryOperator", 101},
    {"UnexposedExpr", 102},
    {"UnresolvedLookupExpr", 103},
    {"UnsupportedKind", 104},
    {"UserDefinedLiteral", 105},
    {"UsingDirectiveDecl", 106},
    {"VarDecl", 107},
    {"WhileStmt", 108},
    {"AccessSpecDecl", 109},
    {"CatchAllException", 110},
    {"CXXAccessSpecifier", 111},
    {"UsingDecl", 112},
    {"FieldDecl", 113},
    {"InclusionDirective", 114},
    {"TemplateTypeParmVarDecl", 115},
    {"AttributeOverride", 116},
    {"FunctionToPointerDecay", 117},
    {"unsupported kind", 104},
    {"attribute(override)", 116},
};

constexpr AttrEntry K_TAG_USED_TABLE[] = {
    {"class", 1},
    {"struct", 2},
    {"union", 3},
    {"enum", 4},
};

constexpr AttrEntry K_STORAGE_CLASS_TABLE[] = {
    {"static", 1},
    {"extern", 2},
};

constexpr AttrEntry K_ACCESS_TABLE[] = {
    {"public", 1},
    {"private", 2},
    {"protected", 3},
};

constexpr AttrEntry K_VALUE_CATEGORY_TABLE[] = {
    {"prvalue", 1},
    {"lvalue", 2},
    {"xvalue", 3},
};

constexpr AttrEntry K_FOLD_OP_TABLE[] = {
    {" ", 1},
    {"|", 2},
    {"&", 3},
    {"^", 4},
};

constexpr AttrEntry K_OPCODE_TABLE[] = {
    {"=", 1},
    {"+", 2},
    {"-", 3},
    {"*", 4},
    {"/", 5},
    {"%", 6},
    {"<<", 7},
    {">>", 8},
    {"&", 9},
    {"|", 10},
    {"^", 11},
    {"&&", 12},
    {"||", 13},
    {"<", 14},
    {"<=", 15},
    {">", 16},
    {">=", 17},
    {"==", 18},
    {"!=", 19},
    {"++", 20},
    {"--", 21},
    {"+=", 22},
    {"-=", 23},
    {"*=", 24},
    {"/=", 25},
    {"%=", 26},
    {"<<=", 27},
    {">>=", 28},
    {"&=", 29},
    {"|=", 30},
    {"^=", 31},
    {",", 32},
    {"!", 33},
    {"~", 34},
};

constexpr size_t K_LOOKUP_TAG_KIND = 0;
constexpr size_t K_LOOKUP_TAG_TAG_USED = 1;
constexpr size_t K_LOOKUP_TAG_STORAGE_CLASS = 2;
constexpr size_t K_LOOKUP_TAG_ACCESS = 3;
constexpr size_t K_LOOKUP_TAG_VALUE_CATEGORY = 4;
constexpr size_t K_LOOKUP_TAG_FOLD_OP = 5;
constexpr size_t K_LOOKUP_TAG_OPCODE = 6;

constexpr uint8_t K_NODE_FLAG_HAS_IN_CLASS_INITIALIZER = 1u << 0;
constexpr uint8_t K_NODE_FLAG_IMPLICIT = 1u << 1;
constexpr uint8_t K_NODE_FLAG_POSTFIX = 1u << 2;
constexpr uint8_t K_NODE_FLAG_ARROW = 1u << 3;
constexpr uint8_t K_NODE_FLAG_ARRAY = 1u << 4;

template <typename IdT, typename Entry, size_t TableTag>
IdT LookupId(llvm::StringRef name, const Entry *table, size_t count, IdT unknown)
{
    if (name.empty()) {
        return unknown;
    }
    static const llvm::StringMap<IdT> map = [&]() {
        llvm::StringMap<IdT> built;
        for (size_t i = 0; i < count; ++i) {
            built.insert({table[i].name, table[i].id});
        }
        return built;
    }();
    auto it = map.find(name);
    return it != map.end() ? it->second : unknown;
}

} // namespace

uint16_t LookupAstKindId(llvm::StringRef kindName)
{
    return LookupId<uint16_t, KindEntry, K_LOOKUP_TAG_KIND>(
        kindName, K_KIND_TABLE, sizeof(K_KIND_TABLE) / sizeof(K_KIND_TABLE[0]), kAstKindUnknown);
}

uint8_t LookupTagUsedId(llvm::StringRef name)
{
    return LookupId<uint8_t, AttrEntry, K_LOOKUP_TAG_TAG_USED>(
        name, K_TAG_USED_TABLE, sizeof(K_TAG_USED_TABLE) / sizeof(K_TAG_USED_TABLE[0]), kAttrUnknown);
}

uint8_t LookupStorageClassId(llvm::StringRef name)
{
    return LookupId<uint8_t, AttrEntry, K_LOOKUP_TAG_STORAGE_CLASS>(
        name, K_STORAGE_CLASS_TABLE, sizeof(K_STORAGE_CLASS_TABLE) / sizeof(K_STORAGE_CLASS_TABLE[0]), kAttrUnknown);
}

uint8_t LookupAccessId(llvm::StringRef name)
{
    return LookupId<uint8_t, AttrEntry, K_LOOKUP_TAG_ACCESS>(
        name, K_ACCESS_TABLE, sizeof(K_ACCESS_TABLE) / sizeof(K_ACCESS_TABLE[0]), kAttrUnknown);
}

uint8_t LookupValueCategoryId(llvm::StringRef name)
{
    return LookupId<uint8_t, AttrEntry, K_LOOKUP_TAG_VALUE_CATEGORY>(
        name, K_VALUE_CATEGORY_TABLE, sizeof(K_VALUE_CATEGORY_TABLE) / sizeof(K_VALUE_CATEGORY_TABLE[0]),
        kAttrUnknown);
}

uint8_t LookupFoldOpId(llvm::StringRef name)
{
    return LookupId<uint8_t, AttrEntry, K_LOOKUP_TAG_FOLD_OP>(
        name, K_FOLD_OP_TABLE, sizeof(K_FOLD_OP_TABLE) / sizeof(K_FOLD_OP_TABLE[0]), kAttrUnknown);
}

uint8_t LookupOpcodeId(llvm::StringRef name)
{
    return LookupId<uint8_t, AttrEntry, K_LOOKUP_TAG_OPCODE>(
        name, K_OPCODE_TABLE, sizeof(K_OPCODE_TABLE) / sizeof(K_OPCODE_TABLE[0]), kAttrUnknown);
}

uint32_t LookupModifierFlagBit(llvm::StringRef name)
{
    if (name.empty()) {
        return 0;
    }
    static const llvm::StringMap<uint32_t> map = [&]() {
        llvm::StringMap<uint32_t> built;
        for (const ModifierFlagEntry &entry : K_MODIFIER_FLAG_TABLE) {
            built.insert({entry.name, entry.flag});
        }
        return built;
    }();
    auto it = map.find(name);
    return it != map.end() ? it->second : 0;
}

uint8_t PackCxxNodeFlags(bool hasInClassInitializer, bool isImplicit, bool isPostfix, bool isArrow, bool isArray)
{
    uint8_t flags = 0;
    if (hasInClassInitializer) {
        flags |= K_NODE_FLAG_HAS_IN_CLASS_INITIALIZER;
    }
    if (isImplicit) {
        flags |= K_NODE_FLAG_IMPLICIT;
    }
    if (isPostfix) {
        flags |= K_NODE_FLAG_POSTFIX;
    }
    if (isArrow) {
        flags |= K_NODE_FLAG_ARROW;
    }
    if (isArray) {
        flags |= K_NODE_FLAG_ARRAY;
    }
    return flags;
}

uint8_t PackCxxBaseFlags(bool isVirtual)
{
    return isVirtual ? static_cast<uint8_t>(1u << 0) : 0;
}

} // namespace ast_dumper
