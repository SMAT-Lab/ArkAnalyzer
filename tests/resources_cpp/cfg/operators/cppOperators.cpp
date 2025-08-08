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

// 算数运算符
int arithmeticOperator()
{
    int a = -1 + 1;
    a++;
    int b = a - 0;
    ++b;
    int c = b * 1;
    c++;
    int d = c / 1;
    --d;
    int e = d % 2;
    return e;
}

// 关系运算符和逻辑运算符
int relationOperator()
{
    int a = -1;
    int b = 1;
    if (a == b && a > b)
    {
        a = a + b;
    }
    if (a != b || a < b)
    {
        b = b + a;
    }
    if (a >= b)
    {
        return a;
    }
    if (a <= b)
    {
        return b;
    }
    if (!(a == b))
    {
        return -1;
    }
    return 0;
}

// 复合赋值运算符
void componentOperator()
{
    int a = -1;
    a += 1;
    a *= 2;
    a %= 3;
    a >>= 4;
    a ^= 5;

    int b = 1;
    b -= 1;
    b /= 2;
    b <<= 3;
    b &= 4;
    b |= 5;
}

// return  语句
int returnValue()
{
    int a = -1;
    a += 1;
    return a;
}

// 无return语句
void noReturnValue()
{
    int b = -1;
    b -= 1;
}

// 位运算符
void bitOperator()
{
    unsigned int a = 60; // 60 =0011 1100
    unsigned int b = 13; // 13 =0000 1101

    int c1 = a & b; // 12 =0000 1100

    int c2 = a | b; // 61 =0011 1101

    int c3 = a ^ b; // 49 =0011 0001

    int c4 = ~a; // -61 =1100 0011

    int c5 = a << 2; // 240 =1111 0000

    int c6 = a >> 2; // 15 =0000 1111
}

// 杂项运算符
class MyClass
{
    char name;
    int age;

public:
    MyClass(char name, int age);
    int getAge()
    {
        return age;
    }
};

MyClass::MyClass(char name, int age) : name(name), age(age)
{
    this->name = name;
    this->age = age;
}

void otherOperator()
{
    MyClass aClass('A', 2);
    int age = aClass.getAge();

    int j = sizeof(age);
    int i = (j++, j + 1, 2 + j);
    std::cout << i << std::endl;
}