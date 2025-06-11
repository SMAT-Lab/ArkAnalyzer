#include <stdio.h>
#include <iostream>
#include <map>

struct Data
{
    int a;
    int b;
};

void case1()
{
    int arr[2][2] = {{1, 2}, {3, 4}};
    for (int i = 0; i < 2; i++)
    {
        int c = arr[i][0];
        int d = arr[i][1];
        printf("%d %d\n", c, d);
    }
}

void case2()
{
    Data arr[2] = {{1, 2}, {3, 4}};
    for (int i = 0; i < 2; i++)
    {
        printf("%d %d\n", arr[i].a, arr[i].b);
    }
}

void case3()
{
    int b = 0;
    for (int i = 0; i < 2; i++)
        b += 1;
    printf("%d\n", b);
}

// 省略初始化
void case4()
{
    int i = 0;
    for (; i < 2; i++)
        printf("%d\n", i);
}

void case5()
{
    int i = 0;
    for (;; i++)
    {
        if (i > 2)
            break;
        printf("%d\n", i);
    }
}

// 省略更新语句
void case6()
{
    for (int i = 0; i < 2;)
    {
        printf("%d\n", i);
        i++;
    }
}

// 全部省略
void case7()
{
    int i = 0;
    for (;;)
    {
        if (i > 2)
            break;
        printf("%d\n", i);
        i++;
    }
}

// C++的forRange
void case8()
{
    std::map<int, std::string> map1 = {{1, "one"}, {2, "two"}, {3, "three"}};
    for (const auto &pair : map1)
    {
        printf("%d %s\n", pair.first, pair.second.c_str());
    }
}

void case9()
{
    std::map<int, std::string> map2 = {{1, "one"}, {2, "two"}, {3, "three"}};
    for (const auto &[key, value] : map2)
    {
        printf("%d %s\n", key, value.c_str());
    }
}

int main()
{
    case1();
    case2();
    return 0;
}