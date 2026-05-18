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

#include "utils/manifest_worklist.h"

#include "llvm/Support/JSON.h"
#include "llvm/Support/raw_ostream.h"

#include <algorithm>
#include <climits>
#include <thread>

namespace ast_dumper {
namespace {

constexpr llvm::StringLiteral kJsonFiles = "files";
constexpr llvm::StringLiteral kJsonIncludeDirs = "includeDirs";
constexpr llvm::StringLiteral kJsonDefaultCcJson = "defaultCcJson";
constexpr llvm::StringLiteral kJsonCcJsonPaths = "ccJsonPaths";
constexpr llvm::StringLiteral kJsonMaxParallelProcesses = "maxParallelProcesses";
constexpr llvm::StringLiteral kJsonMaxPendingAstResults = "maxPendingAstResults";
constexpr llvm::StringLiteral kJsonOutputDir = "outputDir";

void LogManifestError(llvm::StringRef msg)
{
    llvm::errs() << "[ASTDumper][manifest] " << msg << "\n";
}

bool ReadWorklistFiles(const llvm::json::Object &root, WorklistConfig &cfg)
{
    const llvm::json::Value *filesVal = root.get(kJsonFiles);
    if (!filesVal) {
        LogManifestError("missing \"files\"");
        return false;
    }
    cfg.filesArr = filesVal->getAsArray();
    if (!cfg.filesArr || cfg.filesArr->empty()) {
        LogManifestError("\"files\" must be a non-empty array");
        return false;
    }
    return true;
}

void ReadWorklistCcJsonPaths(const llvm::json::Object &root, WorklistConfig &cfg)
{
    if (const llvm::json::Value *dv = root.get(kJsonDefaultCcJson)) {
        if (auto s = dv->getAsString()) {
            cfg.defaultCcJson = s->str();
        }
    }
    if (const llvm::json::Value *cv = root.get(kJsonCcJsonPaths)) {
        cfg.ccJsonArr = cv->getAsArray();
    }
}

void ReadWorklistIncludeDirs(const llvm::json::Object &root, WorklistConfig &cfg)
{
    const llvm::json::Value *incVal = root.get(kJsonIncludeDirs);
    const llvm::json::Array *incArr = incVal ? incVal->getAsArray() : nullptr;
    if (!incArr) {
        return;
    }
    for (const llvm::json::Value &iv : *incArr) {
        if (auto idir = iv.getAsString()) {
            cfg.includeDirs.emplace_back(idir->str());
        }
    }
}

void ApplyMaxParallelProcesses(int64_t value, WorklistConfig &cfg)
{
    if (value <= 0) {
        unsigned hc = std::thread::hardware_concurrency();
        cfg.maxParallelProcesses = hc == 0 ? 1u : hc;
        return;
    }
    cfg.maxParallelProcesses = static_cast<uint32_t>(std::min<int64_t>(value, UINT32_MAX));
}

void ReadWorklistMaxParallelProcesses(const llvm::json::Object &root, WorklistConfig &cfg)
{
    const llvm::json::Value *pv = root.get(kJsonMaxParallelProcesses);
    if (!pv) {
        return;
    }
    if (auto p = pv->getAsInteger()) {
        ApplyMaxParallelProcesses(*p, cfg);
    }
}

void ReadWorklistMaxPendingResults(const llvm::json::Object &root, WorklistConfig &cfg)
{
    const llvm::json::Value *qv = root.get(kJsonMaxPendingAstResults);
    if (!qv) {
        return;
    }
    if (auto q = qv->getAsInteger()) {
        cfg.maxPendingAstResults = static_cast<uint32_t>(std::max<int64_t>(0, *q));
    }
}

void ReadWorklistConcurrency(const llvm::json::Object &root, WorklistConfig &cfg)
{
    ReadWorklistMaxParallelProcesses(root, cfg);
    ReadWorklistMaxPendingResults(root, cfg);
}

bool ReadWorklistOutputDir(const llvm::json::Object &root, WorklistConfig &cfg)
{
    if (const llvm::json::Value *dv = root.get(kJsonOutputDir)) {
        if (auto s = dv->getAsString()) {
            cfg.flatOutputDir = s->str();
        }
    }
    if (cfg.flatOutputDir.empty()) {
        LogManifestError("outputDir is required");
        return false;
    }
    return true;
}

std::string ResolveCcJsonForIndex(const WorklistConfig &cfg, uint32_t idx)
{
    std::string ccForFile = cfg.defaultCcJson;
    if (!cfg.ccJsonArr || idx >= cfg.ccJsonArr->size()) {
        return ccForFile;
    }
    if (auto cs = (*cfg.ccJsonArr)[idx].getAsString(); cs && !cs->empty()) {
        ccForFile = cs->str();
    }
    return ccForFile;
}

} // namespace

bool ReadWorklistConfig(const llvm::json::Object &root, WorklistConfig &cfg)
{
    if (!ReadWorklistFiles(root, cfg)) {
        return false;
    }
    ReadWorklistCcJsonPaths(root, cfg);
    ReadWorklistIncludeDirs(root, cfg);
    ReadWorklistConcurrency(root, cfg);
    return ReadWorklistOutputDir(root, cfg);
}

bool BuildFileTasks(const WorklistConfig &cfg, std::vector<FileTask> &tasks)
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
        FileTask task;
        task.fileIndex = idx;
        task.sourceFile = fopt->str();
        task.ccForFile = ResolveCcJsonForIndex(cfg, idx);
        tasks.push_back(std::move(task));
        ++idx;
    }
    return true;
}

} // namespace ast_dumper
