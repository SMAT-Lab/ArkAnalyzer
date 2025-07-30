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

/****** 运算符重载 ******/
class Vector {
private:
    double x, y;
public:
    Vector(double x = 0, double y = 0) : x(x), y(y) {}

    // 重载 二元运算符（成员函数）
    Vector operator+(const Vector& other) const {
        return Vector(x + other.x, y + other.y);
    }

    // 前置自增运算符（++v）
    Vector& operator++() {
        ++x;  // 自增 x 分量
        ++y;  // 自增 y 分量
        return *this;  // 返回自身引用
    }

    // 重载函数调用
    Vector& operator()(const int num1, const int num2) {
        x = x + num1;
        y = y + num2;
        return *this;
    }

    // 在类内声明友元函数（关键！）
    friend std::ostream& operator<<(std::ostream& os, const Vector& v);
    friend std::istream& operator>>(std::istream& is, Vector& v);
};

// 在类外定义
std::ostream& operator<<(std::ostream& os, const Vector& v) {
    os << "(" << v.x << ", " << v.y << ")";
    return os;
}

std::istream& operator>>(std::istream& is, Vector& v) {
    is >> v.x >> v.y;
    return is;
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

    // ***运算符重载
    Vector a(1, 2), b(3, 4);
    Vector c = a + b;  // 等价于 a.operator+(b)
    ++c;  // 等价于c.operator++()
    c(1, 1);  // 等价于c.operator()(1, 1)

    Vector v;
    std::cin >> v;  // 等价于 operator>>(std::cin, v)
    std::cout << "Vector: " << v  << " ;" << std::endl;  // 等价于 operator<<(std::cout, v)
    std::cout << v << "aaa" << std::endl;  // 等价于 operator<<(std::cout, v)
}