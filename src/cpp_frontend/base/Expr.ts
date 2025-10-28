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
    ArkCastExpr,
    NormalBinaryOperator,
} from '../../core/base/Expr';
import { Value } from '../../core/base/Value';
import {
    ArrayType,
    BooleanType,
    Type,
} from '../../core/base/Type';
import { ArkMethod } from '../../core/model/ArkMethod';
import { AbstractFieldRef, AbstractRef } from '../../core/base/Ref';
import { CxxSizeTType, CxxStdTypeName, CxxTypeBitWidth, CxxTypeSigned, TypeInfo } from './Type';
import { TypeInference } from '../../core/common/TypeInference';

/**
 * delete[] expression in C++
 *  1. c++: delete[] a / delete[] a.b / delete[] a->b
 */
export class ArkCxxDeleteArrayExpr extends AbstractExpr {
    private field: AbstractFieldRef | Value;

    constructor(field: AbstractFieldRef | Value) {
        super();
        this.field = field;
    }

    public getField(): AbstractFieldRef | Value {
        return this.field;
    }

    public setField(newField: AbstractFieldRef | Value): void {
        this.field = newField;
    }

    public getType(): Type {
        return BooleanType.getInstance();
    }

    public getUses(): Value[] {
        const uses: Value[] = [];
        uses.push(this.field);
        uses.push(...this.field.getUses());
        return uses;
    }

    public toString(): string {
        return 'delete[] ' + this.field;
    }
}

// Expression when creating a new array
export class ArkCxxNewArrayExpr extends AbstractExpr {
    private baseType: Type;
    private size: Value; // The length of the current one-dimensional array
    private elementsNumber: number = 0; // The total number of elements contained in the array

    private fromLiteral: boolean;

    constructor(baseType: Type, size: Value, fromLiteral: boolean = false, elementsNumber?: number) {
        super();
        this.baseType = baseType;
        this.size = size;
        this.fromLiteral = fromLiteral;
        if (elementsNumber) {
            this.elementsNumber = elementsNumber;
        }
    }

    public getElementsNumber(): number {
        return this.elementsNumber;
    }

    public setElementsNumber(elementsNumber: number): void {
        this.elementsNumber = elementsNumber;
    }
    public getSize(): Value {
        return this.size;
    }

    public setSize(newSize: Value): void {
        this.size = newSize;
    }

    public getType(): ArrayType {
        return new ArrayType(this.baseType, 1);
    }

    public getBaseType(): Type {
        return this.baseType;
    }

    public setBaseType(newType: Type): void {
        this.baseType = newType;
    }

    public isFromLiteral(): boolean {
        return this.fromLiteral;
    }

    public inferType(arkMethod: ArkMethod): ArkCxxNewArrayExpr {
        const type = TypeInference.inferUnclearedType(this.baseType, arkMethod.getDeclaringArkClass());
        if (type) {
            this.baseType = type;
        }
        return this;
    }

    public getUses(): Value[] {
        let uses: Value[] = [this.size];
        uses.push(...this.size.getUses());
        return uses;
    }

    public toString(): string {
        return 'newarray (' + this.baseType + ')[' + this.size + ']';
    }
}

// Array 0 initialization expression
export class ArkCxxInitArrayExpr extends AbstractExpr {
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


    public getType(): Type {
        return this.op.getType();
    }

    public toString(): string {
        return 'initArrayWith(' + this.op + ')';
    }

    public inferType(arkMethod: ArkMethod): AbstractExpr {
        if (this.op instanceof AbstractRef || this.op instanceof AbstractExpr) {
            this.op.inferType(arkMethod);
        }
        return this;
    }
}

// Sizeof expression
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
        return CxxSizeTType.getInstance(CxxTypeSigned.UNSIGNED, CxxTypeBitWidth.UNKNOWN, CxxStdTypeName.SIZE_T);
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
// Type conversion expression
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
        return `<${this.cxxCastType}: ${this.getType()}>${this.getOp()}`;
    }

    public inferType(arkMethod: ArkMethod): AbstractExpr {
        let op = this.getOp();
        if (op instanceof AbstractRef || op instanceof AbstractExpr) {
            op.inferType(arkMethod);
        }
        return this;
    }
}

// __array_extent  expression
export class ArkArrayTypeTraitExpr extends AbstractExpr {
    private op: Value;
    private dimensionOrder: number = 0;
    private func: string;

    constructor(op: Value, func: string, dimensionOrder: number = 0) {
        super();
        this.op = op;
        this.dimensionOrder = dimensionOrder;
        this.func = func;
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

    public getDimensionOrder(): number {
        return this.dimensionOrder;
    }

    public setDimensionOrder(dimensionOrder: number): void {
        this.dimensionOrder = dimensionOrder;
    }

    public getOpType(): Type {
        return this.op.getType();
    }

    public getType(): Type {
        return CxxSizeTType.getInstance(CxxTypeSigned.UNSIGNED, CxxTypeBitWidth.UNKNOWN, CxxStdTypeName.SIZE_T);
    }

    public toString(): string {
        if (this.func === '__array_extent') {
            return this.func + '(' + this.op + ',' + this.dimensionOrder + ')';
        }
        return this.func + '(' + this.op + ')';
    }

    public inferType(arkMethod: ArkMethod): AbstractExpr {
        if (this.op instanceof AbstractRef || this.op instanceof AbstractExpr) {
            this.op.inferType(arkMethod);
        }
        return this;
    }
}

// typeid expression
export class ArkTypeIdExpr extends AbstractExpr {
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

    public getType(): Type {
        return new TypeInfo('type_info', this.op.getType());
    }

    public toString(): string {
        return 'typeid(' + this.op + ')';
    }

    public inferType(arkMethod: ArkMethod): AbstractExpr {
        if (this.op instanceof AbstractRef || this.op instanceof AbstractExpr) {
            this.op.inferType(arkMethod);
        }
        return this;
    }
}

// noexcept expression
export class ArkNoExpectExpr extends AbstractExpr {
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
        return BooleanType.getInstance();
    }

    public toString(): string {
        return 'noexcept(' + this.op + ')';
    }

    public inferType(arkMethod: ArkMethod): AbstractExpr {
        if (this.op instanceof AbstractRef || this.op instanceof AbstractExpr) {
            this.op.inferType(arkMethod);
        }
        return this;
    }
}

// cxx folder expression
export class ArkCxxFolderExpr extends AbstractExpr {
    private arg: Value;
    private op: string;
    constructor(arg: Value, op: string) {
        super();
        this.arg = arg;
        this.op = op;
    }

    public getArg(): Value {
        return this.arg;
    }

    public setArg(newArg: Value): void {
        this.arg = newArg;
    }

    public getUses(): Value[] {
        let uses: Value[] = [];
        uses.push(this.arg);
        uses.push(...this.arg.getUses());
        return uses;
    }

    public getType(): Type {
        return this.arg.getType();
    }
    public getOp(): string {
        return this.op;
    }
    public toString(): string {
        return `CxxFolderExpr(` + this.arg + this.op + `...)`;
    }

    public inferType(arkMethod: ArkMethod): AbstractExpr {
        let arg = this.getArg();
        if (arg instanceof AbstractRef || arg instanceof AbstractExpr) {
            arg.inferType(arkMethod);
        }
        return this;
    }
}

export class ArkCxxNormalBinOpExpr extends AbstractBinopExpr {
    constructor(op1: Value, op2: Value, operator: NormalBinaryOperator) {
        super(op1, op2, operator);
    }

    public getType(): Type {
        if (!this.type) {
            this.setType();
        }
        return this.type;
    }

    public setCxxType(type: Type): void {
        this.type = type;
    }
}