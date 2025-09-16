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


#pragma once

#include <atomic>
#include <mutex>
#include <ostream>
#include <string>
#include <vector>

#include <clang-c/Index.h>

namespace mat {

// Statistics counters for materialization decisions
struct MatStats {
    std::atomic<uint64_t> hits_sysHeader{0};        // Rule 0: pruned due to system header
    std::atomic<uint64_t> hits_notMainView{0};      // Rule 1: pruned because not from main file view
    std::atomic<uint64_t> hits_mainFilePass{0};     // Rule 2: passed (main file always allowed)
    std::atomic<uint64_t> hits_userWhitelist{0};    // Rule 3: passed by user whitelist
    std::atomic<uint64_t> hits_defaultDeny{0};      // Rule 4: default deny
    std::atomic<uint64_t> hits_sysHeaderByPath{0};  // Path-based fallback (e.g., Windows/MSVC headers)
    std::atomic<uint64_t> hits_expansion{0};        // Passed by expansion (lightweight expressions)
    std::atomic<uint64_t> hits_userHeaderContent{0};// Content inside user-whitelisted headers
};

// Store a small sample of denied cursors for diagnostics
struct FallbackSample {
    std::string kind;          // Cursor kind
    std::string spellingFile;  // Spelling file (original location)
    std::string expansionFile; // Expansion file (macro-expanded location)
    unsigned   line = 0;
    unsigned   col  = 0;
    std::string name;          // Readable cursor name
};

// Quota control for "lightweight expressions" expanded from main file
// Prevents performance degradation in macro-heavy code.
struct ExpansionBudget {
    std::atomic<uint32_t> pass_count{0};
    uint32_t hard_cap = 2000; // Can be adjusted dynamically via SetExpansionHardCap
};

// Global objects (simplifies usage)
extern MatStats g_matStats;
extern ExpansionBudget g_expBudget;

// Sample container and limit
inline constexpr size_t kMaxFallbackSamples = 200;
extern std::mutex g_fbMu;
extern std::vector<FallbackSample> g_fallbackSamples;

// Helpers: convert enum values and file handles to string
std::string KindStr(CXCursorKind k);
std::string FileStr(CXFile f);

// Record a sample under the "default deny" branch (includes expansion location)
void RecordDefaultFallback(CXCursor cursor,
                           CXCursorKind kind,
                           const std::string& spellingFileName);

// Print statistics overview and collected samples
void DumpMaterializeMetrics(std::ostream& os);

// Adjust and reset APIs
void SetExpansionHardCap(uint32_t cap);
void ResetMetrics();

} // namespace mat
