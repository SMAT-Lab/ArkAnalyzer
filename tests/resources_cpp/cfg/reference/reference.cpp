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

class MyClass
{
public:
    MyClass(int val) : data(val) {}
    ~MyClass() {}
    int getData() { return data; }

private:
    int data;
};

// 基本类型引用
void baseLeftRefer(double &b)
{
    int a = 1;
    bool flag = true;
    double f = 1.02;
    char c = 'x';
    int &ref_a = a;
    bool &ref_flag = flag;
    double &ref_f = f;
    char &ref_c = c;
}

void baseRightRefer()
{
    int x = 1;
    int y = 2;
    int &&rr1 = 10 int &&rr2 = x + y;
}

// 基本类型指针
void pointRefer()
{
    int *ptr = nullptr;
    int *&ref_to_ptr = ptr; //  引用
}

// 自定义类型的引用
void myClassRefer()
{
    MyClass a(5);
    MyClass &b = a;
}

void moveCase() {
    int temp = 5;
    int &&ref_a = std::move(temp);
    ref_a = 6;

    std::string str1 = "Hello";
    std::string str2 = std::move(str1); // 移动而非复制
}

class Data {
public:
    Data() = default;
    Data(const Data&) { std::cout << "Copy\n"; }
    Data(Data&&) { std::cout << "Move\n"; }
};

template <typename T>
void relay(T&& arg) {
    Data d1(forward<T>(arg));

}

void main() {
    Data data;
    relay(Data());
    relay(data);
}