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
    PROMISE,
    STRING_KEYWORD,
    UNDEFINED_KEYWORD,
    UNKNOWN_KEYWORD,
    VOID_KEYWORD,
} from '../common/TSConst';
import { Local } from './Local';
import { Constant } from './Constant';
import { SignatureCanonicalizerRegistry } from '../common/SignatureCanonicalizerRegistry';
import Logger, { LOG_MODULE_TYPE } from '../../utils/logger';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'Type');

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

    /**
     * Whether this type is unresolvable / not yet settled, i.e. type inference cannot
     * extract a concrete structure from it. Polymorphic counterpart of the historical
     * `TypeInference.isUnclearType` instanceof chain; each subclass owns its own criteria
     * (unclear reference, unknown, null, undefined, generic, unclear-declared class,
     * containers propagating the check into their items).
     *
     * Cycle-safe: recursion through container types shares one visited set.
     * Semantically final: subclasses must override {@link isUnclearWithVisited} instead —
     * overriding this entry would break visited-set sharing across container recursion.
     */
    public isUnclear(): boolean {
        return this.isUnclearWithVisited(new Set<Type>());
    }

    /**
     * @internal Cycle-safe variant of {@link isUnclear}. ABSTRACT by design: every
     * subclass must state its own semantics explicitly:
     * - concrete leaf types (numbers, strings, ...): `return false;`
     * - inherently unclear leaves (unknown, unclear reference, generic): `return true;`
     * - container types (union/array/class-generics/...): recurse into children with the
     *   same visited set (register self first, cycle-safe).
     * A container is unclear iff any child is unclear. Placeholder signalling that the
     * inference engine formerly derived from null/undefined being "unclear" is now
     * explicit at the consumer sites (LocalInference.preInfer, ModelInference
     * updateValueType/transferRight2Left, ArkTsInference.transferRight2Left).
     */
    public abstract isUnclearWithVisited(visited: Set<Type>): boolean;
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

    public isUnclearWithVisited(_visited: Set<Type>): boolean {
        return false;
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

    public isUnclearWithVisited(_visited: Set<Type>): boolean {
        return true;
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

    public isUnclearWithVisited(_visited: Set<Type>): boolean {
        return true;
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

    // Transit implementation: concrete primitives are never unclear; only the inherently
    // unclear leaves (see NullType/UndefinedType notes) override isUnclearWithVisited.
    public isUnclearWithVisited(_visited: Set<Type>): boolean {
        return false;
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

    public isUnclearWithVisited(_visited: Set<Type>): boolean {
        // UNIFY-EXP: null as concrete
        return false;
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

    public isUnclearWithVisited(_visited: Set<Type>): boolean {
        // UNIFY-EXP: undefined as concrete
        return false;
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

    public isUnclearWithVisited(visited: Set<Type>): boolean {
        if (visited.has(this)) {
            return false;
        }
        visited.add(this);
        // Unified full semantics: a union is unclear iff any member is unclear.
        return this.getTypes().some(t => t.isUnclearWithVisited(visited));
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

    public isUnclearWithVisited(visited: Set<Type>): boolean {
        if (visited.has(this)) {
            return false;
        }
        visited.add(this);
        // Unified full semantics (see UnionType).
        return this.getTypes().some(t => t.isUnclearWithVisited(visited));
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

    public isUnclearWithVisited(_visited: Set<Type>): boolean {
        return false;
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

    public isUnclearWithVisited(_visited: Set<Type>): boolean {
        return false;
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
     * @internal temp 兜底登记的 tempSigID（对象恒等 ID，活对象内稳定）。
     * B 轮（索引表）后是唯一的 temp 侧状态——取回走 slot（惰性物化经替换记录
     * 直达 formal，tempSigID 保留作痕迹）。
     */
    private tempSigID?: number;

    protected canParticipateInCycle(): boolean {
        return true;
    }

    constructor(methodSignature: MethodSignature, realGenericTypes?: Type[]) {
        super();
        const reg = SignatureCanonicalizerRegistry.getInstance();
        // 模式 B' 路由（与 ClassType 同构）：unclear → temp；clear + formal 命中 → formal；clear + formal miss → error log + temp 兜底。不写 formal 空间。
        if (methodSignature.isUnclear()) {
            this.methodSigID = -1;
            this.tempSigID = reg.tempMethodSigCanonicalizer.register(methodSignature);
        } else {
            const existingId = reg.methodSigCanonicalizer.getExistingId(methodSignature);
            if (existingId !== -1) {
                this.methodSigID = existingId;
                this.tempSigID = undefined;
            } else {
                logger.error(`FunctionType: clear MethodSignature not interned — routing to temp defensively: ${methodSignature.toString()}`);
                this.methodSigID = -1;
                this.tempSigID = reg.tempMethodSigCanonicalizer.register(methodSignature);
            }
        }
        this.realGenericTypes = realGenericTypes;
    }

    public get methodSignature(): MethodSignature {
        return this.getMethodSignature();
    }

    public getMethodSignature(): MethodSignature {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        if (this.methodSigID >= 0) {
            return reg.methodSigCanonicalizer.get(this.methodSigID)!;
        }
        if (this.tempSigID !== undefined) {
            const sig = reg.tempMethodSigCanonicalizer.get(this.tempSigID);
            if (sig !== undefined) {
                return sig;
            }
            // 惰性物化：已迁移 → 替换记录直达 formal（tempSigID 保留作痕迹）。
            const formalId = reg.tempMethodSigCanonicalizer.getReplacement(this.tempSigID);
            if (formalId !== -1) {
                const formalSig = reg.methodSigCanonicalizer.get(formalId);
                if (formalSig !== undefined) {
                    this.methodSigID = formalId;
                    return formalSig;
                }
            }
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

    public isUnclearWithVisited(_visited: Set<Type>): boolean {
        // 恒为 false，三层理由：
        // 1. 语义层：FunctionType 表示函数类型本身（结构描述：参数列表+返回类型），
        //    不是对函数实体的引用——"引用可解析性"的判定职责由 ClassType 承担。
        //    "该签名对应哪个真实方法"的解析在消费点有专门机制（canonicalizer 值
        //    查找 + fallback 遍历），从不依赖本判定。
        // 2. 结构层：ClassType 的检查项（%unk stub 文件、PROMISE 无泛型）各对应
        //    一种真实残缺形态（temp 兜底、未定型泛型）；而 MethodSignature 永远是
        //    完整值——即使声明方 unclear，签名作为值（名字+参数+返回类型）仍然
        //    完整，构造时总能 intern。函数类型没有"残缺形态"需要暴露。
        // 3. 实证层：泛型实参传播版（Fn<Unclear> 判 true）曾在语义统一工程中实施，
        //    被全量回归否决（keyof-typeof 推导链退化：Fn<T> 声明处的形式泛参被
        //    误判为未解析）后回退。函数内容的不确定性（参数/返回/泛型实参）由
        //    消费点按需处理，类型层传播已被实证会破坏推导链。
        return false;
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
     * @internal temp 兜底登记的 tempSigID（对象恒等 ID，活对象内稳定）。
     * B 轮（索引表）后是**唯一**的 temp 侧状态——存活/取回职责由 slot 承载
     * （slot[id] === 构造时传入实例）。惰性物化后保留作"曾 temp"审计痕迹
     * （formalID ≥ 0 && tempSigID ≠ undefined = 已迁移痕迹态）。
     */
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
        // 模式 B' 路由（isUnclear 优先）：unclear → temp（声明链文件未知，需推导解析）；clear + formal 命中 → formal ID；clear + formal miss → error log + temp 兜底（编程异常，不 throw）。Type 构造器不写 formal 空间（不调 getId）。
        if (classSignature.isUnclear()) {
            this.classSigID = -1;
            this.tempSigID = reg.tempClassSigCanonicalizer.register(classSignature);
        } else {
            const existingId = reg.classSigCanonicalizer.getExistingId(classSignature);
            if (existingId !== -1) {
                this.classSigID = existingId;
            } else {
                logger.error(`ClassType: clear ClassSignature not interned — routing to temp defensively: ${classSignature.toString()}`);
                this.classSigID = -1;
                this.tempSigID = reg.tempClassSigCanonicalizer.register(classSignature);
            }
        }
        this.realGenericTypes = realGenericTypes;
    }

    public get classSignature(): ClassSignature {
        return this.getClassSignature();
    }

    public getClassSignature(): ClassSignature {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        if (this.classSigID >= 0) {
            return reg.classSigCanonicalizer.get(this.classSigID)!;
        }
        if (this.tempSigID !== undefined) {
            const sig = reg.tempClassSigCanonicalizer.get(this.tempSigID);
            if (sig !== undefined) {
                return sig;
            }
            // 惰性物化：已迁移（slot 置空）→ 替换记录直达 formal（"下一处直接
            // 使用 formal ID"）；tempSigID 保留作"曾 temp"审计痕迹。
            const formalId = reg.tempClassSigCanonicalizer.getReplacement(this.tempSigID);
            if (formalId !== -1) {
                const formalSig = reg.classSigCanonicalizer.get(formalId);
                if (formalSig !== undefined) {
                    this.classSigID = formalId;
                    return formalSig;
                }
            }
        }
        throw new Error('ClassType has no signature');
    }

    public setClassSignature(newClassSignature: ClassSignature): void {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        // 模式 B' 路由（与构造器同构）：unclear → temp；clear + formal 命中 → formal（旧 temp 经 retireWithReplacement 显式迁移——置空 slot + 记录 formal 归宿，共享该 temp 签名的其他持有者经替换记录直达 formal）；clear + formal miss → error log + temp 兜底。
        if (newClassSignature.isUnclear()) {
            this.classSigID = -1;
            this.tempSigID = reg.tempClassSigCanonicalizer.register(newClassSignature);
            return;
        }
        const existingId = reg.classSigCanonicalizer.getExistingId(newClassSignature);
        if (existingId !== -1) {
            if (this.tempSigID !== undefined) {
                reg.tempClassSigCanonicalizer.retireWithReplacement(this.tempSigID, existingId);
            }
            this.classSigID = existingId;
            this.tempSigID = undefined;
        } else {
            logger.error(`ClassType: clear ClassSignature not interned (setClassSignature) — routing to temp defensively: ${newClassSignature.toString()}`);
            this.classSigID = -1;
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

    public isUnclearWithVisited(_visited: Set<Type>): boolean {
        // The class reference's own resolvability only. Generic type arguments do NOT
        // propagate: Foo<T> (formal parameter) / Foo<Whatever> — the referenced class
        // itself is resolved (kept from the historical top-level semantics; the
        // "Foo<Unclear> propagates" variant regressed keyof/typeof-optional inference —
        // see tasks.md B5 unification work).
        const classSignature = this.getClassSignature();
        // ID 快判：%unk 文件 ⟺ FileSigID 0。FileSignature.DEFAULT 是 internDefaults()
        // 固化的 formal sigID 0（唯一 fileName='%unk' 的来源），故字段级数字比较与旧的
        // "fileName includes '%unk'" 语义等价，且省去 fileSigCanonicalizer Map 查找
        // 与字符串比较（temp 兜底锚点与 formal 签名走同一构造器，字段值同构）。
        if (classSignature.getDeclaringFileSigID() === 0) {
            return true;
        }
        return classSignature.getClassName() === PROMISE && !this.getRealGenericTypes();
    }

    protected getTypeString(visited: Set<Type> = new Set<Type>()): string {
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

    public isUnclearWithVisited(visited: Set<Type>): boolean {
        if (visited.has(this)) {
            return false;
        }
        visited.add(this);
        // Unified full semantics: the array is unclear iff its base type is unclear.
        return this.getBaseType().isUnclearWithVisited(visited);
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

    public isUnclearWithVisited(visited: Set<Type>): boolean {
        if (visited.has(this)) {
            return false;
        }
        visited.add(this);
        // Unified full semantics (see UnionType).
        return this.getTypes().some(t => t.isUnclearWithVisited(visited));
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

    public isUnclearWithVisited(visited: Set<Type>): boolean {
        if (visited.has(this)) {
            return false;
        }
        visited.add(this);
        // The alias propagates the unclear semantics of its original type.
        return this.getOriginalType().isUnclearWithVisited(visited);
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

    public isUnclearWithVisited(_visited: Set<Type>): boolean {
        return true;
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

    // Transit implementation: annotation types are concrete leaf types
    public isUnclearWithVisited(_visited: Set<Type>): boolean {
        return false;
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
     * @internal temp 兜底登记的 tempSigID（对象恒等 ID，活对象内稳定）。
     * B 轮（索引表）后是唯一的 temp 侧状态（取回/物化语义见 FunctionType）。
     */
    private tempSigID?: number;

    constructor(nestedMethod: MethodSignature, closures?: Local[]) {
        super();
        const reg = SignatureCanonicalizerRegistry.getInstance();
        // 模式 B' 路由（与 ClassType 同构）：unclear → temp；clear + formal 命中 → formal；clear + formal miss → error log + temp 兜底。
        if (nestedMethod.isUnclear()) {
            this.nestedMethodSigID = -1;
            this.tempSigID = reg.tempMethodSigCanonicalizer.register(nestedMethod);
        } else {
            const existingId = reg.methodSigCanonicalizer.getExistingId(nestedMethod);
            if (existingId !== -1) {
                this.nestedMethodSigID = existingId;
                this.tempSigID = undefined;
            } else {
                logger.error(`LexicalEnvType: clear MethodSignature not interned — routing to temp defensively: ${nestedMethod.toString()}`);
                this.nestedMethodSigID = -1;
                this.tempSigID = reg.tempMethodSigCanonicalizer.register(nestedMethod);
            }
        }
        this.closures = closures ?? [];
    }

    public get nestedMethodSignature(): MethodSignature {
        return this.getNestedMethod();
    }

    public getNestedMethod(): MethodSignature {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        if (this.nestedMethodSigID >= 0) {
            return reg.methodSigCanonicalizer.get(this.nestedMethodSigID)!;
        }
        if (this.tempSigID !== undefined) {
            const sig = reg.tempMethodSigCanonicalizer.get(this.tempSigID);
            if (sig !== undefined) {
                return sig;
            }
            // 惰性物化：已迁移 → 替换记录直达 formal（tempSigID 保留作痕迹）。
            const formalId = reg.tempMethodSigCanonicalizer.getReplacement(this.tempSigID);
            if (formalId !== -1) {
                const formalSig = reg.methodSigCanonicalizer.get(formalId);
                if (formalSig !== undefined) {
                    this.nestedMethodSigID = formalId;
                    return formalSig;
                }
            }
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

    public isUnclearWithVisited(_visited: Set<Type>): boolean {
        return false;
    }

    protected getTypeString(_visited?: Set<Type>): string {
        return `[${this.getClosures().join(', ')}]`;
    }
}

export class EnumValueType extends Type {
    private fieldSigID: number;
    private constant?: Constant;

    /**
     * @internal temp 兜底登记的 tempSigID（对象恒等 ID，活对象内稳定）。
     * B 轮（索引表）后是唯一的 temp 侧状态（取回/物化语义见 FunctionType）。
     */
    private tempSigID?: number;

    constructor(signature: FieldSignature, constant?: Constant) {
        super();
        const reg = SignatureCanonicalizerRegistry.getInstance();
        // 模式 B' 路由（与 ClassType 同构）：unclear → temp；clear + formal 命中 → formal；clear + formal miss → error log + temp 兜底。
        if (signature.isUnclear()) {
            this.fieldSigID = -1;
            this.tempSigID = reg.tempFieldSigCanonicalizer.register(signature);
        } else {
            const existingId = reg.fieldSigCanonicalizer.getExistingId(signature);
            if (existingId !== -1) {
                this.fieldSigID = existingId;
                this.tempSigID = undefined;
            } else {
                logger.error(`EnumValueType: clear FieldSignature not interned — routing to temp defensively: ${signature.toString()}`);
                this.fieldSigID = -1;
                this.tempSigID = reg.tempFieldSigCanonicalizer.register(signature);
            }
        }
        this.constant = constant;
    }

    public get signature(): FieldSignature {
        return this.getFieldSignature();
    }

    public getFieldSignature(): FieldSignature {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        if (this.fieldSigID >= 0) {
            return reg.fieldSigCanonicalizer.get(this.fieldSigID)!;
        }
        if (this.tempSigID !== undefined) {
            const sig = reg.tempFieldSigCanonicalizer.get(this.tempSigID);
            if (sig !== undefined) {
                return sig;
            }
            // 惰性物化：已迁移 → 替换记录直达 formal（tempSigID 保留作痕迹）。
            const formalId = reg.tempFieldSigCanonicalizer.getReplacement(this.tempSigID);
            if (formalId !== -1) {
                const formalSig = reg.fieldSigCanonicalizer.get(formalId);
                if (formalSig !== undefined) {
                    this.fieldSigID = formalId;
                    return formalSig;
                }
            }
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

    public isUnclearWithVisited(_visited: Set<Type>): boolean {
        return false;
    }

    protected getTypeString(_visited?: Set<Type>): string {
        return this.getFieldSignature().toString();
    }
}
