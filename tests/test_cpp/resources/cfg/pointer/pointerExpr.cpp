#include <string>

using namespace std;

class MyClass
{
public:
    MyClass(int val) : data(val) {}
    ~MyClass() {}
    int getData() { return this->data; }

private:
    int data;
};

struct MyStruct
{
    int id;
    std::string name;
    char *size;
};

// 1.普通指针类型声明
void ptrType(int *p, int **pp)
{
    int *q = p;
    MyClass *clsPtr = new MyClass(10);
}

// 2.基础指针操作
void basePtrOp(MyStruct *s, MyStruct s1)
{
    int x = 1;
    int *p = &x;
    int y = *p;
    *p = 2;
    p = p + 1;
    s->id = 0;
    s->name = "example";
    int id = s1.id;
}

// 3.多级指针操作
void multiLevelPtrOp(int *p, int **pp, int ***ppp)
{
    int x = 1;
    int y = 2;
    int **qq = pp;
    **pp = 100;
    *qq = &x;
    ppp = &qq;
    **ppp = &y;
    *qq = **ppp;
    **(pp + 1) = 101;
    MyStruct *s = new MyStruct();
    if (s != nullptr)
    {
        MyStruct **ss = &s;
        (*ss)->id = 3;
        (**ss).name = "example";
        s->size = new char;
        *(s->size) = 'S';
        char size = *((*ss)->size);
    }
}

// 4.其他复杂指针操作：数组与指针、函数与指针、指针与const、智能指针(?)