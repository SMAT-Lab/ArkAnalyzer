# ArkAnalyzer — 架构与模块参考

供深入模块定位时使用；日常开发优先读 `SKILL.md`。

> **Warning**: `src/index.ts` 末尾 `export { ts } from 'ohos-typescript'`。直接接触 TS AST/API 时，必须使用本仓库锁定的 **ohos-typescript fork**，**禁止**混用官方 `typescript` 包，否则类型不兼容。

## 架构总览

```
工程路径 / arkanalyzer.json / SceneConfig
  ↓ (Scene 层 — 工程入口、模块与 SDK、可见性、构建阶段)
  ┌─ Scene.ts / Config.ts   ← 分析会话的起点
  ↓ (frontend — 多语言 AST → IR)
  ┌─ frontend/FrontendBuilder     ArkTS → IR（ohos-typescript）
  │                               C/C++ → IR（cppFrontend，clang 驱动）
  ↓
  ┌─ core/base              IR 基元（表达式、语句、类型 …）
  │  core/model             ArkFile / ArkMethod / ArkClass / ArkBody
  │  core/common            横切能力（类型推理、常量、替换器 …）
  │  core/inference         类型/值推理管线
  ↓ (IR 模型)
  ┌─ core/graph             CFG / 支配树 / SCC / ViewTree
  │  core/dataflow          DataflowProblem / Solver / Fact
  │  callgraph              调用图 + 指针分析（CHA / RTA）
  │  pass                   Pass 调度框架（File / Class / Method 粒度）
  │  VFG                    依赖值流图（DVFG）
  ↓ (分析结果)
  ┌─ save / transformer     打印（Source/Json/Dot）、IR 变换（SSA）
  └─ index.ts               npm 包对外导出
```

## `src/` 模块地图

每个模块附**使用场景**，帮助快速定位切入位置。

| 路径 | 职责 | 何时关注 |
|------|------|---------|
| **Scene.ts / Config.ts** | 分析会话入口：`Scene` 持有工程全量 IR、类型、模块；`SceneConfig` 定义扫描参数 | 改工程加载逻辑、新增配置项、初始化流程 |
| **frontend/** | 多语言 AST → IR：`FrontendBuilder` 统一入口；`arktsFrontend/`（ohos-typescript）；`cppFrontend/`（clang 驱动，含独立 AST 解析 / IR 构建 / CFG 构建 / 推理） | 新增语言前端、改 C++/ArkTS 解析流程、改跨语言 IR 映射 |
| **core/base/** | IR 基元：表达式(`Expr`)、语句(`Stmt`)、类型(`Type`)、引用、`Local`、`Value` 等 | 新增 AST→IR 映射、改 IR 结构 |
| **core/model/** | 高层模型：`ArkFile` / `ArkClass` / `ArkMethod` / `ArkBody`；`builder/` 从 AST 构建 | 改文件/类/方法的 IR 表示 |
| **core/common/** | 横切：`Const` / `TSConst` / `EtsConst`、`TypeInference`、替换器、`VisibleValue`、`SdkUtils` | 类型推理、常量处理、跨模块工具 |
| **core/inference/** | `InferenceManager` 与类型/值推理管线（含 `arkts` / `abc` 子目录） | 涉及类型推理流程或新后端 |
| **core/graph/** | `Cfg`、`BasicBlock`、支配树、`SCC`、`ViewTree`、显式图基类 | 改控制流结构、图遍历、支配关系 |
| **core/dataflow/** | `DataflowProblem` / `Solver` / `Result` / `Fact`、未定义变量分析 | 新增数据流分析、改求解器 |
| **pass/** | `Pass` / `Dispatcher` / `ScenePassMgr` / `Context`，按 File/Class/Method 粒度调度 | 新增完整遍历逻辑 |
| **callgraph/** | `CallGraph`、`CallGraphBuilder`；`pointerAnalysis/`（PAG、Pts、配置）；CHA/RTA 算法 | 改调用图构建、指针分析、调用链 |
| **VFG/** | `DVFG` / `DVFGBuilder`（依赖值流图） | 值流 / 污点分析相关 |
| **save/** | `GraphPrinter` / `ViewTreePrinter` / `PrinterBuilder`，Source/Json/Dot 输出 | 改打印/序列化/输出格式 |
| **transformer/** | IR 变换，如 `StaticSingleAssignmentFormer`（SSA） | 新增 IR pass/变换 |
| **utils/** | `Logger`（`LOG_MODULE_TYPE`）、文件枚举、`AstTreeUtils`、`IntMap`、`PackedSparseMap` 等 | 通用工具、日志、性能敏感辅助结构 |
| **index.ts** | npm 包对外导出。**HomeCheck 等下游依赖此契约** | 改导出符号前须确认下游兼容性 |

