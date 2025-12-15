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

#include <type_traits>
#include <iostream>

#define MINUS_ONE (-1)
#define MINUS_TWO (-2)
#define ONE 1
#define TWO 2
#define THREE 3
#define FOUR 4
#define FIVE 5
#define TEN 10

int g_num = 10;

int Case1()
{
    int i = g_num;
    int j;
    if (i > 0) {
        j = i;
    } else {
        j = -i;
    }
    return j;
}

int Case2()
{
    int i = 0;
    int k = 0;
    int j;
    if (i > 0) {
        k = i;
        j = k;
    } else {
        j = -i;
    }
    return j;
}

int Case3()
{
    int i = 0;
    int j;
    if (i < 0) {
        if (i < MINUS_ONE) {
            j = ONE;
        } else {
            j = TWO;
        }
    } else {
        if (i > ONE) {
            j = THREE;
        } else {
            j = FOUR;
        }
    }
    return j;
}

int Case4()
{
    int i = 0;
    int j;
    if (i < 0) {
        if (i < MINUS_ONE) {
            j = ONE + THREE;
        } else {
            j = TWO + THREE;
        }
    } else {
        j = FOUR;
    }
    return j;
}

int Case5()
{
    int i = 0;
    int j;
    if (i < 0) {
        if (i < MINUS_ONE) {
            if (i < MINUS_TWO) {
                j = ONE;
            } else {
                j = TWO;
            }
        } else {
            j = THREE;
        }
    } else {
        j = FOUR;
    }
    return j;
}

int Case6()
{
    int i = 0;
    int j;
    if (i > 0) {
        j = i;
    } else {
        j = -i;
    }
    int k;
    if (j > 0) {
        k = j;
    } else {
        k = -j;
    }
    return k;
}

void Case7()
{
    int i = 0;
    if (i > MINUS_ONE) {
        int j;
        if (i > 0) {
            j = i;
        } else {
            j = -i;
        }
        // j is used here
    }
}

// Comma expression
int Case8()
{
    int a = FIVE;
    int b = TEN;
    if (a++, b > a) {
        return b;
    }
    return a;
}

template<typename T>
void Case9(const T& value)
{
    if constexpr (std::is_integral_v<T>) {
        std::cout << "Integral: " << value << std::endl;
    } else if constexpr (std::is_floating_point_v<T>) {
        std::cout << "Floating-point: " << value << std::endl;
    } else {
        std::cout << "Other: " << value << std::endl;
    }
}



int Case10()
{
    bool isReady = true;
    bool hasPermission = false;
    bool isEnabled = true;
    bool isConnected = true;

    // Use&&and | | combination conditions
    if ((isReady && hasPermission) || (isEnabled && isConnected)) {
        std::cout << "Condition met, execute operation" << std::endl;
    } else {
        std::cout << "Conditions not met" << std::endl;
    }
    int a = FIVE;
    int b = TEN;
    int c = TWO;
    if (b > a || b >c || c > 0) {
        return b;
    } else if (a < b && a >c){
        return c;
    }
    return a;
}

void Case11(){
    bool a = true;
    bool b = false;
    if (a || b){
        std::cout<< "The condition is true";
    }else {
        std::cout<< "The condition is false";
    }

    bool c = true;

    // Common misconception: Believing that && and || are at the same level
    if (b && c || a) {
        // Actually equivalent to: a | | (b&&c)
        // Instead of: (a | | b)&&c
        std::cout << "This will be executed!" << std::endl;
    }
}

int main()
{
    Case3();
    Case9(1);
    return 0;
}
