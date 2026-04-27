# ArkAnalyzer 完整文档目录

### 快速开始

- [**快速入门指南**](./QuickStart.md) - 环境配置、项目构建、示例运行与常见分析能力。

### 核心组件
ArkAnalyzer 将项目代码抽象为层次化的 Scene 数据结构。以下文档按从整体到局部的顺序组织：

| 组件 | 说明 | 文档 |
|------|------|------|
| **Scene** | 项目级全局模型，管理文件、类和方法等结构 | [Scene](./components/Scene.md) |
| **ArkFile** | 单个源文件的抽象 | [ArkFile](./components/ArkFile.md) |
| **ArkNamespace** | 命名空间或模块作用域的抽象 | [ArkNamespace](./components/ArkNameSpace.md) |
| **ArkClass** | 类、接口、枚举等类型声明的抽象 | [ArkClass](./components/ArkClass.md) |
| **ArkMethod** | 方法或函数的抽象 | [ArkMethod](./components/ArkMethod.md) |
| **ArkField** | 类字段或属性的抽象 | [ArkField](./components/ArkField.md) |
| **ArkBody** | 方法体的 IR 容器 | [ArkBody](./components/ArkBody.md) |
| **CFG** | 方法内部的控制流图 | [CFG](./components/CFG.md) |
| **IRBasics** | ArkIR 值类型：Local / Constant / Ref / Expr | [IRBasics](./components/IRBasics.md) |
| **Stmt** | ArkIR 语句类型与表达形式 | [Stmt](./components/Stmt.md) |

**层次关系**：
```
Scene
 └── ArkFile（文件）
      ├── ArkNamespace（命名空间）
      │    ├── ArkClass → ArkMethod / ArkField
      │    └── 嵌套 ArkNamespace
      └── ArkClass（类）
          ├── ArkMethod（方法）
          │    └── ArkBody → CFG → BasicBlock → Stmt
          └── ArkField（字段）
```


### 静态分析
基于 Scene 和 CFG，ArkAnalyzer 提供以下分析能力。

| 分析能力 | 说明 | 文档 |
|----------|------|------|
| **类型推导** | 为 IR 中的变量和值推断类型 | [TypeInference](./analysis/TypeInference.md) |
| **Def-Use Chain** | 分析变量的定义和使用关系 | [Def-Use Chain](./analysis/Def-Use%20Chain.md) |
| **调用图 (CallGraph)** | 构建方法间调用关系 | [CallGraph](./analysis/CallGraph.md) |
| **数据流分析 (IFDS)** | 执行过程间数据流分析 | [IFDS](./analysis/IFDS.md) |
| **ArkUI ViewTree** | 分析 ArkUI 组件树与状态绑定关系 | [ViewTree](./analysis/ViewTree.md) |



### 开发指南

- [**如何创建 PR**](./contributing/HowToCreatePR.md) - 贡献代码的流程
- [**如何处理 Issues**](./contributing/HowToHandleIssues.md) - 问题报告和处理流程

### API 文档

- [**完整 API 参考**](./api_docs/globals.md) - 自动生成的接口参考
