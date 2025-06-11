#include <iostream>
#include <string>

using namespace std;

// 类样例
class MyClass
{
    static int height;

private:
    char name;
    int age = 10;

public:
    ~MyClass();
    MyClass(char name, int age);
    static int getHeight()
    {
        return height;
    }

    char getName()
    {
        return this->name;
    }
    void setName(char name);
};

MyClass::MyClass(char name, int age) : name(name), age(age)
{
    this->name = name;
    this->age = age;
}

MyClass::~MyClass()
{
    cout << "delete" << endl;
}

void MyClass::setName(char nameStr)
{
    this->name = nameStr;
}

// 类样例1，测试CXXDefaultInitExpr、函数重载
class DefaultClass
{
private:
    char name = 'A';
    int age = '0';

public:
    DefaultClass() {}
    // DefaultClass(char name, int age):name(name), age(age){
    //     this->name = name;
    //     this->age = age;
    // }
};

// 结构体样例
struct MyStruct
{
    string title;
    string author;
    string subjecrt;
    int book_id;

    MyStruct(string t, string a, string s, int id) : title(t), author(a), subjecrt(s), book_id(id) {}
    void printInfo()
    {
        cout << "title of the book is :" << title << endl;
    }
};
void printBookByRef(MyStruct &book)
{
    book.printInfo();
}

typedef struct
{
    char title[50];
    char author[50];
    struct
    {
        int price;
    };
} Books;

// 枚举样例
enum MyEnum
{
    Monday = 1,
    Tuesday,
    Wednesday,
    Thursday,
};

typedef enum
{
    Friday,
    Saturday,
    Sunday
} a_day;

bool isWorkDay(int day)
{
    if (day == Tuesday)
    {
        return true;
    }
    return false;
}

// 联合体样例
union MyUnion
{
    char level;
    bool pass;
    int grade;
};

static union
{
    int a;
    float b;
};

typedef union
{
    int i;
    char j;
} a_union;

int main()
{
    MyClass myClass('A', 11);
    myClass.setName('B');

    MyStruct myStruct = {"bool", "auther", "C", 9};
    myStruct.printInfo();

    MyUnion mu = {'A'};
    cout << "level is" << mu.level << endl;
    cout << sizeof(mu) << endl;

    bool isWork = isWorkDay(3);
    return isWork;
}