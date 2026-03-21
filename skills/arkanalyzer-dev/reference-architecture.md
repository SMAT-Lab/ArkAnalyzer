# ArkAnalyzer — 架构与目录参考

供深入模块定位时使用；日常优先读 `SKILL.md`。

## 架构总览

ArkAnalyzer 将 **ohos-typescript** 解析得到的 ArkTS/TS **AST**，经 builder 转为 **Ark IR**  
（`core/base` + `core/model`：语句/类型/文件/类/方法等），汇总到 **`Scene`**（`Scene.ts`）  
——即**被分析工程在内存中的整体视图**。

在此基础上叠加 **CFG/图**、**数据流**、**调用图与指针分析**、**Pass 遍历**、**打印与序列化**等能力。

典型依赖方向（自上而下抽象层级，非严格导入图）：

```text
工程路径 / arkanalyzer.json / SceneConfig
        → Scene（工程入口、模块与 SDK、可见性、类型与 IR 构建阶段）
        → ArkFile / ArkMethod / ArkBody …（模型层）
        → Cfg / Dataflow / CallGraph / PointerAnalysis / Pass / DVFG …（分析层）
        → Printer / Json / Dot / Source（输出层）
```

---

## Scene 与配置

- **`Scene`**（`src/Scene.ts`）  
  分析会话核心：工程文件、模块场景、SDK、可见值、类型推理阶段等。  
  语义上应能据 Scene 还原工程代码；下游多从中取 `ArkFile`、`ArkMethod`、调用图等。

- **`SceneConfig`**（`src/Config.ts`）  
  目标工程目录、Ets/SDK、`tsconfig`、选项（扩展名、忽略路径、built-in）。  
  与 **`config/arkanalyzer.json`** 默认项合并；`CONFIG_FILENAME` 指向该文件。

- **`SceneOptions`**（同 `Config.ts`）  
  如 `supportFileExts`、`ignoreFileNames`、`enableBuiltIn`、`sdkGlobalFolders`、`tsconfig`。  
  与发布后 `config/arkanalyzer.json` 字段对应。

**默认配置**：根目录 `config/arkanalyzer.json`（如 `.ets`/`.ts`、忽略 `oh_modules`/`node_modules`、`tsconfig` 名等）。

宿主集成常先构造 `SceneConfig`，再初始化 `Scene`（`new Scene(...)` 或等价流程）。

---

## `src/` 模块地图

- **入口**  
  `Scene.ts`、`Config.ts`：场景与配置（见上节）。

- **`core/base/`**  
  IR 基元：类型、表达式、语句、引用、位置、`Local`、`Value` 等。

- **`core/model/`**  
  `ArkFile`/`ArkClass`/`ArkMethod`/`ArkBody`、签名及 `builder/`：从 AST/IR 构建模型。

- **`core/common/`**  
  `Const`/`TSConst`/`EtsConst`、替换器、`TypeInference`、`VisibleValue`、`SdkUtils`、`IRInference` 等横切逻辑。

- **`core/inference/`**  
  `InferenceManager` 等与类型/值推理管线协作（含 `arkts`、`abc` 等子目录）。

- **`core/graph/`**  
  `Cfg`、`BasicBlock`、支配、`SCC`、`ViewTree`、显式图基类等。

- **`core/dataflow/`**  
  `DataflowProblem`/`Solver`/`Result`、`Fact`、`UndefinedVariable*` 等。

- **`pass/`**  
  `Pass`、`Dispatcher`、`ScenePassMgr`、`Context`；按 File/Class/Method 等粒度调度。

- **`callgraph/`**  
  `CallGraph`、`CallGraphBuilder`；`pointerAnalysis/`（PAG、Pts、配置）；算法（如 CHA、RTA）。

- **`VFG/`**  
  `DVFG`、`DVFGBuilder`（数据流图构建；见 `index.ts` 导出）。

- **`save/`**  
  Source/Json/Dot 打印，`GraphPrinter`、`ViewTreePrinter`、`PrinterBuilder` 等。

- **`transformer/`**  
  SSA 等 IR 变换（如 `StaticSingleAssignmentFormer`）。

- **`utils/`**  
  `Logger`（`LOG_MODULE_TYPE`）、路径与文件枚举、`AstTreeUtils`、`json5parser`、  
  `callGraphUtils`、`entryMethodUtils`、`IntMap`、`PackedSparseMap` 等。

- **`index.ts`**  
  **npm 包对外导出**：各模块稳定 public API；HomeCheck 等下游主要依赖此契约。

**解析器出口**：`index.ts` 末尾 **`export { ts } from 'ohos-typescript'`**。

直接接触 TS AST/API 时须与全仓使用**同一 ohos-typescript fork**，勿混用官方 `typescript` 版本。

---

## 仓库根目录（与 `src` 协作）

| 路径 | 说明 |
|------|------|
| `config/` | 默认 **arkanalyzer.json** 等，随包发布（`package.json` 的 `files` 含 `config`）。 |
| `script/` | 构建辅助（如 `npmInstall.js`、与 `prebuild` 等脚本配合）。 |
| `lib/` | **`tsc`/`tsconfig.prod` 产物**（通常不手改；`.gitignore` 忽略时以本地构建为准）。 |
| `tsconfig.json` / `tsconfig.prod.json` | 开发与发布编译选项。 |
| `tests/` | 见下文。 |

---

## 测试目录（本仓库）

| 路径 | 说明 |
|------|------|
| `tests/unit/` | 单元测试，与 `src` 能力点对应（模型、图、数据流、保存、调用图等子目录）。 |
| `tests/samples/` | 可执行样例/演示脚本。 |
| `tests/resources/` | 按场景的 **ArkTS/ets**、工程片段、**json** 输入。大规模资源须遵守仓库约定。 |

---

## 与 HomeCheck 的关系

**HomeCheck**（独立仓库）依赖本包 **`arkanalyzer`**（`lib`、`config`、类型），侧实现 **Checker / ruleSet**。

若改动 **`index.ts` 导出**、**Scene** 或 **IR 形状**，须在 HomeCheck 回归。

必要时按 `SKILL.md`「**HomeCheck 兼容性验证**」：`npm pack` 后对端 `npm run test`。
