#include <typeinfo>
#include <iostream>
#include <type_traits>
#include <stdatomic.h>

using namespace std;
struct MyStruct
{
    int id;
    std::string name;
};

void CXXTypeidExprTest()
{
    const std::type_info &t1 = typeid(int);         // 类型
    const std::type_info &t2 = typeid(std::string); // 类型
    int a;
    const std::type_info &t3 = typeid(a);  // 基本类型对象
    const std::type_info &t4 = typeid(&a); // 指针
    MyStruct s;
    const std::type_info &t5 = typeid(s); // 结构体对象
}

void ArrayTypeTraitTest()
{
    int arr2[5][3];
    int rank2 = __array_rank(decltype(arr2));
    int dim1_size = __array_extent(decltype(arr2), 1);
}

void foo() noexcept {} // foo()是noexpect的

int CXXNoexceptExprTest()
{
    bool b = noexcept(foo()); // 这里会生成CXXNoexceptExpr
    return 0;
}

atomic_int counter = ATOMIC_VAR_INIT(0);
void AtomicExprTest()
{
    atomic_fetch_add(&counter, 1); // 这里会生成AtomicExpr
}
