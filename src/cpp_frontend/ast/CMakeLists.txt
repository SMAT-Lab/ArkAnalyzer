cmake_minimum_required(VERSION 3.16)
project(astJsonDumper LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

find_package(LLVM REQUIRED CONFIG)
find_package(Clang REQUIRED CONFIG)

message(STATUS "LLVM_PACKAGE_VERSION: ${LLVM_PACKAGE_VERSION}")
message(STATUS "LLVM_DIR: ${LLVM_DIR}")
message(STATUS "LLVM_INCLUDE_DIRS: ${LLVM_INCLUDE_DIRS}")
message(STATUS "Clang_DIR: ${Clang_DIR}")
message(STATUS "CLANG_INCLUDE_DIRS: ${CLANG_INCLUDE_DIRS}")

add_executable(astJsonDumper
    cppAstDumper.cpp
    utils/compile_db_utils.cpp
    utils/output_path.cpp
    utils/cli_options.cpp
    utils/source_utils.cpp
    utils/header_units.cpp
    utils/json_streaming.cpp
)

# for "utils/compile_db_utils.h"
target_include_directories(astJsonDumper PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}
    ${LLVM_INCLUDE_DIRS}
    ${CLANG_INCLUDE_DIRS}
)

# LLVM_DEFINITIONS is usually "-D..." style; keep as compile options.
separate_arguments(LLVM_DEFINITIONS_LIST NATIVE_COMMAND "${LLVM_DEFINITIONS}")
target_compile_options(astJsonDumper PRIVATE ${LLVM_DEFINITIONS_LIST})

target_link_libraries(astJsonDumper PRIVATE
    clangTooling
    clangFrontend
    clangAST
    clangLex
    clangBasic
)

if(MSVC)
    target_compile_options(astJsonDumper PRIVATE
        /utf-8
        /wd4291
        /wd4244
    )
    target_link_options(astJsonDumper PRIVATE
        /ignore:4199
    )
endif()
