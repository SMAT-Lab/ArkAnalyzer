int case1()
{
    int num = 1;
    if (num > 0)
    {
        num--;
        goto end;
    }
    else
    {
        num++;
    }
    int j = 1;
end:
    return 0;
}
int case2()
{
    int num = 1;
    if (num > 0)
    {
        goto end;
    }
    else
    {
        num++;
    }
    int j = 1;
end:
    return 0;
}
int case3()
{
    int num = 1;
    if (num == 0)
    {
        goto end;
    }
    else if (num == 1)
    {
        goto end;
    }
    else if (num == 2)
    {
        goto end;
    }
    else
    {
        num++;
    }
    int j = 1;
end:
    return 0;
}
int case4()
{
    int num = 1;
    if (num == 0)
    {
        goto end1;
    }
    else if (num == 1)
    {
        goto end2;
    }
    else if (num == 2)
    {
        goto end3;
    }
    else
    {
        num++;
    }
    int j = 1;
end1:
    j++;
end2:
    j--;
end3:
    return 0;
}

int case5()
{
    int i = 0;
    int j;
    if (i < 0)
    {
        goto l1;
    }
    else
    {
        goto l2;
    }
l1:
    j = 1;
    goto exit;
l2:
    j = 2;
    goto exit;
exit:
    return 0;
}
int case6()
{
    int num = 1;
    if (num > 0)
        goto end;
    else
        num++;
    int j = 1;
end:
    return 0;
}

int case7()
{
    int i = 0;
    int j;
    if (i < 0)
    {
        if (i < -1)
        {
            goto l1;
        }
        else
        {
            goto l2;
        }
    }
    else
    {
        if (i > 1)
        {
            goto l3;
        }
        else
        {
            goto l4;
        }
    }
l1:
    j = 1;
    goto exit;
l2:
    j = 2;
    goto exit;
l3:
    j = 3;
    goto exit;
l4:
    j = 4;
    goto exit;
exit:
    return j;
}

void case8()
{
    int a = 0;
    int b = 1;
    switch (a)
    {
    case 2:
        goto end;
    case 3:
        b = 3;
        break;
    default:
        b = 10;
        break;
    }
end:
    return;
}

void case9()
{
    int a = 0;
    int b = 1;
    switch (a)
    {
    case 2:
    {
        goto end;
    }
    case 3:
    {
        b = 3;
        break;
    }
    default:
    {
        b = 10;
        break;
    }
    }
end:
    return;
}

void case10()
{
    int a = 0;
    for (int b = 1; b < 10; b++)
    {
        a = a + 2;
        if (a > 5)
        {
            goto end;
        }
        else
        {
            a--;
        }
    }
end:
    return;
}