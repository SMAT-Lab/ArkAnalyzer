#ifndef MY_HEADER_H
#define MY_HEADER_H

#include "castSample.h"

int funcDoSomething(int i, int j)
{
    if (i > 0) {
        j = i;
    } else {
        j = -i;
    }
    return CXXStaticCast(j);
}

#endif