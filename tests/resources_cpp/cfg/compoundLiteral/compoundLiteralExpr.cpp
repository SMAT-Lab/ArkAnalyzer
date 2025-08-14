/*
 * Copyright (c) 2024 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#include <iostream>
#include <string>
#include <vector>

// 1. Simple struct - contains basic types
struct Point {
    int x;
    int y;
    char name;
};

// 2. Struct containing arrays
struct Color {
    unsigned char rgb[3];
};

// 3. Struct containing nested structs
struct Circle {
    Point center;
    double radius;
};

// 4. Struct containing strings and default values
struct Person {
    std::string name;
    int age;
    bool isStudent = false;
};

// 5. Struct containing containers
struct ShoppingList {
    std::vector<std::string> items;
    double budget;
};

void Case1()
{
    struct Point q = (struct Point){.x = 5, .y = 8, .name = 'c'};
}

void Case2()
{
    struct Color c1 = {255, 128, 0};
}

void Case3()
{
    Circle circ1 = {{5, 5}, 10.5};
}

void Case4()
{
    Person p2 = {"Alice", 30};
}

void Case5()
{
    ShoppingList list = {{"苹果", "牛奶", "面包"}, 100.5};
}