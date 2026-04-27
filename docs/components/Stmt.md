# Stmt

## 1. 概述

<!-- 本文档介绍 ArkAnalyzer IR 中语句（`Stmt`）的组织方式与各类 stmt 的形态。stmt 引用的值类型（`Local`、`Constant`、`Ref`、`Expr`）参见 [IR 基础元素](./IRBasics.md)。 -->


## 2. stmt

<!-- stmt 的简单介绍 -->

<!-- ```typescript
Stmt
├── ArkAssignStmt              // 赋值语句
├── ArkInvokeStmt              // 方法调用语句
├── ArkIfStmt                  // 条件分支语句
├── ArkReturnStmt              // 返回语句
├── ArkReturnVoidStmt          // 无返回值语句
├── ArkThrowStmt               // 抛出异常语句
└── ArkAliasTypeDefineStmt     // 类型别名定义语句
``` -->

<!-- 根据 stmt 类型分章节介绍源码、对应的 ArkIR、类的定义（核心数据结构）、主要接口 -->


## 3. stmt 和各 IR 基础元素的关系


## 4. 使用示例
