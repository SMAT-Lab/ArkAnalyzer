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


## 参与贡献

如在使用过程中遇到问题，可参考 [Issue 提交指南](docs/contributing/HowToHandleIssues.md) 提交Issues
欢迎参与项目共建，提交 PR 请遵循 openharmony-sig 代码仓规范，具体流程请参考：[PR 提交流程说明](docs/contributing/HowToCreatePR.md#中文) 提交 PR

## 版本演进
项目版本演进及历史变更记录请参考：[CHANGELOG](CHANGELOG.md)
