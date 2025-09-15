cmake_minimum_required(VERSION 3.16)
project(arkCppAstDumper LANGUAGES CXX)

# Allow enabling lightweight profiling with -DARK_ENABLE_PROFILING=ON
option(ARK_ENABLE_PROFILING "Enable Ark lightweight profiling" OFF)
message(STATUS "ARK_ENABLE_PROFILING = ${ARK_ENABLE_PROFILING}")

# Platform-specific toolchain (if needed)
if(WIN32)
  include(cmake/toolchains/windows.cmake)
elseif(UNIX)
  include(cmake/toolchains/linux.cmake)
endif()

add_executable(arkCppAstDumper
  arkCppAst.cpp
  utils/utils_string.cpp
  utils/utils_file.cpp
  utils/cli_util.cpp
  utils/mat_metrics.cpp
)

# Require C++17 features
target_compile_features(arkCppAstDumper PRIVATE cxx_std_17)

# Include paths and library linkage
target_include_directories(arkCppAstDumper PRIVATE
  ${CLANG_INCLUDE_DIRS}
  ${CMAKE_CURRENT_SOURCE_DIR}/utils
)
target_link_libraries(arkCppAstDumper PRIVATE ${CLANG_LIBRARIES})

# Enable lightweight profiling macros (ARK_PROFILE_SCOPE)
if(ARK_ENABLE_PROFILING)
  target_compile_definitions(arkCppAstDumper PRIVATE ARK_ENABLE_PROFILING=1)
endif()

# MSVC: enable UTF-8 via compiler option (not macro); also silence old deprecation warnings
if(MSVC)
  target_compile_options(arkCppAstDumper PRIVATE /utf-8)
  target_compile_definitions(arkCppAstDumper PRIVATE _SILENCE_CXX17_CODECVT_HEADER_DEPRECATION_WARNING)
endif()