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
import { SignatureCanonicalizerRegistry } from '../common/SignatureCanonicalizerRegistry';

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

    protected constructor() {
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
 * Null type in TS/ArkTS, and it also refers to nullptr in Cxx.
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

    protected getTypeString(_visited?: Set<Type>): string {
        return NEVER_KEYWORD;
    }
}

/**
 * function type
 * @category core/base/type
 */
export class FunctionType extends Type {
    private methodSigID: number;
    private realGenericTypes?: Type[];

    /**
     * @internal temp 兜底时的锚点：强引用 MethodSignature 实例（弱注册表语义，
     * 见 ClassType.tempClassSignature 注释）。formal 路径下为 undefined。
     */
    private tempMethodSignature?: MethodSignature;
    /** @internal temp 兜底登记的 tempSigID（对象恒等 ID，活对象内稳定）。 */
    private tempSigID?: number;

    protected canParticipateInCycle(): boolean {
        return true;
    }

    constructor(methodSignature: MethodSignature, realGenericTypes?: Type[]) {
        super();
        const reg = SignatureCanonicalizerRegistry.getInstance();
        // 与 ClassType 同构的路由：formal 只读命中（不写 formal 空间，防无 model
        // 空洞）→ 未命中（unclear）→ temp 弱注册 + 本对象锚定。
        const existingId = reg.methodSigCanonicalizer.getExistingId(methodSignature);
        if (existingId !== -1) {
            this.methodSigID = existingId;
            this.tempMethodSignature = undefined;
            this.tempSigID = undefined;
        } else {
            this.methodSigID = -1;
            this.tempMethodSignature = methodSignature;
            this.tempSigID = reg.tempMethodSigCanonicalizer.register(methodSignature);
        }
        this.realGenericTypes = realGenericTypes;
    }

    public get methodSignature(): MethodSignature {
        return this.getMethodSignature();
    }

    public getMethodSignature(): MethodSignature {
        if (this.methodSigID >= 0) {
            return SignatureCanonicalizerRegistry.getInstance().methodSigCanonicalizer.get(this.methodSigID)!;
        }
        if (this.tempMethodSignature !== undefined) {
            // 锚点直返（弱注册表语义下唯一可靠的取回路径）。
            return this.tempMethodSignature;
        }
        throw new Error('FunctionType has no signature');
    }

    /** @internal Get the formal MethodSigID. */
    public getMethodSigID(): number {
        return this.methodSigID;
    }

    /** @internal Get the temp sigID for the unresolved-signature registration. */
    public getTempSigID(): number | undefined {
        return this.tempSigID;
    }

    public getRealGenericTypes(): Type[] | undefined {
        return this.realGenericTypes;
    }

    protected getTypeString(visited: Set<Type> = new Set<Type>()): string {
        const sig = this.getMethodSignature().getMethodSubSignature();
        const classStr = this.getMethodSignature().getDeclaringClassSignature().toString();
        const paramStrs = sig
            .getParameterTypes()
            .map(t => (t ? t.toStringWithVisited(visited) : UnknownType.getInstance().toString()))
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
 * type of object
 * @category core/base/type
 */
export class ClassType extends Type {
    private classSigID: number;
    private realGenericTypes?: Type[];

    /**
     * @internal temp 兜底时的锚点：强引用签名实例，保证弱注册表中该 tempSigID
     * 对应的 WeakRef 在本 ClassType 存活期间有效（最后一个持有者死亡后签名才可
     * 被 GC 回收）。formal 路径下为 undefined。
     */
    private tempClassSignature?: ClassSignature;
    /** @internal temp 兜底登记的 tempSigID（对象恒等 ID，活对象内稳定）。 */
    private tempSigID?: number;

    protected canParticipateInCycle(): boolean {
        return true;
    }

    protected getDisplayNameForCycle(): string {
        return this.getClassSignature().toString();
    }

    constructor(classSignature: ClassSignature, realGenericTypes?: Type[]) {
        super();
        const reg = SignatureCanonicalizerRegistry.getInstance();
        // formal 只读命中：值查找（getExistingId），命中即用——ClassType 不写
        // formal 空间（原盲写 getId 是无 model 空洞的根源：clear 但未注册的签名
        // 值一旦进入 formal，后到的真实 ArkClass.setSignature 会因 existing≥0
        // 跳过注册，形成永久洞 + getClass 查询失效）。
        const existingId = reg.classSigCanonicalizer.getExistingId(classSignature);
        if (existingId !== -1) {
            this.classSigID = existingId;
            this.tempClassSignature = undefined;
        } else {
            // temp 兜底（不区分 isUnclear）：弱注册表登记（同实例复用 ID，新实例
            // 新 ID），本对象以 tempClassSignature 锚定该实例。clear 未注册签名
            // 与 unclear stub 统一走此路径；解析（真实类后到注册后）由消费方的
            // 值查找（getArkClassBySig 等）完成。
            this.classSigID = -1;
            this.tempClassSignature = classSignature;
            this.tempSigID = reg.tempClassSigCanonicalizer.register(classSignature);
        }
        this.realGenericTypes = realGenericTypes;
    }

    public get classSignature(): ClassSignature {
        return this.getClassSignature();
    }

    public getClassSignature(): ClassSignature {
        if (this.classSigID >= 0) {
            return SignatureCanonicalizerRegistry.getInstance().classSigCanonicalizer.get(this.classSigID)!;
        }
        if (this.tempClassSignature !== undefined) {
            // 锚点直返：本对象强引用的实例（弱注册表语义下 get(tempSigID) 可能因
            // 其他持有者全部死亡而查不回，锚点是唯一可靠的取回路径）。
            return this.tempClassSignature;
        }
        throw new Error('ClassType has no signature');
    }

    public setClassSignature(newClassSignature: ClassSignature): void {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        // 与构造器同构的路由：formal 只读命中 → 直接使用；未命中（无论 unclear
        // 还是 clear 未注册）→ temp 弱注册 + 本对象换锚。旧引用无需显式释放——
        // 弱注册表由 GC 收敛（本对象丢弃旧锚点后，若无其他持有者则旧签名可回收）。
        const existingId = reg.classSigCanonicalizer.getExistingId(newClassSignature);
        if (existingId !== -1) {
            this.classSigID = existingId;
            this.tempClassSignature = undefined;
            this.tempSigID = undefined;
        } else {
            this.classSigID = -1;
            this.tempClassSignature = newClassSignature;
            this.tempSigID = reg.tempClassSigCanonicalizer.register(newClassSignature);
        }
    }

    /** @internal Get the formal ClassSigID. */
    public getClassSigID(): number {
        return this.classSigID;
    }

    /** @internal Get the temp sigID for the unresolved-signature registration. */
    public getTempSigID(): number | undefined {
        return this.tempSigID;
    }

    public getRealGenericTypes(): Type[] | undefined {
        return this.realGenericTypes;
    }

    public setRealGenericTypes(types: Type[] | undefined): void {
        this.realGenericTypes = types;
    }

    protected getTypeString(visited: Set<Type> = new Set<Type>): string {
        let temp = this.getClassSignature().toString();
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
    private nestedMethodSigID: number;
    private closures: Local[];

    /**
     * @internal temp 兜底时的锚点：强引用 MethodSignature 实例（弱注册表语义，
     * 见 ClassType.tempClassSignature 注释）。formal 路径下为 undefined。
     */
    private tempNestedMethod?: MethodSignature;
    /** @internal temp 兜底登记的 tempSigID（对象恒等 ID，活对象内稳定）。 */
    private tempSigID?: number;

    constructor(nestedMethod: MethodSignature, closures?: Local[]) {
        super();
        const reg = SignatureCanonicalizerRegistry.getInstance();
        // 与 ClassType 同构的路由：formal 只读命中 → temp 弱注册 + 锚定。
        const existingId = reg.methodSigCanonicalizer.getExistingId(nestedMethod);
        if (existingId !== -1) {
            this.nestedMethodSigID = existingId;
            this.tempNestedMethod = undefined;
            this.tempSigID = undefined;
        } else {
            this.nestedMethodSigID = -1;
            this.tempNestedMethod = nestedMethod;
            this.tempSigID = reg.tempMethodSigCanonicalizer.register(nestedMethod);
        }
        this.closures = closures ?? [];
    }

    public get nestedMethodSignature(): MethodSignature {
        return this.getNestedMethod();
    }

    public getNestedMethod(): MethodSignature {
        if (this.nestedMethodSigID >= 0) {
            return SignatureCanonicalizerRegistry.getInstance().methodSigCanonicalizer.get(this.nestedMethodSigID)!;
        }
        if (this.tempNestedMethod !== undefined) {
            // 锚点直返（弱注册表语义下唯一可靠的取回路径）。
            return this.tempNestedMethod;
        }
        throw new Error('LexicalEnvType has no signature');
    }

    /** @internal Get the formal MethodSigID. */
    public getMethodSigID(): number {
        return this.nestedMethodSigID;
    }

    /** @internal Get the temp sigID for the unresolved-signature registration. */
    public getTempSigID(): number | undefined {
        return this.tempSigID;
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
    private fieldSigID: number;
    private constant?: Constant;

    /**
     * @internal temp 兜底时的锚点：强引用 FieldSignature 实例（弱注册表语义，
     * 见 ClassType.tempClassSignature 注释）。formal 路径下为 undefined。
     */
    private tempFieldSignature?: FieldSignature;
    /** @internal temp 兜底登记的 tempSigID（对象恒等 ID，活对象内稳定）。 */
    private tempSigID?: number;

    constructor(signature: FieldSignature, constant?: Constant) {
        super();
        const reg = SignatureCanonicalizerRegistry.getInstance();
        // 与 ClassType 同构的路由：formal 只读命中 → temp 弱注册 + 锚定。
        const existingId = reg.fieldSigCanonicalizer.getExistingId(signature);
        if (existingId !== -1) {
            this.fieldSigID = existingId;
            this.tempFieldSignature = undefined;
            this.tempSigID = undefined;
        } else {
            this.fieldSigID = -1;
            this.tempFieldSignature = signature;
            this.tempSigID = reg.tempFieldSigCanonicalizer.register(signature);
        }
        this.constant = constant;
    }

    public get signature(): FieldSignature {
        return this.getFieldSignature();
    }

    public getFieldSignature(): FieldSignature {
        if (this.fieldSigID >= 0) {
            return SignatureCanonicalizerRegistry.getInstance().fieldSigCanonicalizer.get(this.fieldSigID)!;
        }
        if (this.tempFieldSignature !== undefined) {
            // 锚点直返（弱注册表语义下唯一可靠的取回路径）。
            return this.tempFieldSignature;
        }
        throw new Error('EnumValueType has no signature');
    }

    /** @internal Get the formal FieldSigID. */
    public getFieldSigID(): number {
        return this.fieldSigID;
    }

    /** @internal Get the temp sigID for the unresolved-signature registration. */
    public getTempSigID(): number | undefined {
        return this.tempSigID;
    }

    public getConstant(): Constant | undefined {
        return this.constant;
    }

    protected getTypeString(_visited?: Set<Type>): string {
        return this.getFieldSignature().toString();
    }
}
