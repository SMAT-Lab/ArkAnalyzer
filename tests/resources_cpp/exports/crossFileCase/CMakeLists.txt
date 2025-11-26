cmake_minimum_required(VERSION 3.31)
project(crossFileCase)

set(CMAKE_CXX_STANDARD 17)

file(GLOB SOURCE "src/*.cpp", "main.cpp")

add_executable(crossFileCase ${SOURCE})

target_include_directories(crossFileCase PRIVATE include)