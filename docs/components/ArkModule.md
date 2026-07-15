# ArkModule 数据结构

## 1. 概述

**`ArkModule`** 是 ArkAnalyzer 中「模块」层级的数据抽象，位于 [`Scene`](./Scene.md) 与 [`ArkFile`](./ArkFile.md) 之间，对应鸿蒙工程中的一个 **HAP / HSP / HAR 模块**（即一个带 `oh-package.json5` 的目录）。它在 [`Scene.analyseByModule`](./Scene.md#65-模块级分析) 模块级分析流程中被创建，是按模块粒度遍历与查询工程代码的入口。

一个 `ArkModule` 持有：

1. **模块标识**：模块绝对路径（主标识）与 `oh-package.json5` 中的模块名。
2. **文件集合**：该模块下所有源文件的 `ArkFile`（按 `FileSignature.toMapKey()` 索引）。
3. **模块依赖**：本模块通过 `oh-package.json5` 声明的、对其它模块的依赖关系（按别名解析到被依赖模块的 `ModuleID`）。
4. **加载状态**：当前模块已构建到哪一层数据深度（由 [`ModuleLoadState`](#22-moduleloadstate) 标记）。
5. **模块类型**：模块归属类别（[`ModuleType`](#21-moduletype)：PROJECT / SDK / OH_MODULES）。

> **与 `ModuleScene` 的关系**：`ModuleScene` 是早期 `buildScene4HarmonyProject` 路径使用的模块子场景抽象；`ArkModule` 是 `analyseByModule` 引入的新模块层。二者并存——每个 [`ArkFile`](./ArkFile.md) 同时持有 `getModuleScene()` 与 `getArkModule()` 两个反向引用，按所用构建入口取用。新代码推荐使用 `ArkModule`。

## 2. 关键枚举

### 2.1 ModuleType

模块归属类别：

| 值 | 名称 | 含义 |
|----|------|------|
| 0 | `PROJECT` | 工程内模块（HAP/HSP/HAR），来自 `build-profile.json5` |
| 1 | `SDK` | SDK 子模块（如 `openharmony/ets/api`、`ets/kits`） |
| 2 | `OH_MODULES` | `oh_modules` 下的三方依赖模块 |

`ModuleType` 主要用于 [`ModuleAnalysisConfig.setIncludeType`](./Scene.md#46-分模块解析相关数据结构) 按类型筛选目标模块。

### 2.2 ModuleLoadState

模块的数据加载深度，与 [`ModuleDepthLevel`](#23-moduledepthlevel) 一一对应、呈递进关系（每一层是上一层的超集）：

| 值 | 名称 | 含义 |
|----|------|------|
| 0 | `NOT_LOADED` | 尚未加载 |
| 1 | `META` | 模块元数据 + 依赖拓扑 + ArkFile 路径级基本信息 |
| 2 | `IMPORTS` | META + 全部 ArkFile 的 export/import 信息 + 模块内文件依赖 |
| 3 | `SIGNATURES` | IMPORTS + ArkFile 内容（命名空间、类、方法签名、参数、返回类型），不含方法体 |
| 4 | `BODIES` | SIGNATURES + 方法体（ArkBody、CFG、Stmt/Expr） |

可通过 `module.getLoadState()` 查询当前模块已加载到哪一层。

### 2.3 ModuleDepthLevel

调用 `Scene.analyseByModule` 时用于**声明**目标模块 / 依赖模块期望加载到哪一层（是 `ModuleLoadState` 的入参视角）：

| 值 | 名称 | 含义 |
|----|------|------|
| 0 | `META` | 仅模块元数据与依赖拓扑；除 index 文件外不读取/解析源文件 |
| 1 | `IMPORTS` | META + 全部 ArkFile 的 export/import 与模块内文件依赖 |
| 2 | `SIGNATURES` | IMPORTS + 类/方法签名等，不含方法体 |
| 3 | `BODIES` | SIGNATURES + 方法体（CFG、Stmt/Expr） |

## 3. 公共查询接口

`ArkModule` 的构造与状态推进由 `Scene.analyseByModule` 内部完成，用户侧主要做**只读查询**。按用途分组：

### 3.1 模块标识

| 方法 | 说明 |
|------|------|
| `getModulePath(): string` | 模块绝对路径（主标识） |
| `getModuleName(): string` | 模块名（`oh-package.json5` 中的 `name`，如 `@ohos/entry`） |
| `getOhPkgPath(): string` | 该模块 `oh-package.json5` 的绝对路径 |
| `readOhPkgContent(): object` | 按需读取并解析 `oh-package.json5`，文件不存在时返回 `{}` |
| `getScene(): Scene` | 所属 `Scene` 反向引用 |

### 3.2 状态与类型

| 方法 | 说明 |
|------|------|
| `getLoadState(): ModuleLoadState` | 当前已加载到的数据深度 |
| `getModuleType(): ModuleType` | 模块归属类别 |

### 3.3 文件

| 方法 | 说明 |
|------|------|
| `getFilesMap(): Map<string, ArkFile>` | 模块内全部 `ArkFile`，key 为 `FileSignature.toMapKey()` |

### 3.4 模块依赖

下列依赖查询读取 `Scene` 维护的模块依赖图，依赖图未构建时返回空数组。

| 方法 | 说明 |
|------|------|
| `getDependencies(): ArkModule[]` | 本模块**直接依赖**的模块列表（后继） |
| `getDependents(): ArkModule[]` | **直接依赖本模块**的模块列表（前驱） |
| `resolveDependencyAlias(alias): ModuleID \| undefined` | 按依赖别名解析到被依赖模块的 `ModuleID` |
| `getDependencyAliasToId(): Map<string, ModuleID>` | 别名 → 被依赖模块 ID 的映射（只读，勿修改） |

### 3.5 模块内文件依赖图

| 方法 | 说明 |
|------|------|
| `getFileDepGraph(): FileDepGraph \| undefined` | 模块内文件依赖图（未分析时为 `undefined`） |
| `hasFileTopoOrder(): boolean` | 文件依赖分析是否已产出拓扑序 |

## 4. 使用示例

配合 `Scene.analyseByModule` 在回调中遍历模块内容：

```typescript
import {
    Scene,
    SceneConfig,
    ModuleAnalysisConfig,
    ModuleType,
    ModuleLoadState,
    ModuleDepthLevel,
} from 'arkanalyzer';

const sceneConfig = new SceneConfig();
sceneConfig.buildFromProjectDir('/path/to/project');
const scene = new Scene();
scene.config(sceneConfig);

const config = new ModuleAnalysisConfig();
config.setIncludeType(ModuleType.PROJECT, true);
config.setLoadLevel(ModuleDepthLevel.BODIES);

scene.analyseByModule((module, scn) => {
    console.log(`module: ${module.getModuleName()} @ ${module.getModulePath()}`);
    console.log(
        `  type: ${ModuleType[module.getModuleType()]}, state: ${ModuleLoadState[module.getLoadState()]}`
    );

    // 依赖关系
    for (const dep of module.getDependencies()) {
        console.log(`  depends on: ${dep.getModuleName()}`);
    }

    // 模块内文件
    for (const arkFile of module.getFilesMap().values()) {
        console.log(`  file: ${arkFile.getName()}`);
    }
}, config);
```

> 模块级分析的完整说明（目标模块选择、加载深度、两阶段用法等）见 [Scene.md §6.5 模块级分析](./Scene.md#65-模块级分析)。
