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

