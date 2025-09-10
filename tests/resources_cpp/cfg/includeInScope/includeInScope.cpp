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
#define USE_OPTIMIZED_VERSION

void IncludeInFunction()
{
    #include "includeInFunction.h"

    int a = g_NUM;
    int b = a + NUM;
    int c = add(a, b);

    MyStruct myStruct;
    myStruct.age = g_NUM;
}

class IncludeInClass {
private:
    int data;
public:
    void Process()
    {
        #ifdef USE_OPTIMIZED_VERSION
            #include "includeInClass.h"
        #endif
    }
};