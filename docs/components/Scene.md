# Scene 数据结构

## 1. 概述

**`Scene`** 是 ArkAnalyzer 的"项目根容器"——一次完整的静态分析以构造一个 `Scene` 实例为起点，所有 [`ArkFile`](./ArkFile.md)、[`ArkNamespace`](./ArkNameSpace.md)、[`ArkClass`](./ArkClass.md)、[`ArkMethod`](./ArkMethod.md)、SDK 索引、模块拓扑都挂在这里。`Scene` 同时承担：

1. **批量构建**：扫描项目目录，解析每个源文件成 `ArkFile`，再级联生成各级模型对象。
2. **全局索引**：以 `Map<string, T>` 形式保存所有签名 → 模型的反向索引（`filesMap` / `namespacesMap` / `classesMap` / `methodsMap` / `sdkArkFilesMap` / `sdkGlobalMap`），让按 [`Signature`](#43-签名与索引) 的 O(1) 查询成为可能。
3. **类型推导驱动**：`inferTypes()` 是后续所有静态分析（[CallGraph](../analysis/CallGraph.md)、[Def-Use Chain](../analysis/Def-Use%20Chain.md)、[DataFlow](../analysis/DataFlow.md)、[ViewTree](../analysis/ViewTree.md)）的前置步骤。
4. **构建阶段管理**：`SceneBuildStage` 枚举跟踪当前构建到了哪一步，避免重复工作。
5. **多模块组织**：鸿蒙工程通过 [`ModuleScene`](#44-modulescene-鸿蒙多模块) 把每个 `module` 抽成子作用域。

## 2. ArkIR

`Scene` 自身没有 IR 文本，它的 IR 体现就是它持有的所有 `ArkFile` 的 IR 文本之和。命令行：

```shell
npx arkanalyzer ir <project> -f text -o ./out
```

会按 `Scene.getFiles()` 的顺序把每个 `ArkFile` 的 IR 写到 `out/` 下，文件名沿用 `ArkFile.getFileSignature()` 的相对路径。下面用一段两文件的 mini 工程演示：

```typescript
// 工程 — myapp
// myapp/src/a.ts
export class Greeter {
    say(): string { return 'hi'; }
}

// myapp/src/main.ts
import { Greeter } from './a';
let g = new Greeter();
g.say();
```

```typescript
// Scene 全景（伪示意）
Scene @myapp {
  Files:
    @myapp/src/a.ts:
      class Greeter { say(): string { ... } }
      class %dflt { ... }

    @myapp/src/main.ts:
      Imports: Greeter from './a'
      class %dflt {
        Methods:
          %dflt(): void {
            %0 = new @myapp/src/a.ts: Greeter
            %0 = instanceinvoke %0.<@myapp/src/a.ts: Greeter.constructor()>()
            g = %0
            instanceinvoke g.<@myapp/src/a.ts: Greeter.say()>()
            return
          }
      }
}
```

## 3. 层次结构

`Scene` 把整个项目按 **文件 → 命名空间 → 类 → 方法 → 方法体 → CFG → BasicBlock → Stmt** 的顺序逐级容纳：

```text
Scene
 ├── ArkModule（模块，HAP/HSP/HAR，analyseByModule 路径产物）
 │    └── ArkFile（源文件）
 │         ├── ArkNamespace（命名空间，可嵌套）
 │         │    ├── ArkClass → ArkMethod / ArkField
 │         │    └── 嵌套 ArkNamespace
 │         └── ArkClass（类 / 接口 / 枚举 / struct / 对象字面量 / type literal / union）
 │              ├── ArkMethod（方法 / 函数 / %dflt / %instInit / %statInit / %AM）
 │              │    └── ArkBody → CFG → BasicBlock → Stmt（→ Local / Constant / Ref / Expr）
 │              └── ArkField（字段 / 枚举成员 / 索引签名 / 参数属性 / GET 访问器）
 ├── sdkArkFilesMap（SDK 文件，与项目代码同一套模型抽象）
 └── ModuleScene（鸿蒙多模块工程的子作用域，可选；buildScene4HarmonyProject 路径产物）
```

每一层的详细说明：

- [ArkModule](./ArkModule.md) — 模块层抽象（HAP/HSP/HAR），`analyseByModule` 路径产物，持有模块内 `ArkFile` 与模块依赖
- [ArkFile](./ArkFile.md) — 文件级抽象，含 import / export / 默认类
- [ArkNamespace](./ArkNameSpace.md) — 命名空间，可嵌套，同名合并
- [ArkClass](./ArkClass.md) — 类 / 接口 / 枚举 / struct / 对象字面量 / type literal / union（统一抽象）
- [ArkMethod](./ArkMethod.md) — 方法 / 函数 / 默认方法 / 初始化方法 / 匿名方法
- [ArkField](./ArkField.md) — 字段 / 枚举成员 / 索引签名 / 参数属性 / GET 访问器
- [ArkBody](./ArkBody.md) — 方法体（locals + cfg + traps + alias 表）
- [CFG](./CFG.md) — 控制流图（BasicBlock + 常规 / 异常控制流边）
- [Stmt](./Stmt.md) — 三地址 Stmt（7 种）
- [IRBasics](./IRBasics.md) — Local / Constant / Ref / Expr 等 IR 基础元素

## 4. 核心数据结构

### 4.1 Scene 关键字段

```typescript
// src/Scene.ts
export class Scene {
    private projectName: string = '';
    private projectFiles: string[] = [];
    private realProjectDir: string = '';
    private includeDirs: string[] = [];                                // C++ 头文件搜索路径

    private moduleScenesMap: Map<string, ModuleScene>;                 // 鸿蒙 module 子场景
    private modulePath2NameMap: Map<string, string>;
    private moduleSdkMap: Map<string, Sdk[]>;                          // module → SDK 列表
    private projectSdkMap: Map<string, Sdk>;                           // 项目级 SDK

    // 全局反向索引（key = signature.toString()）
    private filesMap: Map<string, ArkFile>;
    private namespacesMap: Map<string, ArkNamespace>;
    private classesMap: Map<string, ArkClass>;
    private methodsMap: Map<string, ArkMethod>;
    private sdkArkFilesMap: Map<string, ArkFile>;                      // SDK 文件
    private sdkGlobalMap: Map<string, ArkExport>;                      // SDK 顶层导出（如 globalThis 上的全局）

    private buildStage: SceneBuildStage = SceneBuildStage.BUILD_INIT;  // 当前构建阶段
    private fileLanguages: Map<string, Language>;                      // 路径 → 语言
    private options!: SceneOptions;

    // --- 分模块解析（analyseByModule）相关 ---
    private sceneConfig?: SceneConfig;                                 // 保留的构建配置，供后续模块级分析查询
    private moduleCanonicalizer: Canonicalizer<ArkModule>;             // ArkModule ↔ ModuleID 双向映射
    private moduleDepGraph?: ModuleDepGraph;                           // 模块依赖图
    private modulesRegistered: boolean = false;                        // 模块准备是否完成（幂等）
    private moduleCache?: ModuleCache;                                 // 跨调用复用的模块缓存
    private memoryMonitor?: MemoryMonitor;                             // 缓存驱逐用的内存监控

    private unhandledFilePaths: Set<string>;                           // 解析失败的项目文件
    private unhandledSdkFilePaths: string[];                           // 解析失败的 SDK 文件
    // ... oh-package.json5 / overRides / baseUrl 等鸿蒙模块字段省略
}
```

### 4.2 SceneBuildStage 构建阶段

```typescript
export enum SceneBuildStage {
    BUILD_INIT,        // 0 - 刚 new Scene
    SDK_INFERRED,      // 1 - SDK 类型推导完成
    CLASS_DONE,        // 2 - 所有类已生成（方法体未生成）
    METHOD_DONE,       // 3 - 所有方法体（含 ArkBody/CFG）生成完毕
    CLASS_COLLECTED,   // 4 - classesMap 索引完成
    METHOD_COLLECTED,  // 5 - methodsMap 索引完成
    TYPE_INFERRED,     // 6 - inferTypes() 完成（推荐分析起点）
}
```

| 阶段 | 由谁推进 | 说明 |
|------|---------|------|
| `BUILD_INIT` → `SDK_INFERRED` | 内部 SDK 加载 | 先把 SDK 类型推导，避免污染项目 |
| `SDK_INFERRED` → `CLASS_DONE` | `buildSceneFromProjectDir` 主流程 | 类骨架 + 字段 + 方法签名（无 body） |
| `CLASS_DONE` → `METHOD_DONE` | 主流程末段触发 `ArkMethod.buildBody()` | 方法体 + CFG 全部生成 |
| `METHOD_DONE` → `CLASS_COLLECTED` / `METHOD_COLLECTED` | 首次调用 `getClasses()` / `getMethods()` 时懒填充 | 全局索引按需建立 |
| `*` → `TYPE_INFERRED` | `scene.inferTypes()` | **下游分析的统一入口**；可被反复调用，但只有第一次推动阶段 |

`scene.buildClassDone()` 是常用快捷判断（`buildStage >= CLASS_DONE`）。

### 4.3 签名与索引

`Scene` 中所有"按签名查找"接口都把签名 `toString()` 作为 `Map` 的 key：

| Map | 键格式 | 备注 |
|-----|--------|------|
| `filesMap` | `@Pkg/relative/path.ts` | 项目内文件 |
| `sdkArkFilesMap` | `@Sdk/...` | 三方 / SDK 文件 |
| `namespacesMap` | `@Pkg/file: NS1.NS2` | 嵌套以 `.` 拼 |
| `classesMap` | `@Pkg/file: ClassName` 或 `@Pkg/file: NS.ClassName` | 命名空间内类带 NS 前缀 |
| `methodsMap` | `<@Pkg/file: ClassName.methodName(P1)>` | 与 IR 中调用语句签名一致 |
| `customComponentMap` | 组件简单名 → `ClassSignature` | 构建 `@Component` 时写入；模块 unload 后仍保留，供 ViewTree 建叶子节点 |

详细签名定义见 [src/core/model/ArkSignature.ts](../../src/core/model/ArkSignature.ts) 的 `FileSignature` / `NamespaceSignature` / `ClassSignature` / `MethodSignature` / `FieldSignature`。

### 4.4 ModuleScene（鸿蒙多模块）

鸿蒙工程经常包含多个 module（每个目录有自己的 `oh-package.json5`），`Scene` 会为每个 module 创建一个 `ModuleScene` 子场景。

```typescript
export class ModuleScene {
    private projectScene: Scene;
    private moduleName: string = '';
    private modulePath: string = '';
    private moduleFileMap: Map<string, ArkFile>;
    private moduleOhPkgFilePath: string = '';
    private ohPkgContent: { [k: string]: unknown } = {};
}
```

- `Scene.getModuleScene(name)` / `getModuleSceneMap()`：定位某个模块的子场景。
- 每个 `ArkFile.getModuleScene()` 反向指回所属 `ModuleScene`，可通过它查 `oh-package.json5`、解析模块依赖。

### 4.5 SceneConfig

`Scene` 的构建参数全部由 [`SceneConfig`](../../src/Config.ts) 提供，用户通常按以下两种方式之一：

```typescript
import { SceneConfig } from 'arkanalyzer';

// 方式 A：从项目目录构造
const config = new SceneConfig();
config.buildFromProjectDir('/path/to/project');

// 方式 B：从 JSON 配置文件构造（声明 SDK / 包含目录 / overrides 等）
const config2 = new SceneConfig();
config2.buildFromJson('./config.json');

console.log(config.getTargetProjectName(), config.getTargetProjectDirectory());
```

`SceneOptions`（可选）用来微调行为：是否启用类型推导、是否严格语法、是否解析 ArkUI 注解等。

其中 `memoryLimitMB` 用于 `analyseByModule` 的模块缓存管理：
- `memoryLimitMB`（默认 0=不限制）：进程内存上限（MB）。设为正值时，`analyseByModule` 会在加载模块前检查 RSS 是否超过上限，超限时自动卸载缓存中不需要的模块数据。

> `analyseByModule` 的完整用法见 [§6.5 模块级分析](#65-模块级分析)。

### 4.6 分模块解析相关数据结构

`Scene.analyseByModule` 走的是与 `buildSceneFromProjectDir` 不同的模块级构建路径，涉及以下用户可触达的数据结构：

#### ArkModule

模块层抽象（HAP/HSP/HAR），位于 `Scene` 与 `ArkFile` 之间。每个 `ArkModule` 持有模块标识、模块内 `ArkFile` 集合、模块依赖与加载状态。详细字段与查询接口见 [ArkModule.md](./ArkModule.md)。

#### ModuleType

模块归属类别，用于 `ModuleAnalysisConfig.setIncludeType` 按类型筛选目标模块：

| 值 | 名称 | 含义 |
|----|------|------|
| 0 | `PROJECT` | 工程内模块（HAP/HSP/HAR），来自 `build-profile.json5` |
| 1 | `SDK` | SDK 子模块 |
| 2 | `OH_MODULES` | `oh_modules` 下的三方依赖模块 |

#### ModuleLoadState / ModuleDepthLevel

二者一一对应、呈递进关系（每一层是上一层的超集）。`ModuleDepthLevel` 是调用 `analyseByModule` 时的**入参**（声明期望加载到哪一层），`ModuleLoadState` 是模块的**实际状态**（查询当前已加载到哪一层）：

| 层级 | 名称 | 含义 |
|------|------|------|
| META | 模块元数据 + 依赖拓扑 + ArkFile 路径级基本信息（除 index 文件外不读取源文件） |
| IMPORTS | META + 全部 ArkFile 的 export/import + 模块内文件依赖 |
| SIGNATURES | IMPORTS + 类/方法签名等，不含方法体 |
| BODIES | SIGNATURES + 方法体（ArkBody、CFG、Stmt/Expr） |

> 注：`ModuleDepthLevel` 与 `ModuleLoadState` 的层级含义相同，但 `ModuleLoadState` 额外含一个 `NOT_LOADED` 初始态，故其后续层级编号顺延 +1（`ModuleDepthLevel.META=0` 对应 `ModuleLoadState.META=1`）。

#### ModuleAnalysisConfig

`analyseByModule` 的可选配置，控制**目标模块选择**与**加载深度**。目标模块选择由三维组合：

```
模块是目标 ⟺ !excludedModuleIds.has(id)
             && (includedTypes.has(type) || targetModuleIds.has(id))
```

优先级：exclude > 类型过滤 / ID 包含（二者取并集）。三维均为集合，支持 O(1) 成员判定。

| 配置项 | 默认 | 说明 |
|--------|------|------|
| `setIncludeType(type, on)` | — | 按模块类型筛选目标（可叠加多个类型） |
| `setTargetModuleIds(ids)` / `addTargetModuleId(id)` | 空 | 显式按 `ModuleID` 追加目标（与类型过滤取并集） |
| `setExcludedModuleIds(ids)` / `excludeModuleId(id)` | 空 | 显式排除，优先级最高，覆盖类型过滤与 ID 包含 |
| `setLoadLevel(level)` | `BODIES` | **目标**模块加载深度 |
| `setDependencyLoadLevel(level)` | `SIGNATURES` | **依赖**模块（在闭包内但非目标）加载深度 |

> 不传 `config` 时，默认目标为全部 PROJECT 与 OH_MODULES 模块，目标加载到 `BODIES`、依赖加载到 `SIGNATURES`。

#### ModuleAnalysisCallback

```typescript
export type ModuleAnalysisCallback = (module: ArkModule, scene: Scene) => void;
```

每个**目标**模块加载完成后被回调一次，入参为该模块与所属 `Scene`。闭包内的依赖模块**不会**触发回调；SDK 模块在目标模块之前就绪、同样不进回调。

## 5. 主要接口

### 5.1 构建 Scene

| 方法 | 说明 |
|------|------|
| `new Scene()` | 空构造；接下来必须调用一种 build 方法 |
| `config(sceneConfig: SceneConfig)` | `analyseByModule` 的**轻量入口**：仅保存配置（项目名、根目录、SDK 列表、文件语言），不构建 `ArkFile`、不做类型推导 |
| `buildBasicInfo(config: SceneConfig)` | 仅装载 `SceneConfig` 字段（项目名、根目录、SDK 列表、includeDirs），不读源码 |
| `buildSceneFromProjectDir(config: SceneConfig)` | **最常用**。扫描项目目录、生成所有 `ArkFile` 与下属模型，递推到 `METHOD_DONE` |
| `buildSceneFromFiles(config: SceneConfig)` | 仅以 `config.getProjectFiles()` 为输入构建（省去文件扫描） |
| `buildScene4HarmonyProject()` | 鸿蒙工程入口：识别多 module、注入 `oh-package.json5`、加载 SDK、构建所有 `ModuleScene` |
| `buildModuleScene(name, path, exts)` | 单独构建某个鸿蒙 module |
| `analyseByModule(callback, config?)` | **模块级分析**：按拓扑序遍历目标模块并回调。配合 `scene.config()` 使用，详见 [§6.5](#65-模块级分析) |
| `dispose()` | 释放静态缓存（PointerAnalysisConfig / SdkUtils / ValueUtil / ModelUtils），可在 `Scene` 实例丢弃前调用 |
| `clear()` | 清空所有 `Map` 并重置 |

### 5.2 类型推导

| 方法 | 说明 |
|------|------|
| `inferTypes()` | **推荐入口**。完整推导：先填好 `methodsMap`、再按 ClassSignature/MethodSignature 顺序逐方法推。把所有 `Local` / `Ref` / `Expr` 的 `UnknownType` 替换成具体类型 |
| `inferTypesOld()` | 旧版兼容入口（已弃用，仅保留少量场景） |
| `inferSimpleTypes()` | 仅做简单局部推导（每个 stmt 内推 Local/Constant 类型，不跨方法）；速度快但精度有限 |

### 5.3 查询接口

按签名 / 名字 / 全集查询：

| 方法 | 说明 |
|------|------|
| `getFile(sig: FileSignature): ArkFile \| null` | 单个文件，按签名查（项目 + SDK 一起） |
| `getFiles(): ArkFile[]` | 项目内全部文件 |
| `getSdkArkFiles(): ArkFile[]` | SDK 文件 |
| `hasSdkFile(sig): boolean` | SDK 中是否存在该文件 |
| `getNamespace(sig): ArkNamespace \| null` | 单个命名空间 |
| `getNamespaces(): ArkNamespace[]` | 项目所有命名空间（含嵌套，去重后） |
| `getClass(sig): ArkClass \| null` | 单个类 |
| `getClasses(): ArkClass[]` | 项目所有类（含命名空间内、含默认类与匿名类） |
| `getMethod(sig, refresh?): ArkMethod \| null` | 单个方法；`refresh=true` 强制重建索引 |
| `getMethods(): ArkMethod[]` | 项目所有方法（含 generated） |
| `addToMethodsMap(method)` | 手动注入方法（IR 转换器使用） |
| `removeFile(f) / removeNamespace(ns) / removeClass(c) / removeMethod(m)` | 删除并解除索引 |
| `getSdkGlobal(name): ArkExport \| null` | 在 SDK 全局命名空间里查导出（如 `globalThis` 上的内置） |

工程信息：

| 方法 | 说明 |
|------|------|
| `getProjectName(): string` | 项目名（也是 `FileSignature` 的 `projectName`） |
| `getRealProjectDir(): string` | 项目根目录（绝对路径） |
| `getProjectFiles(): string[]` | 已纳入分析的源文件绝对路径列表 |
| `getFileLanguages(): Map<string, Language>` | 路径 → 语言的映射 |
| `getModuleScene(name) / getModuleSceneMap()` | 鸿蒙 module 子场景（`buildScene4HarmonyProject` 路径产物） |
| `getModules(): ArkModule[]` | 全部已注册的 `ArkModule`（`analyseByModule` 路径产物） |
| `getModule(id): ArkModule \| undefined` | 按 `ModuleID` 取模块 |
| `getModuleId(module): ModuleID` | 取模块的 `ModuleID` |
| `getModuleCount(): number` | 已注册模块总数 |
| `getModuleDepGraph(): ModuleDepGraph \| undefined` | 模块依赖图 |
| `isModulesRegistered(): boolean` | 模块准备是否完成 |
| `getProjectSdkMap() / getModuleSdkMap()` | SDK 配置 |
| `getOptions() / getOverRides() / getOverRideDependencyMap()` | 配置项与依赖 override |
| `getOhPkgContent() / getOhPkgContentMap() / getOhPkgFilePath()` | `oh-package.json5` 内容 |
| `getStage() / getBuildStage(): SceneBuildStage` | 当前构建阶段 |
| `buildClassDone(): boolean` | `buildStage >= CLASS_DONE` |
| `getUnhandledFilePaths() / getUnhandledSdkFilePaths()` | 解析失败的文件 |
| `getEntryPoints(): MethodSignature[]` | 入口方法集合（`@Entry`、`main`、`%dummyMain` 等） |
| `hasMainMethod(): boolean` | 是否有显式 `main` |
| `getVisibleValue(): VisibleValue` | 当前作用域可见值表（构建期使用） |
| `setFile(file: ArkFile)` | 注册文件（构建器内部调用） |

### 5.4 分析快捷入口

| 方法 | 说明 |
|------|------|
| `makeCallGraphCHA(entryPoints): CallGraph` | 基于 CHA 算法构造 [CallGraph](../analysis/CallGraph.md) |
| `makeCallGraphRTA(entryPoints): CallGraph` | 基于 RTA 算法构造 CallGraph |

## 6. 使用示例

### 6.1 经典三步走

```typescript
import { Scene, SceneConfig, SceneBuildStage, Language } from 'arkanalyzer';

// 1) 配置
const config = new SceneConfig();
config.buildFromProjectDir('tests/resources/save');

// 2) 构建
const scene = new Scene();
scene.buildSceneFromProjectDir(config);

// 3) 推导类型（强烈建议——所有下游分析的前置）
scene.inferTypes();

console.log(`stage = ${SceneBuildStage[scene.getStage()]}`);
console.log(`project = ${scene.getProjectName()} @ ${scene.getRealProjectDir()}`);

// 项目概览
console.log('files:    ', scene.getFiles().length);
console.log('namespaces:', scene.getNamespaces().length);
console.log('classes:  ', scene.getClasses().length);
console.log('methods:  ', scene.getMethods().length);

// 按语言分组
const byLang = new Map<string, number>();
for (const f of scene.getFiles()) {
    const lang = Language[f.getLanguage()];
    byLang.set(lang, (byLang.get(lang) ?? 0) + 1);
}
for (const [lang, n] of byLang) console.log(`  ${lang}: ${n}`);
```

### 6.2 按签名直查

```typescript
import { ClassSignature, FileSignature, MethodSignature } from 'arkanalyzer';

// 通过 ArkFile 取它的 FileSignature，再回查 Scene
const fs: FileSignature = scene.getFiles()[0].getFileSignature();
const sameFile = scene.getFile(fs);

// 通过类签名直查
const csig: ClassSignature = sameFile!.getClasses()[0].getSignature();
const cls = scene.getClass(csig);

// 通过方法签名直查（含重载）
const msig: MethodSignature = cls!.getMethods()[0].getSignature();
const mtd = scene.getMethod(msig);

console.log(mtd?.getName(), mtd?.getCfg()?.getStmts().length);
```

### 6.3 鸿蒙多模块

```typescript
const cfg = new SceneConfig();
cfg.buildFromJson('./harmony-config.json');     // 含 SDK 路径与 module 列表

const scene = new Scene();
scene.buildScene4HarmonyProject();              // 自动识别多 module
scene.inferTypes();

for (const [name, ms] of scene.getModuleSceneMap()) {
    console.log(`module ${name} @ ${ms.getModulePath?.() ?? ''}`);
}
```

### 6.4 直接构造 CallGraph

```typescript
const cg = scene.makeCallGraphRTA(scene.getEntryPoints());
console.log('reachable methods:', cg.getReachableMethods().length);
```

### 6.5 模块级分析

`Scene.analyseByModule` 提供按**模块**粒度的增量分析入口，适合鸿蒙多模块工程。与 `buildSceneFromProjectDir` 一次性把整个项目构建到 `METHOD_DONE` 并常驻内存不同，它**逐模块**推进：按模块依赖的拓扑序依次处理每个目标模块，处理完即可释放其内存，从而把峰值内存控制在单模块量级。

每个目标模块的处理流程为：

1. **构建 ArkModule 数据**——按 `ModuleAnalysisConfig` 声明的加载深度，构建该模块的 `ArkFile` / 类 / 方法签名 / 方法体（CFG、Stmt）等数据；
2. **模块内类型推导**——对该模块内的文件执行类型推导（等价于 `Scene.inferTypes` 的单模块版本，加载深度达到 `SIGNATURES` 及以上时执行），使模块内类型可用；
3. **按上层应用回调分析模块**——将该 `ArkModule` 与 `Scene` 传入 `ModuleAnalysisCallback`，由上层应用完成所需分析；
4. **从内存卸载模块**——分析完成且不再被后续模块依赖时，该模块数据可从内存释放。设定 `SceneOptions.memoryLimitMB` 后，框架会在加载下一模块前按需卸载缓存中不再需要的模块以守住内存上限；未设定时模块数据保留在缓存中供跨调用复用。

使用前置：以 `scene.config(sceneConfig)` 为轻量入口（仅保存配置，不构建 `ArkFile`）；由 `ModuleAnalysisConfig` 声明**目标模块**（哪些模块要深分析）与**加载深度**（目标 / 依赖各加载到哪一层）。SDK 模块在目标模块之前就绪、不进回调；闭包内的依赖模块也不进回调（仅加载到 `dependencyLoadLevel` 供目标模块引用）。重复调用复用已加载的模块数据，并按需升级到更高层级。

配置项与数据结构详见 [§4.6 分模块解析相关数据结构](#46-分模块解析相关数据结构)，`ArkModule` 查询接口见 [ArkModule.md](./ArkModule.md)。

#### 场景一：一次全量分析

适合工程规模可控、需要一次性拿到全部目标模块完整方法体的场景。下面以全部 PROJECT 模块为目标、加载到 `BODIES`：

```typescript
import {
    Scene,
    SceneConfig,
    ModuleAnalysisConfig,
    ModuleType,
    ModuleDepthLevel,
} from 'arkanalyzer';

// 1) 轻量入口：仅保存配置，不构建 ArkFile
const sceneConfig = new SceneConfig();
sceneConfig.buildFromProjectDir('/path/to/project');
const scene = new Scene();
scene.config(sceneConfig);

// 2) 配置：目标 = 全部 PROJECT 模块，加载到 BODIES
const config = new ModuleAnalysisConfig();
config.setIncludeType(ModuleType.PROJECT, true);
config.setLoadLevel(ModuleDepthLevel.BODIES);

// 3) 一次调用，回调内遍历每个目标模块
scene.analyseByModule((module, scn) => {
    console.log(`module: ${module.getModuleName()} @ ${module.getModulePath()}`);
    for (const arkFile of module.getFilesMap().values()) {
        for (const arkClass of arkFile.getClasses()) {
            console.log(`  class: ${arkClass.getName()}`);
        }
    }
}, config);
```

#### 场景二：先轻量发现模块列表，再聚焦分析少数模块

适合工程较大、只关心其中几个模块的场景。先用最低深度（`META`）跑一遍拿到全部模块元数据，筛出感兴趣的模块 ID，再针对它们做深度分析：

```typescript
import {
    Scene,
    SceneConfig,
    ModuleAnalysisConfig,
    ModuleType,
    ModuleDepthLevel,
} from 'arkanalyzer';

const sceneConfig = new SceneConfig();
sceneConfig.buildFromProjectDir('/path/to/project');
const scene = new Scene();
scene.config(sceneConfig);

// 阶段一：轻量发现——META 深度（仅模块元数据与依赖拓扑，不解析源文件），空回调
const discovery = new ModuleAnalysisConfig();
discovery.setIncludeType(ModuleType.PROJECT, true);
discovery.setLoadLevel(ModuleDepthLevel.META);
discovery.setDependencyLoadLevel(ModuleDepthLevel.META);
scene.analyseByModule(() => {}, discovery);

// 此时模块已全部注册，scene.getModules() 可枚举元数据
const modules = scene.getModules();
for (const m of modules) {
    console.log(
        `discovered: ${ModuleType[m.getModuleType()]} ${m.getModuleName()} @ ${m.getModulePath()}`
    );
}

// 按需筛出感兴趣的少数模块（此处以模块名后缀为例），取其 ModuleID
const interestedIds = modules
    .filter(m => m.getModuleName().endsWith('feature'))
    .map(m => scene.getModuleId(m));

if (interestedIds.length === 0) {
    console.log('no interested module found');
} else {
    // 阶段二：聚焦深分析——仅这几个目标模块加载到 BODIES，其依赖默认加载到 SIGNATURES
    const focused = new ModuleAnalysisConfig();
    focused.setTargetModuleIds(interestedIds);
    focused.setLoadLevel(ModuleDepthLevel.BODIES);

    scene.analyseByModule((module, scn) => {
        console.log(`analyzing: ${module.getModuleName()}`);
        for (const arkFile of module.getFilesMap().values()) {
            for (const arkClass of arkFile.getClasses()) {
                for (const arkMethod of arkClass.getMethods()) {
                    console.log(`  method: ${arkMethod.getName()}`);
                }
            }
        }
    }, focused);
}
```

> 与 `buildSceneFromProjectDir` 的选型：项目规模小、需要全量模型与全局类型推导时用 `buildSceneFromProjectDir` + `inferTypes()`；鸿蒙多模块工程、只需部分模块或希望按深度增量分析时用 `analyseByModule`。可运行示例参考 [tests/unit/AnalyseByModule.test.ts](../../tests/unit/AnalyseByModule.test.ts) 与 [tests/samples/ModuleAnalyseTest.ts](../../tests/samples/ModuleAnalyseTest.ts)。

> 完整可运行示例可参考：[tests/samples/SceneTest.ts](../../tests/samples/SceneTest.ts)、[tests/samples/CfgTest.ts](../../tests/samples/CfgTest.ts)、[tests/samples/CallGraphTest.ts](../../tests/samples/CallGraphTest.ts)。
> 命令行：`npx arkanalyzer ir <project> -f text -o ./out` 把整个 Scene 的 IR 全量导出，每个 `ArkFile` 一份文本。
