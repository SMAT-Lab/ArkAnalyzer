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

#pragma once

#include "clang/AST/ASTContext.h"
#include "clang/AST/Decl.h"
#include "clang/AST/DeclCXX.h"
#include "clang/AST/JSONNodeDumper.h"
#include "clang/AST/Stmt.h"
#include "clang/AST/StmtCXX.h"
#include "clang/Basic/SourceManager.h"
#include <llvm/Demangle/Demangle.h>
#include "utils/astAttrsProcessor.h"
#include "utils/source_utils.h"
#include <llvm/Support/JSON.h>
#include <llvm/Support/raw_ostream.h>

#include <optional>
#include <string>
#include <utility>

namespace ast_dumper {

struct AstNodeJsonEmitContext {
    clang::ASTContext &ctx;
    const clang::SourceManager &sm;
    const clang::PrintingPolicy &policy;
};

template <typename T>
void CallJsonNodeDumper(T *node, AstNodeJsonEmitContext &ec, ast_dumper::AstAttrsProcessor &processor);

namespace detail {

std::optional<llvm::json::Object> ParseJsonObjectString(std::string buf);

} // namespace detail

std::optional<llvm::json::Object> ParseEmittedAttrsJson(std::string buf);

void MergeSourceCodeIntoObject(llvm::json::Object &obj, llvm::StringRef sourceCode);

std::optional<llvm::json::Object> EmitDeclAttrs(clang::Decl *d, AstNodeJsonEmitContext &ec);

std::optional<llvm::json::Object> EmitStmtAttrs(clang::Stmt *s, AstNodeJsonEmitContext &ec);

std::optional<llvm::json::Object> EmitCtorInitializerAttrs(clang::CXXCtorInitializer *init,
                                                           AstNodeJsonEmitContext &ec);

std::string JsonObjectToString(const llvm::json::Object &obj);

std::string HeaderUnitObjectToAttrs(const llvm::json::Object &hu);

} // namespace ast_dumper
