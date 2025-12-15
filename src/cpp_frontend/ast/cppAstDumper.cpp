#include "clang/AST/ASTConsumer.h"
#include "clang/AST/ASTContext.h"
#include "clang/AST/Decl.h"
#include "clang/AST/DeclCXX.h"
#include "clang/AST/JSONNodeDumper.h"
#include "clang/AST/RecursiveASTVisitor.h"
#include "clang/Frontend/CompilerInstance.h"
#include "clang/Frontend/FrontendActions.h"
#include "clang/Lex/Lexer.h"
#include "clang/Lex/PPCallbacks.h"
#include "clang/Lex/Preprocessor.h"
#include "clang/Tooling/ArgumentsAdjusters.h"
#include "clang/Tooling/CommonOptionsParser.h"
#include "clang/Tooling/Tooling.h"
#include "llvm/Support/CommandLine.h"
#include "llvm/Support/FileSystem.h"
#include "llvm/Support/FormatVariadic.h"
#include "llvm/Support/JSON.h"
#include "llvm/Support/Path.h"
#include "llvm/Support/raw_ostream.h"

#include "utils/compile_db_utils.h"

#include <chrono>
#include <cstdint>
#include <cstring>
#include <map>
#include <memory>
#include <string>
#include <utility>
#include <vector>

using namespace clang;
using namespace clang::tooling;
using llvm::json::Array;
using llvm::json::Object;
using llvm::json::Value;

// ---- CLI ----
static llvm::cl::OptionCategory JsonASTCategory("json-ast options");

static llvm::cl::opt<std::string> OutputFilename(
    "o",
    llvm::cl::desc(
        "Output file/dir for JSON AST.\n"
        "Default: <input_dir>/<input_stem>_AST.json\n"
        "Use '-' for stdout.\n"
        "If -o is a directory (existing or endswith / or \\): outputs are placed under it.\n"
        "If -o is a file:\n"
        "  - single input: output EXACTLY to that file (no auto suffix)\n"
        "  - multiple inputs: output to <o_dir>/<o_stem>_<input_stem><o_ext> (no _AST)"),
    llvm::cl::value_desc("path"),
    llvm::cl::cat(JsonASTCategory));

static llvm::cl::extrahelp MoreHelp(R"(
BUILD PATH OPTION:
  The '-p' option specifies the directory containing compile_commands.json.
)");

// for -o file multi-input derivation
static unsigned gInputCount = 0;

namespace {

// ---- headerUnits store ----
struct HeaderUnitsStore {
    // key: included header path (prefer realpath), fallback "<unresolved>:name"
    // val: { "header": "...", "includes": [ {..}, ... ] }
    std::map<std::string, Object> ByHeader;
};

// main-file check (macro expansion included)
static bool isFromMainFileIncludingExpansion(const SourceManager &SM, SourceLocation Loc) {
    if (Loc.isInvalid()) return false;
    SourceLocation E = SM.getExpansionLoc(Loc);
    return E.isValid() && SM.isWrittenInMainFile(E);
}

// extract source text for a range (default: expansion range)
static std::string getSourceTextByRange(const SourceManager &SM,
                                        const LangOptions &LO,
                                        SourceRange SR,
                                        bool UseExpansionRange = true) {
    if (SR.isInvalid()) return "";
    CharSourceRange CR = UseExpansionRange ? SM.getExpansionRange(SR)
                                           : CharSourceRange::getTokenRange(SR);
    if (CR.isInvalid()) return "";
    return Lexer::getSourceText(CR, SM, LO).str();
}

// default output: <input_dir>/<stem>_AST.json
static std::string defaultOutPathForInput(llvm::StringRef InFile) {
    llvm::SmallString<256> Dir = llvm::sys::path::parent_path(InFile);
    llvm::SmallString<256> Base = llvm::sys::path::filename(InFile);
    llvm::sys::path::replace_extension(Base, "");
    llvm::SmallString<256> Out = Dir;
    llvm::sys::path::append(Out, (llvm::Twine(Base) + "_AST.json").str());
    return Out.str().str();
}

static bool looksLikeDirectoryPath(llvm::StringRef P) {
    if (P.empty()) return false;
    char last = P.back();
    if (last == '/' || last == '\\') return true;

    llvm::sys::fs::file_status st;
    return (!llvm::sys::fs::status(P, st) && llvm::sys::fs::is_directory(st));
}

// compute output path (stdout / dir / file with single/multi behavior)
static std::string computeOutPath(llvm::StringRef InFile, llvm::StringRef O) {
    if (O.empty()) return defaultOutPathForInput(InFile);
    if (O == "-") return "-";

    if (looksLikeDirectoryPath(O)) {
        llvm::SmallString<256> Dir(O);
        llvm::SmallString<256> Base = llvm::sys::path::filename(InFile);
        llvm::sys::path::replace_extension(Base, "");
        llvm::SmallString<256> Out = Dir;
        llvm::sys::path::append(Out, (llvm::Twine(Base) + "_AST.json").str());
        return Out.str().str();
    }

    if (gInputCount <= 1) return O.str();

    llvm::SmallString<256> OPath(O);
    llvm::SmallString<256> ODir = llvm::sys::path::parent_path(OPath);
    llvm::SmallString<256> OFile = llvm::sys::path::filename(OPath);

    llvm::SmallString<256> OStem = OFile;
    llvm::sys::path::replace_extension(OStem, "");

    llvm::SmallString<256> InBase = llvm::sys::path::filename(InFile);
    llvm::sys::path::replace_extension(InBase, "");

    llvm::SmallString<256> Ext = llvm::sys::path::extension(OFile);
    std::string ext = Ext.empty() ? ".json" : Ext.str().str();

    llvm::SmallString<256> Out = ODir;
    llvm::sys::path::append(Out, (llvm::Twine(OStem) + "_" + InBase + ext).str());
    return Out.str().str();
}

// ---- PPCallbacks: collect #include ----
class HeaderFileCollector : public PPCallbacks {
public:
    HeaderFileCollector(SourceManager &SM, Preprocessor &PP,
                        std::shared_ptr<HeaderUnitsStore> Store)
        : SM(SM), PP(PP), Store(std::move(Store)) {}

    void InclusionDirective(SourceLocation HashLoc,
                            const Token &,
                            StringRef FileName,
                            bool IsAngled,
                            CharSourceRange,
                            OptionalFileEntryRef File,
                            StringRef SearchPath,
                            StringRef RelativePath,
                            const Module *,
                            bool,
                            SrcMgr::CharacteristicKind) override {
        Object inc;
        inc["kind"] = "InclusionDirective";
        inc["includeName"] = FileName.str();
        inc["isAngled"] = IsAngled;
        inc["searchPath"] = SearchPath.str();
        inc["relativePath"] = RelativePath.str();

        // includedFrom: file containing this #include
        {
            FileID FID = SM.getFileID(HashLoc);
            if (FID.isValid()) {
                if (const FileEntry *FE = SM.getFileEntryForID(FID))
                    inc["includedFrom"] = FE->tryGetRealPathName().str();
            }
        }

        // fileName: resolved header path (if available)
        std::string headerAbs;
        if (File.has_value()) {
            headerAbs = File->getFileEntry().tryGetRealPathName().str();
            inc["fileName"] = headerAbs;
        }

        // loc: expansion position
        {
            SourceLocation E = SM.getExpansionLoc(HashLoc);
            if (E.isValid()) {
                PresumedLoc PL = SM.getPresumedLoc(E);
                if (PL.isValid()) {
                    inc["loc"] = Object{
                        {"file", std::string(PL.getFilename())},
                        {"line", (int64_t)PL.getLine()},
                        {"col",  (int64_t)PL.getColumn()},
                    };
                }
            }
        }

        // code: full "#include ..." line
        {
            SourceLocation E = SM.getExpansionLoc(HashLoc);
            if (E.isValid()) {
                FileID FID = SM.getFileID(E);
                unsigned LineNo = SM.getSpellingLineNumber(E);
                SourceLocation LB = SM.translateLineCol(FID, LineNo, 1);
                SourceLocation LNext = SM.translateLineCol(FID, LineNo + 1, 1);

                CharSourceRange CR = (LNext.isValid())
                    ? CharSourceRange::getCharRange(LB, LNext)
                    : CharSourceRange::getCharRange(LB, SM.getLocForEndOfFile(FID));

                inc["code"] = Lexer::getSourceText(CR, SM, PP.getLangOpts()).str();
            }
        }

        // aggregate
        std::string key = !headerAbs.empty() ? headerAbs : ("<unresolved>:" + FileName.str());
        Object &HU = Store->ByHeader[key];
        HU["header"] = key;
        if (!HU.get("includes")) HU["includes"] = Array{};
        HU["includes"].getAsArray()->push_back(Value(std::move(inc)));
    }

private:
    SourceManager &SM;
    Preprocessor &PP;
    std::shared_ptr<HeaderUnitsStore> Store;
};

// ---- JSON helpers (streaming) ----
static void printJsonString(llvm::raw_ostream &OS, llvm::StringRef S) {
    OS << llvm::formatv("{0}", llvm::json::Value(S)); // escape without parse
}
static void writeKey(llvm::raw_ostream &OS, llvm::StringRef Key) {
    OS << '"' << Key << "\":";
}
static void writeCommaIf(bool &WroteAnyField, llvm::raw_ostream &OS) {
    if (WroteAnyField) OS << ',';
    WroteAnyField = true;
}

// ---- Forward stream: forward dumper output + detect "name"/"code" keys ----
class DumperForwardingStream : public llvm::raw_ostream {
public:
    explicit DumperForwardingStream(llvm::raw_ostream &Out) : Out(Out) {}

    bool hasNameKey() const { return HasName; }
    bool hasCodeKey() const { return HasCode; }
    uint64_t bytesWritten() const { return Bytes; }

private:
    llvm::raw_ostream &Out;
    uint64_t Bytes = 0;
    bool HasName = false;
    bool HasCode = false;

    static constexpr size_t TailMax = 5;
    char Tail[TailMax] = {0};
    size_t TailLen = 0;

    static bool findPattern(const char *Data, size_t Len, const char *Pat, size_t PatLen) {
        if (PatLen == 0 || Len < PatLen) return false;
        for (size_t i = 0; i + PatLen <= Len; ++i)
            if (std::memcmp(Data + i, Pat, PatLen) == 0) return true;
        return false;
    }

    void scanKeys(const char *Ptr, size_t Size) {
        if (HasName && HasCode) return;

        const char *kName = "\"name\"";
        const char *kCode = "\"code\"";
        constexpr size_t kLen = 6;

        // boundary: tail + prefix
        if (TailLen > 0 && Size > 0) {
            char buf[TailMax + (kLen - 1)];
            const size_t take = (Size < (kLen - 1)) ? Size : (kLen - 1);
            const size_t total = TailLen + take;
            std::memcpy(buf, Tail, TailLen);
            std::memcpy(buf + TailLen, Ptr, take);

            if (!HasName && findPattern(buf, total, kName, kLen)) HasName = true;
            if (!HasCode && findPattern(buf, total, kCode, kLen)) HasCode = true;
        }

        // chunk
        if (!HasName && findPattern(Ptr, Size, kName, kLen)) HasName = true;
        if (!HasCode && findPattern(Ptr, Size, kCode, kLen)) HasCode = true;

        // update tail
        if (Size >= TailMax) {
            std::memcpy(Tail, Ptr + (Size - TailMax), TailMax);
            TailLen = TailMax;
        } else {
            char tmp[TailMax + TailMax];
            size_t tmpLen = 0;
            if (TailLen > 0) { std::memcpy(tmp, Tail, TailLen); tmpLen += TailLen; }
            if (Size > 0)    { std::memcpy(tmp + tmpLen, Ptr, Size); tmpLen += Size; }

            if (tmpLen > TailMax) {
                const size_t start = tmpLen - TailMax;
                std::memcpy(Tail, tmp + start, TailMax);
                TailLen = TailMax;
            } else {
                std::memcpy(Tail, tmp, tmpLen);
                TailLen = tmpLen;
            }
        }
    }

    void write_impl(const char *Ptr, size_t Size) override {
        if (Size == 0) return;
        scanKeys(Ptr, Size);
        Out.write(Ptr, Size);
        Bytes += Size;
    }

    uint64_t current_pos() const override { return Bytes; }
};

// ---- AST streamer ----
class ASTJsonStreamer : public RecursiveASTVisitor<ASTJsonStreamer> {
public:
    ASTJsonStreamer(ASTContext &Ctx, llvm::raw_ostream &OS,
                    std::shared_ptr<HeaderUnitsStore> HUStore)
        : Ctx(Ctx), SM(Ctx.getSourceManager()), OS(OS), HUStore(std::move(HUStore)) {}

    void emitTranslationUnit() {
        TraverseDecl(Ctx.getTranslationUnitDecl());
        OS << "\n";
        OS.flush();
    }

    bool TraverseDecl(Decl *D) {
        if (!D) return true;

        if (!isa<TranslationUnitDecl>(D)) {
            SourceLocation L = bestDeclLoc(D);
            if (!isFromMainFileIncludingExpansion(SM, L)) return true;
        }

        writeChildCommaIfNeeded();

        OS << '{';
        bool wroteAnyField = false;

        bool dumperHasName = false;
        bool dumperHasCode = false;
        {
            DumperForwardingStream F(OS);
            JSONNodeDumper dumper(F, Ctx.getSourceManager(), Ctx, Ctx.getPrintingPolicy(),
                                 &Ctx.getCommentCommandTraits());
            dumper.Visit(D);
            F.flush();

            dumperHasName = F.hasNameKey();
            dumperHasCode = F.hasCodeKey();
            wroteAnyField = (F.bytesWritten() > 0);
        }

        if (!dumperHasName) {
            std::string name;
            if (const auto *ND = dyn_cast<NamedDecl>(D)) name = ND->getNameAsString();
            else if (isa<TranslationUnitDecl>(D))        name = "TranslationUnit";

            if (!name.empty()) {
                writeCommaIf(wroteAnyField, OS);
                writeKey(OS, "name");
                printJsonString(OS, name);
            }
        }

        if (!dumperHasCode) {
            std::string code = getSourceTextByRange(SM, Ctx.getLangOpts(), D->getSourceRange(), true);
            if (!code.empty()) {
                writeCommaIf(wroteAnyField, OS);
                writeKey(OS, "code");
                printJsonString(OS, code);
            }
        }

        writeCommaIf(wroteAnyField, OS);
        writeKey(OS, "inner");
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

    bool TraverseStmt(Stmt *S) {
        if (!S) return true;
        if (!isFromMainFileIncludingExpansion(SM, S->getBeginLoc())) return true;

        writeChildCommaIfNeeded();

        OS << '{';
        bool wroteAnyField = false;

        bool dumperHasCode = false;
        {
            DumperForwardingStream F(OS);
            JSONNodeDumper dumper(F, Ctx.getSourceManager(), Ctx, Ctx.getPrintingPolicy(),
                                 &Ctx.getCommentCommandTraits());
            dumper.Visit(S);
            F.flush();

            dumperHasCode = F.hasCodeKey();
            wroteAnyField = (F.bytesWritten() > 0);
        }

        if (!dumperHasCode) {
            std::string code = getSourceTextByRange(SM, Ctx.getLangOpts(), S->getSourceRange(), true);
            if (!code.empty()) {
                writeCommaIf(wroteAnyField, OS);
                writeKey(OS, "code");
                printJsonString(OS, code);
            }
        }

        writeCommaIf(wroteAnyField, OS);
        writeKey(OS, "inner");
        OS << '[';
        InnerFirstChildStack.push_back(1);

        RecursiveASTVisitor<ASTJsonStreamer>::TraverseStmt(S);

        InnerFirstChildStack.pop_back();
        OS << ']';

        OS << '}';
        return true;
    }

    bool TraverseConstructorInitializer(CXXCtorInitializer *Init) {
        if (!Init) return true;
        if (!isFromMainFileIncludingExpansion(SM, Init->getSourceLocation())) return true;

        writeChildCommaIfNeeded();

        OS << '{';
        bool wroteAnyField = false;

        bool dumperHasCode = false;
        {
            DumperForwardingStream F(OS);
            JSONNodeDumper dumper(F, Ctx.getSourceManager(), Ctx, Ctx.getPrintingPolicy(),
                                 &Ctx.getCommentCommandTraits());
            dumper.Visit(Init);
            F.flush();

            dumperHasCode = F.hasCodeKey();
            wroteAnyField = (F.bytesWritten() > 0);
        }

        if (!dumperHasCode) {
            std::string code = getSourceTextByRange(SM, Ctx.getLangOpts(), Init->getSourceRange(), true);
            if (!code.empty()) {
                writeCommaIf(wroteAnyField, OS);
                writeKey(OS, "code");
                printJsonString(OS, code);
            }
        }

        writeCommaIf(wroteAnyField, OS);
        writeKey(OS, "inner");
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
    std::shared_ptr<HeaderUnitsStore> HUStore;

    std::vector<uint8_t> InnerFirstChildStack;

    static SourceLocation bestDeclLoc(const Decl *D) {
        SourceLocation L = D->getLocation();
        return L.isValid() ? L : D->getBeginLoc();
    }

    void writeChildCommaIfNeeded() {
        if (InnerFirstChildStack.empty()) return;
        uint8_t &first = InnerFirstChildStack.back();
        if (!first) OS << ',';
        first = 0;
    }
};

// ---- Consumer ----
class AstJsonConsumer : public ASTConsumer {
public:
    AstJsonConsumer(llvm::raw_ostream &OS, std::shared_ptr<HeaderUnitsStore> HUStore)
        : OS(OS), HUStore(std::move(HUStore)) {}

    void HandleTranslationUnit(ASTContext &Ctx) override {
        ASTJsonStreamer streamer(Ctx, OS, HUStore);
        streamer.emitTranslationUnit();
    }

private:
    llvm::raw_ostream &OS;
    std::shared_ptr<HeaderUnitsStore> HUStore;
};

// ---- FrontendAction ----
class JSONFrontendAction : public ASTFrontendAction {
public:
    JSONFrontendAction() : HUStore(std::make_shared<HeaderUnitsStore>()) {}

    bool BeginSourceFileAction(CompilerInstance &CI) override {
        Preprocessor &PP = CI.getPreprocessor();
        SourceManager &SM = CI.getSourceManager();
        PP.addPPCallbacks(std::make_unique<HeaderFileCollector>(SM, PP, HUStore));
        return true;
    }

    std::unique_ptr<ASTConsumer> CreateASTConsumer(CompilerInstance &, llvm::StringRef InFile) override {
        std::string OutPath = computeOutPath(InFile, OutputFilename.getValue());

        llvm::errs() << "[ASTDumper] Input: " << InFile << "\n";
        if (OutPath == "-") {
            llvm::errs() << "[ASTDumper] Output: <stdout>\n";
            return std::make_unique<AstJsonConsumer>(llvm::outs(), HUStore);
        }
        llvm::errs() << "[ASTDumper] Output: " << OutPath << "\n";

        // ensure output dir exists
        {
            llvm::SmallString<256> Dir = llvm::sys::path::parent_path(OutPath);
            if (!Dir.empty()) llvm::sys::fs::create_directories(Dir);
        }

        std::error_code EC;
        FileOS = std::make_unique<llvm::raw_fd_ostream>(OutPath, EC, llvm::sys::fs::OF_Text);
        if (EC) {
            llvm::errs() << "Cannot open output file " << OutPath << ": " << EC.message() << "\n";
            return nullptr;
        }

        return std::make_unique<AstJsonConsumer>(*FileOS, HUStore);
    }

private:
    std::unique_ptr<llvm::raw_fd_ostream> FileOS;
    std::shared_ptr<HeaderUnitsStore> HUStore;
};

} // namespace

int main(int argc, const char **argv) {
    auto start = std::chrono::high_resolution_clock::now();

    // argv dump
    llvm::errs() << "[ASTDumper] argv:\n";
    for (int i = 0; i < argc; ++i)
        llvm::errs() << "  argv[" << i << "] = " << argv[i] << "\n";

    auto ExpectedParser = CommonOptionsParser::create(argc, argv, JsonASTCategory);
    if (!ExpectedParser) {
        llvm::errs() << ExpectedParser.takeError();
        return 1;
    }

    CommonOptionsParser &OptionsParser = ExpectedParser.get();
    gInputCount = (unsigned)OptionsParser.getSourcePathList().size();

    llvm::errs() << "[ASTDumper] inputs (" << gInputCount << "):\n";
    for (auto &p : OptionsParser.getSourcePathList())
        llvm::errs() << "  " << p << "\n";

    const std::string outOpt = OutputFilename.getValue();
    llvm::errs() << "[ASTDumper] -o = " << (outOpt.empty() ? "<default>" : outOpt) << "\n";

    // -p diagnostics (optional)
    const std::string BuildPath = ast_dumper::GetBuildPathFromArgv(argc, argv);
    ast_dumper::PrintBuildPathDiagnostics(BuildPath, llvm::errs());

    // select compilation DB (use fallback only if inputs have no compile command)
    CompilationDatabase &ParserDB = OptionsParser.getCompilations();
    std::unique_ptr<CompilationDatabase> FallbackDB;
    CompilationDatabase *DB = ast_dumper::SelectDBForInputs(
        ParserDB, OptionsParser.getSourcePathList(), FallbackDB, llvm::errs());

    ClangTool Tool(*DB, OptionsParser.getSourcePathList());
    Tool.appendArgumentsAdjuster(getClangSyntaxOnlyAdjuster());
    Tool.appendArgumentsAdjuster(ast_dumper::MakeOhosLibcxxFixAdjuster());

    int result = Tool.run(newFrontendActionFactory<JSONFrontendAction>().get());

    auto end = std::chrono::high_resolution_clock::now();
    double ms = (double)std::chrono::duration_cast<std::chrono::milliseconds>(end - start).count();
    llvm::errs() << "[ASTDumper] finished in " << ms << " ms\n";
    return result;
}
