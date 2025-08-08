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
// 定义带有两个模板类型的函数模板
template <typename T1, typename T2>
void printPair(T1 a, T2 b)
{
    std::cout << "First:" << a << ", Second" << b << std::endl;
}

// 函数模板
template <typename T = int>
T max1(T a, T b)
{
    T temp = a > b ? a : b;
    return temp;
}

template <typename Q>
int max2(Q a, Q b)
{
    Q temp = a > b ? a : b;
    return 2;
}

int instantiation1(int x, int y)
{
    int z = max1(x, y);
    int y = max2(x, y);
    printPair(x, y);
    return 0;
}

// 类模板
template <typename T>
class MyContainer {
private:
    T data1;
    T data2;
public:
    MyContainer(T value1, T value2) : data1(value1), data2(value2)
    {
    }
    void print()
    {
        std::cout << data1;
    }
    T sum()
    {

        return data1 + data2;
    }

};
void instantiation2(){
    MyContainer<int> intContainer(100,20);
    int a = intContainer.sum();
    intContainer.print();
    MyContainer<double> doubleContainer(3.14,2.68);
}

// clang:: CXXPseudoDestructorExpr
template <typename T>
void destroy_ptr(T* ptr){
    ptr->~T();
}
int main(){
    double d = 2.718;
    destroy_ptr(&d);
    return 0;
}

// clang::CXXFoldExpr
template <typename... Args>
auto sum(Args... args){
    return (... + args);
}
int instantiation3(){
    int z = sum(1, 2, 3, 4, 5, 6);
    return 0;
}
