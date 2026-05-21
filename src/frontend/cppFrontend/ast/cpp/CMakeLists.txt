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

get_filename_component(ARKANALYZER_ROOT "${CMAKE_CURRENT_SOURCE_DIR}/../../../../.." ABSOLUTE)
set(FLATBUFFERS_INCLUDE_DIR "${ARKANALYZER_ROOT}/tools/flatbuffers/include" CACHE PATH "flatbuffers headers")
if(NOT EXISTS "${FLATBUFFERS_INCLUDE_DIR}/flatbuffers/flatbuffers.h")
    set(FLATBUFFERS_INCLUDE_DIR "${ARKANALYZER_ROOT}/node_modules/flatbuffers/include")
endif()

set(AST_JSON_DUMPER_CORE_SRCS
    cppAstDumper.cpp
    serialization/astAttrsToWire.cpp
    serialization/astNodeAttrsExtract.cpp
    serialization/astFlatStreamer.cpp
    utils/astAttrsProcessor.cpp
    utils/compile_db_utils.cpp
    utils/output_path.cpp
    utils/flat_output_path.cpp
    utils/manifest_worklist.cpp
    utils/cli_options.cpp
    utils/source_utils.cpp
    utils/header_units.cpp
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
        # MSYS2/MinGW builds need libnode import library to resolve __imp_napi_* symbols.
        find_library(NODE_IMPORT_LIB
            NAMES node libnode
            PATHS /mingw64/lib /ucrt64/lib
        )
        if(NODE_IMPORT_LIB)
            target_link_libraries(astJsonDumper_addon PRIVATE ${NODE_IMPORT_LIB})
            message(STATUS "Using Node import library: ${NODE_IMPORT_LIB}")
        else()
            message(WARNING "Node import library not found; WIN32 link may fail with unresolved napi symbols.")
        endif()
    endif()
    target_include_directories(astJsonDumper_addon PRIVATE
        ${CMAKE_CURRENT_SOURCE_DIR}
        ${CMAKE_CURRENT_SOURCE_DIR}/serialization
        ${CMAKE_CURRENT_SOURCE_DIR}/serialization/flatGenerated
        ${LLVM_INCLUDE_DIRS}
        ${CLANG_INCLUDE_DIRS}
        ${NODE_API_INCLUDE_DIR}
    )
    if(EXISTS "${FLATBUFFERS_INCLUDE_DIR}/flatbuffers/flatbuffers.h")
        target_include_directories(astJsonDumper_addon PRIVATE ${FLATBUFFERS_INCLUDE_DIR})
    else()
        message(WARNING "flatbuffers headers not found at ${FLATBUFFERS_INCLUDE_DIR}; run npm install flatbuffers")
    endif()
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

# =============================================================================
# C++ unit tests (GTest); does not require Node/N-API.
# =============================================================================
option(ARKANALYZER_BUILD_CPP_TESTS "Build astJsonDumper C++ unit tests" OFF)

if(ARKANALYZER_BUILD_CPP_TESTS)
    set(ARKANALYZER_ROOT "${ARKANALYZER_ROOT}" CACHE PATH "ArkAnalyzer repository root")
    if(NOT ARKANALYZER_ROOT OR NOT EXISTS "${ARKANALYZER_ROOT}/tests/cppResources/dumper/minimal.cpp")
        get_filename_component(ARKANALYZER_ROOT "${CMAKE_CURRENT_SOURCE_DIR}/../../../../.." ABSOLUTE)
    endif()

    set(ARKANALYZER_GTEST_DIR "${ARKANALYZER_ROOT}/tools/googletest")
    find_package(GTest QUIET)
    if(NOT GTest_FOUND AND EXISTS "${ARKANALYZER_GTEST_DIR}/CMakeLists.txt")
        add_subdirectory("${ARKANALYZER_GTEST_DIR}" "${CMAKE_CURRENT_BINARY_DIR}/googletest" EXCLUDE_FROM_ALL)
    endif()
    if(NOT TARGET GTest::gtest_main AND NOT GTest_FOUND)
        include(FetchContent)
        FetchContent_Declare(
            googletest
            URL https://github.com/google/googletest/archive/refs/tags/v1.14.0.zip
        )
        set(gtest_force_shared_crt ON CACHE BOOL "" FORCE)
        FetchContent_MakeAvailable(googletest)
    endif()
    if(NOT TARGET GTest::gtest_main)
        message(FATAL_ERROR "GoogleTest not found. Install libgtest-dev, vendor tools/googletest, or allow FetchContent download.")
    endif()

    enable_testing()

    set(ARKANALYZER_CPP_DUMPER_TEST_DIR "${ARKANALYZER_ROOT}/tests/unit/cppCore/dumper")

    add_executable(astJsonDumper_unit_tests
        ${ARKANALYZER_CPP_DUMPER_TEST_DIR}/test_support.cpp
        ${ARKANALYZER_CPP_DUMPER_TEST_DIR}/flat_io_test.cpp
        ${ARKANALYZER_CPP_DUMPER_TEST_DIR}/flat_output_path_test.cpp
        ${ARKANALYZER_CPP_DUMPER_TEST_DIR}/manifest_test.cpp
        ${ARKANALYZER_CPP_DUMPER_TEST_DIR}/clang_parse_test.cpp
        ${AST_JSON_DUMPER_CORE_SRCS}
    )
    target_compile_definitions(astJsonDumper_unit_tests PRIVATE
        AST_JSON_NO_MAIN
        ARKANALYZER_ROOT="${ARKANALYZER_ROOT}"
    )
    target_include_directories(astJsonDumper_unit_tests PRIVATE
        ${CMAKE_CURRENT_SOURCE_DIR}
        ${CMAKE_CURRENT_SOURCE_DIR}/serialization
        ${CMAKE_CURRENT_SOURCE_DIR}/serialization/flatGenerated
        ${ARKANALYZER_CPP_DUMPER_TEST_DIR}
        ${LLVM_INCLUDE_DIRS}
        ${CLANG_INCLUDE_DIRS}
    )
    if(EXISTS "${FLATBUFFERS_INCLUDE_DIR}/flatbuffers/flatbuffers.h")
        target_include_directories(astJsonDumper_unit_tests PRIVATE ${FLATBUFFERS_INCLUDE_DIR})
    endif()
    ast_json_dumper_link_llvm(astJsonDumper_unit_tests)
    target_link_libraries(astJsonDumper_unit_tests PRIVATE GTest::gtest_main)
    if(APPLE)
        target_link_options(astJsonDumper_unit_tests PRIVATE -undefined dynamic_lookup)
    endif()
    if(MSVC)
        target_compile_options(astJsonDumper_unit_tests PRIVATE /utf-8 /wd4291 /wd4244)
    endif()
    add_test(NAME astJsonDumper_unit_tests COMMAND astJsonDumper_unit_tests)
    message(STATUS "Building C++ unit tests: astJsonDumper_unit_tests (ARKANALYZER_ROOT=${ARKANALYZER_ROOT})")
endif()
