# --- cmake/toolchains/mingw.cmake ---

# 配置mingw
set(CMAKE_SYSTEM_NAME Windows)
set(CMAKE_SYSTEM_PROCESSOR x86_64)
set(LLVM_MINGW_ROOT "/opt/buildtools/llvm-mingw")
set(CMAKE_C_COMPILER "${LLVM_MINGW_ROOT}/bin/x86_64-w64-mingw32-clang")
set(CMAKE_CXX_COMPILER "${LLVM_MINGW_ROOT}/bin/x86_64-w64-mingw32-clang++")
set(CMAKE_BUILD_WITH_INSTALL_RPATH TRUE)
set(CMAKE_INSTALL_RPATH_USE_LINK_PATH TRUE)
set(CMAKE_INSTALL_RPATH "$ORIGIN")

# libclang的头文件路径
set(CLANG_INCLUDE_DIRS
   "/opt/buildtools/llvm-19.1.7/llvm/include"
)

# 指定链接目录
link_directories(
   "/opt/buildtools/llvm-mingw/x86_64-w64-mingw32/bin"
)

# 指定libclang.dll
set(CLANG_LIBRARIES "/opt/buildtools/llvm-19.1.7/bin/libclang.dll")

message(STATUS "Found libclang on linux: ${CLANG_LIBRARIES}")