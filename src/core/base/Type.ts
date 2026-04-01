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

/**
 * @category core/base/type
 */
export abstract class Type {
    /** True if this type can contain other types and thus participate in cycles */
    protected canParticipateInCycle(): boolean {
        return false;
    }

    /**
     * Returns a short display name for this type when used as a cycle back-reference.
     * Override in named types (AliasType, ClassType, GenericType, UnclearReferenceType)
     * to return the type name; default returns UNKNOWN_KEYWORD for anonymous types.
     */
    protected getDisplayNameForCycle(): string {
        return UNKNOWN_KEYWORD;
    }

    toString(): string {
        return this.toStringWithVisited(new Set<Type>());
    }

    /**
     * Converts type to string with cycle detection. Use when recursing into child types.
     * Only container types are tracked in visited. We add on enter and remove on leave
     * so that the same type in different branches (e.g. UnionType(A|B) where both use
     * NumberType) is not falsely detected as a cycle.
     * When a cycle is detected, returns the type's display name (e.g. A for AliasType)
     * instead of a generic placeholder.
     * @internal Package-internal use only. Prefer toString() for public API.
     * @param visited Set of container types in the recursion path; omitted or undefined uses a new empty set (same root semantics as {@link toString}).
     */
    public toStringWithVisited(visited: Set<Type> = new Set<Type>()): string {
        if (this.canParticipateInCycle() && visited.has(this)) {
            return this.getDisplayNameForCycle();
        }
        if (this.canParticipateInCycle()) {
            visited.add(this);
        }
        try {
            return this.getTypeString(visited);
        } finally {
            if (this.canParticipateInCycle()) {
                visited.delete(this);
            }
        }
    }

    protected abstract getTypeString(visited?: Set<Type>): string;
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

    protected getTypeString(_visited?: Set<Type>): string {
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

    protected getTypeString(_visited?: Set<Type>): string {
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

    protected canParticipateInCycle(): boolean {
        return true;
    }

    protected getDisplayNameForCycle(): string {
        return this.name;
    }

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

    protected getTypeString(visited: Set<Type> = new Set<Type>()): string {
        let str = this.name;
        if (this.genericTypes.length > 0) {
            str += '<' + this.genericTypes.map(t => t.toStringWithVisited(visited)).join(',') + '>';
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

    protected getTypeString(_visited?: Set<Type>): string {
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

    private constructor() {
        super(NUMBER_KEYWORD);
    }

    public static getInstance(): NumberType {
        return this.INSTANCE;
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

export class StringType extends PrimitiveType {
    private static readonly INSTANCE = new StringType();

    private constructor() {
        super(STRING_KEYWORD);
    }

    public static getInstance(): StringType {
        return this.INSTANCE;
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

    protected getTypeString(_visited?: Set<Type>): string {
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

    protected canParticipateInCycle(): boolean {
        return true;
    }

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

    protected getTypeString(visited: Set<Type> = new Set<Type>()): string {
        const typesString: string[] = [];
        this.getTypes().forEach(t => {
            if (t instanceof UnionType || t instanceof IntersectionType) {
                typesString.push(`(${t.toStringWithVisited(visited)})`);
            } else {
                typesString.push(t.toStringWithVisited(visited));
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

    protected canParticipateInCycle(): boolean {
        return true;
    }

    constructor(types: Type[]) {
        super();
        this.types = [...types];
    }

    public getTypes(): Type[] {
        return this.types;
    }

    protected getTypeString(visited: Set<Type> = new Set<Type>()): string {
        const typesString: string[] = [];
        this.getTypes().forEach(t => {
            if (t instanceof UnionType || t instanceof IntersectionType) {
                typesString.push(`(${t.toStringWithVisited(visited)})`);
            } else {
                typesString.push(t.toStringWithVisited(visited));
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

    protected getTypeString(_visited?: Set<Type>): string {
        return VOID_KEYWORD;
    }
}

export class NeverType extends Type {
    private static readonly INSTANCE = new NeverType();

    public static getInstance(): NeverType {
        return this.INSTANCE;
    }

    private constructor() {
        super();
    }

    protected getTypeString(_visited?: Set<Type>): string {
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

    protected canParticipateInCycle(): boolean {
        return true;
    }

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

    protected getTypeString(visited: Set<Type> = new Set<Type>()): string {
        const sig = this.methodSignature.getMethodSubSignature();
        const classStr = this.methodSignature.getDeclaringClassSignature().toString();
        const paramStrs = sig.getParameterTypes()
            .map(t => t ? t.toStringWithVisited(visited) : UnknownType.getInstance().toString())
            .join(', ');
        const methodPart = (sig.isStatic() ? '[static]' : '') + sig.getMethodName() + '(' + paramStrs + ')';
        return classStr + '.' + methodPart;
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

    protected getTypeString(visited: Set<Type> = new Set<Type>()): string {
        return 'closures: ' + super.getTypeString(visited);
    }
}

/**
 * type of an object
 * @category core/base/type
 */
export class ClassType extends Type {
    private classSignature: ClassSignature;
    private realGenericTypes?: Type[];

    protected canParticipateInCycle(): boolean {
        return true;
    }

    protected getDisplayNameForCycle(): string {
        return this.classSignature.toString();
    }

    constructor(classSignature: ClassSignature, realGenericTypes?: Type[]) {
        super();
        this.classSignature = classSignature;
        this.realGenericTypes = realGenericTypes;
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

    protected getTypeString(visited: Set<Type> = new Set<Type>()): string {
        let temp = this.classSignature.toString();
        if (this.realGenericTypes && this.realGenericTypes.length > 0) {
            temp += `<${this.realGenericTypes.map(t => t.toStringWithVisited(visited)).join(',')}>`;
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

    protected canParticipateInCycle(): boolean {
        return true;
    }

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

    protected getTypeString(visited: Set<Type> = new Set<Type>()): string {
        const strs: string[] = [];
        if (this.getReadonlyFlag()) {
            strs.push('readonly ');
        }
        if (this.baseType) {
            if (this.baseType instanceof UnionType || this.baseType instanceof IntersectionType) {
                strs.push('(' + this.baseType.toStringWithVisited(visited) + ')');
            } else {
                strs.push(this.baseType.toStringWithVisited(visited));
            }
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

    protected canParticipateInCycle(): boolean {
        return true;
    }

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

    protected getTypeString(visited: Set<Type> = new Set<Type>()): string {
        const typesStr = this.types.map(t => t.toStringWithVisited(visited)).join(', ');
        if (this.getReadonlyFlag()) {
            return 'readonly [' + typesStr + ']';
        }
        return '[' + typesStr + ']';
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

    protected canParticipateInCycle(): boolean {
        return true;
    }

    protected getDisplayNameForCycle(): string {
        return this.name;
    }

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

    protected getTypeString(visited: Set<Type> = new Set<Type>()): string {
        let res = this.getSignature().toString(visited);
        const realGeneric = this.getRealGenericTypes();
        const generic = this.getGenericTypes();
        if (realGeneric && realGeneric.length > 0) {
            res += `<${realGeneric.map(t => t.toStringWithVisited(visited)).join(',')}>`;
        } else if (generic && generic.length > 0) {
            res += `<${generic.map(gt => gt.toStringWithVisited(visited)).join(',')}>`;
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

    protected canParticipateInCycle(): boolean {
        return true;
    }

    protected getDisplayNameForCycle(): string {
        return this.name;
    }

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

    protected getTypeString(visited: Set<Type> = new Set<Type>()): string {
        let str = this.name;
        if (this.constraint) {
            str += ' extends ' + this.constraint.toStringWithVisited(visited);
        }
        if (this.defaultType) {
            str += ' = ' + this.defaultType.toStringWithVisited(visited);
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

    protected getTypeString(_visited?: Set<Type>): string {
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

    protected getTypeString(_visited?: Set<Type>): string {
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

    protected getTypeString(_visited?: Set<Type>): string {
        return this.signature.toString();
    }
}
