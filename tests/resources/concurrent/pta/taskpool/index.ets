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
import { taskpool } from '@kit.ArkTS';

@Concurrent
function thread1(vTmp: Vector) {
  vTmp.add();
}

@Concurrent
function thread2(vTmp2: Vector) {
  vTmp2.add();
}

@Concurrent
function thread3(vTmp3: Vector) {
  vTmp3.add();
}

function main() {
  let v = new Vector();
  let v2 = new Vector();
  let v3 = new Vector();
  taskpool.execute(thread1, v);
  let task1 = new taskpool.Task(thread2, v2);
  taskpool.execute(task1);
  let taskgroup = new taskpool.TaskGroup();
  taskgroup.addTask(thread3, v3);
  taskpool.execute(taskgroup);
}