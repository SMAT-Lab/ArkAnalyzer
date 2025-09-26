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

#define ONE 1
#define TWO 2
#define THREE 3
#define FOUR 4
#define FIVE 5

// Arithmetic operators
int ArithmeticOperator()
{
    int a = -1 + 1;
    a++;
    int b = a - 0;
    ++b;
    int c = b * 1;
    c++;
    int d = c / 1;
    --d;
    int e = d % TWO;
    return e;
}

// Relational and logical operators
int RelationOperator()
{
    int a = -1;
    int b = 1;
    if (a == b && a > b) {
        a = a + b;
    }
    if (a != b || a < b) {
        b = b + a;
    }
    if (a >= b) {
        return a;
    }
    if (a <= b) {
        return b;
    }
    if (!(a == b)) {
        return -1;
    }
    return 0;
}

// Compound assignment operators
void ComponentOperator()
{
    int a = -1;
    a += ONE;
    a *= TWO;
    a %= THREE;
    a >>= FOUR;
    a ^= FIVE;

    int b = 1;
    b -= ONE;
    b /= TWO;
    b <<= THREE;
    b &= FOUR;
    b |= FIVE;
}

// return statement
int ReturnValue()
{
    int a = -1;
    a += 1;
    return a;
}

// No return statement
void NoReturnValue()
{
    int b = -1;
    b -= 1;
    return;
}

// Bitwise operators
void BitOperator()
{
    unsigned int a = 60; // 60 =0011 1100
    unsigned int b = 13; // 13 =0000 1101

    int c1 = a & b; // 12 =0000 1100

    int c2 = a | b; // 61 =0011 1101

    int c3 = a ^ b; // 49 =0011 0001

    int c4 = ~a; // -61 =1100 0011

    int c5 = a << TWO; // 240 =1111 0000

    int c6 = a >> TWO; // 15 =0000 1111
}

// Miscellaneous operators
class MyClass {
    char name;
    int age;

public:
    MyClass(char name, int age);
    int GetAge()
    {
        return age;
    }
};

MyClass::MyClass(char name, int age) : name(name), age(age)
{
    this->name = name;
    this->age = age;
}

void OtherOperator()
{
    MyClass aClass('A', TWO);
    int age = aClass.GetAge();

    int j = sizeof(age);
    int i = (j++, j + 1, TWO + j);
    std::cout << i << std::endl;
}