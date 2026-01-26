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
#include "clang/AST/ASTConsumer.h"
#include "clang/AST/ASTContext.h"
#include "clang/AST/Decl.h"
#include "clang/AST/DeclCXX.h"
#include "clang/AST/JSONNodeDumper.h"
#include "clang/AST/RecursiveASTVisitor.h"
#include "clang/Frontend/CompilerInstance.h"
#include "clang/Frontend/FrontendActions.h"
#include "clang/Tooling/ArgumentsAdjusters.h"
#include "clang/Tooling/CommonOptionsParser.h"
#include "clang/Tooling/Tooling.h"
#include "llvm/Support/FileSystem.h"
#include "llvm/Support/FormatVariadic.h"
#include "llvm/Support/JSON.h"
#include "llvm/Support/Path.h"
#include "llvm/Support/raw_ostream.h"
#include <llvm/Demangle/Demangle.h>
#include "utils/source_utils.h"
#include "utils/cli_options.h"
#include "utils/output_path.h"
#include "utils/compile_db_utils.h"
#include "utils/header_units.h"
#include "utils/json_streaming.h"
#include "utils/json_dumper_probe.h"

#include <chrono>
#include <cstdint>
#include <memory>
#include <string>
#include <utility>
#include <vector>

using namespace clang;
using namespace clang::tooling;
using llvm::json::Object;
using llvm::json::Value;

// for -o file multi-input derivation
static unsigned g_inputCount = 0;

// ---- AST streamer ----
class ASTJsonStreamer : public RecursiveASTVisitor<ASTJsonStreamer> {
public:
    ASTJsonStreamer(ASTContext &ctx, llvm::raw_ostream &os,
                    std::shared_ptr<ast_dumper::HeaderUnitsStore> huStore)
        : ctx(ctx), sm(ctx.getSourceManager()), os(os), HUStore(std::move(huStore)) {}

    private:
    // Handling empty child nodes
    void EmitEmptyChild()
    {
        WriteChildCommaIfNeeded();
        os << "{}";
    }

    // Traverse the nodes under the statement
    bool TraverseStmtOrEmpty(Stmt *Child)
    {
        if (!Child) {
            EmitEmptyChild();
            return true;
        }
        if (!ast_dumper::IsFromMainFileIncludingExpansion(sm, Child->getBeginLoc())) {
            EmitEmptyChild();
            return true;
        }
        return TraverseStmt(Child);
    }

    // Call the native clang method
    template<typename T>
    void CallJsonNodeDumper(T* t, ast_dumper::JsonDumperProbeStream &probe)
    {
        JSONNodeDumper dumper(probe, ctx.getSourceManager(), ctx, ctx.getPrintingPolicy(),
            &ctx.getCommentCommandTraits());
        dumper.Visit(t);
        probe.flush();
    }

public:
    // Traverse forStmt
    bool TraverseForStmt(ForStmt *FS)
    {
        if (!FS) {
            return true;
        }
        // 保持 RAV 的 visit 链路
        if (!WalkUpFromForStmt(FS)) {
            return false;
        }
        // 按 clang JSON 的固定槽位顺序输出
        if (!TraverseStmtOrEmpty(FS->getInit())) {
            return false;
        }
        if (!TraverseStmtOrEmpty(FS->getConditionVariableDeclStmt())) {
            return false;
        }
        if (!TraverseStmtOrEmpty(FS->getCond())) {
            return false;
        }
        if (!TraverseStmtOrEmpty(FS->getInc())) {
            return false;
        }
        if (!TraverseStmtOrEmpty(FS->getBody())) {
            return false;
        }
        return true;
    }

    // handle TranslationUnit
    void EmitTranslationUnit()
    {
        TraverseDecl(ctx.getTranslationUnitDecl());
        os << "\n";
        os.flush();
    }

    // Output node name
    void DumperNodeName(Decl *D, bool dumperHasName, bool wroteAnyField)
    {
        if (!dumperHasName) {
            std::string name;
            if (const auto *ND = dyn_cast<NamedDecl>(D)) {
                name = ND->getNameAsString();
            } else if (isa<TranslationUnitDecl>(D)) {
                name = "TranslationUnit";
            }

            if (!name.empty()) {
                ast_dumper::json::writeCommaIf(wroteAnyField, os);
                ast_dumper::json::writeKey(os, "name");
                ast_dumper::json::PrintJsonString(os, name);
            }
        }
    }

    // Output node code
    template<typename T>
    void DumperNodeCode(T *t, bool dumperHasCode, bool wroteAnyField)
    {
        if (!dumperHasCode) {
            std::string code = ast_dumper::GetSourceTextByRange(sm, ctx.getLangOpts(), t->getSourceRange(), true);
            if (!code.empty()) {
                ast_dumper::json::writeCommaIf(wroteAnyField, os);
                ast_dumper::json::writeKey(os, "code");
                ast_dumper::json::PrintJsonString(os, code);
            }
        }
    }

    // Retrieve the original ID of the alias
    void AliasOriginalID(Decl *D)
    {
        if (auto *TD = dyn_cast<TypedefDecl>(D)) {
            QualType underlying = TD->getUnderlyingType();
            if (const RecordType *RT = underlying->getAs<RecordType>()) {
                if (CXXRecordDecl *RD = dyn_cast<CXXRecordDecl>(RT->getDecl())) {
                    os << "\"originalId\":\"" << RD <<"\",";
                }
            }
            if (const EnumType *ET = underlying->getAs<EnumType>()) {
                if (EnumDecl *ED = dyn_cast<EnumDecl>(ET->getDecl())) {
                    os << "\"originalId\":\"" << ED <<"\",";
                }
            }
        }
    }

    // Traverse all Decls in the syntax tree
    bool TraverseDecl(Decl *D)
    {
        if (!D) {
            return true;
        }

        if (!isa<TranslationUnitDecl>(D)) {
            SourceLocation L = bestDeclLoc(D);
            if (!ast_dumper::IsFromMainFileIncludingExpansion(sm, L)) {
                return true;
            }
        }

        WriteChildCommaIfNeeded();

        os << '{';
        AliasOriginalID(D);
        bool wroteAnyField = false;
        bool dumperHasName = false;
        bool dumperHasCode = false;
        ast_dumper::JsonDumperProbeStream probe(os);
        CallJsonNodeDumper(D, probe);
        dumperHasName = probe.HasNameKey();
        dumperHasCode = probe.HasCodeKey();
        wroteAnyField = (probe.BytesWritten() > 0);

        DumperNodeName(D, dumperHasName, wroteAnyField);
        DumperNodeCode(D, dumperHasCode, wroteAnyField);

        ast_dumper::json::writeCommaIf(wroteAnyField, os);
        ast_dumper::json::writeKey(os, "inner");
        os << '[';
        InnerFirstChildStack.push_back(1);

        RecursiveASTVisitor<ASTJsonStreamer>::TraverseDecl(D);

        InnerFirstChildStack.pop_back();
        os << ']';

        if (isa<TranslationUnitDecl>(D)) {
            os << ",\"headerUnits\":[";
            bool firstHU = true;
            for (auto &kv : HUStore->ByHeader) {
                if (!firstHU) os << ',';
                firstHU = false;

                // MSVC/LLVM: Value(Object&&) needs rvalue; copy then move.
                llvm::json::Object tmp = kv.second;
                os << llvm::formatv("{0}", llvm::json::Value(std::move(tmp)));
            }
            os << ']';
        }

        os << '}';
        return true;
    }

    // Traverse all Stmts in the syntax tree
    bool TraverseStmt(Stmt *S)
    {
        if (!S) {
            return true;
        }
        if (!ast_dumper::IsFromMainFileIncludingExpansion(sm, S->getBeginLoc())) {
            return true;
        }

        WriteChildCommaIfNeeded();

        os << '{';
        bool wroteAnyField = false;

        bool dumperHasCode = false;
        ast_dumper::JsonDumperProbeStream probe(os);
        CallJsonNodeDumper(S, probe);
        dumperHasCode = probe.HasCodeKey();
        wroteAnyField = (probe.BytesWritten() > 0);

        DumperNodeCode(S, dumperHasCode, wroteAnyField);

        ast_dumper::json::writeCommaIf(wroteAnyField, os);
        ast_dumper::json::writeKey(os, "inner");
        os << '[';
        InnerFirstChildStack.push_back(1);

        RecursiveASTVisitor<ASTJsonStreamer>::TraverseStmt(S);

        InnerFirstChildStack.pop_back();
        os << ']';

        os << '}';
        return true;
    }

    // Traverse ConstructorInitializer node type
    bool TraverseConstructorInitializer(CXXCtorInitializer *Init)
    {
        if (!Init) {
            return true;
        }
        if (!ast_dumper::IsFromMainFileIncludingExpansion(sm, Init->getSourceLocation())) {
            return true;
        }

        WriteChildCommaIfNeeded();

        os << '{';
        bool wroteAnyField = false;

        bool dumperHasCode = false;
        ast_dumper::JsonDumperProbeStream probe(os);
        CallJsonNodeDumper(Init, probe);
        dumperHasCode = probe.HasCodeKey();
        wroteAnyField = (probe.BytesWritten() > 0);

        DumperNodeCode(Init, dumperHasCode, wroteAnyField);

        ast_dumper::json::writeCommaIf(wroteAnyField, os);
        ast_dumper::json::writeKey(os, "inner");
        os << '[';
        InnerFirstChildStack.push_back(1);

        RecursiveASTVisitor<ASTJsonStreamer>::TraverseConstructorInitializer(Init);

        InnerFirstChildStack.pop_back();
        os << ']';

        os << '}';
        return true;
    }

private:
    ASTContext &ctx;
    const SourceManager &sm;
    llvm::raw_ostream &os;
    std::shared_ptr<ast_dumper::HeaderUnitsStore> HUStore;

    std::vector<uint8_t> InnerFirstChildStack;

    static SourceLocation bestDeclLoc(const Decl *D)
    {
        SourceLocation L = D->getLocation();
        return L.isValid() ? L : D->getBeginLoc();
    }

    void WriteChildCommaIfNeeded()
    {
        if (InnerFirstChildStack.empty()) {
            return;
        }
        uint8_t &first = InnerFirstChildStack.back();
        if (!first) {
            os << ',';
        }
        first = 0;
    }
};

// ---- Consumer ----
class AstJsonConsumer : public ASTConsumer {
public:
    AstJsonConsumer(llvm::raw_ostream &os, std::shared_ptr<ast_dumper::HeaderUnitsStore> huStore)
        : os(os), huStore(std::move(huStore)) {}

    void HandleTranslationUnit(ASTContext &ctx) override
    {
        ASTJsonStreamer streamer(ctx, os, huStore);
        streamer.EmitTranslationUnit();
    }

private:
    llvm::raw_ostream &os;
    std::shared_ptr<ast_dumper::HeaderUnitsStore> huStore;
};

// ---- FrontendAction ----
class JSONFrontendAction : public ASTFrontendAction {
public:
    JSONFrontendAction() : huStore(std::make_shared<ast_dumper::HeaderUnitsStore>()) {}

    // Front end processing of referenced header files
    bool BeginSourceFileAction(CompilerInstance &CI) override
    {
        Preprocessor &PP = CI.getPreprocessor();
        SourceManager &SM = CI.getSourceManager();
        PP.addPPCallbacks(std::make_unique<ast_dumper::HeaderFileCollector>(SM, PP, huStore));
        return true;
    }

    std::unique_ptr<ASTConsumer> CreateASTConsumer(CompilerInstance &, llvm::StringRef InFile) override
    {
        std::string outPath = ast_dumper::ComputeOutPath(InFile,
                                                         ast_dumper::cli::OutputFilename().getValue(),
                                                         g_inputCount);
        llvm::outs() << "[ASTDumper] Input: " << InFile << "\n";
        if (outPath == "-") {
            llvm::outs() << "[ASTDumper] Output: <stdout>\n";
            return std::make_unique<AstJsonConsumer>(llvm::outs(), huStore);
        }
        llvm::outs() << "[ASTDumper] Output: " << outPath << "\n";

        // ensure output dir exists
        {
            llvm::SmallString<SMALL_STRING_SIZE_256> Dir = llvm::sys::path::parent_path(outPath);
            if (!Dir.empty()) {
                llvm::sys::fs::create_directories(Dir);
            }
        }

        std::error_code EC;
        fileOS = std::make_unique<llvm::raw_fd_ostream>(outPath, EC, llvm::sys::fs::OF_Text);
        if (EC) {
            llvm::outs() << "Cannot open output file " << outPath << ": " << EC.message() << "\n";
            return nullptr;
        }

        return std::make_unique<AstJsonConsumer>(*fileOS, huStore);
    }

private:
    std::unique_ptr<llvm::raw_fd_ostream> fileOS;
    std::shared_ptr<ast_dumper::HeaderUnitsStore> huStore;
};

int main(int argc, const char **argv)
{
    auto start = std::chrono::high_resolution_clock::now();
    // argv dump
    llvm::outs() << "[ASTDumper] argv:\n";
    llvm::StringRef sourceFile = "";
    for (int i = 0; i < argc; ++i) {
        llvm::StringRef argvStr(argv[i]);
        if (argvStr.ends_with(".c") || argvStr.ends_with(".cpp")) {
            sourceFile = argvStr;
        }
        llvm::outs() << "  argv[" << i << "] = " << argv[i] << "\n";
    }

    ast_dumper::cli::EnsureRegistered();
    auto expectedParser = CommonOptionsParser::create(argc, argv, ast_dumper::cli::JsonASTCategory());
    if (!expectedParser) {
        llvm::outs() << expectedParser.takeError();
        return 1;
    }

    CommonOptionsParser &optionsParser = expectedParser.get();
    g_inputCount = (unsigned)optionsParser.getSourcePathList().size();

    llvm::outs() << "[ASTDumper] inputs (" << g_inputCount << "):\n";
    for (auto &p : optionsParser.getSourcePathList()) {
        llvm::outs() << "  " << p << "\n";
    }

    const std::string outOpt = ast_dumper::cli::OutputFilename().getValue();
    llvm::outs() << "[ASTDumper] -o = " << (outOpt.empty() ? "<default>" : outOpt) << "\n";

    // -p diagnostics (optional)
    const std::string buildPath = ast_dumper::GetBuildPathFromArgv(argc, argv);
    ast_dumper::printBuildPathDiagnostics(buildPath);

    CompilationDatabase &parserDB = optionsParser.getCompilations();
    ClangTool Tool(parserDB, optionsParser.getSourcePathList());
    ast_dumper::insertArgumentAdjuster(Tool, sourceFile);

    int result = Tool.run(newFrontendActionFactory<JSONFrontendAction>().get());

    auto end = std::chrono::high_resolution_clock::now();
    double ms = (double)std::chrono::duration_cast<std::chrono::milliseconds>(end - start).count();
    llvm::outs() << "[ASTDumper] finished in " << ms << " ms\n";
    return result;
}
