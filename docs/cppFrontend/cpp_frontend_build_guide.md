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

**WSL2** 用户：步骤 1 与 [§3.1](#31-推荐软件包debian--ubuntu-示例) 相同（在 WSL 的 Ubuntu 内执行 apt 命令）。  
**macOS** 用户：见 [§4.0 macOS Checklist](#40-macos-checklist)。  
**Windows** 用户：推荐 [§6 MSYS2 + PowerShell](#6-windowsmsys2--powershell推荐与-ci-一致)；亦可走 [§5 纯原生安装](#5-windows本机官方-llvm--visual-studio)（LLVM 官方包 + Visual Studio）。步骤 2–7 在各平台仓库根目录执行方式相同。

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

适用于在 **macOS 12+**（Monterey 及更新）上本机构建。仓库 CI 在 **`macos-14` + Homebrew `llvm@19`** 上验证；本地推荐与 CI 对齐。

### 4.0 macOS Checklist

| 步骤 | 命令 / 动作 | 成功标志 |
|------|-------------|----------|
| 0. 命令行工具 | `xcode-select --install`（若尚未安装） | `clang --version` 有输出 |
| 1. Homebrew | 见 [§4.1](#41-推荐软件包homebrew) | `brew --version` 有输出 |
| 2. 构建依赖 | `brew install git cmake ninja llvm@19` | `$(brew --prefix llvm@19)/bin/llvm-config --version` 为 19.x |
| 3. PATH / LLVM | 见 [§4.2](#42-环境变量与-shell-配置) | `llvm-config --version` 为 19.x（或已 export `LLVM_DIR`） |
| 4. Node.js | 安装 **Node ≥ 18**（推荐 **20 LTS**） | `node -v`、`npm -v` 有输出 |
| 5. 克隆与 JS 依赖 | `git clone … && cd arkanalyzer && npm install` | 存在 `node_modules/node-api-headers/include/node_api.h` |
| 6. 编译 C++ | `npm run build:cpp` | 存在 `packages/cxx-ast-parser/dumper/astJsonDumper.node` |
| 7. 验证（可选） | `npm run test:cpp` | GTest 用例通过 |
| 8. 验证 TS 集成（可选） | `npm run testonce` | 含 `tests/unit/cppCore/**` 的 Vitest 用例通过 |

**Apple Silicon（M 系列）** 与 **Intel** 本机构建步骤相同；Homebrew 前缀分别为 **`/opt/homebrew`** 与 **`/usr/local`**。  
**npm 预编译平台包**仅发布 **`darwin-arm64`**（CI 在 `macos-14` runner 上构建，见 [`.github/workflows/npm-publish.yml`](../../.github/workflows/npm-publish.yml)）；**不提供 `darwin-x64` 包**。Intel Mac 需在本地执行 **`npm run build:cpp`** 从源码编译 addon（`packPlatformCxxPackage.js` 的 `PLATFORM_OS_CPU` 亦未包含 `darwin-x64`）。

### 4.1 推荐软件包（Homebrew）

若尚未安装 [Homebrew](https://brew.sh/)，先按官网说明安装，再执行：

```bash
brew install git cmake ninja llvm@19
```

**`llvm@19` 为 keg-only**（不会自动链接到 `/opt/homebrew/bin` 或 `/usr/local/bin`），系统自带的 **`clang`** 往往仍是 Apple Clang 或旧版 LLVM，**不能**替代 LibTooling 所需的 LLVM 19 CMake 包。务必使用 Homebrew 的 **`llvm@19`**。

可选：运行 **`npm run test:cpp`** 前安装 GoogleTest，避免首次联网下载：

```bash
brew install googletest
```

脚本会探测 **`$(brew --prefix googletest)`** 下的头文件与 CMake 配置；未安装时仍会尝试下载到 **`tools/googletest/`**（与 Linux 相同）。

### 4.2 环境变量与 shell 配置

将 Homebrew LLVM 19 加入当前 shell（**zsh** 示例，写入 `~/.zshrc` 可持久化）：

```bash
LLVM_PREFIX="$(brew --prefix llvm@19)"
export PATH="$LLVM_PREFIX/bin:$PATH"
export LLVM_DIR="$LLVM_PREFIX/lib/cmake/llvm"
export Clang_DIR="$LLVM_PREFIX/lib/cmake/clang"
```

说明：

- **`Clang_DIR`** 在 Homebrew 上目录名为小写 **`clang`**（`…/lib/cmake/clang`），与 Linux 部分发行版的 `Clang` 大小写可能不同；以本机 `ls "$(brew --prefix llvm@19)/lib/cmake"` 为准。
- 仅设置 **`LLVM_DIR`** 时，`buildCpp.js` 会尝试通过 **`brew --prefix llvm@19`** / **`llvm`**、`llvm-config --cmakedir`，以及 **`/opt/homebrew/opt/llvm@19`**、**`/usr/local/opt/llvm@19`** 等常见路径自动探测（见 `script/cpp/buildCpp.js` 中 `UNIX_LLVM_PREFIXES`）。
- 配置完成后建议自检：

```bash
llvm-config --version          # 期望 19.x
test -f "$LLVM_DIR/LLVMConfig.cmake" && echo OK
test -d "$Clang_DIR" && echo OK
```

### 4.3 完整闭环示例

```bash
git clone <repo-url> arkanalyzer && cd arkanalyzer

# 若未写入 ~/.zshrc，先 export PATH / LLVM_DIR / Clang_DIR（见 §4.2）
npm install
npm run build:cpp
npm run test:cpp    # 可选
npm run testonce    # 可选；需已 build:cpp
```

### 4.4 注意

- 在仓库根目录执行 **`npm install`**，以便使用 **`node_modules/node-api-headers`** 作为 N-API 头路径（macOS 无 **`/usr/include/node`** 回退，**必须**完成 `npm install` 或设置 **`NODE_API_INCLUDE_DIR`**）。
- **Xcode / Apple Clang** 可提供基础编译环境，但 **不能** 作为 `find_package(LLVM)` / LibTooling 的替代；请安装 Homebrew **`llvm@19`**。
- 避免混用不同主版本的 LLVM 动态库（例如 `PATH` 中仍是旧版 `llvm-config`，而 `LLVM_DIR` 指向 19），否则易出现链接错误或运行时符号缺失。
- 若运行时提示找不到 **`libLLVM.dylib`** 等，可临时：

  ```bash
  export DYLD_LIBRARY_PATH="$(llvm-config --libdir):$DYLD_LIBRARY_PATH"
  ```

  （路径以本机 `llvm-config --libdir` 为准；生产/发布场景更推荐在打包时收集依赖，与 CI 的 `otool -L` 流程一致。）
- **`ARKANALYZER_USE_LLD`** 仅在 Linux 上生效；macOS 使用系统默认链接器即可。
- Intel Mac 上 Homebrew 前缀为 **`/usr/local`**，脚本探测列表已包含；无需为 x64 单独改 CMake 参数。

---

## 5. Windows（本机：官方 LLVM + Visual Studio）

适用于：在 **cmd / PowerShell** 中使用 **LLVM 官方安装包** + **Visual Studio 2022**（含 “使用 C++ 的桌面开发”）构建，**不依赖 MSYS2**。  
若希望与仓库 **CI（`windows-2022`）** 一致、减少路径问题，更推荐 [§6 MSYS2 + PowerShell](#6-windowsmsys2--powershell推荐与-ci-一致)。

### 5.0 Windows Checklist（原生 LLVM 路线）

| 步骤 | 命令 / 动作 | 成功标志 |
|------|-------------|----------|
| 1. Git | [Git for Windows](https://git-scm.com/download/win) 或 `winget install Git.Git` | `git --version` |
| 2. Node.js | **Node ≥ 18**（推荐 **20 LTS**） | `node -v`、`npm -v` |
| 3. CMake | `winget install Kitware.CMake` | `cmake --version` ≥ 3.16 |
| 4. LLVM 19 | 见 [§5.1](#51-安装建议) | 存在 `%ProgramFiles%\LLVM\lib\cmake\llvm\LLVMConfig.cmake` |
| 5. Visual Studio | VS 2022 +「使用 C++ 的桌面开发」 | `cl` 或 VS 开发者 PowerShell 可用 |
| 6. Ninja（推荐） | `winget install Ninja-build.Ninja` | `ninja --version` |
| 7. 克隆与依赖 | `git clone …`、`npm install` | 存在 `node_modules\node-api-headers\include\node_api.h` |
| 8. 编译 | `npm run build:cpp` | 存在 `packages\cxx-ast-parser\dumper\astJsonDumper.node` |
| 9. 验证（可选） | `npm run test:cpp` | GTest 用例通过 |

### 5.1 安装建议

**Git**

```powershell
winget install --id Git.Git -e
```

**Node.js**

从 [nodejs.org](https://nodejs.org/) 安装 LTS，或：

```powershell
winget install OpenJS.NodeJS.LTS
```

**CMake**

```powershell
winget install Kitware.CMake
```

安装后重新打开终端，确认 `cmake` 在 `PATH` 中。

**LLVM 19**

优先安装与仓库主线一致的 **19.x**（`winget` 源中的版本号以查询结果为准）：

```powershell
winget search LLVM.LLVM
winget install LLVM.LLVM
```

常见安装根目录（脚本 `windowsLlvmInstallRoots()` 会依次探测）：

| 变量 / 路径 | 说明 |
|-------------|------|
| `%ProgramFiles%\LLVM` | 官方安装包默认位置 |
| `%ProgramFiles(x86)%\LLVM` | 部分环境 |
| `%LOCALAPPDATA%\Programs\LLVM` | 用户级安装 |

将 **`C:\Program Files\LLVM\bin`**（或实际安装路径下的 `bin`）加入系统 **PATH**，以便找到 **`llvm-config.exe`**。验证：

```powershell
& "${env:ProgramFiles}\LLVM\bin\llvm-config.exe" --version
```

**Visual Studio 2022**

安装 [Visual Studio 2022](https://visualstudio.microsoft.com/zh-hans/downloads/)，勾选工作负载 **「使用 C++ 的桌面开发」**（含 MSVC、Windows SDK、CMake 工具可选组件）。  
未安装 **Ninja** 时，`buildCpp.js` 会使用 **Visual Studio 多配置生成器**，构建阶段自动追加 **`--config Release`**，产物可能在 `packages\cxx-ast-parser\cpp\build\Release\astJsonDumper.node`；脚本会在 `build\`、`build\Release\`、`build\x64\Release\` 等路径中查找（见 `WIN_OUTPUT_SUBDIRS`）。

**Ninja（强烈推荐）**

```powershell
winget install Ninja-build.Ninja
```

当 **`ninja` 在 PATH 中** 时，Windows 上会使用 **`-G Ninja` + `-DCMAKE_BUILD_TYPE=Release`**，产物路径与 Linux 类似，固定在 `build\astJsonDumper.node`，排错更简单。

### 5.2 环境变量

在 **系统环境变量** 或当前 PowerShell 会话中设置（路径按本机安装调整）：

```powershell
$env:LLVM_DIR = "$env:ProgramFiles\LLVM\lib\cmake\llvm"
$env:Clang_DIR = "$env:ProgramFiles\LLVM\lib\cmake\clang"
```

持久化示例（当前用户）：

```powershell
[Environment]::SetEnvironmentVariable('LLVM_DIR', "$env:ProgramFiles\LLVM\lib\cmake\llvm", 'User')
[Environment]::SetEnvironmentVariable('Clang_DIR', "$env:ProgramFiles\LLVM\lib\cmake\clang", 'User')
```

路径含空格时无需为 Node 脚本额外加引号；`buildCpp.js` 以参数形式传给 CMake。

Windows 上还会传入 **`NODE_API_DEF`**（`node-api-headers` 中的 `node_api.def`），用于 N-API addon 链接；请确保在仓库根已执行 **`npm install`**。

### 5.3 完整闭环示例（PowerShell）

在 **x64 Native Tools** 或已配置好 `cl`/SDK 的 PowerShell 中，于仓库根目录执行：

```powershell
git clone <repo-url> arkanalyzer
cd arkanalyzer
npm install
npm run build:cpp
npm run test:cpp    # 可选
```

若 CMake 选用 Visual Studio 生成器且构建失败，可打开 **「x64 Native Tools Command Prompt for VS 2022」** 再执行上述命令，或确认已安装 C++ 工作负载。

### 5.4 注意

- **`npm install` 不可省略**：Windows 无 Linux 的 `/usr/include/node` 回退；`node_api.h` 来自 **`node-api-headers`**。
- 脚本会将 **`CMAKE_CXX_COMPILER` / `CMAKE_C_COMPILER`** 设为 LLVM 安装目录下的 **`clang++.exe` / `clang.exe`**（若存在），与 MSVC 共存时避免误用系统 Clang。
- **GTest**：`npm run test:cpp` 可识别 **vcpkg**（设置 **`VCPKG_ROOT`** 并安装 `gtest`）或自动下载到 **`tools/googletest/`**；原生路线通常依赖自动下载。
- 若报 **找不到 `astJsonDumper.node`**：确认使用 **Release**；安装 **Ninja** 后重试；或删除 **`packages/cxx-ast-parser/cpp/build`** 后全量重建。
- 发布 npm 平台包名为 **`@arkanalyzer/cxx-ast-parser-win32-x64`**；addon 依赖的 DLL 需与 `.node` 同目录或已在 `PATH` 中（CI 使用 `collectWindowsParserDlls.js` 收集；本地开发一般只需能成功 `require` addon）。

---

## 6. Windows（MSYS2 + PowerShell，推荐，与 CI 一致）

仓库 **GitHub Actions**（`windows-2022`）采用：**MSYS2 MinGW64 安装 LLVM / Clang / CMake / Ninja**，在 **PowerShell** 中执行 **`npm install`** 与 **`npm run build:cpp`**（不在 MSYS shell 内跑 Node 构建，以避免 FlatBuffers 等在非 `C:` 盘路径下解压异常）。本地推荐同一流程。

### 6.0 Windows Checklist（MSYS2 路线）

| 步骤 | 环境 | 动作 | 成功标志 |
|------|------|------|----------|
| 1 | — | 安装 [MSYS2](https://www.msys2.org/)（默认 `C:\msys64`） | 存在 `C:\msys64\mingw64.exe` |
| 2 | **MINGW64** | [§6.1](#61-mingw64安装依赖) `pacman` 安装 LLVM 等 | `/mingw64/bin/llvm-config.exe --version` |
| 3 | **MINGW64** | [§6.2](#62-解析-llvm_dir--clang_dir) 导出 Windows 风格路径 | `$env:LLVM_DIR` 在 PowerShell 中可 `Test-Path` |
| 4 | **PowerShell** | 安装 Node.js、`git clone`、`npm install` | `node_modules\node-api-headers` 存在 |
| 5 | **PowerShell** | 将 MinGW `bin`  prepend 到 `PATH` 后 `npm run build:cpp` | `packages\cxx-ast-parser\dumper\astJsonDumper.node` 存在 |
| 6 | **PowerShell**（可选） | `npm run test:cpp` | GTest 通过 |

### 6.1 MinGW64：安装依赖

打开 **「MSYS2 MinGW x64」** 终端（`mingw64.exe`），执行：

```bash
pacman -Syu
pacman -S --needed \
  git \
  mingw-w64-x86_64-llvm \
  mingw-w64-x86_64-clang \
  mingw-w64-x86_64-clang-tools-extra \
  mingw-w64-x86_64-cmake \
  mingw-w64-x86_64-ninja \
  mingw-w64-x86_64-libxml2 \
  mingw-w64-x86_64-libiconv \
  mingw-w64-x86_64-xz
```

验证：

```bash
/mingw64/bin/llvm-config --version
/mingw64/bin/clang++ --version
```

说明：**不必**在 MSYS2 内安装 `mingw-w64-x86_64-nodejs`；Node 使用 Windows 侧官方安装包即可（与 CI 一致）。

### 6.2 解析 LLVM_DIR / Clang_DIR

仍在 **MINGW64** shell 中，将 CMake 包目录转为 Windows 路径并写入后续 PowerShell 可用的形式（与 CI `Resolve Windows LLVM cmake dirs` 步骤相同）：

```bash
llvm_dir_win=$(cygpath -m "$(dirname "$(find /mingw64 -name LLVMConfig.cmake | head -1)")")
clang_dir_win=$(cygpath -m "$(dirname "$(find /mingw64 -name ClangConfig.cmake | head -1)")")
mingw_bin_win=$(cygpath -m /mingw64/bin)
echo "LLVM_DIR=$llvm_dir_win"
echo "Clang_DIR=$clang_dir_win"
echo "MINGW_BIN=$mingw_bin_win"
```

在 **PowerShell** 中设置（将上一步输出代入；MSYS 非默认盘符时设置 **`MSYS2_ROOT`**，例如 `D:\msys64`）：

```powershell
$env:LLVM_DIR = 'C:/msys64/mingw64/lib/cmake/llvm'      # 示例，以 cygpath 输出为准
$env:Clang_DIR = 'C:/msys64/mingw64/lib/cmake/clang'
$env:MINGW_BIN = 'C:/msys64/mingw64/bin'
$env:PATH = "$env:MINGW_BIN;$env:PATH"
```

`buildCpp.js` 也会根据 **`MSYS2_ROOT`**、**`MINGW_PREFIX`**（如 `/mingw64`）及 `C:\msys64\mingw64` 等自动探测；非默认安装路径时建议显式设置 **`LLVM_DIR`**。

### 6.3 PowerShell：构建

```powershell
cd C:\path\to\arkanalyzer
npm install
npm run build:cpp
```

此路线下 **`ninja`** 通常在 `MINGW_BIN` 中，CMake 使用 **Ninja + Release**，产物路径稳定。

### 6.4 UCRT64 / Clang64 环境

若使用 **UCRT64** 或 **Clang64**，将 [§6.1](#61-mingw64安装依赖) 中包名前缀改为 **`mingw-w64-ucrt-x86_64-*`** 或 **`mingw-w64-clang-x86_64-*`**，并在对应环境中执行 `pacman`；**`MINGW_PREFIX`** 分别为 `/ucrt64`、`/clang64`。构建仍在 **PowerShell** 中完成，且 **`PATH`** 需指向对应环境的 `bin`（如 `C:\msys64\ucrt64\bin`）。

### 6.5 注意

- **`npm install` 请在 PowerShell（或 cmd）中执行**，不要在 MSYS2 bash 内对仓库跑 Node 安装，以免路径与权限与 Windows 原生 Node 不一致。
- CI 注释说明：在 MSYS shell 内构建会因 **`D:\` 等非 `C:` 工作区** 导致 FlatBuffers zip 解压失败；PowerShell 构建可规避。
- 端到端用户机器通常**没有** MSYS2；发布 Windows 平台 npm 包时需将 **`astJsonDumper.node` 及其依赖 DLL** 一并打入 `dumper/`（本地可参考 `node script/cpp/collectWindowsParserDlls.js`）。
- 若仅在 MSYS2 终端内开发、坚持全流程在 MSYS 内执行 `npm run build:cpp`，需保证该环境能访问 Windows 版 `node`、`npm` 以及仓库根的 `node_modules`；**仍不推荐**作为默认流程。

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

**产物命名示例**（版本号与主包 `package.json` 的 `version` 一致）。CI Release 与 `script/cpp/packPlatformCxxPackage.js` 的 **`PLATFORM_OS_CPU`** 仅支持下列 **4** 个平台三元组（**macOS 仅 `darwin-arm64` 一行**）：

| 平台 | npm 包名 | tgz 文件名模式 | CI runner |
|------|----------|----------------|-----------|
| Linux x64 | `@arkanalyzer/cxx-ast-parser-linux-x64` | `arkanalyzer-cxx-ast-parser-linux-x64-<version>.tgz` | `ubuntu-22.04` |
| Linux arm64 | `@arkanalyzer/cxx-ast-parser-linux-arm64` | `arkanalyzer-cxx-ast-parser-linux-arm64-<version>.tgz` | `ubuntu-22.04-arm` |
| macOS arm64 | `@arkanalyzer/cxx-ast-parser-darwin-arm64` | `arkanalyzer-cxx-ast-parser-darwin-arm64-<version>.tgz` | `macos-14` |
| Windows x64 | `@arkanalyzer/cxx-ast-parser-win32-x64` | `arkanalyzer-cxx-ast-parser-win32-x64-<version>.tgz` | `windows-2022` |

**注意**：

- addon 为**本机编译**的原生二进制，**不能**在 Linux 上交叉打出 Windows/macOS 包；各平台需在对应 OS 上分别 `build:cpp` 再打包。
- **macOS Intel（`darwin-x64`）** 无预编译 npm 包；请在 Intel Mac 上按 [§4](#4-macos本机) 本地 `build:cpp`，不要安装 `darwin-arm64` 包（架构不匹配）。

---

## 10. 常见问题

- **CMake 找不到 LLVM**：先确认 `LLVM_DIR` 目录存在且包含 `LLVMConfig.cmake`；Linux 上优先使用 `llvm-config-19 --cmakedir` 输出；macOS 上确认 `brew --prefix llvm@19` 与 `PATH` 一致；Windows MSYS2 路线在 MINGW64 中用 `cygpath` 导出路径后在 PowerShell 构建。
- **`node_api.h not found`**：在仓库根执行 **`npm install`**（拉取 `node-api-headers`），或设置 **`NODE_API_INCLUDE_DIR`** 指向本机 Node 开发头文件目录（macOS / Windows 无 `/usr/include/node` 回退）。
- **macOS 上 `clang` 版本不是 19**：Homebrew `llvm@19` 为 keg-only，需将 `$(brew --prefix llvm@19)/bin` 置于 `PATH` 前列，或显式设置 `LLVM_DIR` / `Clang_DIR`。
- **Windows 上找不到 `astJsonDumper.node`**：确认是否使用 **Release** 配置；安装 **Ninja** 并将 MinGW `bin` 加入 `PATH`（MSYS2 路线）；脚本会尝试 `build\`、`build\Release\`、`build\x64\Release\` 等路径查找 **`.node`** 文件。
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
