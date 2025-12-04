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

#define NAMESPACE_A nsA
#define FUNC_NAME Func

namespace NAMESPACE_A {
    void FUNC_NAME() {}
}

using namespace NAMESPACE_A;

void Test()
{
    FUNC_NAME();
}

#define SCHOOL_NAMESPACE School
#define UNIVERSITY_CLASS University
#define STUDENT_CLASS Student
#define DISPLAY_FUNC Display
#define WELCOME_FUNC Welcome

#define SCHOOL_NAME "THU"
#define STUDENT1_NAME "zhang"
#define STUDENT2_NAME "li"
#define STUDENT1_ID 1001
#define STUDENT2_ID 1002
#define STUDENT_TEXT "student: "
#define ID_TEXT "id: "
#define WELCOME_TEXT "welcome to"

namespace SCHOOL_NAMESPACE {
    class UNIVERSITY_CLASS {
    private:
        std::string name;

    public:
        class STUDENT_CLASS {
        public:
            STUDENT_CLASS(const std::string& n, int i) : name(n), id(i) {}

            void DISPLAY_FUNC() const
            {
                std::cout << STUDENT_TEXT << name << ", " << ID_TEXT << id << std::endl;
            }

        private:
            std::string name;
            int id;
        };

        explicit UNIVERSITY_CLASS(const std::string& n) : name(n) {}

        void WELCOME_FUNC() const
        {
            std::cout << WELCOME_TEXT << name << std::endl;
        }
    };
}

int main()
{
    // 使用命名空间下的嵌套类
    SCHOOL_NAMESPACE::UNIVERSITY_CLASS tsinghua(SCHOOL_NAME);
    tsinghua.WELCOME_FUNC();

    // 创建学生对象
    SCHOOL_NAMESPACE::UNIVERSITY_CLASS::STUDENT_CLASS student1(STUDENT1_NAME, STUDENT1_ID);
    student1.DISPLAY_FUNC();

    SCHOOL_NAMESPACE::UNIVERSITY_CLASS::STUDENT_CLASS student2(STUDENT2_NAME, STUDENT2_ID);
    student2.DISPLAY_FUNC();

    return 0;
}