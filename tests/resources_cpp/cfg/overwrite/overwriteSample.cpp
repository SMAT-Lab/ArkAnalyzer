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
    int add(int a, int b);
    double add(double a, double b);
    int add(int a, int b, int c);

private:
    void log(const string& operation);
};

// Method implementations (outside class)
int Calculator::add(int a, int b) {
    log("Integer addition");
    return a + b;
}

double Calculator::add(double a, double b) {
    log("Decimal addition");
    return a + b;
}

int Calculator::add(int a, int b, int c) {
    log("Three number addition");
    return a + b + c;
}

void Calculator::log(const string& operation) {
    cout << "Operation: " << operation << endl;
}

int main() {
    Calculator calc;

    cout << "Result: " << calc.add(5, 3) << endl;
    cout << "Result: " << calc.add(2.5, 3.7) << endl;
    cout << "Result: " << calc.add(1, 2, 3) << endl;

    return 0;
}