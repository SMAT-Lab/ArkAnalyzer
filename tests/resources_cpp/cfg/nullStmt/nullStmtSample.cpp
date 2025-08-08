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

void case1()
{
    ;
    ;
    ; // 空操作
}

void case2()
{
    if (true)
        ;
    if (false)
        ;
}

void case3()
{
    int i = 0;
    for (; i < 2; ++i)
    {
        ;
    }
}

void case4()
{
    int count = 3;
    while (count-- > 0)
    {
        ; // 空操作
    }
    for (int i = 0; i < 5; ++i)
    {
        ; // 空操作
    }
}

void case5()
{
    int option = 2;
    switch (option)
    {
    case 1:;
        break;
    case 2:;
        break;
    default:;
    }
}

void case6()
{
    int x = 5;
    do
    {
        ;
    } while (x-- > 0);
    ;

    {
        ;
    }
}

void case7()
{
    for (;;)
        ;
}

void case8()
{
    while (1)
        ;
}

void case9()
{
    int i = 0;
    while (i < 10)
    {
        i++;
        ;
    };
}

void case10()
{
    for (int i = 0; i < 2;)
    {
        ;
    }
}

void case11()
{
    for (int i = 0;;)
    {
        ;
    }
}
int main()
{
    case1();
}