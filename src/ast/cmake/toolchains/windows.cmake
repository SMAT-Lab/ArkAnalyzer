set(CLANG_INCLUDE_DIRS
"D:/llvm/clang20.1.6/include"
)

find_library(CLANG_LIBRARIES
  NAMES libclang clang
  HINTS "D:/llvm/clang20.1.6/lib"
)

message(STATUS "Found libClang on Windows $ {CLANG_LIBRARIES}")