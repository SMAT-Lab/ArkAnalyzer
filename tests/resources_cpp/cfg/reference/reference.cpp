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

#include <iostream>
#include <string>
#include <vector>
using namespace std ;

#define FIVE 5
#define SIX 6

class MyClass {
public:
    explicit MyClass(int val) : data(val) {}
    ~MyClass() {}
    int GetData() { return data; }

private:
    int data;
};

// 基本类型引用
void BaseLeftRefer(double &b)
{
    int a = 1;
    bool flag = true;
    double f = 1.02;
    char c = 'x';
    int &refA = a;
    bool &refFlag = flag;
    double &refF = f;
    char &refC = c;
}

void BaseRightRefer()
{
    int x = 1;
    int y = 2;
    int &&rr1 = 10 int &&rr2 = x + y;
}

// 基本类型指针
void PointRefer()
{
    int *ptr = nullptr;
    int *&refToPtr = ptr; //  引用
}

// 自定义类型的引用
void MyClassRefer()
{
    MyClass a(FIVE);
    MyClass &b = a;
}

void MoveCase()
{
    int temp = 5;
    int &&refA = std::move(temp);
    refA = SIX;

    std::string str1 = "Hello";
    std::string str2 = std::move(str1); // 移动而非复制
}

class Data {
public:
    Data() = default;
    Data(const Data&) { std::cout << "Copy\n"; }
    Data& operator=(const Data&) = delete;
    Data(Data&&) { std::cout << "Move\n"; }
    Data& operator=(Data&& other) noexcept;
};

template <typename T>
void Relay(T&& arg)
{
    Data d1(forward<T>(arg));
}

void main()
{
    Data data;
    Relay(Data());
    Relay(data);
}