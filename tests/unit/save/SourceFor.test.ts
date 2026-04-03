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

import { PrinterBuilder, Scene, SceneConfig, SourceFilePrinter } from '../../../src';
import { describe, expect, it } from 'vitest';
import path from 'path';

const CASE1_EXPECT = `/*
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
let someArray: (number | string | boolean)[] = [1, 'string', false];
for (let entry of someArray) {
  console.info(entry);
}
let list: number[] = [4, 5, 6];
for (let i of list) {
  console.info(i);
}
for (let i of list) {
  console.info(i);
}
list.forEach((i: any): void => {
  console.info(i);
});
let i: number = 0;
for (; i < list.length; i = i + 1) {
  if (i == 0) {
    console.log('continue');
  } else {
    if (i == 2) {
      console.log('break');
      break;
    }
    console.info(list[i]);
  }
}
let pets = new Set(['Cat', 'Dog', 'Hamster']);
for (let pet of pets) {
  console.info(pet);
}
for (let pet of pets) {
  console.info(pet);
}
let i: number = 0;
do {
  if (i == 0) {
    continue;
  }
  if (i == 2) {
    break;
  }
  console.info(list[i]);
} while (i++ < list.length)
i = list.length;
while (i-- < list.length) {
  if (i == 0) {
    continue;
  }
  if (i == 2) {
    break;
  }
  console.info(list[i]);
}
i = list.length;
while (--i < list.length) {
  if (i == 0) {
    continue;
  }
  if (i == 2) {
    break;
  }
  console.info(list[i]);
}
`;

describe('SourceForTest', () => {
  let config: SceneConfig = new SceneConfig({ enableLeadingComments: true });
  config.buildFromProjectDir(path.join(__dirname, '../../resources/save'));
  let scene = new Scene();
  scene.buildSceneFromProjectDir(config);
  let arkfile = scene.getFiles().find((value) => {
    return value.getName().endsWith('iterators-and-generators.ts');
  });

  it('case1: whole file', () => {
    if (!arkfile) {
      return;
    }
    let dot = new PrinterBuilder('output');
    dot.dumpToDot(arkfile);

    let printer = new SourceFilePrinter(arkfile);
    let source = printer.dump();
    expect(source).eq(CASE1_EXPECT);
  });
});
