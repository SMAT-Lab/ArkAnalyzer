#include <iostream>
#include "include/test.h"

using namespace std;

int main() {
    int res = funcDoSomething(1, 2);
    cout << "result is : " << res << endl;

    Point p = {1.0, 2.0};
    Circle c(p, 5.0, Color::GREEN);
    double area = c.calculateArea();
    cout << "Area of circle is : " << area << endl;
    c.printInfo();
    return 0;
}