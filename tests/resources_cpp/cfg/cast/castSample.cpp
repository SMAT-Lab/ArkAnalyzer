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
using namespace std;

// CXXStaticCastTest
void CXXStaticCastTest()
{
    int d = 3;
    double i = static_cast<double>(d);
}

// c style cast
void CStyleCastTest()
{
    int i = 2;
    float iFloat = (float)i;
}

// CXXConstCastExpr,const_cast转换类型是指针/引用
void CXXConstCastTest()
{
    const int ci = 2;
    int *pi = const_cast<int *>(&ci); // 指针的表示，addr操作处理。（映射至UnaryOperator时因为&未定义而undifined）
}

// CXXDynamicCastExpr
// Define 'Circle' class that implements 'Shape'
class Shape {
public:
    virtual void Draw() = 0; // Pure virtual
};

class Circle : public Shape {
public:
    void Draw() override
    {
        //  ...
    }
};

void CXXDynamicCastTest()
{
    Shape *s = new Circle();
    Circle *c = dynamic_cast<Circle *>(s); // 指针的表示
    if (c) {
        c->Draw();
    }
}

void CXXReinterpretCastTest()
{
    int* pi = new int(42);
    double* pd = reinterpret_cast<double*>(pi); // 指针的表示
}

// CXXFunctionalCastExpr
class Widget {
public:
    explicit Widget(int);
};

void CXXFunctionalCastTest()
{
    int x = int(3.14);
    auto y = std::string("hello");
    Widget w = Widget(42);
}
