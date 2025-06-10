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

import Logger, { LOG_MODULE_TYPE } from '../../utils/logger';
import { FieldSignature } from '../model/ArkSignature';
import { Local } from './Local';
import { ArrayType, ClassType, LexicalEnvType, Type, UnknownType } from './Type';
import { Value } from './Value';
import { TypeInference } from '../common/TypeInference';
import { ArkMethod } from '../model/ArkMethod';
import { Stmt } from './Stmt';
import { IRInference } from '../common/IRInference';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'Ref');

/**
 * @category core/base/ref
 */
export abstract class AbstractRef implements Value {
    abstract getUses(): Value[];

    abstract getType(): Type;

    public inferType(arkMethod: ArkMethod): AbstractRef {
        return this;
    }
}

export class ArkArrayRef extends AbstractRef {
    private base: Local; // 数组变量
    private index: Value; // 索引

    constructor(base: Local, index: Value) {
        super();
        this.base = base;
        this.index = index;
    }

    /**
     * Returns the base of this array reference. Array reference refers to access to array elements.
     * Array references usually consist of an local variable and an index.
     * For example, `a[i]` is a typical array reference, where `a` is the base (i.e., local variable)
     * pointing to the actual memory location where the array is stored
     * and `i` is the index indicating access to the `i-th` element from array `a`.
     * @returns the base of this array reference.
     * @example
     * 1. Get the base and the specific elements.

     ```typescript
     // Create an array
     let myArray: number[] = [10, 20, 30, 40];
     // Create an ArrayRef object representing a reference to myArray[2]
     let arrayRef = new ArkArrayRef(myArray, 2);
     // Use the getBase() method to get the base of the array
     let baseArray = arrayRef.getBase();

     console.log("Base array:", baseArray);  // Output: Base array: [10, 20, 30, 40]

     // Use baseArray and obeject index of ArrayRef to access to specific array elements
     let element = baseArray[arrayRef.index];
     console.log("Element at index", arrayRef.index, ":", element);  // Output: Element at index 2 : 30
     ```
     */
    public getBase(): Local {
        return this.base;
    }

    public setBase(newBase: Local): void {
        this.base = newBase;
    }

    /**
     * Returns the index of this array reference.
     * In TypeScript, an array reference means that the variable stores
     * the memory address of the array rather than the actual data of the array.
     * @returns The index of this array reference.
     */
    public getIndex(): Value {
        return this.index;
    }

    public setIndex(newIndex: Value): void {
        this.index = newIndex;
    }

    public getType(): Type {
        let baseType = TypeInference.replaceTypeWithReal(this.base.getType());
        if (baseType instanceof ArrayType) {
            return baseType.getBaseType();
        } else {
            logger.warn(`the type of base in ArrayRef is not ArrayType`);
            return UnknownType.getInstance();
        }
    }

    public getUses(): Value[] {
        let uses: Value[] = [];
        uses.push(this.base);
        uses.push(...this.base.getUses());
        uses.push(this.index);
        uses.push(...this.index.getUses());
        return uses;
    }

    public toString(): string {
        return this.base + '[' + this.index + ']';
    }
}

export abstract class AbstractFieldRef extends AbstractRef {
    private fieldSignature: FieldSignature;

    constructor(fieldSignature: FieldSignature) {
        super();
        this.fieldSignature = fieldSignature;
    }

    /**
     * Returns the the field name as a **string**.
     * @returns The the field name.
     */
    public getFieldName(): string {
        return this.fieldSignature.getFieldName();
    }

    /**
     * Returns a field signature, which consists of a class signature,
     * a **string** field name, and a **boolean** label indicating whether it is static or not.
     * @returns The field signature.
     * @example
     * 1. Compare two Fields

     ```typescript
     const fieldSignature = new FieldSignature();
     fieldSignature.setFieldName(...);
     const fieldRef = new ArkInstanceFieldRef(baseValue as Local, fieldSignature);
     ...
     if (fieldRef.getFieldSignature().getFieldName() ===
     targetField.getFieldSignature().getFieldName()) {
     ...
     }
     ```
     */
    public getFieldSignature(): FieldSignature {
        return this.fieldSignature;
    }

    public setFieldSignature(newFieldSignature: FieldSignature): void {
        this.fieldSignature = newFieldSignature;
    }

    public getType(): Type {
        return this.fieldSignature.getType();
    }
}

export class ArkInstanceFieldRef extends AbstractFieldRef {
    private base: Local; // which obj this field belong to

    constructor(base: Local, fieldSignature: FieldSignature) {
        super(fieldSignature);
        this.base = base;
    }

    /**
     * Returns the local of field, showing which object this field belongs to.
     * A {@link Local} consists of :
     * - Name: the **string** name of local value, e.g., "$temp0".
     * - Type: the type of value.
     * @returns The object that the field belongs to.
     * @example
     * 1. Get a base.

     ```typescript
     if (expr instanceof ArkInstanceFieldRef) {
     ...
     let base = expr.getBase();
     if (base.getName() == 'this') {
     ...
     }
     ...
     }
     ```
     */
    public getBase(): Local {
        return this.base;
    }

    public setBase(newBase: Local): void {
        this.base = newBase;
    }

    public getUses(): Value[] {
        let uses: Value[] = [];
        uses.push(this.base);
        uses.push(...this.base.getUses());
        return uses;
    }

    public toString(): string {
        return this.base.toString() + '.<' + this.getFieldSignature() + '>';
    }

    public inferType(arkMethod: ArkMethod): AbstractRef {
        return IRInference.inferFieldRef(this, arkMethod);
    }
}

export class ArkStaticFieldRef extends AbstractFieldRef {
    constructor(fieldSignature: FieldSignature) {
        super(fieldSignature);
    }

    public getUses(): Value[] {
        return [];
    }

    public toString(): string {
        return this.getFieldSignature().toString();
    }
}

export class ArkParameterRef extends AbstractRef {
    private index: number;
    private paramType: Type;

    constructor(index: number, paramType: Type) {
        super();
        this.index = index;
        this.paramType = paramType;
    }

    public getIndex(): number {
        return this.index;
    }

    public setIndex(index: number): void {
        this.index = index;
    }

    public getType(): Type {
        return this.paramType;
    }

    public setType(newType: Type): void {
        this.paramType = newType;
    }

    public inferType(arkMethod: ArkMethod): AbstractRef {
        return IRInference.inferParameterRef(this, arkMethod);
    }

    public getUses(): Value[] {
        return [];
    }

    public toString(): string {
        return 'parameter' + this.index + ': ' + this.paramType;
    }
}

export class ArkThisRef extends AbstractRef {
    private type: ClassType;

    constructor(type: ClassType) {
        super();
        this.type = type;
    }

    public getType(): ClassType {
        return this.type;
    }

    public getUses(): Value[] {
        return [];
    }

    public toString(): string {
        return 'this: ' + this.type;
    }
}

export class ArkCaughtExceptionRef extends AbstractRef {
    private type: Type;

    constructor(type: Type) {
        super();
        this.type = type;
    }

    public getType(): Type {
        return this.type;
    }

    public getUses(): Value[] {
        return [];
    }

    public toString(): string {
        return 'caughtexception: ' + this.type;
    }
}

export class GlobalRef extends AbstractRef {
    private name: string;
    private ref: Value | null;
    private usedStmts: Stmt[];

    constructor(name: string, ref?: Value) {
        super();
        this.name = name;
        this.ref = ref ?? null;
        this.usedStmts = [];
    }

    public getName(): string {
        return this.name;
    }

    public getUses(): Value[] {
        return this.ref?.getUses() || [];
    }

    public getType(): Type {
        return this.ref?.getType() || UnknownType.getInstance();
    }

    public getRef(): Value | null {
        return this.ref || null;
    }

    public setRef(value: Value): void {
        this.ref = value;
    }

    public getUsedStmts(): Stmt[] {
        return this.usedStmts;
    }

    public addUsedStmts(usedStmts: Stmt | Stmt[]): void {
        if (usedStmts instanceof Stmt) {
            this.usedStmts.push(usedStmts);
        } else {
            usedStmts.forEach(stmt => this.usedStmts.push(stmt));
        }
    }

    public toString(): string {
        return this.getName();
    }
}

export class ClosureFieldRef extends AbstractRef {
    private base: Local;
    private fieldName: string;
    private type: Type;

    constructor(base: Local, fieldName: string, type: Type) {
        super();
        this.base = base;
        this.fieldName = fieldName;
        this.type = type;
    }

    public getUses(): Value[] {
        return [];
    }

    public getBase(): Local {
        return this.base;
    }

    public getType(): Type {
        return this.type;
    }

    public getFieldName(): string {
        return this.fieldName;
    }

    public toString(): string {
        return this.base.toString() + '.' + this.getFieldName();
    }

    public inferType(arkMethod: ArkMethod): AbstractRef {
        if (TypeInference.isUnclearType(this.type)) {
            let type: Type | undefined = this.base.getType();
            if (type instanceof LexicalEnvType) {
                type = type
                    .getClosures()
                    .find(c => c.getName() === this.fieldName)
                    ?.getType();
            }
            if (type && !TypeInference.isUnclearType(type)) {
                this.type = type;
            }
        }
        return this;
    }
}
