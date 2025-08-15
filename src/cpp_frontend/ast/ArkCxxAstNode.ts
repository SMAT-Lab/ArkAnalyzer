/*
 * Copyright (c) 2024-2025 Huawei Device Co., Ltd.
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
export interface CppPosition {
    line: number;
    col: number;
    offset?: number; // Offset will be set by the generator
    tokLen?: number; // tokLen is available for 'begin'
}

/** Source code range */
export interface CppRange {
    begin: CppPosition;
    end: CppPosition;
}

/** Type information */
export interface CppTypeInfo {
    type?: string;
    qualType: string; // Main field: output from unifyTypeStr
    desugaredQualType?: string;
    typeAliasDeclId?: number;
    typeAliasDeclQualifiedName?: string;
}

/** Target information for DeclRef */
export interface CppReferencedDecl {
    kind?: string; // VarDecl / ParamVarDecl / FunctionDecl ...
    name?: string;
    type?: CppTypeInfo;
}

/** Target information for CXXCtorInitializer */
export interface CppCtorAnyInit {
    kind: 'FieldDecl';
    name: string;
    type?: CppTypeInfo;
}
export type CppAstNodeLite = Omit<CppAstNode, 'inner'>;

/** General C++ AST node (compatible with Clang JSON) */
export interface CppAstNode {
    /** Unique node ID */
    id?: number | string;

    /** Node kind (e.g., "TranslationUnit", "FunctionDecl", "CXXConstructExpr", etc.) */
    kind: string;

    /** Node name (function/variable/type/operator name, etc.) */
    name: string;

    /** Source code snippet */
    code: string;

    /** Type information */
    type: CppTypeInfo;

    /** Mangled name (injected by getMemberInClassName for methods/constructors/destructors) */
    mangledName?: string;

    /** Tag: class/struct/union/enum (injected by fillNodeKindTag) */
    tagUsed?: string;

    /** Stores implicit markers such as UsingDirective */
    isImplicit?: boolean;

    /** Storage class (e.g., "static" for member VarDecl) */
    storageClass?: string;

    /** Target information parsed from DeclRef */
    referencedDecl?: CppReferencedDecl;

    /** Literal value (IntegerLiteral/StringLiteral/BoolLiteral) */
    value?: string;

    /** Value category ("prvalue"/"lvalue"... default is "prvalue") */
    valueCategory?: string;

    /** Derived information: unary/binary operator */
    opcode?: string; // Binary / CompoundAssign / UnaryOperator
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
    typeArg?: string;
    atomicFunc?: string;

    /** Annotation for pseudo-destructor expression */
    pseudoDestructorType?: string;

    /** Result of goto -> label resolution */
    targetLabelId?: number;

    /** Specific to CXXCtorInitializer */
    anyInit?: CppCtorAnyInit; // e.g., { kind: "FieldDecl", name, type }
    baseInit?: CppTypeInfo; // Used for base class initialization

    /** Header/include relationship related */
    include?: boolean; // Node comes from a user header via include
    included?: string; // Host file path for InclusionDirective
    fileName?: string; // File name for TranslationUnit/Include
    locFile?: string; // File name written by locCursorKind

    /** Simple location (line/column); some nodes may not have this */
    loc?: {
        file?: string;
        line?: number;
        col?: number;
    };

    /** Precise range (begin/end includes offset and tokLen) */
    range?: CppRange;

    /** Child nodes */
    inner: CppAstNode[];

    /**
     * Root node may additionally carry: nodes from user includes aggregated here
     * (filled by filterToMainFileOnly(); also present in sample JSON)
     */
    headerUnits?: CppAstNode[];

    typeArguments?: string[];

    default?: string;

    parent?: CppAstNode;

    getParent?: {
        (isNeedInner: true): CppAstNode; // Requires full parent node (including inner)
        (isNeedInner?: false): CppAstNodeLite; // Lightweight snapshot (excluding inner)
    };

    access?: string;
    /** Reserved for future fields */
    [key: string]: unknown;
}

/** root type */
export interface CppTranslationUnit extends CppAstNode {
    kind: 'TranslationUnit' | 'TranslationUnitDecl';
    fileName?: string;
    headerUnits?: CppAstNode[];
    projectName?: string;
}
