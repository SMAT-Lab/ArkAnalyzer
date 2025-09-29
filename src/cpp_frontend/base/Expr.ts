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

import { AbstractExpr, ArkCastExpr } from '../../core/base/Expr';
import { Value } from '../../core/base/Value';
import { NumberType, Type } from '../../core/base/Type';
import { ArkMethod } from '../../core/model/ArkMethod';
import { AbstractRef } from '../../core/base/Ref';

export class ArkSizeOfExpr extends AbstractExpr {
    private op: Value;

    constructor(op: Value) {
        super();
        this.op = op;
    }

    public getOp(): Value {
        return this.op;
    }

    public setOp(newOp: Value): void {
        this.op = newOp;
    }

    public getUses(): Value[] {
        let uses: Value[] = [];
        uses.push(this.op);
        uses.push(...this.op.getUses());
        return uses;
    }

    public getOpType(): Type {
        return this.op.getType();
    }

    public getType(): Type {
        return NumberType.getInstance();
    }

    public toString(): string {
        return 'sizeof(' + this.op + ')';
    }

    public inferType(arkMethod: ArkMethod): AbstractExpr {
        if (this.op instanceof AbstractRef || this.op instanceof AbstractExpr) {
            this.op.inferType(arkMethod);
        }
        return this;
    }
}

export class ArkCxxCastExpr extends ArkCastExpr {
    private cxxCastType: string;
    constructor(op: Value, type: Type, cxxCastType: string) {
        super(op, type);
        this.cxxCastType = cxxCastType;
    }
    public getCxxCastType(): string {
        return this.cxxCastType;
    }
    public toString(): string {
        return `<${this.cxxCastType}: ${this.getType()}>${this.getOp()}` ;
    }

    public inferType(arkMethod: ArkMethod): AbstractExpr {
        let op = this.getOp();
        if (op instanceof AbstractRef || op instanceof AbstractExpr) {
            op.inferType(arkMethod);
        }
        return this;
    }
}