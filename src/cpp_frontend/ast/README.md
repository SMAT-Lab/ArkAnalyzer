# astJsonDumper工具使用

## 简介

astJsonDumper是基于llvm的libtooling开发的工具，对C/C++生成抽象语法树并输出到json文件。该工具需要应用到IDE，需要考虑到工具的大小、性能、依赖环境等要求。该工具对比业界的依赖环境更简单、工具更小，生成的抽象语法树也基本能满足在IDE上的需求。

## 与 Unit 测试

仓库根目录执行 `npm test` 时，`tests/unit/core_cpp` 下的用例依赖可执行的 **astJsonDumper**（查找路径见 `src/cpp_frontend/ast/const.ts` 中的 `getAstJsonDumperPath()` / `isAstJsonDumperAvailable()`）。构建完成后请将可执行文件放到 `src/cpp_frontend/ast/dumper/` 或 `lib/ast/`（与 `prepack` 拷贝规则一致）。若上述路径不存在该二进制，Vitest 将跳过 `tests/unit/core_cpp/**`，并在控制台输出提示。

## 开发指南

### 多系统构建脚本

相对路径：\cmake\toolchains
- mingw.cmake：在linux环境交叉编译构建windows执行文件的构建脚本
- macos.cmake：在linux环境交叉编译构建mac执行文件的构建脚本

## windows版本

### 环境准备

- llvm 19.1.7
- cmake 3.10及以上
- 构建工具visual studio 2022 17(支持c++17以上的编译器)，选择C++的桌面开发进行安装环境（windows平台构建）
- llvm-ming 与llvm版本一致，（llvm平台交叉编译构建）

### windows平台构建

     mkdir build && cd build
     cmake ..
     cmake --build . --config Release
构建成功将会在/build/Release目录下生成**astJsonDumper.exe**可执行文件

### linux平台交叉编译构建

     mkdir build && cd build
     cmake -DCMAKE_TOOLCHAIN_FILE=..\cmake\toolchains\mingw.cmake ..
     make
构建成功将会在/build目录下生成**astJsonDumper.exe**可执行文件

llvm平台交叉编译构建的工具执行时需依赖下面的两个文件

- libc++.dll (可从llvm-mingw的x86_64-w64-mingw32\bin目录下获取)
- libunwind.dll (可从llvm-mingw的x86_64-w64-mingw32\bin目录下获取)

## linux版本

### 环境准备：

- llvm 19.1.7
- cmake 3.10及以上
- gcc 8.4(支持c++17以上的编译器)

### 构建

    build && cd build
    cmake ..
    make

构建成功将会在/build下生成**astJsonDumper**可执行文件

## mac版本

### 环境准备：

- llvm 19.1.7
- cmake 3.10及以上
- Osxcross，（llvm平台交叉编译构建）

### 构建

    build && cd build
    cmake -DCMAKE_TOOLCHAIN_FILE=..\cmake\toolchains\macos.cmake ..
    make

构建成功将会在/build下生成**astJsonDumper**可执行文件


## arkCppAstDumper工具使用示例

### 对单个文件生成抽象语法树并输出到文件.cpp同级路径下（默认路径）

    ./astJsonDumper.exe <文件.cpp>

### 对单个文件生成抽象语法树并输出到指定路径

    ./astJsonDumper.exe <文件.cpp> -o <json文件指定路径>

### 对单个文件生成抽象语法树并提供编译数据库文件

    ./astJsonDumper.exe <文件.cpp> -o <json文件指定路径> -p <编译数据库文件路径>

### 对单个文件生成抽象语法树并提供编译数据库文件和多个-I编译参数

    ./astJsonDumper.exe <文件.cpp> -o <json文件指定路径> -p <编译数据库文件路径> --extra-arg-before=-I<头文件路径> --extra-arg-before=-I<头文件路径> ..

