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

#include "serialization/astNodeAttrsExtract.h"
#include "serialization/astAttrsEnrich.h"

#include <type_traits>

namespace ast_dumper {

template <typename T>
void CallJsonNodeDumper(T *node, AstNodeJsonEmitContext &ec, ast_dumper::AstAttrsProcessor &processor)
{
    clang::JSONNodeDumper dumper(processor, ec.sm, ec.ctx, ec.policy, &ec.ctx.getCommentCommandTraits());
    dumper.Visit(node);
    processor.flush();
    processor.FlushBufferedOutput();
}

std::string JsonObjectToString(const llvm::json::Object &obj)
{
    return llvm::formatv("{0}", llvm::json::Value(llvm::json::Object(obj))).str();
}

std::string HeaderUnitObjectToAttrs(const llvm::json::Object &hu)
{
    return JsonObjectToString(hu);
}

namespace detail {

std::optional<llvm::json::Object> ParseJsonObjectString(std::string buf)
{
    llvm::Expected<llvm::json::Value> parsed = llvm::json::parse(buf);
    if (!parsed) {
        llvm::consumeError(parsed.takeError());
        return std::nullopt;
    }
    if (llvm::json::Object *obj = parsed->getAsObject()) {
        return std::move(*obj);
    }
    return std::nullopt;
}

} // namespace detail

std::optional<llvm::json::Object> ParseEmittedAttrsJson(std::string buf)
{
    if (buf.empty()) {
        return llvm::json::Object{};
    }
    std::optional<llvm::json::Object> obj = detail::ParseJsonObjectString(std::move(buf));
    if (obj) {
        ApplyAttrFieldTransforms(*obj);
    }
    return obj;
}

namespace {

void AppendTypedefRecordOriginalId(clang::TypedefDecl *td, llvm::raw_ostream &os)
{
    clang::QualType underlying = td->getUnderlyingType();
    if (const clang::RecordType *rt = underlying->getAs<clang::RecordType>()) {
        if (clang::CXXRecordDecl *rd = clang::dyn_cast<clang::CXXRecordDecl>(rt->getDecl())) {
            os << "\"originalId\":\"" << rd << "\",";
        }
    }
}

void AppendTypedefEnumOriginalId(clang::TypedefDecl *td, llvm::raw_ostream &os)
{
    clang::QualType underlying = td->getUnderlyingType();
    if (const clang::EnumType *et = underlying->getAs<clang::EnumType>()) {
        if (clang::EnumDecl *ed = clang::dyn_cast<clang::EnumDecl>(et->getDecl())) {
            os << "\"originalId\":\"" << ed << "\",";
        }
    }
}

void AppendAliasOriginalIdToStream(clang::Decl *d, llvm::raw_ostream &os)
{
    if (auto *td = clang::dyn_cast<clang::TypedefDecl>(d)) {
        AppendTypedefRecordOriginalId(td, os);
        AppendTypedefEnumOriginalId(td, os);
    }
}

template <typename T>
std::optional<llvm::json::Object> EmitJsonAttrsFromNode(T *node, AstNodeJsonEmitContext &ec)
{
    if (!node) {
        return std::nullopt;
    }
    std::string buf;
    llvm::raw_string_ostream os(buf);
    os << '{';
    bool dumperHasName = false;
    if constexpr (std::is_same_v<std::remove_pointer_t<T>, clang::Decl>) {
        AppendAliasOriginalIdToStream(node, os);
    }
    {
        ast_dumper::AstAttrsProcessor processor(os, true, true);
        CallJsonNodeDumper(node, ec, processor);
        dumperHasName = processor.HasNameKey();
    }
    os << '}';
    os.flush();
    auto obj = ParseEmittedAttrsJson(std::move(buf));
    if (!obj) {
        return std::nullopt;
    }
    if constexpr (std::is_same_v<std::remove_pointer_t<T>, clang::Decl>) {
        EnrichStructuredAttrs(node, *obj, ec);
    }
    if constexpr (std::is_same_v<std::remove_pointer_t<T>, clang::Stmt>) {
        EnrichStructuredAttrs(node, *obj, ec);
    }
    if constexpr (std::is_same_v<std::remove_pointer_t<T>, clang::CXXCtorInitializer>) {
        EnrichStructuredAttrs(node, *obj, ec);
    }
    if constexpr (std::is_same_v<std::remove_pointer_t<T>, clang::Decl>) {
        if (!dumperHasName) {
            std::string name;
            if (const auto *nd = clang::dyn_cast<clang::NamedDecl>(node)) {
                name = nd->getNameAsString();
            } else if (clang::isa<clang::TranslationUnitDecl>(node)) {
                name = "TranslationUnit";
            }
            if (!name.empty()) {
                (*obj)["name"] = name;
            }
        }
    }
    return obj;
}

} // namespace

std::optional<llvm::json::Object> EmitDeclAttrs(clang::Decl *d, AstNodeJsonEmitContext &ec)
{
    return EmitJsonAttrsFromNode(d, ec);
}

std::optional<llvm::json::Object> EmitStmtAttrs(clang::Stmt *s, AstNodeJsonEmitContext &ec)
{
    return EmitJsonAttrsFromNode(s, ec);
}

std::optional<llvm::json::Object> EmitCtorInitializerAttrs(clang::CXXCtorInitializer *init,
                                                           AstNodeJsonEmitContext &ec)
{
    return EmitJsonAttrsFromNode(init, ec);
}

} // namespace ast_dumper
