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

#define SCHOOL_NAME "THU"
#define STUDENT1_NAME "zhang"
#define STUDENT2_NAME "li"
#define STUDENT1_ID 1001
#define STUDENT2_ID 1002
#define STUDENT_TEXT "student: "
#define ID_TEXT "id: "
#define WELCOME_TEXT "welcome to"

namespace School {
    class University {
    private:
        std::string name;

    public:
        class Student {
        public:
            Student(const std::string& n, int i) : name(n), id(i) {}

            void Display() const
            {
                std::cout << STUDENT_TEXT << name << ", " << ID_TEXT << id << std::endl;
            }

        private:
            std::string name;
            int id;
        };

        explicit University(const std::string& n) : name(n) {}

        void Welcome() const
        {
            std::cout << WELCOME_TEXT << name << std::endl;
        }
    };

    // Nested anonymous namespace case
    namespace {
        const std::string kLogPrefix = "[Nested AnonymousSpace] ";

        int g_local_counter = 0;

        void PrintInfoInNested()
        {
            std::cout << kLogPrefix << "Current counter value: " << g_local_counter << std::endl;
        }

        class LocalHelperInNested {
        private:
            int value_;
        public:
            LocalHelperInNested(int v) : value_(v) { g_local_counter++; }
            int GetValue() const { return value_; }
        };
    }
}

// anonymous namespace case
namespace {
    const std::string kLogPrefix = "[AnonymousSpace] ";

    int g_local_counter = 0;

    void PrintInfo()
    {
        std::cout << kLogPrefix << "Current counter value: " << g_local_counter << std::endl;
    }

    class LocalHelper {
    private:
        int value_;
    public:
        LocalHelper(int v) : value_(v) { g_local_counter++; }
        int GetValue() const { return value_; }
    };
}

void TestAnonymousNamespace()
{
    PrintInfo(); // counter=0
    g_local_counter = 5;
    PrintInfo(); // counter=5
    LocalHelper helper1(100);
    PrintInfo(); // counter=6

    // nested namespace
    School::PrintInfoInNested(); // counter=0
    School::g_local_counter = 5;
    School::PrintInfoInNested(); // counter=5
    School::LocalHelperInNested helper2(100);
    School::PrintInfoInNested(); // counter=5
}

int main()
{
    // 使用命名空间下的嵌套类
    School::University tsinghua(SCHOOL_NAME);
    tsinghua.Welcome();

    // 创建学生对象
    School::University::Student student1(STUDENT1_NAME, STUDENT1_ID);
    student1.Display();

    School::University::Student student2(STUDENT2_NAME, STUDENT2_ID);
    student2.Display();

    return 0;
}