
int case1()
{
    int i = 0;
    int j = i > 0 ? i : -1;
    return j;
}

int case2()
{
    int i = 0;
    int k = 0;
    int j = i > 0 ? k = i : -1;
    return j;
}

int case3()
{
    int i = 0;
    int j = i < 0 ? i < -1 ? 1 : 2 : i > 1 ? 3
                                           : 4;
    return j;
}

int case4()
{
    int i = 0;
    int j = i < 0 ? (i < -1 ? 1 : 2) + 3 : 4;
    return j;
}

int case5()
{
    int i = 0;
    int j = i < 0 ? i < -1 ? i < -2 ? 1 : 2 : 3 : 4;
}

int case6()
{
    int i = 0;
    int j = i > 0 ? i : -i;
    int k = j > 0 ? j : -j;
    return k;
}

int case7()
{
    int i = 0;
    if (i > -1)
    {
        int j = i > 0 ? i : -i;
    }
}