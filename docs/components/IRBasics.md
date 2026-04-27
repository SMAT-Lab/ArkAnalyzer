# IR 基础元素

## 1. 概述

<!-- ArkIR 采用三地址码形式，所有可出现在语句中的“值”统一抽象为 `Value`。本文档介绍 `Value` 的四类子类型 —— `Local`、`Constant`、`Ref`、`Expr`，它们是构造 `Stmt` 的基本积木。stmt 自身的组织与种类参见 [Stmt](./Stmt.md)。 -->

<!-- ```text
Value（值接口 —— 所有可出现在语句中的“值”）
 ├── Local（局部变量：用户变量、临时变量、参数、this）
 ├── Constant（常量：数字、字符串、布尔、null、undefined）
 ├── Expr（表达式：运算、调用、创建等）
 └── Ref（引用：字段访问、数组访问、参数引用、全局引用等）
``` -->

## 2. Local - 局部变量

<!-- local 的简单介绍 -->

<!-- ```text
Local
├── 用户变量          // 源码中显式声明的局部变量
├── 临时变量          // 三地址码拆分时生成的 $tempN
├── 参数变量          // parameter0、parameter1 ...
└── this 相关局部值   // 当前实例引用
``` -->

<!-- 根据 local 类型分章节介绍源码、对应的 ArkIR、类的定义（核心数据结构）、主要接口 -->


## 3. Constant - 常量

<!-- Constant 的简单介绍 -->

<!-- ```text
Constant
├── BooleanConstant     // true / false
├── NumberConstant      // 1 / 3.14
├── StringConstant      // "hello"
├── NullConstant        // null
└── UndefinedConstant   // undefined
``` -->

<!-- 根据 Constant 类型分章节介绍源码、对应的 ArkIR、类的定义（核心数据结构）、主要接口 -->


## 4. Ref - 引用

<!-- Ref 的简单介绍 -->

<!-- ```
AbstractRef
├── ArkArrayRef              // 数组元素: arr[index]
├── AbstractFieldRef         // 字段引用
│   ├── ArkInstanceFieldRef  // 实例字段: obj.<@Pkg/File: Class.field>
│   └── ArkStaticFieldRef    // 静态字段: <@Pkg/File: Class.staticField>
├── ArkParameterRef          // 参数（方法入口处赋初值）: parameter0
├── ArkThisRef               // this（方法入口处）
├── ArkCaughtExceptionRef    // catch 块捕获的异常对象
├── GlobalRef                // 全局变量
└── ClosureFieldRef          // 闭包捕获的变量
``` -->

<!-- 根据 Ref 类型分章节介绍源码、对应的 ArkIR、类的定义（核心数据结构）、主要接口 -->


## 5. Expr - 表达式

<!-- Expr 的简单介绍 -->

<!-- ```
Expr
├── 调用表达式
│   ├── ArkInstanceInvokeExpr      // 实例方法调用
│   ├── ArkStaticInvokeExpr        // 静态方法调用
│   └── ArkPtrInvokeExpr           // 函数指针调用
│
├── 对象创建表达式
│   ├── ArkNewExpr                 // 对象创建
│   └── ArkNewArrayExpr            // 数组创建
│
├── 运算表达式
│   ├── ArkNormalBinopExpr         // 普通二元运算
│   ├── ArkConditionExpr           // 条件表达式（三目）
│   └── ArkUnopExpr                // 一元运算
│
├── 类型相关表达式
│   ├── ArkCastExpr                // 类型转换
│   ├── ArkTypeOfExpr              // typeof 表达式
│   └── ArkInstanceOfExpr          // instanceof 表达式
│
└── 特殊表达式
    ├── ArkPhiExpr                 // Phi 函数（SSA）
    ├── ArkAwaitExpr               // 异步等待
    ├── ArkYieldExpr               // 生成器
    ├── ArkDeleteExpr              // 删除属性
    └── ArkAliasTypeExpr           // 类型别名表达式
``` -->

<!-- 根据 Expr 类型分章节介绍源码、对应的 ArkIR、类的定义（核心数据结构）、主要接口 -->
