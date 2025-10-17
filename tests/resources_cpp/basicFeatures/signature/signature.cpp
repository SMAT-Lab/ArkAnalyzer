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
#include <iostream>
#include <string>

using namespace std;

typedef int UserId;

namespace nsA {

    void Func()
    {
        cout << "Hello World!" << endl;
    }

    class DefaultClass {
    private:
        char name = 'A';
        int age = 0;
    public:
        DefaultClass(char pName, int pAge)
        {
            name = pName;
            age = pAge;
        }

        int GetAge() const
        {
            return this->age;
        }
    };
}

class Base {
private:
    char name;

public:
    explicit Base(char& pname) : name(pname) {}

    char GetName() const
    {
        return name;
    }
};

typedef Base Base_Alias;

int main()
{
    nsA::Func();
    nsA::DefaultClass dClass('A', 0);
    UserId age = dClass.GetAge();

    Base_Alias bClass('A');
    char name = bClass.GetName();
    return 0;
}