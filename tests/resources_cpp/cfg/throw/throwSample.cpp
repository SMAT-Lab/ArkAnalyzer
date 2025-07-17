#include <iostream>
using namespace std;

void try_throw_case() {
    try {
        cout << "before throw" << endl;
        throw 42; //抛出一个整数异常
        cout << "after throw" << endl;
    } catch (int e) {
        cout << "Caught exception: " << e << endl;
    }
}


double division(int a, int b)
{
    if (b == 0)
    {
        throw "Division by zero condition!";
    }
    return (a / b);
}

int main()
{
    int x = 50;
    int y = 0;
    double z = 0;
    try
    {
        z = division(x, y);
    }
    catch (const char *msg)
    {
        //
    }
    return 0;
}