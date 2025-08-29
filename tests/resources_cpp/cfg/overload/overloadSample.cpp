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

#define ONE 1
#define TWO 2
#define THREE 3
#define FOUR 4
#define THIRTY 30

/****** Function overloading ******/
void PrintInfo(int x)
{
    cout << x << endl;
}

void PrintInfo(char x)
{
    cout << x << endl;
}

void PrintInfo(int x, char y)
{
    cout << x << " " << y << endl;
}

/******  Constructor overloading ******/
class Person {
private:
    string name;
    int age;

public:
    // 1. Default constructor
    Person()
    {
        name = "Unknown";
        age = 0;
        cout << "Default constructor called" << endl;
    }

    // 2. Constructor with all parameters
    explicit Person(const string& n, int a);

    // 3. Constructor with name, using initializer list constructor (recommended approach)
    explicit Person(const string& n);

    // Method to print information
    void PrintInfo() const
    {
        cout << "Name: " << name << ", Age: " << age << endl;
    }
};

Person::Person(const string& n, int a)
{
    name = n;
    age = a;
    cout << "Constructor with all parameters called" << endl;
}

Person::Person(const string& n) : name(n), age(0)
{
    cout << "Constructor with name called" << endl;
}

/****** Operator overloading ******/
class Vector {
private:
    double x, y;
public:
    explicit Vector(double x = 0, double y = 0) : x(x), y(y) {}

    // Overload binary operator (member function)
    Vector operator+(const Vector& other) const
    {
        return Vector(x + other.x, y + other.y);
    }

    // Prefix increment operator (++v)
    Vector& operator++()
    {
        ++x;  // Increment y component
        ++y;  // Increment y component
        return *this;  // 返回自身引用
    }

    //  Overload function call
    Vector& operator()(const int num1, const int num2)
    {
        x = x + num1;
        y = y + num2;
        return *this;
    }

    // Declare friend function within class (key!)
    friend std::ostream& operator<<(std::ostream& os, const Vector& v);
    friend std::istream& operator>>(std::istream& is, Vector& v);
};

// Define outside class
std::ostream& operator<<(std::ostream& os, const Vector& v)
{
    os << "(" << v.x << ", " << v.y << ")";
    return os;
}

std::istream& operator>>(std::istream& is, Vector& v)
{
    is >> v.x >> v.y;
    return is;
}

/****** clang::UserDefinedLiteral ******/
constexpr long double operator""_km(long double km)
{
    return km * 1000; // 1km = 1000m
}

// Character type
char operator""_c(char c)
{
    return c;
}

int main()
{
    PrintInfo(1);
    PrintInfo('A');
    PrintInfo(1, 'A');

    Person p1;                        // Default constructor
    Person p2("Alice", THIRTY);           // Constructor with all parameters
    Person p3("Charlie");             // Constructor with name
    p1.PrintInfo();
    p2.PrintInfo();
    p3.PrintInfo();

    // ***Operator overloading
    Vector a(ONE, TWO);
    Vector b(THREE, FOUR);
    Vector c = a + b;  // Equivalent to a.operator+(b)
    ++c;  // Equivalent to c.operator++()
    c(1, 1);  // Equivalent to c.operator()(1, 1)

    Vector v;
    std::cin >> v;  // Equivalent to operator>>(std::cin, v)
    std::cout << "Vector: " << v  << " ;" << std::endl;  // Equivalent to operator<<(std::cout, v)
    std::cout << v << "aaa" << std::endl;  // Equivalent to operator<<(std::cout, v)

    // ***clang::UserDefinedLiteral
    auto distance = 5.3_km;  // Will generate clang::UserDefinedLiteral node
    auto ch = 'a'_c;     // Character user-defined literal
}