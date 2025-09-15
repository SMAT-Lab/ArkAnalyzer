#pragma once

#include <atomic>
#include <mutex>
#include <ostream>
#include <string>
#include <vector>

#include <clang-c/Index.h>

namespace mat {

// 统计项
struct MatStats {
    std::atomic<uint64_t> hits_sysHeader{0};       // 规则0：系统头剪枝
    std::atomic<uint64_t> hits_notMainView{0};     // 规则1：非主文件视角剪枝
    std::atomic<uint64_t> hits_mainFilePass{0};    // 规则2：主文件直通
    std::atomic<uint64_t> hits_userWhitelist{0};   // 规则3：白名单放行
    std::atomic<uint64_t> hits_defaultDeny{0};     // 规则4：缺省拒绝
    std::atomic<uint64_t> hits_sysHeaderByPath{0}; // 路径兜底命中（Windows/MSVC 等）
    std::atomic<uint64_t> hits_expansion{0};       // 主文件展开直通（轻量表达式）
};

// 采样一小部分被拒绝的游标，便于诊断
struct FallbackSample {
    std::string kind;         // 游标种类
    std::string spellingFile; // 拼写文件
    std::string expansionFile;// 展开文件（宏）
    unsigned   line = 0;
    unsigned   col  = 0;
    std::string name;         // 游标可读名称
};

// 主文件展开的“轻量表达式”配额控制，防止宏风暴拖垮性能
struct ExpansionBudget {
    std::atomic<uint32_t> pass_count{0};
    uint32_t hard_cap = 2000; // 可通过 SetExpansionHardCap 动态调整
};

// 全局对象（简化接入成本）
extern MatStats g_matStats;
extern ExpansionBudget g_expBudget;

// 采样容器与上限
inline constexpr size_t kMaxFallbackSamples = 200;
extern std::mutex g_fbMu;
extern std::vector<FallbackSample> g_fallbackSamples;

// 小工具：把枚举与文件句柄转成字符串
std::string KindStr(CXCursorKind k);
std::string FileStr(CXFile f);

// 在“默认拒绝”分支里调用，记录一条采样（含展开位置信息）
void RecordDefaultFallback(CXCursor cursor,
                           CXCursorKind kind,
                           const std::string& spellingFileName);

// 打印总览统计与若干采样
void DumpMaterializeMetrics(std::ostream& os);

// 设置与重置
void SetExpansionHardCap(uint32_t cap);
void ResetMetrics();

} // namespace mat
