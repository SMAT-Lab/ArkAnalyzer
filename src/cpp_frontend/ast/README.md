# arkCppAstDumper工具使用

## 简介

arkCppAstDumper是基于llvm开发的工具，对C/C++生成简洁的抽象语法树并输出到json文件。该工具需要应用到IDE，需要考虑到工具的大小、性能、依赖环境等要求。该工具对比业界的依赖环境更简单、工具更小，生成的抽象语法树也基本能满足在IDE上的需求。

|              | 本工具插件                                              | llvm插件                |
| ------------ |----------------------------------------------------|-----------------------|
| 插件大小     | 311KB                                              | 16MB                  |
| AST大小      | 13MB                                               | 13MB                  |
| 生成AST时间  | 3s                                                 | 4s                    |
| 编译环境依赖 | llvm c接口编程下的13个文件                                  | llvm/clang下的文件 <br/>  |
| 执行环境依赖 | llvm/bin、vcruntime140.dll、vcruntime140_1.dll，可独立执行 | 完整的llvm环境，不能独立执行 |

## 开发指南

### 构建脚本

相对路径：\cmake\toolchains
- linux.cmake：在linux环境的构建脚本
- mingw.cmake：在linux环境交叉编译构建windows执行文件的构建脚本
- windows.cmake：在windows环境的构建脚本

## windows

### 环境准备

- llvm 19.1.7
- cmake 3.10及以上
- 构建工具visual studio 17(支持c++17以上的编译器)

### 构建

     mkdir build && cd build
     cmake -DCMAKE_TOOLCHAIN_FILE=..\cmake\toolchains\windows.cmake ..
     cmake --build . --config Release

构建成功将会在/build下生成**arkCppAstDumper.exe**可执行文件

### 工具执行的依赖文件

- libclang.dll（可从windows环境下clang的bin目录下获取）
- vcruntime140.dll（可从Microsoft Visual Studio的MSVC目录下获取）
- vcruntime140_1.dll（可从Microsoft Visual Studio的MSVC目录下获取）

### 工具解析cpp文件需引入的标准库头文件

- visual studio 17会默认查找MSVC头文件

- devEcoStudio需手动-i引入下列头文件目录

  1、/devEcoStudio/sdk/default/openharmony/native/llvm/incldue/c++/v1 \
  2、/devEcoStudio/sdk/default/openharmony/native/llvm/incldue/x86_64-unknown-linux-gnu/c++/v1 \
  3、/devEcoStudio/sdk/default/openharmony/native/llvm/lib/clang/<版本号>/include
  

## linux

### 环境准备：

- llvm 19.1.7
- cmake 3.10及以上
- gcc 8.4(支持c++17以上的编译器)

### 构建

    build && cd build
    cmake -DCMAKE_TOOLCHAIN_FILE=..\cmake\toolchains\linux.cmake ..
    make

构建成功将会在/build下生成**arkCppAstDumper**可执行文件

### 工具执行的依赖文件

- libclang.so（可从linux环境下clang的lib目录下获取）
- libstdc++.so（可从gcc的目录下获取）
- libgcc_s.so（可从gcc的目录下获取）
- libc.so（linux环境自带）
- libz.so（linux环境自带）
- libm.so（linux环境自带）

### 工具解析cpp文件需引入的标准库头文件

- common-line-tools需手动-i引入下列头文件目录

  1、/common-line-tools/sdk/default/openharmony/native/llvm/incldue/c++/v1 \
  2、/common-line-tools/sdk/default/openharmony/native/llvm/incldue/x86_64-unknown-linux-gnu/c++/v1 \
  3、/common-line-tools/sdk/default/openharmony/native/llvm/lib/clang/<版本号>/include

## arkCppAstDumper工具使用示例

### 对单个文件生成抽象语法树并输出到文件.cpp同级路径下（默认路径）

    ./arkCppAstDumper.exe <文件.cpp>

### 对单个文件生成抽象语法树并输出到指定路径

    ./arkCppAstDumper.exe <文件.cpp> -o <json文件指定路径>

### 对单个文件生成抽象语法树并提供编译数据库文件

    ./arkCppAstDumper.exe <文件.cpp> -o <json文件指定路径> -c <编译数据库文件路径>

### 对单个文件生成抽象语法树并提供多个-I编译参数

    ./arkCppAstDumper.exe <文件.cpp> -o <json文件指定路径> -i <头文件路径> -i <头文件路径> ...

## arkCppAstDumper工具解析策略
- arkCppAstDumper会优先从-c获取编译数据库引入头文件的编译参数，如果编译数据库不存在再从-i获取引入头文件的编译参数，-c参数和-i参数不能同时存在，只能选其一。
