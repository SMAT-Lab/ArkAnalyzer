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

// No capture, with parameters
void Case1()
{
    auto func = [](int x) { return x + 1; };
    int res = func(1);
    printf("%d", res);
}

// With capture
void Case2()
{
    const int a = 5;
    auto func = [a](int x) { return x + a; };
    int res = func(1);
    printf("%d", res);
}

// With return type
void Case3()
{
    auto func = [](int x) -> int { return x + 1; };
    int res = func(1);
    printf("%d", res);
}

// No return value
void Case4()
{
    auto func = [](int x) { printf("%d", x); };
    func(1);
}