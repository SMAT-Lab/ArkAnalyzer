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


/** 位置信息（行/列/偏移/长度） */
export interface CppPosition {
    line: number;
    col: number;
    offset?: number;   // 生成器会写 offset
    tokLen?: number;   // begin 有 tokLen
}

/** 源码范围 */
export interface CppRange {
    begin: CppPosition;
    end: CppPosition;
}

/** 类型信息 */
export interface CppTypeInfo {
    qualType: string;                // 主字段：unifyTypeStr 输出
    desugaredQualType?: string;
    typeAliasDeclId?: number;
    typeAliasDeclQualifiedName?: string;
}

/** DeclRef 的目标信息 */
export interface CppReferencedDecl {
    kind?: string;                    // VarDecl / ParamVarDecl / FunctionDecl ...
    name?: string;
    type?: CppTypeInfo;
}

/** CXXCtorInitializer 里专用的字段 */
export interface CppCtorAnyInit {
    kind: 'FieldDecl';
    name: string;
    type?: CppTypeInfo;
}

/** 通用 C++ AST 节点（兼容 Clang JSON ） */
export interface CppAstNode {
    /** 节点唯一 ID */
    id?: number | string;

    /** 节点种类（如 "TranslationUnit" / "FunctionDecl" / "CXXConstructExpr" 等） */
    kind: string;

    /** 节点名（函数/变量/类型/操作符名等） */
    name: string;

    /** 源码片段 */
    code: string;

    /** 类型信息 */
    type: CppTypeInfo;

    /** 修饰名（方法/构造/析构时由 getMemberInClassName 注入） */
    mangledName?: string;

    /** 标签：class/struct/union/enum（由 fillNodeKindTag 注入） */
    tagUsed?: string;

    /** 存放诸如 UsingDirective 的隐式标记 */
    isImplicit?: boolean;

    /** 存储类（例如成员 VarDecl 标记为 "static"） */
    storageClass?: string;

    /** DeclRef 解析出的目标信息 */
    referencedDecl?: CppReferencedDecl;

    /** 字面量值（IntegerLiteral/StringLiteral/BoolLiteral） */
    value?: string;

    /** 值类别（"prvalue"/"lvalue"...默认写 "prvalue"） */
    valueCategory?: string;

    /** 一些派生信息：一元/二元运算符 */
    opcode?: string;       // Binary / CompoundAssign / UnaryOperator
    isPostfix?: boolean;   // UnaryOperator

    /** MemberExpr 是否通过 -> 访问 */
    isArrow?: boolean;

    /** new[] 注解 */
    isArray?: boolean;
    arraySizes?: string[];

    /** 特殊表达式注解（trait/noexcept/typeid/atomic） */
    traitFunc?: string;
    traitArgs?: string;
    noexceptArg?: string;
    typeArg?: string;
    atomicFunc?: string;

    /** 伪析构表达式注解 */
    pseudoDestructorType?: string;

    /** goto -> label 的解析结果 */
    targetLabelId?: number;

    /** CXXCtorInitializer 专用 */
    anyInit?: CppCtorAnyInit; // 形如{ kind:"FieldDecl", name, type }
    baseInit?: CppTypeInfo; // 继承基类的初始化时使用

    /** 头文件/包含关系相关 */
    include?: boolean; // 节点来自 include 的用户头
    included?: string; // InclusionDirective时的宿主文件路径
    fileName?: string; // TranslationUnit/Include 的文件名
    locFile?: string; // 在locCursorKind 里写入的文件名

    /** 简单定位（行/列），有些节点不一定都有 */
    loc?: {
        file?: string;
        line?: number;
        col?: number;
    };

    /** 精确范围（begin/end 含 offset 与 tokLen） */
    range?: CppRange;

    /** 子节点 */
    inner: CppAstNode[];

    /**
     * 根节点会额外携带：把用户 include 的节点聚合在这里
     * （filterToMainFileOnly() 填充；样例 JSON 里也有）
     */
    headerUnits?: CppAstNode[];

    typeArguments?: string[];

    default: string;

    parent?: CppAstNode;

    access?: string;
    // /** 兼容未来新增字段 */
    [key: string]: unknown;
}

/** 根节点类型 */
export interface CppTranslationUnit extends CppAstNode {
    kind: 'TranslationUnit' | 'TranslationUnitDecl';
    fileName?: string;
    headerUnits?: CppAstNode[];
}
