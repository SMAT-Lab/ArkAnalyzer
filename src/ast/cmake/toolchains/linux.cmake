# --- cmake/toolchains/linux.cmake ---

set(CMAKE_BUILD_WITH_INSTALL_RPATH TRUE)
set(CMAKE_INSTALL_RPATH_USE_LINK_PATH TRUE)
set(CMAKE_INSTALL_RPATH "$ORIGIN")

set(CLANG_INCLUDE_DIRS
   "***//harmony_code/codearts_workspace/pre_scripts/llvm-19.1.7-x86_64/include"
   "***//harmony_code/codearts_workspace/pre_scripts/llvm-19.1.7-x86_64/include/clang-c"
)

link_directories(
   "***//harmony_code/codearts_workspace/pre_scripts/llvm-19.1.7-x86_64/lib"
)

find_library(CLANG_LIBRARIES
   NAMES libclang clang clang-cpp
   PATHS "***//harmony_code/codearts_workspace/pre_scripts/llvm-19.1.7-x86_64/lib"
)

message(STATUS "Found libclang on linux: ${CLANG_LIBRARIES}")