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

void Calculator::log(const string& operation)
{
    cout << "Operation: " << operation << endl;
}

int main()
{
    Calculator calc;

    cout << "Result: " << calc.Add(5, 3) << endl;
    cout << "Result: " << calc.Add(2.5, 3.7) << endl;
    cout << "Result: " << calc.Add(1, 2, 3) << endl;

    return 0;
}