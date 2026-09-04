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

// 弱注册表语义测试（替换原 refcount 模型用例）：
// register 同实例复用 ID / 异实例新 ID；无 release——GC 驱动收敛，
// size() 为主动清扫后的精确存活量；持有者（本测试的局部变量）锚定即存活。
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
        expect(c.size()).toBe(1);
        expect(c.totalRegistered()).toBe(1);
    });

    it('size counts live (anchored) signatures after sweep', () => {
        const c = new TempSignatureCanonicalizer<TestSig>();
        expect(c.size()).toBe(0);
        const sig1 = makeSig('a');
        const sig2 = makeSig('b');
        c.register(sig1);
        c.register(sig2);
        // 两个实例均被局部变量锚定（存活），同值异实例各计 1。
        expect(c.size()).toBe(2);
    });

    it('size does not count dead slots (dropped instances swept away)', () => {
        const c = new TempSignatureCanonicalizer<TestSig>();
        // 注册后丢弃唯一持有者——实例不可达。不依赖显式 gc()：通过FinalizationRegistry
        // 不可行（异步），此处用"丢弃 + 重新注册新实例不复活旧槽"验证语义即可；
        // GC 驱动的死槽清扫为非确定性行为，不在断言范围（见弱注册表设计注释）。
        c.register(makeSig('dropped'));
        const kept = makeSig('kept');
        const keptId = c.register(kept);
        expect(c.get(keptId)).toBe(kept);
        expect(c.totalRegistered()).toBe(2);
    });

    it('get returns the signature object by ID while anchored', () => {
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
        expect(c.size()).toBe(1);
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
        expect(c.size()).toBe(2);
    });

    it('getStats reports live/total/dead consistently', () => {
        const c = new TempSignatureCanonicalizer<TestSig>();
        expect(c.getStats()).toEqual({ liveCount: 0, totalRegistered: 0, deadSlots: 0 });
        const sig1 = makeSig('a');
        const sig2 = makeSig('b');
        c.register(sig1);
        c.register(sig2);
        // 两实例均存活（被局部变量锚定）：live=2、total=2、dead=0。
        // 注：测试作用域内实例可达即存活——GC 是否已运行不影响（未回收的 WeakRef
        // deref 非空）；deadSlots 仅在实例被回收后才可能大于 0（非确定性，不硬断言）。
        const stats = c.getStats();
        expect(stats.liveCount).toBe(2);
        expect(stats.totalRegistered).toBe(2);
        expect(stats.deadSlots).toBe(0);
    });

    it('clear resets the registry and strips symbol ids from live objects', () => {
        const c = new TempSignatureCanonicalizer<TestSig>();
        const sigA = makeSig('a');
        const sigB = makeSig('b');
        const idA = c.register(sigA);
        c.register(sigB);
        expect(c.size()).toBe(2);
        c.clear();
        expect(c.size()).toBe(0);
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
});
