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

import { Scene, SceneConfig, SourceClassPrinter, SourceFilePrinter } from '../../../src';
import { assert, describe, expect, it } from 'vitest';
import path from 'path';

const SourceClassesTest_CASE1_EXPECT = `/*
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
const TAG: string = 'ClassTest';
class Animal {
  protected _name: string | undefined;
  public constructor(theName: string) {
    this._name = theName;
    return this;
  }
  public move(distanceInMeters: number): void {
    logger.info(this._name.toString() + ' moved ' + distanceInMeters.toString() + 'm.');
  }
  get name(): string | undefined {
    return this._name;
  }
  set name(newName: string | undefined): void {
    this._name = newName;
  }
  public print(a: Animal[]): number | null {
    return 0;
  }
  public testArrayReturn(): string[] {
    return [];
  }
}
class Snake extends Animal {
  constructor(name: string) {
    super(name);
    return this;
  }
  move(distanceInMeters: any): void {
    logger.info('Slithering...');
    super.move(distanceInMeters);
  }
}
class Horse extends Animal {
  constructor(name: string) {
    super(name);
    return this;
  }
  move(distanceInMeters: any): void {
    logger.info('Galloping...');
    super.move(distanceInMeters);
  }
}
export interface StringValidator {
  isAcceptable(s?: string): boolean;
}
export const numberRegexp = /^[0-9]+$/;
export default class ZipCodeValidator implements StringValidator {
  isAcceptable(s?: string): boolean {
    return s.length === 5 && numberRegexp.test(s);
  }
}
export {ZipCodeValidator};
export {ZipCodeValidator as mainValidator};
export class ParseIntBasedZipCodeValidator {
  isAcceptable(s: string): boolean {
    return s.length === 5 && parseInt(s).toString() === s;
  }
}
class ObjectLiteralTest {
  public test: Object = {x: 'n', child: [{x: 'c', child: []}]};
}
let formData = {isPlay: false, '1': 1};
`;
const SourceClassesTest_CASE2_EXPECT = `class ObjectLiteralTest {
  public test: Object = {x: 'n', child: [{x: 'c', child: []}]};
}
`;
const SourceClassesTest_CASE3_EXPECT = `class User extends Account implements Updatable, Serializable {
  displayName?: boolean;
  name!: string;
  private attributes: Map<any, any>;
  roles: string[] = ['user'];
  selectIndex: number = 0;
  role: string = this.roles[this.selectIndex];
  readonly createdAt: Date = new Date();
  constructor(id: string, name: string) {
    super(id);
    this.name = name;
    return this;
  }
  setName(name: string): void {
    this.name = name;
  }
  verifyName: (name: string) => void  = (name: string): void => {
  };
  sync(cb: (result: string) => void ): void {
  }
  get accountID(): string {
    return this.id;
  }
  set accountID(value: string): void {
    this.id = value;
  }
  private makeRequest(): void {
  }
  protected handleRequest(): void {
  }
  private static userCount: number = 0;
  static registerUser(user: User): void {
  }
}
`;

// TODO: index not support
const SourceClassesTest_CASE4_EXPECT = `/*
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
// Common Syntax
interface Updatable {
  [key: string]: number;
}
`;

describe('SourceClassesTest', () => {
    let config: SceneConfig = new SceneConfig({enableLeadingComments: true});
    config.buildFromProjectDir(path.join(__dirname, '../../resources/save'));
    let scene = new Scene();
    scene.buildSceneFromProjectDir(config);
    scene.inferTypes();

    it('case1: whole file', () => {
        let arkfile = scene.getFiles().find((value) => {
            return value.getName() == 'classes.ets';
        });
        if (!arkfile) {
            return;
        }
        let printer = new SourceFilePrinter(arkfile);
        let source = printer.dump();
        expect(source).eq(SourceClassesTest_CASE1_EXPECT);
    });

    it('case2: ObjectLiteralTest', () => {
        let arkfile = scene.getFiles().find((value) => {
            return value.getName() == 'classes.ets';
        });
        let cls = arkfile?.getClassWithName('ObjectLiteralTest');
        if (!cls) {
            assert.isDefined(cls);
            return;
        }
        let printer = new SourceClassPrinter(cls);
        let source = printer.dump();
        expect(source).eq(SourceClassesTest_CASE2_EXPECT);
    });

    it('case3: cheat sheet common yyntax test', () => {
        let arkfile2 = scene.getFiles().find((value) => {
            return value.getName() == 'cheat_sheet_classes.ts';
        });
        let cls = arkfile2?.getClassWithName('User');
        if (!cls) {
            assert.isDefined(cls);
            return;
        }
        let printer = new SourceClassPrinter(cls);
        let source = printer.dump();
        expect(source).eq(SourceClassesTest_CASE3_EXPECT);
    });

    it('case4: index field test', () => {
      let arkfile2 = scene.getFiles().find((value) => {
        return value.getName() == 'cheat_sheet_classes.ts';
      });
      let cls = arkfile2?.getClassWithName('Updatable');
      if (!cls) {
        assert.isDefined(cls);
        return;
      }
      let printer = new SourceClassPrinter(cls);
      let source = printer.dump();
      expect(source).eq(SourceClassesTest_CASE4_EXPECT);
    })
});
