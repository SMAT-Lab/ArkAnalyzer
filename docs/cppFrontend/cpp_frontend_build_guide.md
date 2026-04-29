# CPP 前端构建指南

本文说明在 **Linux / macOS / Windows** 上构建 `astJsonDumper` 之前需要安装的工具、推荐版本及环境变量。构建由仓库根目录脚本 `script/buildCpp.js` 驱动（`npm run build:cpp`）。

## 1. 构建什么、命令是什么

在仓库根目录执行 **`npm run build:cpp`**，于**当前操作系统**本机构建 `astJsonDumper`（Linux/macOS 下无扩展名，Windows 下为 `astJsonDumper.exe`）。不在此脚本中支持从 Linux/macOS 交叉编译 Windows PE。

源码与 CMake 工程根目录：`src/frontend/cppFrontend/ast`。  
脚本会在配置阶段向 CMake 传入 `LLVM_DIR` / `Clang_DIR`（若已探测或已设置）。

## 2. 通用依赖

- **CMake**：3.16+（工程 `cmake_minimum_required`），且 `cmake` 在 `PATH` 中。
- **LLVM / Clang**：需能通过 CMake `find_package(LLVM)`、`find_package(Clang)` 解析。仓库开发与 CI 以 **LLVM 19** 为主线；若使用其他主版本，需自行验证链接与头文件是否一致。
- **C++ 编译器**：支持 **C++17**（由 LLVM/Clang 或 MSVC 提供，取决于平台与生成器）。

脚本会按顺序尝试：环境变量 **`LLVM_DIR`**（若目录存在）、**`llvm-config` / `llvm-config-19`**（`--cmakedir`）、常见安装路径（见各节）。  
若同时设置 **`LLVM_DIR`** 与 **`Clang_DIR`**，将优先直接使用二者（路径需分别指向 `lib/cmake/llvm` 与 `lib/cmake/clang`）。

## 3. Linux（本机）

### 3.1 推荐软件包（Debian / Ubuntu 示例）

```bash
sudo apt-get update
sudo apt-get install -y cmake ninja-build llvm-19-dev libclang-19-dev
```

确保 `llvm-config-19` 在 `PATH` 中，或显式导出：

```bash
export LLVM_DIR=$(llvm-config-19 --cmakedir)
# 可选：Clang_DIR 通常可由脚本根据 LLVM_DIR 推导；若 CMake 报错再设：
# export Clang_DIR=$(dirname "$(llvm-config-19 --cmakedir)")/clang
```

### 3.2 注意

- 避免混用不同主版本的 LLVM 动态库（例如系统 `libLLVM.so` 与 `LLVM_DIR` 指向 19 不一致），否则易出现链接错误或 “DSO missing” 类问题。
- 其他发行版请使用对应包名安装 **LLVM/Clang 开发包** 与 **CMake**，原则同上。

## 4. macOS（本机）

### 4.1 Homebrew 示例

```bash
brew install cmake llvm@19 ninja
```

`llvm@19` 通常不在默认 shell PATH 中，可将 `$(brew --prefix llvm@19)/bin` 加入 `PATH`，或设置：

```bash
export LLVM_DIR="$(brew --prefix llvm@19)/lib/cmake/llvm"
export Clang_DIR="$(brew --prefix llvm@19)/lib/cmake/clang"
```

脚本在未设置 `LLVM_DIR` 时，也会尝试通过 `brew --prefix llvm` 或常见路径探测（以本机实际安装为准）。

### 4.2 注意

- Apple 自带 `clang` 不等于 **LLVM CMake 包**；若未安装 Homebrew LLVM，需自行提供可用的 `LLVM_DIR` / `Clang_DIR`。

## 5. Windows（本机，非 MSYS2）

适用于：官方安装包 **LLVM** + **Visual Studio**（含 “使用 C++ 的桌面开发”），在 **cmd / PowerShell** 或已配置好 PATH 的终端中执行 `npm run build:cpp`。

### 5.1 安装建议

- **CMake**：`winget install Kitware.CMake` 或从官网安装并加入 `PATH`。
- **LLVM**：`winget install LLVM.LLVM` 等，默认常见路径为 `C:\Program Files\LLVM\lib\cmake\llvm`；可将 `C:\Program Files\LLVM\bin` 加入 `PATH` 以便找到 `llvm-config.exe`。
- **Visual Studio 2022**：提供 MSVC 工具链与 Windows SDK；CMake 默认可能选用 Visual Studio 生成器。
- **Ninja（可选）**：若已安装并在 `PATH` 中，脚本会优先使用 **Ninja + Release** 单配置生成，产物路径更固定；否则使用 Visual Studio 多配置生成，构建时追加 `--config Release`，并在 `build\Release\` 等目录下查找 `astJsonDumper.exe`。

### 5.2 环境变量（可选）

```text
LLVM_DIR=C:\Program Files\LLVM\lib\cmake\llvm
Clang_DIR=C:\Program Files\LLVM\lib\cmake\clang
```

路径含空格时，在图形界面或脚本中设置即可，无需手动转义引号给 Node 脚本。

## 6. Windows（MSYS2 本机构建）

在 **MSYS2** 的 **MinGW x64**、**UCRT64** 或 **CLANG64** 环境中，使用 `pacman` 安装 LLVM/Clang 与构建工具，然后在**同一环境**中执行 `npm run build:cpp`（需能访问到该环境中的 `cmake`、`node`）。

### 6.1 MinGW64 环境示例

```bash
pacman -S mingw-w64-x86_64-llvm mingw-w64-x86_64-clang mingw-w64-x86_64-clang-tools-extra mingw-w64-x86_64-cmake mingw-w64-x86_64-ninja mingw-w64-x86_64-nodejs
```

### 6.2 UCRT64 环境

将包名前缀改为 `mingw-w64-ucrt-x86_64-*`（如 `mingw-w64-ucrt-x86_64-llvm` 等），与当前环境一致即可。

### 6.3 路径探测说明

脚本会结合 **`MSYS2_ROOT`**、**`MINGW_PREFIX`**（如 `/mingw64`）以及常见根目录（如 `C:\msys64` 下 `mingw64`、`ucrt64`、`clang64`）自动查找 `lib\cmake\llvm`。若 MSYS2 未安装在默认盘符路径，请设置 **`MSYS2_ROOT`** 或 **`LLVM_DIR`**。

## 7. 环境变量一览

| 变量 | 用途 |
| ---- | ---- |
| `LLVM_DIR` | 指向 `lib/cmake/llvm`（LLVM CMake 包目录） |
| `Clang_DIR` | 指向 `lib/cmake/clang`（可选；未设时脚本常从 `LLVM_DIR` 推导） |
| `MSYS2_ROOT` | 仅 Windows：MSYS2 安装根目录，辅助解析 `mingw64` 等前缀 |

## 8. 构建产物位置

成功执行后，脚本会将可执行文件复制到：

- 目录：`src/frontend/cppFrontend/ast/dumper/`
- 名称：`astJsonDumper`（Unix）或 `astJsonDumper.exe`（Windows）

中间构建目录：`src/frontend/cppFrontend/ast/build/`（若切换生成器或路径，可删除该目录后重试）。

## 9. 常见问题

- **CMake 找不到 LLVM**：先确认 `LLVM_DIR` 目录存在且包含 `LLVMConfig.cmake`；Linux 上优先使用 `llvm-config-19 --cmakedir` 输出。
- **Windows 上找不到产物**：确认是否使用 **Release** 配置；脚本会尝试 `build\`、`build\Release\`、`build\x64\Release\` 等路径。
- **版本混链**：同一构建中 `LLVM_DIR`、系统 `libLLVM`、PATH 中的 `clang` 应来自同一 LLVM 大版本，避免 18/19 混用。

更偏设计与链接策略的说明见：`docs/developer/cpp-ast-dumper-build-stability-design.md`。  
使用说明（含历史截图与工具链名）见：`docs/cppFrontend/ArkAnalyzer-cpp_usage_guide.md`。
