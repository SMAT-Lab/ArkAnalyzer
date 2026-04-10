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
#include <stdexcept>
using namespace std;

#define TWO 2
#define FOUR 4
#define FIVE 5
#define SEVEN 7
#define NINE 9

void Case1()
{
    int a = 1;
    char x = 'c';
    bool flag = true;
    try {
        if (a == 0) {
            flag = false;
            throw runtime_error("zero");
        }
    }
    catch (const logic_error& e) {
        a = NINE;
        a = TWO;
    }
    catch (const runtime_error& e) {
        a = FIVE;
    }
    catch (...) {
        a = SEVEN;
    }
    a = FOUR;
}

void InnerFunction()
{
    throw std::runtime_error("error1");
}

void OuterFunction()
{
    try {
        InnerFunction();
    }
    catch (const std::exception& e) {
        std::cout << "catch: " << e.what() << std::endl;
        throw; // throw again
    }
}