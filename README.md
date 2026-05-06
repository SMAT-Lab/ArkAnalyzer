# 方舟分析器：面向ArkTS语言的静态程序分析框架

## ArkAnalyzer 环境配置
1. 从 [Download Visual Studio Code](https://code.visualstudio.com/download) 下载 VS Code 并安装，或安装其他 IDE。
2. 从 [Download Node.js](https://nodejs.org/en/download/current) 下载 Node.js 并安装（自带 npm）。
3. 安装依赖库：
```shell
npm install
```
4. 【可选】使用 Docker 开发环境（x86_64 Linux）：
```shell
# 构建镜像
docker build --platform linux/amd64 -f Dockerfile.dev -t arkanalyzer:dev-amd64 .

# 启动容器（挂载 SDK 和源码；源码修改即时生效）
docker run --platform linux/amd64 -it \
  -v /path/to/command-line-tools:/workspace/command-line-tools \
  -v $(pwd):/workspace/arkanalyzer \
  arkanalyzer:dev-amd64
```
5. 【可选】生成最新 API 文档，输出目录为 `docs/api_docs`：
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
2. ArkAnalyzer API文档，请参考：[链接](docs/api_docs/globals.md)。
3. 程序分析 SIG 说明：[简体中文](docs/sig_programanalysis.md) · [English](docs/sig_programanalysis.en.md)。

## ArkAnalyzer 代码上库
遵守openharmony-sig代码上库规范, 操作方法请参考：[链接](docs/HowToCreatePR.md#中文)

## ArkAnalyzer 调试
将调试配置文件`.vscode/launch.json`中`args`参数数组修改为想要调试的文件路径，然后启动调试。

## 添加自验证测试用例
新增测试代码统一放至`tests`目录下，对应的样例代码和其他资源文件统一放至`tests\resources`,按测试场景创建不同文件夹。

## UT 日志开关
Vitest 单测默认静默运行，不输出详细 UT 日志。

需要排查问题时可通过环境变量 `V=1` 开启详细日志（包含控制台输出与 `output/ArkAnalyzerUT.log` 文件日志）：

```shell
V=1 npx vitest run
```

## ArkAnalyzer Issues
请参考[连接](docs/HowToHandleIssues.md)提交Issues。
