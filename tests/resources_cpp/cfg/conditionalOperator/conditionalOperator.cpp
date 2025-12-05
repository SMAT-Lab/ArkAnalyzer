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

int Case1()
{
    int i = 0;
    int j = i > 0 ? i : -i;
    return j;
}

int Case2()
{
    int i = 0;
    int k = 0;
    int j = i > 0 ? k = i : -i;
    return j;
}

int Case3()
{
    int i = 0;
    int j = i < 0 ? i < -1 ? 1 : 2 : i > 1 ? 3 : 4;
    return j;
}

int Case4()
{
    int i = 0;
    int j = i < 0 ? (i < -1 ? 1 : 2) + 3 : 4;
    return j;
}

int Case5()
{
    int i = 0;
    int j = i < 0 ? i < -1 ? i < -2 ? 1 : 2 : 3 : 4;
}

int Case6()
{
    int i = 0;
    int j = i > 0 ? i : -i;
    int k = j > 0 ? j : -j;
    return k;
}

int main()
{
    int i = 0;
    if (i > -1) {
        int j = i > 0 ? i : -i;
    }
}