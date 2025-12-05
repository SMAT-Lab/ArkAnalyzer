/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
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

#ifndef TEST_H
#define TEST_H

#define PI 3.14
#define MAX_SIZE 100

extern const int K_VERSION;

enum class Color {
    RED,
    GREEN,
    BLUE,
    YELLOW
};

struct Point {
    double x;
    double y;
};

int FuncDoSomething(int i, int j);

class Circle {
private:
    Point center;
    double radius;
    Color color;

public:
    // Constructor
    Circle(const Point& c, double r, Color clr = Color::RED)
        : center(c), radius(r), color(clr) {}

    // Getter methods
    Point GetCenter() const { return center; }
    double GetRadius() const { return radius; }
    Color GetColor() const { return color; }

    // Ordinary member functions
    double CalculateArea() const;
    void PrintInfo() const;

    // Static functions
    static bool IsLarger(const Circle& c1, const Circle& c2);
};

#endif