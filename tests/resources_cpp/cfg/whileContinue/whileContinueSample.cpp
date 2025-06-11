#include <stdio.h>

int main(int num)
{
    while (num > 0)
    {
        if (num == 2)
        {
            num = num + 1;
            continue;
        }
        num = num - 2;
    }
    return 0;
}