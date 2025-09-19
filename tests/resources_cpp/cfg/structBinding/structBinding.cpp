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

#include <utility>
#include <tuple>
#include <string>
#include <map>
using namespace std;
// 示例1：基本用法
void BasicUsage() {
    auto [x, y] = std::make_pair(1, 2);
    auto [a, b] = std::pair{3, 4};
}

// 示例2：使用引用避免拷贝
void ReferenceUsage() {
    auto pair = std::make_pair(10, 20);
    auto& [x, y] = pair;
    x = 100;
}

// 示例3：用于tuple
void TupleUsage() {
    auto [name, age, score] = std::make_tuple("Alice", 25, 95.5);
}

// 示例4：用于结构体
void StructUsage() {
    struct Person {
            std::string name;
            int age;
            double salary;
        };
    Person person{"Bob", 30, 50000.0};
    auto [name, age, salary] = person;
}

// 示例5：在范围for循环中使用（常见于map遍历）
void MapUsage() {
    std::map<std::string, int> scores = {
        {"Alice", 90},
        {"Bob", 85},
        {"Charlie", 95}
    };

    for (const auto& item : scores) {
    }

    for (const auto& [name, score] : scores) {
    }
}

// 示例6：函数返回多个值
std::tuple<std::string, int, bool> GetStudentInfo() {
    return {"David", 22, true};
}

void FunctionReturnUsage() {
    auto [name, age, is_graduated] = get_student_info();
}

// 示例7：与const和引用组合使用
void ConstReferenceUsage() {
    const auto complex_data = std::make_tuple("test", 42, 3.14);
    const auto& [str, num, pi] = complex_data;
}

int main() {
    pair<int, int> myPair{3, 4};
    BasicUsage();
    ReferenceUsage();
    TupleUsage();
    StructUsage();
    MapUsage();
    FunctionReturnUsage();
    ConstReferenceUsage();

    return 0;
}