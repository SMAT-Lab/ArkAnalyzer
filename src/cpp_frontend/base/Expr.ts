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
    AliasType,
    ArrayType,
    BooleanType, ClassType, FunctionType,
    Type,
} from '../../core/base/Type';
import { ArkMethod } from '../../core/model/ArkMethod';
import { AbstractFieldRef, AbstractRef } from '../../core/base/Ref';
import { CxxSizeTType, CxxStdTypeName, CxxTypeBitWidth, CxxTypeSigned, TypeInfo } from './Type';
import { TypeInference } from '../../core/common/TypeInference';
import { UNKNOWN_FILE_NAME } from '../../core/common/Const';
import { ModelUtils } from '../../core/common/ModelUtils';
import { Local } from '../../core/base/Local';
import { ClassCategory } from '../../core/model/ArkClass';


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
        return 'newarray (' + this.baseType + ')';
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
export enum Operator {
    sizeof = 'sizeof',
    alignof = 'alignof',
    Unknown = 'Unknown'
}

// expression with either a type or (unevaluated) expression operand.
// Used for sizeof/alignof (C99 6.5.3.4) and vec_step (OpenCL 1.1 6.11.12).
export class ArkCxxUnaryExpr extends AbstractExpr {
    private operator: Operator;
    private op: Value | Type;

    constructor(operator: Operator, op: Value | Type) {
        super();
        this.operator = operator;
        this.op = op;
    }

    public getOp(): Value | Type{
        return this.op;
    }

    public setOp(newOp: Value | Type): void {
        this.op = newOp;
    }

    public getOperator(): string {
        return this.operator;
    }

    public getUses(): Value[] {
        let uses: Value[] = [];
        if (!(this.op instanceof Type)) {
            uses.push(this.op);
            uses.push(...this.op.getUses());
        }
        return uses;
    }

    public getOpType(): Type {
        if (this.op instanceof Type) {
            return this.op;
        }
        return this.op.getType();
    }

    public getType(): Type {
        return CxxSizeTType.getInstance(CxxTypeSigned.UNSIGNED, CxxTypeBitWidth.UNKNOWN, CxxStdTypeName.SIZE_T);
    }

    public toString(): string {
        return this.operator + '(' + this.op + ')';
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

// __array_extent  expression,the inner of node is DeclRefExpr or several IntegerLiteral
export class ArkArrayTypeTraitExpr extends AbstractExpr {
    private op: Value | null;
    private dimensionSizes: number[];

    constructor(dimensionSizes: number[] = [], op: Value | null) {
        super();
        this.op = op || null;
        this.dimensionSizes = dimensionSizes;
    }

    public getOp(): Value | null {
        return this.op;
    }

    public setOp(newOp: Value): void {
        this.op = newOp;
    }

    public getUses(): Value[] {
        let uses: Value[] = [];
        if (this.op) {
            uses.push(this.op);
            uses.push(...this.op.getUses());
        }
        return uses;
    }

    public getDimensionOrder(): number[] {
        return this.dimensionSizes;
    }

    public setDimensionOrder(dimensionOrder: number[]): void {
        this.dimensionSizes = dimensionOrder;
    }

    public getOpType(): Type | null {
        if (this.op) {
            return this.op.getType();
        }
        return null;
    }

    public getType(): Type {
        return CxxSizeTType.getInstance(CxxTypeSigned.UNSIGNED, CxxTypeBitWidth.UNKNOWN, CxxStdTypeName.SIZE_T);
    }

    public toString(): string {
        if (this.op) {
            return 'ArrayTypeTrait(' + this.op + this.dimensionSizes + ')';
        }
        return 'ArrayTypeTrait(' + this.dimensionSizes + ')';
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

// Declare class objects on the stack
export class ArkAllocExpr extends AbstractExpr {
    private classType: ClassType;

    constructor(classType: ClassType) {
        super();
        this.classType = classType;
    }

    public getClassType(): ClassType {
        return this.classType;
    }

    public getUses(): Value[] {
        return [];
    }

    public getType(): Type {
        return this.classType;
    }

    public toString(): string {
        return 'alloc ' + this.classType;
    }

    /**
     *Inference type method
     *@ param arkMethod - Ark method object, the context used for type inference
     *@ returns the ArkNewExpr instance of the current object
     */
    public inferType(arkMethod: ArkMethod): ArkAllocExpr {
        const classSignature = this.classType.getClassSignature();
        if (classSignature.getDeclaringFileSignature().getFileName() === UNKNOWN_FILE_NAME) {
            const className = classSignature.getClassName();
            let type: Type | null | undefined = ModelUtils.findDeclaredLocal(new Local(className), arkMethod, 1)?.getType();
            if (TypeInference.isUnclearType(type)) {
                type = TypeInference.inferUnclearRefName(className, arkMethod.getDeclaringArkClass());
            }
            // If the type is an alias type, replace with the original type
            if (type instanceof AliasType) {
                const originalType = TypeInference.replaceAliasType(type);
                if (originalType instanceof FunctionType) {
                    type = originalType.getMethodSignature().getMethodSubSignature().getReturnType();
                } else {
                    type = originalType;
                }
            }
            if (type && type instanceof ClassType) {
                const instanceType = this.constructorSignature(type, arkMethod) ?? type;
                this.classType.setClassSignature(instanceType.getClassSignature());
                TypeInference.inferRealGenericTypes(this.classType.getRealGenericTypes(), arkMethod.getDeclaringArkClass());
            }
        }
        return this;
    }

    private constructorSignature(type: ClassType, arkMethod: ArkMethod): ClassType | undefined {
        const classConstructor = arkMethod.getDeclaringArkFile().getScene().getClass(type.getClassSignature());
        if (classConstructor?.getCategory() === ClassCategory.INTERFACE) {
            const type = classConstructor.getMethodWithName('construct-signature')?.getReturnType();
            if (type) {
                const returnType = TypeInference.replaceAliasType(type);
                return returnType instanceof ClassType ? returnType : undefined;
            }
        }
        return undefined;
    }
}

/**
 * Aggregate expression to represent such cases :
 *     struct Point q = (struct Point){.x = 5, .y = 8, .name = 'c'};
 *     int* arr = (int[5]){1, 2, 3, 4, 5};
 *     the right value is {},its kind is CompoundLiteralExpr or InitListExpr
 */
export class ArkAggregateExpr extends AbstractExpr {
    private type: Type; // the whole Aggregate's type
    private elements: Value[]; // the elements of Aggregate

    constructor(elements: Value[], type: Type) {
        super();
        this.elements = elements;
        this.type = type;
    }

    public getElements(): Value[] {
        return this.elements;
    }

    public setType(type: Type): void {
        this.type = type;
    }

    public getUses(): Value[] {
        let uses: Value[] = [];
        for (const element of this.elements) {
            uses.push(element);
            uses.push(...element.getUses());
        }
        return uses;
    }

    public getType(): Type {
        return this.type;
    }

    public inferType(arkMethod: ArkMethod): ArkAggregateExpr {
        const trueType = TypeInference.inferUnclearedType(this.type, arkMethod.getDeclaringArkClass());
        if (trueType) {
            this.type = trueType;
        }
        return this;
    }

    public toString(): string {
        return `AggregateExpr(${this.elements})`;
    }
}

/**
 * ArkDesignatedInitExpr is used to represent designated initializers in aggregate initialization expressions.
 * It consists of an initializer value and a designator, which specifies the field or element to be initialized.
 * For example:
 *     struct Point q = (struct Point){.x = 5, .y = 8, .name = 'c'};
 *     its kind is DesignatedInitExpr
 */
export class ArkDesignatedInitExpr extends AbstractExpr {
    private init: Value; // the initializer value such as x,y, name
    private designator: Value; // the designator such as 5,8,c

    constructor(init: Value, designator: Value) {
        super();
        this.init = init;
        this.designator = designator;
    }

    public getInit(): Value {
        return this.init;
    }

    public getDesignator(): Value {
        return this.designator;
    }

    public inferType(arkMethod: ArkMethod): ArkDesignatedInitExpr {
        if (this.init instanceof AbstractRef || this.init instanceof AbstractExpr) {
            this.init.inferType(arkMethod);
        }
        if (this.designator instanceof AbstractRef || this.designator instanceof AbstractExpr) {
            this.designator.inferType(arkMethod);
        }
        return this;
    }

    public getUses(): Value[] {
        let uses: Value[] = [];
        uses.push(this.init);
        uses.push(this.designator);
        uses.push(...this.init.getUses());
        uses.push(...this.designator.getUses());
        return uses;
    }

    public getType(): Type {
        return this.init.getType();
    }

    public toString(): string {
        return this.init + ' = ' + this.designator;
    }
}