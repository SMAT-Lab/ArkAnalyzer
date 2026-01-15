# --- cmake/toolchains/linux.cmake ---

set(CMAKE_BUILD_WITH_INSTALL_RPATH TRUE)
set(CMAKE_INSTALL_RPATH_USE_LINK_PATH TRUE)
set(CMAKE_INSTALL_RPATH "$ORIGIN")

# libclang的头文件路径
set(CLANG_INCLUDE_DIRS
   "/opt/buildtools/llvm-19.1.7/llvm/include"
)

# 查找libclang.so
find_library(CLANG_LIBRARIES
   NAMES libclang clang clang-cpp
   PATHS "/opt/buildtools/llvm-19.1.7/lib"
)

message(STATUS "Found libclang on linux: ${CLANG_LIBRARIES}")