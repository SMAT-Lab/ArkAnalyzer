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

// 1.简单结构体 - 包含基础类型
struct Point
{
    int x;
    int y;
    char name;
};

// 2.包含数组的结构体
struct Color
{
    unsigned char rgb[3];
};

// 3.包含嵌套结构体的结构体
struct Circle
{
    Point center;
    double radius;
};

// 4.包含字符串和默认值的结构体
struct Person
{
    std::string name;
    int age;
    bool isStudent = false;
};

// 5.包含容器的结构体
struct ShoppingList
{
    std::vector<std::string> items;
    double budget;
};

void case1()
{
    struct Point q = (struct Point){.x = 5, .y = 8, .name = 'c'};
}

void case2()
{
    struct Color c1 = {255, 128, 0};
}
void case3()
{
    Circle circ1 = {{5, 5}, 10.5};
}
void case4()
{
    Person p2 = {"Alice", 30};
}
void case5()
{
    ShoppingList list = {{"苹果", "牛奶", "面包"}, 100.5};
}