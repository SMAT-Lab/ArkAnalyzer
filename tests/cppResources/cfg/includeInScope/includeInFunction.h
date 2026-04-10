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
#ifndef INCLUDEINFUNCTION_H
#define INCLUDEINFUNCTION_H
// macro definition
#define NUM 1

// function declaration
int add(int aa, int bb);

// global variable
int g_NUM = 1;

// struct definition
struct MyStruct {
    int age;
};

// class definition
class Point {
public:
    // 直接在类内定义，默认为inline
    void setX(int x) { m_x = x; }

private:
    int m_x;
};

// type alias
typedef unsigned int uint;
#endif