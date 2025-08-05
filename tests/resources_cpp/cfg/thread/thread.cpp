#include <iostream>
#include <thread>
#include <string>
#include <vector>
using namespace std;
// 线程执行的函数
void hello() {
    cout << "Hello from thread!\n";
}

int case1() {
    // 创建并启动线程
    thread t(hello);

    // 等待线程完成
    t.join();

    cout << "Hello from main!\n";
    return 0;
}

void print_sum(int a, int b) {
    cout << "Sum: " << a + b << endl;
}

int case2() {
    // 创建线程并传递参数
    int a = 5;
    thread t(print_sum, a, 7);

    t.join();
    return 0;
}

int case3() {
    // 创建并启动线程
    std::thread t(hello);

    // 等待线程完成
    t.join();

    cout << "Hello from main!\n";
    return 0;
}

int case4() {
    // 创建线程并传递参数
    int a = 5;
    std::thread t(print_sum, a, 7);

    t.join();
    return 0;
}

