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

#include <llvm/Support/JSON.h>

#include <cstdint>
#include <string>
#include <vector>

namespace ast_dumper {

struct FileTask {
    uint32_t fileIndex = 0;
    std::string sourceFile;
    std::string ccForFile;
};

struct WorklistConfig {
    const llvm::json::Array *filesArr = nullptr;
    std::string defaultCcJson;
    const llvm::json::Array *ccJsonArr = nullptr;
    std::vector<std::string> includeDirs;
    uint32_t maxParallelProcesses = 1;
    uint32_t maxPendingAstResults = 0;
    std::string flatOutputDir;
};

bool ReadWorklistConfig(const llvm::json::Object &root, WorklistConfig &cfg);

bool BuildFileTasks(const WorklistConfig &cfg, std::vector<FileTask> &tasks);

} // namespace ast_dumper
