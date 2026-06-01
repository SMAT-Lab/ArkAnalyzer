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

#include "serialization/astAttrsEnrich.h"

#include "utils/ast_kind_const.h"
#include "utils/source_utils.h"

#include "clang/AST/Decl.h"
#include "clang/AST/DeclCXX.h"
#include "clang/AST/Expr.h"
#include "clang/AST/ExprCXX.h"
#include "clang/AST/NestedNameSpecifier.h"
#include "clang/AST/Stmt.h"
#include "clang/AST/Type.h"
#include "clang/Basic/ExceptionSpecificationType.h"
#include "clang/Lex/Lexer.h"

#include <llvm/Support/ConvertUTF.h>
#include <llvm/Support/FormatVariadic.h>
#include <llvm/Support/raw_ostream.h>

#include <cctype>
#include <type_traits>

namespace ast_dumper {
namespace {

constexpr unsigned K_UTF32_BUFFER_CAPACITY = 2;

bool IsCIdentifier(llvm::StringRef text)
{
    if (text.empty()) {
        return false;
    }
    const unsigned char first = static_cast<unsigned char>(text.front());
    if (!std::isalpha(first) && text.front() != '_') {
        return false;
    }
    for (char c : text.drop_front()) {
        const unsigned char ch = static_cast<unsigned char>(c);
        if (!std::isalnum(ch) && c != '_') {
            return false;
        }
    }
    return true;
}

void SetQualTypeObject(llvm::json::Object &obj, llvm::StringRef key, clang::QualType qt,
                       const clang::PrintingPolicy &policy)
{
    if (qt.isNull()) {
        return;
    }
    std::string qualType;
    llvm::raw_string_ostream os(qualType);
    qt.print(os, policy);
    os.flush();
    obj[key] = llvm::json::Object{{"qualType", qualType}};
}

void OrModifierFlag(uint32_t &flags, llvm::StringRef modifierName)
{
    flags |= LookupModifierFlagBit(modifierName);
}

uint32_t ReadModifierFlags(const llvm::json::Object &obj)
{
    uint32_t flags = 0;
    if (const llvm::json::Value *value = obj.get("modifierFlags")) {
        if (auto n = value->getAsUINT64()) {
            flags = static_cast<uint32_t>(*n);
        } else if (auto i = value->getAsInteger()) {
            flags = static_cast<uint32_t>(*i);
        }
    }
    if (const llvm::json::Array *mods = obj.getArray("modifiers")) {
        for (const llvm::json::Value &entry : *mods) {
            if (auto s = entry.getAsString()) {
                flags |= LookupModifierFlagBit(*s);
            }
        }
    }
    return flags;
}

void WriteModifierFlags(llvm::json::Object &obj, uint32_t flags)
{
    obj.erase("modifiers");
    if (flags != 0) {
        obj["modifierFlags"] = flags;
    } else {
        obj.erase("modifierFlags");
    }
}

std::string Utf32CodePointDisplay(uint32_t codePoint)
{
    return llvm::formatv("U{0:X-8}", codePoint).str();
}

std::string Utf8FromCodePoint(uint32_t codePoint)
{
    if (codePoint <= 0x7F) {
        return std::string(1, static_cast<char>(codePoint));
    }
    llvm::SmallVector<llvm::UTF32, K_UTF32_BUFFER_CAPACITY> src(1, static_cast<llvm::UTF32>(codePoint));
    std::string out;
    if (!llvm::convertUTF32ToUTF8String(src, out)) {
        return std::to_string(codePoint);
    }
    return out;
}

std::string CharacterLiteralDisplayValue(const clang::CharacterLiteral *literal)
{
    const uint32_t value = literal->getValue();
    using CLK = clang::CharacterLiteralKind;
    switch (literal->getKind()) {
        case CLK::Ascii:
            if (value <= 0x7F) {
                return std::string(1, static_cast<char>(value));
            }
            return Utf8FromCodePoint(value);
        case CLK::Wide:
        case CLK::UTF8:
        case CLK::UTF16:
            return Utf8FromCodePoint(value);
        case CLK::UTF32:
            return Utf32CodePointDisplay(value);
    }
    return std::to_string(value);
}

std::string TokenSpelling(const clang::Expr *expr, const clang::SourceManager &sm, const clang::LangOptions &lo)
{
    clang::SourceLocation begin = sm.getSpellingLoc(expr->getBeginLoc());
    clang::SourceLocation end = sm.getSpellingLoc(expr->getEndLoc());
    if (!begin.isValid() || !end.isValid()) {
        return {};
    }
    return std::string(
        clang::Lexer::getSourceText(clang::CharSourceRange::getTokenRange(begin, end), sm, lo));
}

void EnsureName(llvm::json::Object &obj, llvm::StringRef name)
{
    if (name.empty()) {
        return;
    }
    if (auto existing = obj.getString("name")) {
        if (!existing->empty()) {
            return;
        }
    }
    obj["name"] = name.str();
}

void EnrichVarDeclModifierFlags(const clang::VarDecl *varDecl, uint32_t &flags)
{
    if (varDecl->getStorageClass() == clang::SC_Static) {
        OrModifierFlag(flags, "static");
    }
    if (varDecl->getType().isConstQualified()) {
        OrModifierFlag(flags, "const");
    }
    if (varDecl->getType().isVolatileQualified()) {
        OrModifierFlag(flags, "volatile");
    }
}

void EnrichFieldDeclModifierFlags(const clang::FieldDecl *fieldDecl, uint32_t &flags)
{
    if (fieldDecl->isMutable()) {
        OrModifierFlag(flags, "mutable");
    }
}

void EnrichFunctionDeclModifierFlags(const clang::FunctionDecl *funcDecl, uint32_t &flags)
{
    if (funcDecl->isStatic()) {
        OrModifierFlag(flags, "static");
    }
    if (funcDecl->isInlineSpecified() || funcDecl->isInlined()) {
        OrModifierFlag(flags, "inline");
    }
    if (funcDecl->isVirtualAsWritten()) {
        OrModifierFlag(flags, "virtual");
    }
    if (funcDecl->isConstexpr()) {
        OrModifierFlag(flags, "constexpr");
    }
    clang::ExceptionSpecificationType est = funcDecl->getExceptionSpecType();
    if (est == clang::EST_BasicNoexcept || est == clang::EST_NoexceptTrue) {
        OrModifierFlag(flags, "noexcept");
    }
}

void EnrichExplicitDeclModifierFlags(const clang::Decl *decl, uint32_t &flags)
{
    if (const auto *ctorDecl = clang::dyn_cast<clang::CXXConstructorDecl>(decl)) {
        if (ctorDecl->isExplicit()) {
            OrModifierFlag(flags, "explicit");
        }
        return;
    }
    if (const auto *convDecl = clang::dyn_cast<clang::CXXConversionDecl>(decl)) {
        if (convDecl->isExplicit()) {
            OrModifierFlag(flags, "explicit");
        }
    }
}

void EnrichMethodDeclModifierFlags(const clang::CXXMethodDecl *methodDecl, uint32_t &flags)
{
    if (methodDecl->isConst()) {
        OrModifierFlag(flags, "const");
    }
    if (methodDecl->isVolatile()) {
        OrModifierFlag(flags, "volatile");
    }
}

void EnrichDeclModifiers(const clang::Decl *decl, llvm::json::Object &obj)
{
    uint32_t flags = ReadModifierFlags(obj);

    if (const auto *varDecl = clang::dyn_cast<clang::VarDecl>(decl)) {
        EnrichVarDeclModifierFlags(varDecl, flags);
    }
    if (const auto *fieldDecl = clang::dyn_cast<clang::FieldDecl>(decl)) {
        EnrichFieldDeclModifierFlags(fieldDecl, flags);
    }
    if (const auto *funcDecl = clang::dyn_cast<clang::FunctionDecl>(decl)) {
        EnrichFunctionDeclModifierFlags(funcDecl, flags);
    }
    EnrichExplicitDeclModifierFlags(decl, flags);
    if (const auto *methodDecl = clang::dyn_cast<clang::CXXMethodDecl>(decl)) {
        EnrichMethodDeclModifierFlags(methodDecl, flags);
    }
    if (clang::isa<clang::FriendDecl>(decl)) {
        OrModifierFlag(flags, "friend");
    }

    WriteModifierFlags(obj, flags);
}

void EnrichCharacterLiteral(const clang::CharacterLiteral *literal, llvm::json::Object &obj,
                            const AstNodeJsonEmitContext &ec)
{
    obj["value"] = CharacterLiteralDisplayValue(literal);
    std::string expansionText =
        GetSourceTextByRange(ec.sm, ec.ctx.getLangOpts(), literal->getSourceRange(), true);
    llvm::StringRef trimmed = llvm::StringRef(expansionText).trim();
    if (IsCIdentifier(trimmed)) {
        obj["name"] = trimmed.str();
        return;
    }
    clang::SourceLocation loc = literal->getBeginLoc();
    if (loc.isMacroID()) {
        llvm::StringRef macroName =
            clang::Lexer::getImmediateMacroName(loc, ec.sm, ec.ctx.getLangOpts());
        if (!macroName.empty()) {
            obj["name"] = macroName.str();
        }
    }
}

void EnrichDesignatedInitExpr(const clang::DesignatedInitExpr *initExpr, llvm::json::Object &obj)
{
    if (initExpr->size() == 0) {
        return;
    }
    const clang::DesignatedInitExpr::Designator *designator = initExpr->getDesignator(0);
    if (!designator) {
        return;
    }
    if (designator->isFieldDesignator()) {
        if (const clang::IdentifierInfo *fieldName = designator->getFieldName()) {
            EnsureName(obj, fieldName->getName());
        }
    } else if (designator->isArrayDesignator()) {
        EnsureName(obj, std::to_string(designator->getArrayIndex()));
    } else if (designator->isArrayRangeDesignator()) {
        EnsureName(obj, std::to_string(designator->getArrayIndex()));
    }
}

void EnrichUnaryExprOrTypeTrait(const clang::UnaryExprOrTypeTraitExpr *traitExpr, llvm::json::Object &obj,
                                const clang::PrintingPolicy &policy)
{
    if (!traitExpr->isArgumentType()) {
        return;
    }
    SetQualTypeObject(obj, "typeArg", traitExpr->getArgumentType().getUnqualifiedType(), policy);
}

void EnrichLambdaExpr(const clang::LambdaExpr *lambda, llvm::json::Object &obj)
{
    uint32_t flags = ReadModifierFlags(obj);
    if (lambda->isMutable()) {
        OrModifierFlag(flags, "mutable");
    } else if (const clang::CXXMethodDecl *callOp = lambda->getCallOperator()) {
        if (callOp->isConstexpr()) {
            OrModifierFlag(flags, "constexpr");
        }
    }
    WriteModifierFlags(obj, flags);
}

// DeclRefExpr::getQualifier() is NestedNameSpecifier* on Linux/macOS LLVM 19, value type on MSYS2 MinGW.
template <typename QualifierT>
void PrintDeclRefQualifier(QualifierT qual, llvm::raw_ostream &os, const clang::PrintingPolicy &policy)
{
    if constexpr (std::is_pointer_v<QualifierT>) {
        if (qual != nullptr) {
            qual->print(os, policy);
        }
    } else {
        if (qual) {
            qual.print(os, policy);
        }
    }
}

void EnrichDeclRefName(const clang::DeclRefExpr *declRef, llvm::json::Object &obj, const AstNodeJsonEmitContext &ec)
{
    clang::PrintingPolicy policy = ec.policy;
    if (declRef->hasQualifier()) {
        if (auto existing = obj.getString("name")) {
            if (existing->find("::") != std::string::npos) {
                return;
            }
        }
        std::string qualName;
        llvm::raw_string_ostream os(qualName);
        PrintDeclRefQualifier(declRef->getQualifier(), os, policy);
        if (const clang::NamedDecl *found = clang::dyn_cast<clang::NamedDecl>(declRef->getFoundDecl())) {
            os << found->getName();
        }
        obj["name"] = os.str();
        return;
    }
    const std::string spelling = TokenSpelling(declRef, ec.sm, ec.ctx.getLangOpts());
    if (spelling.empty()) {
        return;
    }
    if (auto existing = obj.getString("name")) {
        if (!existing->empty() && spelling.find('<') != std::string::npos && existing->find('<') == std::string::npos) {
            return;
        }
    }
    obj["name"] = spelling;
}

void EnrichMemberExprName(const clang::MemberExpr *memberExpr, llvm::json::Object &obj)
{
    if (auto existing = obj.getString("name")) {
        if (!existing->empty()) {
            return;
        }
    }
    if (const clang::ValueDecl *member = memberExpr->getMemberDecl()) {
        obj["name"] = member->getNameAsString();
    }
}

void EnrichExprNames(clang::Expr *expr, llvm::json::Object &obj, const AstNodeJsonEmitContext &ec)
{
    if (auto *declRef = clang::dyn_cast<clang::DeclRefExpr>(expr)) {
        EnrichDeclRefName(declRef, obj, ec);
        return;
    }
    if (auto *memberRef = clang::dyn_cast<clang::MemberExpr>(expr)) {
        EnrichMemberExprName(memberRef, obj);
    }
}

void EnrichStmtNames(clang::Stmt *stmt, llvm::json::Object &obj)
{
    if (auto *gotoStmt = clang::dyn_cast<clang::GotoStmt>(stmt)) {
        if (const clang::LabelDecl *label = gotoStmt->getLabel()) {
            EnsureName(obj, label->getName());
        }
        return;
    }
    if (auto *labelStmt = clang::dyn_cast<clang::LabelStmt>(stmt)) {
        if (const clang::LabelDecl *label = labelStmt->getDecl()) {
            EnsureName(obj, label->getName());
        }
    }
}

} // namespace

void EnrichStructuredAttrs(clang::Decl *decl, llvm::json::Object &obj, const AstNodeJsonEmitContext &ec)
{
    obj.erase("code");
    if (!decl) {
        return;
    }
    EnrichDeclModifiers(decl, obj);
}

void EnrichStructuredAttrs(clang::Stmt *stmt, llvm::json::Object &obj, const AstNodeJsonEmitContext &ec)
{
    obj.erase("code");
    if (!stmt) {
        return;
    }
    clang::PrintingPolicy policy = ec.policy;
    policy.SuppressScope = false;
    policy.FullyQualifiedName = true;
    if (auto *expr = clang::dyn_cast<clang::Expr>(stmt)) {
        if (auto *lambda = clang::dyn_cast<clang::LambdaExpr>(expr)) {
            EnrichLambdaExpr(lambda, obj);
        } else if (auto *literal = clang::dyn_cast<clang::CharacterLiteral>(expr)) {
            EnrichCharacterLiteral(literal, obj, ec);
        } else if (auto *designated = clang::dyn_cast<clang::DesignatedInitExpr>(expr)) {
            EnrichDesignatedInitExpr(designated, obj);
        } else if (auto *traitExpr = clang::dyn_cast<clang::UnaryExprOrTypeTraitExpr>(expr)) {
            EnrichUnaryExprOrTypeTrait(traitExpr, obj, policy);
        } else {
            EnrichExprNames(expr, obj, ec);
        }
    } else {
        EnrichStmtNames(stmt, obj);
    }
}

void EnrichStructuredAttrs(clang::CXXCtorInitializer *init, llvm::json::Object &obj, const AstNodeJsonEmitContext &ec)
{
    (void)init;
    (void)ec;
    obj.erase("code");
}

} // namespace ast_dumper
