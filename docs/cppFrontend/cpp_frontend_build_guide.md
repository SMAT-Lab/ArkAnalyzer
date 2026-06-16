# CPP 前端构建指南

本文说明在 **Linux / macOS / Windows** 上构建 **C++ AST 导出用 Node 原生扩展** `astJsonDumper.node`（N-API addon）之前需要安装的工具、推荐版本及环境变量。构建由仓库根目录脚本 `script/cpp/buildCpp.js` 驱动（`npm run build:cpp`）。若在 **x86_64 Linux** 上希望与本仓库推荐栈一致，可直接使用根目录 **[`Dockerfile.dev`](../../Dockerfile.dev)** 提供的开发镜像（见 [§3.3](#33-docker-开发镜像dockerfiledev)）。

**只想用已发布的 npm 包、不在本仓编译**时，请参阅 [cpp_frontend_user_guide.md](./cpp_frontend_user_guide.md) 的「npm 用户安装」一节。

---

## 全新机器快速上手（Checklist）

按顺序完成下列步骤，可在 **Debian/Ubuntu x86_64** 上从零闭环（其它平台见后文各节替换对应安装命令）：

| 步骤 | 命令 / 动作 | 成功标志 |
|------|-------------|----------|
| 1. 系统工具 | `sudo apt-get install -y git cmake ninja-build llvm-19-dev libclang-19-dev libgtest-dev` | `cmake --version`、`llvm-config-19 --version` 有输出 |
| 2. Node.js | 安装 **Node ≥ 18**（推荐 **20 LTS**，与 `Dockerfile.dev` 一致） | `node -v`、`npm -v` 有输出 |
| 3. 克隆仓库 | `git clone <repo-url> arkanalyzer && cd arkanalyzer` | 存在 `package.json`、`script/cpp/buildCpp.js` |
| 4. JS 依赖 | `npm install` | 存在 `node_modules/node-api-headers/include/node_api.h` |
| 5. 编译 C++ | `npm run build:cpp` | 存在 `packages/cxx-ast-parser/dumper/astJsonDumper.node` |
| 6. 验证（可选） | `npm run test:cpp` | GTest 用例通过 |
| 7. 验证 TS 集成（可选） | `npm run testonce` | 含 `tests/unit/cppCore/**` 的 Vitest 用例通过 |

**WSL2 / macOS / Windows** 用户：步骤 1 换为对应包管理器（见 [§3](#3-linux本机)、[§4](#4-macos本机)、[§5](#5-windows本机非-msys2)）；步骤 2–7 不变。

**不想在本机装 LLVM**：用 [§3.3 Docker 开发镜像](#33-docker-开发镜像dockerfiledev) 挂载源码后只跑步骤 5–7。

---

## 0. 默认流水线与 C++ 可选依赖

**公司 CI / 日常 ArkTS 开发**只需：

```bash
npm install
npm run build
npm run testonce
```

主包 **`dependencies` 不含 flatbuffers**，上述命令**不会**安装或编译 FlatBuffers，也不会跑 `tests/unit/cppCore/**`，ArkTS 相关测试可正常通过。

**`npm pack`** 始终产出主包 **`arkanalyzer-*.tgz`**（**仅含 ArkTS**，不把 C++ addon 打进主包）：

- **未**先执行 **`npm run build:cpp`**：只得到上述主包一个 tgz。
- **已**执行 **`npm run build:cpp`** 再 **`npm pack`**：主包 tgz 之外，`postpack` 会再打出当前平台的 **`arkanalyzer-cxx-ast-parser-<platform>-<arch>-*.tgz`**（即 npm 包 `@arkanalyzer/cxx-ast-parser-<platform>-<arch>`）。

CI Release 上各平台 C++ 包由 workflow 在对应 runner 上分别 `packPlatformCxxPackage` 发布；也可本地单独执行：

```bash
node script/cpp/packPlatformCxxPackage.js --local
```

**启用 C++ 分析**时，在仓库根目录执行一条命令即可（脚本会链接本仓库 **`packages/cxx-ast-parser`** 并编译当前平台的 **`astJsonDumper.node`**）：

```bash
npm run build:cpp
```

**npm 用户**（非本仓库开发）安装主包后，按需再安装与系统匹配的平台 C++ 包，例如 **`@arkanalyzer/cxx-ast-parser-linux-x64@<与 arkanalyzer 同版本>`**（详见 [用户指南 §2](./cpp_frontend_user_guide.md#2-包组织与-npm-发布)）。

执行 **`build:cpp`** 之后，后续 **`npm run testonce`** 会包含 C++ 单元测试（`tests/unit/cppCore/**`）。未安装 `@arkanalyzer/cxx-ast-parser` 时，Scene 遇到 C++ 文件会**跳过 C++ 前端**并打 warn，不会导致 `npm testonce` 失败。

---

## 1. 构建什么、命令是什么

### 1.1 仓库内 C++ 相关目录

| 路径 | 作用 |
|------|------|
| `packages/cxx-ast-parser/` | C++ 子包：`@arkanalyzer/cxx-ast-parser`（TS 运行时 + `dumper/` 下的 `.node`） |
| `packages/cxx-ast-parser/cpp/` | FlatBuffers schema（`astWire.fbs`）与 wire 解码相关 C++ |
| `src/frontend/cppFrontend/` | C++ 前端 TS 实现（Scene 接入、`CppFrontend` 等） |
| `src/frontend/cppFrontend/ast/cpp/` | **CMake 工程根**（`-S` 指向此处；中间产物在同级 `build/`） |
| `src/frontend/cppFrontend/ast/dumper/` | 构建成功后 **`astJsonDumper.node` 的落盘目录**（脚本复制目标） |
| `script/cpp/` | `buildCpp.js`、`testCpp.js`、`vitestCpp.js`、`packPlatformCxxPackage.js` 等 |
| `tools/flatbuffers`、`tools/flatc` | 首次构建时自动下载的 FlatBuffers 工具（`.gitignore`，不入库） |
| `flatGenerated/` | `flatc` 生成的 C++/TS 绑定（不入 Git） |
| `tests/unit/cppCore/` | C++ 相关 Vitest 集成测试 |
| `tests/cppResources/` | C++ 测试 fixture 源码 |

### 1.2 `npm run build:cpp` 流水线

在仓库根目录执行 **`npm run build:cpp`**，脚本会：

1. 若 **`tools/flatbuffers`** / **`tools/flatc`** 不存在，按 **`packages/cxx-ast-parser` 依赖的 FlatBuffers 版本** 自动下载到 **`tools/`**（目录在 `.gitignore`，无需提交）；再对 **`astWire.fbs`** 运行 **flatc**，生成 C++/TS 绑定（输出到 **`flatGenerated/`**，不入 Git）；
2. 经 CMake 在本机构建 **`astJsonDumper.node`**，并复制到 **`packages/cxx-ast-parser/dumper/`**；
3. 编译 **`packages/cxx-ast-parser/lib`**（与 `.node` 配套的 FlatBuffers wire 解码器），并链接到 **`node_modules/@arkanalyzer/cxx-ast-parser`**。

产物为 **Node 加载的 `.node` 动态库**，CMake 目标名为 **`astJsonDumper_addon`**。
### 1.3 其它构建 / 测试命令

| 命令 | 说明 |
|------|------|
| `npm run build:cpp` | 构建 addon + 链接子包到 `node_modules` |
| `npm run test:cpp` | 构建并运行 C++ **原生** GTest（`astJsonDumper_unit_tests`），不依赖 Vitest |
| `npm run testonce` | 先 `build`，再 `vitestCpp.js`（决定是否跑 `tests/unit/cppCore/**`），再全量 Vitest |
| `node script/cpp/packPlatformCxxPackage.js --local` | 将当前平台已构建的 addon 打成独立 npm tgz |

C++ 原生单元测试（GTest）与 addon 共用 **`ast/cpp/build/`** 与 LLVM 环境，**不依赖 Node/N-API**。GoogleTest 解析顺序：**本机系统包（如 `libgtest-dev`）** → **`tools/googletest/`** → 联网自动下载 v1.14.0；离线环境推荐 `sudo apt install libgtest-dev` 或手动解压 zip 到 **`tools/googletest/`**。测试源码在 **`tests/unit/cppCore/dumper/`**，fixture 在 **`tests/cppResources/dumper/`**。

源码与 **CMake 工程根目录**：`src/frontend/cppFrontend/ast/cpp`（脚本中的 `-S` 指向该目录；中间产物在同级 `build/`）。  
脚本会在配置阶段向 CMake 传入 **`NODE_API_INCLUDE_DIR`**（须含 `node_api.h`）、以及 **`LLVM_DIR`**（若已探测或已设置）。`NODE_API_INCLUDE_DIR` 默认通过 **`npm install` 后的 `node_modules/node-api-headers/include`**、或环境变量 **`NODE_API_INCLUDE_DIR`**、或 Linux 常见 **`/usr/include/node`** 解析。

### 1.4 编译时依赖关系（摘要）

```
npm install
    └── node-api-headers          → NODE_API_INCLUDE_DIR（N-API 头）
    └──（build:cpp 时）flatbuffers  → 仅在 packages/cxx-ast-parser 子包 TS 编译用

npm run build:cpp
    ├── flatc（tools/ 自动下载）   → flatGenerated/（wire 格式）
    ├── LLVM 19 + Clang dev       → libclang，解析 C/C++ AST
    ├── CMake + C++17 编译器       → astJsonDumper.node
    └── tsc（packages/cxx-ast-parser）→ lib/index.js
```

**不需要**在 `npm install` 阶段安装 LLVM；**需要**在运行 `build:cpp` 前本机已有 LLVM/Clang **开发包**（见各平台章节）。

---

## 2. 通用依赖

- **CMake**：3.16+（工程 `cmake_minimum_required`），且 `cmake` 在 `PATH` 中。
- **Node 头文件（N-API）**：需能解析到含 **`node_api.h`** 的目录（见上文）；否则 `cmake` 会跳过 addon 目标。
- **LLVM / Clang**：需能通过 CMake `find_package(LLVM)`、`find_package(Clang)` 解析。仓库开发与 CI 以 **LLVM 19** 为主线；若使用其它主版本，需自行验证链接与头文件是否一致。
- **C++ 编译器**：支持 **C++17**（由 LLVM/Clang 或 MSVC 提供，取决于平台与生成器）。
- **Git**：克隆仓库；`build:cpp` 本身不依赖 Git。
- **网络（首次）**：自动下载 FlatBuffers / 可选 GoogleTest；离线见 [§9](#9-常见问题) 与 GTest 说明。

脚本会按顺序尝试：环境变量 **`LLVM_DIR`**（若目录存在）、**`llvm-config` / `llvm-config-19`**（`--cmakedir`）、常见安装路径（见各节）。  
若同时设置 **`LLVM_DIR`** 与 **`Clang_DIR`**，将优先直接使用二者（路径需分别指向 `lib/cmake/llvm` 与 `lib/cmake/Clang`）。

### 2.1 官方下载与参考链接（可选）

下列链接与当前 **`npm run build:cpp`** 本机构建流程兼容，便于自行获取预编译工具链或安装包（**不包含**已废弃的交叉编译 / 独立 `exe` dumper 相关工具链）。

- **LLVM**（源码与 Release）：https://github.com/llvm/llvm-project/releases  
- **Visual Studio 2022**（Windows，含 MSVC 与桌面 C++ 工作负载）：https://visualstudio.microsoft.com/zh-hans/downloads  
- **CMake**：https://cmake.org/download  
- **Node.js**：https://nodejs.org/（LTS 推荐）

---

## 3. Linux（本机）

### 3.1 推荐软件包（Debian / Ubuntu 示例）

```bash
sudo apt-get update
sudo apt-get install -y git cmake ninja-build llvm-19-dev libclang-19-dev libgtest-dev
```

确保 `llvm-config-19` 在 `PATH` 中，或显式导出：

```bash
export LLVM_DIR=$(llvm-config-19 --cmakedir)
# 可选：Clang_DIR 通常可由脚本根据 LLVM_DIR 推导；若 CMake 报错再设：
# export Clang_DIR=$(dirname "$(llvm-config-19 --cmakedir)")/Clang
```

完整闭环示例：

```bash
git clone <repo-url> arkanalyzer && cd arkanalyzer
npm install
npm run build:cpp
npm run test:cpp    # 可选
```

### 3.2 注意

- 在仓库根目录执行 **`npm install`**，确保存在 **`node_modules/node-api-headers`**，以便 `buildCpp.js` 自动传入 **`NODE_API_INCLUDE_DIR`**（否则需本机安装 Node 开发头文件或手动设置该变量）。
- 避免混用不同主版本的 LLVM 动态库（例如系统 `libLLVM.so` 与 `LLVM_DIR` 指向 19 不一致），否则易出现链接错误或 “DSO missing” 类问题。
- 运行时若动态链接器找不到 `libLLVM.so`，可临时 `export LD_LIBRARY_PATH=$(llvm-config-19 --libdir):$LD_LIBRARY_PATH`（路径以本机为准）。
- 其它发行版请使用对应包名安装 **LLVM/Clang 开发包** 与 **CMake**，原则同上。

### 3.3 Docker 开发镜像（`Dockerfile.dev`）

仓库根目录的 **`Dockerfile.dev`** 用于在 **linux/amd64** 上准备**与本仓库脚本假设一致**的开发环境（Ubuntu 22.04 + LLVM 19 + Node 20 + 已执行 `npm install`），适合本机不想逐包对齐、或 CI/同事间复现 **`npm run build:cpp`** 时使用。

**镜像内已包含（构建镜像时写入）：**

| 组件 | 说明 |
|------|------|
| 基础系统 | **Ubuntu 22.04**；APT 使用**阿里云**镜像加速 |
| 构建工具 | `build-essential`、`cmake`、`pkg-config`、`python3` 等 |
| LLVM / Clang **19** | 通过清华 **TUNA** 的 `llvm-apt`（`llvm-toolchain-jammy-19`）安装：`llvm-19-dev`、`libclang-19-dev`、`clang-19`、`lld-19` |
| Node.js | **20.19.2** x64 官方包经 **npmmirror** 下载，解压到 **`/usr/local`**（提供 `node` / `npm`） |
| npm 依赖 | 构建镜像时在 **`/workspace/arkanalyzer`** 执行 `npm install`（registry 为 **npmmirror**），并将 **`node_modules`** 备份到 **`/opt/arkanalyzer-deps`**（注释说明：若宿主挂载源码时覆盖了 `node_modules` 且平台二进制不兼容，可由入口脚本从该目录恢复；当前 Dockerfile 仅定义 `CMD`） |
| 工作目录 | **`WORKDIR /workspace/arkanalyzer`** |
| `OHOS_SDK_HOME` | 默认 **`/workspace/command-line-tools/sdk/default`**（与根 `README` 中挂载 Command Line Tools 到 `/workspace/command-line-tools` 的示例一致；**编译 addon 不依赖**，运行/测试场景时可在 `docker run` 用 `-e` 覆盖） |

**在容器内编译 C++ addon：** 挂载本仓库到 `/workspace/arkanalyzer` 后，在仓库根执行：

```bash
npm run build:cpp
```

此时 **`NODE_API_INCLUDE_DIR`** 通常由镜像内已存在的 **`node_modules/node-api-headers/include`** 满足；**`LLVM_DIR`** 可由脚本通过 **`llvm-config-19 --cmakedir`** 解析（请保证 **`llvm-config-19`** 在 `PATH`；镜像已安装 **`clang-19`** 套件）。

**构建与运行容器**（与根目录 [README.md](../../README.md)「Docker 开发环境」一致）：

```shell
docker build --platform linux/amd64 -f Dockerfile.dev -t arkanalyzer:dev-amd64 .

docker run --platform linux/amd64 -it \
  -v /path/to/command-line-tools:/workspace/command-line-tools \
  -v $(pwd):/workspace/arkanalyzer \
  arkanalyzer:dev-amd64
```

说明：**未预装 `ninja`**；在 Linux 上 `buildCpp.js` 仍可通过 Unix Makefiles + `Release` 完成构建。若希望与宿主机完全相同的 `node_modules`，可在进入容器后于挂载目录再执行一次 **`npm install`**（注意与 `/opt/arkanalyzer-deps` 的取舍）。

---

## 4. macOS（本机）

### 4.1 Homebrew 示例

```bash
brew install git cmake llvm@19 ninja
```

`llvm@19` 通常不在默认 shell PATH 中，可将 `$(brew --prefix llvm@19)/bin` 加入 `PATH`，或设置：

```bash
export LLVM_DIR="$(brew --prefix llvm@19)/lib/cmake/llvm"
export Clang_DIR="$(brew --prefix llvm@19)/lib/cmake/Clang"
```

脚本在未设置 `LLVM_DIR` 时，也会尝试通过 `brew --prefix llvm` 或常见路径探测（以本机实际安装为准）。

### 4.2 注意

- 在仓库根目录执行 **`npm install`**，以便使用 **`node_modules/node-api-headers`** 作为 N-API 头路径（与 Linux 相同）。
- Apple 自带 `Clang` 不等于 **LLVM CMake 包**；若未安装 Homebrew LLVM，需自行提供可用的 `LLVM_DIR` / `Clang_DIR`。
- Apple Silicon 上平台包名为 **`darwin-arm64`**（打包 / 发布时与 x64 区分）。

---

## 5. Windows（本机，非 MSYS2）

适用于：官方安装包 **LLVM** + **Visual Studio**（含 “使用 C++ 的桌面开发”），在 **cmd / PowerShell** 或已配置好 PATH 的终端中执行 `npm run build:cpp`。

### 5.1 安装建议

- **Git**：克隆仓库。
- **Node.js**：需能在终端运行 `node` / `npm`；并在仓库根执行 **`npm install`** 以安装 **`node-api-headers`**（供 `node_api.h`）。
- **CMake**：`winget install Kitware.CMake` 或从官网安装并加入 `PATH`。
- **LLVM**：`winget install LLVM.LLVM` 等，默认常见路径为 `C:\Program Files\LLVM\lib\cmake\llvm`；可将 `C:\Program Files\LLVM\bin` 加入 `PATH` 以便找到 `llvm-config.exe`。
- **Visual Studio 2022**：提供 MSVC 工具链与 Windows SDK；CMake 默认可能选用 Visual Studio 生成器。
- **Ninja（可选）**：若已安装并在 `PATH` 中，脚本会优先使用 **Ninja + Release** 单配置生成，产物路径更固定；否则使用 Visual Studio 多配置生成，构建时追加 `--config Release`，并在 `build\Release\` 等目录下查找 **`astJsonDumper.node`**。

### 5.2 环境变量（可选）

```text
LLVM_DIR=C:\Program Files\LLVM\lib\cmake\llvm
Clang_DIR=C:\Program Files\LLVM\lib\cmake\Clang
```

路径含空格时，在图形界面或脚本中设置即可，无需手动转义引号给 Node 脚本。

---

## 6. Windows（MSYS2 本机构建）

在 **MSYS2** 的 **MinGW x64**、**UCRT64** 或 **Clang64** 环境中，使用 `pacman` 安装 LLVM 与构建工具，然后在**同一环境**中执行 `npm run build:cpp`（需能访问到该环境中的 `cmake`、`node`）。仓库根的 **`npm install`** 仍建议在 Windows 侧或同一套可访问的 `node_modules` 下完成，以便解析 **`node-api-headers`**。

### 6.1 MinGW64 环境示例

```bash
pacman -S git mingw-w64-x86_64-llvm mingw-w64-x86_64-clang mingw-w64-x86_64-clang-tools-extra mingw-w64-x86_64-cmake mingw-w64-x86_64-ninja mingw-w64-x86_64-nodejs
```

### 6.2 UCRT64 环境

将包名前缀改为 `mingw-w64-ucrt-x86_64-*`（如 `mingw-w64-ucrt-x86_64-llvm` 等），与当前环境一致即可。

### 6.3 路径探测说明

脚本会结合 **`MSYS2_ROOT`**、**`MINGW_PREFIX`**（如 `/mingw64`）以及常见根目录（如 `C:\msys64` 下 `mingw64`、`ucrt64`、`clang64`）自动查找 `lib\cmake\llvm`。若 MSYS2 未安装在默认盘符路径，请设置 **`MSYS2_ROOT`** 或 **`LLVM_DIR`**。

---

## 7. 环境变量一览

| 变量 | 用途 |
| ---- | ---- |
| `NODE_API_INCLUDE_DIR` | 含 **`node_api.h`** 的目录；不设时脚本尝试 `node_modules/node-api-headers/include` 或 `/usr/include/node` |
| `LLVM_DIR` | 指向 `lib/cmake/llvm`（LLVM CMake 包目录） |
| `Clang_DIR` | 指向 `lib/cmake/Clang`（可选；未设时脚本常从 `LLVM_DIR` 推导） |
| `MSYS2_ROOT` | 仅 Windows：MSYS2 安装根目录，辅助解析 `mingw64` 等前缀 |
| `ARKANALYZER_INCREMENTAL_CPP_BUILD` | 设为 `1` 时跳过清空 `ast/cpp/build`，便于增量编译 |
| `OHOS_SDK_HOME` | **非编译 addon 所需**。分析工程或运行依赖 OHOS SDK 的测试时，指向 SDK 的 **`default` 根目录**（见下文第 11 节） |

---

## 8. 构建产物位置

成功执行后，脚本会将 **Node addon** 复制到：

- 目录：`packages/cxx-ast-parser/dumper/`（运行时经 `node_modules/@arkanalyzer/cxx-ast-parser` 解析）
- 同步复制：`src/frontend/cppFrontend/ast/dumper/`（与历史路径兼容）
- 文件名（各平台一致）：**`astJsonDumper.node`**

CMake 在 `src/frontend/cppFrontend/ast/cpp/build/`（及 Windows 多配置下的 `build\Release\` 等子目录）中生成同名 **`astJsonDumper.node`**，再由 `buildCpp.js` 复制到上述 `dumper/` 目录。若切换生成器或路径异常，可删除 **`ast/cpp/build`** 下内容后重试（默认每次全量会清空 build 目录内容，见 `ARKANALYZER_INCREMENTAL_CPP_BUILD`）。

---

## 9. 本地打包 C++ 平台包

在**已成功 `npm run build:cpp`** 的本机，可将当前平台的 addon 打成独立 npm 包（与 CI Release 产物格式一致）：

```bash
node script/cpp/packPlatformCxxPackage.js --local
```

或在 **`npm pack`** 时由 **`postpack`** 自动附带（需先 `build:cpp`）。

**产物命名示例**（版本号与主包 `package.json` 的 `version` 一致）：

| 平台 | npm 包名 | tgz 文件名模式 |
|------|----------|----------------|
| Linux x64 | `@arkanalyzer/cxx-ast-parser-linux-x64` | `arkanalyzer-cxx-ast-parser-linux-x64-<version>.tgz` |
| Linux arm64 | `@arkanalyzer/cxx-ast-parser-linux-arm64` | `arkanalyzer-cxx-ast-parser-linux-arm64-<version>.tgz` |
| macOS x64 | `@arkanalyzer/cxx-ast-parser-darwin-x64` | `arkanalyzer-cxx-ast-parser-darwin-x64-<version>.tgz` |
| macOS arm64 | `@arkanalyzer/cxx-ast-parser-darwin-arm64` | `arkanalyzer-cxx-ast-parser-darwin-arm64-<version>.tgz` |
| Windows x64 | `@arkanalyzer/cxx-ast-parser-win32-x64` | `arkanalyzer-cxx-ast-parser-win32-x64-<version>.tgz` |

**注意**：addon 为**本机编译**的原生二进制，**不能**在 Linux 上交叉打出 Windows/macOS 包；各平台需在对应 OS 上分别 `build:cpp` 再打包。

---

## 10. 常见问题

- **CMake 找不到 LLVM**：先确认 `LLVM_DIR` 目录存在且包含 `LLVMConfig.cmake`；Linux 上优先使用 `llvm-config-19 --cmakedir` 输出。
- **`node_api.h not found`**：在仓库根执行 **`npm install`**（拉取 `node-api-headers`），或设置 **`NODE_API_INCLUDE_DIR`** 指向本机 Node 开发头文件目录。
- **Windows 上找不到 `astJsonDumper.node`**：确认是否使用 **Release** 配置；脚本会尝试 `build\`、`build\Release\`、`build\x64\Release\` 等路径查找 **`.node`** 文件。
- **版本混链**：同一构建中 `LLVM_DIR`、系统 `libLLVM`、PATH 中的 `Clang` 应来自同一 LLVM 大版本，避免 18/19 混用。
- **FlatBuffers 下载失败**：检查网络或代理；可手动将对应版本解压到 **`tools/flatbuffers`** 并确保 **`tools/flatc`** 可执行。
- **GTest 下载失败**：安装系统 **`libgtest-dev`**，或将 v1.14.0 源码解压到 **`tools/googletest/`**。
- **构建很慢**：设置 **`ARKANALYZER_INCREMENTAL_CPP_BUILD=1`** 做增量；安装 **ninja** 可缩短 CMake 构建时间。
- **`npm run testonce` 未跑 cppCore**：未执行 **`build:cpp`** 或 `node_modules/@arkanalyzer/cxx-ast-parser` 不可用；`vitestCpp.js` 会跳过 C++ 集成测试。

---

## 11. OpenHarmony SDK：`OHOS_SDK_HOME`（运行分析，非 `build:cpp`）

编译 **`astJsonDumper.node`** 时 **不需要** 设置本变量。以下场景需要：使用 **`buildSceneConfigFromProject`**、CLI **`--ohos-sdk-home`**，或运行依赖 OHOS SDK 头文件的测试（见根目录 **`README.md`**、`vitest.config.ts`）。

将 **`OHOS_SDK_HOME`** 设为 **OpenHarmony Command Line Tools 安装目录下的 `sdk/default`**（或本机等效路径），且该目录下存在 **`openharmony/ets`** 或 **`hms/ets`** 之一时，ArkAnalyzer 才能按 `src/Config.ts` 中的逻辑收集 SDK（`collectSdksFromOhosSdkHome`）。

Linux 示例（路径按本机安装调整）：

```bash
export OHOS_SDK_HOME=/path/to/command-line-tools-6.1.0/sdk/default
```

也可在调用 CLI 时传入 **`--ohos-sdk-home <path>`**；未传参时回退读取环境变量 **`OHOS_SDK_HOME`**。

---

实现细节见仓库内 **`script/cpp/buildCpp.js`** 与 **`packages/cxx-ast-parser/cpp/CMakeLists.txt`**。  
Linux 统一开发环境见根目录 **`Dockerfile.dev`**（说明见上文 [§3.3](#33-docker-开发镜像dockerfiledev)）。  
C++ 前端架构与 Scene 管线见 **`docs/cppFrontend/cpp_frontend_user_guide.md`**；多语言能力与矩阵见 **`docs/MultiLanguageSupport.md`**。
