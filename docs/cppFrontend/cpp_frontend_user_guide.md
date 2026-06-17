# ArkAnalyzer C++ 前端使用指南

ArkAnalyzer C++ 前端基于 LLVM / LibTooling 将 C/C++ 源码解析并映射到 ArkAnalyzer IR，便于与既有 ArkTS 分析流程共用 `Scene`、`ArkFile`、`ArkMethod`、`Cfg` 等模型。

本文说明**如何配置与在代码里接入**、**如何跑单元测试**、**npm 子包如何安装**，以及 **`config/arkanalyzer.json` 中 C++ 相关参数**。原生插件的编译见 [C++ 前端构建指南](./cpp_frontend_build_guide.md)。

---

## 文档导读

| 主题 | 说明 |
| --- | --- |
| [1. 前置条件](#1-前置条件) | 开发机构建或 npm 安装平台包 |
| [2. `languages.cpp` 配置参考](#2-languagescpp-配置参考) | `arkanalyzer.json` 各字段与默认值 |
| [3. 打开 C++ 扫描](#3-打开-c-扫描) | `enabled`、扩展名、限流 |
| [4. 接入示例](#4-接入示例) | 构建 Scene、`compile_commands`、类型推导 |
| [5. 测试](#5-测试) | `test:cpp`、`testonce`、fixture 目录 |
| [6. 构建 Scene 之后](#6-构建-scene-之后) | 取文件、类、方法、`Cfg` |
| [7. 与 ArkTS 混编](#7-与-arkts-混编) | 多语言说明 |
| [8. 常见问题](#8-常见问题) | 并行度、扩展名、找不到头等 |

---

## 1. 前置条件

### 1.1 本仓库开发者

1. 按 [cpp_frontend_build_guide.md](./cpp_frontend_build_guide.md) 在本地或 Docker 中执行 **`npm run build:cpp`**，生成 **`astJsonDumper.node`**（及依赖），并保证运行 ArkAnalyzer 时的 `PATH` / `LD_LIBRARY_PATH`（Linux）或等价环境满足该文档要求。
2. 业务脚本或测试通过 **`npm install`** / workspace 等方式能 `import` 到 **`arkanalyzer`** 包（或本仓库 `src` 的编译产物）。

`build:cpp` 会将 **`packages/cxx-ast-parser`** 链接到 **`node_modules/@arkanalyzer/cxx-ast-parser`**，Scene 运行时从此处加载 `.node`。

### 1.2 npm 用户（不编译 C++）

1. 安装主包（**不含**原生 addon）：

   ```bash
   npm install arkanalyzer@<version>
   ```

2. 按本机 OS/架构安装**同版本**平台包（见 [构建指南 §9](./cpp_frontend_build_guide.md#9-本地打包-c-平台包)），例如 Linux x64：

   ```bash
   npm install @arkanalyzer/cxx-ast-parser-linux-x64@<version>
   ```

未安装平台包时，遇到 C++ 文件会**跳过解析并 warn**，不会导致主包其它功能失败。

---

## 2. `languages.cpp` 配置参考

`SceneConfig` 读取仓库根 **`config/arkanalyzer.json`**（或通过构造函数传入的对象），与代码侧选项做**浅合并**。C++ 相关段落在 **`languages.cpp`**：

```json
"cpp": {
  "enabled": false,
  "sourceExtensions": [".cc", ".cpp", ".cxx", ".c", ".c++"],
  "headerExtensions": [".hpp", ".h", ".hxx", ".hh"],
  "maxParallelProcesses": -1,
  "maxPendingAstResults": -1,
  "logAstInfo": false
}
```

### 2.1 字段说明与默认值

| 字段 | 类型 | 仓库默认 | 未配置时的行为 |
|------|------|----------|----------------|
| **`enabled`** | `boolean` | `false` | **`false`**：不扫描 C++ 后缀；C++ 文件不会进入 `getAllFiles` 待解析列表 |
| **`sourceExtensions`** | `string[]` | 见上 | 仅在 **`enabled === true`** 时合并进 `supportFileExts`，用于识别**实现文件** |
| **`headerExtensions`** | `string[]` | 见上 | 同上，用于识别**头文件** |
| **`maxParallelProcesses`** | `number` | `-1` | **`-1`**：使用内置默认并行度（由 C++ 前端根据 CPU 等决定）；设为正整数可限制同时运行的 Clang 子进程数，大仓库 OOM 时可调小 |
| **`maxPendingAstResults`** | `number` | `-1` | **`-1`**：使用内置默认；设为正整数可限制内存中排队等待消费的 AST 结果数量，与上项配合做背压 |
| **`logAstInfo`** | `boolean` | `false` | **`false`**：不额外打印 AST 解析详情；**`true`** 时输出更多诊断日志（调试解析问题时使用） |

**若不修改 JSON**：默认 **`enabled: false`**，即**不会**分析 C++，即使用户工程里有 `.cpp` 文件。

**若不设置某个子字段**（例如只写 `"cpp": { "enabled": true }`）：其余字段由 `SceneConfig` 合并逻辑填充为与 JSON 文件相同的默认值（扩展名列表、`maxParallelProcesses: -1` 等）。

### 2.2 与 `supportFileExts` 的关系

- 根配置 **`supportFileExts`** 默认仅含 ArkTS/TS/JS 后缀（`.ets`、`.ts`、`.js` 等）。
- 开启 **`languages.cpp.enabled`** 后，**`sourceExtensions` + `headerExtensions`** 会**追加**到有效扫描后缀集合。
- 测试里也可绕过 JSON，直接在构造函数传入 **`supportFileExts: [...getCxxSourceFileExtensions()]`**，见 [§4](#4-接入示例)。

---

## 3. 打开 C++ 扫描

要让 **`.cpp` / `.c` / `.h` 等** 进入 `getAllFiles` 的待解析列表，需要 **`languages.cpp.enabled` 为 `true`**。

示例（与仓库 `config/arkanalyzer.json` 中 `languages.cpp` 段一致，请将 `enabled` 改为 `true`）：

```json
"cpp": {
  "enabled": true,
  "sourceExtensions": [".cc", ".cpp", ".cxx", ".c", ".c++"],
  "headerExtensions": [".hpp", ".h", ".hxx", ".hh"],
  "maxParallelProcesses": -1,
  "maxPendingAstResults": -1,
  "logAstInfo": false
}
```

说明：

- **`sourceExtensions` / `headerExtensions`**：在 `enabled === true` 时会被合并进 `SceneConfig` 的 `supportFileExts`，从而扫描到对应后缀的翻译单元与头文件。
- **`maxParallelProcesses` / `maxPendingAstResults`**：`-1` 表示使用内置默认；若在大仓库上 OOM 或 CPU 打满，可改为较小正整数做限流（例如 `4` / `8`，按机器调整）。
- **`logAstInfo`**：排查 Clang 解析或 FlatBuffers 解码问题时设为 `true`。

也可在代码里覆盖（与 JSON 合并后生效）：

```typescript
import { SceneConfig } from 'arkanalyzer';

const config = new SceneConfig({
  languages: {
    cpp: { enabled: true },
  },
});
```

**测试里另一种写法**（不依赖 JSON 里的 `enabled`）：直接把待扫描后缀写进 `supportFileExts`，例如使用导出的 **`getCxxSourceFileExtensions()`**。见 [§4](#4-接入示例)。

---

## 4. 接入示例
```typescript
import path from 'path';
import { Scene, SceneConfig, getCxxSourceFileExtensions } from 'arkanalyzer';

const projectDir = path.resolve('/path/to/cpp/project');

const config = new SceneConfig({
  supportFileExts: [...getCxxSourceFileExtensions()],
  languages: { cpp: { enabled: true } },
});

// 编译数据库（可选）：工程已有 compile_commands.json 时设置；没有可省略
config.setCcjsonPath(path.join(projectDir, 'build', 'compile_commands.json'));

config.buildFromProjectDir(projectDir, []); // 第二个参数：额外 -I 目录

const scene = new Scene();
scene.buildSceneFromProjectDir(config);

scene.inferTypes(); // 可选：需要跨过程类型推导时调用；只看 CFG 可省略

for (const file of scene.getFiles()) {
  for (const method of file.getDefaultClass().getMethods()) {
    const cfg = method.getCfg();
    // ...
  }
}
```

---

## 5. 测试

### 5.1 测试分层

| 层级 | 命令 | 目录 / 目标 | 依赖 |
|------|------|-------------|------|
| C++ 原生（GTest） | `npm run test:cpp` | `tests/unit/cppCore/dumper/`，fixture：`tests/cppResources/dumper/` | LLVM、GTest；**不**依赖 Node Scene |
| TS 集成（Vitest） | `npm run testonce` 或 `npx vitest run tests/unit/cppCore` | `tests/unit/cppCore/**`（如 `graph/Cfg.test.ts`） | 需 **`build:cpp`** 且 `node_modules/@arkanalyzer/cxx-ast-parser` 可用 |
| 性能样例 | `npm run perf:cpp` | `tests/samples/perf/main.ts --project=opencv` | `build` + `build:cpp` |

`script/cpp/vitestCpp.js` 在 **`test` / `testonce`** 前检测 addon 是否就绪；未构建则**跳过** `tests/unit/cppCore/**`，不影响 ArkTS 测试。

### 5.2 本地跑单测

```bash
# 先构建 addon（首次或改 C++ 后）
npm run build:cpp

# 仅 C++ 原生 GTest
npm run test:cpp

# 仅 C++ Vitest 目录
npx vitest run tests/unit/cppCore

# 全量（含 cppCore，若 addon 可用）
npm run testonce
```

### 5.3 测试资源布局

- **`tests/cppResources/`**：C/C++ 样例工程（namespace、template、lazyImport、opencv 等子目录）。
- **`tests/unit/cppCore/cppBuildUtils.ts`**：`resolveSdkPaths`、`ensureCompileDb` 等共用工具，业务工程可参考实现等价逻辑。

---

## 6. 构建 Scene 之后

- **`scene.getFiles()`**：得到 `ArkFile` 列表；可用 **`file.getName()`** 匹配路径后缀，或按业务维护的文件列表过滤。
- **命名空间 / 类 / 方法**：`file.getNamespaces()`、`namespace.getClasses()`、`class.getMethods()` 等与 ArkTS 侧模型一致；许多 C++ 全局函数落在 **`file.getDefaultClass()`** 上。
- **控制流图**：**`method.getCfg()`** 返回 **`Cfg`**，可遍历 **`getBlocks()`**、**`getStmts()`** 等与 `Cfg.test.ts` 中断言方式一致。
- **`scene.inferTypes()`**：需要类型推导时调用；纯 CFG 分析可省略（见 [§4](#4-接入示例)）。

C++ 解析流水线概要（与 [MultiLanguageSupport.md](../MultiLanguageSupport.md) 一致）：`FrontendBuilder` 将 `Language.CXX` 文件分桶 → **`CppFrontend.buildProjectFiles`** → **`astJsonDumper.node`** 产出 FlatBuffers AST → TS 侧转 **`ArkFile`** → **`scene.setFile`**。

---

## 7. 与 ArkTS 混编

同一 `Scene` 中可同时存在 ArkTS 与 C++ 文件。

要点：

- 文件语言由扩展名 + **`languages` / `fileLanguages` 覆盖** 决定（见 `FileUtils.getFileLanguage`）。
- **`inferTypes()`** 按 `Language` 分发到 **`CxxInferenceBuilder`** 等，C++ 类型推导受头文件可见性限制（矩阵中为 ⚠ 部分支持）。

---

## 8. 常见问题

1. **扫描不到 `.cpp` / `.h`**：检查 **`languages.cpp.enabled`** 或是否在 **`supportFileExts`** 中显式加入了对应后缀；默认 **`enabled: false`**。
2. **解析标准库或 OHOS 头失败**：配置 **`includeDirs`**，并优先提供准确的 **`compile_commands.json`**（**`setCcjsonPath`**）。
3. **与 CI 行为一致**：在流水线中设置与本地相同的 **`OHOS_SDK_HOME`**、预置 **`compile_commands.json`**，并完成 [构建指南](./cpp_frontend_build_guide.md) 中的 **`build:cpp`**。
4. **`getCxxSourceFileExtensions()`**：仅覆盖常见实现文件后缀；需要分析头文件本体时，应使用 JSON 里 **`headerExtensions`** 并在 **`enabled: true`** 下由配置自动合并进扫描列表。
5. **npm 用户报找不到 addon**：确认已安装 **`@arkanalyzer/cxx-ast-parser-<platform>-<arch>`** 且版本与 **`arkanalyzer`** 一致；Linux 注意 glibc 与编译环境差异。
6. **`testonce` 没有跑 cppCore**：未 **`build:cpp`** 或平台包未安装；先 **`npm run build:cpp`** 再测。
7. **大仓库 OOM**：将 **`maxParallelProcesses`**、**`maxPendingAstResults`** 设为较小正整数。
