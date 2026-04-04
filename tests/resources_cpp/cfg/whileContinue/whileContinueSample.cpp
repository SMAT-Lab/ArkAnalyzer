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
#include <iostream>
#define TWO 2
#define TEN 10
#define FIVE 5
#define TWENTY 20
#define THREE 3

int main(int num)
{
    while (num > 0) {
        if (num == TWO) {
            num = num + 1;
            continue;
        }
        num = num - TWO;
    }
    return 0;
}

void DoStmtFunc()
{
    int i = 0;
    do {
        ++i;
    } while (i < TEN);
}

void CommaExprFunc()
{
    int i = 0;
    while (++i, i < FIVE) {
        std::cout << "i = " << i << std::endl;
    }
}

void EmptyDoWhile()
{
    int count = 0;

    // 空体的 do-while 循环
    do ; while (++count < FIVE);

    std::cout << "Final count: " << count << std::endl;
}

void ContinueDoWhile()
{
    int i = 0;

    do {
        i++;
        if (i % TWO == 0) {
            continue; // 跳转到条件检查，后面的代码不会执行
        }
        std::cout << "After continue: " << i << " (odd number)" << std::endl;
    } while (i < FIVE);
}

void WhileWithLogicalOperators()
{
    int a = 0;
    int b = TEN;

    // Using&&and | | while loops
    while ((a < FIVE && b > 0) || (a >= FIVE && b < TWENTY)) {
        std::cout << "a = " << a << ", b = " << b << std::endl;

        if (a < FIVE) {
            a++;
            b--;
        } else {
            b++;
        }
    }
}

void DoWhileWithLogicalOperators()
{
    int x = 0;
    int y = 0;

    // Do while loop containing&&and | | operators
    do {
        std::cout << "x = " << x << ", y = " << y << std::endl;

        if (x < THREE) {
            x++;
        } else {
            y++;
        }

        // Cycle continuation condition: (x<5&&y<2) or (x>=5&&y<3)
    } while ((x < FIVE && y < TWO) || (x >= FIVE && y < THREE));
}