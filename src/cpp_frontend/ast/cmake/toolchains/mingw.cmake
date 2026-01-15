# --- cmake/toolchains/mingw.cmake ---

# 配置mingw
set(CMAKE_SYSTEM_NAME Windows)
set(CMAKE_SYSTEM_PROCESSOR x86_64)
set(LLVM_MINGW_ROOT "/opt/buildtools/llvm-mingw-20231128/llvm-mingw")
set(CMAKE_C_COMPILER "${LLVM_MINGW_ROOT}/bin/x86_64-w64-mingw32-clang")
set(CMAKE_CXX_COMPILER "${LLVM_MINGW_ROOT}/bin/x86_64-w64-mingw32-clang++")
set(LLVM_DIR "/opt/buildtools/llvm-19.1.7/llvm/build/lib/cmake/llvm")
set(Clang_DIR "/opt/buildtools/llvm-19.1.7/llvm/build/lib/cmake/clang")
set(CMAKE_BUILD_WITH_INSTALL_RPATH TRUE)
set(CMAKE_INSTALL_RPATH_USE_LINK_PATH TRUE)
set(CMAKE_INSTALL_RPATH "$ORIGIN")

# 不适用msvc工具链
set(CMAKE_C_FLAGS "-fno-ms-compatibility")
set(CMAKE_CXX_FLAGS "-fno-ms-compatibility")
# 禁用MSVC特有符号
set(LLVM_ENABLE_DIA_SDK OFF CACHE BOOL "" FORCE)
set(LLVM_ENABLE_PDB OFF CACHE BOOL "" FORCE)