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
#define NINE 9
#define ELEVEN 11
using namespace std;

// 类样例
class MyClass {
    static int height;

private:
    char name;
    int age = 10;

public:
    ~MyClass();
    MyClass(char name, int age);
    static int GetHeight()
    {
        return height;
    }

    char GetName()
    {
        return this->name;
    }
    void SetName(char name);
};

MyClass::MyClass(char name, int age)
{
    this->name = name;
    this->age = age;
}

MyClass::~MyClass()
{
    cout << "delete" << endl;
}

void MyClass::SetName(char nameStr)
{
    this->name = nameStr;
}

// 类样例1，测试CXXDefaultInitExpr、函数重载
class DefaultClass {
private:
    char name = 'A';
    int age = '0';

public:
    DefaultClass() {}
};

// 结构体样例
struct MyStruct {
    string title;
    string author;
    string subject;
    int bookId;

    MyStruct(string t, string a, string s, int id) : title(t), author(a), subject(s), bookId(id) {}
    void PrintInfo()
    {
        cout << "title of the book is :" << title << endl;
    }
};

void PrintBookByRef(MyStruct &book)
{
    book.PrintInfo();
}

typedef struct {
    char title[50];
    char author[50];
    struct {
        int price;
    };
} Books;

// 枚举样例
enum MyEnum {
    MONDAY = 1,
    TUESDAY,
    WEDNESDAY,
    THURSDAY,
};

typedef enum {
    FRIDAY,
    SATURDAY,
    SUNDAY
} ADAY;

bool IsWorkDay(int day)
{
    if (day == TUESDAY) {
        return true;
    }
    return false;
}

// 联合体样例
union MyUnion {
    char level;
    bool pass;
    int grade;
};

static union {
    int a;
    float b;
};

typedef union {
    int i;
    char j;
} AUnion;

int main()
{
    MyClass myClass('A', ELEVEN);
    myClass.SetName('B');

    MyStruct myStruct = {"bool", "auther", "C", NINE};
    myStruct.PrintInfo();

    MyUnion mu = {'A'};
    cout << "level is" << mu.level << endl;
    cout << sizeof(mu) << endl;

    bool isWork = IsWorkDay(3);
    return isWork;
}