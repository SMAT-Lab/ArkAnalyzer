int case1()
{
    int v = 3;
    int a;
    if (v > 0)
    {
        a = 10;
    }
    else
    {
        a = -10;
    }
    return a;
}
int case2()
{
    int v = 3;
    int a;
    if (v > 0)
    {
        a = 10;
    }
    else if (v == 0)
    {
        a = 0;
    }
    else
    {
        a = -10;
    }
    return a;
}