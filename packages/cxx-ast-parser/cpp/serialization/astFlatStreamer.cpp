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

#include "serialization/astFlatStreamer.h"

#include "clang/AST/ASTContext.h"
#include "clang/AST/Decl.h"
#include "clang/AST/RecursiveASTVisitor.h"
#include "clang/AST/Stmt.h"
#include "clang/AST/StmtCXX.h"
#include "clang/Basic/SourceManager.h"
#include <llvm/Demangle/Demangle.h>
#include "flatGenerated/astWire_generated.h"
#include "serialization/astAttrsToWire.h"
#include "serialization/astNodeAttrsExtract.h"
#include "serialization/wire_string_pool.h"
#include "utils/header_units.h"
#include "utils/flat_output_path.h"
#include "utils/source_utils.h"

#include "llvm/Support/FileSystem.h"
#include "llvm/Support/Path.h"
#include "llvm/Support/raw_ostream.h"


#include <utility>
#include <vector>

namespace ark_cxx_ast_flat {
namespace {

using namespace clang;
using namespace ArkCxxAstFb;

constexpr uint32_t kWireVersion = 13;

class CxxAstFlatStreamerImpl : public RecursiveASTVisitor<CxxAstFlatStreamerImpl> {
public:
    CxxAstFlatStreamerImpl(ASTContext &ctx, std::shared_ptr<ast_dumper::HeaderUnitsStore> huStore)
        : ctx(ctx), sm(ctx.getSourceManager()), emitCtx{ctx, sm, ctx.getPrintingPolicy()},
          huStore(std::move(huStore))
    {
    }

    void EmitTranslationUnit()
    {
        TraverseDecl(ctx.getTranslationUnitDecl());
    }

    std::vector<uint8_t> Finish(const std::string &sourceFile, const std::string &flatPath)
    {
        if (rootOffset.IsNull()) {
            llvm::json::Object empty;
            empty["kind"] = "TranslationUnitDecl";
            empty["name"] = "TranslationUnit";
            rootOffset = BuildWireNode(empty, {}, {});
        }
        (void)sourceFile;
        (void)flatPath;
        const auto stringPoolVec = stringPool_.createVector(fbb_);
        auto payload = CreateCxxAstPayload(fbb_, kWireVersion, stringPoolVec, rootOffset);
        fbb_.Finish(payload);
        std::vector<uint8_t> out(fbb_.GetSize());
        const uint8_t *src = fbb_.GetBufferPointer();
        out.assign(src, src + fbb_.GetSize());
        return out;
    }

    bool TraverseForStmt(ForStmt *fs)
    {
        if (!fs) {
            return true;
        }
        if (!WalkUpFromForStmt(fs)) {
            return false;
        }
        if (!TraverseStmtOrEmpty(fs->getInit())) {
            return false;
        }
        if (!TraverseStmtOrEmpty(fs->getConditionVariableDeclStmt())) {
            return false;
        }
        if (!TraverseStmtOrEmpty(fs->getCond())) {
            return false;
        }
        if (!TraverseStmtOrEmpty(fs->getInc())) {
            return false;
        }
        if (!TraverseStmtOrEmpty(fs->getBody())) {
            return false;
        }
        return true;
    }

    bool TraverseDecl(Decl *d)
    {
        if (!d) {
            return true;
        }
        if (!isa<TranslationUnitDecl>(d)) {
            SourceLocation loc = bestDeclLoc(d);
            if (!ast_dumper::IsFromMainFileIncludingExpansion(sm, loc)) {
                return true;
            }
        }
        // Implicit decls (e.g. UsingDirectiveDecl): omit node and its subtree from wire output.
        // Matches legacy TS filterChildren (drop isImplicit child only; no hoist). ImplicitCastExpr is kept.
        if (!isa<TranslationUnitDecl>(d) && d->isImplicit()) {
            return true;
        }
        llvm::json::Object attrs;
        if (auto obj = ast_dumper::EmitDeclAttrs(d, emitCtx)) {
            attrs = std::move(*obj);
        }
        std::vector<flatbuffers::Offset<CxxAstNodeWire>> headerUnits;
        if (isa<TranslationUnitDecl>(d) && huStore) {
            headerUnits = BuildHeaderUnits();
        }
        PushInnerLevel();
        RecursiveASTVisitor<CxxAstFlatStreamerImpl>::TraverseDecl(d);
        auto inner = PopInnerOffsets();
        flatbuffers::Offset<CxxAstNodeWire> node = BuildWireNode(attrs, inner, headerUnits);
        if (innerStack.empty()) {
            rootOffset = node;
        } else {
            innerStack.back().push_back(node);
        }
        return true;
    }

    bool TraverseStmt(Stmt *s)
    {
        if (!s) {
            return true;
        }
        if (!ast_dumper::IsFromMainFileIncludingExpansion(sm, s->getBeginLoc())) {
            return true;
        }
        llvm::json::Object attrs;
        if (auto obj = ast_dumper::EmitStmtAttrs(s, emitCtx)) {
            attrs = std::move(*obj);
        }
        PushInnerLevel();
        RecursiveASTVisitor<CxxAstFlatStreamerImpl>::TraverseStmt(s);
        auto inner = PopInnerOffsets();
        flatbuffers::Offset<CxxAstNodeWire> node = BuildWireNode(attrs, inner, {});
        innerStack.back().push_back(node);
        return true;
    }

    bool TraverseConstructorInitializer(CXXCtorInitializer *init)
    {
        if (!init) {
            return true;
        }
        if (!ast_dumper::IsFromMainFileIncludingExpansion(sm, init->getSourceLocation())) {
            return true;
        }
        llvm::json::Object attrs;
        if (auto obj = ast_dumper::EmitCtorInitializerAttrs(init, emitCtx)) {
            attrs = std::move(*obj);
        }
        PushInnerLevel();
        RecursiveASTVisitor<CxxAstFlatStreamerImpl>::TraverseConstructorInitializer(init);
        auto inner = PopInnerOffsets();
        flatbuffers::Offset<CxxAstNodeWire> node = BuildWireNode(attrs, inner, {});
        innerStack.back().push_back(node);
        return true;
    }

private:
    flatbuffers::FlatBufferBuilder fbb_;
    ast_dumper::WireStringPool stringPool_;
    ASTContext &ctx;
    const SourceManager &sm;
    ast_dumper::AstNodeJsonEmitContext emitCtx;
    std::shared_ptr<ast_dumper::HeaderUnitsStore> huStore;
    std::vector<std::vector<flatbuffers::Offset<CxxAstNodeWire>>> innerStack;
    flatbuffers::Offset<CxxAstNodeWire> rootOffset;

    static SourceLocation bestDeclLoc(const Decl *d)
    {
        SourceLocation loc = d->getLocation();
        return loc.isValid() ? loc : d->getBeginLoc();
    }

    void PushInnerLevel()
    {
        innerStack.emplace_back();
    }

    std::vector<flatbuffers::Offset<CxxAstNodeWire>> PopInnerOffsets()
    {
        std::vector<flatbuffers::Offset<CxxAstNodeWire>> out;
        if (!innerStack.empty()) {
            out = std::move(innerStack.back());
            innerStack.pop_back();
        }
        return out;
    }

    bool TraverseStmtOrEmpty(Stmt *child)
    {
        if (!child) {
            innerStack.back().push_back(BuildWireNode(llvm::json::Object{}, {}, {}));
            return true;
        }
        if (!ast_dumper::IsFromMainFileIncludingExpansion(sm, child->getBeginLoc())) {
            innerStack.back().push_back(BuildWireNode(llvm::json::Object{}, {}, {}));
            return true;
        }
        return TraverseStmt(child);
    }

    flatbuffers::Offset<CxxAstNodeWire> BuildWireNode(
        const llvm::json::Object &attrs, const std::vector<flatbuffers::Offset<CxxAstNodeWire>> &inner,
        const std::vector<flatbuffers::Offset<CxxAstNodeWire>> &headerUnits)
    {
        return ast_dumper::BuildCxxAstNodeWireFromJson(fbb_, stringPool_, attrs, inner, headerUnits);
    }

    std::vector<flatbuffers::Offset<CxxAstNodeWire>> BuildHeaderUnits()
    {
        std::vector<flatbuffers::Offset<CxxAstNodeWire>> out;
        if (!huStore) {
            return out;
        }
        out.reserve(huStore->ByHeader.size());
        for (auto &kv : huStore->ByHeader) {
            llvm::json::Object attrs = kv.second;
            out.push_back(BuildWireNode(attrs, {}, {}));
        }
        return out;
    }
};

} // namespace

class CxxAstFlatStreamer::Impl {
public:
    explicit Impl(ASTContext &ctx, std::shared_ptr<ast_dumper::HeaderUnitsStore> huStore)
        : streamer(ctx, std::move(huStore))
    {
    }

    CxxAstFlatStreamerImpl streamer;
};

CxxAstFlatStreamer::CxxAstFlatStreamer(ASTContext &ctx, std::shared_ptr<ast_dumper::HeaderUnitsStore> huStore)
    : impl_(std::make_unique<Impl>(ctx, std::move(huStore)))
{
}

CxxAstFlatStreamer::~CxxAstFlatStreamer() = default;

void CxxAstFlatStreamer::EmitTranslationUnit()
{
    impl_->streamer.EmitTranslationUnit();
}

std::vector<uint8_t> CxxAstFlatStreamer::Finish(const std::string &sourceFile, const std::string &flatPath)
{
    return impl_->streamer.Finish(sourceFile, flatPath);
}

bool WriteFlatPayloadToFile(const std::vector<uint8_t> &bytes, const std::string &outPath)
{
    if (outPath.empty()) {
        return false;
    }
    llvm::SmallString<ast_dumper::PATH_PARENT_BUFFER_SIZE> dir = llvm::sys::path::parent_path(outPath);
    if (!dir.empty()) {
        if (std::error_code ec = llvm::sys::fs::create_directories(dir, true)) {
            return false;
        }
    }
    std::error_code ec;
    llvm::raw_fd_ostream os(outPath, ec, llvm::sys::fs::OF_None);
    if (ec) {
        return false;
    }
    os.write(reinterpret_cast<const char *>(bytes.data()), static_cast<int64_t>(bytes.size()));
    return true;
}

} // namespace ark_cxx_ast_flat
