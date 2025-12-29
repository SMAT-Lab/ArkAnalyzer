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
// using llvm::json::Array;
using llvm::json::Object;
using llvm::json::Value;

// for -o file multi-input derivation
static unsigned gInputCount = 0;

// ---- AST streamer ----
class ASTJsonStreamer : public RecursiveASTVisitor<ASTJsonStreamer> {
public:
    ASTJsonStreamer(ASTContext &Ctx, llvm::raw_ostream &OS,
                    std::shared_ptr<ast_dumper::HeaderUnitsStore> HUStore)
        : Ctx(Ctx), SM(Ctx.getSourceManager()), OS(OS), HUStore(std::move(HUStore)) {}

    private:
    void emitEmptyChild()
    {
        writeChildCommaIfNeeded();
        OS << "{}";
    }

    bool traverseStmtOrEmpty(Stmt *Child)
    {
        if (!Child) {
            emitEmptyChild();
            return true;
        }
        if (!ast_dumper::IsFromMainFileIncludingExpansion(SM, Child->getBeginLoc())) {
            emitEmptyChild();
            return true;
        }
        return TraverseStmt(Child);
    }

    template<typename T>
    void callJsonNodeDumper(T* t, ast_dumper::JsonDumperProbeStream &Probe) {
        JSONNodeDumper dumper(Probe, Ctx.getSourceManager(), Ctx, Ctx.getPrintingPolicy(),
                                          &Ctx.getCommentCommandTraits());
        dumper.Visit(t);
        Probe.flush();
    }

public:
    bool TraverseForStmt(ForStmt *FS)
    {
        if (!FS) return true;
        // 保持 RAV 的 visit 链路
        if (!WalkUpFromForStmt(FS)) return false;

        // 按 clang JSON 的固定槽位顺序输出
        if (!traverseStmtOrEmpty(FS->getInit())) return false;
        if (!traverseStmtOrEmpty(FS->getConditionVariableDeclStmt())) return false;
        if (!traverseStmtOrEmpty(FS->getCond())) return false;
        if (!traverseStmtOrEmpty(FS->getInc())) return false;
        if (!traverseStmtOrEmpty(FS->getBody())) return false;

        return true;
    }


    void emitTranslationUnit()
    {
        TraverseDecl(Ctx.getTranslationUnitDecl());
        OS << "\n";
        OS.flush();
    }

    bool TraverseDecl(Decl *D)
    {
        if (!D) return true;

        if (!isa<TranslationUnitDecl>(D)) {
            SourceLocation L = bestDeclLoc(D);
            if (!ast_dumper::IsFromMainFileIncludingExpansion(SM, L)) return true;
        }

        writeChildCommaIfNeeded();

        OS << '{';
        bool wroteAnyField = false;

        bool dumperHasName = false;
        bool dumperHasCode = false;
        ast_dumper::JsonDumperProbeStream Probe(OS);
        callJsonNodeDumper(D, Probe);
        dumperHasName = Probe.hasNameKey();
        dumperHasCode = Probe.hasCodeKey();
        wroteAnyField = (Probe.bytesWritten() > 0);

        if (!dumperHasName) {
            std::string name;
            if (const auto *ND = dyn_cast<NamedDecl>(D)) name = ND->getNameAsString();
            else if (isa<TranslationUnitDecl>(D))        name = "TranslationUnit";

            if (!name.empty()) {
                ast_dumper::json::WriteCommaIf(wroteAnyField, OS);
                ast_dumper::json::WriteKey(OS, "name");
                ast_dumper::json::PrintJsonString(OS, name);
            }
        }

        if (!dumperHasCode) {
            std::string code = ast_dumper::GetSourceTextByRange(SM, Ctx.getLangOpts(), D->getSourceRange(), true);
            if (!code.empty()) {
                ast_dumper::json::WriteCommaIf(wroteAnyField, OS);
                ast_dumper::json::WriteKey(OS, "code");
                ast_dumper::json::PrintJsonString(OS, code);
            }
        }

        ast_dumper::json::WriteCommaIf(wroteAnyField, OS);
        ast_dumper::json::WriteKey(OS, "inner");
        OS << '[';
        InnerFirstChildStack.push_back(1);

        RecursiveASTVisitor<ASTJsonStreamer>::TraverseDecl(D);

        InnerFirstChildStack.pop_back();
        OS << ']';

        if (isa<TranslationUnitDecl>(D)) {
            OS << ",\"headerUnits\":[";
            bool firstHU = true;
            for (auto &kv : HUStore->ByHeader) {
                if (!firstHU) OS << ',';
                firstHU = false;

                // MSVC/LLVM: Value(Object&&) needs rvalue; copy then move.
                llvm::json::Object tmp = kv.second;
                OS << llvm::formatv("{0}", llvm::json::Value(std::move(tmp)));
            }
            OS << ']';
        }

        OS << '}';
        return true;
    }


    bool TraverseStmt(Stmt *S)
    {
        if (!S) return true;
        if (!ast_dumper::IsFromMainFileIncludingExpansion(SM, S->getBeginLoc())) return true;

        writeChildCommaIfNeeded();

        OS << '{';
        bool wroteAnyField = false;

        bool dumperHasCode = false;
        ast_dumper::JsonDumperProbeStream Probe(OS);
        callJsonNodeDumper(S, Probe);
        dumperHasCode = Probe.hasCodeKey();
        wroteAnyField = (Probe.bytesWritten() > 0);

        if (!dumperHasCode) {
            std::string code = ast_dumper::GetSourceTextByRange(SM, Ctx.getLangOpts(), S->getSourceRange(), true);
            if (!code.empty()) {
                ast_dumper::json::WriteCommaIf(wroteAnyField, OS);
                ast_dumper::json::WriteKey(OS, "code");
                ast_dumper::json::PrintJsonString(OS, code);
            }
        }

        ast_dumper::json::WriteCommaIf(wroteAnyField, OS);
        ast_dumper::json::WriteKey(OS, "inner");
        OS << '[';
        InnerFirstChildStack.push_back(1);

        RecursiveASTVisitor<ASTJsonStreamer>::TraverseStmt(S);

        InnerFirstChildStack.pop_back();
        OS << ']';

        OS << '}';
        return true;
    }

    bool TraverseConstructorInitializer(CXXCtorInitializer *Init)
    {
        if (!Init) return true;
        if (!ast_dumper::IsFromMainFileIncludingExpansion(SM, Init->getSourceLocation())) return true;

        writeChildCommaIfNeeded();

        OS << '{';
        bool wroteAnyField = false;

        bool dumperHasCode = false;
        ast_dumper::JsonDumperProbeStream Probe(OS);
        callJsonNodeDumper(Init, Probe);
        dumperHasCode = Probe.hasCodeKey();
        wroteAnyField = (Probe.bytesWritten() > 0);

        if (!dumperHasCode) {
            std::string code = ast_dumper::GetSourceTextByRange(SM, Ctx.getLangOpts(), Init->getSourceRange(), true);
            if (!code.empty()) {
                ast_dumper::json::WriteCommaIf(wroteAnyField, OS);
                ast_dumper::json::WriteKey(OS, "code");
                ast_dumper::json::PrintJsonString(OS, code);
            }
        }

        ast_dumper::json::WriteCommaIf(wroteAnyField, OS);
        ast_dumper::json::WriteKey(OS, "inner");
        OS << '[';
        InnerFirstChildStack.push_back(1);

        RecursiveASTVisitor<ASTJsonStreamer>::TraverseConstructorInitializer(Init);

        InnerFirstChildStack.pop_back();
        OS << ']';

        OS << '}';
        return true;
    }

private:
    ASTContext &Ctx;
    const SourceManager &SM;
    llvm::raw_ostream &OS;
    std::shared_ptr<ast_dumper::HeaderUnitsStore> HUStore;

    std::vector<uint8_t> InnerFirstChildStack;

    static SourceLocation bestDeclLoc(const Decl *D)
    {
        SourceLocation L = D->getLocation();
        return L.isValid() ? L : D->getBeginLoc();
    }

    void writeChildCommaIfNeeded()
    {
        if (InnerFirstChildStack.empty()) return;
        uint8_t &first = InnerFirstChildStack.back();
        if (!first) OS << ',';
        first = 0;
    }
};

// ---- Consumer ----
class AstJsonConsumer : public ASTConsumer {
public:
    AstJsonConsumer(llvm::raw_ostream &OS, std::shared_ptr<ast_dumper::HeaderUnitsStore> HUStore)
        : OS(OS), HUStore(std::move(HUStore)) {}

    void HandleTranslationUnit(ASTContext &Ctx) override
    {
        ASTJsonStreamer streamer(Ctx, OS, HUStore);
        streamer.emitTranslationUnit();
    }

private:
    llvm::raw_ostream &OS;
    std::shared_ptr<ast_dumper::HeaderUnitsStore> HUStore;
};

// ---- FrontendAction ----
class JSONFrontendAction : public ASTFrontendAction {
public:
    JSONFrontendAction() : HUStore(std::make_shared<ast_dumper::HeaderUnitsStore>()) {}

    bool BeginSourceFileAction(CompilerInstance &CI) override
    {
        Preprocessor &PP = CI.getPreprocessor();
        SourceManager &SM = CI.getSourceManager();
        PP.addPPCallbacks(std::make_unique<ast_dumper::HeaderFileCollector>(SM, PP, HUStore));
        return true;
    }

    std::unique_ptr<ASTConsumer> CreateASTConsumer(CompilerInstance &, llvm::StringRef InFile) override
    {
        std::string OutPath = ast_dumper::ComputeOutPath(InFile,
                                                         ast_dumper::cli::OutputFilename().getValue(),
                                                         gInputCount);
        llvm::outs() << "[ASTDumper] Input: " << InFile << "\n";
        if (OutPath == "-") {
            llvm::outs() << "[ASTDumper] Output: <stdout>\n";
            return std::make_unique<AstJsonConsumer>(llvm::outs(), HUStore);
        }
        llvm::outs() << "[ASTDumper] Output: " << OutPath << "\n";

        // ensure output dir exists
        {
            llvm::SmallString<256> Dir = llvm::sys::path::parent_path(OutPath);
            if (!Dir.empty()) llvm::sys::fs::create_directories(Dir);
        }

        std::error_code EC;
        FileOS = std::make_unique<llvm::raw_fd_ostream>(OutPath, EC, llvm::sys::fs::OF_Text);
        if (EC) {
            llvm::outs() << "Cannot open output file " << OutPath << ": " << EC.message() << "\n";
            return nullptr;
        }

        return std::make_unique<AstJsonConsumer>(*FileOS, HUStore);
    }

private:
    std::unique_ptr<llvm::raw_fd_ostream> FileOS;
    std::shared_ptr<ast_dumper::HeaderUnitsStore> HUStore;
};



int main(int argc, const char **argv)
{
    auto start = std::chrono::high_resolution_clock::now();

    // argv dump
    llvm::outs() << "[ASTDumper] argv:\n";
    for (int i = 0; i < argc; ++i)
        llvm::outs() << "  argv[" << i << "] = " << argv[i] << "\n";

    ast_dumper::cli::EnsureRegistered();
    auto ExpectedParser = CommonOptionsParser::create(argc, argv, ast_dumper::cli::JsonASTCategory());
    if (!ExpectedParser) {
        llvm::outs() << ExpectedParser.takeError();
        return 1;
    }

    CommonOptionsParser &OptionsParser = ExpectedParser.get();
    gInputCount = (unsigned)OptionsParser.getSourcePathList().size();

    llvm::outs() << "[ASTDumper] inputs (" << gInputCount << "):\n";
    for (auto &p : OptionsParser.getSourcePathList())
        llvm::outs() << "  " << p << "\n";

    const std::string outOpt = ast_dumper::cli::OutputFilename().getValue();
    llvm::outs() << "[ASTDumper] -o = " << (outOpt.empty() ? "<default>" : outOpt) << "\n";

    // -p diagnostics (optional)
    const std::string BuildPath = ast_dumper::GetBuildPathFromArgv(argc, argv);
    ast_dumper::PrintBuildPathDiagnostics(BuildPath);

    // select compilation DB (use fallback only if inputs have no compile command)
    CompilationDatabase &ParserDB = OptionsParser.getCompilations();
    std::unique_ptr<CompilationDatabase> FallbackDB;
    CompilationDatabase *DB = ast_dumper::SelectDBForInputs(ParserDB, OptionsParser.getSourcePathList(), FallbackDB);

    ClangTool Tool(*DB, OptionsParser.getSourcePathList());
    Tool.appendArgumentsAdjuster(getClangSyntaxOnlyAdjuster());
    Tool.appendArgumentsAdjuster(ast_dumper::MakeOhosLibcxxFixAdjuster());

    int result = Tool.run(newFrontendActionFactory<JSONFrontendAction>().get());

    auto end = std::chrono::high_resolution_clock::now();
    double ms = (double)std::chrono::duration_cast<std::chrono::milliseconds>(end - start).count();
    llvm::outs() << "[ASTDumper] finished in " << ms << " ms\n";
    return result;
}
