/*
 * Copyright (c) 2026 Huawei Device Co., Ltd.
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

namespace demo {

struct Pair {
    const char* first;
    int second;
};

struct MapIter {
    Pair* cur;
    Pair operator*();
    MapIter& operator++();
    bool operator!=(const MapIter& other) const;
};

struct MyMap {
    MapIter begin() const;
    MapIter end() const;
};

} // namespace demo

// loop1（item 整体绑定）+ loop2（结构化绑定）——与 CI structBinding MapUsage 双循环同构
void MapUsage()
{
    demo::MyMap scores;
    for (const auto& item : scores) {
        int x = 1;
        (void)x;
    }
    for (const auto& [name, score] : scores) {
        int y = 2;
        (void)y;
    }
}
