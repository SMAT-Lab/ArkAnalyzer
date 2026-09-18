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

@Entry
@Component
struct TernaryIfElseTest {
  @State flag: boolean = true;
  @State nested: boolean = false;
  label: string = 'x';

  build() {
    Column() {
      // both UI arms
      this.flag ? Text('A') : Text('B')

      // mixed: pure value + UI
      this.flag ? this.label : Text('C')

      // nested UI ternaries
      this.flag ? (this.nested ? Text('N1') : Text('N2')) : Text('N3')

      // value ternary in component arg — also If.create/branch, then Text.create(result)
      Text(this.flag ? 'pass' : 'fail')
    }
  }
}
