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

export interface CppAstSceneContext {
    getCcjsonPath(): string | undefined;
}

export interface CppAstError {
    filePath: string;
    reason: Error;
}

export interface CppAstResult {
    dumpErrors: CppAstError[];
    exitCode: number;
}

export interface CppAstParams {
    scene: CppAstSceneContext;
    sources: string[];
    projectDir: string;
    includeDirs: string[];
    maxParallelProcesses: number;
    maxPendingAstResults: number;
    logAstInfo?: boolean;
    onSourceAst: (sourceFile: string, astRoot: CxxAstNode) => void;
}

export enum AstKind {
    Unknown = 0,
    TranslationUnit = 1,
    ArraySubscriptExpr = 2,
    ArrayTypeTraitExpr = 3,
    AtomicCallExpr = 4,
    BinaryConditionalOperator = 5,
    BinaryOperator = 6,
    BindingDecl = 7,
    BreakStmt = 8,
    CallExpr = 9,
    CaseStmt = 10,
    CharacterLiteral = 11,
    ClassTemplateDecl = 12,
    CompoundAssignOperator = 13,
    CompoundLiteralExpr = 14,
    CompoundStmt = 15,
    ConditionalOperator = 16,
    ConstantExpr = 17,
    ContinueStmt = 18,
    CStyleCastExpr = 19,
    CXXBindTemporaryExpr = 20,
    CXXBoolLiteralExpr = 21,
    CXXCatchStmt = 22,
    CXXConstCastExpr = 23,
    CXXConstructorDecl = 24,
    CXXConstructExpr = 25,
    CXXCtorInitializer = 26,
    CXXDefaultArgExpr = 27,
    CXXDeleteExpr = 28,
    CXXDestructorDecl = 29,
    CXXDynamicCastExpr = 30,
    CXXFoldExpr = 31,
    CXXForRangeStmt = 32,
    CXXFunctionalCastExpr = 33,
    CXXInheritedCtorInitExpr = 34,
    CXXMemberCallExpr = 35,
    CXXMethodDecl = 36,
    CXXNewExpr = 37,
    CXXNoexceptExpr = 38,
    CXXNullPtrLiteralExpr = 39,
    CXXOperatorCallExpr = 40,
    CXXPseudoDestructorExpression = 41,
    CXXRecordDecl = 42,
    CXXReinterpretCastExpr = 43,
    CXXRewrittenBinaryOperator = 44,
    CXXScalarValueInitExpr = 45,
    CXXStaticCastExpr = 46,
    CXXStdInitializerListExpr = 47,
    CXXTemporaryObjectExpr = 48,
    CXXThisExpr = 49,
    CXXThrowExpr = 50,
    CXXTryStmt = 51,
    CXXTypeidExpr = 52,
    DeclRefExpr = 53,
    DeclStmt = 54,
    DecompositionDecl = 55,
    DefaultStmt = 56,
    DesignatedInitExpr = 57,
    DoStmt = 58,
    EnumDecl = 59,
    EnumConstantDecl = 60,
    ExprWithCleanups = 61,
    FloatingLiteral = 62,
    ForStmt = 63,
    FriendDecl = 64,
    FunctionDecl = 65,
    FunctionTemplateDecl = 66,
    GotoStmt = 67,
    IfStmt = 68,
    ImplicitCastExpr = 69,
    IndirectGotoStmt = 70,
    InitListExpr = 71,
    IntegerLiteral = 72,
    LabelStmt = 73,
    LambdaExpr = 74,
    LinkageSpecDecl = 75,
    MaterializeTemporaryExpr = 76,
    MemberExpr = 77,
    MemberRef = 78,
    NamespaceRef = 79,
    NamespaceDecl = 80,
    NonTypeTemplateParmDecl = 81,
    NullStmt = 82,
    OverloadedDeclRef = 83,
    ParenExpr = 84,
    ParenListExpr = 85,
    ParentExpr = 86,
    ParmVarDecl = 87,
    RecordDecl = 88,
    RecoveryExpr = 89,
    ReturnStmt = 90,
    StringLiteral = 91,
    SwitchStmt = 92,
    TemplateRef = 93,
    TemplateTypeParmDecl = 94,
    TranslationUnitDecl = 95,
    TypeAliasDecl = 96,
    TypeAliasTemplateDecl = 97,
    TypedefDecl = 98,
    TypeRef = 99,
    UnaryExprOrTypeTraitExpr = 100,
    UnaryOperator = 101,
    UnexposedExpr = 102,
    UnresolvedLookupExpr = 103,
    UnsupportedKind = 104,
    UserDefinedLiteral = 105,
    UsingDirectiveDecl = 106,
    VarDecl = 107,
    WhileStmt = 108,
    AccessSpecDecl = 109,
    CatchAllException = 110,
    CXXAccessSpecifier = 111,
    UsingDecl = 112,
    FieldDecl = 113,
    InclusionDirective = 114,
    TemplateTypeParmVarDecl = 115,
    AttributeOverride = 116,
    FunctionToPointerDecay = 117,
}

/** Exclusive upper bound for wire kind ids (uint16). */
export const AST_KIND_COUNT = 118;

/** CXXRecordDecl tag (wire uint8). */
export enum CxxTagUsed {
    Unknown = 0,
    Class = 1,
    Struct = 2,
    Union = 3,
    Enum = 4,
}
export const CXX_TAG_USED_COUNT = 5;

/** VarDecl / similar storage class (wire uint8). */
export enum CxxStorageClass {
    Unknown = 0,
    Static = 1,
    Extern = 2,
}
export const CXX_STORAGE_CLASS_COUNT = 3;

/** Access specifier (wire uint8). */
export enum CxxAccess {
    Unknown = 0,
    Public = 1,
    Private = 2,
    Protected = 3,
}
export const CXX_ACCESS_COUNT = 4;

/** Clang value category (wire uint8). */
export enum CxxValueCategory {
    Unknown = 0,
    Prvalue = 1,
    Lvalue = 2,
    Xvalue = 3,
}
export const CXX_VALUE_CATEGORY_COUNT = 4;

/** CXXFoldExpr fold operator (wire uint8). */
export enum CxxFoldOp {
    Unknown = 0,
    FoldSpace = 1,
    BitOr = 2,
    BitAnd = 3,
    BitXor = 4,
}
export const CXX_FOLD_OP_COUNT = 5;

/** Binary/unary/compound operator token (wire uint8). */
export enum CxxOpcode {
    Unknown = 0,
    Assign = 1,
    Plus = 2,
    Minus = 3,
    Mul = 4,
    Div = 5,
    Mod = 6,
    Shl = 7,
    Shr = 8,
    BitAnd = 9,
    BitOr = 10,
    BitXor = 11,
    LogicalAnd = 12,
    LogicalOr = 13,
    Lt = 14,
    Le = 15,
    Gt = 16,
    Ge = 17,
    Eq = 18,
    Ne = 19,
    Inc = 20,
    Dec = 21,
    PlusAssign = 22,
    MinusAssign = 23,
    MulAssign = 24,
    DivAssign = 25,
    ModAssign = 26,
    ShlAssign = 27,
    ShrAssign = 28,
    BitAndAssign = 29,
    BitOrAssign = 30,
    BitXorAssign = 31,
    Comma = 32,
    Not = 33,
    BitNot = 34,
}
export const CXX_OPCODE_COUNT = 35;

/**
 * Maps normalized C++ primitive / builtin spellings to ArkAnalyzer data-type categories
 * used when building IR from {@link CxxTypeInfo.qualType}.
 */
export const CXX_PRIMITIVE_TYPE_MAP: Record<string, string> = {
    bool: 'boolean',
    string: 'string',
    'std::string': 'string',
    char: 'string',
    'signed char': 'string',
    'unsigned char': 'string',
    'unsignedchar': 'string',
    wchar_t: 'string',
    char16_t: 'string',
    char32_t: 'string',
    'std::basic_string<char>': 'string',
    'basic_string<char>': 'string',
    short: 'number',
    'unsigned short': 'number',
    'unsigned int': 'number',
    int: 'number',
    long: 'number',
    'unsigned long': 'number',
    'long long': 'number',
    'unsigned long long': 'number',
    float: 'number',
    double: 'number',
    'long double': 'number',
    uint8_t: 'number',
    uint16_t: 'number',
    uint32_t: 'number',
    uint64_t: 'number',
    int8_t: 'number',
    int16_t: 'number',
    int32_t: 'number',
    int64_t: 'number',
    size_t: 'number',
    intptr_t: 'number',
    uintptr_t: 'number',
    void: 'void',
    'std::type_info': 'type_info',
    type_info: 'type_info',
    auto: 'auto',
};

/** Position information (line/column/offset/length) */
export interface CxxPosition {
    line: number;
    col: number;
    offset?: number; // Offset will be set by the generator
    tokLen?: number; // tokLen is available for 'begin'
}

/** Source code range */
export interface CxxRange {
    begin: CxxPosition;
    end: CxxPosition;
}

/** Type information */
export interface CxxTypeInfo {
    qualType: string; // Main field: output from unifyTypeStr
    desugaredQualType?: string;
    typeAliasDeclId?: number;
}

/** Target information for DeclRef */
export interface CxxReferencedDecl {
    kind?: AstKind; // VarDecl / ParamVarDecl / FunctionDecl ...
    name?: string;
    type?: CxxTypeInfo;
}

/** Target information for CXXCtorInitializer */
export interface CxxCtorAnyInit {
    name: string;
    type?: CxxTypeInfo;
}

/** Target information for Inclusion Directive */
export interface CxxIncludeInfo {
    fileName?: string; // include header file absolute path. When the target cannot be found in the search path, this property does not exist.
    includeName: string; // include header file name
    kind: AstKind; // kind of node
    loc: CxxPosition; // inclusion directive position in translate unit file
}

export type CxxAstNodeLite = Omit<CxxAstNode, 'inner'>;

/**
 * Wire `node_flags:uint8` bits on {@link CxxAstNodeWire}.
 * Read with {@link hasNodeFlag} in {@link ./cppUtils}; layout is stable across wire v12+.
 */
export enum CxxNodeFlag {
    HasInClassInitializer = 1 << 0,
    Implicit = 1 << 1,
    Postfix = 1 << 2,
    Arrow = 1 << 3,
    Array = 1 << 4,
}

/**
 * Wire `base_flags:uint8` bits on {@link ClassBaseWire}.
 * Read with {@link hasBaseFlag} in {@link ./cppUtils}.
 */
export enum CxxBaseFlag {
    Virtual = 1 << 0,
}

/** General C++ AST node (compatible with Clang JSON) */
export interface CxxAstNode {
    /** Unique node ID */
    id?: string;

    /** Unique node ID */
    originalId?: string;

    /** Node kind (numeric AstKind; wire uint16) */
    kind: AstKind;

    /** Node name (function/variable/type/operator name, etc.) */
    name: string;

    /** Type information */
    type: CxxTypeInfo;

    /** Mangled name (injected by getMemberInClassName for methods/constructors/destructors) */
    mangledName?: string;

    /** Tag: class/struct/union/enum (injected by fillNodeKindTag) */
    tagUsed?: CxxTagUsed;

    /** Storage class (e.g., static for member VarDecl) */
    storageClass?: CxxStorageClass;

    /** The access modifier of class member stored in AccessSpecDecl. */
    access?: CxxAccess;

    /** Target information parsed from DeclRef */
    referencedDecl?: CxxReferencedDecl;

    /** Literal value (IntegerLiteral/StringLiteral/BoolLiteral) */
    value?: string;

    /** Value category (Clang prvalue/lvalue/xvalue). */
    valueCategory?: CxxValueCategory;

    /** ImplicitCastExpr castKind (only TS-parsed kinds are wired; else omitted) */
    castKind?: AstKind;

    /** Derived information: unary/binary/compound operator token. */
    opcode?: CxxOpcode;
    op?: CxxFoldOp; // CXXFoldExpr

    typeArg?: CxxTypeInfo;

    /** Specific to CXXCtorInitializer */
    anyInit?: CxxCtorAnyInit; // e.g., { name, type }
    baseInit?: CxxTypeInfo; // Used for base class initialization

    /** Nominated namespace name (UsingDirectiveDecl) */
    nominatedNamespace?: string;

    /** Header/include relationship related */
    includes?: CxxIncludeInfo[];

    /** Simple location (line/column); some nodes may not have this */
    loc?: {
        file?: string;
        line?: number;
        col?: number;
    };

    /** Precise range (begin/end includes offset and tokLen) */
    range?: CxxRange;

    /** Child nodes */
    inner: CxxAstNode[];

    /**
     * Root node may additionally carry: nodes from user includes aggregated here
     * (filled by filterToMainFileOnly(); also present in sample JSON)
     */
    headerUnits?: CxxAstNode[];

    parent?: CxxAstNode;

    getParent?: {
        (isNeedInner: true): CxxAstNode; // Requires full parent node (including inner)
        (isNeedInner?: false): CxxAstNodeLite; // Lightweight snapshot (excluding inner)
    };

    /**
     * C++ declaration/expression modifier bitmask (wire `modifier_flags:uint32`).
     *
     * Bit layout matches {@link ModifierType} in `src/core/model/ArkBaseModel.ts`.
     * Values are OR-combined; use bitwise `&` / `|` when reading or merging.
     */
    modifierFlags?: number;

    /**
     * AST shape / structural attribute bitmask (wire `node_flags:uint8`).
     *
     * Replaces per-node booleans (`hasInClassInitializer`, `isImplicit`, `isPostfix`,
     * `isArrow`, `isArray`). Read with {@link hasNodeFlag} in {@link ./cppUtils} and {@link CxxNodeFlag}.
     *
     * | Bit | Value | {@link CxxNodeFlag} | Meaning |
     * |-----|-------|-------------------|---------|
     * | 0 | 1 | HasInClassInitializer | in-class member initializer present |
     * | 1 | 2 | Implicit | Clang implicit node (e.g. UsingDirective) |
     * | 2 | 4 | Postfix | postfix unary operator (`i++`) |
     * | 3 | 8 | Arrow | MemberExpr uses `->` |
     * | 4 | 16 | Array | `new[]` / `delete[]` array form |
     * | 5–7 | — | — | reserved |
     */
    nodeFlags?: number;

    /** Default argument type (TemplateTypeParmDecl / ParmVarDecl) */
    defaultArg?: CxxTypeInfo;

    bases?: ClassBase[];

    /** Destructor kind (CXXPseudoDestructorExpression) */
    dtor?: AstKind;
}

export type CxxAstNodePositionSource = Pick<CxxAstNode, 'loc' | 'range'>;

/** Translation unit root (debug metadata set by AstParser.filter). */
export interface CxxTranslationUnit extends CxxAstNode {
    kind: AstKind.TranslationUnit | AstKind.TranslationUnitDecl;
    /** Main source path; for debugging only (builders use the `sourceFile` argument). */
    fileName?: string;
    headerUnits?: CxxAstNode[];
    /** Parent directory of `fileName`; for debugging only. */
    projectName?: string;
}

export interface ClassBase {
    access: CxxAccess;
    type: CxxTypeInfo;
    /**
     * Base-class attribute bitmask (wire `base_flags:uint8`).
     *
     * | Bit | Value | {@link CxxBaseFlag} | Meaning |
     * |-----|-------|-------------------|---------|
     * | 0 | 1 | Virtual | virtual base inheritance |
     * | 1–7 | — | — | reserved |
     *
     * Read with {@link hasBaseFlag} in {@link ./cppUtils}.
     */
    baseFlags?: number;
}
