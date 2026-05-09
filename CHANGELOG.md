# 更新日志

本文件记录 ArkAnalyzer 各发布版本的显著变更。
格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循 [语义化版本（SemVer）](https://semver.org/lang/zh-CN/)。

变更分类约定：

- **新增（Added）**：新功能、新接口、新分析算法、新支持的语言。
- **变更（Changed）**：已有行为的非破坏性调整、性能优化、文档结构变更。
- **弃用（Deprecated）**：标记为不再推荐使用、计划在未来版本删除的接口。
- **移除（Removed）**：本版本删除的接口或能力。
- **修复（Fixed）**：缺陷修复。
- **安全（Security）**：安全相关修复。

> 本日志条目基于 `package.json` 的 `version` 字段在 git 历史中的实际变更点回溯整理。早期 1.0.0/1.0.5/1.0.8 三个连续小版本以"npm 首次发布 + 紧随其后修补"的方式发布；1.0.8 → 1.0.86 跨越约 16 个月，承载了当前绝大部分核心能力，按主题归并展示。

---

## [Unreleased]

### 新增
- 文档体系完善：补全 [核心组件 10 篇](docs/components/) 与 [静态分析 5 篇](docs/analysis/) 全部正文内容。
- 新增 [`docs/MultiLanguageSupport.md`](docs/MultiLanguageSupport.md)：多语言能力矩阵与各语言相对 ArkTS 的 IR 差异说明。
- 根 `README.md` / `README.en.md` 补全"支持的使用场景（分语言）"小节。
- CHANGELOG 启用 Keep a Changelog 格式，并回溯整理已发布版本条目。

### 变更
- ArkIR 文本块在所有文档中统一使用 ` ```typescript ` 围栏，便于阅读与代码高亮。

---

## [1.0.87] - 2026-04-10

### 新增
- 通过 `oh-package.json5` 跨文件 / 跨模块解析支持鸿蒙第三方模块。
- C/C++ 前端：自适应解析 `.c` / `.cpp` / `.h` / `.hpp` 等扩展名（[`CXX_EXTENSION_SET`](src/utils/FileUtils.ts)）；补齐 CXX 修饰符（`VIRTUAL` / `PURE_VIRTUAL` / `FRIEND` / `MUTABLE` / `EXPLICIT` / `CONSTEXPR` 等）；CMake 构建脚本与 cppast dumper 构建指南。
- LRU 缓存机制减少重复解析开销。
- C++ 性能基准（benchmarks）。
- 包发布：vendor `ohos-typescript`，支持双 SDK 路径。

### 变更
- **CLI `cg` / `ir` 工作流重构**：稳定性加固、命令选项与语义对齐（详见 [README.md](README.md#arkanalyzer-命令行cli)）。
- 重复文件检查路径热点优化（`FileUtils` map-key 辅助函数避免在热路径反复构造 `FileSignature`）。
- 构造函数生成与 `super` 调用流程优化。
- 移除部分硬编码路径与冗余 `any` 类型。

### 修复
- 多处 TS 构建错误、`vitest` 在 `core_cpp` 上的门禁问题。
- C++ 文件路径配置与 pipeline 中 "C++ 解析进入 TS 流" 的分流 bug。
- bigint 打印与 debug 断言行为调整。

---

## [1.0.86] - 2026-03-19

### 新增

#### ArkUI / ViewTree
- ArkUI `pop` 函数类型推导支持。
- ArkUI `extend` 函数支持，并在类型推导阶段识别。
- 对话框 API 解析（`DIALOG_SHOW_PARSERS`）：`showAlertDialog` / `showActionSheet` / `CalendarPickerDialog` / `showDatePickerDialog` / `showTimePickerDialog` / `showTextPickerDialog` / `showToast` / `showDialog` / `showActionMenu`。
- `bindContentCover` API 解析与 `windowViewTree` 构建。
- ViewTree 虚拟根节点初始化。
- ArkUI `tabBar` / `navDestination` 组件建模。

#### 类型推导
- `setter` / `getter` 推导。
- 函数指针（`ptr Function`）支持。
- 闭包（含**多层嵌套方法**的闭包）支持。
- `import` 修饰符识别。
- `type` 别名支持泛型类型参数。
- `readonly` 操作符（含泛型 readonly）。
- 静态初始化块（static initializer block）。
- 参数属性（`constructor(public x: T)`）。
- 函数返回值类型推导。
- 枚举值类型 `EnumValueType`。
- 字面量类型重载匹配。
- 字段 `any` 类型与命名空间 export local。
- ArkUI `extend` 函数的类型推导路径。

#### 运行时与 SDK
- **方法重载支持**（`ModelUtils.isLanguageOverloadSupport`，目前主要服务 C/C++）。
- `taskpool` / `worker` SDK 方法支持。
- 内置类型（builtin）支持从配置文件加载。
- `Map.get`、`Array.from` 推导（含针对 `Array.from` 的优化路径）。
- 函数插件机制（`Function Plugin`）。
- 形参带初始化器（`function f(x = 1)`）支持。
- 数组解构 / 对象解构中的 omit element 与嵌套 rest element。
- spread / rest 语法。
- SBV（Sparse Bit Vector）能力支持。
- DVFG（Data Variable Flow Graph）。

#### 工具与流程
- API 文档生成（`npm run gendoc` → [docs/api_docs/](docs/api_docs/)）。
- Logger 支持同时输出文件与控制台。
- 上下文 dump 由配置控制。
- GitHub 镜像与 npm 发布流水线。

### 变更
- 大规模类型推导重构（`refactor type infer`）。
- `ohos-typescript` 升级到 OpenHarmony v5.0.0-Release。
- `postinstall` 脚本改为 JS 实现。
- 升级依赖到 train 8.0。

### 修复
- `fs.statSync` 异常处理与 CI postinstall 顺序问题。
- 代码风格与 SDK 顺序问题。
- 多处编译错误。

---

## [1.0.8] - 2024-11-14

### 新增
- 源码注释（comments）保留与解析支持。
- 多种 `Constant` 子类型派生（`Derive more Constant types`）。
- "未知调用点（unknown callsite）"建模，覆盖动态调用解析失败场景。
- `Scene.clear()` API、字段补丁（patching）接口。
- `Modifier` / `Decorator` 增删接口。
- 单节点自循环（self-loop）的循环识别支持。
- `IR2TS` 反向转换支持泛型。
- 性能测试基础设施 + 删除已过时 Scene API。

### 变更
- SDK 形参建模重构、SDK / API 中的匿名方法形参处理。
- 默认与未知名字（`%dflt`、`%unk`）短化、临时匿名类与方法名短化。
- `FileSignature.toMapKey()` 改为返回短字符串以减少 map key 大小。
- `Constant` 与动态调用建模重构（移除 dynamic call 中的 multi callees）。
- 相对路径转 Unix 路径函数减少调用次数（性能优化）。

### 修复
- `realType` 仍为 `GenericType` 的若干推导漏判。
- `propertyName` / `storage.get` 等若干小问题。
- `hvigorfile.js` 配置 typo。

---

## [1.0.5] - 2024-10-19

### 修复
- 紧随 1.0.0 的 npm 发布修补：包元信息与 vitest 运行模式调整。

---

## [1.0.0] - 2024-10-19

### 新增
- **首个 npm 发布版本**。开始通过 `npm publish` 对外提供 `arkanalyzer` 包。

### 已具备能力（首发基线）

> 本节描述首发时即已就位的核心能力，作为后续版本变更的参照。

#### 核心数据结构
- **三地址 ArkIR**：[Local / Constant / Ref / Expr](docs/components/IRBasics.md) 四大类 + [7 种 Stmt](docs/components/Stmt.md)。
- **方法体与 CFG**：[ArkBody](docs/components/ArkBody.md) 持有 [Cfg + BasicBlock](docs/components/CFG.md)，含基础 / 条件 / 循环 / Switch / 异常五类控制结构改写。
- **类成员模型**：[ArkField](docs/components/ArkField.md) / [ArkMethod](docs/components/ArkMethod.md) / [ArkClass](docs/components/ArkClass.md)，含 `%dflt` / `%instInit` / `%statInit` / `%AM` 等 IR 自动合成节点。
- **文件与项目层**：[ArkNamespace](docs/components/ArkNameSpace.md) / [ArkFile](docs/components/ArkFile.md) / [Scene](docs/components/Scene.md)。
- **类型别名（AliasType）**、**globalThis 常量**、**函数指针调用表达式（funcptr invoke）**、**操作数位置信息**、**`MayAlias` 分析骨架**。

#### 分析算法
- **类型推导**：[`scene.inferTypes()`](docs/analysis/TypeInference.md)（首发已支持泛型、组件 ArkUI struct）。
- **Def-Use Chain**：[`Cfg.buildDefUseChain()`](docs/analysis/Def-Use%20Chain.md)。
- **CallGraph**：CHA / RTA 双算法（[`CallGraphBuilder`](docs/analysis/CallGraph.md)）；含 hide-generated-method 选项与 CHA/RTA 边查询。
- **IFDS 数据流**：[`DataflowProblem<D>` / `DataflowSolver<D>`](docs/analysis/IFDS.md) + 早期 `UndefinedVariable` checker。
- **ArkUI ViewTree**：[`arkClass.getViewTree()`](docs/analysis/ViewTree.md)；首发即支持组件建模。

#### 多语言前端（首发覆盖）
- **ArkTS / TypeScript / JavaScript**：通过 TS Compiler API 解析。
- **C/C++ 前端骨架**：基础类型系统（`PointerType`、CXX 整型 / 浮点 / 字符）、独立 IR 转换流水线已就位。
- 详见 [docs/MultiLanguageSupport.md](docs/MultiLanguageSupport.md)。

---

## 历史版本

> 1.0.0 之前的开发版本未维护变更日志，请参考 [git 提交历史](https://github.com/openharmony-sig/arkanalyzer/commits) 了解早期变化（项目起始于 2023 年 11 月）。

[Unreleased]: https://github.com/openharmony-sig/arkanalyzer/compare/v1.0.87...HEAD
[1.0.87]: https://github.com/openharmony-sig/arkanalyzer/compare/v1.0.86...v1.0.87
[1.0.86]: https://github.com/openharmony-sig/arkanalyzer/compare/v1.0.8...v1.0.86
[1.0.8]: https://github.com/openharmony-sig/arkanalyzer/compare/v1.0.5...v1.0.8
[1.0.5]: https://github.com/openharmony-sig/arkanalyzer/compare/v1.0.0...v1.0.5
[1.0.0]: https://github.com/openharmony-sig/arkanalyzer/releases/tag/v1.0.0
