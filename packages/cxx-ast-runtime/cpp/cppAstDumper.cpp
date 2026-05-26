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
#include "clang/Frontend/CompilerInstance.h"
#include "clang/Frontend/FrontendActions.h"
#include "clang/Tooling/ArgumentsAdjusters.h"
#include "clang/Tooling/CommonOptionsParser.h"
#include "clang/Tooling/CompilationDatabase.h"
#include "clang/Tooling/JSONCompilationDatabase.h"
#include "clang/Tooling/Tooling.h"
#include "llvm/Support/FileSystem.h"
#include "llvm/Support/JSON.h"
#include "llvm/Support/Path.h"
#include "llvm/Support/Process.h"
#include "llvm/Support/raw_ostream.h"
#include "utils/source_utils.h"
#include "utils/cli_options.h"
#include "utils/output_path.h"
#include "utils/compile_db_utils.h"
#include "utils/flat_output_path.h"
#include "utils/header_units.h"
#include "utils/manifest_worklist.h"
#include "serialization/astFlatStreamer.h"
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

static void LogCxxAstFail(llvm::StringRef sourceFile, llvm::StringRef reason)
{
    llvm::errs() << "[CxxAst] FAIL " << sourceFile << " " << reason << "\n";
}

class AstFlatConsumer : public ASTConsumer {
public:
    AstFlatConsumer(llvm::StringRef sourceFile, llvm::StringRef flatOutputDir, std::string *outFlatPath,
                    std::shared_ptr<ast_dumper::HeaderUnitsStore> huStore)
        : sourceFile(sourceFile), flatOutputDir(flatOutputDir), outFlatPath(outFlatPath),
          huStore(std::move(huStore))
    {
    }

    void HandleTranslationUnit(ASTContext &ctx) override
    {
        ark_cxx_ast_flat::CxxAstFlatStreamer streamer(ctx, huStore);
        streamer.EmitTranslationUnit();
        std::string flatPath = ast_dumper::ComputeFlatOutPath(sourceFile, flatOutputDir);
        std::vector<uint8_t> bytes = streamer.Finish(sourceFile.str(), flatPath);
        if (bytes.empty()) {
            LogCxxAstFail(sourceFile, "empty_serialized_payload");
            if (outFlatPath != nullptr) {
                outFlatPath->clear();
            }
            return;
        }
        if (!ark_cxx_ast_flat::WriteFlatPayloadToFile(bytes, flatPath)) {
            LogCxxAstFail(sourceFile, "write_flat_file_failed");
            if (outFlatPath != nullptr) {
                outFlatPath->clear();
            }
            return;
        }
        if (outFlatPath != nullptr) {
            *outFlatPath = std::move(flatPath);
        }
    }

private:
    llvm::StringRef sourceFile;
    llvm::StringRef flatOutputDir;
    std::string *outFlatPath;
    std::shared_ptr<ast_dumper::HeaderUnitsStore> huStore;
};

class FlatCaptureFrontendAction : public ASTFrontendAction {
public:
    FlatCaptureFrontendAction(llvm::StringRef sourceFile, llvm::StringRef flatOutputDir,
                              std::string *outFlatPath)
        : sourceFile(sourceFile), flatOutputDir(flatOutputDir), outFlatPath(outFlatPath),
          huStore(std::make_shared<ast_dumper::HeaderUnitsStore>())
    {
    }

    bool BeginSourceFileAction(CompilerInstance &CI) override
    {
        Preprocessor &PP = CI.getPreprocessor();
        SourceManager &SM = CI.getSourceManager();
        PP.addPPCallbacks(std::make_unique<ast_dumper::HeaderFileCollector>(SM, PP, huStore));
        return true;
    }

    std::unique_ptr<ASTConsumer> CreateASTConsumer(CompilerInstance &, llvm::StringRef) override
    {
        return std::make_unique<AstFlatConsumer>(sourceFile, flatOutputDir, outFlatPath, huStore);
    }

private:
    llvm::StringRef sourceFile;
    llvm::StringRef flatOutputDir;
    std::string *outFlatPath;
    std::shared_ptr<ast_dumper::HeaderUnitsStore> huStore;
};

class CaptureFlatActionFactory : public FrontendActionFactory {
public:
    CaptureFlatActionFactory(llvm::StringRef sourceFile, llvm::StringRef flatOutputDir,
                             std::string *outFlatPath)
        : sourceFile(sourceFile), flatOutputDir(flatOutputDir), outFlatPath(outFlatPath)
    {
    }

    std::unique_ptr<FrontendAction> create() override
    {
        return std::make_unique<FlatCaptureFrontendAction>(sourceFile, flatOutputDir, outFlatPath);
    }

private:
    llvm::StringRef sourceFile;
    llvm::StringRef flatOutputDir;
    std::string *outFlatPath;
};

static std::string ResolveCliFlatOutputDir(llvm::StringRef inFile)
{
    const std::string outOpt = ast_dumper::cli::OutputFilename().getValue();
    if (!outOpt.empty() && ast_dumper::LooksLikeDirectoryPath(outOpt)) {
        return outOpt;
    }
    if (!outOpt.empty()) {
        llvm::SmallString<ast_dumper::PATH_PARENT_BUFFER_SIZE> parent(llvm::sys::path::parent_path(outOpt));
        if (!parent.empty()) {
            return parent.str().str();
        }
    }
    llvm::SmallString<ast_dumper::PATH_PARENT_BUFFER_SIZE> parent(llvm::sys::path::parent_path(inFile));
    return parent.str().str();
}

class FlatCLIFrontendAction : public ASTFrontendAction {
public:
    FlatCLIFrontendAction() : huStore(std::make_shared<ast_dumper::HeaderUnitsStore>()) {}

    bool BeginSourceFileAction(CompilerInstance &CI) override
    {
        Preprocessor &PP = CI.getPreprocessor();
        SourceManager &SM = CI.getSourceManager();
        PP.addPPCallbacks(std::make_unique<ast_dumper::HeaderFileCollector>(SM, PP, huStore));
        return true;
    }

    std::unique_ptr<ASTConsumer> CreateASTConsumer(CompilerInstance &, llvm::StringRef inFile) override
    {
        std::string flatDir = ResolveCliFlatOutputDir(inFile);
        llvm::outs() << "[ASTDumper] Input: " << inFile << "\n";
        llvm::outs() << "[ASTDumper] Flat output dir: " << flatDir << "\n";
        if (std::error_code ec = llvm::sys::fs::create_directories(flatDir, true)) {
            llvm::outs() << "Cannot create flat output dir " << flatDir << ": " << ec.message() << "\n";
            return nullptr;
        }
        return std::make_unique<AstFlatConsumer>(inFile, flatDir, nullptr, huStore);
    }

private:
    std::shared_ptr<ast_dumper::HeaderUnitsStore> huStore;
};

// =============================================================================
// Manifest batch (ParseCppAstWithManifest) — used by astJsonDumper.node
// =============================================================================
static constexpr int EXIT_OK = 0;
static constexpr int EXIT_FAIL = 1;

using AstManifestCallback = bool (*)(void *userData, uint32_t fileIndex, uint32_t taskRc,
                                     const char *flatPathData, size_t flatPathSize);

using FileTask = ast_dumper::FileTask;
using WorklistConfig = ast_dumper::WorklistConfig;

struct FileAstItem {
    uint32_t fileIndex = 0;
    uint32_t taskRc = 0;
    std::string flatPath;
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

static int RunClangToolFlat(ClangTool &tool, llvm::StringRef sourceFile, llvm::StringRef flatOutputDir,
                            std::string *capturedFlatPath)
{
    std::string flatPath;
    CaptureFlatActionFactory factory(sourceFile, flatOutputDir, &flatPath);
    long rssBeforeRun = GetCurrentRssKb();
    int rc = tool.run(&factory);
    long rssAfterRun = GetCurrentRssKb();
    LogParseStep("after-flat-tool-run", sourceFile, rssBeforeRun, rssAfterRun);

    if (rc != 0) {
        LogCxxAstFail(sourceFile, "clang_parse_failed");
    } else if (flatPath.empty()) {
        LogCxxAstFail(sourceFile, "serialize_or_write_failed");
    }
    if (capturedFlatPath != nullptr) {
        *capturedFlatPath = std::move(flatPath);
    }
    return rc;
}

static int ParseSingleFileFlat(llvm::StringRef sourceFile, llvm::StringRef ccForFile,
                               const std::vector<std::string> &includeDirs, llvm::StringRef flatOutputDir,
                               std::string *capturedFlatPath)
{
    if (flatOutputDir.empty()) {
        LogManifestError("outputDir is required");
        return EXIT_FAIL;
    }
    {
        if (std::error_code ec = llvm::sys::fs::create_directories(flatOutputDir, true)) {
            LogManifestError("cannot create outputDir");
            return EXIT_FAIL;
        }
    }

    long rss0 = GetCurrentRssKb();
    LogParseStep("flat-entry", sourceFile, rss0, rss0);

    bool useCompileCommandsJson = false;
    std::unique_ptr<CompilationDatabase> db =
        LoadCompilationDatabase(sourceFile, ccForFile, includeDirs, useCompileCommandsJson, sourceFile);

    std::vector<std::string> sources;
    sources.emplace_back(sourceFile.str());
    ClangTool tool(*db, sources);
    if (useCompileCommandsJson) {
        ast_dumper::prependHostLinuxFallbackToClangTool(tool, includeDirs);
    }
    ast_dumper::insertArgumentAdjuster(tool, sourceFile);
    if (useCompileCommandsJson) {
        ast_dumper::prependResourceDirAndManifestIncludes(tool, includeDirs);
    }

    int rc = RunClangToolFlat(tool, sourceFile, flatOutputDir, capturedFlatPath);
    long rssFinal = GetCurrentRssKb();
    LogParseStep("flat-exit", sourceFile, rssFinal, rssFinal);
    return rc;
}

static FileAstItem ParseWorkerFileTask(const FileTask &task, const WorklistConfig &cfg,
                                       const std::vector<std::string> &includeDirs)
{
    std::string flatPath;
    long rssBeforeParse = GetCurrentRssKb();
    int rc = ParseSingleFileFlat(task.sourceFile, task.ccForFile, includeDirs, cfg.flatOutputDir, &flatPath);
    long rssAfterParse = GetCurrentRssKb();
    LogParseStep("worker-after-parse", task.sourceFile, rssBeforeParse, rssAfterParse);
    return FileAstItem{task.fileIndex, static_cast<uint32_t>(rc), std::move(flatPath)};
}

static bool WaitForQueueSpaceAndPush(ParallelAstRunContext &ctx, FileAstItem item, uint32_t workerTaskIndex)
{
    std::unique_lock<std::mutex> lock(ctx.queueMutex);
    uint32_t qBeforeWait = static_cast<uint32_t>(ctx.queue.size());
    uint32_t activeBefore = ctx.activeWorkers.load(std::memory_order_relaxed);
    LogAstMemStats("worker-about-to-wait-full", qBeforeWait, activeBefore, workerTaskIndex + 1,
                   static_cast<uint32_t>(ctx.tasks.size()));
    ctx.queueCv.wait(lock, [&]() {
        return ctx.stopRequested.load() || ctx.queue.size() < ctx.maxPendingInQueue;
    });
    LogAstMemStats("worker-woke-from-wait", static_cast<uint32_t>(ctx.queue.size()),
                   ctx.activeWorkers.load(std::memory_order_relaxed), workerTaskIndex + 1,
                   static_cast<uint32_t>(ctx.tasks.size()));
    if (ctx.stopRequested.load()) {
        return false;
    }
    ctx.queue.push_back(std::move(item));
    LogAstMemStats("worker-pushed", static_cast<uint32_t>(ctx.queue.size()),
                   ctx.activeWorkers.load(std::memory_order_relaxed), workerTaskIndex + 1,
                   static_cast<uint32_t>(ctx.tasks.size()));
    return true;
}

static void RunAstWorkerBody(ParallelAstRunContext &ctx, const WorklistConfig &cfg)
{
    while (!ctx.stopRequested.load()) {
        uint32_t i = ctx.nextTaskIndex.fetch_add(1, std::memory_order_relaxed);
        if (i >= ctx.tasks.size()) {
            break;
        }
        FileAstItem item = ParseWorkerFileTask(ctx.tasks[i], cfg, ctx.includeDirs);
        if (!WaitForQueueSpaceAndPush(ctx, std::move(item), i)) {
            break;
        }
        ctx.queueCv.notify_one();
    }
    uint32_t remaining = ctx.activeWorkers.fetch_sub(1, std::memory_order_acq_rel) - 1;
    LogAstMemStats("worker-exit", static_cast<uint32_t>(ctx.queue.size()), remaining,
                   static_cast<uint32_t>(ctx.tasks.size()) - ctx.nextTaskIndex.load(std::memory_order_relaxed),
                   static_cast<uint32_t>(ctx.tasks.size()));
    ctx.queueCv.notify_all();
}

static bool DispatchQueuedAstItem(uint32_t qNow, ParallelAstRunContext &ctx, FileAstItem rec,
                                  const CallbackContext &cb)
{
    LogAstMemStats("drain-popped", qNow, ctx.activeWorkers.load(std::memory_order_relaxed), rec.fileIndex + 1,
                   static_cast<uint32_t>(ctx.tasks.size()));
    const bool keepGoing =
        cb.callback(cb.userData, rec.fileIndex, rec.taskRc, rec.flatPath.data(), rec.flatPath.size());
    if (!keepGoing) {
        ctx.stopRequested.store(true);
        LogAstMemStats("stop-requested-by-cb", qNow, ctx.activeWorkers.load(std::memory_order_relaxed),
                       rec.fileIndex + 1, static_cast<uint32_t>(ctx.tasks.size()));
    }
    LogAstMemStats("drain-after-cb", qNow, ctx.activeWorkers.load(std::memory_order_relaxed), rec.fileIndex + 1,
                   static_cast<uint32_t>(ctx.tasks.size()));
    return keepGoing;
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
            const uint32_t qNow = static_cast<uint32_t>(ctx.queue.size());
            lock.unlock();
            if (!DispatchQueuedAstItem(qNow, ctx, std::move(rec), cb)) {
                callbackFailed = true;
            }
            lock.lock();
            ctx.queueCv.notify_one();
        }
    }
    return callbackFailed;
}

struct AstParallelRunParams {
    const std::vector<FileTask> &tasks;
    const WorklistConfig &worklist;
    const CallbackContext &callback;
};

static uint32_t ComputeEffectiveWorkerCount(uint32_t maxParallelProcesses, size_t taskCount)
{
    const uint32_t workerCount =
        std::min(maxParallelProcesses, static_cast<uint32_t>(taskCount));
    return std::max(1u, workerCount);
}

static uint32_t ComputeMaxQueueSize(uint32_t maxPendingAstResults, uint32_t effectiveWorkers)
{
    return maxPendingAstResults > 0 ? maxPendingAstResults : std::max(1u, effectiveWorkers * 2u);
}

static int RunTasksWithCallback(const AstParallelRunParams &params)
{
    if (params.callback.callback == nullptr) {
        LogManifestError("callback is null");
        return EXIT_FAIL;
    }
    if (params.tasks.empty()) {
        return EXIT_OK;
    }

    const uint32_t effectiveWorkers =
        ComputeEffectiveWorkerCount(params.worklist.maxParallelProcesses, params.tasks.size());
    const uint32_t maxQueueSize =
        ComputeMaxQueueSize(params.worklist.maxPendingAstResults, effectiveWorkers);

    LogAstMemStats("batch-start", 0, effectiveWorkers, 0, static_cast<uint32_t>(params.tasks.size()));
    ParallelAstRunContext runCtx(params.tasks, params.worklist.includeDirs, maxQueueSize, effectiveWorkers);
    std::vector<std::thread> workers;
    workers.reserve(effectiveWorkers);
    for (uint32_t w = 0; w < effectiveWorkers; ++w) {
        workers.emplace_back([&runCtx, &params]() { RunAstWorkerBody(runCtx, params.worklist); });
    }

    const bool callbackFailed = DrainAstQueueWithCallback(runCtx, params.callback);

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
    if (!ast_dumper::ReadWorklistConfig(root, worklist)) {
        return EXIT_FAIL;
    }
    std::vector<FileTask> tasks;
    if (!ast_dumper::BuildFileTasks(worklist, tasks)) {
        return EXIT_FAIL;
    }
    CallbackContext cbCtx{callback, callbackUserData};
    AstParallelRunParams runParams{tasks, worklist, cbCtx};
    return RunTasksWithCallback(runParams);
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

    int result = Tool.run(newFrontendActionFactory<FlatCLIFrontendAction>().get());

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
