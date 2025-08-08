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

int case1()
{
    int i = 0;
    int j;
    if (i > 0)
    {
        j = i;
    }
    else
    {
        j = -i;
    }
    return j;
}

int case2()
{
    int i = 0;
    int k = 0;
    int j;
    if (i > 0)
    {
        k = i;
        j = k;
    }
    else
    {
        j = -i;
    }
    return j;
}

int case3()
{
    int i = 0;
    int j;
    if (i < 0)
    {
        if (i < -1)
        {
            j = 1;
        }
        else
        {
            j = 2;
        }
    }
    else
    {
        if (i > 1)
        {
            j = 3;
        }
        else
        {
            j = 4;
        }
    }
    return j;
}
int case4()
{
    int i = 0;
    int j;
    if (i < 0)
    {
        if (i < -1)
        {
            j = 1 + 3;
        }
        else
        {
            j = 2 + 3;
        }
    }
    else
    {
        j = 4;
    }
    return j;
}

int case5()
{
    int i = 0;
    int j;
    if (i < 0)
    {
        if (i < -1)
        {
            if (i < -2)
            {
                j = 1;
            }
            else
            {
                j = 2;
            }
        }
        else
        {
            j = 3;
        }
    }
    else
    {
        j = 4;
    }
    return j;
}

int case6()
{
    int i = 0;
    int j;
    if (i > 0)
    {
        j = i;
    }
    else
    {
        j = -i;
    }
    int k;
    if ((j > 0))
    {
        k = j;
    }
    else
    {
        k = -j;
    }
    return k;
}

void case7()
{
    int i = 0;
    if (i > -1)
    {
        int j;
        if (i > 0)
        {
            j = i;
        }
        else
        {
            j = -i;
        }
        // j is used here
    }
}

int main()
{
    case3();
    return 0;
}
