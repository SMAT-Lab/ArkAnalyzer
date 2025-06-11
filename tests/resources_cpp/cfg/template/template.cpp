#include <iostream>
// 定义带有两个模板类型的函数模板
template <typename T1, typename T2>
void printPair(T1 a, T2 b)
{
    std::cout << "First:" << a << ", Second" << b << std::endl;
}

// 函数模板
template <typename T = int>
T max1(T a, T b)
{
    T temp = a > b ? a : b;
    return temp;
}

template <typename Q>
int max2(Q a, Q b)
{
    Q temp = a > b ? a : b;
    return 2;
}

int instantiation1(int x, int y)
{
    int z = max1(x, y);
    int y = max2(x, y);
    printPair(x, y);
    return 0;
}