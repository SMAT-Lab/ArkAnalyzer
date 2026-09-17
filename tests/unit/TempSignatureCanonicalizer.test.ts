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
import { TempSignatureCanonicalizer } from '../../src/core/common/TempSignatureCanonicalizer';

interface TestSig {
    name: string;
    toMapKey(): string;
}

function makeSig(name: string): TestSig {
    return { name, toMapKey: () => name };
}

// 三版索引表语义测试（替换二版弱表用例）：
// register 同实例复用 ID / 异实例新 ID；slot 强持有（全保留）；retire 显式迁移置空
// + temp→formal 替换记录；三数自洽 totalRegistered = liveCount + retiredCount。
describe('TempSignatureCanonicalizer Test', () => {
    it('register assigns different IDs for different object instances with same value', () => {
        const c = new TempSignatureCanonicalizer<TestSig>();
        const sig1 = makeSig('foo');
        const sig2 = makeSig('foo');
        const id1 = c.register(sig1);
        const id2 = c.register(sig2);
        expect(id1).not.toBe(id2);
    });

    it('register assigns different IDs for different values', () => {
        const c = new TempSignatureCanonicalizer<TestSig>();
        expect(c.register(makeSig('foo'))).toBe(0);
        expect(c.register(makeSig('bar'))).toBe(1);
    });

    it('register returns the same ID for the same object instance (repeated register is idempotent)', () => {
        const c = new TempSignatureCanonicalizer<TestSig>();
        const sig = makeSig('foo');
        const id1 = c.register(sig);
        const id2 = c.register(sig);
        const id3 = c.register(sig);
        expect(id1).toBe(id2);
        expect(id2).toBe(id3);
        // 幂等：不产生新条目。
        expect(c.liveCount()).toBe(1);
        expect(c.totalRegistered()).toBe(1);
    });

    it('size counts non-retired slots (strongly held by the index table)', () => {
        const c = new TempSignatureCanonicalizer<TestSig>();
        expect(c.liveCount()).toBe(0);
        const sig1 = makeSig('a');
        const sig2 = makeSig('b');
        c.register(sig1);
        c.register(sig2);
        // slot 强持有（全保留语义）：注册即计数，与持有者存亡无关。
        expect(c.liveCount()).toBe(2);
    });

    it('get returns the signature object by ID while the slot is live', () => {
        const c = new TempSignatureCanonicalizer<TestSig>();
        const sig = makeSig('foo');
        const id = c.register(sig);
        expect(c.get(id)).toBe(sig);
    });

    it('get returns undefined for out-of-bounds IDs', () => {
        const c = new TempSignatureCanonicalizer<TestSig>();
        expect(c.get(0)).toBeUndefined();
        expect(c.get(-1)).toBeUndefined();
    });

    it('getExistingTempId queries without registering', () => {
        const c = new TempSignatureCanonicalizer<TestSig>();
        const sig = makeSig('foo');
        expect(c.getExistingTempId(sig)).toBe(-1);
        const id = c.register(sig);
        expect(c.getExistingTempId(sig)).toBe(id);
        // 查询不改变计数。
        expect(c.liveCount()).toBe(1);
        expect(c.totalRegistered()).toBe(1);
    });

    it('multiple distinct instances with same value: independent IDs and retrieval', () => {
        const c = new TempSignatureCanonicalizer<TestSig>();
        const sig1 = makeSig('F');
        const sig2 = makeSig('F');
        const id1 = c.register(sig1);
        const id2 = c.register(sig2);
        expect(id1).not.toBe(id2);
        expect(c.get(id1)).toBe(sig1);
        expect(c.get(id2)).toBe(sig2);
        expect(c.liveCount()).toBe(2);
    });

    it('getStats reports live/total/retired with the three-number invariant', () => {
        const c = new TempSignatureCanonicalizer<TestSig>();
        expect(c.getStats()).toEqual({ liveCount: 0, totalRegistered: 0, retiredCount: 0, replacedCount: 0 });
        c.register(makeSig('a'));
        c.register(makeSig('b'));
        const stats = c.getStats();
        expect(stats.liveCount).toBe(2);
        expect(stats.totalRegistered).toBe(2);
        expect(stats.retiredCount).toBe(0);
        // 三数自洽：total = live + retired。
        expect(stats.totalRegistered).toBe(stats.liveCount + stats.retiredCount);
    });

    it('clear resets the registry and strips symbol ids from live objects', () => {
        const c = new TempSignatureCanonicalizer<TestSig>();
        const sigA = makeSig('a');
        const sigB = makeSig('b');
        const idA = c.register(sigA);
        c.register(sigB);
        expect(c.liveCount()).toBe(2);
        c.clear();
        expect(c.liveCount()).toBe(0);
        expect(c.totalRegistered()).toBe(0);
        expect(c.get(idA)).toBeUndefined();
        // 活对象的 symbol 已被摘除：clear 后重新注册视为新实例（ID 从 0 重分配）。
        expect(c.getExistingTempId(sigA)).toBe(-1);
        expect(c.register(sigA)).toBe(0);
    });

    it('after clear, IDs are reallocated from 0', () => {
        const c = new TempSignatureCanonicalizer<TestSig>();
        c.register(makeSig('a'));
        c.register(makeSig('b'));
        c.clear();
        expect(c.register(makeSig('c'))).toBe(0);
    });

    it('registeredIds is the full audit view; liveIds is the non-retired view', () => {
        const c = new TempSignatureCanonicalizer<TestSig>();
        expect(c.registeredIds()).toEqual([]);
        const sig1 = makeSig('a');
        const sig2 = makeSig('b');
        c.register(sig1);
        c.register(sig2);
        expect(c.registeredIds()).toEqual([0, 1]);
        expect(c.liveIds()).toEqual([0, 1]);
        // retire 后：审计视图仍含全部 ID（可追溯），遗留视图收敛。
        c.retire(0);
        expect(c.registeredIds()).toEqual([0, 1]);
        expect(c.liveIds()).toEqual([1]);
        expect(c.liveCount()).toBe(1);
    });

    // --- 三版（索引表）核心语义：retire / 替换记录 / 幂等 ---

    it('retire blanks the slot idempotently and maintains the counters', () => {
        const c = new TempSignatureCanonicalizer<TestSig>();
        const sig = makeSig('a');
        const id = c.register(sig);
        expect(c.retire(id)).toBeUndefined();
        expect(c.get(id)).toBeUndefined();
        expect(c.liveCount()).toBe(0);
        expect(c.retired()).toBe(1);
        expect(c.totalRegistered()).toBe(1);
        // 幂等：重复 retire 不再计数。
        c.retire(id);
        expect(c.retired()).toBe(1);
        expect(c.liveCount()).toBe(0);
        // 三数自洽保持。
        const st = c.getStats();
        expect(st.totalRegistered).toBe(st.liveCount + st.retiredCount);
    });

    it('retireWithReplacement records the formal destination for shared holders', () => {
        const c = new TempSignatureCanonicalizer<TestSig>();
        const sig = makeSig('shared');
        const tempId = c.register(sig);
        expect(c.getReplacement(tempId)).toBe(-1);
        c.retireWithReplacement(tempId, 88);
        // slot 置空 + 归宿可查（三级查 fallback："下一处直接使用 formal ID"）。
        expect(c.get(tempId)).toBeUndefined();
        expect(c.getReplacement(tempId)).toBe(88);
        // 重复调用以首次记录为准（幂等）。
        c.retireWithReplacement(tempId, 99);
        expect(c.getReplacement(tempId)).toBe(88);
        const st = c.getStats();
        expect(st.retiredCount).toBe(1);
        expect(st.replacedCount).toBe(1);
    });

    it('retired instance re-register returns the original ID (symbol survives retire)', () => {
        const c = new TempSignatureCanonicalizer<TestSig>();
        const sig = makeSig('revive-path');
        const id = c.register(sig);
        c.retireWithReplacement(id, 7);
        // symbol 在 retire 后保留：同实例再次 register 返回原 ID——消费方经
        // getReplacement 直达 formal（不复活 slot）。
        expect(c.register(sig)).toBe(id);
        expect(c.get(id)).toBeUndefined();
        expect(c.getReplacement(id)).toBe(7);
        // 计数不因重复 register 变化。
        expect(c.totalRegistered()).toBe(1);
        expect(c.liveCount() + c.retired()).toBe(1);
    });

    it('clear wipes the replacement records', () => {
        const c = new TempSignatureCanonicalizer<TestSig>();
        const id = c.register(makeSig('a'));
        c.retireWithReplacement(id, 42);
        expect(c.getReplacement(id)).toBe(42);
        c.clear();
        expect(c.getReplacement(id)).toBe(-1);
        expect(c.retired()).toBe(0);
        expect(c.getStats()).toEqual({ liveCount: 0, totalRegistered: 0, retiredCount: 0, replacedCount: 0 });
    });
});
