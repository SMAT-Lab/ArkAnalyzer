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
        char charData4 = char(); // clang::CXXScalarValueInitExpr, valid, charData4 is initialized to ""
        string ss = "hello";
    } else {
        short shortData1 = -1;
        unsigned short shortData2 = 1;
        int intData1 = -10;
        unsigned int intData2 = 10;
        long longData1 = -100;
        unsigned long longData2 = 100;
        long long long2Data1 = -1000;
        unsigned long long long2Data2 = 1000;
        float floatData = 88.8f;
        double doubleData1 = 88.888;
        long double doubleData2 = 88.8888;
        int intData3 = int();          // clang::CXXScalarValueInitExpr, valid, initData3 is initialized to 0
        float floatData1 = float();    // clang::CXXScalarValueInitExpr, valid, floatDaTa1 is initialized to 0
        double doubleData3 = double(); // clang::CXXScalarValueInitExpr, valid, doubleData3 is initialized to 0
    }
    return 0;
}