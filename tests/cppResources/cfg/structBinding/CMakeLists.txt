cmake_minimum_required(VERSION 3.16)
project(structBindingSample)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

add_executable(structBindingSample structBinding.cpp)
