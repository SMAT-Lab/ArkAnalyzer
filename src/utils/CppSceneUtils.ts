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

import { ArkFile } from '../core/model/ArkFile';
import path from 'path';
import { FileSignature } from '../core/model/ArkSignature';
import { ModelUtils } from '../core/common/ModelUtils';
import { ArkAssignStmt, ArkInvokeStmt, Stmt } from '../core/base/Stmt';
import { ArkMethod } from '../core/model/ArkMethod';
import { Constant } from '../core/base/Constant';
import { ArkClass } from '../core/model/ArkClass';
import { Value } from '../core/base/Value';
import { Local } from '../core/base/Local';
import { ArkArrayRef } from '../core/base/Ref';
import { ArkField } from '../core/model/ArkField';
import { FunctionType } from '../core/base/Type';
import { CONSTRUCTOR_NAME } from '../core/common/TSConst';

export class CppSceneUtils {
    public static puncture(cppModulePath: string, tsFile: ArkFile): void {
        const fileName = path.relative(tsFile.getProjectDir(), path.join(cppModulePath, '../../napi_init.cpp'));
        const initFile = tsFile.getScene().getFile(new FileSignature(tsFile.getProjectName(), fileName));
        if (!initFile) {
            return;
        }
        const ts2CppFuncMap = initFile.getDefaultClass().getTs2CppFuncMap();
        const methods = ModelUtils.getAllMethodsInFile(initFile);
        for (const method of methods) {
            const stmts = method.getCfg()?.getStmts();
            if (!stmts) {
                continue;
            }
            for (const stmt of stmts) {
                if (stmt instanceof ArkInvokeStmt) {
                    this.processApiDefine(stmt, tsFile, ts2CppFuncMap);
                }
            }
        }
    }

    private static processApiDefine(stmt: ArkInvokeStmt, tsFile: ArkFile, ts2CppFuncMap: Map<string, ArkMethod[]>): void {
        const invokeExpr = stmt.getInvokeExpr();
        const methodName = invokeExpr.getMethodSignature().getMethodSubSignature().getMethodName();
        const clsConstant = invokeExpr.getArg(1);
        if (methodName === 'napi_define_class' && clsConstant instanceof Constant) {
            const tsClass = tsFile.getClassWithName(clsConstant.getValue());
            if (!tsClass) {
                return;
            }
            const props = invokeExpr.getArg(6);
            this.findPropDesc(props, ts2CppFuncMap, tsClass);
            const arkMethods = ts2CppFuncMap.get(clsConstant.getValue());
            if (arkMethods?.length === 1) {
                this.mergeMethod(CONSTRUCTOR_NAME, tsClass, arkMethods[0]);
            }
        } else if (methodName === 'napi_define_properties') {
            const tsClass = tsFile.getDefaultClass();
            const props = invokeExpr.getArg(3);
            this.findPropDesc(props, ts2CppFuncMap, tsClass);
        }
    }

    private static findPropDesc(props: Value, ts2CppFuncMap: Map<string, ArkMethod[]>, tsClass: ArkClass): void {
        this.getUsedStmts(this.getDeclaredAssignStmt(props)?.getRightOp())?.forEach(x => {
            if (x instanceof ArkAssignStmt && x.getLeftOp() instanceof ArkArrayRef) {
                this.getUsedStmts(x.getRightOp())?.forEach(s => {
                    this.processPropDesc(s, ts2CppFuncMap, tsClass);
                });
            }
        });
    }

    private static processPropDesc(s: Stmt, ts2CppFuncMap: Map<string, ArkMethod[]>, tsClass: ArkClass): void {
        if (s instanceof ArkInvokeStmt) {
            const constant = s.getInvokeExpr().getArg(0);
            if (constant instanceof Constant) {
                const tsMtdName = constant.getValue();
                const arkMethods = ts2CppFuncMap.get(tsMtdName);
                if (arkMethods?.length === 1) {
                    this.mergeMethod(tsMtdName, tsClass, arkMethods[0]);
                } else if (arkMethods?.length === 2) {
                    this.mergeMethod('Get-' + tsMtdName, tsClass, arkMethods[0]);
                    this.mergeMethod('Set-' + tsMtdName, tsClass, arkMethods[1]);
                }
            }
        }
    }

    private static getDeclaredAssignStmt(value?: Value): ArkAssignStmt | undefined {
        if (value instanceof Local) {
            const declaringStmt = value.getDeclaringStmt();
            if (declaringStmt instanceof ArkAssignStmt) {
                return declaringStmt;
            }
        }
    }

    private static getUsedStmts(value?: Value): Stmt[] | undefined {
        if (value instanceof Local) {
            return value.getUsedStmts();
        }
    }

    private static mergeMethod(tsMtdName: string, tsClass: ArkClass, cppMtd: ArkMethod): void {
        let tsMtd = ModelUtils.findArkModel(tsMtdName, tsClass);
        if (tsMtd instanceof Local || tsMtd instanceof ArkField) {
            const type = tsMtd.getType();
            if (type instanceof FunctionType) {
                tsMtd = tsClass.getDeclaringArkFile().getScene().getMethod(type.getMethodSignature());
            }
        }
        if (tsMtd instanceof ArkMethod && cppMtd.getBody()) {
            tsMtd.setImplementationSignature(cppMtd.getSignature());
            tsMtd.setBody(cppMtd.getBody()!);
        }
    }
}
