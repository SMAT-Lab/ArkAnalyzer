# arkCppAstDumper工具使用

## 简介
arkCppAstDumper是基于libclang开发的工具，对C/C++生成简洁的抽象语法树并输出到json文件。基于libclang是因为该工具需要应用到IDE，需要考虑到工具的大小、性能、依赖环境等要求。libclang相比clang的依赖环境更简单、工具更小，生成的抽象语法树也基本能满足在IDE上的需求。

|         | libclang插件                                             | clang插件                |
|---------|--------------------------------------------------------|------------------------|
| 插件大小    | 311KB                                                  | 16MB                   |
| AST大小   | 13MB                                                   | 13MB                   |
| 生成AST时间 | 3s                                                     | 4s                     |
| 编译环境依赖  | clnag-c下的13个文件                                         | llvm/clang下的文件 <br/>   |
| 执行环境依赖  | libclang.dll、vcruntime140.dll、vcruntime140_1.dll，可独立执行 | 完整的llvm/clang环境，不能独立执行 |


## 开发指南

### windows
#### 环境准备
* llvm/clang发行版
* cmake 3.10及以上
* visual studio 17(支持c++17以上的编译器)

#### 构建
     mkdir build && cd build
     cmake .. -G "visual Studio 17 2022" -A x64 -DCMAKE_BUILD_TYPE=Release
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

### libclang重要的接口

1、创建一个新的索引对象管理全局编译环境（如预编译头文件、诊断输出

    clang_createIndex(
    int excludeDeclarationsFromPCH,     // 设为 1 忽略预编译头中的声明
    int displayDiagnostics)             // 设为 1 在控制台输出 Clang 的诊断信息

2、解析源文件生成AST

    CXTranslationUnit clang_parseTranslationUnit(
    CXIndex index,                         // 索引对象
    const char *source_filename,           // 源文件
    const char *const *command_line_args,  // 编译器参数（如 -I, -D）
    int num_command_line_args,             // 编译器参数的个数
    struct CXUnsavedFile *unsaved_files,   // 内存中的未保存文件（用于实时编辑）
    unsigned num_unsaved_files,            // 内存中的未保存文件的个数
    unsigned options                       // CXTranslationUnit_None（多种解析选项）
    );

3、获取翻译单元的根游标

    clang_getTranslationUnitCursor(CXTranslationUnit TU)

4、遍历子节点

    unsigned clang_visitChildren(
    CXCursor parent,              // 父节点
    CXCursorVisitor visitor,      // 回调函数
    CXClientData client_data      // 用户自定义数据
    );

5、回调函数模板

    enum CXChildVisitResult visitor(
    CXCursor cursor,             // 当前节点
    CXCursor parent,             // 父节点
    CXClientData client_data     // 透传数据
    ) {
     return CXChildVisit_Continue; // 控制遍历行为
    }

## 工具使用示例

### 对单个文件生成抽象语法树并输出到文件.cpp同级路径下（默认路径）
    ./arkCppAstDumper.exe <文件.cpp>

### 对单个文件生成抽象语法树并输出到指定路径
    ./arkCppAstDumper.exe <文件.cpp> -o <json文件指定路径>

### 对单个文件生成抽象语法树并提供编译数据库文件
    ./arkCppAstDumper.exe <文件.cpp> -o <json文件指定路径> -c <编译数据库文件路径>

### 对单个文件生成抽象语法树并提供多个-I编译参数
    ./arkCppAstDumper.exe <文件.cpp> -o <json文件指定路径> -i <头文件路径> -i <头文件路径> ...


