#include <stdio.h>

// 无捕获，有参
void case1()
{
    auto func = [](int x)
    { return x + 1; };
    int res = func(1);
    printf("%d", res);
}

// TODO: 可以尝试写一个const变量声明，修改variableDeclarationListToValueAndStmts函数

// 带捕获
void case2()
{
    const int a = 5;
    auto func = [a](int x)
    { return x + a; };
    int res = func(2);
    printf("%d", res);
}

// 带返回类型
void case3()
{
    auto func = [](int x) -> int
    { return x + 1; };
    int res = func(3);
    printf("%d", res);
}

// 无返回值
void case4()
{
    auto func = [](int x)
    { printf("%d", x); };
    func(4);
}

// void case5()
// {
//     int a = 5;
//     auto func = [&a](int x) { // 引用传递
//         a = 6;
//         return x + a;
//     };
//     int res = func(2);
//     printf("%d", res);
// }

// void case6()
// {
//     int a = 5;
//     auto func = [a](int x) mutable { // 在函数内可以修改值传递的捕获参数
//         a = 6;
//         return x + a;
//     };
//     int res = func(2);
//     printf("%d", res);
// }