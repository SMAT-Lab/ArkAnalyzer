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

import { Scene, SceneConfig, SourceClassPrinter, SourceFilePrinter } from '../../../src';
import { assert, describe, expect, it } from 'vitest';
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
function identity<T>(arg: T): T {
  return arg;
}
let myIdentity: (arg: T) => T  = identity;
// TODO: <string> lost
let output: string = identity<string>('myString');
class GenericNumber<T> {
  zeroValue: T;
  add: (x: T, y: T) => T ;
  private methods: Set<string>;
  private calls: Map<string, string[]>;
}
interface Lengthwise {
  length: number;
}
function loggingIdentity<T>(arg: T): T {
  logger.info(arg.length);
  return arg;
}
declare interface BreakPointTypeOption<T> {
  sm?: T;
  md?: T;
  lg?: T;
}
export class BreakpointType<T> {
  options: BreakPointTypeOption<T>;
  constructor(option: BreakPointTypeOption<T>) {
    this.options = option;
    return this;
  }
  getValue(currentPoint: string): T {
    if (currentPoint === 'sm') {
      return this.options.sm as T;
    }
    if (currentPoint === 'md') {
      return this.options.md as T;
    }
    return this.options.lg as T;
  }
}
`;

const CASE2_EXPECT = `class GenericNumber<T> {
  zeroValue: T;
  add: (x: T, y: T) => T ;
  private methods: Set<string>;
  private calls: Map<string, string[]>;
}
`;

describe('SourceGenericsTest', () => {
    let config: SceneConfig = new SceneConfig({enableLeadingComments: true});
    config.buildFromProjectDir(path.join(__dirname, '../../resources/save'));
    let scene = new Scene();
    scene.buildSceneFromProjectDir(config);
    scene.inferTypes();

    let arkfile = scene.getFiles().find((value) => {
        return value.getName().endsWith('generics.ts');
    });

    it('case1: whole file', () => {
        if (!arkfile) {
            return;
        }
        let printer = new SourceFilePrinter(arkfile);
        let source = printer.dump();
        expect(source).eq(CASE1_EXPECT);
    });

    it('case2: Generic Class', () => {
        let cls = arkfile?.getClassWithName('GenericNumber');
        if (!cls) {
            assert.isDefined(cls);
            return;
        }

        let printer = new SourceClassPrinter(cls);
        let source = printer.dump();
        expect(source).eq(CASE2_EXPECT);
    });
});
