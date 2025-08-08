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
#include <functional>
using namespace std;

// 定义一个函数
int add(int a, int b) {
    return a + b;
}

int case1() {
    // 声明一个函数指针
    int (*funcPtr)(int, int);

    // 将函数地址赋给指针
    funcPtr = add;

    // 通过指针调用函数
    int result = funcPtr(3, 4);
    cout << "3 + 4 = " << result << endl;  // 输出: 3 + 4 = 7

    return 0;
}

void greetEnglish() {
    cout << "Hello!" << endl;
}

void greetSpanish() {
    cout << "¡Hola!" << endl;
}

// 函数接受函数指针作为参数
void greet(void (*greetFunc)()) {
    greetFunc();
}

int case2() {
    greet(greetEnglish);  // 输出: Hello!
    greet(greetSpanish);  // 输出: ¡Hola!

    return 0;
}

double add(double a, double b) { return a + b; }
double subtract(double a, double b) { return a - b; }
double multiply(double a, double b) { return a * b; }
double divide(double a, double b) { return a / b; }

int case3() {
    // 函数指针数组
    double (*operations[4])(double, double) = {add, subtract, multiply, divide};

    double x = 10, y = 5;
    char opSymbols[] = {'+', '-', '*', '/'};

    for (int i = 0; i < 4; ++i) {
        cout << x << " " << opSymbols[i] << " " << y << " = "
             << operations[i](x, y) << endl;
    }

    return 0;
}

