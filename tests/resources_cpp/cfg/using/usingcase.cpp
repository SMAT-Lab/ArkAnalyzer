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
#include <vector>
#include <map>
#include <string>

#define PI 3.14
#define FLOAT123 1.23

using namespace std; // 场景1: 全局using namespace

void TestUsingNamespace()
{
    cout << "[test_using_namespace] hello" << endl;
}

void TestUsingDeclaration()
{ // 场景2: using 声明单个成员
    using std::cout;
    using std::endl;
    cout << "[test_using_declaration] hello" << endl;
}

using IntVec = std::vector<int>; // 场景3: using 类型别名（非模板）

IntVec MakeIntvec()
{
    return IntVec{1, 2, 3};
}

template<typename T>
using MyMap = std::map<int, T>; // 场景4: using 类型别名（模板）

void TestUsingTypeAliasTemplate()
{
    MyMap<float> m;
    m[1] = 3.14f;
    cout << "[test_using_type_alias_template] m[1] = " << m[1] << endl;
}

struct Base { // 场景5: using 基类成员
    void Foo(int) { cout << "[Base::foo(int)]\n"; }
};

struct Derived : Base {
    using Base::Foo;
    void Foo(double) { cout << "[Derived::foo(double)]\n"; }
};

void TestUsingBaseMember()
{
    Derived d;
    d.Foo(1);      // 调用Base::foo(int)
    d.Foo(FLOAT123);   // 调用Derived::foo(double)
}

// 场景6: using 枚举成员引入（不建议，但演示写法）
enum class Color { RED, GREEN, BLUE };
void TestUsingEnumMember()
{
    using Color::RED;
    Color c = RED;
    if (c == Color::RED){
        cout << "[test_using_enum_member] Red\n";
    }
}

// 场景7: 模板类型萃取
template<typename T>
using value_type_t = typename T::value_type;
void TestTemplateTypeAlias()
{
    value_type_t<std::vector<double>> x = PI;
    cout << "[test_template_type_alias] x = " << x << endl;
}

 // 场景8: 作用域内的 using（函数内部）
void TestUsingLocalScope()
{
    using std::string;
    string s = "abc";
    cout << "[test_using_local_scope] s = " << s << endl;
}

// 场景9: 多层嵌套别名
using INT = int;
using INT2 = INT;
void TestMultiAlias()
{
    INT2 val = 10;
    cout << "[test_multi_alias] val = " << val << endl;
}
// 场景10: 命名空间下的using
namespace ns1 {
    int Foo() { return 1; }
}
namespace ns2 {
    using ns1::Foo;
}
void TestNamespaceUsing()
{
    int v = ns2::Foo();
    cout << "[test_namespace_using] v = " << v << endl;
}

// 场景11: 模板参数类型别名嵌套
template<typename T>
struct Foo {
    using Vec = std::vector<T>;
};
void TestNestedAliasInClass()
{
    Foo<int>::Vec v = {1, 2, 3};
    cout << "[test_nested_alias_in_class] v[0] = " << v[0] << endl;
}

int main()
{
    TestUsingNamespace();
    TestUsingDeclaration();
    IntVec v = MakeIntvec();
    cout << "[main] v.size() = " << v.size() << endl;
    TestUsingTypeAliasTemplate();
    TestUsingBaseMember();
    TestUsingEnumMember();
    TestTemplateTypeAlias();
    TestUsingLocalScope();
    TestMultiAlias();
    TestNamespaceUsing();
    TestNestedAliasInClass();
    return 0;
}
