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

#define MINUS_ONE (-1)
#define MINUS_TWO (-2)
#define ONE 1
#define TWO 2
#define THREE 3
#define FOUR 4

int Case1()
{
    int i = 0;
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

int main()
{
    Case3();
    return 0;
}
