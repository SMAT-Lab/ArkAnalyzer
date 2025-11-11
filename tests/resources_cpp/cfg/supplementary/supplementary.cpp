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

#define ONE 1
#define TWO 2
#define THREE 3
#define FOUR 4
#define FIVE 5
#define SIX 6
#define SEVEN 7
#define EIGHT 8
#define NINE 9
#define TEN 10

void Case1()
{
    int a[10] = {0};
}

void PostAdd()
{
    int a = 0;
    // 1.Auto-increment after use
    int b = a++;
    // 2.Post-increment after complex expressions
    int c = b + a++;


    int d = 0;
    // 3.When not declared, use auto increment
    d = b++;
    d = c++ * b++;

    // 4.Only self increasing, without affecting other variables
    for (int i = 0; i < FOUR; i++) {}

    // 5.Multivariate parallel self increasing
    for (int i = 0, j = ONE; i < FOUR; i++, j++) {}

    // 6.If is judged as an expression and then self increases, affecting the distribution of branches
    if (a++ > 0) {
        b = TWO;
    }

    while (a++ > 0) {}

    do {
        a++;
    } while (a++ > 0);

    // 7.As an expression in ternary expressions, it increases after judgment and
    // affects the distribution of branches
    int f = a++ > 0 ? ONE : THREE;
    int e = a++ ?: THREE;  // Default ternary expression

    // 8.The array increases automatically after use
    int arr[10] = {0};
    int idx = ONE;
    arr[idx++] = ONE;
}