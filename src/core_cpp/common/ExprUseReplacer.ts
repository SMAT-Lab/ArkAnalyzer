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

import {
    AbstractBinopExpr,
    AbstractExpr,
    AbstractInvokeExpr,
    ArkAwaitExpr,
    ArkCastExpr,
    ArkDeleteExpr,
    ArkInstanceInvokeExpr,
    ArkInstanceOfExpr,
    ArkNewArrayExpr,
    ArkPtrInvokeExpr,
    ArkTypeOfExpr,
    ArkUnopExpr,
    ArkYieldExpr,
} from '../base/Expr';
import { Local } from '../base/Local';
import { Value } from '../base/Value';
import { AbstractFieldRef } from '../base/Ref';

/**
 * Replace old use of a Expr inplace
 */
export class ExprUseReplacer {
    private oldUse: Value;
    private newUse: Value;

    constructor(oldUse: Value, newUse: Value) {
        this.oldUse = oldUse;
        this.newUse = newUse;
    }

    public caseExpr(expr: AbstractExpr): void {
        if (expr instanceof AbstractBinopExpr) {
            this.caseBinopExpr(expr);
        } else if (expr instanceof AbstractInvokeExpr) {
            this.caseInvokeExpr(expr);
        } else if (expr instanceof ArkNewArrayExpr) {
            this.caseNewArrayExpr(expr);
        } else if (expr instanceof ArkTypeOfExpr) {
            this.caseTypeOfExpr(expr);
        } else if (expr instanceof ArkInstanceOfExpr) {
            this.caseInstanceOfExpr(expr);
        } else if (expr instanceof ArkCastExpr) {
            this.caseCastExpr(expr);
        } else if (expr instanceof ArkAwaitExpr) {
            this.caseAwaitExpr(expr);
        } else if (expr instanceof ArkYieldExpr) {
            this.caseYieldExpr(expr);
        } else if (expr instanceof ArkDeleteExpr) {
            this.caseDeleteExpr(expr);
        } else if (expr instanceof ArkUnopExpr) {
            this.caseUnopExpr(expr);
        }
    }

    private caseBinopExpr(expr: AbstractBinopExpr): void {
        if (expr.getOp1() === this.oldUse) {
            expr.setOp1(this.newUse);
        }
        if (expr.getOp2() === this.oldUse) {
            expr.setOp2(this.newUse);
        }
    }

    private caseInvokeExpr(expr: AbstractInvokeExpr): void {
        let args = expr.getArgs();
        for (let i = 0; i < args.length; i++) {
            if (args[i] === this.oldUse) {
                args[i] = this.newUse;
            }
        }

        if (expr instanceof ArkInstanceInvokeExpr && expr.getBase() === this.oldUse) {
            expr.setBase(<Local> this.newUse);
        } else if (expr instanceof ArkPtrInvokeExpr && expr.getFuncPtrLocal() === this.oldUse && this.newUse instanceof Local) {
            expr.setFunPtrLocal(this.newUse);
        }
    }

    private caseNewArrayExpr(expr: ArkNewArrayExpr): void {
        if (expr.getSize() === this.oldUse) {
            expr.setSize(this.newUse);
        }
    }

    private caseTypeOfExpr(expr: ArkTypeOfExpr): void {
        if (expr.getOp() === this.oldUse) {
            expr.setOp(this.newUse);
        }
    }

    private caseInstanceOfExpr(expr: ArkInstanceOfExpr): void {
        if (expr.getOp() === this.oldUse) {
            expr.setOp(this.newUse);
        }
    }

    private caseCastExpr(expr: ArkCastExpr): void {
        if (expr.getOp() === this.oldUse) {
            expr.setOp(this.newUse);
        }
    }

    private caseAwaitExpr(expr: ArkAwaitExpr): void {
        if (expr.getPromise() === this.oldUse) {
            expr.setPromise(this.newUse);
        }
    }

    private caseDeleteExpr(expr: ArkDeleteExpr): void {
        if (expr.getField() === this.oldUse) { //&& this.newUse instanceof AbstractFieldRef (delete对象不一定是域成员)
            expr.setField(this.newUse);
        }
    }

    private caseYieldExpr(expr: ArkYieldExpr): void {
        if (expr.getYieldValue() === this.oldUse) {
            expr.setYieldValue(this.newUse);
        }
    }

    private caseUnopExpr(expr: ArkUnopExpr): void {
        if (expr.getOp() === this.oldUse) {
            expr.setOp(this.newUse);
        }
    }
}
