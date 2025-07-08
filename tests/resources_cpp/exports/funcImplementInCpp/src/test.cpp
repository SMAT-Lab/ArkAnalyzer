#include <iostream>
#include "../include/test.h"

int funcDoSomething(int i, int j)
{
    if (i > 0) {
        j = i;
    } else {
        j = -i;
    }
    return j;
}

// 类方法实现
double Circle::calculateArea() const {
    return 3.14 * radius * radius;
}

void Circle::printInfo() const {
    std::cout << "Circle at (" << center.x << ", " << center.y
              << ") with radius " << radius << std::endl;
}

bool Circle::isLarger(const Circle& c1, const Circle& c2) {
    return c1.radius > c2.radius;
}