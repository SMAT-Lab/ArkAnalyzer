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
#define FOURTYTWO 42

struct Foo {
    void Bar(int x) {
    }
};

void Case1()
{
    Foo f;
    f.Bar(FOURTYTWO); // 这里会生成CXXMemberCallExpr节点
}

void Case2(int x = 0, int y = 1)
{
    x++;
    y--;
}

void Case3(char c = 'o')
{
    c++;
}

void exampleFunction(int requiredParam,
                    [[maybe_unused]] int unusedParam = 0,
                    [[maybe_unused]] const std::string& unusedStr = "")
{
    // 只使用 requiredParam
    // unusedParam 和 unusedStr 可能未使用，但有默认值
}