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

import { Scene, SceneConfig, SourceFilePrinter, SourceNamespacePrinter } from '../../../src';
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
namespace Validation {
  enum FileAccess {
    None = 0,
    Read = 1 << 1,
    Write = 1 << 2,
    ReadWrite = Read | Write,
    G = '123'.length,
  }
  export interface StringValidator {
    isAcceptable(s: string): boolean;
  }
  export class LettersValidator implements StringValidator {
    isAcceptable(s: string) {
      return lettersRegexp.test(s);
    }
  }
  export class ZipcodeValidator implements StringValidator {
    isAcceptable(s: string): boolean {
      return s.length === 5 && numberRegexp.test(s);
    }
  }
  function test(): void {
  }
  const lettersRegexp: RegExp = /^[A-Za-z]+$/;
  const numberRegexp: RegExp = /^[0-9]+$/;
}
namespace Shapes {
  export namespace Polygons {
    export class Circle {
    }
    export class Elliptical {
    }
  }
}
`;

const CASE2_EXPECT = `namespace Shapes {
  export namespace Polygons {
    export class Circle {
    }
    export class Elliptical {
    }
  }
}
`;

describe('SourceNamespaceTest', () => {
    let config: SceneConfig = new SceneConfig({enableLeadingComments: true});
    config.buildFromProjectDir(path.join(__dirname, '../../resources/save'));
    let scene = new Scene();
    scene.buildSceneFromProjectDir(config);
    let arkfile = scene.getFiles().find((value) => {
        return value.getName().endsWith('namespaces.ts');
    });

    it('case1: whole file', () => {
        if (!arkfile) {
            assert.isDefined(arkfile);
            return;
        }
        let printer = new SourceFilePrinter(arkfile);
        let source = printer.dump();
        expect(source).eq(CASE1_EXPECT);
    });

    it('case2: namespace export', () => {
        let ns = arkfile?.getNamespaceWithName('Shapes');
        if (!ns) {
            assert.isDefined(ns);
            return;
        }
        let printer = new SourceNamespacePrinter(ns);
        let source = printer.dump();
        expect(source).eq(CASE2_EXPECT);
    });
});
