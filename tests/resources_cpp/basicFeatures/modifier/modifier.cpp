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

#define PI 3.1415926

struct Counter {
    static int count; // 静态函数声明
    Counter() { count++; }
    static void Reset() { count = 0; } // 静态函数
};

class Student {
public:
    // 静态变量，在AST节点中表现为VarDecl
    static int age;
    // 常量类型
    const int constVar = 30;
    // 静态函数
    static void GrowUp() { age++; }

    // 常量成员函数
    double GetPi() const
    {
        return PI;
    }

// 受保护
protected:
    int protectedValue;

    // 私有
private:
    int score;
    // 用于在const成员函数中修改变量值
    mutable int accessCount; // 可变成员

    // 声明友元函数
    friend void ModifyScore(Student &s, int newScore);
};

void ModifyScore(Student &s, int newScore)
{
    s.score = newScore; // 友元函数可访问私有成员
}

// 抽象类
class AA {
public:
    virtual void Connect() = 0;
};

// 类继承
class BB : public AA {
public:
    // 虚函数实现
    void Connect() override {};
};