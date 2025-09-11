#pragma once

#include <chrono>
#include <cstdint>
#include <unordered_map>
#include <vector>
#include <mutex>
#include <string>
#include <cstring>
#include <iostream>
#include <iomanip>
#include <algorithm>
#include <cmath>
#include <thread>
#include <sstream>
#include <utility>

namespace arkprof {

struct Stat {
    uint64_t inclusive_ns = 0;  // Total time (including child phases)
    uint64_t exclusive_ns = 0;  // Exclusive time (excluding child phases)
    uint64_t count        = 0;  // Call count
};

// Note: In MSVC, `thread_local` must be placed at namespace scope to avoid C2481
struct ScopeTimer;
extern thread_local std::vector<ScopeTimer*> g_stack;

class ProfStore {
public:
    static ProfStore& Instance() {
        static ProfStore inst;
        return inst;
    }

    void add(const char* name, uint64_t inclusive_ns, uint64_t exclusive_ns) {
        std::lock_guard<std::mutex> lk(mu_);
        auto& st = stats_[name];
        st.inclusive_ns += inclusive_ns;
        st.exclusive_ns += exclusive_ns;
        st.count        += 1;
    }

    std::vector<std::pair<std::string, Stat>>
collectSorted(bool sort_by_inclusive = true) {
    std::vector<std::pair<std::string, Stat>> rows;
    {
        std::lock_guard<std::mutex> lk(mu_);
        rows.reserve(stats_.size());
        for (const auto& kv : stats_) rows.emplace_back(kv.first, kv.second);
    }
    std::sort(rows.begin(), rows.end(),
              [&](const auto& a, const auto& b) {
                  return sort_by_inclusive
                         ? (a.second.inclusive_ns > b.second.inclusive_ns)
                         : (a.second.exclusive_ns > b.second.exclusive_ns);
              });
    return rows;
}

    void reset() {
        std::lock_guard<std::mutex> lk(mu_);
        stats_.clear();
    }

    void printJSON(std::ostream& os) {
        // Copy out for sorting
        std::vector<std::pair<std::string, Stat>> arr;
        {
            std::lock_guard<std::mutex> lk(mu_);
            arr.reserve(stats_.size());
            for (auto& kv : stats_) arr.emplace_back(kv.first, kv.second);
        }
        std::sort(arr.begin(), arr.end(),
                  [](auto& a, auto& b) { return a.second.inclusive_ns > b.second.inclusive_ns; });

        os << "{\n  \"phases\": [\n";
        for (size_t i = 0; i < arr.size(); ++i) {
            const auto& name = arr[i].first;
            const auto& st   = arr[i].second;
            double incl_ms = st.inclusive_ns / 1e6;
            double excl_ms = st.exclusive_ns / 1e6;
            double avg_ms  = st.count ? incl_ms / (double)st.count : 0.0;
            os << "    {"
               << "\"name\":\"" << escapeJSON(name) << "\","
               << "\"count\":" << st.count << ","
               << "\"inclusive_ms\":" << toFixed(incl_ms) << ","
               << "\"exclusive_ms\":" << toFixed(excl_ms) << ","
               << "\"avg_ms\":" << toFixed(avg_ms)
               << "}";
            if (i + 1 < arr.size()) os << ",";
            os << "\n";
        }
        os << "  ]\n}\n";
    }
    void printText(std::ostream& os, size_t max_rows = 0) {
    // Copy and sort
    std::vector<std::pair<std::string, Stat>> arr;
    {
        std::lock_guard<std::mutex> lk(mu_);
        arr.reserve(stats_.size());
        for (auto& kv : stats_) arr.emplace_back(kv.first, kv.second);
    }
    std::sort(arr.begin(), arr.end(),
              [](auto& a, auto& b) { return a.second.inclusive_ns > b.second.inclusive_ns; });

    // Select total time
    uint64_t total_ns = 0;
    for (auto& kv : arr) if (kv.first == "Total.Program") { total_ns = kv.second.inclusive_ns; break; }
    if (total_ns == 0) for (auto& kv : arr) total_ns = std::max(total_ns, kv.second.inclusive_ns);

    auto toFixed = [](double v, int n = 3) {
        std::ostringstream oss;
        oss.setf(std::ios::fixed);
        oss << std::setprecision(n) << v;
        return oss.str();
    };

    // Column width
    size_t w_name = 10;
    for (auto& kv : arr) w_name = std::max(w_name, kv.first.size());
    w_name = (std::min)(w_name, (size_t)60); // Avoid conflict with macro min by adding parentheses

    const int w_cnt = 7, w_ms = 12, w_pct = 7;
    auto hr = [&](){
        os << std::string((int)w_name + w_cnt + w_ms*3 + w_pct + 15, '-') << "\n";
    };

    // Table header
    hr(); // ★ Do not write as os << hr();
    os << std::left  << std::setw((int)w_name) << "Phase"
       << "  " << std::right << std::setw(w_cnt) << "Count"
       << "  " << std::setw(w_ms) << "Incl(ms)"
       << "  " << std::setw(w_ms) << "Excl(ms)"
       << "  " << std::setw(w_ms) << "Avg(ms)"
       << "  " << std::setw(w_pct) << "%"
       << "\n";
    hr();

    size_t printed = 0;
    for (auto& kv : arr) {
        if (max_rows && printed >= max_rows) break;
        const auto& name = kv.first;
        const auto& st   = kv.second;
        const double incl_ms = st.inclusive_ns / 1e6;
        const double excl_ms = st.exclusive_ns / 1e6;
        const double avg_ms  = st.count ? incl_ms / (double)st.count : 0.0;
        const double pct     = (total_ns > 0) ? (100.0 * (double)st.inclusive_ns / (double)total_ns) : 0.0;

        os << std::left  << std::setw((int)w_name) << name
           << "  " << std::right << std::setw(w_cnt) << st.count
           << "  " << std::setw(w_ms) << toFixed(incl_ms)
           << "  " << std::setw(w_ms) << toFixed(excl_ms)
           << "  " << std::setw(w_ms) << toFixed(avg_ms)
           << "  " << std::setw(w_pct) << toFixed(pct, 2)
           << "\n";
        ++printed;
    }
    hr();
    if (total_ns) {
        os << "Total ~ " << toFixed(total_ns/1e6) << " ms (from "
           << (std::any_of(arr.begin(), arr.end(), [](auto& p){return p.first=="Total.Program";})
               ? "\"Total.Program\"" : "max inclusive")
           << ")\n";
    }
}


private:
    ProfStore() = default;

    static std::string escapeJSON(const std::string& s) {
        std::string out; out.reserve(s.size() + 8);
        for (char c : s) {
            switch (c) {
                case '\\': out += "\\\\"; break;
                case '\"': out += "\\\""; break;
                case '\n': out += "\\n";  break;
                case '\r': out += "\\r";  break;
                case '\t': out += "\\t";  break;
                default:   out += c;      break;
            }
        }
        return out;
    }
    static std::string toFixed(double v) {
        std::ostringstream oss;
        oss << std::fixed << std::setprecision(3) << v;
        return oss.str();
    }

    std::unordered_map<std::string, Stat> stats_;
    std::mutex mu_;
};

struct ScopeTimer {
    const char* name;
    std::chrono::steady_clock::time_point t0;
    uint64_t child_ns = 0; // Accumulated time spent in child phases
    ScopeTimer* parent = nullptr;

    explicit ScopeTimer(const char* n) noexcept
        : name(n), t0(std::chrono::steady_clock::now()) {
        parent = g_stack.empty() ? nullptr : g_stack.back();
        g_stack.push_back(this);
    }

    ~ScopeTimer() noexcept {
        using namespace std::chrono;
        const auto t1 = steady_clock::now();
        const uint64_t dur_ns = (uint64_t)duration_cast<nanoseconds>(t1 - t0).count();
        const uint64_t excl_ns = (child_ns <= dur_ns) ? (dur_ns - child_ns) : 0ULL;
        ProfStore::Instance().add(name, dur_ns, excl_ns);
        // Add this phase's total duration to the parent's child_ns (for subtraction later)
        if (parent) parent->child_ns += dur_ns;
        // Pop from stack
        if (!g_stack.empty() && g_stack.back() == this) g_stack.pop_back();
    }

    ScopeTimer(const ScopeTimer&) = delete;
    ScopeTimer& operator=(const ScopeTimer&) = delete;
};



inline void PrintReportJSON(std::ostream& os)
{
    ProfStore::Instance().printJSON(os);
}

inline void PrintReportText(std::ostream& os, size_t max_rows = 0)
{
    ProfStore::Instance().printText(os, max_rows);
}

inline void Reset()
{
    ProfStore::Instance().reset();
}

// Place inside arkprof namespace
inline void PrintReportPretty(std::ostream& os, bool unicode = false,
                              size_t max_rows = 0, bool sort_by_inclusive = true)
{
    // Collect and sort
    auto rows = ProfStore::Instance().collectSorted(sort_by_inclusive);
    if (rows.empty()) {
        os << "[PROF] No profiling data. Build with ARK_ENABLE_PROFILING=1 and add ARK_PROFILE_SCOPE.\n";
        return;
    }

    // Total time (prefer "Total.Program"; otherwise take max inclusive)
    uint64_t total_ns = 0;
    for (auto& kv : rows) if (kv.first == "Total.Program") { total_ns = kv.second.inclusive_ns; break; }
    if (total_ns == 0) for (auto& kv : rows) total_ns = std::max(total_ns, kv.second.inclusive_ns);

    auto toFixed = [](double v, int n=3) {
        std::ostringstream oss;
        oss.setf(std::ios::fixed);
        oss << std::setprecision(n) << v;
        return oss.str();
    };

    // Compute column width (consider hierarchical indentation in names)
    auto levelOf = [](const std::string& s) -> size_t {
        return std::count(s.begin(), s.end(), '.'); // Levels separated by '.'
    };
    size_t w_name = 10;
    for (auto& kv : rows) {
        const size_t w = levelOf(kv.first) * 2 + kv.first.size();
        w_name = std::max(w_name, w);
    }
    w_name = (std::min)(w_name, (size_t)60);

    const int  w_cnt = 5;
    const int  w_ms  = 10;
    const int  w_pct = 6;
    const int  w_bar = 24;

    // Box-drawing characters
    struct Box { const char* tl; const char* tr; const char* bl; const char* br;
                 const char* h;  const char* v;  const char* tj; const char* mj; const char* bj; };
    Box bx;
    if (unicode) {
        bx = {"┌","┐","└","┘","─","│","┬","┼","┴"};
    } else {
        bx = {"+","+", "+","+", "-", "|", "+", "+", "+"};
    }
    auto line = [&](int innerWidth) {
        os << bx.tl << std::string(innerWidth, bx.h[0]) << bx.tr << "\n";
    };
    auto midline = [&](int innerWidth) {
        os << bx.tl << std::string(innerWidth, bx.h[0]) << bx.tr << "\n"; // Simplified: single segment line
    };

    // Title
    const std::string title = "Profiling (ms)";
    const int totalWidth = (int)w_name + 2 + w_cnt + 2 + w_ms*3 + 2 + w_pct + 2 + w_bar + 2 + 8;
    line(totalWidth);
    os << bx.v << " " << std::left << std::setw(totalWidth-2) << title << bx.v << "\n";
    midline(totalWidth);

    // Table header
    os << bx.v << " " << std::left << std::setw((int)w_name) << "Phase"
       << "  " << std::right << std::setw(w_cnt) << "Cnt"
       << "  " << std::setw(w_ms) << "Incl"
       << "  " << std::setw(w_ms) << "Excl"
       << "  " << std::setw(w_ms) << "Avg"
       << "  " << std::setw(w_pct) << "%"
       << "  " << std::left  << std::setw(w_bar) << "Bar"
       << " " << bx.v << "\n";
    midline(totalWidth);

    // Rows
    size_t printed = 0;
    for (auto& kv : rows) {
        if (max_rows && printed >= max_rows) break;
        const auto& name = kv.first;
        const auto& st   = kv.second;

        const double incl_ms = st.inclusive_ns / 1e6;
        const double excl_ms = st.exclusive_ns / 1e6;
        const double avg_ms  = st.count ? incl_ms / (double)st.count : 0.0;
        const double pct     = total_ns ? (100.0 * (double)st.inclusive_ns / (double)total_ns) : 0.0;

        // Indentation based on hierarchy
        const size_t lvl = levelOf(name);
        std::string disp = std::string(lvl * 2, ' ') + name;

        // Progress bar
        const int filled = (int)std::round((pct / 100.0) * w_bar);
        const char full = unicode ? '█' : '#';
        const std::string bar(filled > 0 ? filled : 0, full);
        const std::string pad((std::max)(0, w_bar - filled), ' ');

        os << bx.v << " " << std::left  << std::setw((int)w_name) << disp.substr(0, (size_t)w_name)
           << "  " << std::right << std::setw(w_cnt) << st.count
           << "  " << std::setw(w_ms) << toFixed(incl_ms, 3)
           << "  " << std::setw(w_ms) << toFixed(excl_ms, 3)
           << "  " << std::setw(w_ms) << toFixed(avg_ms, 3)
           << "  " << std::setw(w_pct) << toFixed(pct, 2)
           << "  " << std::left  << bar << pad
           << " " << bx.v << "\n";
        ++printed;
    }
    line(totalWidth);

    if (total_ns) {
        os << "Total ~ " << toFixed(total_ns/1e6, 3) << " ms"
           << "   (sorted by " << (sort_by_inclusive ? "inclusive" : "exclusive") << ")\n";
    }
}


} // namespace arkprof


// Definition of thread-local stack
inline thread_local std::vector<arkprof::ScopeTimer*> arkprof::g_stack;

// --- unique name helpers ---
#ifndef ARK_DETAIL_JOIN
#  define ARK_DETAIL_JOIN_IMPL(a,b) a##b
#  define ARK_DETAIL_JOIN(a,b) ARK_DETAIL_JOIN_IMPL(a,b)
#endif

#if defined(__COUNTER__)
#  define ARK_DETAIL_UNIQUE(base) ARK_DETAIL_JOIN(base, __COUNTER__)
#else
#  define ARK_DETAIL_UNIQUE(base) ARK_DETAIL_JOIN(base, __LINE__)
#endif

// --- public macros ---
#define ARK_PROFILE_SCOPE(name_literal) \
    ::arkprof::ScopeTimer ARK_DETAIL_UNIQUE(__ark_scope_timer__){name_literal}

#define ARK_PROFILE_FUNC() ARK_PROFILE_SCOPE(__func__)
