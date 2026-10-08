/*
 * Copyright (c) 2024-2025 Huawei Device Co., Ltd.
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

import { ClassSignature, FieldSignature, MethodSignature, MethodSubSignature } from '../ArkSignature';
import { UnknownType } from '../../base/Type';
import { COMPONENT_CUSTOMVIEW, COMPONENT_IF, COMPONENT_REPEAT, isEtsSystemComponent } from '../../common/EtsConst';

export class ArkSignatureBuilder {
    /**
     * Stub 缓存白名单（组件名域）：系统组件（isEtsSystemComponent 动态集合，SDK 构建期灌入全量）+ 组件常量（自定义组件折叠名 / If / Repeat）。
     * 白名单外的名字（new 表达式类名、C++ 类型名等任意来源）不缓存——每次 new，行为不变。
     */
    private static readonly CACHEABLE_COMPONENT_STUBS = new Set<string>([COMPONENT_CUSTOMVIEW, COMPONENT_IF, COMPONENT_REPEAT]);

    /** 白名单内同名 stub 共享实例。 */
    private static readonly componentStubCache = new Map<string, ClassSignature>();

    public static buildMethodSignatureFromClassNameAndMethodName(className: string, methodName: string, staticFlag: boolean = false): MethodSignature {
        const classSignature = this.buildClassSignatureFromClassName(className);
        const methodSubSignature = this.buildMethodSubSignatureFromMethodName(methodName, staticFlag);
        // Object path: the stub class signature (unclear) is routed to the temp canonicalizer
        // inside the constructor — no formal interning without a model.
        return new MethodSignature(classSignature, methodSubSignature);
    }

    public static buildMethodSignatureFromMethodName(methodName: string, staticFlag: boolean = false): MethodSignature {
        const methodSubSignature = this.buildMethodSubSignatureFromMethodName(methodName, staticFlag);
        return new MethodSignature(0, methodSubSignature);
    }

    public static buildMethodSubSignatureFromMethodName(methodName: string, staticFlag: boolean = false): MethodSubSignature {
        return new MethodSubSignature(methodName, [], UnknownType.getInstance(), staticFlag);
    }

    public static buildClassSignatureFromClassName(className: string): ClassSignature {
        // 白名单内的组件名走共享缓存；名单外（任意类名）保持每次 new 的现状。
        if (isEtsSystemComponent(className) || this.CACHEABLE_COMPONENT_STUBS.has(className)) {
            let cached = this.componentStubCache.get(className);
            if (cached === undefined) {
                cached = new ClassSignature(className, 0);
                this.componentStubCache.set(className, cached);
            }
            return cached;
        }
        return new ClassSignature(className, 0);
    }

    /** @internal Registry dispose 同点清理（Scene.dispose/clear 调用）。 */
    public static clearComponentStubCache(): void {
        this.componentStubCache.clear();
    }

    public static buildFieldSignatureFromFieldName(fieldName: string, staticFlag: boolean = false): FieldSignature {
        return new FieldSignature(fieldName, 0, UnknownType.getInstance(), staticFlag);
    }
}
