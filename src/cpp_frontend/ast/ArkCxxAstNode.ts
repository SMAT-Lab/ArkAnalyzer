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
    spellingLoc?: SpellingLoc; // Spelling Location related to macros
    expansionLoc?: CxxPosition; // Expansion Location related to macros
}

/** Type information */
export interface CxxTypeInfo {
    type?: string;
    qualType: string; // Main field: output from unifyTypeStr
    desugaredQualType?: string;
    typeAliasDeclId?: number;
    typeAliasDeclQualifiedName?: string;
}

export interface CxxAliasInfo {
    declCode?: string;
    range?: CxxRange;
}

/** Target information for DeclRef */
export interface CxxReferencedDecl {
    kind?: string; // VarDecl / ParamVarDecl / FunctionDecl ...
    name?: string;
    type?: CxxTypeInfo;
    alias?: CxxAliasInfo;
}

/** Target information for CXXCtorInitializer */
export interface CxxCtorAnyInit {
    kind: 'FieldDecl';
    name: string;
    type?: CxxTypeInfo;
}

/** Target information for enclosingFunction */
export interface CxxEnclosingFunction {
    id?: number;
    kind?: string;
    name?: string;
    range?: CxxRange;
}

/** Spelling Location related to macros or inclusion directive */
export interface SpellingLoc extends CxxPosition {
    file?: string;
}

/** Target information for UsingDirectiveDecl  */
export interface NominatedNamespace {
    id: number;
    kind: string;
    name: string;
}

/** Target information for dtor  */
export interface DtorType {
    id?: number;
    kind?: string;
    name?: string;
    type?: CxxTypeInfo;
}

/** Target information for Inclusion Directive */
export interface CxxIncludeInfo {
    code: string; // inclusion directive code
    fileName?: string; // include header file absolute path. When the target cannot be found in the search path, this property does not exist.
    includeName: string; // include header file name
    includedFrom: string; // The absolute path of the translation unit file where the 'InclusionDirective' node is located.
    isAngled: boolean; // whether it is a reference enclosed in angle brackets or not.
    kind: string; // kind of node
    loc: SpellingLoc; // inclusion directive position in translate unit file
    relativePath: string; // the relative path of the header file relative to the search path
    searchPath: string; // path of searching header files
}

export type CxxAstNodeLite = Omit<CxxAstNode, 'inner'>;

/** General C++ AST node (compatible with Clang JSON) */
export interface CxxAstNode {
    /** Unique node ID */
    id?: string;

    /** Unique node ID */
    originalId?: string;

    /** Is there any initialization of member variables */
    hasInClassInitializer?: boolean;

    /** Node kind (e.g., "TranslationUnit", "FunctionDecl", "CXXConstructExpr", etc.) */
    kind: string;

    /** Node name (function/variable/type/operator name, etc.) */
    name: string;

    /** Source code snippet */
    code: string;

    /** Type information */
    type: CxxTypeInfo;

    /** Mangled name (injected by getMemberInClassName for methods/constructors/destructors) */
    mangledName?: string;

    /** Tag: class/struct/union/enum (injected by fillNodeKindTag) */
    tagUsed?: string;

    /** Stores implicit markers such as UsingDirective */
    isImplicit?: boolean;

    /** Storage class (e.g., "static" for member VarDecl) */
    storageClass?: string;

    /** The access modifier of class member stored in 'AccessSpecDecl' node. (e.g., public or private)*/
    access?: string;

    /** Target information parsed from DeclRef */
    referencedDecl?: CxxReferencedDecl;

    /** Literal value (IntegerLiteral/StringLiteral/BoolLiteral) */
    value?: string;

    /** Value category ("prvalue"/"lvalue"... default is "prvalue") */
    valueCategory?: string;

    /** Derived information: unary/binary operator */
    opcode?: string; // Binary / CompoundAssign / UnaryOperator
    op?: string; // CxxFolderExpr
    isPostfix?: boolean; // UnaryOperator

    /** Whether MemberExpr is accessed via -> */
    isArrow?: boolean;

    /** Annotation for new[] */
    isArray?: boolean;
    arraySizes?: string[];

    /** Special expression annotations (trait/noexcept/typeid/atomic) */
    traitFunc?: string;
    traitArgs?: string;
    noexceptArg?: string;
    typeArg?: CxxTypeInfo;
    atomicFunc?: string;

    /** Annotation for pseudo-destructor expression */
    pseudoDestructorType?: string;

    /** Result of goto -> label resolution */
    targetLabelId?: number;

    /** Specific to CXXCtorInitializer */
    anyInit?: CxxCtorAnyInit; // e.g., { kind: "FieldDecl", name, type }
    baseInit?: CxxTypeInfo; // Used for base class initialization

    /** Specific to UsingDirectiveDecl  */
    nominatedNamespace?: NominatedNamespace;

    /** Header/include relationship related */
    includes?: CxxIncludeInfo[],

    /** Simple location (line/column); some nodes may not have this */
    loc?: {
        file?: string;
        line?: number;
        col?: number;
        spellingLoc?: SpellingLoc; // Spelling Location related to macros
        expansionLoc?: CxxPosition; // Expansion Location related to macros
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

    typeArguments?: string[];

    default?: string;

    parent?: CxxAstNode;

    getParent?: {
        (isNeedInner: true): CxxAstNode; // Requires full parent node (including inner)
        (isNeedInner?: false): CxxAstNodeLite; // Lightweight snapshot (excluding inner)
    };

    modifiers?: string[];

    enclosingFunction?: CxxEnclosingFunction;

    /** Reserved for future fields */
    [key: string]: unknown;

    defaultArg?: defaultArg;

    bases?: classBase[];

    dtor?: DtorType;

}

/** root type */
export interface CxxTranslationUnit extends CxxAstNode {
    kind: 'TranslationUnit' | 'TranslationUnitDecl';
    fileName?: string;
    headerUnits?: CxxAstNode[];
    projectName?: string;
}

export function getNodeAt(node: CxxAstNode, index: number): CxxAstNode | undefined {
    // Unified Border Protection Inspection
    if (!node?.inner?.length || index < 0 || index >= node.inner.length) {
        return undefined;
    }
    return node.inner[index];
}

/** Get the starting line and column numbers of the ast node, Default LineColPosition is (0, 0). */
export function getNodeStartLineAndCol(node: CxxAstNode): CxxPosition {
    if (node.loc?.line && node.loc?.col) {
        return { line: node.loc.line, col: node.loc.col };
    }
    return node.loc?.expansionLoc ?? node.range?.begin ?? node.range?.expansionLoc ?? { line: 0, col: 0 };
}

export interface defaultArg {
    kind: string;
    type: CxxTypeInfo;
}

export interface classBase {
    access: string;
    type: CxxTypeInfo;
    isVirtual?: boolean;
    writtenAccess?: string;
}
export enum astKind {
    ArraySubscriptExpr = 'ArraySubscriptExpr',
    ArrayTypeTraitExpr = 'ArrayTypeTraitExpr',
    AtomicCallExpr = 'AtomicCallExpr',
    BinaryConditionalOperator = 'BinaryConditionalOperator',
    BinaryOperator = 'BinaryOperator',
    BindingDecl = 'BindingDecl',
    BreakStmt = 'BreakStmt',
    CallExpr = 'CallExpr',
    CaseStmt = 'CaseStmt',
    CharacterLiteral = 'CharacterLiteral',
    ClassTemplateDecl = 'ClassTemplateDecl',
    CompoundAssignOperator = 'CompoundAssignOperator',
    CompoundLiteralExpr = 'CompoundLiteralExpr',
    CompoundStmt = 'CompoundStmt',
    ConditionalOperator = 'ConditionalOperator',
    ConstantExpr = 'ConstantExpr',
    ContinueStmt = 'ContinueStmt',
    CStyleCastExpr = 'CStyleCastExpr',
    CXXBindTemporaryExpr = 'CXXBindTemporaryExpr',
    CXXBoolLiteralExpr = 'CXXBoolLiteralExpr',
    CXXCatchStmt = 'CXXCatchStmt',
    CXXConstCastExpr = 'CXXConstCastExpr',
    CXXConstructorDecl = 'CXXConstructorDecl',
    CXXConstructExpr = 'CXXConstructExpr',

    CXXCtorInitializer = 'CXXCtorInitializer',
    CXXDefaultArgExpr = 'CXXDefaultArgExpr',
    CXXDeleteExpr = 'CXXDeleteExpr',
    CXXDestructorDecl = 'CXXDestructorDecl',
    CXXDynamicCastExpr = 'CXXDynamicCastExpr',
    CXXFoldExpr = 'CXXFoldExpr',
    CXXForRangeStmt = 'CXXForRangeStmt',
    CXXFunctionalCastExpr = 'CXXFunctionalCastExpr',
    CXXInheritedCtorInitExpr = 'CXXInheritedCtorInitExpr',
    CXXMemberCallExpr = 'CXXMemberCallExpr',
    CXXMethodDecl = 'CXXMethodDecl',
    CXXNewExpr = 'CXXNewExpr',
    CXXNoexceptExpr = 'CXXNoexceptExpr',
    CXXNullPtrLiteralExpr = 'CXXNullPtrLiteralExpr',
    CXXOperatorCallExpr = 'CXXOperatorCallExpr',
    CXXPseudoDestructorExpression = 'CXXPseudoDestructorExpression',
    CXXRecordDecl = 'CXXRecordDecl',
    CXXReinterpretCastExpr = 'CXXReinterpretCastExpr',
    CXXRewrittenBinaryOperator = 'CXXRewrittenBinaryOperator',
    CXXScalarValueInitExpr = 'CXXScalarValueInitExpr',
    CXXStaticCastExpr = 'CXXStaticCastExpr',
    CXXStdInitializerListExpr = 'CXXStdInitializerListExpr',
    CXXTemporaryObjectExpr = 'CXXTemporaryObjectExpr',
    CXXThisExpr = 'CXXThisExpr',
    CXXThrowExpr = 'CXXThrowExpr',
    CXXTryStmt = 'CXXTryStmt',
    CXXTypeidExpr = 'CXXTypeidExpr',
    DeclRefExpr = 'DeclRefExpr',
    DeclStmt = 'DeclStmt',
    DecompositionDecl = 'DecompositionDecl',
    DefaultStmt = 'DefaultStmt',
    DesignatedInitExpr = 'DesignatedInitExpr',
    DoStmt = 'DoStmt',
    EnumDecl = 'EnumDecl',
    EnumConstantDecl = 'EnumConstantDecl',
    ExprWithCleanups = 'ExprWithCleanups',
    FloatingLiteral = 'FloatingLiteral',
    ForStmt = 'ForStmt',
    FriendDecl = 'FriendDecl',
    FunctionDecl = 'FunctionDecl',
    FunctionTemplateDecl = 'FunctionTemplateDecl',
    GotoStmt = 'GotoStmt',
    IfStmt = 'IfStmt',
    ImplicitCastExpr = 'ImplicitCastExpr',
    IndirectGotoStmt = 'IndirectGotoStmt',
    InitListExpr = 'InitListExpr',
    IntegerLiteral = 'IntegerLiteral',
    LabelStmt = 'LabelStmt',
    LambdaExpr = 'LambdaExpr',
    LinkageSpecDecl = 'LinkageSpecDecl',
    MaterializeTemporaryExpr = 'MaterializeTemporaryExpr',
    MemberExpr = 'MemberExpr',
    MemberRef = 'MemberRef',
    NamespaceRef = 'NamespaceRef',
    NamespaceDecl = 'NamespaceDecl',
    NullStmt = 'NullStmt',
    OverloadedDeclRef = 'OverloadedDeclRef',
    ParenExpr = 'ParenExpr',
    ParenListExpr = 'ParenListExpr',
    ParentExpr = 'ParentExpr',
    ParmVarDecl = 'ParmVarDecl',
    RecordDecl = 'RecordDecl',
    RecoveryExpr = 'RecoveryExpr',
    ReturnStmt = 'ReturnStmt',
    StringLiteral = 'StringLiteral',
    SwitchStmt = 'SwitchStmt',
    TemplateRef = 'TemplateRef',
    TemplateTypeParmDecl = 'TemplateTypeParmDecl',
    TranslationUnitDecl = 'TranslationUnitDecl',
    TypeAliasDecl = 'TypeAliasDecl',
    TypeAliasTemplateDecl = 'TypeAliasTemplateDecl',
    TypedefDecl = 'TypedefDecl',
    TypeRef = 'TypeRef',
    UnaryExprOrTypeTraitExpr = 'UnaryExprOrTypeTraitExpr',
    UnaryOperator = 'UnaryOperator',
    UnexposedExpr = 'UnexposedExpr',
    UnresolvedLookupExpr = 'UnresolvedLookupExpr',
    unsupported_kind = 'unsupported kind',
    UserDefinedLiteral = 'UserDefinedLiteral',
    UsingDirectiveDecl = 'UsingDirectiveDecl',
    VarDecl = 'VarDecl',
    WhileStmt = 'WhileStmt',
}
