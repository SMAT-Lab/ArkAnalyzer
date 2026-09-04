/*
 * Copyright (c) 2024-2026 Huawei Device Co., Ltd.
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

import { ClassSignature, MethodSignature, MethodSubSignature } from '../model/ArkSignature';
import { ClassType, GenericType, StringType, UnknownType } from '../base/Type';
import { Scene } from '../../Scene';
import { ArkClass } from '../model/ArkClass';
import { SignatureCanonicalizerRegistry } from './SignatureCanonicalizerRegistry';

/**
 * Built-in class name constants and signature stubs.
 *
 * Signatures created here are **unclear stubs** (declaring file = FileSignature.DEFAULT) that
 * live in the temp canonicalizer. During type inference they are resolved to the real SDK
 * signatures via the built-in library (see TypeInference.inferBaseType → scene.getSdkGlobal);
 * when the SDK is unavailable (enableBuiltIn=false) they remain unresolved in temp space and
 * are reported by checkTempSignatureCompleteness.
 */
export class Builtin {
    // built-in classes
    public static OBJECT = 'Object';
    public static ARRAY = 'Array';
    public static MAP = 'Map';
    public static SET = 'Set';
    public static REGEXP = 'RegExp';
    public static BIGINT = 'BigInt';
    public static FUNCTION = 'Function';

    // constants for iterator
    public static ITERATOR_FUNCTION = 'Symbol.iterator';
    public static ITERATOR = 'IterableIterator';
    public static ITERATOR_NEXT = 'next';
    public static ITERATOR_RESULT = 'IteratorResult';
    public static ITERATOR_RESULT_DONE = 'done';
    public static ITERATOR_RESULT_VALUE = 'value';

    // constants for string
    public static TO_STRING = 'toString';

    // constants for array
    public static SLICE = 'slice';
    public static CONCAT = 'concat';

    // --- Stable unclear stubs (shared per name) ---

    /**
     * Lazy per-name cache of unclear stub signatures. Stubs hold no registry-dependent state
     * (the declaring file SigID is the literal 0, rebuilt as DEFAULT in every registry
     * lifecycle), so the instances are dispose-stable: after dispose(), the rebuilt temp
     * canonicalizer assigns them fresh IDs via its new objectIdentity symbol (the old symbol
     * property is cleaned by Canonicalizer.clear()).
     */
    private static stubCache: Map<string, ClassSignature> = new Map();

    /** Unclear stub signature for a built-in class name (shared instance per name). */
    public static getBuiltinClassSignature(className: string): ClassSignature {
        let stub = this.stubCache.get(className);
        if (stub === undefined) {
            stub = new ClassSignature(className, 0, undefined);
            this.stubCache.set(className, stub);
        }
        return stub;
    }

    /** @internal Snapshot of the cached unclear stubs — the validator's reachability baseline
     * for the temp class space (stubs are legitimately held by this cache; they are producers,
     * not holders with a temp registration mark, so they are exempt from anchor checks). */
    public static getStubCacheEntries(): ClassSignature[] {
        return Array.from(this.stubCache.values());
    }

    public static get OBJECT_CLASS_SIGNATURE(): ClassSignature {
        return this.getBuiltinClassSignature(this.OBJECT);
    }
    public static get OBJECT_CLASS_TYPE(): ClassType {
        return new ClassType(this.OBJECT_CLASS_SIGNATURE);
    }
    public static get ARRAY_CLASS_SIGNATURE(): ClassSignature {
        return this.getBuiltinClassSignature(this.ARRAY);
    }
    public static get REGEXP_CLASS_SIGNATURE(): ClassSignature {
        return this.getBuiltinClassSignature(this.REGEXP);
    }
    public static get REGEXP_CLASS_TYPE(): ClassType {
        return new ClassType(this.REGEXP_CLASS_SIGNATURE);
    }

    public static get ITERATOR_CLASS_SIGNATURE(): ClassSignature {
        return this.getBuiltinClassSignature(this.ITERATOR);
    }
    public static get ITERATOR_RESULT_CLASS_SIGNATURE(): ClassSignature {
        return this.getBuiltinClassSignature(this.ITERATOR_RESULT);
    }
    public static get ITERATOR_CLASS_TYPE(): ClassType {
        return new ClassType(this.ITERATOR_CLASS_SIGNATURE, [new GenericType('T')]);
    }
    public static get ITERATOR_RESULT_CLASS_TYPE(): ClassType {
        return new ClassType(this.ITERATOR_RESULT_CLASS_SIGNATURE, [new GenericType('T')]);
    }

    /**
     * The stub method signature for `toString` on Object. Each access returns a fresh
     * MethodSignature over the shared Object stub.
     *
     * round28 教训存档（三轮归因演进，勿再尝试单例化）：
     * - 首轮单例化 → ArkIRTransformer literal/closure + JsonPrinter 三处
     *   String/Number.toString 互换，归因"mutate 污染面"后回退；
     * - r2 复查归因"stale declaringClassTempSigID"并挂 dispose 清理链恢复——
     *   实测仍互换（literal 用例单跑复现，同 Registry 生命周期内，排除 stale）；
     * - r3 实证定案：**共享 temp 行的归宿被第一解析者垄断**——route() 幂等注册
     *   使多个 placeholder 的 toString expr 汇聚同一 temp 行，第一解析者
     *   setMethodSignature 触发 retireWithReplacement(T, F) 全局定向，跟随者
     *   getMethodSignature() 三级查物化跟随 F。而 toString 的真实归宿取决于
     *   **各 expr 自己的 base 类型**（string→String.toString / number→
     *   Number.toString），共享实例在语义上就是错的。COW/挂 dispose 均无法防御
     *   （这不是 mutate，是 temp 表替换记录语义）。每次 new = 每行独立 = 各自
     *   正确归宿，这是该 stub 的正确形态。
     */
    public static get TO_STRING_METHOD_SIGNATURE(): MethodSignature {
        return new MethodSignature(this.OBJECT_CLASS_SIGNATURE, new MethodSubSignature(this.TO_STRING, [], StringType.getInstance(), false));
    }

    private static arrayStubMethodSignatures = new Map<string, MethodSignature>();

    /**
     * @internal round28：Array stub 方法签名缓存清理（ModelUtils.dispose 调用——
     * MethodSignature 的 declaringClassTempSigID 构造时固化，跨 Registry 复用会
     * stale；toString 恒每次 new、iterator/next 恒每循环 new，均无缓存可清）。
     * slice stub 与 componentMethodSigCache 为白名单族（键含完整身份、归宿
     * per-use 无关），挂清理链后实证保留。
     */
    public static clearStubMethodSigCaches(): void {
        this.arrayStubMethodSignatures.clear();
    }

    /**
     * Array stub 方法签名（不查 SDK——`(Array stub, name)` 恒 stub 值）的
     * per-name 实例缓存（round28 M1）。与 {@link buildArrayMethodSignature}
     * 的 miss 分支同款构造与缓存，供"必须 stub 值"的调用方（数组解构 rest 的
     * slice 等）复用——原每次 new 一行 temp。
     */
    public static getOrCreateArrayStubMethodSignature(methodName: string): MethodSignature {
        let sig = this.arrayStubMethodSignatures.get(methodName);
        if (sig === undefined) {
            sig = new MethodSignature(Builtin.ARRAY_CLASS_SIGNATURE, new MethodSubSignature(methodName, [], UnknownType.getInstance(), false));
            this.arrayStubMethodSignatures.set(methodName, sig);
        }
        return sig;
    }

    public static buildArrayMethodSignature(methodName: string, scene: Scene): MethodSignature {
        let methodSignature = this.getBuiltInMethodSignature(Builtin.ARRAY, methodName, scene);
        if (!methodSignature) {
            // Object path over the Array stub: routes the unclear declaring class to temp.
            // round28 M1：miss 分支的 stub 实例走 per-name 缓存。
            methodSignature = this.getOrCreateArrayStubMethodSignature(methodName);
        }
        return methodSignature;
    }

    public static getBuiltInMethodSignature(className: string, methodName: string, scene: Scene): MethodSignature | undefined {
        const globalClass = SignatureCanonicalizerRegistry.getSdkGlobal(className);
        if (globalClass instanceof ArkClass) {
            return globalClass.getMethodWithName(methodName)?.getSignature();
        }
        return undefined;
    }
}
