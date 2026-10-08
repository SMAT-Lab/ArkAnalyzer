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

// Intl namespace 成员探测固化资源：成员声明在非首载文件（跨文件同名 namespace，
// Intl 由 lib.es5 + lib.es2017/2018/2019/2020/2021.intl 多文件声明）。

function probeIntl(): void {
    const nf = new Intl.NumberFormat('123');
    nf.formatToParts();
    const ro = nf.resolvedOptions();
    const n = ro.notation;
    const pr = Intl.PluralRules;
}
