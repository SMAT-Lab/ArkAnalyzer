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

import { Type, NumberType, UnionType } from '../../core/base/Type';
import { Value } from '../../core/base/Value';

/** Enum representing the size of C++ types. */
export enum CxxTypeSize {
    EIGHT_BITS = 8,
    SIXTEEN_BITS = 16,
    THIRTY_TWO_BITS = 32,
    SIXTY_FOUR_BITS = 64,
    UNKNOWN = -1
}

/** Enum representing the signedness attribute of C++ types. */
export enum CxxTypeSigned {
    UNSIGNED = 0,
    SIGNED = 1,
    UNKNOWN = -1
}

/**
 * int type in cxx
 * @category core/base/type
 */
export class CxxIntType extends NumberType {
    private readonly signType: CxxTypeSigned;
    private readonly size: CxxTypeSize;
    private readonly oriTypeName: string;

    protected constructor(signType: CxxTypeSigned, size: CxxTypeSize, oriTypeName: string) {
        super();
        this.signType = signType;
        this.size = size;
        this.oriTypeName = oriTypeName;
    }

    public static getInstance(signType: CxxTypeSigned = CxxTypeSigned.UNKNOWN,
                              size: CxxTypeSize = CxxTypeSize.UNKNOWN,
                              oriTypeName: string = ''): CxxIntType {
        return new CxxIntType(signType, size, oriTypeName);
    }

    public getSignType(): CxxTypeSigned {
        return this.signType;
    }

    public getSize(): CxxTypeSize {
        return this.size;
    }

    public getCxxOriTypeName(): string {
        return this.oriTypeName;
    }

    public getTypeString(): string {
        if (this.oriTypeName !== '') {
            return this.oriTypeName;
        }
        const signStr = this.signType === CxxTypeSigned.UNKNOWN? '' : this.signType.toString();
        const bitStr = this.size === CxxTypeSize.UNKNOWN? '' : this.size.toString() + '_t';
        return signStr + ' int' + bitStr;
    }
}

/**
 * short type in cxx
 * @category core/base/type
 */
export class CxxShortType extends CxxIntType {
    public static getInstance(signType: CxxTypeSigned, size: CxxTypeSize, oriTypeName: string): CxxShortType {
        return new CxxShortType(signType, size, oriTypeName);
    }
}

/**
 * long type in cxx
 * @category core/base/type
 */
export class CxxLongType extends CxxIntType {
    public static getInstance(signType: CxxTypeSigned, size: CxxTypeSize, oriTypeName: string): CxxLongType {
        return new CxxLongType(signType, size, oriTypeName);
    }
}

/**
 * long long type in cxx
 * @category core/base/type
 */
export class CxxLongLongType extends CxxIntType {
    public static getInstance(signType: CxxTypeSigned, size: CxxTypeSize, oriTypeName: string): CxxLongLongType {
        return new CxxLongLongType(signType, size, oriTypeName);
    }
}

/**
 * float type in cxx
 * @category core/base/type
 */
export class CxxFloatType extends NumberType {
    public static getInstance(): CxxFloatType {
        return new CxxFloatType();
    }

    public getTypeString(): string {
        return 'float';
    }

    public getSize(): CxxTypeSize {
        return CxxTypeSize.THIRTY_TWO_BITS;
    }
}

/**
 * double type in cxx
 * @category core/base/type
 */
export class CxxDoubleType extends CxxFloatType {
    public static getInstance(): CxxDoubleType {
        return new CxxDoubleType();
    }

    public getTypeString(): string {
        return 'double';
    }

    public getSize(): CxxTypeSize {
        return CxxTypeSize.SIXTY_FOUR_BITS;
    }
}

/**
 * long double type in cxx
 * @category core/base/type
 */
export class CxxLongDoubleType extends CxxFloatType {
    public static getInstance(): CxxLongDoubleType {
        return new CxxLongDoubleType();
    }

    public getTypeString(): string {
        return 'long double';
    }

    public getSize(): CxxTypeSize {
        return CxxTypeSize.UNKNOWN;
    }
}

/**
 * char type in cxx
 * @category core/base/type
 */
export class CxxCharType extends Type {
    private readonly signType: CxxTypeSigned;
    private readonly size: CxxTypeSize;
    private readonly oriTypeName: string;

    private constructor(signType: CxxTypeSigned, size: CxxTypeSize, oriTypeName: string) {
        super();
        this.signType = signType;
        this.size = size;
        this.oriTypeName = oriTypeName;
    }

    public static getInstance(signType: CxxTypeSigned = CxxTypeSigned.UNKNOWN,
                              size: CxxTypeSize = CxxTypeSize.UNKNOWN,
                              oriTypeName: string = ''): CxxCharType {
        return new CxxCharType(signType, size, oriTypeName);
    }

    public getSignType(): CxxTypeSigned {
        return this.signType;
    }

    public getSize(): CxxTypeSize {
        return this.size;
    }

    public getCxxOriTypeName(): string {
        return this.oriTypeName;
    }

    public getTypeString(): string {
        if (this.oriTypeName !== '') {
            return this.oriTypeName;
        }
        const signStr = this.signType === CxxTypeSigned.UNKNOWN? '' : this.signType.toString();
        const bitStr = this.size === CxxTypeSize.UNKNOWN? '' : this.size.toString() + '_t';
        return signStr + ' char' + bitStr;
    }
}

/**
 *PointerType class represents pointer type, inherited from Type base class
 *Pointer types used to represent C language style, such as int *, char * *, etc
 */
export class PointerType extends Type {
    private baseType: Type; // Base type, such as int in int *
    private level: number; // Represents the level of pointer

    constructor(baseType: Type, level: number) {
        super();
        this.baseType = baseType;
        this.level = level;
    }

    public getBaseType(): Type {
        return this.baseType;
    }

    public setBaseType(newBaseType: Type): void {
        this.baseType = newBaseType;
    }

    public getLevel(): number {
        return this.level;
    }

    public getTypeString(): string {
        const strs: string[] = [];
        if (this.baseType instanceof UnionType) {
            strs.push('(' + this.baseType.toString() + ')');
        } else if (this.baseType) {
            strs.push(this.baseType.toString());
        }
        for (let i = 0; i < this.level; i++) {
            strs.push('*');
        }
        return strs.join('');
    }
}

/**
 *Reference category enumeration, used to distinguish different types of references
 *LVALUE_REF: Left value reference, the reference type of address can be obtained
 *RVALUE_REF: Right value reference, used to bind the reference type of temporary object
 *UNIVERSAL_REF: universal reference, which can bind reference types of left or right values
 */
export enum ReferCategory {
    LVALUE_REF = 0,
    RVALUE_REF = 1,
    UNIVERSAL_REF = 2,
}

/**
 *The ReferenceType class represents the reference type, inherited from the Type base class
 *Used to represent the type of left value reference (&) and right value reference (&&) in C++
 */
export class ReferenceType extends Type {
    private baseType: Type;
    private category: ReferCategory;
    private sourceValue?: Value;

    constructor(bassType: Type, category: ReferCategory, sourceValue?: Value) {
        super();
        this.baseType = bassType;
        this.category = category;
        this.sourceValue = sourceValue;
    }

    public getBaseType(): Type {
        return this.baseType;
    }

    public setBaseType(newBaseType: Type): void {
        this.baseType = newBaseType;
    }

    public getCategory(): ReferCategory {
        return this.category;
    }

    public setSourceValue(sourceValue: Value): void {
        this.sourceValue = sourceValue;
    }

    public getSourceValue(): Value | undefined {
        return this.sourceValue;
    }

    public getTypeString(): string {
        // Implement abstract method, return type string
        const strs: string[] = [];
        if (this.baseType instanceof UnionType) {
            strs.push('(' + this.baseType.toString() + ')');
        } else if (this.baseType) {
            strs.push(this.baseType.toString());
        }
        if (this.category === ReferCategory.LVALUE_REF) {
            strs.push('&');
        } else {
            strs.push('&&');
        }
        return strs.join('');
    }
}

/**
 *The Thread class inherits from the Type class and represents a thread type
 *This class provides the basic implementation of thread types
 */
export class Thread extends Type {
    constructor() {
        super();
    }

    getTypeString(): string {
        return 'thread ';
    }
}