#include "mat_metrics.h"

namespace mat {

MatStats g_matStats;
ExpansionBudget g_expBudget;

std::mutex g_fbMu;
std::vector<FallbackSample> g_fallbackSamples;

std::string KindStr(CXCursorKind k) {
    CXString s = clang_getCursorKindSpelling(k);
    std::string out = clang_getCString(s) ? clang_getCString(s) : "";
    clang_disposeString(s);
    return out;
}

std::string FileStr(CXFile f) {
    if (!f) return {};
    CXString s = clang_getFileName(f);
    std::string out = clang_getCString(s) ? clang_getCString(s) : "";
    clang_disposeString(s);
    return out;
}

void RecordDefaultFallback(CXCursor cursor,
                           CXCursorKind kind,
                           const std::string& spellingFileName)
{
    g_matStats.hits_defaultDeny.fetch_add(1, std::memory_order_relaxed);

    std::lock_guard<std::mutex> lk(g_fbMu);
    if (g_fallbackSamples.size() >= kMaxFallbackSamples) return;

    // 展开位置（宏展开场景下很有用）
    CXSourceLocation loc = clang_getCursorLocation(cursor);
    CXFile expFile = nullptr; unsigned el = 0, ec = 0, eo = 0;
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

void DumpMaterializeMetrics(std::ostream& os)
{
    os << "[Materialize Metrics]\n";
    os << "  SystemHeader filtered:  " << g_matStats.hits_sysHeader.load()       << "\n";
    os << "  NotMainView filtered:   " << g_matStats.hits_notMainView.load()     << "\n";
    os << "  MainFile passed:        " << g_matStats.hits_mainFilePass.load()    << "\n";
    os << "  UserWhitelist passed:   " << g_matStats.hits_userWhitelist.load()   << "\n";
    os << "  Default denied:         " << g_matStats.hits_defaultDeny.load()     << "\n";
    os << "  hits_sysHeaderByPath:   " << g_matStats.hits_sysHeaderByPath.load() << "\n";
    os << "  hits_expansion:         " << g_matStats.hits_expansion.load()       << "\n";

    if (!g_fallbackSamples.empty()) {
        os << "  Default-deny samples (up to " << kMaxFallbackSamples << "):\n";
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

void SetExpansionHardCap(uint32_t cap) {
    g_expBudget.hard_cap = cap;
}

void ResetMetrics() {
    g_matStats.hits_sysHeader.store(0, std::memory_order_relaxed);
    g_matStats.hits_notMainView.store(0, std::memory_order_relaxed);
    g_matStats.hits_mainFilePass.store(0, std::memory_order_relaxed);
    g_matStats.hits_userWhitelist.store(0, std::memory_order_relaxed);
    g_matStats.hits_defaultDeny.store(0, std::memory_order_relaxed);
    g_matStats.hits_sysHeaderByPath.store(0, std::memory_order_relaxed);
    g_matStats.hits_expansion.store(0, std::memory_order_relaxed);

    g_expBudget.pass_count.store(0, std::memory_order_relaxed);

    std::lock_guard<std::mutex> lk(g_fbMu);
    g_fallbackSamples.clear();
}

} // namespace mat
