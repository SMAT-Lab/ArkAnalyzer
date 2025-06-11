#include <iostream>
#include <exception>
#include <stdexcept>

using namespace std;
void case1()
{
    try
    {
        cout << "try" << endl;
    }
    catch (...)
    {
        cout << "catch" << endl;
    }
}
void case2()
{
    try
    {
        cout << "try" << endl;
        // 可能会抛出异常的代码
        throw new std::runtime_error("Runtime error occurred");
    }
    catch (const std::runtime_error &e)
    {
        cout << "Caught runtime error: " << e.what() << endl;
    }
    catch (const std::logic_error &e)
    {
        cout << "Caught logic error: " << e.what() << endl;
    }
    catch (const std::exception &e)
    {
        cout << "Caught exception: " << e.what() << endl;
    }
    catch (...)
    {
        cout << "Caught  unknown exception" << endl;
    }
}

void case3()
{
    try
    {
        cout << "try" << endl;
        if (0)
        {
            cout << 1 << endl;
        }
        else
        {
            cout << 2 << endl;
        }
        cout << 3 << endl;
    }
    catch (...)
    {
        cout << "catch" << endl;
        if (4)
        {
            cout << 5 << endl;
        }
        else
        {
            cout << 6 << endl;
        }
        cout << 7 << endl;
    }
}

void case4()
{
    int i = 0;
    try
    {
        cout << "try" << endl;
    }
    catch (...)
    {
        cout << "catch" << endl;
    }
    cout << i << endl;
}

void case5()
{
    int i = 0;
    try
    {
        cout << "try" << endl;
        try
        {
            cout << "inner try" << endl;
        }
        catch (...)
        {
            cout << "inner catch" << endl;
        }
    }
    catch (...)
    {
        cout << "catch" << endl;
    }
    finally
    {
        cout << "finally" << endl;
    }
    cout << i << endl;
}
int main()
{
    // 调用测试函数
    case1();
    case2();
    case3();
    case4();
    case5();
    return 0;
}