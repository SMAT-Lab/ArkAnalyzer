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
#define FIVE 5
#define TEN 10

void Case1()
{
    ;
    ;
    ; // Null operation
}

void Case2()
{
    if (true) {
        ;
    }
    if (false) {
        ;
    }
}

void Case3()
{
    int i = 0;
    for (; i < TWO; ++i) {
        ;
    }
}

void Case4()
{
    int count = 3;
    while (count-- > 0) {
        ; // Null operation
    }
    for (int i = 0; i < FIVE; ++i) {
        ; // Null operation
    }
}

void Case5()
{
    int option = 2;
    switch (option) {
        case ONE:;
            break;
        case TWO:;
            break;
        default:;
    }
}

void Case6()
{
    int x = 5;
    do {
        ;
    } while (x-- > 0);
    ;

    {
        ;
    }
}

void Case7()
{
    for (;;)
        ;
}

void Case8()
{
    while (1)
        ;
}

void Case9()
{
    int i = 0;
    while (i < TEN) {
        i++;
        ;
    };
}

void Case10()
{
    for (int i = 0; i < TWO;) {
        ;
    }
}

void Case11()
{
    for (int i = 0;;) {
        ;
    }
}

int main()
{
    Case1();
}