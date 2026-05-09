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
#include "clang/Tooling/CompilationDatabase.h"
#include "clang/Tooling/JSONCompilationDatabase.h"
#include "clang/Tooling/Tooling.h"
#include "llvm/Support/FileSystem.h"
#include "llvm/Support/FormatVariadic.h"
#include "llvm/Support/JSON.h"
#include "llvm/Support/Path.h"
#include "llvm/Support/Process.h"
#include "llvm/Support/raw_ostream.h"
#include <llvm/Demangle/Demangle.h>
#include "utils/source_utils.h"
#include "utils/cli_options.h"
#include "utils/output_path.h"
#include "utils/compile_db_utils.h"
#include "utils/header_units.h"
#include "utils/json_streaming.h"
#include "utils/json_dumper_probe.h"
#include <algorithm>
#include <atomic>
#include <chrono>
#include <condition_variable>
#include <cstdint>
#include <cstdlib>
#include <cstring>
#include <deque>
#include <fstream>
#include <memory>
#if defined(_WIN32)
#include <windows.h>
#include <psapi.h>
#else
#include <sys/resource.h>
#endif
#include <mutex>
#include <optional>
#include <string>
#include <thread>
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
                ast_dumper::json::WriteCommaIf(wroteAnyField, os);
                ast_dumper::json::WriteKey(os, "name");
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
                ast_dumper::json::WriteCommaIf(wroteAnyField, os);
                ast_dumper::json::WriteKey(os, "code");
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

        ast_dumper::json::WriteCommaIf(wroteAnyField, os);
        ast_dumper::json::WriteKey(os, "inner");
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

        ast_dumper::json::WriteCommaIf(wroteAnyField, os);
        ast_dumper::json::WriteKey(os, "inner");
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

        ast_dumper::json::WriteCommaIf(wroteAnyField, os);
        ast_dumper::json::WriteKey(os, "inner");
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

        std::error_code errorCode;
        fileOS = std::make_unique<llvm::raw_fd_ostream>(outPath, errorCode, llvm::sys::fs::OF_Text);
        if (errorCode) {
            llvm::outs() << "Cannot open output file " << outPath << ": " << errorCode.message() << "\n";
            return nullptr;
        }

        return std::make_unique<AstJsonConsumer>(*fileOS, huStore);
    }

private:
    std::unique_ptr<llvm::raw_fd_ostream> fileOS;
    std::shared_ptr<ast_dumper::HeaderUnitsStore> huStore;
};

// ---- N-API / manifest: stream JSON into memory (no file output) ----
class JSONCaptureFrontendAction : public ASTFrontendAction {
public:
    explicit JSONCaptureFrontendAction(llvm::raw_ostream &sink)
        : sink(sink), huStore(std::make_shared<ast_dumper::HeaderUnitsStore>()) {}

    bool BeginSourceFileAction(CompilerInstance &CI) override
    {
        Preprocessor &PP = CI.getPreprocessor();
        SourceManager &SM = CI.getSourceManager();
        PP.addPPCallbacks(std::make_unique<ast_dumper::HeaderFileCollector>(SM, PP, huStore));
        return true;
    }

    std::unique_ptr<ASTConsumer> CreateASTConsumer(CompilerInstance &, llvm::StringRef) override
    {
        return std::make_unique<AstJsonConsumer>(sink, huStore);
    }

private:
    llvm::raw_ostream &sink;
    std::shared_ptr<ast_dumper::HeaderUnitsStore> huStore;
};

class CaptureJsonActionFactory : public FrontendActionFactory {
public:
    explicit CaptureJsonActionFactory(llvm::raw_ostream &sink) : sink(sink) {}

    std::unique_ptr<FrontendAction> create() override
    {
        return std::make_unique<JSONCaptureFrontendAction>(sink);
    }

private:
    llvm::raw_ostream &sink;
};

// =============================================================================
// Manifest batch (ParseCppAstWithManifest) — used by astJsonDumper.node
// =============================================================================
static constexpr int EXIT_OK = 0;
static constexpr int EXIT_FAIL = 1;

static constexpr llvm::StringLiteral JSON_FILES = "files";
static constexpr llvm::StringLiteral JSON_INCLUDE_DIRS = "includeDirs";
static constexpr llvm::StringLiteral JSON_DEFAULT_CC_JSON = "defaultCcJson";
static constexpr llvm::StringLiteral JSON_CC_JSON_PATHS = "ccJsonPaths";
static constexpr llvm::StringLiteral JSON_MAX_PARALLEL_PROCESSES = "maxParallelProcesses";
static constexpr llvm::StringLiteral JSON_MAX_PENDING_AST_RESULTS = "maxPendingAstResults";

using AstManifestCallback = bool (*)(void *userData, uint32_t fileIndex, uint32_t taskRc,
                                     const char *payloadData, size_t payloadSize);

struct FileTask {
    uint32_t fileIndex = 0;
    std::string sourceFile;
    std::string ccForFile;
};

struct FileAstItem {
    uint32_t fileIndex = 0;
    uint32_t taskRc = 0;
    std::string payload;
};

struct WorklistConfig {
    const llvm::json::Array *filesArr = nullptr;
    std::string defaultCcJson;
    const llvm::json::Array *ccJsonArr = nullptr;
    std::vector<std::string> includeDirs;
    uint32_t maxParallelProcesses = 1;
    uint32_t maxPendingAstResults = 0;
};

struct CallbackContext {
    AstManifestCallback callback = nullptr;
    void *userData = nullptr;
};

struct ParallelAstRunContext {
    const std::vector<FileTask> &tasks;
    const std::vector<std::string> &includeDirs;
    const uint32_t maxPendingInQueue;

    std::atomic<uint32_t> nextTaskIndex{0};
    std::atomic<uint32_t> activeWorkers;
    std::atomic<bool> stopRequested{false};
    std::mutex queueMutex;
    std::condition_variable queueCv;
    std::deque<FileAstItem> queue;

    ParallelAstRunContext(const std::vector<FileTask> &t, const std::vector<std::string> &inc,
                          uint32_t maxQueue, uint32_t workers)
        : tasks(t), includeDirs(inc), maxPendingInQueue(maxQueue), activeWorkers(workers) {}

    ParallelAstRunContext(const ParallelAstRunContext &) = delete;
    ParallelAstRunContext &operator=(const ParallelAstRunContext &) = delete;
};

static void LogManifestError(llvm::StringRef msg)
{
    llvm::errs() << "[ASTDumper][manifest] " << msg << "\n";
}

static long GetCurrentRssKb()
{
#if defined(_WIN32)
    HANDLE hProcess = GetCurrentProcess();
    PROCESS_MEMORY_COUNTERS pmc;
    if (GetProcessMemoryInfo(hProcess, &pmc, sizeof(pmc))) {
        return pmc.WorkingSetSize / sizeof(long);
    }
    return 0;
#elif defined(__APPLE__)
    struct rusage ru;
    if (getrusage(RUSAGE_SELF, &ru) == 0) {
        return ru.ru_maxrss;
    }
    return 0;
#elif defined(__linux__)
    struct rusage ru;
    if (getrusage(RUSAGE_SELF, &ru) == 0) {
        return ru.ru_maxrss;
    }
    return 0;
#else
    return 0;
#endif
}

static std::mutex g_astMemLogMutex;

static void LogAstMemStats(const char* tag, uint32_t qSize, uint32_t active, uint32_t nextIdx, uint32_t total)
{
    if (std::getenv("ARKANALYZER_DEBUG_AST_MEM") == nullptr) {
        return;
    }
    std::lock_guard<std::mutex> lock(g_astMemLogMutex);
    long rss = GetCurrentRssKb();
    llvm::errs() << "[AST-MEM] " << tag
                 << " q=" << qSize
                 << " active=" << active
                 << " progress=" << nextIdx << "/" << total
                 << " VmRSS=" << rss << "kB\n";
}

static void LogParseStep(const char* step, llvm::StringRef file, long before, long after)
{
    if (std::getenv("ARKANALYZER_DEBUG_AST_MEM") == nullptr) {
        return;
    }
    std::lock_guard<std::mutex> lock(g_astMemLogMutex);
    llvm::errs() << "[AST-MEM] parse-step " << step
                 << " file=" << file
                 << " rssBefore=" << before << "kB"
                 << " rssAfter=" << after << "kB"
                 << " delta=" << (after - before) << "kB\n";
}

static bool IsCxxHeaderPath(llvm::StringRef path)
{
    return path.ends_with(".h") || path.ends_with(".hpp") || path.ends_with(".hh") ||
           path.ends_with(".hxx");
}

static std::unique_ptr<FixedCompilationDatabase> genCompilationDatabase(const std::vector<std::string> &includeDirs,
                                                                        bool asHeaderUnit)
{
    std::vector<std::string> compileLine;
    ast_dumper::prependOhSdkHeaderCompileFlags(compileLine, includeDirs);
    ast_dumper::appendHostLinuxFallbackSystemIncludes(compileLine, includeDirs);
    if (asHeaderUnit) {
        compileLine.emplace_back("-x");
        compileLine.emplace_back("c++-header");
    } else {
        compileLine.emplace_back("-xc++");
    }
    compileLine.emplace_back("-std=c++17");
    for (const std::string &dir : includeDirs) {
        if (!dir.empty()) {
            compileLine.emplace_back("-I" + dir);
        }
    }
    return std::make_unique<FixedCompilationDatabase>(".", compileLine);
}

static std::unique_ptr<CompilationDatabase> LoadCompilationDatabase(
    llvm::StringRef sourceFile,
    llvm::StringRef ccForFile,
    const std::vector<std::string> &includeDirs,
    bool &useCompileCommandsJson,
    llvm::StringRef logSourceFile)
{
    std::string err;
    std::unique_ptr<CompilationDatabase> db;
    useCompileCommandsJson = false;

    if (!ccForFile.empty()) {
        long rssBeforeDb = GetCurrentRssKb();
        if (auto loaded = JSONCompilationDatabase::loadFromDirectory(ccForFile, err)) {
            db = std::move(loaded);
            useCompileCommandsJson = true;
        } else {
            err.clear();
            if (auto loaded = JSONCompilationDatabase::loadFromFile(ccForFile,
                                                                    err,
                                                                    JSONCommandLineSyntax::AutoDetect)) {
                db = std::move(loaded);
                useCompileCommandsJson = true;
            }
        }
        long rssAfterDb = GetCurrentRssKb();
        LogParseStep("after-db-load", logSourceFile, rssBeforeDb, rssAfterDb);
    }

    if (db) {
        std::vector<CompileCommand> cmds = db->getCompileCommands(sourceFile);
        if (cmds.empty()) {
            db.reset();
            useCompileCommandsJson = false;
        }
    }

    if (!db) {
        long rssBeforeFallback = GetCurrentRssKb();
        db = genCompilationDatabase(includeDirs, IsCxxHeaderPath(sourceFile));
        long rssAfterFallback = GetCurrentRssKb();
        LogParseStep("after-fallback-db", logSourceFile, rssBeforeFallback, rssAfterFallback);
    }

    return db;
}

static int RunClangTool(ClangTool &tool, llvm::StringRef sourceFile, std::string *capturedPayload)
{
    std::string buffer;
    llvm::raw_string_ostream ss(buffer);
    CaptureJsonActionFactory factory(ss);
    long rssBeforeRun = GetCurrentRssKb();
    int rc = tool.run(&factory);
    ss.flush();
    long rssAfterRun = GetCurrentRssKb();
    LogParseStep("after-tool-run", sourceFile, rssBeforeRun, rssAfterRun);

    if (capturedPayload != nullptr) {
        *capturedPayload = std::move(buffer);
    }
    return rc;
}

static int ParseSingleFileAst(llvm::StringRef sourceFile, llvm::StringRef ccForFile,
                              const std::vector<std::string> &includeDirs, std::string *capturedPayload)
{
    long rss0 = GetCurrentRssKb();
    LogParseStep("entry", sourceFile, rss0, rss0);

    bool useCompileCommandsJson = false;
    std::unique_ptr<CompilationDatabase> db = LoadCompilationDatabase(
        sourceFile, ccForFile, includeDirs, useCompileCommandsJson, sourceFile);

    std::vector<std::string> sources;
    sources.emplace_back(sourceFile.str());
    long rssBeforeTool = GetCurrentRssKb();
    ClangTool tool(*db, sources);
    if (useCompileCommandsJson) {
        ast_dumper::prependHostLinuxFallbackToClangTool(tool, includeDirs);
    }
    ast_dumper::insertArgumentAdjuster(tool, sourceFile);
    if (useCompileCommandsJson) {
        ast_dumper::prependResourceDirAndManifestIncludes(tool, includeDirs);
    }
    long rssAfterToolCreate = GetCurrentRssKb();
    LogParseStep("after-tool-create", sourceFile, rssBeforeTool, rssAfterToolCreate);

    int rc = RunClangTool(tool, sourceFile, capturedPayload);

    long rssFinal = GetCurrentRssKb();
    LogParseStep("exit", sourceFile, rssFinal, rssFinal);
    return rc;
}

static bool ReadWorklistConfig(const llvm::json::Object &root, WorklistConfig &cfg)
{
    const llvm::json::Value *filesVal = root.get(JSON_FILES);
    if (!filesVal) {
        LogManifestError("missing \"files\"");
        return false;
    }
    cfg.filesArr = filesVal->getAsArray();
    if (!cfg.filesArr || cfg.filesArr->empty()) {
        LogManifestError("\"files\" must be a non-empty array");
        return false;
    }

    if (const llvm::json::Value *dv = root.get(JSON_DEFAULT_CC_JSON)) {
        if (auto s = dv->getAsString()) {
            cfg.defaultCcJson = s->str();
        }
    }
    if (const llvm::json::Value *cv = root.get(JSON_CC_JSON_PATHS)) {
        cfg.ccJsonArr = cv->getAsArray();
    }

    // 读取 JSON 中的 include 目录配置
    const llvm::json::Value *incVal = root.get(JSON_INCLUDE_DIRS);
    const llvm::json::Array *incArr = incVal ? incVal->getAsArray() : nullptr;

    if (incArr) {
        for (const llvm::json::Value &iv : *incArr) {
            if (auto idir = iv.getAsString()) {
                cfg.includeDirs.emplace_back(idir->str());
            }
        }
    }

    const llvm::json::Value *pv = root.get(JSON_MAX_PARALLEL_PROCESSES);
    if (pv) {
        if (auto p = pv->getAsInteger()) {
            int64_t v = *p;
            if (v <= 0) {
                unsigned hc = std::thread::hardware_concurrency();
                cfg.maxParallelProcesses = hc == 0 ? 1u : hc;
            } else {
                cfg.maxParallelProcesses = static_cast<uint32_t>(std::min<int64_t>(v, UINT32_MAX));
            }
        }
    }
    if (const llvm::json::Value *qv = root.get(JSON_MAX_PENDING_AST_RESULTS)) {
        if (auto q = qv->getAsInteger()) {
            cfg.maxPendingAstResults = static_cast<uint32_t>(std::max<int64_t>(0, *q));
        }
    }
    return true;
}

static bool BuildFileTasks(const WorklistConfig &cfg, std::vector<FileTask> &tasks)
{
    tasks.clear();
    tasks.reserve(cfg.filesArr->size());
    uint32_t idx = 0;
    for (const llvm::json::Value &fv : *cfg.filesArr) {
        auto fopt = fv.getAsString();
        if (!fopt || fopt->empty()) {
            LogManifestError("\"files\" entries must be non-empty strings");
            return false;
        }
        std::string sourceFile = fopt->str();
        std::string ccForFile = cfg.defaultCcJson;
        if (cfg.ccJsonArr && idx < cfg.ccJsonArr->size()) {
            if (auto cs = (*cfg.ccJsonArr)[idx].getAsString(); cs && !cs->empty()) {
                ccForFile = cs->str();
            }
        }
        FileTask task;
        task.fileIndex = idx;
        task.sourceFile = std::move(sourceFile);
        task.ccForFile = std::move(ccForFile);
        tasks.push_back(std::move(task));
        ++idx;
    }
    return true;
}

static void RunAstWorkerBody(ParallelAstRunContext &ctx)
{
    while (!ctx.stopRequested.load()) {
        uint32_t i = ctx.nextTaskIndex.fetch_add(1, std::memory_order_relaxed);
        if (i >= ctx.tasks.size()) {
            break;
        }
        const FileTask &task = ctx.tasks[i];
        std::string payload;
        long rssBeforeParse = GetCurrentRssKb();
        int rc = ParseSingleFileAst(task.sourceFile, task.ccForFile, ctx.includeDirs, &payload);
        long rssAfterParse = GetCurrentRssKb();
        LogParseStep("worker-after-parse", task.sourceFile, rssBeforeParse, rssAfterParse);
        {
            std::unique_lock<std::mutex> lock(ctx.queueMutex);
            uint32_t qBeforeWait = static_cast<uint32_t>(ctx.queue.size());
            uint32_t activeBefore = ctx.activeWorkers.load(std::memory_order_relaxed);
            LogAstMemStats("worker-about-to-wait-full", qBeforeWait, activeBefore, i + 1,
                           static_cast<uint32_t>(ctx.tasks.size()));
            ctx.queueCv.wait(lock, [&]() {
                return ctx.stopRequested.load() || ctx.queue.size() < ctx.maxPendingInQueue;
            });
            LogAstMemStats("worker-woke-from-wait", static_cast<uint32_t>(ctx.queue.size()),
                           ctx.activeWorkers.load(std::memory_order_relaxed), i + 1,
                           static_cast<uint32_t>(ctx.tasks.size()));
            if (ctx.stopRequested.load()) {
                break;
            }
            ctx.queue.push_back(
                FileAstItem{task.fileIndex, static_cast<uint32_t>(rc), std::move(payload)});
            LogAstMemStats("worker-pushed", static_cast<uint32_t>(ctx.queue.size()),
                           ctx.activeWorkers.load(std::memory_order_relaxed),
                           i + 1, static_cast<uint32_t>(ctx.tasks.size()));
        }
        ctx.queueCv.notify_one();
    }
    uint32_t remaining = ctx.activeWorkers.fetch_sub(1, std::memory_order_acq_rel) - 1;
    LogAstMemStats("worker-exit", static_cast<uint32_t>(ctx.queue.size()), remaining,
                   static_cast<uint32_t>(ctx.tasks.size()) - ctx.nextTaskIndex.load(std::memory_order_relaxed),
                   static_cast<uint32_t>(ctx.tasks.size()));
    ctx.queueCv.notify_all();
}

static bool DrainAstQueueWithCallback(ParallelAstRunContext &ctx, const CallbackContext &cb)
{
    bool callbackFailed = false;
    while (ctx.activeWorkers.load(std::memory_order_acquire) != 0 || !ctx.queue.empty()) {
        std::unique_lock<std::mutex> lock(ctx.queueMutex);
        uint32_t qBeforeDrainWait = static_cast<uint32_t>(ctx.queue.size());
        uint32_t activeBefore = ctx.activeWorkers.load(std::memory_order_acquire);
        LogAstMemStats("drain-about-to-wait", qBeforeDrainWait, activeBefore, qBeforeDrainWait,
                       static_cast<uint32_t>(ctx.tasks.size()));
        ctx.queueCv.wait(lock, [&]() {
            return !ctx.queue.empty() || ctx.activeWorkers.load(std::memory_order_acquire) == 0;
        });
        LogAstMemStats("drain-woke-from-wait", static_cast<uint32_t>(ctx.queue.size()),
                       ctx.activeWorkers.load(std::memory_order_acquire), static_cast<uint32_t>(ctx.queue.size()),
                       static_cast<uint32_t>(ctx.tasks.size()));
        while (!ctx.queue.empty()) {
            FileAstItem rec = std::move(ctx.queue.front());
            ctx.queue.pop_front();
            uint32_t qNow = static_cast<uint32_t>(ctx.queue.size());
            lock.unlock();
            LogAstMemStats("drain-popped", qNow, ctx.activeWorkers.load(std::memory_order_relaxed),
                           rec.fileIndex + 1, static_cast<uint32_t>(ctx.tasks.size()));
            const bool keepGoing =
                cb.callback(cb.userData, rec.fileIndex, rec.taskRc, rec.payload.data(),
                            rec.payload.size());
            if (!keepGoing) {
                ctx.stopRequested.store(true);
                LogAstMemStats("stop-requested-by-cb", qNow, ctx.activeWorkers.load(std::memory_order_relaxed),
                               rec.fileIndex + 1, static_cast<uint32_t>(ctx.tasks.size()));
                callbackFailed = true;
            }
            LogAstMemStats("drain-after-cb", qNow, ctx.activeWorkers.load(std::memory_order_relaxed),
                           rec.fileIndex + 1, static_cast<uint32_t>(ctx.tasks.size()));
            lock.lock();
            // 关键修复：drain 消费后必须唤醒可能在等“队列有空间”的 worker
            ctx.queueCv.notify_one();
        }
    }
    return callbackFailed;
}

static int RunTasksWithCallback(const std::vector<FileTask> &tasks,
                                const std::vector<std::string> &includeDirs,
                                uint32_t maxParallelProcesses, uint32_t maxPendingAstResults,
                                const CallbackContext &cb)
{
    if (cb.callback == nullptr) {
        LogManifestError("callback is null");
        return EXIT_FAIL;
    }
    if (tasks.empty()) {
        return EXIT_OK;
    }

    const uint32_t workerCount =
        std::min(maxParallelProcesses, static_cast<uint32_t>(tasks.size()));
    const uint32_t effectiveWorkers = std::max(1u, workerCount);
    const uint32_t maxQueueSize =
        maxPendingAstResults > 0 ? maxPendingAstResults : std::max(1u, effectiveWorkers * 2u);

    LogAstMemStats("batch-start", 0, effectiveWorkers, 0, static_cast<uint32_t>(tasks.size()));
    ParallelAstRunContext runCtx(tasks, includeDirs, maxQueueSize, effectiveWorkers);
    std::vector<std::thread> workers;
    workers.reserve(effectiveWorkers);
    for (uint32_t w = 0; w < effectiveWorkers; ++w) {
        workers.emplace_back([&runCtx]() { RunAstWorkerBody(runCtx); });
    }

    const bool callbackFailed = DrainAstQueueWithCallback(runCtx, cb);

    for (auto &t : workers) {
        if (t.joinable()) {
            t.join();
        }
    }
    return callbackFailed ? EXIT_FAIL : EXIT_OK;
}

static int RunWorklistWithManifest(const llvm::json::Object &root, AstManifestCallback callback,
                                   void *callbackUserData)
{
    WorklistConfig worklist;
    if (!ReadWorklistConfig(root, worklist)) {
        return EXIT_FAIL;
    }
    std::vector<FileTask> tasks;
    if (!BuildFileTasks(worklist, tasks)) {
        return EXIT_FAIL;
    }
    CallbackContext cbCtx{callback, callbackUserData};
    return RunTasksWithCallback(tasks, worklist.includeDirs, worklist.maxParallelProcesses,
                                worklist.maxPendingAstResults, cbCtx);
}

static std::optional<llvm::json::Object> ParseManifest(llvm::StringRef manifest)
{
    if (manifest.empty()) {
        LogManifestError("empty manifest");
        return std::nullopt;
    }
    llvm::Expected<llvm::json::Value> parsed = llvm::json::parse(manifest);
    if (!parsed) {
        llvm::consumeError(parsed.takeError());
        LogManifestError("manifest JSON parse error");
        return std::nullopt;
    }
    llvm::json::Object *obj = parsed->getAsObject();
    if (!obj) {
        LogManifestError("manifest must be a JSON object");
        return std::nullopt;
    }
    return std::move(*obj);
}

extern "C" int ParseCppAstWithManifest(const char *manifest, size_t manifestLength,
                                       AstManifestCallback callback, void *callbackUserData)
{
    const llvm::StringRef slice(manifest == nullptr ? "" : manifest,
                                manifest == nullptr ? 0 : manifestLength);
    std::optional<llvm::json::Object> obj = ParseManifest(slice);
    if (!obj) {
        return EXIT_FAIL;
    }
    return RunWorklistWithManifest(*obj, callback, callbackUserData);
}

int RunAstJsonDump(int argc, const char **argv)
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

#ifndef AST_JSON_NO_MAIN
int main(int argc, const char **argv)
{
    return RunAstJsonDump(argc, argv);
}
#endif
