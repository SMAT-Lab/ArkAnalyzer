/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
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

#define ONE 1
#define TWO 2
#define THREE 3
#define FOUR 4
#define FIVE 5
#define SIX 6
#define EIGHT 8
#define THIRTY 30
#define RED 255
#define GREEN 128
#define BLUE 0
#define LENGTH 10.5
#define MONEY 100.5

 // 1. Simple struct - contains basic types
struct Point {
    int x;
    int y;
    char name;
};

// 2. Struct containing arrays
struct Color {
    unsigned char rgb[THREE];
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
    struct Point q = (struct Point){ .x = FIVE, .y = EIGHT, .name = 'c' };
    int* arr = (int[FIVE]){ ONE, TWO, THREE, FOUR, FIVE };
}

void Case2()
{
    struct Color c1 = { RED, GREEN, BLUE };
}

void Case3()
{
    Circle circ1 = { {FIVE, FIVE}, LENGTH };
}

void Case4()
{
    Person p2 = { "Alice", THIRTY };
}

void Case5()
{
    ShoppingList list = { {"apple", "milk", "bread"}, MONEY };
}