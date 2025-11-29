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

namespace nsA {
    void Func() {}
}

using namespace nsA;

void Test()
{
    Func();
}

namespace School {
    class University {
    private:
        std::string name;

    public:
        class Student {
        public:
            Student(const std::string& n, int i) : name(n), id(i) {}

            void display() const {
                std::cout << "student: " << name << ", id: " << id << std::endl;
            }

        private:
            std::string name;
            int id;
        };

        University(const std::string& n) : name(n) {}

        void welcome() const {
            std::cout << "welcome to" << name << std::endl;
        }
    };
}

int main() {
    // 使用命名空间下的嵌套类
    School::University tsinghua("THU");
    tsinghua.welcome();

    // 创建学生对象
    School::University::Student student1("zhang", 1001);
    student1.display();

    School::University::Student student2("li", 1002);
    student2.display();

    return 0;
}