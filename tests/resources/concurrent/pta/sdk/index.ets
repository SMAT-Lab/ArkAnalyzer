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

import { Vector } from './Vector';
import { ArkTSUtils, collections } from '@kit.ArkTS';
import { UIUtils } from '@kit.ArkUI';

function main() {
  let v = new Vector();
  let array = collections.Array.create(2, '');
  let objstr = ArkTSUtils.ASON.stringify(array);
  let obj = ArkTSUtils.ASON.parse(objstr);
  let obj2 = UIUtils.makeObserved(v);
}