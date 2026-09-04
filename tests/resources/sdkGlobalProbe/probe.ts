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

// SDK 全局符号成员探测固化资源：成员声明在非首载文件（interface 跨文件增补）。

function probe(): [string, boolean] {
    const s: string = 'abc';
    const r = s.replaceAll('a', 'b');
    const arr = [1, 2, 3];
    const inc = arr.includes(2);
    return [r, inc];
}
