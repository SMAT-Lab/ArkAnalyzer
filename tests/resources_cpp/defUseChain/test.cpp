#include <stdio.h>
void defUseChainTest(){
    int a = 1;
    int b = 2;
    a = a + b;
    if (a < 2) {
        a = b;
    } else {
        printf("%d\n", a);
    }
    printf("%d\n", b);
}