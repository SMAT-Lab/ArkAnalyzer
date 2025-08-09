# --- cmake/toolchains/mingw.cmake ---


set(CMAKE_SYSTEM_NAME Windows)
set(CMAKE_SYSTEM_PROCESSOR x86_64)
set(CMAKE_C_COMPILER "***//harmony_code/codearts_workspace/pre_scripts/llvm-mingw-x86_64/bin/x86_64-w64-mingw32-gcc")
set(CMAKE_CXX_COMPILER "***//harmony_code/codearts_workspace/pre_scripts/llvm-mingw-x86_64/bin/x86_64-w64-mingw32-g++")
set(CMAKE_BUILD_WITH_INSTALL_RPATH TRUE)
set(CMAKE_INSTALL_RPATH_USE_LINK_PATH TRUE)
set(CMAKE_INSTALL_RPATH "$ORIGIN")

set(CLANG_INCLUDE_DIRS
   "***//harmony_code/codearts_workspace/pre_scripts/llvm-19.1.7-x86_64/include/clang-c"
)

link_directories(
   "***//harmony_code/codearts_workspace/pre_scripts/llvm-mingw-x86_64/x86_64-w64-mingw32/bin"
)

set(CLANG_LIBRARIES "***//harmony_code/codearts_workspace/pre_scripts/llvm-19.1.7-x86_64/bin/libclang.dll")

message(STATUS "Found libclang on linux: ${CLANG_LIBRARIES}")