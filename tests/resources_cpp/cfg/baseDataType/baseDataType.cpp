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
using namespace std;

bool IsChar(int data)
{
    return data > 0;
}

int main()
{
    bool boolData = IsChar(1);
    if (boolData) {
        char charData1 = 'A';
        signed char charData2 = -10;
        unsigned char charData3 = 10;
        wchar_t wcharData1 = L'好';
        wchar_t wcharData2[] = L"hello";
        char16_t char16Data1 = u'A';
        char16_t char16Data2[] = u"hello";
        char32_t char32Data1 = U'\U0001F600';
        char32_t char32Data2[] = U"hello";
        char charData4 = char(); // clang::CXXScalarValueInitExpr, 合法，charData4被初始化为""
    } else {
        short shortData1 = -1;
        unsigned short shortData2 = 1;
        int intData1 = -10;
        unsigned int intData2 = 10;
        long longData1 = -100;
        unsigned long longData2 = 100;
        long long long2Data1 = -1000;
        unsigned long long2Data2 = 1000;
        float floatData = 88.8f;
        double doubleData1 = 88.888;
        long double doubleData2 = 88.8888;
        int intData3 = int();          // clang::CXXScalarValueInitExpr, 合法，initData3被初始化为0
        float floatData1 = float();    // clang::CXXScalarValueInitExpr,合法，floatDaTa1被初始化为0
        double doubleData3 = double(); // clang::CXXScalarValueInitExpr,合法，doubleData3被初始化为0
    }
    return 0;
}