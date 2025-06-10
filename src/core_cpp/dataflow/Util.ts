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

import { ArkInvokeStmt } from '../base/Stmt';
import { FunctionType } from '../base/Type';
import { ArkMethod } from '../model/ArkMethod';
import { Local } from '../base/Local';
import { AbstractRef, ArkStaticFieldRef, ArkInstanceFieldRef } from '../base/Ref';

export const INTERNAL_PARAMETER_SOURCE: string[] = ['@ohos.app.ability.Want.d.ts: Want'];

export const INTERNAL_SINK_METHOD: string[] = [
    'console.<@%unk/%unk: .log()>',
    'console.<@%unk/%unk: .error()>',
    'console.<@%unk/%unk: .info()>',
    'console.<@%unk/%unk: .warn()>',
    'console.<@%unk/%unk: .assert()>',
];

export function getRecallMethodInParam(stmt: ArkInvokeStmt): ArkMethod | null {
    for (const param of stmt.getInvokeExpr().getArgs()) {
        if (param.getType() instanceof FunctionType) {
            const methodSignature = (param.getType() as FunctionType).getMethodSignature();
            const method = stmt.getCfg()?.getDeclaringMethod().getDeclaringArkClass().getMethod(methodSignature);
            if (method) {
                return method;
            }
        }
    }
    return null;
}

export function LocalEqual(local1: Local, local2: Local): boolean {
    if (local1.getName() === 'this' && local2.getName() === 'this') {
        return true;
    }
    const method1 = local1.getDeclaringStmt()?.getCfg()?.getDeclaringMethod();
    const method2 = local2.getDeclaringStmt()?.getCfg()?.getDeclaringMethod();
    const nameEqual = local1.getName() === local2.getName();
    return method1 === method2 && nameEqual;
}

export function RefEqual(ref1: AbstractRef, ref2: AbstractRef): boolean {
    if (ref1 instanceof ArkStaticFieldRef && ref2 instanceof ArkStaticFieldRef) {
        return ref1.getFieldSignature().toString() === ref2.getFieldSignature().toString();
    } else if (ref1 instanceof ArkInstanceFieldRef && ref2 instanceof ArkInstanceFieldRef) {
        return LocalEqual(ref1.getBase(), ref2.getBase()) && ref1.getFieldSignature().toString() === ref2.getFieldSignature().toString();
    }
    return false;
}
