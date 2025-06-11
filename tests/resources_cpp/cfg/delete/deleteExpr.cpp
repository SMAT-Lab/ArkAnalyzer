class Animal
{
public:
    Animal() {}
    ~Animal() {}
    void sound() {}
};

// 创建单个对象，然后释放
void delObj()
{
    int *a = new int;
    delete a;
    a = nullptr;
}

// 动态创建数组然后释放
void delArr()
{
    int *arr = new int[10];
    delete[] arr;
    arr = nullptr;
}

// 创建类对象，然后释放
void delClassObj()
{
    Animal *a = new Animal;
    delete a;
    a = nullptr;
}

// 释放成员
struct myStruct
{
    int *a;
    int b;
    myStruct() {}
};

void delMember()
{
    myStruct *ss = new myStruct;
    delete ss->a;
    delete ss;
    ss = nullptr;
}
