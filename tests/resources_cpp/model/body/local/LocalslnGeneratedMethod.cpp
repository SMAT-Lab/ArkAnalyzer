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

#include <iostream>

using namespace std;
class Case1
{
public:
    int instanceField;

    Case1()
    {
        instanceField = 1;
    }
};

class Case2
{
public:
    static int staticField;
};
int Case2::staticField = 1;
int main()
{
    // 创建Case1实例
    Case1 obj1;
    cout << "Case1 instanceField: " << obj1.instanceField << endl;

    // 创建Case2的静态字段
    cout << "Case1 staticField: " << Case2::staticField << endl;
    return 0;
}