cmake_minimum_required(VERSION 3.16)
project(nestedCase)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

file(GLOB SOURCE "src/*.cpp" "main.cpp")

add_executable(nestedCase ${SOURCE})

target_include_directories(nestedCase PRIVATE include)
