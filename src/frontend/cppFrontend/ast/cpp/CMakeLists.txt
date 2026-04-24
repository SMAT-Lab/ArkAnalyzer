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

# =============================================================================
# Single build product: astJsonDumper.node (MODULE)
#   N-API binding + libTooling AST JSON dumper (.cpp under this tree; .h via #include)
#   Built only when NODE_API_INCLUDE_DIR points at a directory containing node_api.h.
# =============================================================================

set(AST_JSON_DUMPER_NAPI_SRC napi/napiBinding.cpp)

set(AST_JSON_DUMPER_CORE_SRCS
    cppAstDumper.cpp
    utils/compile_db_utils.cpp
    utils/output_path.cpp
    utils/cli_options.cpp
    utils/source_utils.cpp
    utils/header_units.cpp
    utils/json_streaming.cpp
)

set(AST_JSON_DUMPER_ADDON_SOURCES
    ${AST_JSON_DUMPER_NAPI_SRC}
    ${AST_JSON_DUMPER_CORE_SRCS}
)

# Links clangTooling + LLVM for targets that use AST_JSON_DUMPER_* sources above.
function(ast_json_dumper_link_llvm target_name)
    if(LLVM_LIBRARY_DIRS)
        target_link_directories(${target_name} PRIVATE ${LLVM_LIBRARY_DIRS})
    endif()

    target_link_libraries(${target_name} PRIVATE
        clangTooling
        clangSerialization
        clangFrontend
        clangAST
        clangLex
        clangBasic
    )

    if(UNIX AND NOT APPLE)
        find_library(LLVM_SHARED_LIBRARY_${target_name}
            NAMES LLVM
            PATHS ${LLVM_LIBRARY_DIRS}
            NO_DEFAULT_PATH
        )
        if(LLVM_SHARED_LIBRARY_${target_name})
            message(STATUS "Using LLVM shared library: ${LLVM_SHARED_LIBRARY_${target_name}}")
            target_link_libraries(${target_name} PRIVATE ${LLVM_SHARED_LIBRARY_${target_name}})
        elseif(TARGET LLVM::LLVM)
            target_link_libraries(${target_name} PRIVATE LLVM::LLVM)
        elseif(TARGET LLVM)
            target_link_libraries(${target_name} PRIVATE LLVM)
        else()
            target_link_libraries(${target_name} PRIVATE LLVMSupport LLVMDemangle)
        endif()
    elseif(TARGET LLVM::LLVM)
        target_link_libraries(${target_name} PRIVATE LLVM::LLVM)
    elseif(TARGET LLVM)
        target_link_libraries(${target_name} PRIVATE LLVM)
    else()
        target_link_libraries(${target_name} PRIVATE LLVMSupport LLVMDemangle)
    endif()
endfunction()

set(NODE_API_INCLUDE_DIR "" CACHE PATH "Directory containing node_api.h (e.g. node_modules/node-api-headers/include)")

if(NODE_API_INCLUDE_DIR AND EXISTS "${NODE_API_INCLUDE_DIR}/node_api.h")
    add_library(astJsonDumper_addon MODULE ${AST_JSON_DUMPER_ADDON_SOURCES})
    target_compile_definitions(astJsonDumper_addon PRIVATE
        AST_JSON_NO_MAIN
    )
    if(WIN32)
        target_compile_definitions(astJsonDumper_addon PRIVATE BUILDING_NODE_EXTENSION)
    endif()
    target_include_directories(astJsonDumper_addon PRIVATE
        ${CMAKE_CURRENT_SOURCE_DIR}
        ${LLVM_INCLUDE_DIRS}
        ${CLANG_INCLUDE_DIRS}
        ${NODE_API_INCLUDE_DIR}
    )
    set_target_properties(astJsonDumper_addon PROPERTIES
        PREFIX ""
        OUTPUT_NAME "astJsonDumper"
        SUFFIX ".node"
    )
    ast_json_dumper_link_llvm(astJsonDumper_addon)
    if(APPLE)
        target_link_options(astJsonDumper_addon PRIVATE -undefined dynamic_lookup)
    endif()
    if(MSVC)
        target_compile_options(astJsonDumper_addon PRIVATE
            /utf-8
            /wd4291
            /wd4244
        )
        target_link_options(astJsonDumper_addon PRIVATE
            /ignore:4199
        )
    endif()
    message(STATUS "Building Node addon: astJsonDumper.node (NODE_API_INCLUDE_DIR=${NODE_API_INCLUDE_DIR})")
else()
    message(STATUS "Skipping astJsonDumper.node: set NODE_API_INCLUDE_DIR to a directory containing node_api.h")
endif()
