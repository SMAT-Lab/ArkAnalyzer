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
import { FieldSignature } from '../model/ArkSignature';
import { SignatureCanonicalizerRegistry } from '../common/SignatureCanonicalizerRegistry';
import { Local } from './Local';
import { ArrayType, ClassType, GenericType, LexicalEnvType, StringType, Type, UnknownType } from './Type';
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
     * 泛型双视图形态下为定义点字段的 formal ID（≥0），此时值视图在 temp——
     * 见 {@link #tempFieldSignature} 注释。
     */
    private fieldSigID!: number;
    /**
     * @internal temp FieldSigID（弱注册表）。undefined = 纯 formal 路径。
     */
    private tempFieldSigID?: number;
    /**
     * @internal 锚定的签名实例（构造/setFieldSignature 时传入）：
     * - temp 路径（未命中 / 泛型双视图）：值视图 + 弱注册表的存活锚点
     *   （最后一个持有者死亡后签名才可被 GC 回收）；
     * - formal 路径：undefined——getFieldSignature() 返回 canonical 实例
     *   （活视图，见 route 注释的栅栏说明）。
     */
    private tempFieldSignature?: FieldSignature;

    constructor(fieldSignature: FieldSignature) {
        super();
        this.route(fieldSignature);
    }

    /**
     * 三分路由（构造与 setFieldSignature 共用）：
     *
     * ① 未命中 → temp 路由：锚定传入实例 + 弱注册（同实例幂等复用 ID）。
     *
     * ② 命中且 canonical.type 为 GenericType（定义点带泛型参数的字段）
     *    → 泛型双视图路由：formal 中的签名是**定义点视角**（type = 泛型参数 T，
     *    不携带使用点的实例化类型），使用点构造的签名（携带实例化 type）不能套用
     *    formal 持有——锚定传入实例走 temp（保留 per-use 实例化，多调用点不同
     *    实例化互不干扰），fieldSigID 仍保留定义点 formal ID（身份视图：供
     *    getFieldSigID 按字段身份查询）。
     *
     * ③ 命中且非泛型 → formal 路由：持 formal ID，getFieldSignature() 返回
     *    canonical 实例（活视图——推断对 canonical 的类型精化实时可见）。
     *    构造/setFieldSignature 时执行**单向精度栅栏**：canonical.type 为
     *    unclear（Unknown/UnclearRef/Null/Undefined/GenericType/unclear
     *    ClassType）且传入 type 为 clear 时，将传入 type 写入 canonical
     *    （精确化写穿，与 repairFieldType 等既有 canonical setType 模式同性质
     *    ——只写 type 不碰身份/model）；其余情形（clear→unclear 倒退、
     *    clear→不同 clear 竞争）一律不更新。
     */
    private route(fieldSignature: FieldSignature): void {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const existingId = reg.fieldSigCanonicalizer.getExistingId(fieldSignature);
        if (existingId !== -1) {
            const canonical = reg.fieldSigCanonicalizer.get(existingId)!;
            if (canonical.getType() instanceof GenericType) {
                // ② 泛型双视图：值视图走 temp（per-use 实例化），身份视图保留 formal ID。
                this.fieldSigID = existingId;
                this.tempFieldSignature = fieldSignature;
                this.tempFieldSigID = reg.tempFieldSigCanonicalizer.register(fieldSignature);
                return;
            }
            // ③ formal + 单向精度栅栏。
            const canonicalType = canonical.getType();
            const incomingType = fieldSignature.getType();
            if (TypeInference.isUnclearType(canonicalType) && !TypeInference.isUnclearType(incomingType)) {
                canonical.setType(incomingType);
            }
            this.fieldSigID = existingId;
            this.tempFieldSignature = undefined;
            this.tempFieldSigID = undefined;
        } else {
            // ① temp 路由。
            this.fieldSigID = -1;
            this.tempFieldSignature = fieldSignature;
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
     * 返回 fieldRef 的值视图签名：
     * - formal 路径：canonical 实例（活视图）；
     * - temp / 泛型双视图路径：锚定的传入实例（使用点实例化形态）。
     */
    public getFieldSignature(): FieldSignature {
        if (this.tempFieldSignature !== undefined) {
            return this.tempFieldSignature;
        }
        const sig = SignatureCanonicalizerRegistry.getInstance().fieldSigCanonicalizer.get(this.fieldSigID);
        if (sig !== undefined) {
            return sig;
        }
        throw new Error('AbstractFieldRef has no signature');
    }

    /**
     * 替换签名（推断解析后的真实字段签名回写）。三分路由同构造；旧 temp 引用
     * 无需显式释放（弱注册表由 GC 收敛——本对象丢弃旧锚点后，若无其他持有者
     * 则旧签名可回收）。
     */
    public setFieldSignature(newFieldSignature: FieldSignature): void {
        this.route(newFieldSignature);
    }

    /** @internal Get the formal FieldSigID（身份视图；泛型双视图下为定义点字段 ID）。-1 = 纯 temp-held。 */
    public getFieldSigID(): number {
        return this.fieldSigID;
    }

    /** @internal Get the temp FieldSigID for the unresolved-signature registration（值视图在 temp 时非空）。 */
    public getTempSigID(): number | undefined {
        return this.tempFieldSigID;
    }

    public getType(): Type {
        return this.getFieldSignature().getType();
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
