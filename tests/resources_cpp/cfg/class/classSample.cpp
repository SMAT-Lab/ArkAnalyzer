#include <iostream>
#include <string>

using namespace std;

// 顶层基类
class Base {
private:
    char name;  // *string做类型时解析this->name节点为CXXMemberCallExpr

public:
    Base(const char& pname) : name(pname) {
        cout << "Base constructor called with name: " << name << endl;
    }

    char getName() const {
        return name;
    }
};

// 左中间类，虚继承 Base
class Left : virtual public Base {  // *public访问修饰符当前ArkIR没有表达
private:
    int leftPower;

public:
    Left(const char& name, int power) : Base(name), leftPower(power) {  // *leftPower(power)没有对应AST节点
        cout << "Left constructor called with power: " << leftPower << endl;
    }

    int getLeftPower() const {
        return leftPower;
    }
};

// 右中间类，虚继承 Base
class Right : virtual public Base {
private:
    double rightSpeed;

public:
    Right(const char& name, double speed)
        : Base(name), rightSpeed(speed) {
        cout << "Right constructor called with speed: " << rightSpeed << endl;
    }

    double getRightSpeed() const {
        return rightSpeed;
    }
};

// 最终派生类
class Derived : public Left, public Right {
private:
    int robotId;

public:
    Derived(const char& name, int id, int power, double speed)
        : Base(name), Left(name, power), Right(name,speed), robotId(id) {
        cout << "Derived constructor called with id: " << robotId << endl;
    }

    int getRobotId() const {
        return robotId;
    }

    void introduce() const {
        cout << "=== Robot Info ===" << endl;
        cout << "Name: " << getName() << endl;
        cout << "ID: " << robotId << endl;
        cout << "Left Power: " << getLeftPower() << endl;
        cout << "Right Speed: " << getRightSpeed() << endl;
    }
};

// *** 类的多态 ***
class Animal
{
public:
    virtual void sound() const = 0;  // 纯虚函数（virtual + =0) -》 抽象类（不能实例化），该函数必须被子类重写
};

class Dog : public Animal
{
public:
    void sound() const override {
            std::cout << "wo wo wo!" <<  std::endl;
    }
};

class Cat : public Animal
{
public:
    void sound() const override {
        std::cout << "meow meow mewo!" <<  std::endl;
    }
};

class Pig : public Animal
{
public:
    void sound() const override {
        std::cout << "Aooooooowooooo!" <<  std::endl;
    }
};

void makeSound(const Animal* animal)
{
    animal->sound();
}


int main() {
    Derived d('X', 101, 75, 3.6);
    d.introduce();
    makeSound(new Dog());
    return 0;
}