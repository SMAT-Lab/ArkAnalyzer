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

/*
 * ast_prune_policy.h
 *
 * Policy switches and helpers for pruning very large AST subtrees
 * (e.g., oversized InitListExpr) to keep JSON output compact and
 * traversal fast.
 *
 * When to use:
 *   - You are serializing Clang AST to JSON and want to cap output size.
 *   - You need a fast, deterministic “leaf-ify” decision for huge initializers.
 *
 * Typical usage:
 *   #include "ast_prune_policy.h"
 *   if (g_pruneHugeInits && IsHugeInitializerByTokLen(node)) {
 *     // turn the node into an opaque leaf (no children)
 *   }
 *
 * Thread-safety:
 *   - The global switches are process-global and not thread-safe to mutate.
 *     Set them during initialization, before parallel traversal.
 */

#ifndef AST_PRUNE_POLICY_H
#define AST_PRUNE_POLICY_H

#include <cstdint>
#include <string_view>
#include <clang-c/Index.h>
#include "json.hpp"

using json = nlohmann::json;

// ================== Global Policy Switches ==================
// Controls whether and how we prune large InitListExpr nodes.
// Tune thresholds based on your codebase characteristics.

// Enable pruning of huge initializer lists (default: true).
extern bool g_pruneHugeInits;

// Threshold by *source span length in characters* (cheap O(1) check).
// Typical range: 120–256. Default: 1280.
extern unsigned g_initTokLenThreshold;

// Threshold by *token count* via clang_tokenize (slightly heavier).
// Typical range: 64–128. Default: 96.
// Intended as a fallback when span length is near the boundary.
extern unsigned g_initTokenCountThreshold;

// ================== Prune Check Helpers ==================
// Fast/slow-ish predicates to decide whether to prune an InitListExpr.
/// Fast check by source-span length (“tokLen”).
/// O(1): reads a precomputed length from JSON.
/// NOTE: This expects the JSON schema to store a per-node span length,
/// commonly at node["range"]["begin"]["tokLen"]. If your schema differs,
/// adjust this accessor accordingly.
inline bool IsHugeInitializerByTokLen(const json& node) noexcept
{
    if (node.value("kind", "") != "InitListExpr" || !node.contains("range")) {
        return false;
    }
    const auto tokLen = static_cast<size_t>(
        node["range"]["begin"].value("tokLen", 0u)
    );
    return tokLen >= g_initTokLenThreshold;
}

/// Tokenization-based check using libClang. More precise but slightly heavier
/// due to clang_tokenize/clang_disposeTokens. Useful near threshold edges.
/// `thres` defaults to 96 to match the typical global default.
inline bool IsHugeInitializerByTokenize(CXTranslationUnit tu, CXCursor cursor, unsigned thres = 96) noexcept
{
    CXSourceRange r = clang_getCursorExtent(cursor);
    CXToken* toks = nullptr;
    unsigned ntok = 0;
    clang_tokenize(tu, r, &toks, &ntok);
    if (toks) {
        clang_disposeTokens(tu, toks, ntok);
    }
    return ntok >= thres;
}

// ================== Field Selection Policy ==================
// Controls which JSON fields are materialized for each CXCursorKind.

enum FieldBits : uint32_t {
    WANT_KIND       = 1u << 0,
    WANT_NAME       = 1u << 1,
    WANT_TYPE       = 1u << 2,
    WANT_CODE       = 1u << 3,
    WANT_RANGE      = 1u << 4,
    WANT_LOCFILE    = 1u << 5,
    WANT_REFERENCED = 1u << 6,
};

/// Default mask for “full” policy.
constexpr inline uint32_t DefaultFieldMask() noexcept
{
    return WANT_KIND | WANT_NAME | WANT_TYPE | WANT_CODE | WANT_RANGE | WANT_LOCFILE | WANT_REFERENCED;
}

/// Policy kind:
///  - DEFAULT_FULL: materialize most fields for richer tooling.
///  - LITE:        materialize a subset for speed/smaller output.
enum class FieldPolicy { DEFAULT_FULL, LITE };

// Policy setters/getters (implemented in .cpp).
void        SetFieldPolicy(FieldPolicy p);
void        SetFieldPolicyLite(bool on);
FieldPolicy GetFieldPolicy();

/// Parse from CLI/config string (e.g., "LITE", "default").
/// Case-insensitive handling can be extended as needed.
FieldPolicy ParseFieldPolicy(std::string_view s);

// Core selector by cursor kind (implemented in .cpp).
uint32_t SelectFieldMaskForCursorKind(CXCursorKind k);

// Small helpers (header-only).
inline bool Want(uint32_t m, uint32_t bit)        noexcept { return (m & bit) != 0; }
inline bool WantKind(uint32_t m)                  noexcept { return Want(m, WANT_KIND); }
inline bool WantName(uint32_t m)                  noexcept { return Want(m, WANT_NAME); }
inline bool WantType(uint32_t m)                  noexcept { return Want(m, WANT_TYPE); }
inline bool WantCode(uint32_t m)                  noexcept { return Want(m, WANT_CODE); }
inline bool WantRange(uint32_t m)                 noexcept { return Want(m, WANT_RANGE); }
inline bool WantLocFile(uint32_t m)               noexcept { return Want(m, WANT_LOCFILE); }
inline bool WantReferenced(uint32_t m)            noexcept { return Want(m, WANT_REFERENCED); }

// ================== Prune Utilities ==================
// Decide whether a JSON node should be pruned and how to
// produce an “opaque” leaf node.
// Return whether the given JSON node (expected InitListExpr) should be pruned
// under current global switches and thresholds.
bool ShouldPruneInitList(const json& node);

/// Make a shallow “opaque” copy of the node: mark `_opaque=true` and clear
/// `inner` to leaf-ify the subtree. The original node is not modified.
json MakeOpaqueNode(const json& node);

// ================== Mask Decoding Helper ==================
// Convenience utility to unpack a bitmask into a struct of booleans.

struct WantMask {
    bool kind;
    bool name;
    bool type;
    bool code;
    bool range;
    bool loc;
    bool extras; // maps to WANT_REFERENCED
};

inline WantMask DecodeWant(uint32_t m) noexcept
{
    return {
        (m & WANT_KIND)       != 0,
        (m & WANT_NAME)       != 0,
        (m & WANT_TYPE)       != 0,
        (m & WANT_CODE)       != 0,
        (m & WANT_RANGE)      != 0,
        (m & WANT_LOCFILE)    != 0,
        (m & WANT_REFERENCED) != 0
    };
}

#endif // AST_PRUNE_POLICY_H
