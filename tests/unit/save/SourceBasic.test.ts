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

import { DEFAULT_ARK_METHOD_NAME, Scene, SceneConfig, SourceClassPrinter, SourceMethodPrinter } from '../../../src';
import { assert, describe, expect, it } from 'vitest';
import path from 'path';

const SourceBasicTest_CASE1_EXPECT = `class Person {
  x: number = 0;
  public age: number;
  constructor(age: number) {
    this.age = age;
    return this;
  }
  growOld: () => void  = (): void => {
    this.age = this.age + 1;
  };
  public getAge() {
    return this.age;
  }
  static wooooof(): void {
    logger.info('not a person sound');
  }
}
`;

const SourceBasicTest_CASE2_EXPECT = `export class SecurityDoor extends Door implements Alarm, Alarm2 {
  x: number = 0;
  y: string = '';
  z: Person = new Person(10);
  alert(): void {
    logger.info('SecurityDoor alert');
  }
  alert2(): void {
    logger.info('SecurityDoor alert2');
  }
  public Members: Object = class  {
  };
  public fooo(): void {
    logger.info('This is fooo!');
  }
  constructor(x: number, y: string) {
    super();
    this.x = x;
    this.y = y;
    logger.info('This is a constrctor!');
    return this;
  }
}
`;

const SourceBasicTest_CASE3_EXPECT = `export function listParameters(u: number, v: number, w: string): {x: number, y: number, z: string} {
  return {x: u, y: v, z: w};
}
`;

const SourceBasicTest_CASE4_EXPECT = `configure({appenders: {console: {type: 'console', layout: {type: 'pattern', pattern: '[%d] [%p] [%z] [ArkAnalyzer] - %m'}}}, categories: {default: {appenders: ['console'], level: 'info', enableCallStack: false}}});
const logger = getLogger();
const someClass = class <Type> {
  content: Type;
  constructor(value: Type) {
    this.content = value;
    return this;
  }
};
const m: someClass = new someClass('Hello, world');
const iterator = await yieldTest();
export let x = 1;
export const soo = 123;
forLoopTest();
controlTest();
deleteTest();
`;

const SourceBasicTest_CASE5_EXPECT = `class ExtendedAdder extends Adder {
  // Create a copy of parent before creating our own
  private superAdd = this.add;
  // Now create our override
  add: (b: string) => string  = (b: string): string => {
    return this.superAdd(b);
  };
}
`;

const SourceBasicTest_CASE6_EXPECT = `async function * yieldTest() {
  yield 1;
  yield 2;
  yield 3;
}
`;

const SourceBasicTest_CASE7_EXPECT = `function dealColor(rRGB: number, gRGB: number, bRGB: number): void {
  let max = Math.max(Math.max(rRGB, gRGB), bRGB);
  let min = Math.min(Math.min(rRGB, gRGB), bRGB);
  let bHSB: number = max / 255;
  let hHSB: number = 0;
  if (max === rRGB && gRGB >= bRGB != 0) {
    hHSB = (60 * (gRGB - bRGB)) / (max - min) + 0;
  }
  if (max === rRGB && gRGB < bRGB != 0) {
    hHSB = (60 * (gRGB - bRGB)) / (max - min) + 360;
  }
  if (max === gRGB) {
    hHSB = (60 * (bRGB - rRGB)) / (max - min) + 120;
  }
  if (max === bRGB) {
    hHSB = (60 * (rRGB - gRGB)) / (max - min) + 240;
  }
  if (bHSB >= 0.4) {
    bHSB = 0.3;
  } else {
    if (bHSB >= 0.2) {
      bHSB = bHSB - 0.1;
    } else {
      bHSB = bHSB + 0.2;
    }
  }
}
`;

const SourceBasicTest_CASE8_EXPECT = `function specialString(text: string): void {
  const lrcLineRegex: RegExp = new RegExp('\\\\[\\\\d{2,}:\\\\d{2}((\\\\.|:)\\\\d{2,})\\\\]', 'g');
  const lrcTimeRegex1: RegExp = new RegExp('\\\\[\\\\d{2,}', 'i');
  const lrcTimeRegex2: RegExp = new RegExp('\\\\d{2}\\\\.\\\\d{2,}', 'i');
  let lyric: string[] = text.split('\\n');
}
`;

const SourceBasicTest_CASE9_EXPECT = `function dotDotDotTokenTest(...args: string[]): void {
}
`;

const SourceBasicTest_CASE10_EXPECT = `function controlTest(): void {
  const sampleData: number[] = [1, 2, 3, 4, 5];
  let i: number = 0;
  for (; i < sampleData.length; i = i + 1) {
    // 使用 if 判断
    if (sampleData[i] % 2 === 0) {
      logger.info(sampleData[i].toString() + ' 是偶数');
    } else {
      logger.info(sampleData[i].toString() + ' 是奇数');
    }
    // 使用 while 循环
    let count: number = 0;
    while (count < sampleData[i]) {
      logger.info('当前计数: ' + count.toString());
      count = count + 1;
    }
    // 使用 for 循环和 continue
    let j: number = 0;
    for (; j < 5; j = j + 1) {
      if (j === 2) {
        continue;
      }
      logger.info('当前内层循环计数: ' + j.toString());
    }
    // 使用 break 终止循环
    let k: number = 0;
    for (; k < 3; k = k + 1) {
      logger.info('外层循环计数: ' + k.toString());
      logger.info('Department name: ' + k);
      if (k === 1) {
        break;
      }
    }
  }
}
`;

describe('SourceBasicTest', () => {
    let config: SceneConfig = new SceneConfig({enableLeadingComments: true});
    config.buildFromProjectDir(path.join(__dirname, '../../resources/save'));
    let scene = new Scene();
    scene.buildSceneFromProjectDir(config);

    let arkfile = scene.getFiles().find((value) => {
        return value.getName().endsWith('basic.ts');
    });

    let defaultClass = arkfile?.getClasses().find((value) => {
        return value.isDefaultArkClass();
    });

    it('case1: class-field-init-function-ref', () => {
        let cls = arkfile?.getClassWithName('Person');
        if (!cls) {
            assert.isDefined(cls);
            return;
        }

        let printer = new SourceClassPrinter(cls);
        let source = printer.dump();
        expect(source).eq(SourceBasicTest_CASE1_EXPECT);
    });

    it('case2: class-field-init-super-wrong', () => {
        let cls = arkfile?.getClassWithName('SecurityDoor');
        if (!cls) {
            assert.isDefined(cls);
            return;
        }

        let printer = new SourceClassPrinter(cls);
        let source = printer.dump();
        expect(source).eq(SourceBasicTest_CASE2_EXPECT);
    });

    it('case3: function-object-return', () => {
        let method = defaultClass?.getMethodWithName('listParameters');
        if (!method) {
            assert.isDefined(method);
            return;
        }

        let printer = new SourceMethodPrinter(method);
        let source = printer.dump();
        expect(source).eq(SourceBasicTest_CASE3_EXPECT);
    });

    it('case4: default method', () => {
        let method = defaultClass?.getMethodWithName(DEFAULT_ARK_METHOD_NAME);
        if (!method) {
            assert.isDefined(method);
            return;
        }

        let printer = new SourceMethodPrinter(method);
        let source = printer.dump();
        expect(source).eq(SourceBasicTest_CASE4_EXPECT);
    });

    // error
    it('case5: class field init', () => {
        let cls = arkfile?.getClassWithName('ExtendedAdder');
        if (!cls) {
            assert.isDefined(cls);
            return;
        }

        let printer = new SourceClassPrinter(cls);
        let source = printer.dump();
        expect(source).eq(SourceBasicTest_CASE5_EXPECT);
    });

    it('case6: yield test', () => {
        let method = defaultClass?.getMethodWithName('yieldTest');
        if (!method) {
            assert.isDefined(method);
            return;
        }

        let printer = new SourceMethodPrinter(method);
        let source = printer.dump();
        expect(source).eq(SourceBasicTest_CASE6_EXPECT);
    });

    it('case7: operator test', () => {
        let method = defaultClass?.getMethodWithName('dealColor');
        if (!method) {
            assert.isDefined(method);
            return;
        }

        let printer = new SourceMethodPrinter(method);
        let source = printer.dump();
        expect(source).eq(SourceBasicTest_CASE7_EXPECT);
    });

    it('case8: specialString test', () => {
        let method = defaultClass?.getMethodWithName('specialString');
        if (!method) {
            assert.isDefined(method);
            return;
        }

        let printer = new SourceMethodPrinter(method);
        let source = printer.dump();
        expect(source).eq(SourceBasicTest_CASE8_EXPECT);
    });

    it('case9: debug test', () => {
        let method = defaultClass?.getMethodWithName('dotDotDotTokenTest');
        if (!method) {
            assert.isDefined(method);
            return;
        }

        let printer = new SourceMethodPrinter(method);
        let source = printer.dump();
        expect(source).eq(SourceBasicTest_CASE9_EXPECT);
    });

    it('case10: controlTest', () => {
      let method = defaultClass?.getMethodWithName('controlTest');
      if (!method) {
          assert.isDefined(method);
          return;
      }

      let printer = new SourceMethodPrinter(method);
      let source = printer.dump();
      expect(source).eq(SourceBasicTest_CASE10_EXPECT);
    });
});
