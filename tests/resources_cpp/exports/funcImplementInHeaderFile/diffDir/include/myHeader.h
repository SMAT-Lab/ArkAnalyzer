#ifndef MY_HEADER_H
#define MY_HEADER_H

int funcDoSomething(int i, int j)
{
    if (i > 0) {
        j = i;
    } else {
        j = -i;
    }
    return j;
}

#endif