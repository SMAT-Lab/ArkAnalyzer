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

import { Type, NumberType, UnionType, GenericType } from '../../core/base/Type';
import { Value } from '../../core/base/Value';

/** Enum representing the bitWidth of Cxx types. */
export enum CxxTypeBitWidth {
    EIGHT_BITS = 8,
    SIXTEEN_BITS = 16,
    THIRTY_TWO_BITS = 32,
    SIXTY_FOUR_BITS = 64,
    UNKNOWN = -1
}

/** Enum representing the signedness attribute of Cxx types. */
export enum CxxTypeSigned {
    UNSIGNED = 0,
    SIGNED = 1,
    UNKNOWN = -1
}

/** Enumerate the standard library types of Cxx */
export enum CxxStdTypeName {
    CHAR = 1,
    SIGNED_CHAR,
    UNSIGNED_CHAR,
    WCHAR_T,
    CHAR16_T,
    CHAR32_T,
    SHORT,
    UNSIGNED_SHORT,
    INT,
    UNSIGNED_INT,
    LONG,
    UNSIGNED_LONG,
    LONG_LONG,
    UNSIGNED_LONG_LONG,
    UINT8_T,
    UINT16_T,
    UINT32_T,
    UINT64_T,
    INT8_T,
    INT16_T,
    INT32_T,
    INT64_T,
    SIZE_T,
    INTPTR_T,
    UINTPTR_T,
}

/**
 * integral type in cxx, for example int, short, long and so on.
 * @category core/base/type
 */
export class CxxIntegralType extends NumberType {
    protected readonly signType: CxxTypeSigned; // the type is signed or unsigned
    protected readonly bitWidth: CxxTypeBitWidth; // the bit width of this type
    protected readonly oriTypeName?: CxxStdTypeName; // the actual type name

    protected constructor(signType: CxxTypeSigned, bitWidth: CxxTypeBitWidth, oriTypeName?: CxxStdTypeName) {
        super();
        this.signType = signType;
        this.bitWidth = bitWidth;
        this.oriTypeName = oriTypeName;
    }

    public static getInstance(signType: CxxTypeSigned = CxxTypeSigned.UNKNOWN,
                              size: CxxTypeBitWidth = CxxTypeBitWidth.UNKNOWN,
                              oriTypeName?: CxxStdTypeName): CxxIntegralType {
        return new CxxIntegralType(signType, size, oriTypeName);
    }

    public getSignType(): CxxTypeSigned {
        return this.signType;
    }

    public getBitWidth(): CxxTypeBitWidth {
        return this.bitWidth;
    }

    public getOriTypeName(): CxxStdTypeName | undefined {
        return this.oriTypeName;
    }
}

/**
 * int type in cxx
 * @category core/base/type
 */
export class CxxIntType extends CxxIntegralType {
    public static getInstance(signType: CxxTypeSigned, bitWidth: CxxTypeBitWidth, oriTypeName?: CxxStdTypeName): CxxIntType {
        return new CxxIntType(signType, bitWidth, oriTypeName);
    }

    public getTypeString(): string {
        if (this.oriTypeName) {
            return cxxStdTypeNameToStr(this.oriTypeName);
        }
        const signStr = this.signType === CxxTypeSigned.UNSIGNED ? 'u' : '';
        const bitStr = this.bitWidth === CxxTypeBitWidth.UNKNOWN ? '' : this.bitWidth.toString() + '_t';
        return signStr + 'int' + bitStr;
    }
}

/**
 * short type in cxx
 * @category core/base/type
 */
export class CxxShortType extends CxxIntegralType {
    public static getInstance(signType: CxxTypeSigned, bitWidth: CxxTypeBitWidth, oriTypeName?: CxxStdTypeName): CxxShortType {
        return new CxxShortType(signType, bitWidth, oriTypeName);
    }

    public getTypeString(): string {
        if (this.oriTypeName) {
            return cxxStdTypeNameToStr(this.oriTypeName);
        }
        const signStr = this.signType === CxxTypeSigned.UNSIGNED ? 'unsigned ' : '';
        return signStr + 'short';
    }
}

/**
 * long type in cxx
 * @category core/base/type
 */
export class CxxLongType extends CxxIntegralType {
    public static getInstance(signType: CxxTypeSigned, bitWidth: CxxTypeBitWidth, oriTypeName?: CxxStdTypeName): CxxLongType {
        return new CxxLongType(signType, bitWidth, oriTypeName);
    }

    public getTypeString(): string {
        if (this.oriTypeName) {
            return cxxStdTypeNameToStr(this.oriTypeName);
        }
        const signStr = this.signType === CxxTypeSigned.UNSIGNED ? 'unsigned ' : '';
        return signStr + 'long';
    }
}

/**
 * long long type in cxx
 * @category core/base/type
 */
export class CxxLongLongType extends CxxIntegralType {
    public static getInstance(signType: CxxTypeSigned, bitWidth: CxxTypeBitWidth, oriTypeName?: CxxStdTypeName): CxxLongLongType {
        return new CxxLongLongType(signType, bitWidth, oriTypeName);
    }

    public getTypeString(): string {
        if (this.oriTypeName) {
            return cxxStdTypeNameToStr(this.oriTypeName);
        }
        const signStr = this.signType === CxxTypeSigned.UNSIGNED ? 'unsigned ' : '';
        return signStr + 'long long';
    }
}

/**
 * size_t type in cxx
 * @category core/base/type
 */
export class CxxSizeTType extends CxxIntegralType {
    public static getInstance(signType: CxxTypeSigned, bitWidth: CxxTypeBitWidth, oriTypeName?: CxxStdTypeName): CxxSizeTType {
        return new CxxSizeTType(signType, bitWidth, oriTypeName);
    }

    public getTypeString(): string {
        return 'size_t';
    }
}

/**
 * floating-point types in cxx, for example float, double and so on.
 * @category core/base/type
 */
export class CxxFloatingPointType extends NumberType {
    public static getInstance(): CxxFloatingPointType {
        return new CxxFloatingPointType();
    }
    public getBitWith(): CxxTypeBitWidth {
        return CxxTypeBitWidth.UNKNOWN;
    }
}

/**
 * float type in cxx
 * @category core/base/type
 */
export class CxxFloatType extends CxxFloatingPointType {
    public static getInstance(): CxxFloatType {
        return new CxxFloatType();
    }

    public getTypeString(): string {
        return 'float';
    }

    public getBitWidth(): CxxTypeBitWidth {
        return CxxTypeBitWidth.THIRTY_TWO_BITS;
    }
}

/**
 * double type in cxx
 * @category core/base/type
 */
export class CxxDoubleType extends CxxFloatingPointType {
    public static getInstance(): CxxDoubleType {
        return new CxxDoubleType();
    }

    public getTypeString(): string {
        return 'double';
    }

    public getBitWidth(): CxxTypeBitWidth {
        return CxxTypeBitWidth.SIXTY_FOUR_BITS;
    }
}

/**
 * long double type in cxx
 * @category core/base/type
 */
export class CxxLongDoubleType extends CxxFloatingPointType {
    public static getInstance(): CxxLongDoubleType {
        return new CxxLongDoubleType();
    }

    public getTypeString(): string {
        return 'long double';
    }

    public getBitWidth(): CxxTypeBitWidth {
        return CxxTypeBitWidth.UNKNOWN;
    }
}

/**
 * char type in cxx
 * @category core/base/type
 */
export class CxxCharType extends Type {
    private readonly signType: CxxTypeSigned; // the type is signed or unsigned
    private readonly bitWidth: CxxTypeBitWidth; // the bit width of this type
    private readonly oriTypeName?: CxxStdTypeName; // the actual type name

    private constructor(signType: CxxTypeSigned, bitWidth: CxxTypeBitWidth, oriTypeName?: CxxStdTypeName) {
        super();
        this.signType = signType;
        this.bitWidth = bitWidth;
        this.oriTypeName = oriTypeName;
    }

    public static getInstance(signType: CxxTypeSigned = CxxTypeSigned.UNKNOWN,
                              size: CxxTypeBitWidth = CxxTypeBitWidth.UNKNOWN,
                              oriTypeName?: CxxStdTypeName): CxxCharType {
        return new CxxCharType(signType, size, oriTypeName);
    }

    public getSignType(): CxxTypeSigned {
        return this.signType;
    }

    public getBitWidth(): CxxTypeBitWidth {
        return this.bitWidth;
    }

    public getOriTypeName(): CxxStdTypeName | undefined {
        return this.oriTypeName;
    }

    public getTypeString(): string {
        if (this.oriTypeName) {
            return cxxStdTypeNameToStr(this.oriTypeName);
        }
        const signStr = this.signType === CxxTypeSigned.UNKNOWN ? '' : this.signType === CxxTypeSigned.SIGNED ? 'signed ' : 'unsigned ';
        const bitStr = this.bitWidth === CxxTypeBitWidth.UNKNOWN ? '' : this.bitWidth.toString() + '_t';
        return signStr + 'char' + bitStr;
    }
}

/**
 * wchar_t type in cxx
 * @category core/base/type
 */
export class CxxWcharType extends CxxIntegralType {
    public static getInstance(signType: CxxTypeSigned = CxxTypeSigned.UNKNOWN,
                              size: CxxTypeBitWidth = CxxTypeBitWidth.UNKNOWN,
                              oriTypeName?: CxxStdTypeName): CxxWcharType {
        return new CxxWcharType(signType, size, oriTypeName);
    }

    public getTypeString(): string {
        return 'wchar_t';
    }
}

function cxxStdTypeNameToStr(cxxStdTypeName: CxxStdTypeName): string {
    switch (cxxStdTypeName) {
        case CxxStdTypeName.CHAR:
            return 'char';
        case CxxStdTypeName.SIGNED_CHAR:
            return 'signed char';
        case CxxStdTypeName.UNSIGNED_CHAR:
            return 'unsigned char';
        case CxxStdTypeName.WCHAR_T:
            return 'wchar_t';
        case CxxStdTypeName.CHAR16_T:
            return 'char16_t';
        case CxxStdTypeName.CHAR32_T:
            return 'char32_t';
        case CxxStdTypeName.SHORT:
            return 'short';
        case CxxStdTypeName.UNSIGNED_SHORT:
            return 'unsigned short';
        case CxxStdTypeName.INT:
            return 'int';
        case CxxStdTypeName.UNSIGNED_INT:
            return 'unsigned int';
        case CxxStdTypeName.LONG:
            return 'long';
        case CxxStdTypeName.UNSIGNED_LONG:
            return 'unsigned long';
        case CxxStdTypeName.LONG_LONG:
            return 'long long';
        case CxxStdTypeName.UNSIGNED_LONG_LONG:
            return 'unsigned long long';
        case CxxStdTypeName.UINT8_T:
            return 'uint8_t';
        case CxxStdTypeName.UINT16_T:
            return 'uint16_t';
        case CxxStdTypeName.UINT32_T:
            return 'uint32_t';
        case CxxStdTypeName.UINT64_T:
            return 'uint64_t';
        case CxxStdTypeName.INT8_T:
            return 'int8_t';
        case CxxStdTypeName.INT16_T:
            return 'int16_t';
        case CxxStdTypeName.INT32_T:
            return 'int32_t';
        case CxxStdTypeName.INT64_T:
            return 'int64_t';
        case CxxStdTypeName.SIZE_T:
            return 'size_t';
        case CxxStdTypeName.INTPTR_T:
            return 'intptr_t';
        case CxxStdTypeName.UINTPTR_T:
            return 'uintptr_t';
        default:
            return '';
    }
}

/**
 *PointerType class represents pointer type, inherited from Type base class
 *Pointer types used to represent C language style, such as int *, char * *, etc
 */
export class PointerType extends Type {
    private baseType: Type; // Base type, such as int in int *
    private level: number; // Represents the level of pointer
    private isConstPointer: boolean = false; // Whether the pointer is a const pointer
    private isPointerToConst: boolean = false; // Whether the pointer points to a const type
    private isVolatilePointer: boolean = false; // Whether the pointer is a volatile pointer
    private isPointerToVolatileType: boolean = false; // Whether the pointer points to a volatile type
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

    public getIsConstPointer(): boolean {
        return this.isConstPointer;
    }

    public setIsConstPointer(isConstPointer: boolean): void {
        this.isConstPointer = isConstPointer;
    }

    public getIsPointerToConst(): boolean {
        return this.isPointerToConst;
    }

    public setIsPointerToConst(isPointerToConst: boolean): void {
        this.isPointerToConst = isPointerToConst;
    }

    public getIsVolatilePointer(): boolean {
        return this.isVolatilePointer;
    }

    public setIsVolatilePointer(isVolatilePointer: boolean): void {
        this.isVolatilePointer = isVolatilePointer;
    }

    public getIsPointerToVolatileType(): boolean {
        return this.isPointerToVolatileType;
    }

    public setIsPointerToVolatileType(isPointerToVolatileType: boolean): void {
        this.isPointerToVolatileType = isPointerToVolatileType;
    }
}

export enum SmartPointerCategory {
    UNKNOWN = -1,
    UNIQUE_PTR = 0,
    SHARED_PTR = 1,
    WEAK_PTR = 2,
}

export class SmartPointerType extends PointerType {
    private category: SmartPointerCategory;
    constructor(baseType: Type, level: number, source: string) {
        let category = SmartPointerCategory.UNKNOWN;
        super(baseType, level);
        if (source.includes('unique')) {
            category = SmartPointerCategory.UNIQUE_PTR;
        } else if (source.includes('shared')) {
            category = SmartPointerCategory.SHARED_PTR;
        } else if (source.includes('weak')) {
            category = SmartPointerCategory.WEAK_PTR;
        }
        this.category = category;
    }

    public getCategory(): SmartPointerCategory {
        return this.category;
    }

    public setCategory(category: SmartPointerCategory): void {
        this.category = category;
    }

    public getTypeString(): string {
        const baseTypeStr = this.getBaseType().toString();
        switch (this.category) {
            case SmartPointerCategory.UNIQUE_PTR:
                return `unique_ptr<${baseTypeStr}>`;
            case SmartPointerCategory.SHARED_PTR:
                return `shared_ptr<${baseTypeStr}>`;
            case SmartPointerCategory.WEAK_PTR:
                return `weak_ptr<${baseTypeStr}>`;
            default:
                return `smart_ptr<${baseTypeStr}>`;
        }
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

export class TypeInfo extends Type {
    private name: string;
    private type: Type;

    constructor(name: string, type: Type) {
        super();
        this.name = name;
        this.type = type;
    }

    public getName(): string {
        return this.name;
    }

    public getType(): Type {
        return this.type;
    }

    public getTypeString(): string {
        return this.name;
    }
}

export class CxxNonType extends GenericType {
    constructor(name: string, defaultType?: Type, isAutoType: boolean = false) {
        super(name, defaultType);
    }
}

export class CxxArrayType extends Type {
    private baseType: Type;
    private dimension: number; // array dimension
    private dimensionSizes: number[]; // each dimension's size
    constructor(baseType: Type, dimension: number, dimensionSizes?: number[]) {
        super();
        this.baseType = baseType;
        this.dimension = dimension;
        this.dimension = dimension;
        this.dimensionSizes = dimensionSizes || new Array(dimension).fill(0);
    }

    /**
     * Returns the base type of this array, such as `Any`, `Unknown`, `TypeParameter`, etc.
     * @returns The base type of array.
     */
    public getBaseType(): Type {
        return this.baseType;
    }

    public setBaseType(newType: Type): void {
        this.baseType = newType;
    }

    public getDimension(): number {
        return this.dimension;
    }

    public getDimensionSizes(): number[] {
        return this.dimensionSizes;
    }

    public setDimensionSizes(sizes: number[]): void {
        if (sizes.length !== this.dimension) {
            throw new Error(`Dimension sizes length ${sizes.length} doesn't match array dimension ${this.dimension}`);
        }
        this.dimensionSizes = sizes;
    }

    public getDimensionSize(index: number): number {
        if (index < 0 || index >= this.dimension) {
            throw new Error(`Index ${index} out of bounds for dimension ${this.dimension}`);
        }
        return this.dimensionSizes[index];
    }

    public getTypeString(): string {
        const strs: string[] = [];
        if (this.baseType instanceof UnionType) {
            strs.push('(' + this.baseType.toString() + ')');
        } else if (this.baseType) {
            strs.push(this.baseType.toString());
        }

        for (let i = 0; i < this.dimension; i++) {
            if (i < this.dimensionSizes.length && this.dimensionSizes[i] >= 0) {
                strs.push(`[${this.dimensionSizes[i]}]`); // Display specific size
            } else {
                strs.push('[]'); // No size specified
            }
        }
        return strs.join('');
    }
}

export class AutoType extends Type {
    private static readonly INSTANCE = new AutoType();

    public static getInstance(): AutoType {
        return this.INSTANCE;
    }

    private constructor() {
        super();
    }

    public getTypeString(): string {
        return 'auto';
    }
}