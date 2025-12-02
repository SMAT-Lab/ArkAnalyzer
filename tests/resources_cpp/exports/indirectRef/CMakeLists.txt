cmake_minimum_required(VERSION 3.16)
project(indirectRef)

set(CMAKE_CXX_STANDARD 17)

file(GLOB SOURCE "src/*.cpp", "main.cpp")

add_executable(indirectRef ${SOURCE})

target_include_directories(indirectRef PRIVATE include)