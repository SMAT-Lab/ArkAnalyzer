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

#include "ast_prune_policy.h"
#include <string_view>

// ---------- Prune policy globals ----------
// Global switches for pruning overly large InitListExpr nodes
bool     g_pruneHugeInits          = true;
unsigned g_initTokLenThreshold     = 320;
unsigned g_initTokenCountThreshold = 96;

// ---------- Field policy state (single source of truth) ----------
// Controls which fields are extracted for AST nodes
static FieldPolicy g_fieldPolicy = FieldPolicy::LITE;

void SetFieldPolicy(FieldPolicy p) { g_fieldPolicy = p; }
void SetFieldPolicyLite(bool on)   { g_fieldPolicy = on ? FieldPolicy::LITE : FieldPolicy::DEFAULT_FULL; }
FieldPolicy GetFieldPolicy()       { return g_fieldPolicy; }

FieldPolicy ParseFieldPolicy(std::string_view s)
{
    // Case-insensitive matching (basic check, can be extended if needed)
    if (s == "lite" || s == "Lite" || s == "LITE") {
        return FieldPolicy::LITE;
    }
    return FieldPolicy::DEFAULT_FULL;
}

uint32_t SelectFieldMaskForCursorKind(CXCursorKind k)
{
    if (GetFieldPolicy() != FieldPolicy::LITE) {
        return DefaultFieldMask();
    }
    switch (k) {
        // Expressions and references: keep basic info
        case CXCursor_UnexposedExpr:
        case CXCursor_UnexposedDecl:
        case CXCursor_DeclRefExpr:
            return WANT_KIND | WANT_NAME | WANT_TYPE | WANT_CODE;
        // Operators and simple statements: keep basic info
        case CXCursor_BinaryOperator:
        case CXCursor_UnaryOperator:
        case CXCursor_CompoundAssignOperator:
        case CXCursor_ReturnStmt:
        case CXCursor_DeclStmt:
            return WANT_KIND | WANT_NAME | WANT_TYPE | WANT_CODE;
        // Control flow blocks: keep only kind + code
        case CXCursor_CompoundStmt:
        case CXCursor_DoStmt:
        case CXCursor_SwitchStmt:
            return WANT_KIND | WANT_CODE;
        case CXCursor_IfStmt:
        case CXCursor_ForStmt:
        case CXCursor_WhileStmt:
            return WANT_KIND | WANT_CODE | WANT_RANGE;
        // Function-related declarations: include ranges and references
        case CXCursor_FunctionDecl:
        case CXCursor_CXXMethod:
        case CXCursor_Constructor:
        case CXCursor_Destructor:
            return WANT_KIND | WANT_NAME | WANT_RANGE | WANT_REFERENCED | WANT_CODE;
        // Variables, parameters, fields: need type information
        case CXCursor_ParmDecl:
        case CXCursor_FieldDecl:
            return WANT_KIND | WANT_NAME | WANT_TYPE | WANT_CODE;
        case CXCursor_VarDecl:
            return WANT_KIND | WANT_NAME | WANT_TYPE | WANT_CODE | WANT_RANGE | WANT_LOCFILE;
        // Typedefs and type aliases: keep names only
        case CXCursor_TypedefDecl:
        case CXCursor_TypeAliasDecl:
            return WANT_KIND | WANT_NAME;
        // Enums, structs, classes, unions: full info with type + range + references
        case CXCursor_EnumDecl:
        case CXCursor_StructDecl:
        case CXCursor_ClassDecl:
        case CXCursor_UnionDecl:
            return WANT_KIND | WANT_NAME | WANT_TYPE | WANT_CODE | WANT_RANGE | WANT_REFERENCED;
        // Using declarations/directives: keep name and type
        case CXCursor_UsingDeclaration:
            return WANT_KIND | WANT_NAME | WANT_TYPE;
        case CXCursor_UsingDirective:
            return WANT_KIND | WANT_NAME | WANT_TYPE | WANT_LOCFILE;
        // Namespaces: keep name and type
        case CXCursor_Namespace:
            return WANT_KIND | WANT_NAME | WANT_TYPE | WANT_LOCFILE;
        // Translation unit: keep most metadata
        case CXCursor_TranslationUnit:
            return WANT_KIND | WANT_TYPE | WANT_CODE | WANT_RANGE | WANT_LOCFILE | WANT_REFERENCED;
        // Function calls: keep kind, name, type, and code
        case CXCursor_CallExpr:
            return WANT_KIND | WANT_NAME | WANT_TYPE | WANT_CODE | WANT_RANGE;
        default:
            return DefaultFieldMask();
    }
}

/// Decide whether an InitListExpr node should be pruned (leaf-ified).
/// - Respects the global switch `g_pruneHugeInits`.
/// - Uses a quick check based on token length (`IsHugeInitializerByTokLen`).
bool ShouldPruneInitList(const json& node)
{
    if (!g_pruneHugeInits) {
        return false;
    }
    return IsHugeInitializerByTokLen(node);
}

/// Create an "opaque" node: a shallow copy without inner children.
/// Used when pruning huge AST subtrees.
json MakeOpaqueNode(const json& node)
{
    json pruned = node;  // Make a copy
    pruned["_opaque"] = true;
    pruned["inner"] = json::array();
    return pruned;
}
