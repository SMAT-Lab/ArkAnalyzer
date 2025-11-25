set(CLANG_INCLUDE_DIRS
"./clang+llvm-20.1.6-x86_64-pc-windows-msvc/include"
)

find_library(CLANG_LIBRARIES
  NAMES libclang clang
  HINTS "./clang+llvm-20.1.6-x86_64-pc-windows-msvc/lib"
)

message(STATUS "Found libClang on Windows ${CLANG_LIBRARIES}")