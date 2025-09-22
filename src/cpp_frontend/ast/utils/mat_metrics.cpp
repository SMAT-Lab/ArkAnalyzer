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

#include "mat_metrics.h"

namespace mat {

// Global statistics and expansion budget
MatStats g_matStats;
ExpansionBudget g_expBudget;

// Storage for fallback samples (protected by mutex)
std::mutex g_fbMu;
std::vector<FallbackSample> g_fallbackSamples;

// Convert CXCursorKind to string
std::string KindStr(CXCursorKind k)
{
    CXString s = clang_getCursorKindSpelling(k);
    std::string out = clang_getCString(s) ? clang_getCString(s) : "";
    clang_disposeString(s);
    return out;
}

// Convert CXFile to string (file path)
std::string FileStr(CXFile f)
{
    if (!f) {
        return {};
    }
    CXString s = clang_getFileName(f);
    std::string out = clang_getCString(s) ? clang_getCString(s) : "";
    clang_disposeString(s);
    return out;
}

// Record a cursor that was filtered by default fallback.
// Stores at most K_MAX_FALLBACK_SAMPLES for inspection.
void RecordDefaultFallback(CXCursor cursor,
                           CXCursorKind kind,
                           const std::string& spellingFileName)
{
    g_matStats.hitsDefaultDeny.fetch_add(1, std::memory_order_relaxed);

    std::lock_guard<std::mutex> lk(g_fbMu);
    if (g_fallbackSamples.size() >= K_MAX_FALLBACK_SAMPLES) {
        return;
    }
    // Expansion location (useful in macro expansion scenarios)
    CXSourceLocation loc = clang_getCursorLocation(cursor);
    CXFile expFile = nullptr;
    unsigned el = 0;
    unsigned ec = 0;
    unsigned eo = 0;
    clang_getExpansionLocation(loc, &expFile, &el, &ec, &eo);

    FallbackSample s;
    s.kind = KindStr(kind);
    s.spellingFile  = spellingFileName;
    s.expansionFile = FileStr(expFile);
    s.line = el;
    s.col  = ec;

    CXString n = clang_getCursorSpelling(cursor);
    s.name = clang_getCString(n) ? clang_getCString(n) : "";
    clang_disposeString(n);

    g_fallbackSamples.push_back(std::move(s));
}

// Dump collected materialization metrics and fallback samples.
void DumpMaterializeMetrics(std::ostream& os)
{
    os << "[Materialize Metrics]\n";
    os << "  SystemHeader filtered:  "        << g_matStats.hitsSysHeader.load()       << "\n";
    os << "  NotMainView filtered:   "        << g_matStats.hitsNotMainView.load()     << "\n";
    os << "  Default filtered:       "        << g_matStats.hitsDefaultDeny.load()     << "\n";
    os << "  SysHeaderByPath filtered: "      << g_matStats.hitsSysHeaderByPath.load() << "\n";
    os << "  Expansion passed:       "        << g_matStats.hitsExpansion.load()       << "\n";
    os << "  UserHeaderContent passed: "      << g_matStats.hitsUserHeaderContent.load()<< "\n";
    os << "  MainFile passed:        "        << g_matStats.hitsMainFilePass.load()    << "\n";
    os << "  UserWhitelist passed:   "        << g_matStats.hitsUserWhitelist.load()   << "\n";

    if (!g_fallbackSamples.empty()) {
        os << "  Default-deny samples (up to " << K_MAX_FALLBACK_SAMPLES << "):\n";
        for (const auto& s : g_fallbackSamples) {
            os << "    - kind="   << s.kind
               << " name=\""      << s.name << "\""
               << " spell=\""     << s.spellingFile << "\""
               << " expand=\""    << s.expansionFile << "\""
               << " @"            << s.line << ":" << s.col
               << "\n";
        }
    }
}

// Configure hard cap for expansion budget
void SetExpansionHardCap(uint32_t cap)
{
    g_expBudget.hardCap = cap;
}

// Reset all metrics and clear fallback samples
void ResetMetrics()
{
    g_matStats.hitsSysHeader.store(0, std::memory_order_relaxed);
    g_matStats.hitsNotMainView.store(0, std::memory_order_relaxed);
    g_matStats.hitsMainFilePass.store(0, std::memory_order_relaxed);
    g_matStats.hitsUserWhitelist.store(0, std::memory_order_relaxed);
    g_matStats.hitsDefaultDeny.store(0, std::memory_order_relaxed);
    g_matStats.hitsSysHeaderByPath.store(0, std::memory_order_relaxed);
    g_matStats.hitsExpansion.store(0, std::memory_order_relaxed);
    g_matStats.hitsUserHeaderContent.store(0, std::memory_order_relaxed);

    g_expBudget.passCount.store(0, std::memory_order_relaxed);

    std::lock_guard<std::mutex> lk(g_fbMu);
    g_fallbackSamples.clear();
}

} // namespace mat
