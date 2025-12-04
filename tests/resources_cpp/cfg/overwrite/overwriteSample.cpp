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
using namespace std;

#define INT_OPERAND_1 5
#define INT_OPERAND_2 3
#define DOUBLE_OPERAND_1 2.5
#define DOUBLE_OPERAND_2 3.7
#define TRIPLE_OPERAND_1 1
#define TRIPLE_OPERAND_2 2
#define TRIPLE_OPERAND_3 3

class Calculator {
public:
    // Method declarations (inside class)
    int Add(int a, int b);
    double Add(double a, double b);
    int Add(int a, int b, int c);

private:
    void Log(const string& operation);
};

// Method implementations (outside class)
int Calculator::Add(int a, int b)
{
    Log("Integer addition");
    return a + b;
}

double Calculator::Add(double a, double b)
{
    Log("Decimal addition");
    return a + b;
}

int Calculator::Add(int a, int b, int c)
{
    Log("Three number addition");
    return a + b + c;
}

void Calculator::Log(const string& operation)
{
    cout << "Operation: " << operation << endl;
}

int main()
{
    Calculator calc;

    cout << "Result: " << calc.Add(INT_OPERAND_1, INT_OPERAND_2) << endl;
    cout << "Result: " << calc.Add(DOUBLE_OPERAND_1, DOUBLE_OPERAND_2) << endl;
    cout << "Result: " << calc.Add(TRIPLE_OPERAND_1, TRIPLE_OPERAND_2, TRIPLE_OPERAND_3) << endl;

    return 0;
}