# ArkAnalyzer 文档中心（`docs/`）


## 1. 目录组织

`docs/` 下共 **6** 个子目录，以及若干顶层 `.md` 文件：

| 路径 | 内容 |
|------|------|
| [`components/`](./components/) | **核心组件** 10 篇——Scene 数据结构层级模型 |
| [`analysis/`](./analysis/) | **静态分析** 5 篇——TypeInference / Def-Use / CallGraph / IFDS / ViewTree |
| [`cppFrontend/`](./cppFrontend/) | C/C++ 前端用户指南、构建指南 |
| [`contributing/`](./contributing/) | 贡献流程（PR / Issue 提交规范） |
| [`api_docs/`](./api_docs/) | typedoc 自动生成的 API 参考（`npm run gendoc` 产物，**不要手工编辑**） |
| [`images/`](./images/) | 项目级配图 |
| 顶层 .md | QuickStart、MultiLanguageSupport、SIG 说明等通用文档 |

## 2. 文件清单

### 2.1 入门

| 文档 | 说明 |
|------|------|
| [QuickStart.md](./QuickStart.md) | 环境配置、Scene 构建、各分析能力的最小可运行示例 |

### 2.2 核心组件（`components/`）

按「自上而下」的层级顺序：

| 层级 | 文档 | 说明 |
|------|------|------|
| 项目 | [Scene.md](./components/Scene.md) | 项目级全局模型，全局索引 + 构建管线 |
| 文件 | [ArkFile.md](./components/ArkFile.md) | 单个源文件抽象（含 Language 枚举、import/export） |
| 命名空间 | [ArkNameSpace.md](./components/ArkNameSpace.md) | `namespace` 抽象，可嵌套、同名合并 |
| 类型 | [ArkClass.md](./components/ArkClass.md) | 类 / 接口 / 枚举 / struct / 对象字面量 / type literal / union |
| 方法 | [ArkMethod.md](./components/ArkMethod.md) | 方法 / 函数 / `%dflt` / `%instInit` / `%statInit` / `%AM` |
| 字段 | [ArkField.md](./components/ArkField.md) | 字段 / 枚举成员 / 索引签名 / 参数属性 / GET 访问器 |
| 方法体 | [ArkBody.md](./components/ArkBody.md) | locals / cfg / traps / aliasTypeMap |
| CFG | [CFG.md](./components/CFG.md) | 控制流图（Cfg + BasicBlock）+ 5 类控制结构改写 |
| 语句 | [Stmt.md](./components/Stmt.md) | 7 种 Stmt 子类 + def/use 关系 |
| IR 值 | [IRBasics.md](./components/IRBasics.md) | Local / Constant / Ref / Expr 四大类 IR 基础元素 |

### 2.3 静态分析（`analysis/`）

| 文档 | 说明 |
|------|------|
| [TypeInference.md](./analysis/TypeInference.md) | 类型推导（`scene.inferTypes()`），其他分析的前置 |
| [Def-Use Chain.md](./analysis/Def-Use%20Chain.md) | 定义-使用链（`Cfg.buildDefUseChain()`） |
| [CallGraph.md](./analysis/CallGraph.md) | 调用图（CHA / RTA 双算法 + DOT/JSON 导出） |
| [IFDS.md](./analysis/IFDS.md) | 过程间数据流（4 类 FlowFunction + PathEdge） |
| [ViewTree.md](./analysis/ViewTree.md) | ArkUI 组件树 + 状态绑定 |

### 2.4 多语言与 C/C++ 前端

| 文档 | 说明 |
|------|------|
| [MultiLanguageSupport.md](./MultiLanguageSupport.md) | ArkTS 1.1/1.2、TypeScript、JavaScript、C/C++、ABC 各前端能力矩阵与 IR 差异 |
| [cppFrontend/cpp_frontend_user_guide.md](./cppFrontend/cpp_frontend_user_guide.md) | C/C++ 前端用户指南 |
| [cppFrontend/cpp_frontend_build_guide.md](./cppFrontend/cpp_frontend_build_guide.md) | C/C++ 前端构建指南（`astJsonDumper.node`、CMake、`OHOS_SDK_HOME` 等） |

### 2.5 SIG 与社区

| 文档 | 说明 |
|------|------|
| [sig_programanalysis.md](./sig_programanalysis.md) | OpenHarmony 程序分析 SIG 中文说明 |
| [sig_programanalysis.en.md](./sig_programanalysis.en.md) | Program Analysis SIG (English) |

### 2.6 贡献与维护

| 文档 | 说明 |
|------|------|
| [contributing/HowToCreatePR.md](./contributing/HowToCreatePR.md) | 创建 PR 的完整流程 |
| [contributing/HowToHandleIssues.md](./contributing/HowToHandleIssues.md) | Issue 提交与处理流程 |

### 2.7 API 参考

| 文档 | 说明 |
|------|------|
| [api_docs/globals.md](./api_docs/globals.md) | typedoc 自动生成；重新生成请运行 `npm run gendoc` |

## 3. 项目层次速览

下图展示 ArkAnalyzer 的 Scene 数据结构如何把项目代码自上而下组织起来，与 [§2.2 核心组件](#22-核心组件components) 表里的 10 篇文档一一对应：

```
Scene
 ├── ArkFile（源文件）
 │    ├── ArkNamespace（命名空间，可嵌套）
 │    │    ├── ArkClass → ArkMethod / ArkField
 │    │    └── 嵌套 ArkNamespace
 │    └── ArkClass（类 / 接口 / 枚举 / struct / 对象字面量 / type literal / union）
 │         ├── ArkMethod（方法 / 函数 / %dflt / %instInit / %statInit / %AM）
 │         │    └── ArkBody → CFG → BasicBlock → Stmt
 │         │                                     └─ Local / Constant / Ref / Expr
 │         └── ArkField（字段 / 枚举成员 / 索引签名 / 参数属性 / GET 访问器）
 ├── sdkArkFilesMap（SDK 文件，与项目代码同一套模型抽象）
 └── ModuleScene（鸿蒙多模块工程的子作用域，可选）
```

详见 [Scene.md §3 层次结构](./components/Scene.md#3-层次结构)。

## 4. 推荐阅读顺序

| 读者类型 | 路径 |
|---------|------|
| 新用户 | [QuickStart](./QuickStart.md) → [IRBasics](./components/IRBasics.md) → [Stmt](./components/Stmt.md) → [CFG](./components/CFG.md) → [Scene](./components/Scene.md) → 任一 [analysis](./analysis/) 篇 |
| 分析开发者 | 通读 [components/](./components/) → 按目标读 [analysis/](./analysis/) |
| C/C++ 集成 | [MultiLanguageSupport](./MultiLanguageSupport.md) → [cppFrontend/](./cppFrontend/) |
| 文档贡献者 | [contributing/HowToCreatePR.md](./contributing/HowToCreatePR.md) → 修改对应文档 → 提 PR |
