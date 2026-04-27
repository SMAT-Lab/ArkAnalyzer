# Scene 数据结构

## 1. 概述

## 2. ArkIR

<!-- 源码及对应的ArkIR -->

## 3. 层次结构
<!-- 例如
```
Scene
 ├── ArkFile（源文件）
 │    ├── ArkNamespace（命名空间）
 │    │    ├── ArkClass → ArkMethod / ArkField
 │    │    └── 嵌套 ArkNamespace
 │    └── ArkClass（类/接口/枚举等）
 │         ├── ArkMethod（方法）
 │         │    └── ArkBody → CFG → BasicBlock → Stmt
 │         └── ArkField（字段）
 ├── SDK 文件（sdkArkFilesMap）
 └── ModuleScene（模块化项目的子场景）
```

各组件的详细说明：
- [ArkFile](./ArkFile.md) — 文件级抽象
- [ArkNamespace](./ArkNameSpace.md) — 命名空间
- [ArkClass](./ArkClass.md) — 类/接口/枚举
- [ArkMethod](./ArkMethod.md) — 方法/函数
- [ArkField](./ArkField.md) — 字段/属性
- [ArkBody](./ArkBody.md) — 方法体
- [CFG](./CFG.md) — 控制流图
- [Stmt](./Stmt.md) — 语句/表达式/引用
 -->
## 4. 核心数据结构

<!-- scene类的介绍，比如重要的属性等 -->

## 5. 主要接口

### 5.1 构建 Scene

### 5.2 查询接口


## 6. 使用示例

