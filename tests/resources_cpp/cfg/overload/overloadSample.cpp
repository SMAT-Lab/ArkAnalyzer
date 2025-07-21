#include <iostream>
#include <string>

using namespace std;

/****** 函数重载 ******/
void printInfo(int x) {
    cout << x << endl;
}

void printInfo(char x) {
    cout << x << endl;
}

void printInfo(int x, char y) {
    cout << x << " " << y << endl;
}

/****** 构造函数重载 ******/
class Person {
private:
    string name;
    int age;

public:
    // 1. 默认构造函数
    Person() {
        name = "Unknown";
        age = 0;
        cout << "Default constructor called" << endl;
    }

    // 2. 带全部参数的构造函数
    Person(const string& n, int a);

    // 3. 带姓名的构造函数，使用初始化列表的构造函数（推荐写法）
    Person(const string& n);

    // 打印信息的方法
    void printInfo() const {
        cout << "Name: " << name << ", Age: " << age << endl;
    }
};

Person::Person(const string& n, int a) {
    name = n;
    age = a;
    cout << "Constructor with all parameters called" << endl;
}

Person::Person(const string& n) : name(n), age(0) {
    cout << "Constructor with name called" << endl;
}


int main() {
    printInfo(1);
    printInfo('A');
    printInfo(1, 'A');

    Person p1;                        // 默认构造函数
    Person p2("Alice", 30);           // 带全部参数的构造函数
    Person p3("Charlie");             // 带姓名的构造函数
    p1.printInfo();
    p2.printInfo();
    p3.printInfo();
}