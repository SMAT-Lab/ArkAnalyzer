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

#define TWO 2
#define PI 3.14
#define TWO_PI 6.28
#define A_HUNDRED 100
#define TWENTY 20

// 定义带有两个模板类型的函数模板
template <typename T1, typename T2>
void PrintPair(T1 a, T2 b)
{
    std::cout << "First:" << a << ", Second" << b << std::endl;
}

// 函数模板
template <typename T = int>
T Max1(T a, T b)
{
    T temp = a > b ? a : b;
    return temp;
}

template <typename Q>
int Max2(Q a, Q b)
{
    Q temp = a > b ? a : b;
    return TWO;
}

int Instantiation1(int x, int y)
{
    int z = Max1(x, y);
    int y = Max2(x, y);
    PrintPair(x, y);
    return 0;
}

// 类模板
template <typename T>
class MyContainer {
private:
    T data1;
    T data2;
public:
    MyContainer(T value1, T value2) : data1(value1), data2(value2) {}
    void Print()
    {
        std::cout << data1;
    }
    T Sum()
    {
        return data1 + data2;
    }
};

void Instantiation2()
{
    MyContainer<int> intContainer(A_HUNDRED, TWENTY);
    int a = intContainer.Sum();
    intContainer.Print();
    MyContainer<double> doubleContainer(PI, TWO_PI);
}

// clang:: CXXPseudoDestructorExpr
template <typename T>
void DestroyPtr(T* ptr)
{
    ptr->~T();
}

// clang::CXXFoldExpr
template <typename... Args>
auto Sum(Args... args)
{
    return (... + args);
}

int Instantiation3()
{
    int z = Sum(1, 2, 3, 4, 5, 6);
    return 0;
}

int main()
{
    double d = 2.718;
    DestroyPtr(&d);
    return 0;
}