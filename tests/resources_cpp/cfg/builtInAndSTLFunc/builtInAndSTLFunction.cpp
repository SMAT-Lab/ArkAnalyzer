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

#include <typeinfo>
#include <iostream>
#include <type_traits>
#include <atomic>
#include <stdatomic.h>

using namespace std;
struct MyStruct {
    int id;
    std::string name;
};

void CXXTypeidExprTest()
{
    const std::type_info &t1 = typeid(int);         // Type
    const std::type_info &t2 = typeid(std::string); // Type
    int a;
    const std::type_info &t3 = typeid(a);  // Basic type object
    const std::type_info &t4 = typeid(&a); // Pointer
    MyStruct s;
    const std::type_info &t5 = typeid(s); // Struct object
}

void ArrayTypeTraitTest()
{
    int arr2[5][3];
    int rank2 = __array_rank(int[5][3]);
    int dim1Size = __array_extent(decltype(arr2), 1);
}

void Foo() noexcept {} // Foo() is noexcept

int CXXNoexceptExprTest()
{
    bool b = noexcept(Foo()); // CXXNoexceptExpr will be generated here
    return 0;
}

atomic_int g_counter = ATOMIC_VAR_INIT(0);
void AtomicExprTest()
{
    atomic_fetch_add(&g_counter, 1); // AtomicExpr will be generated here
}
