cmake_minimum_required(VERSION 3.16)
project(funcImplementInCpp LANGUAGES CXX)

# Export compile commands for static analysis tools.
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

file(GLOB SOURCE CONFIGURE_DEPENDS "src/*.cpp" "main.cpp")

add_executable(funcImplementInCpp ${SOURCE})

target_include_directories(funcImplementInCpp PRIVATE include)
