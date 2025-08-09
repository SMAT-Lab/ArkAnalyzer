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

#include <vector>
#include <string>

void AutoTest()
{
    auto a = 5;

    std::vector<int> vec = {1, 2, 3};
    auto it = vec.begin();
    auto it2 = vec[0];

    auto lambda = [](int x) { return x * 2; };
}

void DecltypeTest()
{
    int a = 10;
    decltype(a) w = 10;

    auto b = 5;
    decltype(b) y = b;

    int c = 10;
    decltype(auto) y = c;  // y 是 int&
    decltype(auto) z = 42; // z 是 int
}