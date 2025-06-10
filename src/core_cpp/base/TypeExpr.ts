/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
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

import { Value } from './Value';
import { ArkMethod } from '../model/ArkMethod';
import { IntersectionType, Type, UnionType, UnknownType } from './Type';
import { IRInference } from '../common/IRInference';
import { ArkBaseModel } from '../model/ArkBaseModel';
import { ModelUtils } from '../common/ModelUtils';
import { ArkClass } from '../model/ArkClass';

/**
 * abstract type expr represents the type operations of types or values.
 * AbstractTypeExpr is different from AbstractExpr.
 * @category core/base/typeExpr
 * @extends Type
 * @example
 *  ```typescript
 *  let a = number;
 *  type A = typeof a;
 *  let b: keyof typeof a;
 *  ```
 */
export abstract class AbstractTypeExpr extends Type {
    abstract getUses(): Value[];

    abstract getType(): Type;

    public inferType(arkMethod: ArkMethod): void {
        return;
    }
}

/**
 * typeQuery type expr represents the get type of value with typeof.
 * @category core/base/typeExpr
 * @extends AbstractTypeExpr
 * @example
 ```typescript
 // opValue is a and type A is number
 let a = number;
 type A = typeof a;
 ```
 */

export class TypeQueryExpr extends AbstractTypeExpr {
    private opValue: Value | ArkBaseModel;
    private genericTypes?: Type[];

    constructor(opValue: Value | ArkBaseModel, generateTypes?: Type[]) {
        super();
        this.opValue = opValue;
        this.genericTypes = generateTypes;
    }

    public setOpValue(opValue: Value | ArkBaseModel): void {
        this.opValue = opValue;
    }

    public getOpValue(): Value | ArkBaseModel {
        return this.opValue;
    }

    public setGenerateTypes(types: Type[]): void {
        this.genericTypes = types;
    }

    public getGenerateTypes(): Type[] | undefined {
        return this.genericTypes;
    }

    public addGenericType(gType: Type): void {
        if (!this.genericTypes) {
            this.genericTypes = [];
        }
        this.genericTypes.push(gType);
    }

    public getUses(): Value[] {
        const opValue = this.getOpValue();
        if (opValue instanceof ArkBaseModel) {
            return [];
        }
        let uses: Value[] = [];
        uses.push(opValue);
        uses.push(...opValue.getUses());
        return uses;
    }

    public getType(): Type {
        const opValue = this.getOpValue();
        if (opValue instanceof ArkBaseModel) {
            return ModelUtils.parseArkBaseModel2Type(opValue) ?? UnknownType.getInstance();
        }
        return opValue.getType();
    }

    public getTypeString(): string {
        const opValue = this.getOpValue();
        const gTypes = this.getGenerateTypes();
        const genericStr = gTypes && gTypes.length > 0 ? `<${gTypes.join(',')}>` : '';
        if (opValue instanceof ArkClass || opValue instanceof ArkMethod) {
            return `typeof ${opValue.getSignature().toString()}${genericStr}`;
        }
        return `typeof ${opValue.toString()}${genericStr}`;
    }

    public inferType(arkMethod: ArkMethod): void {
        IRInference.inferTypeQueryExpr(this, arkMethod);
    }
}

/**
 * keyof type expr represents the type operator with keyof.
 * It should be an internal expr.
 * the final type should be transferred to union type, unless it cannot find out all types within the union type.
 * @category core/base/typeExpr
 * @extends AbstractTypeExpr
 * @example
 ```typescript
 // opType is {a: 1, b: 2} and type of A is KeyofTypeExpr, which can be transferred to union type {'a', 'b'}
 type A = keyof {a: 1, b: 2};

 // opType is number and type of B is KeyofTypeExpr, which can be transferred to union type "toString" | "toFixed" | "toExponential" | ...
 type B = keyof number;
 ```
 */
export class KeyofTypeExpr extends AbstractTypeExpr {
    private opType: Type;

    constructor(opType: Type) {
        super();
        this.opType = opType;
    }

    public getOpType(): Type {
        return this.opType;
    }

    public setOpType(opType: Type): void {
        this.opType = opType;
    }

    public getUses(): Value[] {
        let uses: Value[] = [];
        if (this.getOpType() instanceof TypeQueryExpr) {
            uses.push(...(this.getOpType() as TypeQueryExpr).getUses());
        }
        return uses;
    }

    public getType(): Type {
        return this;
    }

    public getTypeString(): string {
        if (this.getOpType() instanceof UnionType || this.getOpType() instanceof IntersectionType) {
            return `keyof (${this.getOpType().toString()})`;
        }
        return `keyof ${this.getOpType().toString()}`;
    }

    public inferType(arkMethod: ArkMethod): void {
        IRInference.inferKeyofTypeExpr(this, arkMethod);
    }
}
