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

void Case1()
{
    int a[10] = {0};
}

void postAdd()
{
    int a = 0;
    // 1.Auto-increment after use
    int b = a++;
    // 2.Post-increment after complex expressions
    int c = a + a++;

    int d = 0;
    // 3.When not declared, use auto increment
    d = b++;
    d = c++ * b++;

    // 4.Only self increasing, without affecting other variables
    for (int i = 0; i < 4; i++)
    {
    }

    // 5.Multivariate parallel self increasing
    for (int i = 0,j = 1; i < 4; i++,j++)
    {
    }

    // 6.If is judged as an expression and then self increases, affecting the distribution of branches
    if (a++ > 0)
    {
        b = 2;
    }
    while (a++ > 0){}
    do{} while (a++ > 0);

    // 7.As an expression in ternary expressions, it increases after judgment and affects the distribution of branches
    int f = a++ > 0 ? 1 : 3;
        int e = a++?: 3; // Default ternary expression
    // 8.The use of comma operator in linking
    int g = (a++ ,a + 1, a + 2);

    // 9.The array increases automatically after use
    int arr[10] = {0};
    int idx = 1;
    arr[idx++] = 1;
}