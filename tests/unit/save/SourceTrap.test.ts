/*
 * Copyright (c) 2024-2025 Huawei Device Co., Ltd.
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

import { PrinterBuilder, Scene, SceneConfig, SourceMethodPrinter } from '../../../src';
import { assert, describe, expect, it } from 'vitest';
import path from 'path';

const CASE1_EXPECT = `/*
 * Copyright (c) 2024-2025 Huawei Device Co., Ltd.
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
function case1(): void {
  try {
    console.log('try');
  } catch (e) {
    console.log('catch');
  } finally {
    console.log('finally');
  }
}
`;

const CASE2_EXPECT = `function case2(): void {
  try {
    console.log('try');
  } catch (e) {
    console.log('catch');
  }
}
`;

const CASE3_EXPECT = `function case3(): void {
  try {
    console.log('try');
  } finally {
    console.log('finally');
  }
}
`;

const CASE4_EXPECT = `function case4(): void {
  try {
    console.log('try');
    if (0 != 0) {
      console.log(1);
    } else {
      console.log(2);
    }
    console.log(3);
  } catch (e) {
    console.log('catch');
    if (4 != 0) {
      console.log(5);
    } else {
      console.log(6);
    }
    console.log(7);
  } finally {
    console.log('finally');
    if (8 != 0) {
      console.log(9);
    } else {
      console.log(10);
    }
    console.log(11);
  }
}
`;

const CASE5_EXPECT = `function case5(): void {
  let i: number = 0;
  try {
    console.log('try');
  } catch (e) {
    console.log('catch');
  } finally {
    console.log('finally');
  }
  console.log(i);
}
`;

const CASE6_EXPECT = `function case6(): void {
  let i: number = 0;
  try {
    console.log('try');
    try {
      console.log('inner try');
    } catch (innerE) {
      console.log('inner catch');
    } finally {
      console.log('inner finally');
    }
  } catch (e) {
    console.log('catch');
  } finally {
    console.log('finally');
  }
  console.log(i);
}
`;

describe('SourceTrapTest', () => {
    let config: SceneConfig = new SceneConfig({ enableLeadingComments: true });
    config.buildFromProjectDir(path.join(__dirname, '../../resources/model/body/trap'));
    let scene = new Scene();
    scene.buildSceneFromProjectDir(config);
    scene.inferSimpleTypes();
    let arkfile = scene.getFiles().find((value) => {
        return value.getName().endsWith('TrapTest.ts');
    });

    if (!arkfile) {
        assert.isDefined(arkfile);
        return;
    }

    let printerDot = new PrinterBuilder('output');
    printerDot.dumpToDot(arkfile);

    let defaultClass = arkfile?.getClasses().find((value) => {
        return value.isDefaultArkClass();
    });

    it('case1: TrapTest', () => {
        let method = defaultClass?.getMethodWithName('case1');
        if (!method) {
            assert.isDefined(method);
            return;
        }

        let printer = new SourceMethodPrinter(method);
        let source = printer.dump();
        expect(source).eq(CASE1_EXPECT);
    });

    it('case2: TrapTest', () => {
        let method = defaultClass?.getMethodWithName('case2');
        if (!method) {
            assert.isDefined(method);
            return;
        }

        let printer = new SourceMethodPrinter(method);
        let source = printer.dump();
        expect(source).eq(CASE2_EXPECT);
    });

    it('case3: TrapTest', () => {
        let method = defaultClass?.getMethodWithName('case3');
        if (!method) {
            assert.isDefined(method);
            return;
        }

        let printer = new SourceMethodPrinter(method);
        let source = printer.dump();
        expect(source).eq(CASE3_EXPECT);
    });

    it('case4: TrapTest', () => {
        let method = defaultClass?.getMethodWithName('case4');
        if (!method) {
            assert.isDefined(method);
            return;
        }

        let printer = new SourceMethodPrinter(method);
        let source = printer.dump();
        expect(source).eq(CASE4_EXPECT);
    });

    it('case5: TrapTest', () => {
        let method = defaultClass?.getMethodWithName('case5');
        if (!method) {
            assert.isDefined(method);
            return;
        }

        let printer = new SourceMethodPrinter(method);
        let source = printer.dump();
        expect(source).eq(CASE5_EXPECT);
    });

    it('case6: TrapTest', () => {
        let method = defaultClass?.getMethodWithName('case6');
        if (!method) {
            assert.isDefined(method);
            return;
        }

        let printer = new SourceMethodPrinter(method);
        let source = printer.dump();
        expect(source).eq(CASE6_EXPECT);
    });
});
