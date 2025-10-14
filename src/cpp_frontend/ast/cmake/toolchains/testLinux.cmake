# --- cmake/toolchains/testLinux.cmake ---

set(CMAKE_BUILD_WITH_INSTALL_RPATH TRUE)
set(CMAKE_INSTALL_RPATH_USE_LINK_PATH TRUE)
set(CMAKE_INSTALL_RPATH "$ORIGIN")

link_directories(
   "***//harmony_code/codearts_workspace/pre_scripts/llvm-19.1.7-x86_64/lib"
)

message(STATUS "Found libclang on linux: ${CLANG_LIBRARIES}")