// macro definition
#define NUM 1

// function declaration
int add(int aa, int bb);

// global variable
int g_NUM = 1;

// struct definition
struct MyStr{
   int age;
};

// class definition
class Point {
public:
    // 直接在类内定义，默认为inline
    void setX(int x) { m_x = x; }

private:
    int m_x;
};

// type alias
typedef unsigned int uint;
