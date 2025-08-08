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

class Animal
{
public:
    Animal() {}
    ~Animal() {}
    void sound() {}
};

// 创建单个对象，然后释放
void delObj()
{
    int *a = new int;
    delete a;
    a = nullptr;
}

// 动态创建数组然后释放
void delArr()
{
    int *arr = new int[10];
    delete[] arr;
    arr = nullptr;
}

// 创建类对象，然后释放
void delClassObj()
{
    Animal *a = new Animal;
    delete a;
    a = nullptr;
}

// 释放成员
struct myStruct
{
    int *a;
    int b;
    myStruct() {}
};

void delMember()
{
    myStruct *ss = new myStruct;
    delete ss->a;
    delete ss;
    ss = nullptr;
}
