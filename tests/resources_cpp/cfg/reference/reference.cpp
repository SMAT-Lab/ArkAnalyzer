#include <iostream>
#include <string>
#include <vector>

class MyClass
{
public:
    MyClass(int val) : data(val) {}
    ~MyClass() {}
    int getData() { return data; }

private:
    int data;
};

// 基本类型引用
void baseLeftRefer(double &b)
{
    int a = 1;
    bool flag = true;
    double f = 1.02;
    char c = 'x';
    int &ref_a = a;
    bool &ref_flag = flag;
    double &ref_f = f;
    char &ref_c = c;
}

void baseRightRefer()
{
    int x = 1;
    int y = 2;
    int &&rr1 = 10 int &&rr2 = x + y;
}

// 基本类型指针
void pointRefer()
{
    int *ptr = nullptr;
    int *&ref_to_ptr = ptr; //  引用
}

// 自定义类型的引用
void myClassRefer()
{
    MyClass a(5);
    MyClass &b = a;
}
