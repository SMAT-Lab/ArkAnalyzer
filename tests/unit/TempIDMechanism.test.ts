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

import { describe, expect, it, beforeEach, beforeAll } from 'vitest';
import { Scene } from '../../src/Scene';
import { ClassSignature, FileSignature, FieldSignature, MethodSignature, MethodSubSignature } from '../../src/core/model/ArkSignature';
import { ClassType, FunctionType, EnumValueType, GenericType, UnknownType, NumberType, StringType, Type } from '../../src/core/base/Type';
import { ArkFile, Language } from '../../src/core/model/ArkFile';
import { ArkClass, ClassCategory } from '../../src/core/model/ArkClass';
import { ArkField } from '../../src/core/model/ArkField';
import { ArkMethod } from '../../src/core/model/ArkMethod';
import { ArkInstanceFieldRef, ArkStaticFieldRef } from '../../src/core/base/Ref';
import { ArkStaticInvokeExpr } from '../../src/core/base/Expr';
import { ArkSignatureBuilder } from '../../src/core/model/builder/ArkSignatureBuilder';
import { Local } from '../../src/core/base/Local';
import { SignatureCanonicalizerRegistry } from '../../src/core/common/SignatureCanonicalizerRegistry';
import { Builtin } from '../../src/core/common/Builtin';

describe('Temp ID Mechanism Test', () => {
    let reg: SignatureCanonicalizerRegistry;
    // Pre-register the file values shared by the cases below so the class signatures take the
    // formal-ID path. An uninterned declaring file now falls back to ID 0 (DEFAULT) with an
    // error log — mode B' defensive routing (work item P), no throw.
    beforeEach(() => {
        reg = SignatureCanonicalizerRegistry.getInstance();
        reg.fileSigCanonicalizer.getId(new FileSignature('p', 'f.ts'));
        reg.fileSigCanonicalizer.getId(new FileSignature('p', 'c.ts'));
    });

    it('ClassType with an unregistered clear signature does NOT intern into formal space', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const formalSizeBefore = reg.classSigCanonicalizer.size();
        const classSig = new ClassSignature('A', new FileSignature('p', 'f.ts'), null);
        const ct = new ClassType(classSig);
        // 路由重构后：formal 只读命中，未注册（含 clear）→ temp 兜底，不写 formal。
        expect(ct.getClassSigID()).toBe(-1);
        expect(ct.getTempSigID()).toBeDefined();
        expect(reg.classSigCanonicalizer.size()).toBe(formalSizeBefore);
    });

    it('ClassType with a registered signature resolves the formal ID read-only', () => {
        const scene = new Scene();
        const fileSig = new FileSignature('p', 'f.ts');
        const classSig = new ClassSignature('A', fileSig, null);
        // 真实模型注册：ArkClass.setSignature 是 formal 空间的唯一写入点。
        const arkClass = new ArkClass(scene.getFileSigCanonicalizer().getExistingId(fileSig));
        arkClass.setSignature(classSig);
        const ct = new ClassType(classSig);
        const id = ct.getClassSigID();
        expect(id).toBeGreaterThan(0);
        expect(id).toBe(scene.getClassSigCanonicalizer().getExistingId(classSig));
        expect(ct.getTempSigID()).toBeUndefined();
    });

    it('ClassType.setClassSignature re-registers into temp and swaps the anchor', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const fileSig = new FileSignature('p', 'f.ts');
        // 独立类名：避免与前序用例（registered-signature 用例已注册 'A'）的 formal
        // 值命中耦合——本用例验证的是未注册签名的 temp 往返。
        const sig1 = new ClassSignature('ReRegisterA', fileSig, null);
        const sig2 = new ClassSignature('ReRegisterB', fileSig, null);
        const sizeBefore = reg.tempClassSigCanonicalizer.size();
        const ct = new ClassType(sig1);
        expect(ct.getClassSigID()).toBe(-1);
        const tempId1 = ct.getTempSigID()!;
        expect(reg.tempClassSigCanonicalizer.size()).toBe(sizeBefore + 1);

        ct.setClassSignature(sig2);
        // 两个签名均未注册 → 均走 temp：新锚点 + 新 temp ID（弱注册表：sig1 仍被
        // 本用例局部变量锚定，其条目存活；GC 后由 size() 清扫收敛）。
        expect(ct.getClassSigID()).toBe(-1);
        const tempId2 = ct.getTempSigID()!;
        expect(tempId2).not.toBe(tempId1); // 引用语义：不同实例不同 ID
        expect(reg.tempClassSigCanonicalizer.size()).toBe(sizeBefore + 2);
        expect(reg.tempClassSigCanonicalizer.getExistingTempId(sig2)).toBe(tempId2);
    });

    it('FunctionType resolves the formal ID for an interned method signature', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const classSig = new ClassSignature('A', new FileSignature('p', 'f.ts'), null);
        const ms = new MethodSignature(
            reg.classSigCanonicalizer.getId(classSig),
            new MethodSubSignature('foo', [], UnknownType.getInstance(), false)
        );
        // 显式 intern 方法签名值（formal 命中路径）。
        const internedId = reg.methodSigCanonicalizer.getId(ms);
        const ft = new FunctionType(ms);
        expect(ft.getMethodSigID()).toBe(internedId);
        expect(ft.getTempSigID()).toBeUndefined();
    });

    it('FunctionType routes an uninterned method signature to temp (no formal write)', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const methodSizeBefore = reg.methodSigCanonicalizer.size();
        const classSig = new ClassSignature('B', new FileSignature('p', 'f.ts'), null);
        const ms = new MethodSignature(
            reg.classSigCanonicalizer.getId(classSig),
            new MethodSubSignature('bar', [], UnknownType.getInstance(), false)
        );
        // 方法签名未 intern → temp 兜底（formal 只读，不写）。
        const ft = new FunctionType(ms);
        expect(ft.getMethodSigID()).toBe(-1);
        expect(ft.getTempSigID()).toBeDefined();
        expect(reg.methodSigCanonicalizer.size()).toBe(methodSizeBefore);
    });

    it('EnumValueType resolves the formal ID for an interned field signature', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const classSig = new ClassSignature('Enum', new FileSignature('p', 'f.ts'), null);
        const fs = new FieldSignature(
            'RED',
            reg.classSigCanonicalizer.getId(classSig),
            NumberType.getInstance(),
            false
        );
        const internedId = reg.fieldSigCanonicalizer.getId(fs);
        const evt = new EnumValueType(fs);
        expect(evt.getFieldSigID()).toBe(internedId);
        expect(evt.getTempSigID()).toBeUndefined();
    });

    it('EnumValueType routes an uninterned field signature to temp (no formal write)', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const fieldSizeBefore = reg.fieldSigCanonicalizer.size();
        const classSig = new ClassSignature('Enum2', new FileSignature('p', 'f.ts'), null);
        const fs = new FieldSignature(
            'BLUE',
            reg.classSigCanonicalizer.getId(classSig),
            NumberType.getInstance(),
            false
        );
        const evt = new EnumValueType(fs);
        expect(evt.getFieldSigID()).toBe(-1);
        expect(evt.getTempSigID()).toBeDefined();
        expect(reg.fieldSigCanonicalizer.size()).toBe(fieldSizeBefore);
    });

    it('FieldSignature.getDeclaringClassSigID returns valid ID without scene setup', () => {
        const classSig = new ClassSignature('A', new FileSignature('p', 'f.ts'), null);
        const fs = new FieldSignature(
            'field',
            SignatureCanonicalizerRegistry.getInstance().classSigCanonicalizer.getId(classSig),
            UnknownType.getInstance(),
            false
        );
        expect(fs.getDeclaringClassSigID()).toBeGreaterThan(0);
    });

    it('FieldSignature.getDeclaringClassSigID returns valid ID after scene setup', () => {
        const classSig = new ClassSignature('A', new FileSignature('p', 'f.ts'), null);
        const fs = new FieldSignature(
            'field',
            SignatureCanonicalizerRegistry.getInstance().classSigCanonicalizer.getId(classSig),
            UnknownType.getInstance(),
            false
        );
        const id = fs.getDeclaringClassSigID();
        expect(id).toBeGreaterThan(0);
    });

    it('MethodSignature.getDeclaringClassSigID returns valid ID without scene setup', () => {
        const classSig = new ClassSignature('A', new FileSignature('p', 'f.ts'), null);
        const ms = new MethodSignature(
            SignatureCanonicalizerRegistry.getInstance().classSigCanonicalizer.getId(classSig),
            new MethodSubSignature('foo', [], UnknownType.getInstance(), false)
        );
        expect(ms.getDeclaringClassSigID()).toBeGreaterThan(0);
    });

    it('MethodSignature.getDeclaringClassSigID returns valid ID after scene setup', () => {
        const classSig = new ClassSignature('A', new FileSignature('p', 'f.ts'), null);
        const ms = new MethodSignature(
            SignatureCanonicalizerRegistry.getInstance().classSigCanonicalizer.getId(classSig),
            new MethodSubSignature('foo', [], UnknownType.getInstance(), false)
        );
        const id = ms.getDeclaringClassSigID();
        expect(id).toBeGreaterThan(0);
    });

    it('Scene setFile cascades scene to ArkClass and ArkField', () => {
        const scene = new Scene();
        const arkFile = new ArkFile(Language.TYPESCRIPT);
        const fileSig = new FileSignature('proj', 'src/cascade.ts');
        arkFile.setFileSignature(fileSig);

        const defaultClass = new ArkClass(arkFile.getFileSigID());
        defaultClass.setCategory(ClassCategory.CLASS);
        const classSig = new ClassSignature('CascadeClass', fileSig, null);
        defaultClass.setSignature(classSig);
        arkFile.setDefaultClass(defaultClass);

        scene.setFile(arkFile);

        // ArkFile's defaultClassID should be resolvable
        expect(arkFile.getDefaultClassID()).toBeGreaterThan(0);
        // ArkClass's declaringFileID should be resolvable
        expect(defaultClass.getDeclaringFileID()).toBeGreaterThan(0);
    });

    it('ID is cached and returns same value on repeated calls', () => {
        const classSig = new ClassSignature('Cache', new FileSignature('p', 'c.ts'), null);
        const ct = new ClassType(classSig);
        const id1 = ct.getClassSigID();
        const id2 = ct.getClassSigID();
        expect(id1).toBe(id2);
    });

    it('uninterned declaring file signature defaults to ID 0 with error log (mode B\' defensive fallback, no throw)', () => {
        // Pattern B'（工作项 P）：clear FileSignature declaring 未 intern → error log + 置 0（DEFAULT，
        // 复合签名变为 unclear 语义——getDeclaringFileSigID() === 0 使 isUnclear() 为 true）。
        const sig = new ClassSignature('A', new FileSignature('p', 'unregistered.ts'), null);
        expect(sig.getDeclaringFileSigID()).toBe(0);
        expect(sig.isUnclear()).toBe(true);
    });

    it('same signature instance shared by two ClassTypes reuses one temp ID (idempotent register)', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const sizeBefore = reg.tempClassSigCanonicalizer.size();
        const totalBefore = reg.tempClassSigCanonicalizer.totalRegistered();
        const sig = new ClassSignature('Shared', new FileSignature('p', 'f.ts'), null);
        const ct1 = new ClassType(sig);
        const ct2 = new ClassType(sig);
        // 弱注册表：同一实例 → 同一 temp ID（幂等，不产生新条目）；两个 ClassType
        // 各自锚定该实例（存活期重叠，任一存活即条目存活）。
        expect(ct1.getTempSigID()).toBe(ct2.getTempSigID());
        expect(reg.tempClassSigCanonicalizer.size()).toBe(sizeBefore + 1);
        expect(reg.tempClassSigCanonicalizer.totalRegistered()).toBe(totalBefore + 1);
    });

    it('setClassSignature migrating to a registered real signature swaps the anchor to formal', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const fileSig = new FileSignature('p', 'f.ts');
        const fileID = reg.fileSigCanonicalizer.getExistingId(fileSig);
        const sizeBefore = reg.tempClassSigCanonicalizer.size();

        const stubSig = new ClassSignature('Late', fileSig, null);
        const ct = new ClassType(stubSig); // 未注册 → temp
        expect(ct.getClassSigID()).toBe(-1);
        expect(reg.tempClassSigCanonicalizer.size()).toBe(sizeBefore + 1);

        // 真实类后到注册同值签名 → setClassSignature 迁移到 formal。弱注册表语义：
        // 旧 temp 条目不显式移除（stubSig 仍被本用例局部变量锚定，size 不减），
        // 待 GC 回收后由 size() 清扫收敛。
        const arkClass = new ArkClass(fileID);
        arkClass.setSignature(stubSig);
        ct.setClassSignature(stubSig);
        expect(ct.getClassSigID()).toBe(reg.classSigCanonicalizer.getExistingId(stubSig));
        expect(ct.getTempSigID()).toBeUndefined();
        expect(reg.tempClassSigCanonicalizer.getExistingTempId(stubSig)).not.toBe(-1);
    });

    it('value-based lookup resolves after the real class registers (temp hold does not block queries)', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const fileSig = new FileSignature('p', 'f.ts');
        const fileID = reg.fileSigCanonicalizer.getExistingId(fileSig);
        const sig = new ClassSignature('Resolvable', fileSig, null);
        const ct = new ClassType(sig); // 未注册 → 持 temp
        expect(reg.getClassBySig(ct.getClassSignature())).toBeUndefined();

        const arkClass = new ArkClass(fileID);
        arkClass.setSignature(sig); // 真实类后到注册
        // 值查找不受 ClassType 持 temp 影响：经 getClassSignature() 的消费路径解析成功。
        expect(reg.getClassBySig(ct.getClassSignature())).toBe(arkClass);
    });

    it('Builtin shared stubs keep their temp-routing behavior (no formal write)', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const formalSizeBefore = reg.classSigCanonicalizer.size();
        const objectCt = new ClassType(Builtin.OBJECT_CLASS_SIGNATURE);
        // stub（file=DEFAULT）不在 formal（值必未注册）→ temp 兜底，行为与重构前一致。
        expect(objectCt.getClassSigID()).toBe(-1);
        expect(objectCt.getTempSigID()).toBeDefined();
        // 共享实例：两个 ClassType 复用同一 temp ID（幂等 register，无新条目）。
        const objectCt2 = new ClassType(Builtin.OBJECT_CLASS_SIGNATURE);
        expect(objectCt2.getTempSigID()).toBe(objectCt.getTempSigID());
        expect(reg.classSigCanonicalizer.size()).toBe(formalSizeBefore);
    });

    // --- AbstractFieldRef 签名双路由（与 ClassType 同构）---

    it('fieldRef with an unregistered signature routes to temp (no formal write)', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const formalSizeBefore = reg.fieldSigCanonicalizer.size();
        // ID 重载现场构造、值未注册（stub 形态：declaring=0）。
        const sig = new FieldSignature('dynamicProp', 0, UnknownType.getInstance(), false);
        const ref = new ArkInstanceFieldRef(new Local('base'), sig);
        expect(ref.getFieldSigID()).toBe(-1);
        expect(ref.getTempSigID()).toBeDefined();
        expect(reg.fieldSigCanonicalizer.size()).toBe(formalSizeBefore);
        // 锚点直返： getFieldSignature 返回构造时实例（toString 稳定性）。
        expect(ref.getFieldSignature()).toBe(sig);
    });

    it('fieldRef with a registered field signature resolves the formal ID read-only', () => {
        const scene = new Scene();
        const fileSig = new FileSignature('p', 'f.ts');
        const fileID = scene.getFileSigCanonicalizer().getExistingId(fileSig);
        const classSig = new ClassSignature('FieldRefHost', fileSig, null);
        const arkClass = new ArkClass(fileID);
        arkClass.setSignature(classSig);
        // 真实字段注册：ArkField.setSignature（builder 路径）→ ArkClass.addField。
        const arkField = new ArkField(arkClass.getClassSigID());
        arkField.setSignature(new FieldSignature('realField', arkClass.getClassSigID(), NumberType.getInstance(), false));
        arkClass.addField(arkField);

        const ref = new ArkInstanceFieldRef(new Local('base'), arkField.getSignature());
        expect(ref.getFieldSigID()).toBe(arkField.getFieldSigID());
        expect(ref.getTempSigID()).toBeUndefined();
        // formal 路径取回 canonical 实例。
        expect(ref.getFieldSignature()).toBe(arkField.getSignature());
    });

    it('fieldRef setFieldSignature migrates temp to formal when the real field registers later', () => {
        const scene = new Scene();
        const fileSig = new FileSignature('p', 'f.ts');
        const fileID = scene.getFileSigCanonicalizer().getExistingId(fileSig);
        const classSig = new ClassSignature('LateFieldHost', fileSig, null);
        const arkClass = new ArkClass(fileID);
        arkClass.setSignature(classSig);
        const pendingSig = new FieldSignature('lateField', arkClass.getClassSigID(), UnknownType.getInstance(), false);

        const ref = new ArkInstanceFieldRef(new Local('base'), pendingSig);
        expect(ref.getFieldSigID()).toBe(-1);
        expect(ref.getTempSigID()).toBeDefined();

        // 真实字段后到注册（builder/intf 语义）：fieldRef 替换为 canonical 签名 → formal。
        const arkField = new ArkField(arkClass.getClassSigID());
        arkField.setSignature(pendingSig);
        arkClass.addField(arkField);
        // A2：定义点 canonical 回写走 graduateToFormal 快路径（ID 直读）。
        ref.graduateToFormal(arkField.getFieldSigID());
        expect(ref.getFieldSigID()).toBe(arkField.getFieldSigID());
        expect(ref.getTempSigID()).toBeUndefined();
        expect(ref.getFieldSignature()).toBe(arkField.getSignature());
    });

    it('fieldRef same signature instance reuses one temp ID (idempotent register)', () => {
        const sig = new FieldSignature('sharedStubField', 0, UnknownType.getInstance(), false);
        const ref1 = new ArkStaticFieldRef(sig);
        const ref2 = new ArkStaticFieldRef(sig);
        // 弱注册表幂等：同一实例 → 同一 temp ID，无新条目。
        expect(ref1.getTempSigID()).toBe(ref2.getTempSigID());
        expect(ref1.getFieldSigID()).toBe(-1);
        expect(ref2.getFieldSigID()).toBe(-1);
    });

    // --- 三分路由：泛型双视图 / 单向精度栅栏 ---

    /** 在指定类上注册一个 type 为指定类型的真实字段，返回 (class, field)。 */
    function setupFieldWith(className: string, fieldName: string, type: Type): { arkClass: ArkClass; arkField: ArkField } {
        const fileSig = new FileSignature('p', 'f.ts');
        const fileID = reg.fileSigCanonicalizer.getExistingId(fileSig);
        const arkClass = new ArkClass(fileID);
        arkClass.setSignature(new ClassSignature(className, fileSig, null));
        const arkField = new ArkField(arkClass.getClassSigID());
        arkField.setSignature(new FieldSignature(fieldName, arkClass.getClassSigID(), type, false));
        arkClass.addField(arkField);
        return { arkClass, arkField };
    }

    it('generic field: formal identity + realFieldTypes instantiation (R 轮表示迁移)', () => {
        const { arkField } = setupFieldWith('GenericHost', 'value', new GenericType('T'));
        // 新链路形态：定义点签名（type=T，formal 身份）+ ref 上实参表承载使用点实例化。
        const ref = new ArkInstanceFieldRef(new Local('base'), arkField.getSignature());
        ref.setRealFieldTypes([NumberType.getInstance()]);

        // 身份 = 定义点 formal ID；无 temp 注册（原双视图 temp 路由已退役）。
        expect(ref.getFieldSigID()).toBe(arkField.getFieldSigID());
        expect(ref.getTempSigID()).toBeUndefined();
        expect(ref.getFieldSignature()).toBe(arkField.getSignature());
        // 定义点 canonical 不被使用点实例化污染（仍是 T）。
        expect(arkField.getSignature().getType().toString()).toBe('T');
        // getType() 动态组合：T + [number] → number（Expr.realGenericTypes 同构）。
        expect(ref.getType().toString()).toBe('number');
        // 无实例化上下文（static 访问 / 未解析 base）时原样返回定义点 type。
        ref.setRealFieldTypes(undefined);
        expect(ref.getType().toString()).toBe('T');
    });

    it('generic field: two use sites with different instantiations stay independent', () => {
        const { arkField } = setupFieldWith('GenericHost2', 'value', new GenericType('T'));
        const refA = new ArkInstanceFieldRef(new Local('a'), arkField.getSignature());
        refA.setRealFieldTypes([NumberType.getInstance()]);
        const refB = new ArkInstanceFieldRef(new Local('b'), arkField.getSignature());
        refB.setRealFieldTypes([StringType.getInstance()]);

        // 两个使用点共享定义点 canonical（身份一致，签名同为 formal 实例）。
        expect(refA.getFieldSignature()).toBe(arkField.getSignature());
        expect(refB.getFieldSignature()).toBe(arkField.getSignature());
        expect(refA.getFieldSigID()).toBe(arkField.getFieldSigID());
        expect(refB.getFieldSigID()).toBe(arkField.getFieldSigID());
        // per-use 实例化经 getType() 组合——互不干扰，无 first-use 退化。
        expect(refA.getType().toString()).toBe('number');
        expect(refB.getType().toString()).toBe('string');
        // 定义点 canonical 不被任何实例化污染（仍是 T）。
        expect(arkField.getSignature().getType().toString()).toBe('T');
    });

    it('precision fence: unclear canonical type is refined by clear incoming type', () => {
        const { arkField } = setupFieldWith('FenceHost', 'unknownField', UnknownType.getInstance());
        const declClassID = arkField.getDeclaringArkClass().getClassSigID();
        // canonical type = Unknown（unclear）；incoming = number（clear）→ 栅栏放行写穿。
        const ref = new ArkInstanceFieldRef(new Local('base'), new FieldSignature('unknownField', declClassID, NumberType.getInstance(), false));
        expect(ref.getFieldSigID()).toBe(arkField.getFieldSigID());
        expect(ref.getTempSigID()).toBeUndefined();
        // 活视图：canonical 被精确化，fieldRef 与 ArkField 读到同一精化结果。
        expect(ref.getFieldSignature()).toBe(arkField.getSignature());
        expect(ref.getType().toString()).toBe('number');
        expect(arkField.getSignature().getType().toString()).toBe('number');
    });

    it('precision fence: clear canonical type is not regressed by unclear incoming', () => {
        const { arkField } = setupFieldWith('FenceHost2', 'clearField', NumberType.getInstance());
        const declClassID = arkField.getDeclaringArkClass().getClassSigID();
        // canonical type = number（clear）；incoming = Unknown（unclear）→ 栅栏拦截，不倒退。
        const ref = new ArkInstanceFieldRef(new Local('base'), new FieldSignature('clearField', declClassID, UnknownType.getInstance(), false));
        expect(ref.getFieldSigID()).toBe(arkField.getFieldSigID());
        // formal 路径：活视图下读到 canonical（number），不受 unclear incoming 影响。
        expect(ref.getType().toString()).toBe('number');
        expect(arkField.getSignature().getType().toString()).toBe('number');
    });

    it('precision fence: clear canonical type is not overwritten by a different clear type', () => {
        const { arkField } = setupFieldWith('FenceHost3', 'typedField', NumberType.getInstance());
        const declClassID = arkField.getDeclaringArkClass().getClassSigID();
        // canonical = number；incoming = string（同为 clear）→ 竞争拦截，first-precise-wins。
        const ref = new ArkInstanceFieldRef(new Local('base'), new FieldSignature('typedField', declClassID, StringType.getInstance(), false));
        expect(ref.getFieldSigID()).toBe(arkField.getFieldSigID());
        expect(ref.getFieldSignature()).toBe(arkField.getSignature());
        expect(ref.getType().toString()).toBe('number');
    });

    it('invokeExpr with an unregistered stub signature routes to temp (no formal write)', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const formalSizeBefore = reg.methodSigCanonicalizer.size();
        // stub 形态：declaring=0（buildMethodSignatureFromMethodName 产物同型）。
        const stubSig = ArkSignatureBuilder.buildMethodSignatureFromMethodName('dynamicInvoke');
        const expr = new ArkStaticInvokeExpr(stubSig, []);
        expect(expr.getMethodSigID()).toBe(-1);
        expect(expr.getTempSigID()).toBeDefined();
        expect(reg.methodSigCanonicalizer.size()).toBe(formalSizeBefore);
        // 锚点直返：getMethodSignature 返回构造时实例（toString 稳定性）。
        expect(expr.getMethodSignature()).toBe(stubSig);
    });
});

describe('Temp ID Test 2', () => {
    beforeAll(() => {
        SignatureCanonicalizerRegistry.dispose();
    })
    /** 在宿主 file 的类上注册一个真实方法并返回（供 invoke expr 构造签名）。
     *  fileName 仅作区分记录——宿主 FileSignature 一律用已 intern 的 'p/f.ts'
     *  （beforeEach 预注册），确保走 formal-ID 路径（未 intern 的 clear 签名经模式 B' 兜底会进 temp / 置 0）。 */
    function setupMethodWith(fileName: string, className: string, methodName: string, returnType: Type): { method: ArkMethod; subSig: MethodSubSignature } {
        void fileName;
        const scene = new Scene();
        const fileSig = new FileSignature('p', 'f.ts');
        // 挂到真实 ArkFile（updateMethodIndex 需经 getDeclaringArkFile 查语言）。
        const hostFile = new ArkFile(Language.TYPESCRIPT);
        hostFile.setFileSignature(fileSig);
        const fileID = scene.getFileSigCanonicalizer().getExistingId(fileSig);
        const arkClass = new ArkClass(fileID);
        arkClass.setSignature(new ClassSignature(className, fileSig, null));
        hostFile.addArkClass(arkClass);
        const subSig = new MethodSubSignature(methodName, [], returnType, false);
        const method = new ArkMethod(arkClass.getClassSigID());
        method.setImplementationSignature(new MethodSignature(arkClass.getClassSigID(), subSig));
        arkClass.addMethod(method);
        return { method, subSig };
    }

    it('invokeExpr with a registered method signature resolves the formal ID read-only', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const { method } = setupMethodWith('src/ivk-formal.ts', 'InvokeHost', 'invokeMethod', NumberType.getInstance());
        // 值相等的签名（同 class 同 subSig——ID 重载构造，值与 formal 相同）。
        const sig = new MethodSignature(
            method.getSignature().getDeclaringClassSigID(),
            new MethodSubSignature('invokeMethod', [], NumberType.getInstance(), false)
        );
        const expr = new ArkStaticInvokeExpr(sig, []);
        expect(expr.getMethodSigID()).toBe(method.getMethodSigID());
        expect(expr.getTempSigID()).toBeUndefined();
        // B 轮批 3（锚退役）：formal 命中返回 formal canonical（活视图）——
        // 传入实例的值等价副本不再持有（可被 GC）。值与传入实例 equals。
        expect(expr.getMethodSignature()).toBe(reg.methodSigCanonicalizer.get(method.getMethodSigID()!));
        expect(expr.getMethodSignature().equals(sig)).toBe(true);
        expect(expr.getMethodSignature().equals(method.getSignature())).toBe(true);
    });

    it('invokeExpr setMethodSignature migrates temp to formal when the real method registers later', () => {
        const scene = new Scene();
        const fileSig = new FileSignature('p', 'f.ts');
        const fileID = scene.getFileSigCanonicalizer().getExistingId(fileSig);
        const arkClass = new ArkClass(fileID);
        arkClass.setSignature(new ClassSignature('LateInvokeHost', fileSig, null));
        const pendingSubSig = new MethodSubSignature('lateInvoke', [], NumberType.getInstance(), false);
        const pendingSig = new MethodSignature(arkClass.getClassSigID(), pendingSubSig);

        const expr = new ArkStaticInvokeExpr(pendingSig, []);
        expect(expr.getMethodSigID()).toBe(-1);
        expect(expr.getTempSigID()).toBeDefined();

        // 真实方法后到注册：expr 替换为 canonical 签名 → formal。
        const method = new ArkMethod(arkClass.getClassSigID());
        method.setImplementationSignature(pendingSig);
        arkClass.addMethod(method);
        expr.setMethodSignature(method.getSignature());
        expect(expr.getMethodSigID()).toBe(method.getMethodSigID());
        expect(expr.getTempSigID()).toBeUndefined();
        expect(expr.getMethodSignature()).toBe(method.getSignature());
    });

    it('invokeExpr returnType semantics: differing return types are distinct signatures (no fence cross-write)', () => {
        // method 空间与 field 的关键差异：MethodSignature.equals 含 returnType
        //（仅返回类型不同的重载合法分 ID）。因此 "unclear canonical returnType
        // 被 clear incoming 精化" 的栅栏路径在 method 空间不可达——值不相等必
        // miss formal 走 temp，二者是不同方法。本用例固化该语义：
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const { method } = setupMethodWith('src/ivk-fence-a.ts', 'FenceIvkHost', 'target', NumberType.getInstance());
        const classID = method.getSignature().getDeclaringClassSigID();
        // 仅返回类型不同（Unknown vs number）→ 不同 ID → temp 路由，不命中 formal。
        const differingReturn = new MethodSignature(classID, new MethodSubSignature('target', [], UnknownType.getInstance(), false));
        const expr = new ArkStaticInvokeExpr(differingReturn, []);
        expect(expr.getMethodSigID()).toBe(-1);
        expect(expr.getTempSigID()).toBeDefined();
        // formal canonical 的 returnType 不被触碰（无跨方法写穿）。
        expect(method.getSignature().getMethodSubSignature().getReturnType().toString()).toBe('number');
        // 值完全相等（同 returnType）→ formal 只读命中，返回 canonical。
        const sameValue = new MethodSignature(classID, new MethodSubSignature('target', [], NumberType.getInstance(), false));
        const expr2 = new ArkStaticInvokeExpr(sameValue, []);
        expect(expr2.getMethodSigID()).toBe(method.getMethodSigID());
        expect(expr2.getTempSigID()).toBeUndefined();
        void reg;
    });

    it('R10 shared temp signature: one holder migrates, the other resolves via replacement record', () => {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const { method } = setupMethodWith('src/ivk-r10.ts', 'R10Host', 'sharedMethod', NumberType.getInstance());
        // A、B 两个 expr 持同一 stub 实例（值未注册 formal → temp 路由，同实例
        // 复用同一 tempSigID——R10 共享场景）。
        const stubSig = ArkSignatureBuilder.buildMethodSignatureFromMethodName('sharedMethod');
        const exprA = new ArkStaticInvokeExpr(stubSig, []);
        const exprB = new ArkStaticInvokeExpr(stubSig, []);
        const tempId = exprA.getTempSigID()!;
        expect(tempId).toBeDefined();
        expect(exprB.getTempSigID()).toBe(tempId);
        expect(reg.tempMethodSigCanonicalizer.get(tempId)).toBe(stubSig);

        // A 显式迁移（重路由到已注册的 formal 签名）：slot 置空 + 替换记录。
        exprA.setMethodSignature(method.getSignature());
        expect(exprA.getMethodSigID()).toBe(method.getMethodSigID());
        expect(reg.tempMethodSigCanonicalizer.get(tempId)).toBeUndefined();
        expect(reg.tempMethodSigCanonicalizer.getReplacement(tempId)).toBe(method.getMethodSigID());

        // B 未迁移：三级查 fallback——经替换记录拿到 formal 实例 + 惰性物化
        //（methodSigID 写回，tempSigID 保留作"曾 temp"痕迹）。
        expect(exprB.getMethodSigID()).toBe(-1);
        expect(exprB.getMethodSignature()).toBe(method.getSignature());
        expect(exprB.getMethodSigID()).toBe(method.getMethodSigID());
        expect(exprB.getTempSigID()).toBe(tempId);
        // 二次取回走 formal 快路径（已物化）。
        expect(exprB.getMethodSignature()).toBe(method.getSignature());
    });
});
