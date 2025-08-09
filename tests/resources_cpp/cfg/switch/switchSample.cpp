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

#define MARCO_THREE 3

enum NumConstant {
    ONE,
    TWO,
    THREE,
    FOUR,
    TEN
};

void Case1()
{
    int a = 0;
    int b = 1;
    switch (a) {
        case TWO:
            b = TWO;
        case THREE:
            b = THREE;
            break;
        default:
            b = TEN;
    }
}

void Case2()
{
    int a = 0;
    int b = 1;
    switch (a) {
        case TWO: {
            b = TWO;
        }
        case THREE: {
            b = THREE;
            break;
        }
        default:
            b = TEN;
    }
}

void Case3()
{
    int a = 0;
    int b = 1;
    switch (a) {
        case TWO:
            b = TWO;
        case THREE:
            switch (b) {
            case ONE:
                b = ONE;
            case TWO:
                b = TWO;
            default:
                b = TEN;
            }
            break;
        default:
            b = TEN;
    }
}

void Case4()
{
    int b = ONE;
    for (int i = 0; i < THREE; ++i) {
        switch (i) {
        case TWO:
            b = TWO;
        case THREE:
            b = THREE;
            continue;
        default:
            b = TEN;
        }
        b = TEN;
    }
}

void Case5()
{
    int a = 0;
    int b = 1;
    switch (a) {
        default:
            b = TEN;
    }
    a = ONE;
}

void Case6()
{
    int a = 0;
    int b = 1;
    switch (a++) {}
    a = ONE;
}

void Case7()
{
    int a = 0;
    int b = 1;
    switch (a) {
        case TWO:
            b = TWO;
        case THREE:
            b = THREE;
            break;
        case FOUR:
            b = FOUR;
    }
}

void Case8()
{
    int a = 0;
    int b = 1;
    switch (a) {
        case TWO:
        case THREE:
            b = THREE;
            break;
        default:
            b = TEN;
    }
}

void Case9()
{
    int a = 0;
    int b = 1;
    switch (a) {
        case TWO:
        case THREE:
        default:
            b = TEN;
    }
}

void Case10()
{
    int a = 0;
    int b = 1;
    switch (a) {
        case TWO:
        case THREE:
            b = THREE;
    }
}

void Case11()
{
    int a = 0;
    int b = 1;
    switch (a) {
        case TWO:
        case THREE:
            b = THREE;
            break;
        default:
            // 空操作
    }
}

void Case12()
{
    int a = 0;
    int b = (a > ONE) ? TWO : MARCO_THREE;
    switch (a) {
        case TWO:
            b = TWO;
            break;
        case THREE:
            b = THREE;
            break;
        default:
            b = TEN;
            break;
    }
}

void Case13()
{
    int a = 0;
    int b = 1;
    switch (a) {
        case TWO:
            b = TWO;
            break;
        case THREE:
            b = THREE;
            break;
        default:
            b = TEN;
            break;
    }
    if (a > ONE) {
        b = TWO;
    }
    else {
        b = THREE;
    }
}

int main() {
    Case1();
    return 0;
}
