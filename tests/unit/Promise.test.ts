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

import { describe, expect, it } from 'vitest';
import path from 'path';
import { SceneConfig } from '../../src/Config';
import { Scene } from '../../src/Scene';
import { ClassType } from '../../src';

describe('Promise Test', () => {
    it('Promise case', () => {//await media.createAVPlayer().then((player) => {}); 目的是将createAVPlayer()返回的Promise<AVPlayer>类型解析出来，AVPlayer类型传递给player
        let config: SceneConfig = new SceneConfig();
        config.buildFromProjectDir(path.join(__dirname, '../resources/Promise'));
        config.getSdksObj().push({ moduleName: '', name: 'es2015', path: path.join(__dirname, '../resources/Sdk') });
        let projectScene: Scene = new Scene();
        projectScene.buildSceneFromProjectDir(config);
        projectScene.inferTypes();

        const arkMethods = projectScene.getClasses()[0].getMethods();
        arkMethods?.forEach(arkMethod => {
            if (arkMethod.getName() === 'test2') {
                const blocks = arkMethod.getCfg()?.getBlocks();
                if (blocks) {
                    for (const block of blocks) {
                        const returnType = block.getStmts()[1].getInvokeExpr()?.getMethodSignature().getMethodSubSignature().getReturnType();
                        if (returnType instanceof ClassType) {
                            expect(returnType.getClassSignature().getType().toString()).toEqual('@es2015/api/@internal/Promise.d.ts: Promise');
                        }
                    }
                }
            }
            if (arkMethod.getName() === '%AM1$test2') {
                const expectInfo = arkMethod.getSignature().getMethodSubSignature().getParameters()[0].getType().toString();
                expect(expectInfo).toEqual('@es2015/api/@ohos.multimedia.media.d.ts: media.AVPlayer');
            }
        });
    });
});
