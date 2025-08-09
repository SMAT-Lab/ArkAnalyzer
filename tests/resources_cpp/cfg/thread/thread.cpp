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

#define SEVEN 7

// 线程执行的函数
void Hello()
{
    cout << "Hello from thread!\n";
}

int Case1()
{
    // 创建并启动线程
    thread t(Hello);

    // 等待线程完成
    t.join();

    cout << "Hello from main!\n";
    return 0;
}

void PrintSum(int a, int b) {
    cout << "Sum: " << a + b << endl;
}

int Case2() {
    // 创建线程并传递参数
    int a = 5;
    thread t(PrintSum, a, SEVEN);

    t.join();
    return 0;
}

int Case3() {
    // 创建并启动线程
    std::thread t(Hello);

    // 等待线程完成
    t.join();

    cout << "Hello from main!\n";
    return 0;
}

int Case4() {
    // 创建线程并传递参数
    int a = 5;
    std::thread t(PrintSum, a, SEVEN);

    t.join();
    return 0;
}

