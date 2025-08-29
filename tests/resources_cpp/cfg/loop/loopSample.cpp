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

#include <cstdio>
#include <iostream>
#include <map>

#define TWO 2

struct Data {
    int a;
    int b;
};

void Case1()
{
    int arr[2][2] = {{1, 2}, {3, 4}};
    for (int i = 0; i < TWO; i++) {
        int c = arr[i][0];
        int d = arr[i][1];
        printf("%d %d\n", c, d);
    }
}

void Case2()
{
    Data arr[2] = {{1, 2}, {3, 4}};
    for (int i = 0; i < TWO; i++) {
        printf("%d %d\n", arr[i].a, arr[i].b);
    }
}

void Case3()
{
    int b = 0;
    for (int i = 0; i < TWO; i++) {
        b += 1;
    }
    printf("%d\n", b);
}

// Omit initialization
void Case4()
{
    int i = 0;
    for (; i < TWO; i++) {
        printf("%d\n", i);
    }
}

void Case5()
{
    int i = 0;
    for (;; i++) {
        if (i > TWO) {
            break;
        }
        printf("%d\n", i);
    }
}

// Omit update statement
void Case6()
{
    for (int i = 0; i < TWO;) {
        printf("%d\n", i);
        i++;
    }
}

// Omit all
void Case7()
{
    int i = 0;
    for (; i <= TWO;) {
        printf("%d\n", i);
        i++;
    }
}

// C++的forRange
void Case8()
{
    std::map<int, std::string> map1 = {{1, "one"}, {2, "two"}, {3, "three"}};
    for (const auto &pair : map1) {
        printf("%d %s\n", pair.first, pair.second.c_str());
    }
}

void Case9()
{
    std::map<int, std::string> map2 = {{1, "one"}, {2, "two"}, {3, "three"}};
    for (const auto &[key, value] : map2) {
        printf("%d %s\n", key, value.c_str());
    }
}

int main()
{
    Case1();
    Case2();
    return 0;
}