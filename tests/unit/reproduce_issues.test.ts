// ArkAnalyzer 核心缺陷复现测试

import { describe, it, expect } from 'vitest';
import { BigIntConstant } from '../../src/core/base/Constant';
import { BooleanType } from '../../src/core/base/Type';
import {
    MethodSubSignature,
    MethodSignature,
    methodSubSignatureCompare,
    ClassSignature,
    FileSignature
} from '../../src/core/model/ArkSignature';
import { ArkField, FieldCategory } from '../../src/core/model/ArkField';
import { ArkClass, ClassCategory } from '../../src/core/model/ArkClass';
import { ArkFile, Language } from '../../src/core/model/ArkFile';
import { ArkNamespace } from '../../src/core/model/ArkNamespace';
import { ArkBody } from '../../src/core/model/ArkBody';
import { Local } from '../../src/core/base/Local';
import { NamespaceSignature } from '../../src/core/model/ArkSignature';
import { Cfg } from '../../src/core/graph/Cfg';

describe('ArkAnalyzer 核心缺陷复现', () => {

    // Bug 1: BigIntConstant 缺少 n 后缀
    it('Bug 1: BigIntConstant 无法区分普通数字', () => {
        const bi = new BigIntConstant(BigInt(123));
        expect(bi.toString()).toBe('123n');
    });

    // Bug 2: 静态/实例方法签名比较缺少 static 判断
    it('Bug 2: 静态方法与实例方法签名无法区分', () => {
        const params: any[] = [];
        const retType = BooleanType.getInstance();
        const staticSig = new MethodSubSignature('foo', params, retType, true);
        const instanceSig = new MethodSubSignature('foo', params, retType, false);
        expect(methodSubSignatureCompare(staticSig, instanceSig)).toBe(false);
    });

    // Bug 3: 方法签名字符串缺少返回值
    it('Bug 3: 方法签名字符串缺少返回值信息', () => {
        const fileSig = new FileSignature('test', 'test.ts');
        const classSig = new ClassSignature('TestClass', fileSig);
        const subSig = new MethodSubSignature('foo', [], BooleanType.getInstance(), false);
        const methodSig = new MethodSignature(classSig, subSig);
        expect(methodSig.toString()).toContain('boolean');
    });

    // Bug 4: setLocals 合并而非替换
    it('Bug 4: setLocals 错误地追加而非替换', () => {
        const cfg = new Cfg();
        const body = new ArkBody(new Set(), cfg);
        const local1 = new Local('a');
        const local2 = new Local('b');
        body.setLocals(new Set([local1]));
        expect(body.getLocals().has('a')).toBe(true);
        body.setLocals(new Set([local2]));
        expect(body.getLocals().has('a')).toBe(false);
        expect(body.getLocals().has('b')).toBe(true);
    });

    // Bug 5: 接口字段 isPublic 判断缺少 INTERFACE 分支
    it('Bug 5: 接口字段被错误判定为非 public', () => {
        const file = new ArkFile(Language.TYPESCRIPT);
        const cls = new ArkClass();
        cls.setCategory(ClassCategory.INTERFACE);
        cls.setDeclaringArkFile(file);
        const field = new ArkField();
        field.setDeclaringArkClass(cls);
        field.setCategory(FieldCategory.PROPERTY_DECLARATION);
        expect(field.isPublic()).toBe(true);
    });

    // Bug 6: getStaticFields 遍历所有类导致作用域泄露
    it('Bug 6: getStaticFields 返回了其他类的静态字段', () => {
        const file = new ArkFile(Language.TYPESCRIPT);
        const fileSig = new FileSignature('test', 'test.ts');
        file.setFileSignature(fileSig);
        const cls1Sig = new ClassSignature('Class1', fileSig);
        const cls1 = new ArkClass();
        cls1.setSignature(cls1Sig);
        cls1.setDeclaringArkFile(file);
        const cls2Sig = new ClassSignature('Class2', fileSig);
        const cls2 = new ArkClass();
        cls2.setSignature(cls2Sig);
        const staticField = new ArkField();
        const fieldSig = new (require('../../src/core/model/ArkSignature').FieldSignature)(
            cls2Sig, 'staticVar', BooleanType.getInstance()
        );
        staticField.setSignature(fieldSig);
        staticField.addModifier(16); // ModifierType.STATIC
        cls2.addField(staticField);
        const classMap = new Map();
        classMap.set(fileSig, [cls1, cls2]);
        const fields = cls1.getStaticFields(classMap);
        expect(fields.length).toBe(0);
    });


    // Bug 7: ArkNamespace.addNamespace() 覆盖同名空间
    it('Bug 7: 同名命名空间会被覆盖 (测试失败证明 Bug 存在)', () => {
        const fileSig = new FileSignature('test', 'test.ts');
        const ns1 = new ArkNamespace();
        const nsSig1 = new NamespaceSignature('sub', fileSig);
        ns1.setSignature(nsSig1);

        const ns2 = new ArkNamespace();
        const nsSig2 = new NamespaceSignature('sub', fileSig);
        ns2.setSignature(nsSig2);

        const parent = new ArkNamespace();
        parent.addNamespace(ns1);
        parent.addNamespace(ns2);

        // TypeScript 允许同名命名空间合并，期望保留两个或合并内容
        // 正确做法：parent.getNamespaces().length 应该 >= 1，或支持获取所有同名空间
        const retrieved = parent.getNamespaceWithName('sub');

        // 期望能找到 ns1 或合并后的命名空间（应包含 ns1 的内容）
        // 当前实现直接覆盖，只能找到 ns2
        expect(retrieved).toBe(ns1); // 测试失败证明 ns1 被覆盖了
    });

    // Bug 8: getClassWithName 只查找顶层忽略命名空间
    it('Bug 8: 无法获取命名空间内的类 (测试失败证明 Bug 存在)', () => {
        const file = new ArkFile(Language.TYPESCRIPT);
        const fileSig = new FileSignature('test', 'test.ts');
        file.setFileSignature(fileSig);
        const ns = new ArkNamespace();
        const nsSig = new NamespaceSignature('MySpace', fileSig);
        ns.setSignature(nsSig);
        ns.setDeclaringArkFile(file);
        const clsSig = new ClassSignature('InnerClass', fileSig);
        const cls = new ArkClass();
        cls.setSignature(clsSig);
        ns.addArkClass(cls);
        file.addNamespace(ns);
        expect(file.getClassWithName('InnerClass')).not.toBeNull();
    });

});
