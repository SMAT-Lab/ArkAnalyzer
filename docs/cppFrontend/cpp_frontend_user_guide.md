# ArkAnalyzer C++ 前端使用指南

ArkAnalyzer C++ 前端由 ICT BG 公共开发部品牌「精卫」团队主导设计与开发，基于 LLVM / LibTooling 将 C/C++ 源码解析并映射到 ArkAnalyzer IR，便于与既有 ArkTS 分析流程共用 `Scene`、`ArkFile`、`ArkMethod`、`Cfg` 等模型。

本文只说明**如何配置与在代码里接入**，不涉及仓库内模块划分或内部流水线。原生插件的编译与 `astJsonDumper.node` 的产出见 [C++ 前端构建指南](./cpp_frontend_build_guide.md)。

---

## 文档导读

| 主题 | 说明 |
| --- | --- |
| [1. 前置条件](#1-前置条件) | 先完成 Node 插件构建，保证运行时可加载 `astJsonDumper.node`。 |
| [2. 打开 C++ 扫描](#2-打开-c-扫描) | `config/arkanalyzer.json` 中 `languages.cpp` 与扩展名。 |
| [3. 最小接入示例](#3-最小接入示例) | `SceneConfig` + `Scene`，仅工程内 `.cpp`。 |
| [4. 与单元测试对齐的写法](#4-与单元测试对齐的写法) | 参考 `tests/unit/cppCore/graph/Cfg.test.ts`：`includeDirs`、`compile_commands`、`OHOS_SDK_HOME`、懒加载 NAPI 头路径。 |
| [5. 构建 Scene 之后](#5-构建-scene-之后) | 取文件、类、方法、`Cfg`，以及何时调用 `inferTypes()`。 |
| [6. 与 ArkTS 混编](#6-与-arkts-混编) | 指向多语言说明文档。 |
| [7. 常见问题](#7-常见问题) | 并行度、扩展名、找不到头等。 |

---

## 1. 前置条件

1. 按 [cpp_frontend_build_guide.md](./cpp_frontend_build_guide.md) 在本地或 Docker 中执行 **`npm run build:cpp`**，生成 **`astJsonDumper.node`**（及依赖），并保证运行 ArkAnalyzer 时的 `PATH` / `LD_LIBRARY_PATH`（Linux）或等价环境满足该文档要求。
2. 业务脚本或测试通过 **`npm install`** / workspace 等方式能 `import` 到 **`arkanalyzer`** 包（或本仓库 `src` 的编译产物）。

---

## 2. 打开 C++ 扫描

`SceneConfig` 会读取仓库根下的 **`config/arkanalyzer.json`** 并与构造函数入参做浅合并。要让 **`.cpp` / `.c` / `.h` 等** 进入 `getAllFiles` 的待解析列表，需要 **`languages.cpp.enabled` 为 `true`**。

示例（与仓库 `config/arkanalyzer.json` 中 `languages.cpp` 段一致，请将 `enabled` 改为 `true`）：

```json
"cpp": {
  "enabled": true,
  "sourceExtensions": [".cc", ".cpp", ".cxx", ".c", ".c++"],
  "headerExtensions": [".hpp", ".h", ".hxx", ".hh"],
  "maxParallelProcesses": -1,
  "maxPendingAstResults": -1
}
```

说明：

- **`sourceExtensions` / `headerExtensions`**：在 `enabled === true` 时会被合并进 `SceneConfig` 的 `supportFileExts`，从而扫描到对应后缀的翻译单元与头文件。
- **`maxParallelProcesses` / `maxPendingAstResults`**：`-1` 表示使用内置默认；若在大仓库上 OOM 或 CPU 打满，可改为较小正整数做限流（具体行为以当前实现为准）。

也可在代码里覆盖（与 JSON 合并后生效）：

```typescript
import { SceneConfig } from 'arkanalyzer';

const config = new SceneConfig({
  languages: {
    cpp: { enabled: true },
  },
});
```

**测试里另一种写法**（不依赖 JSON 里的 `enabled`）：直接把待扫描后缀写进 `supportFileExts`，例如使用导出的 **`getCxxSourceFileExtensions()`**（仅常见「源文件」后缀，不含头文件）。见 `tests/unit/cppCore/graph/Cfg.test.ts` 中 `new SceneConfig({ supportFileExts: [...getCxxSourceFileExtensions()] })`。

---

## 3. 最小接入示例

适用于工程内只有自包含 C/C++、系统头路径由 Clang 默认即可解析的场景。

```typescript
import path from 'path';
import { Scene, SceneConfig } from 'arkanalyzer';

const projectDir = path.resolve('/path/to/your/cpp/project');

const config = new SceneConfig();
// 若未改 JSON，请保证 languages.cpp.enabled 为 true，或见上一节在构造函数中传入。
config.buildFromProjectDir(projectDir, []); // 第二个参数为额外 -I 目录，可传空数组

const scene = new Scene();
scene.buildSceneFromProjectDir(config);

// 按需：scene.inferTypes();

for (const file of scene.getFiles()) {
  // 按 file.getName() 过滤 .cpp 等，或遍历命名空间 / 类 / 方法
  for (const cls of file.getClasses()) {
    for (const method of cls.getMethods()) {
      const cfg = method.getCfg();
      // 使用 BasicBlock、Stmt 等做数据流 / CFG 分析
    }
  }
}
```

若工程依赖第三方头文件目录，把绝对路径放进 **`buildFromProjectDir` 的第二个参数**（`includeDirs`），等价于为 LibTooling 增加 `-I`。

---

## 4. 与单元测试对齐的写法

集成测试 **`tests/unit/cppCore/graph/Cfg.test.ts`** 中的 `buildScene` 展示了更接近 OpenHarmony / NDK 环境的配置方式，核心步骤如下。

### 4.1 `includeDirs`（libc++ 与 sysroot）

测试从 **`tests/unit/cppCore/cppBuildUtils.ts`** 的 **`resolveSdkPaths()`** 读取环境变量 **`OHOS_SDK_HOME`**，得到：

- **`cxxIncludeDir`**：LLVM 自带 libc++ 头（`.../llvm/include/c++/v1`）
- **`configSiteDirs`**：带 **`__config_site`** 的目标相关目录（工具会扫描 `llvm/include` 下子目录）
- **`sysrootIncludeDir`**：sysroot 下的 `usr/include`（懒加载 NAPI 等场景会用到）

典型组合与测试一致：

```typescript
import path from 'path';
import fs from 'fs';
import { Scene, SceneConfig, getCxxSourceFileExtensions } from 'arkanalyzer';
import { resolveSdkPaths, ensureCompileDb } from './cppBuildUtils'; // 从测试 utils 拷贝或自行实现等价逻辑

const { cxxIncludeDir, sysrootIncludeDir, configSiteDirs } = resolveSdkPaths();
const includeDirs = [cxxIncludeDir, ...configSiteDirs].filter(Boolean);

// 若用例涉及 lazyImport 下的 NAPI，可追加例如：
// includeDirs.push(
//   path.join(sysrootIncludeDir, 'x86_64-linux-ohos'),
//   sysrootIncludeDir,
// );
```

未设置 **`OHOS_SDK_HOME`** 时，`resolveSdkPaths()` 返回空字符串；仅解析不依赖 OHOS 标准库的代码时，可继续使用空或自定义 `-I` 列表。

### 4.2 `compile_commands.json`

当存在 **`CMakeLists.txt`** 且配置了 **`OHOS_SDK_HOME`** 时，测试会调用 **`ensureCompileDb(projectDir, buildDir)`**（内部用 OHOS 的 **`ohos.toolchain.cmake`** 跑 CMake 并 **`CMAKE_EXPORT_COMPILE_COMMANDS=ON`**），然后：

```typescript
config.setCcjsonPath(path.join(buildDir, 'compile_commands.json'));
```

若你已有现成的 **`compile_commands.json`**（任意 CMake / Bear 生成），可直接 **`config.setCcjsonPath(绝对路径)`**，无需经过 `ensureCompileDb`。

**注意**：`setCcjsonPath` 只需在 **`scene.buildSceneFromProjectDir(config)`** 之前完成即可；与 **`buildFromProjectDir`** 的先后次序无强约束。测试里在存在 `CMakeLists.txt` 且配置了 `OHOS_SDK_HOME` 时，会先 `ensureCompileDb`、`setCcjsonPath`，再 **`buildFromProjectDir`**。

### 4.3 组装 `Scene`

与测试相同的主线：

```typescript
const config = new SceneConfig({ supportFileExts: [...getCxxSourceFileExtensions()] });
// … 按上文设置 includeDirs、setCcjsonPath（可选）…
config.buildFromProjectDir(projectDir, includeDirs);

const scene = new Scene();
scene.buildSceneFromProjectDir(config);
```

测试中部分用例在断言前会调用 **`scene.inferTypes()`**（例如部分 `switch`、懒加载、`namespace` 等），用于补全类型信息或满足特定分析路径。若你的分析依赖完整类型推导，建议在构建 Scene 后同样调用 **`inferTypes()`**。

---

## 5. 构建 Scene 之后

- **`scene.getFiles()`**：得到 `ArkFile` 列表；可用 **`file.getName()`** 匹配路径后缀，或按业务维护的文件列表过滤。
- **命名空间 / 类 / 方法**：`file.getNamespaces()`、`namespace.getClasses()`、`class.getMethods()` 等与 ArkTS 侧模型一致；许多 C++ 全局函数落在 **`file.getDefaultClass()`** 上。
- **控制流图**：**`method.getCfg()`** 返回 **`Cfg`**，可遍历 **`getBlocks()`**、**`getStmts()`** 等与 `Cfg.test.ts` 中断言方式一致。
- **`scene.inferTypes()`**：在需要跨过程类型、调用图或其它依赖 TypeInference 的场景中调用；纯 CFG 冒烟可按需省略（与测试各用例不完全相同）。

---

## 6. 与 ArkTS 混编

同一 `Scene` 中可同时存在 ArkTS 与 C++ 文件；TS 侧调用 native 的映射、多语言场景说明见 **[多语言支持](../MultiLanguageSupport.md)**。

---

## 7. 常见问题

1. **扫描不到 `.cpp` / `.h`**：检查 **`languages.cpp.enabled`** 或是否在 **`supportFileExts`** 中显式加入了对应后缀。
2. **解析标准库或 OHOS 头失败**：配置 **`includeDirs`**，并优先提供准确的 **`compile_commands.json`**（**`setCcjsonPath`**）。
3. **与 CI 行为一致**：在流水线中设置与本地相同的 **`OHOS_SDK_HOME`**、预置 **`compile_commands.json`**，并完成 [构建指南](./cpp_frontend_build_guide.md) 中的插件构建步骤。
4. **`getCxxSourceFileExtensions()`**：仅覆盖常见实现文件后缀；需要分析头文件本体时，应使用 JSON 里 **`headerExtensions`** 并在 **`enabled: true`** 下由配置自动合并进扫描列表。

更多分析概念（如 Def-Use）见仓库 **`docs/analysis/`** 下各文档；与语言无关的 API 以 TypeScript 声明与源码为准。
