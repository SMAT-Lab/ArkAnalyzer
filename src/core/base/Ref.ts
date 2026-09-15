/*
 * Copyright (c) 2024-2026 Huawei Device Co., Ltd.
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
import { BaseSignature, ClassSignature, FieldSignature } from '../model/ArkSignature';
import { SignatureCanonicalizerRegistry } from '../common/SignatureCanonicalizerRegistry';
import { Local } from './Local';
import { AnyType, ArrayType, ClassType, GenericType, LexicalEnvType, StringType, Type, UnknownType } from './Type';
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
    private base: Local; // Array variable
    private index: Value; // Index

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
        const rawType = this.base.getType();
        // StringType is primitive, never generic — skip replaceTypeWithReal to avoid wasted Set allocation
        if (rawType instanceof StringType) {
            return StringType.getInstance();
        }
        const baseType = TypeInference.replaceTypeWithReal(rawType);
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
    /**
     * @internal formal FieldSigID。-1 = 完全未注册（纯 temp-held）。
     */
    private fieldSigID!: number;
    /**
     * @internal temp FieldSigID（索引表）。undefined = formal 路径。
     * 惰性物化后保留作"曾 temp"审计痕迹。
     */
    private tempFieldSigID?: number;
    /**
     * @internal 泛型字段的实例化实参表（R 轮，Expr.realGenericTypes 同构）。
     * 泛型字段（定义点 type 为 GenericType，如 `Box<T>.items: T[]`）的 fieldRef
     * 持定义点 formal 签名（身份），使用点的实例化（`b.items` → string[]）由
     * 本实参表承载——getType() 读取时动态组合（replaceTypeWithReal），签名
     * 自身保持定义点形态（T[]）。undefined = 无实例化上下文（static 访问 /
     * 未解析 base），getType() 返回定义点 type 原样。
     * 推导链的泛型分支（IRInference.genFieldSignature / getFieldSignature）
     * 在命中泛型 ArkField 时从 baseType 提取实参写入。
     */
    private realFieldTypes?: Type[];

    constructor(fieldSignature: FieldSignature) {
        super();
        this.route(fieldSignature);
    }

    /**
     * 首路径路由（构造器专用）：formal 只读命中 → 持 formal ID（栅栏精化）；
     * miss → temp 登记（**持有者全生命周期唯一一次登记**——A2 决策表后，更新
     * 路径不再产生新登记）。
     */
    private route(fieldSignature: FieldSignature): void {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        // 模式 B' 路由：unclear → temp；clear + formal 命中 → formal（精度栅栏 + 旧 temp retire）；clear + formal miss → error log + temp 兜底。
        if (fieldSignature.isUnclear()) {
            this.fieldSigID = -1;
            this.tempFieldSigID = reg.tempFieldSigCanonicalizer.register(fieldSignature);
            return;
        }
        const existingId = reg.fieldSigCanonicalizer.getExistingId(fieldSignature);
        if (existingId !== -1) {
            const canonical = reg.fieldSigCanonicalizer.get(existingId)!;
            // formal 路由 + 单向精度栅栏。
            const canonicalType = canonical.getType();
            const incomingType = fieldSignature.getType();
            if (TypeInference.isUnclearType(canonicalType) && !TypeInference.isUnclearType(incomingType)) {
                canonical.setType(incomingType);
            }
            this.fieldSigID = existingId;
            this.tempFieldSigID = undefined;
        } else {
            logger.error(`AbstractFieldRef: clear FieldSignature not interned (route) — routing to temp defensively: ${fieldSignature.toString()}`);
            this.fieldSigID = -1;
            this.tempFieldSigID = reg.tempFieldSigCanonicalizer.register(fieldSignature);
        }
    }

    /**
     * Returns the the field name as a **string**.
     * @returns The the field name.
     */
    public getFieldName(): string {
        return this.getFieldSignature().getFieldName();
    }

    /**
     * Returns a field signature, which consists of a class signature,
     * a **string** field name, and a **boolean** label indicating whether it is static or not.
     * @returns The field signature.
     * @example
     * 1. Compare two Fields

  ```typescript
  const fieldSignature = new FieldSignature('name', classSigID, unknownType, false);
  const fieldRef = new ArkInstanceFieldRef(baseValue as Local, fieldSignature);
  ...
  if (fieldRef.getFieldSignature().getFieldName() ===
  targetField.getFieldSignature().getFieldName()) {
  ...
  }
  ```
     */
    /**
     * 返回 fieldRef 的值视图签名（B 轮批 3 起三级查）：
     * ① formal（fieldSigID ≥ 0）→ canonical（活视图；泛型字段为定义点形态，
     *    实例化由 {@link getType} 组合）；
     * ② temp slot（未迁移）→ 构造时传入实例；
     * ③ 替换记录（已迁移）→ formal 实例 + 惰性物化（tempSigID 保留作痕迹）。
     */
    public getFieldSignature(): FieldSignature {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        if (this.fieldSigID >= 0) {
            const sig = reg.fieldSigCanonicalizer.get(this.fieldSigID);
            if (sig !== undefined) {
                return sig;
            }
        } else if (this.tempFieldSigID !== undefined) {
            const sig = reg.tempFieldSigCanonicalizer.get(this.tempFieldSigID);
            if (sig !== undefined) {
                return sig;
            }
            const formalId = reg.tempFieldSigCanonicalizer.getReplacement(this.tempFieldSigID);
            if (formalId !== -1) {
                const formalSig = reg.fieldSigCanonicalizer.get(formalId);
                if (formalSig !== undefined) {
                    this.fieldSigID = formalId;
                    return formalSig;
                }
            }
        }
        throw new Error('AbstractFieldRef has no signature');
    }

    /**
     * 参数式替换签名（A2 推广终态——推导链更新的唯一决策表入口，零中间实例）：
     * 不经 new N，直接按参数对 S 就地赋值（applyFields）。决策表：
     * ① 未毕业（temp 行还在）：无条件把新值写进 S（编号不变——共享该实例的
     *    持有者即时看到新值，一处改处处生效），再查 formal——命中则毕业三连
     *    （换编号 + 划行 + 记替换）+ declaring 联动；miss 保持（零登记）。
     * ② 已毕业：N 查 formal 命中换编号 / miss 保持现状（已解析不倒退）。
     * 行已划（共享链已被他人收敛）→ 惰性物化后按 ②；stale → 首路径兜底。
     * 定义点 canonical 回写（终点确定）走 {@link graduateToFormal} 快路径。
     */
    public updateFieldSignature(fieldName: string, declaringOrID: BaseSignature | number, type: Type, staticFlag: boolean, namespaceDeclared: boolean = false): void {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        // ① 未毕业分支。
        if (this.fieldSigID === -1 && this.tempFieldSigID !== undefined) {
            const tempId = this.tempFieldSigID;
            const S = reg.tempFieldSigCanonicalizer.get(tempId);
            if (S !== undefined) {
                const oldDeclTempId = S.getDeclaringClassTempSigID();
                S.applyFields(fieldName, declaringOrID, type, staticFlag, namespaceDeclared);
                const existingId = reg.fieldSigCanonicalizer.getExistingId(S);
                if (existingId !== -1) {
                    const canonical = reg.fieldSigCanonicalizer.get(existingId)!;
                    const canonicalType = canonical.getType();
                    if (TypeInference.isUnclearType(canonicalType) && !TypeInference.isUnclearType(type)) {
                        canonical.setType(type);
                    }
                    this.fieldSigID = existingId;
                    this.tempFieldSigID = undefined;
                    reg.tempFieldSigCanonicalizer.retireWithReplacement(tempId, existingId);
                    // declaring 联动：新值 declaring 为 formal class 时同步收敛 temp class 行。
                    const declSig = S.getDeclaringSignature();
                    if (oldDeclTempId !== undefined && declSig instanceof ClassSignature && !declSig.isUnclear()) {
                        const declFormalId = S.getDeclaringClassSigID();
                        if (declFormalId !== undefined && declFormalId > 0) {
                            reg.tempClassSigCanonicalizer.retireWithReplacement(oldDeclTempId, declFormalId);
                        }
                    }
                }
                return;
            }
            const formalId = reg.tempFieldSigCanonicalizer.getReplacement(tempId);
            if (formalId !== -1) {
                this.fieldSigID = formalId;
            } else {
                // stale 兜底：构造真实例走首路径（登记一次）。低频路径（Registry 重建等）。
                this.route(AbstractFieldRef.buildFallbackSignature(fieldName, declaringOrID, type, staticFlag, namespaceDeclared));
                return;
            }
        }
        // ② 已毕业分支：只查不降级（低频路径——多轮推导的精化；probe 为值查载体，短命实例可接受）。
        if (this.fieldSigID >= 0) {
            const probe = AbstractFieldRef.buildFallbackSignature(fieldName, declaringOrID, type, staticFlag, namespaceDeclared);
            const existingId = reg.fieldSigCanonicalizer.getExistingId(probe);
            if (existingId !== -1) {
                const canonical = reg.fieldSigCanonicalizer.get(existingId)!;
                const canonicalType = canonical.getType();
                if (TypeInference.isUnclearType(canonicalType) && !TypeInference.isUnclearType(type)) {
                    canonical.setType(type);
                }
                this.fieldSigID = existingId;
            }
            return;
        }
        // 防御兜底（理论不可达）。
        this.route(AbstractFieldRef.buildFallbackSignature(fieldName, declaringOrID, type, staticFlag, namespaceDeclared));
    }

    /** @internal 兜底/probe 构造（联合类型按重载收窄分发；低频路径）。 */
    private static buildFallbackSignature(fieldName: string, declaringOrID: BaseSignature | number, type: Type, staticFlag: boolean, namespaceDeclared: boolean): FieldSignature {
        if (typeof declaringOrID === 'number') {
            return namespaceDeclared ? new FieldSignature(fieldName, declaringOrID, type, staticFlag, true) : new FieldSignature(fieldName, declaringOrID, type, staticFlag);
        }
        return new FieldSignature(fieldName, declaringOrID, type, staticFlag);
    }

    /**
     * @internal 毕业到正式签名（定义点回写专用快路径）：formalId 必为正式表
     * 有效条目（调用方从 model 直取，如 `arkField.getFieldSigID()`），终点确定
     * ——跳过决策表的值演进与值查，直接换编号 + 划旧 temp 行 + 记替换 +
     * declaring 联动（联动归宿经一次 key 直查从 canonical 取）。决策表
     * （updateFieldSignature）保留给终点不确定的场景（stub 演进/中间态）。
     * 无效 ID（≤0 或条目不存在 = stale）：防御性不动作（持有者保持现状）——
     * 校验必须在开头（已毕业分支的无条件赋值若放入 stale ID，后续取回将 throw）。
     */
    public graduateToFormal(formalId: number): void {
        if (formalId <= 0) {
            return;
        }
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const canonical = reg.fieldSigCanonicalizer.get(formalId);
        if (canonical === undefined) {
            return; // stale ID（Registry 重建等）——防御性不动作
        }
        if (this.fieldSigID === -1 && this.tempFieldSigID !== undefined) {
            const tempId = this.tempFieldSigID;
            const S = reg.tempFieldSigCanonicalizer.get(tempId);
            if (S !== undefined) {
                // declaring 联动（毕业的组成部分）：旧 declaring temp 行同步收敛，
                // 共享该 declaring stub 的持有者经替换记录自动跟随。
                const oldDeclTempId = S.getDeclaringClassTempSigID();
                const declFormalId = canonical.getDeclaringClassSigID();
                if (oldDeclTempId !== undefined && declFormalId !== undefined && declFormalId > 0) {
                    reg.tempClassSigCanonicalizer.retireWithReplacement(oldDeclTempId, declFormalId);
                }
                reg.tempFieldSigCanonicalizer.retireWithReplacement(tempId, formalId);
            }
            // 行已划（共享链已被首毕业者收敛）：仅换编号（替换记录已登记）。
            this.fieldSigID = formalId;
            this.tempFieldSigID = undefined;
            return;
        }
        // 已毕业：直接换编号（重复回写 = 无操作；stale 已在开头拦截）。
        this.fieldSigID = formalId;
    }

    /**
     * @internal 替换埋葬（round27——"谁替换谁埋葬"）：本 ref 即将从 IR 被
     * 新值替换（ValueInference.postInfer 的 replaceDef/replaceUse），替换后
     * 无任何持有者——temp 行在替换点显式 retire，消除"被替换 ref 的登记
     * 留存"死条目。纯 retire（无替换记录）：被替换产物无字段归宿（ArrayType
     * 转换 / getter invoke / params 形态新 static ref 自走首路径）。
     * 幂等：行已划（其他路径已 retire）时 no-op；formal 路径（无 temp 编号）
     * 恒 no-op。共享安全：被替换的旧 ref 均为 builder 逐访问 new 的实例
     * （temp 空间实例语义，独占行，无共享者）。
     */
    public retireTemp(): void {
        if (this.fieldSigID === -1 && this.tempFieldSigID !== undefined) {
            SignatureCanonicalizerRegistry.getInstance().tempFieldSigCanonicalizer.retire(this.tempFieldSigID);
        }
    }

    /**
     * @internal 替换埋葬（带归宿版）：同 {@link retireTemp}，但替换产物为
     * formal canonical（static 转换等 formalId 已知场景）——retire 同时记录
     * 替换（temp → formal），供诊断追溯。
     */
    public retireTempTo(formalId: number): void {
        if (this.fieldSigID === -1 && this.tempFieldSigID !== undefined && formalId > 0) {
            SignatureCanonicalizerRegistry.getInstance().tempFieldSigCanonicalizer.retireWithReplacement(this.tempFieldSigID, formalId);
        }
    }

    /** @internal Get the formal FieldSigID（身份视图；泛型双视图下为定义点字段 ID）。-1 = 纯 temp-held。 */
    public getFieldSigID(): number {
        return this.fieldSigID;
    }

    /** @internal Get the temp FieldSigID for the unresolved-signature registration（值视图在 temp 时非空）。 */
    public getTempSigID(): number | undefined {
        return this.tempFieldSigID;
    }

    /** @internal Get the generic instantiation real types of the field (R 轮，Expr.realGenericTypes 同构)。 */
    public getRealFieldTypes(): Type[] | undefined {
        return this.realFieldTypes;
    }

    /**
     * @internal Set the generic instantiation real types. Called by the inference
     * chains when a generic ArkField is resolved against an instantiated base type.
     * The signature itself stays in its declaration-site form (T[]); this table is
     * the per-use instantiation carrier (see field JSDoc).
     */
    public setRealFieldTypes(realTypes: Type[] | undefined): void {
        this.realFieldTypes = realTypes;
    }

    public getType(): Type {
        const type = this.getFieldSignature().getType();
        if (TypeInference.checkType(type, t => t instanceof GenericType || t instanceof AnyType) && this.realFieldTypes) {
            return TypeInference.replaceTypeWithReal(type, this.realFieldTypes);
        }
        return type;
    }
}

export class ArkInstanceFieldRef extends AbstractFieldRef {
    private base: Local; // which obj this field belong to
    private dynamic?: boolean;

    constructor(base: Local, fieldSignature: FieldSignature, dynamic: boolean = false) {
        super(fieldSignature);
        this.base = base;
        if (dynamic) {
            this.dynamic = dynamic;
        }
    }

    public isDynamic(): boolean {
        return this.dynamic || false;
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

    public setType(newType: Type): void {
        this.type = newType;
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

    public setType(type: Type): void {
        this.type = type;
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
