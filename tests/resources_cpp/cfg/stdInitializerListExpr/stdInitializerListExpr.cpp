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

#include <initializer_list>
#include <vector>

void example1()
{
    std::initializer_list<int> list = {1, 2, 3, 4, 5};
    //这里会产生 CXXStdInitializerListExpr
}

void func(std::initializer_list<int> list) {}

void example2()
{
    func({1, 2, 3});
    //这里会产生 CXXStdInitializerListExpr

    std::vector<int> vec = {1, 2, 3, 4};
    //这里也会产生
}

class MyClass {
public:
    MyClass(std::initializer_list<int> list) {}
};

void example3() {
    MyClass obj{1, 2, 3, 4};
    //这里会产生 CXXStdInitializerListExpr
}