struct Counter
{
    static int count; // 静态函数声明
    Counter() { count++; }
    static void reset() { count = 0; } // 静态函数
};
// 外部extern
extern int count;
class Student
{
public:
    // 静态变量，在AST节点中表现为VarDecl
    static int age;
    // 常量类型
    const int constVar = 30;
    // 静态函数
    static void growup() { age++; }

    // 常量成员函数
    double getPi() const
    {
        return 3.1415926;
    }

// 受保护
protected:
    int protectedValue;

    // 私有
private:
    int score;
    // 用于在const成员函数中修改变量值
    mutable int accessCount; // 可变成员

    // 声明友元函数
    friend void modifyScore(Student &s, int newScore);
};

void modifyScore(Student &s, int newScore)
{
    s.score = newScore; // 友元函数可访问私有成员
}

// 抽象类
class AA
{
public:
    virtual void connect() = 0;
};

// 类继承
class BB : public AA
{
public:
    // 虚函数实现
    void connect() override {};
};