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

### windows

#### 环境准备

- llvm/clang 19.1.7
- cmake 3.10及以上
- visual studio 17(支持c++17以上的编译器)

#### 构建

     mkdir build && cd build
     cmake .. -G "visual Studio 17 2022" -A x64 -DCMAKE_BUILD_TYPE=Release
     cmake --build . --config Release

构建成功将会在/build下生成**arkCppAstDumper.exe**可执行文件

#### 执行依赖的文件

- libclang.dll
- vcruntime140.dll
- vcruntime140_1.dll

## linux

### 环境准备：

- llvm/clang发行版
- cmake 3.10及以上
- gcc 8.4(支持c++17以上的编译器)

### 构建

    build && cd build
    cmake ..
    make

构建成功将会在/build下生成**arkCppAstDumper.so**可执行文件

#### 执行依赖文件

- libclang.so
- libstdc++.so
- libgcc_s.so
- libc.so
- libz.so
- libm.so


## 工具使用示例

### 对单个文件生成抽象语法树并输出到文件.cpp同级路径下（默认路径）

    ./arkCppAstDumper.exe <文件.cpp>

### 对单个文件生成抽象语法树并输出到指定路径

    ./arkCppAstDumper.exe <文件.cpp> -o <json文件指定路径>

### 对单个文件生成抽象语法树并提供编译数据库文件

    ./arkCppAstDumper.exe <文件.cpp> -o <json文件指定路径> -c <编译数据库文件路径>

### 对单个文件生成抽象语法树并提供多个-I编译参数

    ./arkCppAstDumper.exe <文件.cpp> -o <json文件指定路径> -i <头文件路径> -i <头文件路径> ...
