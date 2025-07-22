#include <iostream>
#include <vector>
#include <map>
#include <string>

using namespace std; // 场景1: 全局using namespace

void test_using_namespace() {
    cout << "[test_using_namespace] hello" << endl;
}

void test_using_declaration() { // 场景2: using 声明单个成员
    using std::cout;
    using std::endl;
    cout << "[test_using_declaration] hello" << endl;
}

using IntVec = std::vector<int>; // 场景3: using 类型别名（非模板）

IntVec make_intvec() {
    return IntVec{1, 2, 3};
}

template<typename T>
using MyMap = std::map<int, T>; // 场景4: using 类型别名（模板）

void test_using_type_alias_template() {
    MyMap<float> m;
    m[1] = 3.14f;
    cout << "[test_using_type_alias_template] m[1] = " << m[1] << endl;
}

struct Base { // 场景5: using 基类成员
    void foo(int) { cout << "[Base::foo(int)]\n"; }
};

struct Derived : Base {
    using Base::foo;
    void foo(double) { cout << "[Derived::foo(double)]\n"; }
};

void test_using_base_member() {
    Derived d;
    d.foo(1);      // 调用Base::foo(int)
    d.foo(1.23);   // 调用Derived::foo(double)
}

// 场景6: using 枚举成员引入（不建议，但演示写法）
enum class Color { Red, Green, Blue };
void test_using_enum_member() {
    using Color::Red;
    Color c = Red;
    if (c == Color::Red)
        cout << "[test_using_enum_member] Red\n";
}

// 场景7: 模板类型萃取
template<typename T>
using value_type_t = typename T::value_type;
void test_template_type_alias() {
    value_type_t<std::vector<double>> x = 3.14;
    cout << "[test_template_type_alias] x = " << x << endl;
}

// 场景8: 作用域内的 using（函数内部）
void test_using_local_scope() {
    using std::string;
    string s = "abc";
    cout << "[test_using_local_scope] s = " << s << endl;
}

// 场景9: 多层嵌套别名
using INT = int;
using INT2 = INT;
void test_multi_alias() {
    INT2 val = 10;
    cout << "[test_multi_alias] val = " << val << endl;
}

// 场景10: 命名空间下的using
namespace ns1 {
    int foo() { return 1; }
}
namespace ns2 {
    using ns1::foo;
}
void test_namespace_using() {
    int v = ns2::foo();
    cout << "[test_namespace_using] v = " << v << endl;
}

// 场景11: 模板参数类型别名嵌套
template<typename T>
struct Foo {
    using Vec = std::vector<T>;
};
void test_nested_alias_in_class() {
    Foo<int>::Vec v = {1, 2, 3};
    cout << "[test_nested_alias_in_class] v[0] = " << v[0] << endl;
}

int main() {
    test_using_namespace();
    test_using_declaration();
    IntVec v = make_intvec();
    cout << "[main] v.size() = " << v.size() << endl;
    test_using_type_alias_template();
    test_using_base_member();
    test_using_enum_member();
    test_template_type_alias();
    test_using_local_scope();
    test_multi_alias();
    test_namespace_using();
    test_nested_alias_in_class();
    return 0;
}
