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

// Top-level base class
class Base {
private:
    char name;  // When string is used as type, parsing this->name node as CXXMemberCallExpr

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

// Left middle class, virtual inheritance from Base
class Left : virtual public Base {  // public access modifier is currently not expressed in ArkIR
private:
    int leftPower;

public:
    Left(const char& name, int power) : Base(name), leftPower(power)
    {  // leftPower(power) has no corresponding AST node
        cout << "Left constructor called with power: " << leftPower << endl;
    }

    int GetLeftPower() const
    {
        return leftPower;
    }
};

// Right middle class, virtual inheritance from Base
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

// Final derived class
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

// *** Class polymorphism ***
class Animal {
public:
    // Pure virtual function (virtual + =0) -> abstract class (cannot be instantiated), this function must be overridden by subclasses
    virtual void Sound() const = 0;
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
    // CXXInheritedCtorInitExpr node is generated here: subclass constructor calls inherited constructor from parent class, compiler generates D(int x) : B(x) {}
    using Base::Base;
}

int main()
{
    Derived d('X', ONE_HUNDRED_AND_ONE, SEVENTY_FIVE, FLOAT_NUM);
    d.Introduce();
    MakeSound(new Dog());
    D d1(HUNDRED);
    return 0;
}