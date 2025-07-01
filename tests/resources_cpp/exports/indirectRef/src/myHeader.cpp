#include "../include/myHeader.h"

int funcDoSomething(int i, int j)
{
    if (i > 0) {
        j = i;
    } else {
        j = -i;
    }
    return CXXStaticCast(j);
}