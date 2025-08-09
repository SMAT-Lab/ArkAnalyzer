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

#define THREE 3
#define TWO 2

class Cat{
public:
    int RunAndSound(int inputItem)
    {
        int info = inputItem + GrtNum() * THREE;
        return info;
    }

private:
    int GrtNum()
    {
        return TWO;
    }
};

int main()
{
    Cat cat;
    int result = cat.RunAndSound(1);
    return result;
}