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

import { AliasTypeSignature, ClassSignature, FieldSignature, MethodSignature, NamespaceSignature } from '../model/ArkSignature';
import { ArkExport, ExportType } from '../model/ArkExport';
import { MODIFIER_TYPE_MASK, ModifierType } from '../model/ArkBaseModel';
import {
    ANY_KEYWORD,
    BIGINT_KEYWORD,
    BOOLEAN_KEYWORD,
    NEVER_KEYWORD,
    NULL_KEYWORD,
    NUMBER_KEYWORD,
    STRING_KEYWORD,
    UNDEFINED_KEYWORD,
    UNKNOWN_KEYWORD,
    VOID_KEYWORD,
} from '../common/TSConst';
import { Local } from './Local';
import { Constant } from './Constant';
import { Value } from './Value';
import { CppTypeInfo } from '../../ast/ArkCxxAstNode';

/**
 * @category core/base/type
 */
export abstract class Type {
    toString(): string {
        return this.getTypeString();
    }

    abstract getTypeString(): string;
}

/**
 * any type
 * @category core/base/type
 */
export class AnyType extends Type {
    private static readonly INSTANCE = new AnyType();

    public static getInstance(): AnyType {
        return this.INSTANCE;
    }

    private constructor() {
        super();
    }

    public getTypeString(): string {
        return ANY_KEYWORD;
    }
}

/**
 * unknown type
 * @category core/base/type
 */
export class UnknownType extends Type {
    private static readonly INSTANCE = new UnknownType();

    public static getInstance(): UnknownType {
        return this.INSTANCE;
    }

    private constructor() {
        super();
    }

    public getTypeString(): string {
        return UNKNOWN_KEYWORD;
    }
}

/**
 * unclear type
 * @category core/base/type
 */
export class UnclearReferenceType extends Type {
    private name: string;
    private genericTypes: Type[];

    constructor(name: string, genericTypes: Type[] = []) {
        super();
        this.name = name;
        this.genericTypes = genericTypes;
    }

    public getName(): string {
        return this.name;
    }

    public getGenericTypes(): Type[] {
        return this.genericTypes;
    }

    public getTypeString(): string {
        let str = this.name;
        if (this.genericTypes.length > 0) {
            str += '<' + this.genericTypes.join(',') + '>';
        }
        return str;
    }
}

/**
 * primitive type
 * @category core/base/type
 */
export abstract class PrimitiveType extends Type {
    private name: string;

    constructor(name: string) {
        super();
        this.name = name;
    }

    public getName(): string {
        return this.name;
    }

    public getTypeString(): string {
        return this.name;
    }
}

export class BooleanType extends PrimitiveType {
    private static readonly INSTANCE = new BooleanType();

    private constructor() {
        super(BOOLEAN_KEYWORD);
    }

    public static getInstance(): BooleanType {
        return this.INSTANCE;
    }
}

export class NumberType extends PrimitiveType {
    private static readonly INSTANCE = new NumberType();

    protected constructor() {
        super(NUMBER_KEYWORD);
    }

    public static getInstance(): NumberType {
        return this.INSTANCE;
    }
}

// C++ number has multiple integer and floating-point type distinctions, so derive a C++ number type
export class CXXNumberType extends NumberType {
    private readonly cxxType: string;

    private constructor(cxxType: string) {
        super();
        this.cxxType = cxxType;
    }

    public static getInstance(cxxType?: string): CXXNumberType | NumberType {
        if (cxxType) {
            return new CXXNumberType(cxxType);
        }
        return NumberType.getInstance();
    }

    public getCxxType(): string {
        return this.cxxType;
    }

    public getTypeString(): string {
        return this.cxxType;
    }
}

/**
 * bigint type
 * @category core/base/type
 */
export class BigIntType extends PrimitiveType {
    private static readonly INSTANCE = new BigIntType();

    private constructor() {
        super(BIGINT_KEYWORD);
    }

    public static getInstance(): BigIntType {
        return this.INSTANCE;
    }
}

/**
 * StringType type
 * @category core/base/type
 */
export class StringType extends PrimitiveType {
    private static readonly INSTANCE = new StringType();

    protected constructor() {
        super(STRING_KEYWORD);
    }

    public static getInstance(): StringType {
        return this.INSTANCE;
    }
}

/**
 * CXXStringType type
 * C++ string has different character type distinctions, so derive a C++ string type
 * @category core/base/type
 */
export class CXXStringType extends StringType {
    private readonly cxxType: string;

    private constructor(cxxType: string) {
        super();
        this.cxxType = cxxType;
    }

    public static getInstance(cxxType?: string): CXXStringType | StringType {
        if (cxxType) {
            return new CXXStringType(cxxType);
        }
        return StringType.getInstance();
    }

    public getCxxType(): string {
        return this.cxxType;
    }

    public getTypeString(): string {
        return this.cxxType.toString();
    }
}

/**
 * null type
 * @category core/base/type
 */
export class NullType extends PrimitiveType {
    private static readonly INSTANCE = new NullType();

    public static getInstance(): NullType {
        return this.INSTANCE;
    }

    private constructor() {
        super(NULL_KEYWORD);
    }
}

/**
 * undefined type
 * @category core/base/type
 */
export class UndefinedType extends PrimitiveType {
    private static readonly INSTANCE = new UndefinedType();

    public static getInstance(): UndefinedType {
        return this.INSTANCE;
    }

    private constructor() {
        super(UNDEFINED_KEYWORD);
    }
}

/**
 * literal type
 * @category core/base/type
 */
export class LiteralType extends PrimitiveType {
    public static readonly TRUE = new LiteralType(true);
    public static readonly FALSE = new LiteralType(false);

    private literalName: string | number | boolean;

    constructor(literalName: string | number | boolean) {
        super('literal');
        this.literalName = literalName;
    }

    public getLiteralName(): string | number | boolean {
        return this.literalName;
    }

    public getTypeString(): string {
        return this.literalName.toString();
    }
}

/**
 * union type
 * @category core/base/type
 */
export class UnionType extends Type {
    private types: Type[];
    private currType: Type; // The true type of the value at this time
    constructor(types: Type[], currType: Type = UnknownType.getInstance()) {
        super();
        this.types = [...types];
        this.currType = currType;
    }

    public getTypes(): Type[] {
        return this.types;
    }

    public getCurrType(): Type {
        return this.currType;
    }

    public setCurrType(newType: Type): void {
        this.currType = newType;
    }

    public getTypeString(): string {
        let typesString: string[] = [];
        this.getTypes().forEach(t => {
            if (t instanceof UnionType || t instanceof IntersectionType) {
                typesString.push(`(${t.toString()})`);
            } else {
                typesString.push(t.toString());
            }
        });
        return typesString.join('|');
    }

    // TODO: Need to remove this function because of IntersectionType has been added.
    public flatType(): Type[] {
        const result: Type[] = [];
        this.types.forEach(t => {
            if (t instanceof UnionType) {
                t.flatType().forEach(e => result.push(e));
            } else {
                result.push(t);
            }
        });
        return result;
    }
}

/**
 * intersection type
 * @category core/base/type
 */
export class IntersectionType extends Type {
    private types: Type[];

    constructor(types: Type[]) {
        super();
        this.types = [...types];
    }

    public getTypes(): Type[] {
        return this.types;
    }

    public getTypeString(): string {
        let typesString: string[] = [];
        this.getTypes().forEach(t => {
            if (t instanceof UnionType || t instanceof IntersectionType) {
                typesString.push(`(${t.toString()})`);
            } else {
                typesString.push(t.toString());
            }
        });
        return typesString.join('&');
    }
}

/**
 * types for function void return type
 * @category core/base/type
 */
export class VoidType extends Type {
    private static readonly INSTANCE = new VoidType();

    public static getInstance(): VoidType {
        return this.INSTANCE;
    }

    private constructor() {
        super();
    }

    public getTypeString(): string {
        return VOID_KEYWORD;
    }
}

/**
 * NeverType type
 * @category core/base/type
 */
export class NeverType extends Type {
    private static readonly INSTANCE = new NeverType();

    public static getInstance(): NeverType {
        return this.INSTANCE;
    }

    private constructor() {
        super();
    }

    public getTypeString(): string {
        return NEVER_KEYWORD;
    }
}

/**
 * function type
 * @category core/base/type
 */
export class FunctionType extends Type {
    private methodSignature: MethodSignature;
    private realGenericTypes?: Type[];

    constructor(methodSignature: MethodSignature, realGenericTypes?: Type[]) {
        super();
        this.methodSignature = methodSignature;
        this.realGenericTypes = realGenericTypes;
    }

    public getMethodSignature(): MethodSignature {
        return this.methodSignature;
    }

    public getRealGenericTypes(): Type[] | undefined {
        return this.realGenericTypes;
    }

    public getTypeString(): string {
        return this.methodSignature.toString();
    }
}

/**
 * types for closures which is a special FunctionType with a lexical env
 * @category core/base/type
 */
export class ClosureType extends FunctionType {
    private lexicalEnv: LexicalEnvType;

    constructor(lexicalEnv: LexicalEnvType, methodSignature: MethodSignature, realGenericTypes?: Type[]) {
        super(methodSignature, realGenericTypes);
        this.lexicalEnv = lexicalEnv;
    }

    public getLexicalEnv(): LexicalEnvType {
        return this.lexicalEnv;
    }

    public getTypeString(): string {
        return 'closures: ' + super.getTypeString();
    }
}

/**
 * type of object
 * @category core/base/type
 */
export class ClassType extends Type {
    private classSignature: ClassSignature;
    private realGenericTypes?: Type[];
    private applyType: string; // Application types * and &

    constructor(classSignature: ClassSignature, realGenericTypes?: Type[], applyType: string = '') {
        super();
        this.classSignature = classSignature;
        this.realGenericTypes = realGenericTypes;
        this.applyType = applyType;
    }

    public getApplyType(): string {
        return this.applyType;
    }

    public setApplyType(applyType: string): void {
        this.applyType = applyType;
    }

    public getClassSignature(): ClassSignature {
        return this.classSignature;
    }

    public setClassSignature(newClassSignature: ClassSignature): void {
        this.classSignature = newClassSignature;
    }

    public getRealGenericTypes(): Type[] | undefined {
        return this.realGenericTypes;
    }

    public setRealGenericTypes(types: Type[] | undefined): void {
        this.realGenericTypes = types;
    }

    public getTypeString(): string {
        let temp = this.classSignature.toString();
        let generic = this.realGenericTypes?.join(',');
        if (generic) {
            temp += `<${generic}>`;
        }
        return temp;
    }
}

/**
 * Array type
 * @category core/base/type
 * @extends Type
 * @example
 ```typescript
 // baseType is number, dimension is 1, readonlyFlag is true
 let a: readonly number[] = [1, 2, 3];

 // baseType is number, dimension is 1, readonlyFlag is undefined
 let a: number[] = [1, 2, 3];
 ```
 */
export class ArrayType extends Type {
    private baseType: Type;
    private dimension: number;
    private readonlyFlag?: boolean;

    constructor(baseType: Type, dimension: number) {
        super();
        this.baseType = baseType;
        this.dimension = dimension;
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

    public setReadonlyFlag(readonlyFlag: boolean): void {
        this.readonlyFlag = readonlyFlag;
    }

    public getReadonlyFlag(): boolean | undefined {
        return this.readonlyFlag;
    }

    public getTypeString(): string {
        const strs: string[] = [];
        if (this.getReadonlyFlag()) {
            strs.push('readonly ');
        }
        if (this.baseType instanceof UnionType || this.baseType instanceof IntersectionType) {
            strs.push('(' + this.baseType.toString() + ')');
        } else if (this.baseType) {
            strs.push(this.baseType.toString());
        }
        for (let i = 0; i < this.dimension; i++) {
            strs.push('[]');
        }
        return strs.join('');
    }
}

/**
 * Tuple type
 * @category core/base/type
 * @extends Type
 * @example
 ```typescript
 // types are number and string, dimension is 1, readonlyFlag is true
 let a: readonly number[] = [1, 2, 3];

 // baseType is number, dimension is 1, readonlyFlag is undefined
 let a: number[] = [1, 2, 3];
 ```
 */
export class TupleType extends Type {
    private types: Type[];
    private readonlyFlag?: boolean;

    constructor(types: Type[]) {
        super();
        this.types = types;
    }

    public getTypes(): Type[] {
        return this.types;
    }

    public setReadonlyFlag(readonlyFlag: boolean): void {
        this.readonlyFlag = readonlyFlag;
    }

    public getReadonlyFlag(): boolean | undefined {
        return this.readonlyFlag;
    }

    public getTypeString(): string {
        if (this.getReadonlyFlag()) {
            return 'readonly [' + this.types.join(', ') + ']';
        }
        return '[' + this.types.join(', ') + ']';
    }
}

/**
 * alias type
 * @category core/base/type
 * @extends Type
 * @example
 ```typescript
 // alias type A is defined without any genericTypes (undefined) or realGenericTypes (undefined)
 type A = number;

 // alias type B is defined with genericTypes but not instance with realGenericTypes (undefined)
 type B<T> = T[];

 // alias type could also be defined with another instance generic type such as aliaType, FunctionType and ClassType
 // genericTypes and realGenericTypes of C are both undefined
 // originalType of C is an instance of B with genericTypes [T] and realGenericTypes [numberType]
 type C = B<number>;
 ```
 */
export class AliasType extends Type implements ArkExport {
    private originalType: Type;
    private name: string;
    private signature: AliasTypeSignature;
    protected modifiers?: number;
    private genericTypes?: GenericType[];
    private realGenericTypes?: Type[];

    constructor(name: string, originalType: Type, signature: AliasTypeSignature, genericTypes?: GenericType[]) {
        super();
        this.name = name;
        this.originalType = originalType;
        this.signature = signature;
        this.genericTypes = genericTypes;
    }

    public getName(): string {
        return this.name;
    }

    public setOriginalType(type: Type): void {
        this.originalType = type;
    }

    public getOriginalType(): Type {
        return this.originalType;
    }

    public getTypeString(): string {
        let res = this.getSignature().toString();
        let generic = this.getRealGenericTypes()?.join(',') ?? this.getGenericTypes()?.join(',');
        if (generic) {
            res += `<${generic}>`;
        }
        return res;
    }

    public getExportType(): ExportType {
        return ExportType.TYPE;
    }

    public getModifiers(): number {
        if (!this.modifiers) {
            return 0;
        }
        return this.modifiers;
    }

    public containsModifier(modifierType: ModifierType): boolean {
        if (!this.modifiers) {
            return false;
        }

        return (this.modifiers & modifierType) === modifierType;
    }

    public setModifiers(modifiers: number): void {
        if (modifiers !== 0) {
            this.modifiers = modifiers;
        }
    }

    public addModifier(modifier: ModifierType | number): void {
        this.modifiers = this.getModifiers() | modifier;
    }

    public removeModifier(modifier: ModifierType): void {
        if (!this.modifiers) {
            return;
        }
        this.modifiers &= MODIFIER_TYPE_MASK ^ modifier;
    }

    public getSignature(): AliasTypeSignature {
        return this.signature;
    }

    public setGenericTypes(genericTypes: GenericType[]): void {
        this.genericTypes = genericTypes;
    }

    public getGenericTypes(): GenericType[] | undefined {
        return this.genericTypes;
    }

    public setRealGenericTypes(realGenericTypes: Type[]): void {
        this.realGenericTypes = realGenericTypes;
    }

    public getRealGenericTypes(): Type[] | undefined {
        return this.realGenericTypes;
    }
}

export class GenericType extends Type {
    private name: string;
    private defaultType?: Type;
    private constraint?: Type;
    private index: number = 0;

    constructor(name: string, defaultType?: Type, constraint?: Type) {
        super();
        this.name = name;
        this.defaultType = defaultType;
        this.constraint = constraint;
    }

    public getName(): string {
        return this.name;
    }

    public getDefaultType(): Type | undefined {
        return this.defaultType;
    }

    public setDefaultType(type: Type): void {
        this.defaultType = type;
    }

    public getConstraint(): Type | undefined {
        return this.constraint;
    }

    public setConstraint(type: Type): void {
        this.constraint = type;
    }

    public setIndex(index: number): void {
        this.index = index;
    }

    public getIndex(): number {
        return this.index ?? 0;
    }

    public getTypeString(): string {
        let str = this.name;
        if (this.constraint) {
            str += ' extends ' + this.constraint.toString();
        }
        if (this.defaultType) {
            str += ' = ' + this.defaultType.toString();
        }
        return str;
    }
}

export abstract class AnnotationType extends Type {
    private originType: string;

    protected constructor(originType: string) {
        super();
        this.originType = originType;
    }

    public getOriginType(): string {
        return this.originType;
    }

    public getTypeString(): string {
        return this.originType;
    }
}

export class AnnotationNamespaceType extends AnnotationType {
    private namespaceSignature: NamespaceSignature = NamespaceSignature.DEFAULT;

    public static getInstance(signature: NamespaceSignature): AnnotationNamespaceType {
        const type = new AnnotationNamespaceType(signature.getNamespaceName());
        type.setNamespaceSignature(signature);
        return type;
    }

    public getNamespaceSignature(): NamespaceSignature {
        return this.namespaceSignature;
    }

    public setNamespaceSignature(signature: NamespaceSignature): void {
        this.namespaceSignature = signature;
    }

    constructor(originType: string) {
        super(originType);
    }

    public getOriginType(): string {
        return super.getOriginType();
    }
}

export class AnnotationTypeQueryType extends AnnotationType {
    constructor(originType: string) {
        super(originType);
    }
}

export class LexicalEnvType extends Type {
    private nestedMethodSignature: MethodSignature;
    private closures: Local[] = [];

    constructor(nestedMethod: MethodSignature, closures?: Local[]) {
        super();
        this.nestedMethodSignature = nestedMethod;
        this.closures = closures ?? this.closures;
    }

    public getNestedMethod(): MethodSignature {
        return this.nestedMethodSignature;
    }

    public getClosures(): Local[] {
        return this.closures;
    }

    public addClosure(closure: Local): void {
        this.closures.push(closure);
    }

    public getTypeString(): string {
        return `[${this.getClosures().join(', ')}]`;
    }
}

export class EnumValueType extends Type {
    private signature: FieldSignature;
    private constant?: Constant;

    constructor(signature: FieldSignature, constant?: Constant) {
        super();
        this.signature = signature;
        this.constant = constant;
    }

    public getFieldSignature(): FieldSignature {
        return this.signature;
    }

    public getConstant(): Constant | undefined {
        return this.constant;
    }

    public getTypeString(): string {
        return this.signature.toString();
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
    LVALUE_REF = 'LVALUE_REF',
    RVALUE_REF = 'RVALUE_REF',
    UNIVERSAL_REF = 'UNIVERSAL_REF',
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
 *The LabelType class represents the label type, inherited from the PointerType class.
 *This is a singleton class used to represent the label type in the program.
 */
export class LabelType extends PointerType {
    private static readonly INSTANCE = new LabelType();

    protected constructor() {
        super(VoidType.getInstance(), 1);
    }

    public static getInstance(): LabelType {
        return this.INSTANCE;
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

/**
 *The FunctionPointer class represents a function pointer type
 *Inherited from Type base class, used to encapsulate C++function pointer type information
 */
export class FunctionPointer extends Type {
    funType: CppTypeInfo;

    constructor(funType: CppTypeInfo) {
        super();
        this.funType = funType;
    }

    public getTypeString(): string {
        return String(this.funType.qualType);
    }

    public setFunType(funType: CppTypeInfo): void {
        this.funType = funType;
    }

    public getFunType(): CppTypeInfo {
        return this.funType;
    }
}
