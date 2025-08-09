cmake_minimum_required(VERSION 3.10)
project(arkCppAstDumper LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_executable(arkCppAstDumper
        arkCppAst.cpp
        utils/utils_string.cpp
        utils/utils_file.cpp
        utils/cli_util.cpp
)


target_include_directories(arkCppAstDumper PRIVATE
        ${CLANG_INCLUDE_DIRS}
        ${CMAKE_CURRENT_SOURCE_DIR}/utils
)

target_link_libraries(arkCppAstDumper PRIVATE ${CLANG_LIBRARIES})

if(MSVC)
  target_compile_definitions(arkCppAstDumper PRIVATE /utf-8)
  target_compile_definitions(arkCppAstDumper PRIVATE _SILENCE_CXX17_CODECVT_HEADER_DEPRECATION_WARNING)
endif()
