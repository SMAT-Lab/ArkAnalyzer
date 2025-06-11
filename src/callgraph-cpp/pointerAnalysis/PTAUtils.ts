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

import { ClassSignature, MethodSignature } from '../../core/model/ArkSignature';

export function IsCollectionClass(classSignature: ClassSignature): boolean {
    if (classSignature.toString().endsWith('lib.es2015.collection.d.ts: Set') || classSignature.toString().endsWith('lib.es2015.collection.d.ts: Map')) {
        return true;
    }
    return false;
}

export enum BuiltApiType {
    SetAdd,
    MapSet,
    FunctionCall,
    FunctionApply,
    FunctionBind,
    NotBuiltIn,
}

export function getBuiltInApiType(method: MethodSignature): BuiltApiType {
    let methodSigStr = method.toString();

    const regex = /lib\.es5\.d\.ts: Function\.(call|apply|bind)\(/;

    if (methodSigStr.endsWith('lib.es2015.collection.d.ts: Set.add(T)')) {
        return BuiltApiType.SetAdd;
    } else if (methodSigStr.endsWith('lib.es2015.collection.d.ts: Map.set(K, V)')) {
        return BuiltApiType.MapSet;
    } else {
        const match = methodSigStr.match(regex);
        if (match) {
            const functionName = match[1];
            switch (functionName) {
                case 'call':
                    return BuiltApiType.FunctionCall;
                case 'apply':
                    return BuiltApiType.FunctionApply;
                case 'bind':
                    return BuiltApiType.FunctionBind;
                default:
            }
        }
    }

    return BuiltApiType.NotBuiltIn;
}
