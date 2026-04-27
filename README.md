# 方舟分析器：面向ArkTS语言的静态程序分析框架

## 什么是 ArkAnalyzer？
ArkAnalyzer 是针对基于 ArkTS 语言开发的鸿蒙原生应用的静态代码分析框架，支持 ArkTS、TypeScript、JavaScript、C/C++ 作为输入，通过将它们转换为统一的三地址码（ArkAnalyzer-IR, ArkIR）中间表示，构建 Scene 数据结构对代码结构进行抽象，并进行 Scene 实现一系列静态分析。

## ArkAnalyzer 环境配置
1. 从 [Download Visual Studio Code](https://code.visualstudio.com/download) 下载 VS Code 并安装，或安装其他 IDE。
2. 从 [Download Node.js](https://nodejs.org/en/download/current) 下载 Node.js 并安装（自带 npm）。
3. 安装依赖库：
```shell
npm install
```
4. 【可选】生成最新 API 文档，输出目录为 `docs/api_docs`：
```shell
npm run gendoc
```

## ArkAnalyzer 命令行（CLI）

可执行入口为 `arkanalyzer`（见 `package.json` 的 `bin` 字段）。**本地使用 CLI 前请先编译**，生成 `lib/`：

```shell
npm run build
```

查看帮助：

```shell
npx arkanalyzer --help
npx arkanalyzer cg --help
npx arkanalyzer ir --help
```

`<input>` 均指 ArkTS/TypeScript **工程根目录**。

### `cg`：调用图构建与可达性分析

用法：`arkanalyzer cg <input> [options]`

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `-a, --algorithm <name>` | 构图算法：`cha` \| `rta` | `rta` |
| `-o, --output <file>` | 结果输出文件路径 | `stdout` |
| `-f, --format <type>` | 输出格式：`json` \| `text` \| `dot` \| `csv` | `json` |
| `-e, --entry <method>` | 入口方法，可多次指定；`@dummyMain` 表示与默认入口一致 | 自动推断 |
| `-r, --reachable-from <method>` | 可达性分析根方法，可多次指定 | — |
| `--direction <dir>` | 可达方向：`forward`（顺调）\| `backward`（谁调到根） | `forward` |
| `--edges <type>` | 边类型过滤：`call` \| `virtual` \| `interface` \| `all` | `all` |
| `--ohos-sdk-home <path>` | OpenHarmony SDK 根路径；未设置时读取环境变量 `OHOS_SDK_HOME` | — |

示例：

```shell
npx arkanalyzer cg ./myapp -a rta -f json
npx arkanalyzer cg ./myapp -e "@dummyMain" -r MyClass.myMethod --direction backward -f text
```

### `ir`：导出工程 IR 产物

用法：`arkanalyzer ir <input> [options]`

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `-o, --output <dir>` | 产物输出目录 | `out` |
| `-f, --format <type>` | `json` \| `text` \| `dot` | `text` |
| `--ohos-sdk-home <path>` | 同 `cg` | — |
| `--no-infer-types` | 跳过 `Scene.inferTypes()` 以加快执行 | 默认会做类型推断 |

命令会在**标准输出**打印一行 JSON 摘要（含 `input`、`format`、`outputDir`、`fileCount` 等）。

示例：

```shell
npx arkanalyzer ir ./myapp -f text -o ./out
npx arkanalyzer ir ./myapp -f json -o ./out
```

更细的参数语义与典型用法可参考仓库内 [skills/arkanalyzer/skills/cg.md](skills/arkanalyzer/skills/cg.md)、[skills/arkanalyzer/skills/ir.md](skills/arkanalyzer/skills/ir.md)。

## ArkAnalyzer 文档

1. ArkAnalyzer 快速入门文档，请参考：[链接](docs/QuickStart.md)。
2. 完整使用说明请参考：[ArkAnalyzer 使用文档](docs/README.md)
3. ArkAnalyzer API文档，请参考：[链接](docs/api_docs/globals.md)。
4. 程序分析 SIG 说明：[简体中文](docs/sig_programanalysis.md) · [English](docs/sig_programanalysis.en.md)。


## 支持的使用场景（分语言）

ArkAnalyzer 把所有支持的源语言统一编译成 **ArkIR**（三地址中间表示），下游分析（[CallGraph](docs/analysis/CallGraph.md)、[Def-Use Chain](docs/analysis/Def-Use%20Chain.md)、[IFDS](docs/analysis/IFDS.md)、[ViewTree](docs/analysis/ViewTree.md) 等）对所有语言透明可用。各语言成熟度差异主要在 **前端解析覆盖度** 与 **类型推导精度**，详见 [docs/MultiLanguageSupport.md](docs/MultiLanguageSupport.md)。

| 语言 | `Language` 枚举值 | IR 转换 | 类型推导 | 调用图 (CHA / RTA) | Def-Use / IFDS | ViewTree | 备注 |
|------|------------------|---------|---------|--------------------|----------------|----------|------|
| ArkTS 1.1 / 1.2 | `ARKTS1_1` / `ARKTS1_2` | ✅ 完整 | ✅ 完整（含装饰器） | ✅ | ✅ | ✅ | HarmonyOS 主语言；唯一支持 ArkUI 视图树的语言 |
| TypeScript | `TYPESCRIPT` | ✅ 完整 | ✅ 完整 | ✅ | ✅ | — | 通用 TS 工程；含命名空间、泛型、装饰器、`type`/`interface` 等全部 TS 4.x 语法 |
| JavaScript | `JAVASCRIPT` | ✅ 基础 | ⚠ 受限（缺类型注解时退化为 `UnknownType`） | ✅ | ✅ | — | 适合用于动态调用关系勾画；精确分析建议先用 TS 注解 |
| C / C++ | `CXX` | ✅（cppFrontend） | ⚠ 部分 | ✅ | ✅ | — | 依赖 `cppAstPath` / `ccjsonPath`；含 `VIRTUAL`、`INLINE`、`CONSTEXPR`、`MUTABLE` 等修饰符；用于鸿蒙 native 模块 |
| ABC（ArkCompiler bytecode） | `ABC` | ⚠ 实验 | — | — | — | — | 直接读取编译产物，主要用于 IR 验证 |

**典型场景**：

- **HarmonyOS / ArkTS 应用**：ArkUI 视图树分析（[ViewTree](docs/analysis/ViewTree.md)）+ 状态依赖追踪 + `@State` 副作用检查；多 module 工程通过 [`Scene.buildScene4HarmonyProject()`](docs/components/Scene.md#51-构建-scene) 自动识别。
- **TS / JS 库或服务端项目**：[CallGraph](docs/analysis/CallGraph.md)（CHA / RTA）+ [Def-Use Chain](docs/analysis/Def-Use%20Chain.md) + [IFDS](docs/analysis/IFDS.md)（taint / 未初始化变量 / 除零等定制 checker）。
- **TS / ArkTS 与 C/C++ 混合工程**：通过 `ArkClass.getTs2cxxFuncMap()` 把 TS 侧 `napi_*` 调用与 C/C++ 实现关联，做跨语言可达性分析。

更细粒度的语言能力矩阵与 IR 差异说明请参见 [docs/MultiLanguageSupport.md](docs/MultiLanguageSupport.md)。


## 参与贡献

如在使用过程中遇到问题，可参考 [Issue 提交指南](docs/contributing/HowToHandleIssues.md) 提交Issues
欢迎参与项目共建，提交 PR 请遵循 openharmony-sig 代码仓规范，具体流程请参考：[PR 提交流程说明](docs/contributing/HowToCreatePR.md#中文) 提交 PR

## 版本演进
项目版本演进及历史变更记录请参考：[CHANGELOG](CHANGELOG.md)
