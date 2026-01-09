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

#include <cstdio>
#include <functional>

#define TWO 2
#define FIVE 5
#define FLOAT_NUM 2.0

int g_num = TWO;

// No capture, with parameters
void Case1()
{
    auto func = [](int x) { return x + 1; };
    int res = func(1);
    printf("%d", res);
}

// With capture
void Case2()
{
    const int a = 5;
    int b = 6;
    // Specify different capture methods for each variable
    auto func = [a](int x) { return x + a; };
    int res = func(1);
    printf("%d", res);

    // Capture all environment variables by value
    auto allByValue = [=](int x) { return x + a + b + g_num; };
    res = allByValue(1);
    printf("%d", res);
}

// With return type
void Case3()
{
    auto func = [](int x) -> int { return x + 1; };
    int res = func(1);
    printf("%d", res);
}

// No return value
void Case4()
{
    auto func = [](int x) { printf("%d", x); };
    func(1);
}

// Reference capture of lambda
void Case5()
{
    int x = 2;
    int y = 5;

    // Specify different capture methods for each variable
    auto byRef = [&x, y]() {
        x++;
        return x + y;
    };
    int res = byRef();

    // Capture all environment variables by reference
    auto allByRef = [&]() {
        x++;
        y++;
        return x + y;
    };
    res = allByRef();

    // Capture part of environment variables by reference
    auto partByRef = [&, y]() {
        x++;
        return x + y;
    };
    res = partByRef();
}

// Nested lambda
void Case6()
{
    int a = 5;
    int c = 10;

    auto outer = [=](int x) {
        int b = 1;
        auto inner = [=]() {
            return a + b + x;
        };
        return inner() + c;
    };

    int res = outer(1);
}

// mutable lambda
void Case7()
{
    int x = 2;
    int y = 5;
    auto mutableLambda = [&x, y]() mutable {
        x++;
        y++;  // What is modified is the captured copy.
        return x + y;
    };

    int res = mutableLambda();
}

// constexpr lambda
void Case8()
{
    auto func = [](int x, int y) constexpr { return x + y; };
    int res = func(1, 1);
}

// Generic lambda
void Case9()
{
    auto genericLambda = [](auto x, auto y) { return x + y; };

    auto res1 = genericLambda(1, TWO);
    auto res2 = genericLambda(FLOAT_NUM, FLOAT_NUM);

    auto explicitGenericLambda = []<typename T, typename U>(T x, U y) { return x + y; };
    res1 = explicitGenericLambda(1, TWO);
    res2 = explicitGenericLambda(FLOAT_NUM, FLOAT_NUM);
}

// Lambda functions as template parameters, C++ still had no constraints on template types in C++17. (which called 'Concept' in C++20)
template <typename Func>
int Apply(Func f, int v)
{
    return f(v);
}

void Case10()
{
    int base = 1;
    auto func = [base](int x) { return x + base; };
    int res = Apply(func, TWO);
}