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
import { SdkUtils } from './SdkUtils';

/**
 * Built-in class name constants and signature stubs.
 *
 * Signatures created here are **unclear stubs** (declaring file = FileSignature.DEFAULT) that
 * live in the temp canonicalizer. During type inference they are resolved to the real SDK
 * signatures via the built-in library (see TypeInference.inferBaseType →
 * SdkUtils.getSdkGlobal);
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
     * 教训存档，勿再尝试单例化
     */
    public static get TO_STRING_METHOD_SIGNATURE(): MethodSignature {
        return new MethodSignature(this.OBJECT_CLASS_SIGNATURE, new MethodSubSignature(this.TO_STRING, [], StringType.getInstance(), false));
    }

    private static arrayStubMethodSignatures = new Map<string, MethodSignature>();

    public static clearStubMethodSigCaches(): void {
        this.arrayStubMethodSignatures.clear();
    }

    /**
     * Array stub 方法签名（不查 SDK——`(Array stub, name)` 恒 stub 值）的 per-name 实例缓存
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
            methodSignature = this.getOrCreateArrayStubMethodSignature(methodName);
        }
        return methodSignature;
    }

    public static getBuiltInMethodSignature(className: string, methodName: string, scene: Scene): MethodSignature | undefined {
        const globalClass = SdkUtils.getSdkGlobal(className);
        if (globalClass instanceof ArkClass) {
            return globalClass.getMethodWithName(methodName)?.getSignature();
        }
        return undefined;
    }
}
