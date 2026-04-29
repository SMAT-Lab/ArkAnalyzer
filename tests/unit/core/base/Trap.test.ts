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

import { describe, expect, it } from 'vitest';
// Import via the barrel first so the Stmt/Cfg init order is resolved before Trap.
import { BasicBlock } from '../../../../src';
import { Trap } from '../../../../src/core/base/Trap';

describe('Trap Test', () => {
    it('exposes the try and catch blocks passed at construction', () => {
        const tryBlocks = [new BasicBlock(1), new BasicBlock(2)];
        const catchBlocks = [new BasicBlock(3)];
        const trap = new Trap(tryBlocks, catchBlocks);

        expect(trap.getTryBlocks()).toBe(tryBlocks);
        expect(trap.getCatchBlocks()).toBe(catchBlocks);
        expect(trap.getTryBlocks().length).toBe(2);
        expect(trap.getCatchBlocks().length).toBe(1);
    });

    it('accepts empty try/catch arrays', () => {
        const trap = new Trap([], []);
        expect(trap.getTryBlocks()).toEqual([]);
        expect(trap.getCatchBlocks()).toEqual([]);
    });

    it('preserves array element identity and order', () => {
        const b1 = new BasicBlock(1);
        const b2 = new BasicBlock(2);
        const b3 = new BasicBlock(3);
        const c1 = new BasicBlock(4);

        const trap = new Trap([b1, b2, b3], [c1]);

        const tries = trap.getTryBlocks();
        expect(tries[0]).toBe(b1);
        expect(tries[1]).toBe(b2);
        expect(tries[2]).toBe(b3);
        expect(trap.getCatchBlocks()[0]).toBe(c1);
    });

    it('different Trap instances hold independent arrays', () => {
        const a = new Trap([new BasicBlock(1)], [new BasicBlock(2)]);
        const b = new Trap([new BasicBlock(3)], [new BasicBlock(4)]);

        expect(a.getTryBlocks()).not.toBe(b.getTryBlocks());
        expect(a.getCatchBlocks()).not.toBe(b.getCatchBlocks());
        expect(a.getTryBlocks().length).toBe(1);
        expect(b.getTryBlocks().length).toBe(1);
    });

    it('getters always return the same reference across calls', () => {
        const tryBlocks = [new BasicBlock(1)];
        const catchBlocks = [new BasicBlock(2)];
        const trap = new Trap(tryBlocks, catchBlocks);

        expect(trap.getTryBlocks()).toBe(trap.getTryBlocks());
        expect(trap.getCatchBlocks()).toBe(trap.getCatchBlocks());
    });

    it('mutations to the backing array are visible via the getter (by reference)', () => {
        // Documents the current shallow-reference contract: callers passing an
        // external array observe subsequent mutations through the getter.
        const tryBlocks = [new BasicBlock(1)];
        const catchBlocks: BasicBlock[] = [];
        const trap = new Trap(tryBlocks, catchBlocks);

        tryBlocks.push(new BasicBlock(2));
        catchBlocks.push(new BasicBlock(3));

        expect(trap.getTryBlocks().length).toBe(2);
        expect(trap.getCatchBlocks().length).toBe(1);
    });
});
