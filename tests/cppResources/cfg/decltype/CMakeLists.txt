cmake_minimum_required(VERSION 3.16)
project(decltypeSample)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

add_executable(decltypeSample decltype.cpp)
