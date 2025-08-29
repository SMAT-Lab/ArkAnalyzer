/*
 * Copyright (c) 2024 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#include <iostream>
#include "../include/test.h"

#define PI 3.14

int FuncDoSomething(int i, int j)
{
    if (i > 0) {
        j = i;
    } else {
        j = -i;
    }
    return j;
}

// Class method implementation
double Circle::CalculateArea() const
{
    return PI * radius * radius;
}

void Circle::PrintInfo() const
{
    std::cout << "Circle at (" << center.x << ", " << center.y
              << ") with radius " << radius << std::endl;
}

bool Circle::IsLarger(const Circle& c1, const Circle& c2)
{
    return c1.radius > c2.radius;
}