/*
 * Copyright (c) 2026 Huawei Device Co., Ltd.
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

import { ModelUtils, Scene } from '../../../src';

type BodyBuilderLeak = {
    filePath: string;
    methodSignature: string;
};

function collectBodyBuilderLeaks(scene: Scene): BodyBuilderLeak[] {
    const leaks: BodyBuilderLeak[] = [];
    for (const file of scene.getFiles()) {
        for (const method of ModelUtils.getAllMethodsInFile(file)) {
            if (method.getBodyBuilder()) {
                leaks.push({
                    filePath: file.getName(),
                    methodSignature: method.getSignature().toString(),
                });
            }
        }
    }

    for (const file of scene.getSdkArkFiles()) {
        for (const method of ModelUtils.getAllMethodsInFile(file)) {
            if (method.getBodyBuilder()) {
                leaks.push({
                    filePath: file.getName(),
                    methodSignature: method.getSignature().toString(),
                });
            }
        }
    }

    return leaks;
}

export function prinLeakStats(scene: Scene): void {
    const leaks = collectBodyBuilderLeaks(scene);
    if (leaks.length === 0) {
        console.log('  No residual .bodyBuilder found.');
        return;
    }

    console.log(`  Residual .bodyBuilder count: ${leaks.length}`);
    for (const leak of leaks) {
        console.log(`  - file: ${leak.filePath}`);
        console.log(`    method: ${leak.methodSignature}`);
    }
}