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

#define PI 3.1415926

struct Counter {
    static int count; // Static function declaration
    Counter() { count++; }
    static void Reset() { count = 0; } // Static function
};

class Student {
public:
    // Static variable, represented as VarDecl in AST nodes
    static int age;
    // Constant type
    const int constVar = 30;
    // Static function
    static void GrowUp() { age++; }

    // Constant member function
    double GetPi() const
    {
        return PI;
    }

// Protected
protected:
    int protectedValue;

    // Private
private:
    int score;
    // Used to modify variable values in const member functions
    mutable int accessCount; // Mutable member

    // Declare friend function
    friend void ModifyScore(Student &s, int newScore);
};

void ModifyScore(Student &s, int newScore)
{
    s.score = newScore; // Friend function can access private members
}

// Abstract class
class AA {
public:
    virtual void Connect() = 0;
};

// Class inheritance
class BB : public AA {
public:
    // Virtual function implementation
    void Connect() override {};
};