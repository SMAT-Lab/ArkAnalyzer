void case1()
{
    int a = 0;
    int b = 1;
    switch (a)
    {
    case 2:
        b = 2;
    case 3:
        b = 3;
        break;
    default:
        b = 10;
    }
}
void case2()
{
    int a = 0;
    int b = 1;
    switch (a)
    {
    case 2:
    {
        b = 2;
    }
    case 3:
    {
        b = 3;
        break;
    }
    default:
        b = 10;
    }
}
void case3()
{
    int a = 0;
    int b = 1;
    switch (a)
    {
    case 2:
        b = 2;
    case 3:
        switch (b)
        {
        case 1:
            b = 11;
        case 2:
            b = 12;
        default:
            b = 100;
        }
        break;
    default:
        b = 10;
    }
}

void case4()
{
    int b = 1;
    for (int i = 0; i < 3; ++i)
    {
        switch (i)
        {
        case 2:
            b = 2;
        case 3:
            b = 3;
            continue;
        default:
            b = 10;
        }
        b = 100;
    }
}

void case5()
{
    int a = 0;
    int b = 1;
    switch (a)
    {
    default:
        b = 10;
    }
    a = 1;
}

void case6()
{
    int a = 0;
    int b = 1;
    switch (a++)
    {
    }
    a = 1;
}

void case7()
{
    int a = 0;
    int b = 1;
    switch (a)
    {
    case 2:
        b = 2;
    case 3:
        b = 3;
        break;
    case 4:
        b = 4;
    }
}

void case8()
{
    int a = 0;
    int b = 1;
    switch (a)
    {
    case 2:
    case 3:
        b = 3;
        break;
    default:
        b = 10;
    }
}

void case9()
{
    int a = 0;
    int b = 1;
    switch (a)
    {
    case 2:
    case 3:
    default:
        b = 10;
    }
}

void case10()
{
    int a = 0;
    int b = 1;
    switch (a)
    {
    case 2:
    case 3:
        b = 3;
    }
}

void case11()
{
    int a = 0;
    int b = 1;
    switch (a)
    {
    case 2:
    case 3:
        b = 3;
        break;
    default:
        // 空操作
    }
}
void case12()
{
    int a = 0;
    int b = (a > 1) ? 12 : 13;
    switch (a)
    {
    case 2:
        b = 2;
        break;
    case 3:
        b = 3;
        break;
    default:
        b = 10;
        break;
    }
}
void case13()
{
    int a = 0;
    int b = 1;
    switch (a)
    {
    case 2:
        b = 2;
        break;
    case 3:
        b = 3;
        break;
    default:
        b = 10;
        break;
    }
    if (a > 1)
    {
        b = 12;
    }
    else
    {
        b = 13;
    }
}
int main()
{
    case1();
    return 0;
}
