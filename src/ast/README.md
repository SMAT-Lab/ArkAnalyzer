# arkCppAstDumper工具使用

## 简介
arkCppAstDumper是基于libclang接口开发的工具，对C/C++生成简洁的抽象语法树并输出到json文件

## 开发指南

### windows
#### 环境准备
* llvm/clang发行版
* cmake 3.10及以上
* visual studio 17

#### 构建
     mkdir build && cd build
     cmake .. -G "visual Studio 17 2022" -A x64 -DCMAKE_BUILD_TYPE=Release -DCMAKE_TOOLCHAIN_FILE=../cmake/toolchains/windows.cmake
     cmake --build . --config Release

构建成功将会在/build下生成**arkCppAstDumper.exe**可执行文件
#### 执行依赖的文件
* libclang.dll
* vcruntime140.dll
* vcruntime140_1.dll

## linux

### 环境准备：

* llvm/clang发行版
* cmake 3.10及以上
* gcc 8.4(支持c++17以上的编译器)

### 构建

    build && cd build
    cmake ..
    make

构建成功将会在/build下生成**arkCppAstDumper.so**可执行文件
#### 执行依赖文件
* libclang.so
* libstdc++.so
* libgcc_s.so
* libc.so
* libz.so
* libm.so

## 使用示例

### 对单个文件生成抽象语法树到默认路径
    ./arkCppAstDumper.exe <文件.cpp>

### 对单个文件生成抽象语法树到指定路径
    ./arkCppAstDumper.exe <文件.cpp> -o <json文件指定路径>

### 传入-I编译参数(可传入多个)
    ./arkCppAstDumper.exe <文件.cpp> -o <json文件指定路径> -i <头文件路径> -i <头文件路径> ...


