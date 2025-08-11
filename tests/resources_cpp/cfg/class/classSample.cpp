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

using namespace std;

#define HUNDRED 100
#define ONE_HUNDRED_AND_ONE 101
#define SEVENTY_FIVE 75
#define FLOAT_NUM 3.6

// 顶层基类
class Base {
private:
    char name;  // *string做类型时解析this->name节点为CXXMemberCallExpr

public:
    explicit Base(const char& pname) : name(pname)
    {
        cout << "Base constructor called with name: " << name << endl;
    }

    char GetName() const
    {
        return name;
    }
};

// 左中间类，虚继承 Base
class Left : virtual public Base {  // *public访问修饰符当前ArkIR没有表达
private:
    int leftPower;

public:
    Left(const char& name, int power) : Base(name), leftPower(power)
    {  // *leftPower(power)没有对应AST节点
        cout << "Left constructor called with power: " << leftPower << endl;
    }

    int GetLeftPower() const
    {
        return leftPower;
    }
};

// 右中间类，虚继承 Base
class Right : virtual public Base {
private:
    double rightSpeed;

public:
    Right(const char& name, double speed) : Base(name), rightSpeed(speed)
    {
        cout << "Right constructor called with speed: " << rightSpeed << endl;
    }

    double GetRightSpeed() const
    {
        return rightSpeed;
    }
};

// 最终派生类
class Derived : public Left, public Right {
private:
    int robotId;

public:
    Derived(const char& name, int id, int power, double speed)
        : Base(name), Left(name, power), Right(name, speed), robotId(id)
    {
        cout << "Derived constructor called with id: " << robotId << endl;
    }

    int GetRobotId() const
    {
        return robotId;
    }

    void Introduce() const
    {
        cout << "=== Robot Info ===" << endl;
        cout << "Name: " << GetName() << endl;
        cout << "ID: " << robotId << endl;
        cout << "Left Power: " << GetLeftPower() << endl;
        cout << "Right Speed: " << GetRightSpeed() << endl;
    }
};

// *** 类的多态 ***
class Animal {
public:
    virtual void Sound() const = 0;  // 纯虚函数（virtual + =0) -》 抽象类（不能实例化），该函数必须被子类重写
};

class Dog : public Animal {
public:
    void Sound() const override
    {
            std::cout << "wo wo wo!" <<  std::endl;
    }
};

class Cat : public Animal {
public:
    void Sound() const override
    {
        std::cout << "meow meow mewo!" <<  std::endl;
    }
};

class Pig : public Animal {
public:
    void Sound() const override
    {
        std::cout << "Aooooooowooooo!" <<  std::endl;
    }
};

void MakeSound(const Animal* animal)
{
    animal->Sound();
}

// clang::CXXInheritedCtorInitExpr节点
class D : public Base {
    using Base::Base;   // 此处产生CXXInheritedCtorInitExpr节点：子类构造函数调用了从父类继承的构造函数，编译器生成D(int x) : B(x) {}
}

int main()
{
    Derived d('X', ONE_HUNDRED_AND_ONE, SEVENTY_FIVE, FLOAT_NUM);
    d.Introduce();
    MakeSound(new Dog());
    D d1(HUNDRED);
    return 0;
}