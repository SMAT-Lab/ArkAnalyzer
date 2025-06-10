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

import { ClassSignature, FieldSignature, FileSignature, MethodSignature, MethodSubSignature } from '../ArkSignature';
import { UnknownType } from '../../base/Type';

export class ArkSignatureBuilder {
    public static buildMethodSignatureFromClassNameAndMethodName(className: string, methodName: string, staticFlag: boolean = false): MethodSignature {
        const classSignature = this.buildClassSignatureFromClassName(className);
        const methodSubSignature = this.buildMethodSubSignatureFromMethodName(methodName, staticFlag);
        return new MethodSignature(classSignature, methodSubSignature);
    }

    public static buildMethodSignatureFromMethodName(methodName: string, staticFlag: boolean = false): MethodSignature {
        const methodSubSignature = this.buildMethodSubSignatureFromMethodName(methodName, staticFlag);
        return new MethodSignature(ClassSignature.DEFAULT, methodSubSignature);
    }

    public static buildMethodSubSignatureFromMethodName(methodName: string, staticFlag: boolean = false): MethodSubSignature {
        return new MethodSubSignature(methodName, [], UnknownType.getInstance(), staticFlag);
    }

    public static buildClassSignatureFromClassName(className: string): ClassSignature {
        return new ClassSignature(className, FileSignature.DEFAULT);
    }

    public static buildFieldSignatureFromFieldName(fieldName: string, staticFlag: boolean = false): FieldSignature {
        return new FieldSignature(fieldName, ClassSignature.DEFAULT, UnknownType.getInstance(), staticFlag);
    }
}
