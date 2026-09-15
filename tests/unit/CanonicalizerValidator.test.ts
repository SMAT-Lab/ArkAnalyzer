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
import { SignatureCanonicalizerRegistry } from '../../src/core/common/SignatureCanonicalizerRegistry';
import { CanonicalizerValidator } from '../../src/core/common/CanonicalizerValidator';
import {
    FileSignature,
    NamespaceSignature,
    ClassSignature,
    FieldSignature,
    MethodSignature,
    MethodSubSignature,
    AliasClassSignature,
    internAliasMethodSignature,
} from '../../src/core/model/ArkSignature';
import { ArkFile, Language } from '../../src/core/model/ArkFile';
import { ArkNamespace } from '../../src/core/model/ArkNamespace';
import { ArkClass } from '../../src/core/model/ArkClass';
import { ArkField } from '../../src/core/model/ArkField';
import { ArkMethod } from '../../src/core/model/ArkMethod';
import { MethodParameter } from '../../src/core/model/builder/ArkMethodBuilder';
import { ClassType, NumberType } from '../../src/core/base/Type';
import { SceneConfig } from '../../src/Config';

describe('CanonicalizerValidator file space Test', () => {
    it('clean registry (DEFAULT only) produces no violations', () => {
        const violations = CanonicalizerValidator.validateFileSpace();
        expect(violations).toEqual([]);
    });

    it('healthy populated space produces no violations', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const fileA = new ArkFile(Language.TYPESCRIPT);
        fileA.setFileSignature(new FileSignature('proj', 'src/val-a.ts'));
        const fileB = new ArkFile(Language.TYPESCRIPT);
        fileB.setFileSignature(new FileSignature('proj', 'src/val-b.ts'));

        expect(CanonicalizerValidator.validateFileSpace()).toEqual([]);
        // sanity: the entries really exist
        expect(reg.fileSigCanonicalizer.size()).toBeGreaterThanOrEqual(3);
    });

    it('R3: eviction (model removed, sig kept) is reported, execution continues', () => {
        const file = new ArkFile(Language.TYPESCRIPT);
        file.setFileSignature(new FileSignature('proj', 'src/val-evict.ts'));
        const id = file.getFileSigID();

        const existed = SignatureCanonicalizerRegistry.getInstance().removeFile(file);
        expect(existed).toBe(true);

        try {
            const violations = CanonicalizerValidator.validateFileSpace();
            // Only the evicted entry is reported; the rest of the space is still fully checked.
            expect(violations.some(v => v.includes(`R3: ID ${id}`))).toBe(true);
            expect(violations.length).toBe(1);
        } finally {
            SignatureCanonicalizerRegistry.getInstance().registerFile(file);
        }
    });

    it('R4+R6: back-pointer mismatch and double-mount are both reported in one pass', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();

        // R4: mount a model whose getFileSigID() points elsewhere.
        const otherSig = new FileSignature('proj', 'src/val-other.ts');
        const otherID = reg.fileSigCanonicalizer.getId(otherSig);
        const confused = new ArkFile(Language.TYPESCRIPT);
        confused.setFileSignature(new FileSignature('proj', 'src/val-confused.ts'));
        const confusedID = confused.getFileSigID();
        reg.fileSigCanonicalizer.setModel(otherID, confused); // model back-points to confusedID, not otherID

        // R6: the same ArkFile instance mounted at a second ID.
        const dupSig = new FileSignature('proj', 'src/val-dup.ts');
        const dupID = reg.fileSigCanonicalizer.getId(dupSig);
        reg.fileSigCanonicalizer.setModel(dupID, confused); // confused now mounted twice

        try {
            const violations = CanonicalizerValidator.validateFileSpace();
            expect(violations.some(v => v.includes(`R4: model at ID ${otherID}`) && v.includes(`back-points to ${confusedID}`))).toBe(true);
            expect(violations.some(v => v.includes(`R6: model at ID ${dupID}`))).toBe(true);
            // Both R4 and R6 appear in the same summary — nothing short-circuits.
            expect(violations.filter(v => v.includes('R4:')).length).toBeGreaterThanOrEqual(1);
            expect(violations.filter(v => v.includes('R6:')).length).toBeGreaterThanOrEqual(1);
        } finally {
            // Restore a clean space for subsequent cases (models unmounted, sigs left as-is).
            reg.fileSigCanonicalizer.removeModel(otherID);
            reg.fileSigCanonicalizer.removeModel(dupID);
        }
    });

    it('R1b: a model mounted at the DEFAULT slot (ID 0) is reported', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const squatter = new ArkFile(Language.TYPESCRIPT);
        // Bypass the registerFile id > 0 guard: mount directly at the reserved slot.
        reg.fileSigCanonicalizer.setModel(0, squatter);
        try {
            const violations = CanonicalizerValidator.validateFileSpace();
            expect(violations.some(v => v.includes('R1b: ID 0 (DEFAULT slot) unexpectedly holds a model'))).toBe(true);
        } finally {
            reg.fileSigCanonicalizer.removeModel(0);
        }
    });

    it('validateAll reports violations and recovers after re-mount', () => {
        const file = new ArkFile(Language.TYPESCRIPT);
        file.setFileSignature(new FileSignature('proj', 'src/val-all.ts'));
        const id = file.getFileSigID();
        SignatureCanonicalizerRegistry.getInstance().removeFile(file);
        try {
            // The evicted entry is reported (R3) -> validateAll fails.
            expect(CanonicalizerValidator.validateFileSpace().some(v => v.includes(`R3: ID ${id}`))).toBe(true);
            expect(CanonicalizerValidator.validateAll()).toBe(false);
        } finally {
            SignatureCanonicalizerRegistry.getInstance().registerFile(file);
        }
        // After re-mounting, this ID is clean again. (Residual R3s from the interned sigs of
        // the R4+R6 case are permanent — no un-intern API — and don't affect this assertion.)
        expect(CanonicalizerValidator.validateFileSpace().some(v => v.includes(`R3: ID ${id}`))).toBe(false);
    });
});

describe('project/SDK FileSigID boundary Test', () => {
    // Note: the cases above never mark the boundary, so getFirstProjectFileSigID() is -1
    // for the whole file run — boundary-off behaviour (R7 inactive) is implicitly covered.
    it('unmarked boundary: getters return -1 and both predicates are constantly false', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        expect(reg.getFirstProjectFileSigID()).toBe(-1);
        expect(reg.isProjectFileID(1)).toBe(false);
        expect(reg.isProjectFileID(999)).toBe(false);
        expect(reg.isSdkFileID(1)).toBe(false);
    });

    it('marked boundary: dense-IDs semantics — the next interned ID equals size()', () => {
        // Build a dedicated registry lifecycle: mark, intern, verify, dispose.
        SignatureCanonicalizerRegistry.dispose();
        const reg = SignatureCanonicalizerRegistry.getInstance();
        reg.markProjectFileBoundary();
        const first = reg.getFirstProjectFileSigID();
        expect(first).toBe(1); // only DEFAULT (ID 0) interned so far

        expect(reg.isProjectFileID(0)).toBe(false);
        expect(reg.isSdkFileID(0)).toBe(false); // DEFAULT belongs to neither side
        expect(reg.isProjectFileID(first)).toBe(true);

        const projectFile = new ArkFile(Language.TYPESCRIPT);
        projectFile.setFileSignature(new FileSignature('proj', 'src/boundary-a.ts'));
        expect(projectFile.getFileSigID()).toBe(first);

        // Dispose resets the boundary along with the singleton.
        SignatureCanonicalizerRegistry.dispose();
        expect(SignatureCanonicalizerRegistry.getInstance().getFirstProjectFileSigID()).toBe(-1);
    });

    it('R7: boundary set — a model-side projectFile flag crossing the boundary is reported', () => {
        // Fresh registry so the boundary is deterministic.
        SignatureCanonicalizerRegistry.dispose();
        const reg = SignatureCanonicalizerRegistry.getInstance();
        reg.markProjectFileBoundary();

        // A file defaulting to projectFile=false lands after the boundary -> R7 mismatch.
        const sdkFlagged = new ArkFile(Language.TYPESCRIPT);
        sdkFlagged.setFileSignature(new FileSignature('proj', 'src/boundary-r7.ts'));
        try {
            const violations = CanonicalizerValidator.validateFileSpace();
            expect(violations.some(v => v.includes('R7:'))).toBe(true);
        } finally {
            // Keep later files (in this vitest worker) unaffected: restore the unmarked state.
            SignatureCanonicalizerRegistry.dispose();
            SignatureCanonicalizerRegistry.getInstance();
        }
    });
});

describe('validateCanonicalizers option Test', () => {
    it('is off by default (no SceneConfig option set)', () => {
        const config = new SceneConfig();
        expect(config.getOptions().validateCanonicalizers).toBeUndefined();
    });

    it('accepts an explicit true value', () => {
        const config = new SceneConfig({ validateCanonicalizers: true });
        expect(config.getOptions().validateCanonicalizers).toBe(true);
    });
});

describe('CanonicalizerValidator namespace space Test', () => {
    // 本 describe 各用例尽力恢复链结构（finally），使后续用例不被本用例的构造残留干扰；
    // sig 条目本身无法 un-intern，断言一律按规则号 + ID 定位。

    /** 准备已注册的宿主 file（多次调用幂等：同值命中同 ID）。 */
    function setupHostFile(fileName: string): ArkFile {
        const file = new ArkFile(Language.TYPESCRIPT);
        file.setFileSignature(new FileSignature('proj', fileName));
        return file;
    }

    it('clean registry (DEFAULT only) produces no namespace violations', () => {
        SignatureCanonicalizerRegistry.dispose();
        try {
            expect(CanonicalizerValidator.validateNamespaceSpace()).toEqual([]);
        } finally {
            SignatureCanonicalizerRegistry.getInstance();
        }
    });

    it('N3: eviction (model removed, sig kept) is reported', () => {
        const file = setupHostFile('src/ns-val-evict.ts');
        const fileID = file.getFileSigID();
        const sig = new NamespaceSignature('EvictNS', fileID);
        const ns = new ArkNamespace(fileID, undefined, sig);
        const id = ns.getNamespaceSigID();
        file.addNamespace(ns);
        try {
            const existed = SignatureCanonicalizerRegistry.getInstance().removeNamespace(ns);
            expect(existed).toBe(true);
            expect(CanonicalizerValidator.validateNamespaceSpace().some(v => v.includes(`N3: ID ${id}`))).toBe(true);
        } finally {
            // 恢复：补挂 model + file 链（addNamespace 幂等，重挂同实例）。
            SignatureCanonicalizerRegistry.getInstance().registerNamespace(ns);
            file.addNamespace(ns);
        }
        expect(CanonicalizerValidator.validateNamespaceSpace().some(v => v.includes(`N3: ID ${id}`))).toBe(false);
    });

    it('N4+N6: back-pointer mismatch and double-mount are both reported', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const file = setupHostFile('src/ns-val-host.ts');
        const otherSig = new NamespaceSignature('OtherNS', file.getFileSigID());
        const otherID = reg.namespaceSigCanonicalizer.getId(otherSig);
        const confusedSig = new NamespaceSignature('ConfusedNS', file.getFileSigID());
        const confused = new ArkNamespace(file.getFileSigID(), undefined, confusedSig);
        reg.namespaceSigCanonicalizer.setModel(otherID, confused); // 回指 confusedID ≠ otherID
        const dupSig = new NamespaceSignature('DupNS', file.getFileSigID());
        const dupID = reg.namespaceSigCanonicalizer.getId(dupSig);
        reg.namespaceSigCanonicalizer.setModel(dupID, confused); // 双挂载
        try {
            const violations = CanonicalizerValidator.validateNamespaceSpace();
            expect(violations.some(v => v.includes(`N4: model at ID ${otherID}`))).toBe(true);
            expect(violations.some(v => v.includes(`N6: model at ID ${dupID}`))).toBe(true);
        } finally {
            reg.namespaceSigCanonicalizer.removeModel(otherID);
            reg.namespaceSigCanonicalizer.removeModel(dupID);
        }
    });

    it('N7a: nested ns whose parent signature has no model is reported', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const file = setupHostFile('src/ns-val-n7a.ts');
        const fileID = file.getFileSigID();
        // 父：显式 getId intern（无真实 ArkNamespace —— 无 model 形态）。
        // 注意 NamespaceSignature.getNamespaceSigID() 是只读的（未注册返回 -1），
        // 惰性 intern 不存在，无 model 条目只能经显式 getId 产生。
        const parentSig = new NamespaceSignature('ParentNoModel', fileID);
        const parentID = reg.namespaceSigCanonicalizer.getId(parentSig);
        // 子：真实注册（构造器内 setSignature），declaring 指向无 model 的父。
        const childSig = new NamespaceSignature('ChildOfNoModel', fileID, parentID);
        const child = new ArkNamespace(fileID, parentID, childSig);
        const childID = child.getNamespaceSigID();
        try {
            const violations = CanonicalizerValidator.validateNamespaceSpace();
            expect(violations.some(v => v.includes(`N7a: ID ${childID}`) && v.includes(`parent SigID ${parentID}`))).toBe(true);
        } finally {
            // 恢复：真实 ArkNamespace 到达父签名（setSignature 不补挂 model——
            // existing≥0 分支跳过注册），需显式 registerNamespace，再建立父子链
            // 与 file 链，N7a/N7b/N7c 全部消除。
            const parent = new ArkNamespace(fileID, undefined, parentSig);
            SignatureCanonicalizerRegistry.getInstance().registerNamespace(parent);
            parent.addNamespace(child);
            file.addNamespace(parent);
        }
        expect(CanonicalizerValidator.validateNamespaceSpace().some(v => v.includes(`N7a: ID ${childID}`))).toBe(false);
    });

    it('N7b: nested ns missing from its parent top-namespace list is reported', () => {
        const file = setupHostFile('src/ns-val-n7b.ts');
        const fileID = file.getFileSigID();
        const parentSig = new NamespaceSignature('LinkedParent', fileID);
        const parent = new ArkNamespace(fileID, undefined, parentSig);
        file.addNamespace(parent);
        // 子：经构造器注册，但未经 parent.addNamespace —— 父的 top 列表缺员。
        const childSig = new NamespaceSignature('UnlinkedChild', fileID, parent.getNamespaceSigID());
        const child = new ArkNamespace(fileID, parent.getNamespaceSigID(), childSig);
        const childID = child.getNamespaceSigID();
        try {
            const violations = CanonicalizerValidator.validateNamespaceSpace();
            expect(violations.some(v => v.includes(`N7b: ID ${childID}`))).toBe(true);
        } finally {
            parent.addNamespace(child);
        }
        expect(CanonicalizerValidator.validateNamespaceSpace().some(v => v.includes(`N7b: ID ${childID}`))).toBe(false);
    });

    it('N7c: top-level ns missing from its declaring file top-namespace list is reported', () => {
        const file = setupHostFile('src/ns-val-n7c.ts');
        const fileID = file.getFileSigID();
        const sig = new NamespaceSignature('UnlistedTop', fileID);
        const ns = new ArkNamespace(fileID, undefined, sig);
        const id = ns.getNamespaceSigID();
        try {
            const violations = CanonicalizerValidator.validateNamespaceSpace();
            expect(violations.some(v => v.includes(`N7c: top-level ID ${id}`))).toBe(true);
        } finally {
            file.addNamespace(ns);
        }
        expect(CanonicalizerValidator.validateNamespaceSpace().some(v => v.includes(`N7c: top-level ID ${id}`))).toBe(false);
    });

    it('setSignature re-registers an evicted model — three-state alignment (was: N3 keeps reporting interned-but-model-less)', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const file = setupHostFile('src/ns-val-heal.ts');
        const fileID = file.getFileSigID();
        // 显式 getId intern（无 model —— N3 报告过）。注：NamespaceSignature.getNamespaceSigID()
        // 为只读字段不回写 -1，真实无 model 的目标只能经显式 getId 创建（tests 未覆盖上游错误的真实态）。
        const sig = new NamespaceSignature('HealNS', fileID);
        const id = reg.namespaceSigCanonicalizer.getId(sig);
        expect(CanonicalizerValidator.validateNamespaceSpace().some(v => v.includes(`N3: ID ${id}`))).toBe(true);
        // 真实 ArkNamespace 挂载：setSignature 三态处理（三态对齐后）——驱逐态补注册，
        // N3 不再报告（model 已恢复，与 ArkClass.setSignature 行为一致）。
        const ns = new ArkNamespace(fileID, undefined, sig);
        expect(reg.namespaceSigCanonicalizer.getModel(id)).toBe(ns);
        expect(CanonicalizerValidator.validateNamespaceSpace().some(v => v.includes(`N3: ID ${id}`))).toBe(false);
        expect(ns.getNamespaceSigID()).toBe(id);
    });
});

describe('CanonicalizerValidator class space Test', () => {
    // 断言一律按规则号 + ID 定位；sig 条目无法 un-intern，finally 恢复链结构。

    /** 准备已注册的宿主 file。 */
    function setupHostFile(fileName: string): ArkFile {
        const file = new ArkFile(Language.TYPESCRIPT);
        file.setFileSignature(new FileSignature('proj', fileName));
        return file;
    }

    /** 在 file 上注册一个真实类（setSignature 注册 + addArkClass 挂链）。 */
    function setupTopClass(file: ArkFile, className: string): ArkClass {
        const cls = new ArkClass(file.getFileSigID());
        cls.setSignature(new ClassSignature(className, file.getFileSignature()));
        file.addArkClass(cls);
        return cls;
    }

    it('clean registry (DEFAULT only) produces no class violations', () => {
        SignatureCanonicalizerRegistry.dispose();
        try {
            expect(CanonicalizerValidator.validateClassSpace()).toEqual([]);
        } finally {
            SignatureCanonicalizerRegistry.getInstance();
        }
    });

    it('C3: eviction (model removed, sig kept) is reported and recovers on re-mount', () => {
        const file = setupHostFile('src/cls-val-evict.ts');
        const cls = setupTopClass(file, 'EvictCls');
        const id = cls.getClassSigID();
        SignatureCanonicalizerRegistry.getInstance().removeClassModel(cls);
        try {
            expect(CanonicalizerValidator.validateClassSpace().some(v => v.includes(`C3: ID ${id}`))).toBe(true);
        } finally {
            SignatureCanonicalizerRegistry.getInstance().registerClass(cls);
        }
        expect(CanonicalizerValidator.validateClassSpace().some(v => v.includes(`C3: ID ${id}`))).toBe(false);
    });

    it('C3: an explicitly interned signature without a model is reported (production sources eradicated)', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const file = setupHostFile('src/cls-val-hole.ts');
        // 显式 getId intern 无 model——生产路径已随 ClassType 路由重构清零
        //（formal 只写入口 = internDefaults + ArkClass.setSignature），该形态
        // 只能经 tests 手工构造或未来新代码产生，C3 持续守护。
        const sig = new ClassSignature('HoleCls', file.getFileSignature());
        const id = reg.classSigCanonicalizer.getId(sig);
        expect(CanonicalizerValidator.validateClassSpace().some(v => v.includes(`C3: ID ${id}`))).toBe(true);
    });

    it('C4+C6: back-pointer mismatch and double-mount are both reported in one pass', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const file = setupHostFile('src/cls-val-host.ts');
        const otherSig = new ClassSignature('OtherCls', file.getFileSignature());
        const otherID = reg.classSigCanonicalizer.getId(otherSig);
        const confusedSig = new ClassSignature('ConfusedCls', file.getFileSignature());
        const confused = new ArkClass(file.getFileSigID());
        confused.setSignature(confusedSig);
        reg.classSigCanonicalizer.setModel(otherID, confused); // 回指 confusedID ≠ otherID
        const dupSig = new ClassSignature('DupCls', file.getFileSignature());
        const dupID = reg.classSigCanonicalizer.getId(dupSig);
        reg.classSigCanonicalizer.setModel(dupID, confused); // 双挂载
        try {
            const violations = CanonicalizerValidator.validateClassSpace();
            expect(violations.some(v => v.includes(`C4: model at ID ${otherID}`))).toBe(true);
            expect(violations.some(v => v.includes(`C6: model at ID ${dupID}`))).toBe(true);
        } finally {
            reg.classSigCanonicalizer.removeModel(otherID);
            reg.classSigCanonicalizer.removeModel(dupID);
        }
    });

    it('C7a: nested class whose parent namespace signature has no model is reported', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const file = setupHostFile('src/cls-val-n7a.ts');
        const fileID = file.getFileSigID();
        // 父 ns：显式 getId intern（无 model 形态）。
        const parentSig = new NamespaceSignature('ParentNoModelNS', fileID);
        const parentID = reg.namespaceSigCanonicalizer.getId(parentSig);
        // 子类：declaring 指向无 model 的父 ns（构造器内 setSignature 注册 model）。
        const cls = new ArkClass(fileID, parentID);
        cls.setSignature(new ClassSignature('NestedOfNoModel', file.getFileSignature(), new NamespaceSignature('ParentNoModelNS', fileID)));
        const clsID = cls.getClassSigID();
        try {
            const violations = CanonicalizerValidator.validateClassSpace();
            expect(violations.some(v => v.includes(`C7a: ID ${clsID}`) && v.includes(`namespace SigID ${parentID}`))).toBe(true);
        } finally {
            // 恢复：真实 ArkNamespace 到达父签名（显式注册——setSignature 不自愈），
            // 建立父 ns 与 file 链后 C7a 消除、N7c 不再触发。
            const parent = new ArkNamespace(fileID, undefined, parentSig);
            SignatureCanonicalizerRegistry.getInstance().registerNamespace(parent);
            file.addNamespace(parent);
        }
        expect(CanonicalizerValidator.validateClassSpace().some(v => v.includes(`C7a: ID ${clsID}`))).toBe(false);
    });

    it('C7b: nested class missing from its parent namespace top-class list is reported', () => {
        const file = setupHostFile('src/cls-val-n7b.ts');
        const fileID = file.getFileSigID();
        const parentSig = new NamespaceSignature('LinkedParentNS', fileID);
        const parent = new ArkNamespace(fileID, undefined, parentSig);
        file.addNamespace(parent);
        // 子类：经 setSignature 注册 model，但未经 parent.addArkClass——父 top 缺员。
        const cls = new ArkClass(fileID, parent.getNamespaceSigID());
        cls.setSignature(new ClassSignature('UnlinkedNested', file.getFileSignature(), parentSig));
        const clsID = cls.getClassSigID();
        try {
            const violations = CanonicalizerValidator.validateClassSpace();
            expect(violations.some(v => v.includes(`C7b: ID ${clsID}`))).toBe(true);
        } finally {
            parent.addArkClass(cls);
        }
        expect(CanonicalizerValidator.validateClassSpace().some(v => v.includes(`C7b: ID ${clsID}`))).toBe(false);
    });

    it('C7c: top-level class missing from its declaring file top-class list is reported', () => {
        const file = setupHostFile('src/cls-val-n7c.ts');
        // setSignature 注册 model，但未经 file.addArkClass——file top 缺员。
        const cls = new ArkClass(file.getFileSigID());
        cls.setSignature(new ClassSignature('UnlistedTopCls', file.getFileSignature()));
        const clsID = cls.getClassSigID();
        try {
            const violations = CanonicalizerValidator.validateClassSpace();
            expect(violations.some(v => v.includes(`C7c: top-level ID ${clsID}`))).toBe(true);
        } finally {
            file.addArkClass(cls);
        }
        expect(CanonicalizerValidator.validateClassSpace().some(v => v.includes(`C7c: top-level ID ${clsID}`))).toBe(false);
    });
});

describe('CanonicalizerValidator field space Test', () => {
    // 断言一律按规则号 + ID 定位；sig 条目无法 un-intern，finally 恢复链结构。

    /** 在宿主 file 的类上注册一个真实字段（setSignature + addField 全链挂载）。 */
    function setupField(fileName: string, className: string, fieldName: string): { file: ArkFile; cls: ArkClass; field: ArkField } {
        const file = setupFile(fileName);
        const cls = new ArkClass(file.getFileSigID());
        cls.setSignature(new ClassSignature(className, file.getFileSignature()));
        file.addArkClass(cls);
        const field = new ArkField(cls.getClassSigID());
        field.setSignature(new FieldSignature(fieldName, cls.getClassSigID(), NumberType.getInstance(), false));
        cls.addField(field);
        return { file, cls, field };
    }

    function setupFile(fileName: string): ArkFile {
        const file = new ArkFile(Language.TYPESCRIPT);
        file.setFileSignature(new FileSignature('proj', fileName));
        return file;
    }

    it('clean registry (DEFAULT only) produces no field violations', () => {
        SignatureCanonicalizerRegistry.dispose();
        try {
            expect(CanonicalizerValidator.validateFieldSpace()).toEqual([]);
        } finally {
            SignatureCanonicalizerRegistry.getInstance();
        }
    });

    it('F3: eviction (model removed, sig kept) is reported and recovers on re-mount', () => {
        const { field } = setupField('src/fld-val-evict.ts', 'FldEvictHost', 'evictField');
        const id = field.getFieldSigID();
        SignatureCanonicalizerRegistry.getInstance().removeField(field);
        try {
            expect(CanonicalizerValidator.validateFieldSpace().some(v => v.includes(`F3: ID ${id}`))).toBe(true);
        } finally {
            SignatureCanonicalizerRegistry.getInstance().registerField(field);
        }
        expect(CanonicalizerValidator.validateFieldSpace().some(v => v.includes(`F3: ID ${id}`))).toBe(false);
    });

    it('F4+F6: back-pointer mismatch and double-mount are both reported in one pass', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const { cls } = setupField('src/fld-val-host.ts', 'FldValHost', 'hostField');
        const otherSig = new FieldSignature('otherField', cls.getClassSigID(), NumberType.getInstance(), false);
        const otherID = reg.fieldSigCanonicalizer.getId(otherSig);
        const confusedSig = new FieldSignature('confusedField', cls.getClassSigID(), NumberType.getInstance(), false);
        const confused = new ArkField(cls.getClassSigID());
        confused.setSignature(confusedSig);
        reg.fieldSigCanonicalizer.setModel(otherID, confused); // 回指 confusedID ≠ otherID
        const dupSig = new FieldSignature('dupField', cls.getClassSigID(), NumberType.getInstance(), false);
        const dupID = reg.fieldSigCanonicalizer.getId(dupSig);
        reg.fieldSigCanonicalizer.setModel(dupID, confused); // 双挂载
        try {
            const violations = CanonicalizerValidator.validateFieldSpace();
            expect(violations.some(v => v.includes(`F4: model at ID ${otherID}`))).toBe(true);
            expect(violations.some(v => v.includes(`F6: model at ID ${dupID}`))).toBe(true);
        } finally {
            reg.fieldSigCanonicalizer.removeModel(otherID);
            reg.fieldSigCanonicalizer.removeModel(dupID);
        }
    });

    it('F4b: model declaringClassID diverging from the signature is reported', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const { cls, field } = setupField('src/fld-val-f4b.ts', 'FldF4bHost', 'f4bField');
        const id = field.getFieldSigID();
        // 手造分歧：model 挂到 ID 上但 declaringClassID 指向别处（模拟 builder 双侧不同步）。
        // 直接改 ArkField 内部字段不可行（readonly 语义），用换挂 model 的实例造分歧：
        // 新实例 declaringClassID 用宿主 file 上另一个类。
        const otherCls = new ArkClass(cls.getDeclaringFileID());
        otherCls.setSignature(new ClassSignature('F4bOtherCls', cls.getDeclaringArkFile().getFileSignature()));
        cls.getDeclaringArkFile().addArkClass(otherCls);
        const divergent = new ArkField(otherCls.getClassSigID());
        divergent.setSignature(new FieldSignature('divergentField', otherCls.getClassSigID(), NumberType.getInstance(), false));
        reg.fieldSigCanonicalizer.setModel(id, divergent); // 签名声明 cls，model 自报 otherCls
        try {
            const violations = CanonicalizerValidator.validateFieldSpace();
            expect(violations.some(v => v.includes(`F4b: model at ID ${id}`) && v.includes(`${cls.getClassSigID()}`))).toBe(true);
        } finally {
            reg.fieldSigCanonicalizer.removeModel(id);
            // 恢复：原 field 重新挂载。
            SignatureCanonicalizerRegistry.getInstance().registerField(field);
        }
        expect(CanonicalizerValidator.validateFieldSpace().some(v => v.includes(`F4b: model at ID ${id}`))).toBe(false);
    });

    it('F7a: field surviving its declaring class model eviction is reported', () => {
        const { cls, field } = setupField('src/fld-val-f7a.ts', 'FldF7aHost', 'f7aField');
        const id = field.getFieldSigID();
        // 模拟 P0 前的驱逐不完整形态：class model 删除但 field model 残留。
        SignatureCanonicalizerRegistry.getInstance().removeClassModel(cls);
        try {
            const violations = CanonicalizerValidator.validateFieldSpace();
            expect(violations.some(v => v.includes(`F7a: ID ${id}`))).toBe(true);
        } finally {
            SignatureCanonicalizerRegistry.getInstance().registerClass(cls);
        }
        expect(CanonicalizerValidator.validateFieldSpace().some(v => v.includes(`F7a: ID ${id}`))).toBe(false);
    });

    it('F7b: field missing from its declaring class field indexes is reported', () => {
        const { cls, field } = setupField('src/fld-val-f7b.ts', 'FldF7bHost', 'f7bField');
        void field.getFieldSigID();
        // 摘索引成员（模拟挂载链断裂）——removeField 会同时删 model，须只摘索引：
        // 用换挂 class 的方式不适用，直接手造：新类持有签名值但不含本 ID。
        // 简化：把 field model 挂到另一个不含该 ID 的类签名名下经 setModel。
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const bareCls = new ArkClass(cls.getDeclaringFileID());
        bareCls.setSignature(new ClassSignature('FldF7bBare', cls.getDeclaringArkFile().getFileSignature()));
        cls.getDeclaringArkFile().addArkClass(bareCls);
        // 签名声明 bareCls（无索引挂载），model 为原 field 实例（回指一致但链断）。
        const unindexedSig = new FieldSignature('unindexedField', bareCls.getClassSigID(), NumberType.getInstance(), false);
        const unindexedID = reg.fieldSigCanonicalizer.getId(unindexedSig);
        reg.fieldSigCanonicalizer.setModel(unindexedID, field);
        try {
            const violations = CanonicalizerValidator.validateFieldSpace();
            expect(violations.some(v => v.includes(`F7b: ID ${unindexedID}`))).toBe(true);
        } finally {
            reg.fieldSigCanonicalizer.removeModel(unindexedID);
        }
    });
});

describe('CanonicalizerValidator method space Test', () => {
    // 断言一律按规则号 + ID 定位；finally 恢复链结构。

    /** 在宿主 file 的类上注册一个真实方法（setImplementationSignature + addMethod）。 */
    function setupMethod(fileName: string, className: string, methodName: string): { cls: ArkClass; method: ArkMethod } {
        const file = new ArkFile(Language.TYPESCRIPT);
        file.setFileSignature(new FileSignature('proj', fileName));
        const cls = new ArkClass(file.getFileSigID());
        cls.setSignature(new ClassSignature(className, file.getFileSignature()));
        file.addArkClass(cls);
        const method = new ArkMethod(cls.getClassSigID());
        method.setImplementationSignature(new MethodSignature(cls.getClassSigID(), new MethodSubSignature(methodName, [], NumberType.getInstance(), false)));
        cls.addMethod(method);
        return { cls, method };
    }

    it('clean registry (DEFAULT only) produces no method violations', () => {
        SignatureCanonicalizerRegistry.dispose();
        try {
            expect(CanonicalizerValidator.validateMethodSpace()).toEqual([]);
        } finally {
            SignatureCanonicalizerRegistry.getInstance();
        }
    });

    it('M3: declare-only entry with a live declaring class is legal (skipped)', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const { cls } = setupMethod('src/mtd-val-m3.ts', 'MtdM3Host', 'declOnly');
        // 显式 intern 一条同 class 的声明签名（不注册 model）——declaring class 存活 → 合法跳过。
        const declSig = new MethodSignature(cls.getClassSigID(), new MethodSubSignature('declOnly', [], NumberType.getInstance(), false));
        reg.methodSigCanonicalizer.getId(declSig);
        expect(CanonicalizerValidator.validateMethodSpace().some(v => v.includes('M3:'))).toBe(false);
    });

    it('M3: no-model entry with a dead declaring class is reported', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const { cls } = setupMethod('src/mtd-val-m3b.ts', 'MtdM3bHost', 'orphanDecl');
        // 独立声明值（多一个参数，与实现签名不同 ID）且不注册 model。
        const declSig = new MethodSignature(
            cls.getClassSigID(),
            new MethodSubSignature('orphanDecl', [new MethodParameter()], NumberType.getInstance(), false)
        );
        const id = reg.methodSigCanonicalizer.getId(declSig);
        // 删 class model（模拟驱逐后 class 不在）→ declare-only 不再合法。
        SignatureCanonicalizerRegistry.getInstance().removeClassModel(cls);
        try {
            expect(CanonicalizerValidator.validateMethodSpace().some(v => v.includes(`M3: ID ${id}`))).toBe(true);
        } finally {
            SignatureCanonicalizerRegistry.getInstance().registerClass(cls);
        }
        expect(CanonicalizerValidator.validateMethodSpace().some(v => v.includes(`M3: ID ${id}`))).toBe(false);
    });

    it('M4: closure dual-signature mounts are both legal (design contract)', () => {
        const { cls, method } = setupMethod('src/mtd-val-m4.ts', 'MtdM4Host', 'closureMethod');
        // 闭包重签模拟：setImplementationSignature 换新签名（仲裁注册 id2），
        // 类索引仍持 id1（不重挂）——双签名设计契约形态。
        const oldID = method.getMethodSigID()!;
        const newSig = new MethodSignature(
            cls.getClassSigID(),
            new MethodSubSignature('closureMethod', [new MethodParameter()], NumberType.getInstance(), false)
        );
        method.setImplementationSignature(newSig);
        const newID = method.getMethodSigID()!;
        expect(newID).not.toBe(oldID);
        // M4 三方持有：id1 经类索引 ✓、id2 经 self-id ✓ —— 零违规。
        const violations = CanonicalizerValidator.validateMethodSpace();
        expect(violations.some(v => v.includes(`M4: model at ID ${oldID}`))).toBe(false);
        expect(violations.some(v => v.includes(`M4: model at ID ${newID}`))).toBe(false);
        // M6 反向链：索引条目 id1 有 model ✓。
        expect(violations.some(v => v.includes('M6:'))).toBe(false);
    });

    it('M4: orphan mount (no self/declare/index holder) is reported', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const { cls } = setupMethod('src/mtd-val-m4b.ts', 'MtdM4bHost', 'orphanHost');
        // 手造孤儿：一个别的实例注册到无人持有的签名 ID 上。
        const orphanSig = new MethodSignature(cls.getClassSigID(), new MethodSubSignature('orphanMounted', [], NumberType.getInstance(), false));
        const orphanID = reg.methodSigCanonicalizer.getId(orphanSig);
        const orphan = new ArkMethod(cls.getClassSigID());
        orphan.setImplementationSignature(orphanSig);
        // setImplementationSignature 在仲裁中已把 orphan 注册到 orphanID（self-id 持有）——
        // 要造"无 self 持有"需换挂：另一实例占位。
        const squatter = new ArkMethod(cls.getClassSigID());
        const squatterSig = new MethodSignature(cls.getClassSigID(), new MethodSubSignature('squatterReal', [], NumberType.getInstance(), false));
        squatter.setImplementationSignature(squatterSig);
        reg.methodSigCanonicalizer.setModel(orphanID, squatter); // orphanID 的 model = squatter，但 squatter 的 self-id 是别的 → M4 违规
        try {
            const violations = CanonicalizerValidator.validateMethodSpace();
            expect(violations.some(v => v.includes(`M4: model at ID ${orphanID}`))).toBe(true);
        } finally {
            reg.methodSigCanonicalizer.removeModel(orphanID);
        }
    });

    it('M4b: model declaringClassID diverging from the signature is reported', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const { method } = setupMethod('src/mtd-val-m4c.ts', 'MtdM4cHost', 'f4bMethod');
        const id = method.getMethodSigID()!;
        // 手造分歧：换挂一个 declaringClassID 不同的实例。
        const file = new ArkFile(Language.TYPESCRIPT);
        file.setFileSignature(new FileSignature('proj', 'src/mtd-val-m4c-other.ts'));
        const otherCls = new ArkClass(file.getFileSigID());
        otherCls.setSignature(new ClassSignature('MtdM4cOther', file.getFileSignature()));
        file.addArkClass(otherCls);
        const divergent = new ArkMethod(otherCls.getClassSigID());
        divergent.setImplementationSignature(
            new MethodSignature(otherCls.getClassSigID(), new MethodSubSignature('divergent', [], NumberType.getInstance(), false))
        );
        const divergentSigID = divergent.getMethodSigID()!;
        reg.methodSigCanonicalizer.setModel(id, divergent); // 签名声明 cls，model 自报 otherCls
        try {
            const violations = CanonicalizerValidator.validateMethodSpace();
            expect(violations.some(v => v.includes(`M4b: model at ID ${id}`))).toBe(true);
        } finally {
            reg.methodSigCanonicalizer.removeModel(id);
            reg.methodSigCanonicalizer.removeModel(divergentSigID);
            SignatureCanonicalizerRegistry.getInstance().registerMethod(method);
        }
        expect(CanonicalizerValidator.validateMethodSpace().some(v => v.includes(`M4b: model at ID ${id}`))).toBe(false);
    });

    it('M6: index entry with no model is reported (reverse chain)', () => {
        const { method } = setupMethod('src/mtd-val-m6.ts', 'MtdM6Host', 'indexOrphan');
        const id = method.getMethodSigID()!;
        const reg = SignatureCanonicalizerRegistry.getInstance();
        reg.methodSigCanonicalizer.removeModel(id);
        try {
            expect(CanonicalizerValidator.validateMethodSpace().some(v => v.includes(`M6: class`) && v.includes(`ID ${id}`))).toBe(true);
        } finally {
            SignatureCanonicalizerRegistry.getInstance().registerMethod(method);
        }
        expect(CanonicalizerValidator.validateMethodSpace().some(v => v.includes(`ID ${id}`))).toBe(false);
    });

    it('M7: method surviving its declaring class eviction is reported', () => {
        const { cls, method } = setupMethod('src/mtd-val-m7.ts', 'MtdM7Host', 'm7Method');
        const id = method.getMethodSigID()!;
        SignatureCanonicalizerRegistry.getInstance().removeClassModel(cls);
        try {
            const violations = CanonicalizerValidator.validateMethodSpace();
            expect(violations.some(v => v.includes(`M7: ID ${id}`))).toBe(true);
        } finally {
            SignatureCanonicalizerRegistry.getInstance().registerClass(cls);
        }
        expect(CanonicalizerValidator.validateMethodSpace().some(v => v.includes(`M7: ID ${id}`))).toBe(false);
    });

    it('ArkClass.getMethod: a foreign class signature does not cross-hit (Plan A guard)', () => {
        const { cls } = setupMethod('src/mtd-val-x1.ts', 'GetXHost', 'localMethod');
        const other = setupMethod('src/mtd-val-x2.ts', 'OtherXHost', 'localMethod');
        // 他类方法签名问本类 → 必须返回 null（Phase 0 实测旧实现 100% 越界命中）。
        expect(cls.getMethod(other.method.getSignature())).toBeNull();
        // 本类方法签名仍正确命中。
        expect(cls.getMethod(cls.getMethods()[0].getSignature())).not.toBeNull();
    });
});

describe('CanonicalizerValidator alias entries Test (U+ display normalization)', () => {
    // U+ 合法形态守护：AliasClassSignature 是一等 formal 签名（独立 ID + 双注册
    // origin model）。class 空间 C4/C6/C7 与 method 空间 M4/M4b 均按设计豁免
    // alias 条目——本 describe 固化"豁免不误报、origin 条目守护仍在"。

    /** 在宿主 file 上注册一个真实类（供 alias 双注册挂靠）。 */
    function setupOriginClass(fileName: string, className: string): ArkClass {
        const file = new ArkFile(Language.TYPESCRIPT);
        file.setFileSignature(new FileSignature('proj', fileName));
        const cls = new ArkClass(file.getFileSigID());
        cls.setSignature(new ClassSignature(className, file.getFileSignature()));
        file.addArkClass(cls);
        return cls;
    }

    it('C4+C6+C7: alias class entries with dual-registered origin model are legal', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const cls = setupOriginClass('src/cls-val-alias.ts', 'OriginCls');
        // 构造即 intern formal + 双注册 origin ArkClass model
        const alias = new AliasClassSignature('AliasName', cls.getSignature());
        const aliasID = reg.classSigCanonicalizer.getExistingId(alias);
        expect(aliasID).toBeGreaterThan(0);
        expect(aliasID).not.toBe(cls.getClassSigID());
        // 双注册：alias ID 与 origin ID 持同一 ArkClass 实例
        expect(reg.classSigCanonicalizer.getModel(aliasID)).toBe(cls);
        // C4（回指 origin ID）/C6（多 ID 挂载）/C7c（顶层 file 的 top-class 列表
        // 只含 origin ID）——alias 条目全套豁免，零违规
        const violations = CanonicalizerValidator.validateClassSpace();
        expect(violations.some(v => v.includes(`C4: model at ID ${aliasID}`))).toBe(false);
        expect(violations.some(v => v.includes(`C6: model at ID ${aliasID}`))).toBe(false);
        expect(violations.some(v => v.includes('C7c:') && v.includes(`ID ${aliasID}`))).toBe(false);
        // origin 条目自身的守护不受豁免影响（正常回指/单挂载/挂链齐全）
        expect(violations.some(v => v.includes(`C4: model at ID ${cls.getClassSigID()}`))).toBe(false);
        expect(violations.some(v => v.includes(`C7c: top-level ID ${cls.getClassSigID()}`))).toBe(false);
    });

    it('M4+M4b+M7: alias method signature with dual-registered origin model is legal', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const cls = setupOriginClass('src/mtd-val-alias.ts', 'MtdAliasHost');
        const method = new ArkMethod(cls.getClassSigID());
        const originSig = new MethodSignature(cls.getClassSigID(), new MethodSubSignature('pop', [], NumberType.getInstance(), false));
        method.setImplementationSignature(originSig);
        cls.addMethod(method);
        // 组件 pop 形态：alias MethodSignature + internAliasMethodSignature 双注册
        const aliasDecl = new AliasClassSignature('Comp', cls.getSignature());
        const aliasMtdSig = new MethodSignature(aliasDecl, new MethodSubSignature('pop', [], NumberType.getInstance(), false));
        internAliasMethodSignature(aliasMtdSig, originSig);
        const aliasMtdID = reg.methodSigCanonicalizer.getExistingId(aliasMtdSig);
        expect(aliasMtdID).toBeGreaterThan(0);
        expect(reg.methodSigCanonicalizer.getModel(aliasMtdID)).toBe(method);
        // M4（model 由 origin 条目持有）/M4b（双侧声明类必然不同）/M7（alias
        // classSig 条目双注册有 model）——全套合法，零违规
        const violations = CanonicalizerValidator.validateMethodSpace();
        expect(violations.some(v => v.includes(`M4: model at ID ${aliasMtdID}`))).toBe(false);
        expect(violations.some(v => v.includes(`M4b: model at ID ${aliasMtdID}`))).toBe(false);
        expect(violations.some(v => v.includes('M7:') && v.includes(`ID ${aliasMtdID}`))).toBe(false);
        // 值查直命中真实方法（scene.getMethod fast path 语义）
        expect(reg.methodSigCanonicalizer.getModel(reg.methodSigCanonicalizer.getExistingId(aliasMtdSig))).toBe(method);
    });
});

describe('CanonicalizerValidator temp spaces Test', () => {
    it('clean registry produces no temp violations', () => {
        SignatureCanonicalizerRegistry.dispose();
        expect(CanonicalizerValidator.validateTempSpaces()).toEqual([]);
    });

    it('healthy temp registrations (ClassType temp-held anchor) produce no violations', () => {
        SignatureCanonicalizerRegistry.dispose();
        const reg = SignatureCanonicalizerRegistry.getInstance();
        // An unclear stub never interned into formal: ClassType routes it to the temp
        // space (formal miss) and holds it as the anchor — register idempotency (T2)
        // and the anchor's self-carried ID stay consistent by construction.
        const stub = new ClassSignature('AnchoredStub', 0, undefined);
        const ct = new ClassType(stub);
        expect(ct.getTempSigID()).toBeDefined();
        expect(reg.tempClassSigCanonicalizer.getExistingTempId(stub)).toBe(ct.getTempSigID());
        expect(CanonicalizerValidator.validateTempSpaces()).toEqual([]);
        void ct;
    });

    it('T1: a live temp entry whose value also exists in formal is reported as stale', () => {
        SignatureCanonicalizerRegistry.dispose();
        const reg = SignatureCanonicalizerRegistry.getInstance();
        // Register into temp first (formal miss at that moment) ...
        const stub = new ClassSignature('T1StaleStub', 0, undefined);
        reg.tempClassSigCanonicalizer.register(stub);
        // ... then the same value lands in formal (real model registration).
        reg.classSigCanonicalizer.getId(stub);
        const violations = CanonicalizerValidator.validateTempSpaces();
        expect(violations.some(v => v.includes('[temp-class] T1'))).toBe(true);
        expect(violations.some(v => v.includes('stale temp registration'))).toBe(true);
    });

    it('T3: a model-tree holder declaring a stale temp ID is reported', () => {
        SignatureCanonicalizerRegistry.dispose();
        const reg = SignatureCanonicalizerRegistry.getInstance();
        // Build a real model chain holding a temp-held ClassType (registered into
        // temp by the ClassType constructor via the formal-miss route).
        const stub = new ClassSignature('T3StaleStub', 0, undefined);
        const ct = new ClassType(stub);
        const fileA = new ArkFile(Language.TYPESCRIPT);
        fileA.setFileSignature(new FileSignature('proj', 'src/temp-t3.ts'));
        const host = new ArkClass(fileA.getFileSigID());
        host.setSignature(new ClassSignature('T3Host', fileA.getFileSignature(), null));
        const field = new ArkField(host.getClassSigID());
        field.setSignature(new FieldSignature('staleField', host.getClassSigID(), ct, false));
        host.addField(field);
        SignatureCanonicalizerRegistry.getInstance().registerClass(host);
        // 正常态：持有者声明的 tempSigID 在 temp 空间有效，零违规。
        expect(CanonicalizerValidator.validateTempSpaces().some(v => v.includes('T3:'))).toBe(false);
        // 模拟 temp 空间独立清空（Registry dispose 的 temp 段单独发生）——模型树
        // 持有者残留 stale ID。
        reg.tempClassSigCanonicalizer.clear();
        const violations = CanonicalizerValidator.validateTempSpaces();
        expect(violations.some(v => v.includes('[temp-class] T3'))).toBe(true);
        expect(violations.some(v => v.includes('stale or unregistered ID'))).toBe(true);
    });

    it('T3: a holder ID backed by a replacement record (retired slot) is legal', () => {
        SignatureCanonicalizerRegistry.dispose();
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const stub = new ClassSignature('T3ReplacedStub', 0, undefined);
        const ct = new ClassType(stub);
        const fileA = new ArkFile(Language.TYPESCRIPT);
        fileA.setFileSignature(new FileSignature('proj', 'src/temp-t3b.ts'));
        const host = new ArkClass(fileA.getFileSigID());
        host.setSignature(new ClassSignature('T3ReplacedHost', fileA.getFileSignature(), null));
        const field = new ArkField(host.getClassSigID());
        field.setSignature(new FieldSignature('replacedField', host.getClassSigID(), ct, false));
        host.addField(field);
        SignatureCanonicalizerRegistry.getInstance().registerClass(host);
        // 迁移场景：slot 置空 + 替换记录（持有者仍声明该 tempSigID——惰性物化
        // 痕迹态 formalID≥0 && tempSigID≠undefined 同款覆盖）。
        const tempId = ct.getTempSigID()!;
        reg.tempClassSigCanonicalizer.retireWithReplacement(tempId, host.getClassSigID());
        expect(reg.tempClassSigCanonicalizer.get(tempId)).toBeUndefined();
        expect(reg.tempClassSigCanonicalizer.getReplacement(tempId)).toBe(host.getClassSigID());
        // replacement 记录背书 → T3 视为有效，零违规。
        const violations = CanonicalizerValidator.validateTempSpaces();
        expect(violations.some(v => v.includes('[temp-class] T3'))).toBe(false);
    });
});
