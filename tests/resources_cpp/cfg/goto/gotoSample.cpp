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

#define ZERO 0
#define ONE 1
#define TWO 2
#define THREE 3
#define FOUR 4
#define FIVE 5
#define TEN 10


int Case1()
{
    int j;
    int num = 1;
    if (num > 0) {
        num--;
        goto end;
    } else {
        num++;
    }
    j = ONE;
end:
    return 0;
}

int Case2()
{
    int j;
    int num = 1;
    if (num > ZERO) {
        goto end;
    } else {
        num++;
    }
    j = ONE;
end:
    return 0;
}

int Case3()
{
    int j;
    int num = 1;
    if (num == ZERO) {
        goto end;
    } else if (num == ONE) {
        goto end;
    } else if (num == TWO) {
        goto end;
    } else {
        num++;
    }
    j = ONE;
end:
    return 0;
}

int Case4()
{
    int j;
    int num = 1;
    if (num == ZERO) {
        goto end1;
    } else if (num == ONE) {
        goto end2;
    } else if (num == TWO) {
        goto end3;
    } else {
        num++;
    }
    j = ONE;
end1:
    j++;
end2:
    j--;
end3:
    return 0;
}

int Case5()
{
    int i = 0;
    int j;
    if (i < ZERO) {
        goto l1;
    } else {
        goto l2;
    }
l1:
    j = ONE;
    goto exit;
l2:
    j = TWO;
    goto exit;
exit:
    return j;
}

int Case6()
{
    int j;
    int num = 1;
    if (num > ZERO)
        goto end;
    else
        num++;
    j = ONE;
end:
    return 0;
}

int Case7()
{
    int i = 0;
    int j;
    if (i < ZERO) {
        if (i < ONE) {
            goto l1;
        } else {
            goto l2;
        }
    } else {
        if (i > ONE) {
            goto l3;
        } else {
            goto l4;
        }
    }
l1:
    j = ONE;
    goto exit;
l2:
    j = TWO;
    goto exit;
l3:
    j = THREE;
    goto exit;
l4:
    j = FOUR;
    goto exit;
exit:
    return j;
}

void Case8()
{
    int a = 0;
    int b = 1;
    switch (a) {
        case TWO:
            goto end;
        case THREE:
            b = THREE;
            break;
        default:
            b = TEN;
            break;
    }
end:
    return;
}

void Case9()
{
    int a = 0;
    int b = 1;
    switch (a) {
        case TWO: {
            goto end;
        }
        case THREE: {
            b = THREE;
            break;
        }
        default: {
            b = TEN;
            break;
        }
    }
end:
    return;
}

void Case10()
{
    int a = 0;
    for (int b = 1; b < TEN; b++) {
        a = a + TWO;
        if (a > FIVE) {
            goto end;
        } else {
            a--;
        }
    }
end:
    return;
}