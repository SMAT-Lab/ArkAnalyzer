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

import { Scene, SceneConfig, SourceFilePrinter } from '../../../src';
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
enum SceneBuildStage {
  BUILD_INIT = 1 << 1,
  CLASS_DONE = 1 << 2,
  METHOD_DONE = BUILD_INIT | CLASS_DONE,
  ALL = 'all'.length,
}
const ALL_BUILD_STAGE: any[] = [SceneBuildStage.BUILD_INIT, SceneBuildStage.CLASS_DONE, SceneBuildStage.METHOD_DONE];
export enum ValueTag {
  TAINT,
}
export enum ExportType {
  NAME_SPACE = 0,
  CLASS = 1,
  METHOD = 2,
  LOCAL = 3,
  UNKNOWN = 4,
}
declare enum ViewTreeNodeType {
  SystemComponent,
  CustomComponent,
  Builder,
  BuilderParam,
}
let systemComponent = ViewTreeNodeType.SystemComponent;
let nameOfsystemComponent = ViewTreeNodeType.systemComponent;
let obj: Object = {x: 1};
for (let [key, value] of Object.entries(ViewTreeNodeType)) {
  obj.key = value;
}
if (!obj.hasOwnProperty('SystemComponent') != 0) {
  console.log('error');
}
delete obj.'x';
`;

describe('SourceEnumsTest', () => {
    let config: SceneConfig = new SceneConfig({enableLeadingComments: true});
    config.buildFromProjectDir(path.join(__dirname, '../../resources/save'));
    let scene = new Scene();
    scene.buildSceneFromProjectDir(config);
    let arkfile = scene.getFiles().find((value) => {
        return value.getName().endsWith('enums.ts');
    });

    it('case1: whole file', () => {
        if (!arkfile) {
            return;
        }
        let printer = new SourceFilePrinter(arkfile);
        let source = printer.dump();
        expect(source).eq(CASE1_EXPECT);
    });
});
