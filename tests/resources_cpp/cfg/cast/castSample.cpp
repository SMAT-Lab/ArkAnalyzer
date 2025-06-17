#include <iostream>
using namespace std;

// CXXStaticCastTest
void CXXStaticCastTest()
{
    int d = 3;
    double i = static_cast<double>(d);
}

// c style cast
void cStyleCastTest()
{
    int i = 2;
    float i_float = (float)i;
}

// CXXConstCastExpr,const_cast转换类型是指针/引用
void CXXConstCastTest()
{
    const int ci = 2;
    int *pi = const_cast<int *>(&ci); // 指针的表示，addr操作处理。（映射至UnaryOperator时因为&未定义而undifined）
}

// CXXDynamicCastExpr
// Define 'Circle' class that implements 'Shape'

class Shape
{
public:
    virtual void draw() = 0; // Pure virtual
};
class Circle : public Shape
{
public:
    void draw() override
    {
        //  ...
    }
};

void CXXDynamicCastTest()
{
    Shape *s = new Circle();
    Circle *c = dynamic_cast<Circle *>(s); // 指针的表示
    if (c)
    {
        c->draw();
    }
}

void CXXReinterpretCastTest() {
    int* pi = new int(42);
    double* pd = reinterpret_cast<double*>(pi); // 指针的表示
}

// CXXFunctionalCastExpr
class Widget
{
public:
    Widget(int);
};

void CXXFunctionalCastTest()
{
    int x = int(3.14);
    auto y = std::string("hello");
    Widget w = Widget(42);
}
// // builtinBitCastExpr----头文件找不到
// void BuiltinBitCastTest(){
//     float f = 3.14f;
//     int i = std::bit_cast<int>(f);
//     float f2 = std::bit_cast<float>(i);
// }
