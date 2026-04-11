cmake_minimum_required(VERSION 3.16)
project(astJsonDumper LANGUAGES C CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

find_package(LLVM REQUIRED CONFIG)
find_package(Clang REQUIRED CONFIG)

message(STATUS "LLVM_DIR: ${LLVM_DIR}")
message(STATUS "LLVM_INCLUDE_DIRS: ${LLVM_INCLUDE_DIRS}")
message(STATUS "Clang_DIR: ${Clang_DIR}")
message(STATUS "CLANG_INCLUDE_DIRS: ${CLANG_INCLUDE_DIRS}")

add_definitions(-fno-rtti)
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

if(LLVM_LIBRARY_DIRS)
    target_link_directories(astJsonDumper PRIVATE ${LLVM_LIBRARY_DIRS})
endif()

# Prefer monolithic Clang/LLVM libraries on Linux distributions (e.g. Ubuntu).
# Static clang component libs often need many extra LLVM symbols, which causes
# undefined-reference link failures in docker images.
if(TARGET clang-cpp)
    target_link_libraries(astJsonDumper PRIVATE clang-cpp)
elseif(TARGET Clang::clang-cpp)
    target_link_libraries(astJsonDumper PRIVATE Clang::clang-cpp)
else()
    target_link_libraries(astJsonDumper PRIVATE
        clangTooling
        clangSerialization
        clangFrontend
        clangAST
        clangLex
        clangBasic
    )
endif()

# On Linux, link libLLVM from the same LLVM package explicitly to avoid:
# 1) "DSO missing from command line" when using clang-cpp
# 2) accidentally mixing LLVM 18 and 19 from different system paths
if(UNIX AND NOT APPLE)
    find_library(LLVM_SHARED_LIBRARY
        NAMES LLVM
        PATHS ${LLVM_LIBRARY_DIRS}
        NO_DEFAULT_PATH
    )
    if(LLVM_SHARED_LIBRARY)
        message(STATUS "Using LLVM shared library: ${LLVM_SHARED_LIBRARY}")
        target_link_libraries(astJsonDumper PRIVATE ${LLVM_SHARED_LIBRARY})
    elseif(TARGET LLVM::LLVM)
        target_link_libraries(astJsonDumper PRIVATE LLVM::LLVM)
    elseif(TARGET LLVM)
        target_link_libraries(astJsonDumper PRIVATE LLVM)
    else()
        target_link_libraries(astJsonDumper PRIVATE LLVMSupport LLVMDemangle)
    endif()
elseif(TARGET LLVM::LLVM)
    target_link_libraries(astJsonDumper PRIVATE LLVM::LLVM)
elseif(TARGET LLVM)
    target_link_libraries(astJsonDumper PRIVATE LLVM)
else()
    target_link_libraries(astJsonDumper PRIVATE LLVMSupport LLVMDemangle)
endif()

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
