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

import path from 'path';
import { execFileSync } from 'child_process';
import { assert, describe, it } from 'vitest';
import { resolveMethodRef } from '../../../src/cli/commands/cg';
import { buildScene } from '../common';

describe('callReachability', () => {
    const projectDir = './tests/resources/callgraph/cha_rta_test';

    it('resolveMethodRef accepts ClassName.methodName when unique', () => {
        const scene = buildScene(projectDir);
        const m = resolveMethodRef(scene, 'Dog.sound');
        assert(m);
        assert(m.getName() === 'sound');
        assert(m.getDeclaringArkClass().getName() === 'Dog');
    });

    it('supports reachability query via cli cg command', () => {
        const cliPath = path.resolve('src/cli/cli.ts');
        const output = execFileSync(
            'node',
            ['-r', 'ts-node/register', cliPath, 'cg', projectDir, '-a', 'rta', '-f', 'json', '--edges', 'all', '-r', 'Dog.sound'],
            { encoding: 'utf8' }
        ).trim();

        const jsonLine = output.split('\n').find((line) => line.startsWith('{'));
        assert(jsonLine, 'CLI should output a JSON line');
        const result = JSON.parse(jsonLine as string) as {
            algorithmUsed: string;
            direction: string;
            reachableFrom: string[];
            reachable: string[];
            edgeCount: number;
        };

        assert.equal(result.algorithmUsed, 'rta');
        assert.equal(result.direction, 'forward');
        assert.isTrue(result.reachableFrom.some((method) => method.includes('Dog.sound()')));
        assert.isTrue(result.reachable.some((method) => method.includes('Cat.sound()')));
        assert.isTrue(result.edgeCount > 0);
    });
});
