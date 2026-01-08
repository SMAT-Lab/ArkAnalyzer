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

import { TypeInference } from '../common/TypeInference';
import { BasicBlock } from '../graph/BasicBlock';
import { MethodSignature } from '../model/ArkSignature';
import { Local } from './Local';
import {
    AliasType,
    AnyType,
    ArrayType,
    BigIntType,
    BooleanType,
    ClassType, EnumValueType,
    FunctionType,
    GenericType,
    NullType,
    NumberType,
    StringType,
    Type,
    UnclearReferenceType,
    UndefinedType,
    UnionType,
    UnknownType,
} from './Type';
import { Value } from './Value';
import { AbstractFieldRef, AbstractRef, ArkInstanceFieldRef, ArkStaticFieldRef } from './Ref';
import { EMPTY_STRING, ValueUtil } from '../common/ValueUtil';
import { ArkMethod } from '../model/ArkMethod';
import { UNKNOWN_FILE_NAME } from '../common/Const';
import { IRInference } from '../common/IRInference';
import { ImportInfo } from '../model/ArkImport';
import { ArkClass, ClassCategory } from '../model/ArkClass';
import { ArkField } from '../model/ArkField';
import { ModelUtils } from '../common/ModelUtils';

/**
 * @category core/base/expr
 */
export abstract class AbstractExpr implements Value {
    abstract getUses(): Value[];

    abstract getType(): Type;

    abstract toString(): string;

    public inferType(arkMethod: ArkMethod): AbstractExpr {
        return this;
    }
}

export abstract class AbstractInvokeExpr extends AbstractExpr {
    private methodSignature: MethodSignature;
    private args: Value[];
    private realGenericTypes?: Type[];
    private spreadFlags?: boolean[]; // flags to indicate whether the argument is spread, which is undefined  when no spread argument exists.

    constructor(methodSignature: MethodSignature, args: Value[], realGenericTypes?: Type[], spreadFlags?: boolean[]) {
        super();
        this.methodSignature = methodSignature;
        this.args = args;
        this.realGenericTypes = realGenericTypes;
        this.spreadFlags = spreadFlags;
    }

    /**
     * Get method Signature. The method signature is consist of ClassSignature and MethodSubSignature.
     * It is the unique flag of a method. It is usually used to compose a expression string in ArkIRTransformer.
     * @returns The class method signature, such as ArkStaticInvokeExpr.
     * @example
     * 1. 3AC information composed of getMethodSignature ().

     ```typescript
     let strs: string[] = [];
     strs.push('staticinvoke <');
     strs.push(this.getMethodSignature().toString());
     strs.push('>(');
     ```
     */
    public getMethodSignature(): MethodSignature {
        return this.methodSignature;
    }

    public setMethodSignature(newMethodSignature: MethodSignature): void {
        this.methodSignature = newMethodSignature;
    }

    /**
     * Returns an argument used in the expression according to its index.
     * @param index - the index of the argument.
     * @returns An argument used in the expression.
     */
    public getArg(index: number): Value {
        return this.args[index];
    }

    /**
     * Returns an **array** of arguments used in the expression.
     * @returns An **array** of arguments used in the expression.
     * @example
     * 1. get args number.

     ```typescript
     const argsNum = expr.getArgs().length;
     if (argsNum < 5) {
     ... ...
     }
     ```

     2. iterate arg based on expression

     ```typescript
     for (const arg of this.getArgs()) {
     strs.push(arg.toString());
     strs.push(', ');
     }
     ```
     */
    public getArgs(): Value[] {
        return this.args;
    }

    public setArgs(newArgs: Value[]): void {
        this.args = newArgs;
    }

    public getType(): Type {
        const type = this.methodSignature.getType();
        if (TypeInference.checkType(type, t => t instanceof GenericType || t instanceof AnyType) &&
            this.realGenericTypes) {
            return TypeInference.replaceTypeWithReal(type, this.realGenericTypes);
        }
        return type;
    }

    public getRealGenericTypes(): Type[] | undefined {
        return this.realGenericTypes;
    }

    public setRealGenericTypes(realTypes: Type[] | undefined): void {
        if (realTypes) {
            this.realGenericTypes = realTypes;
        }
    }

    public getSpreadFlags(): boolean[] | undefined {
        return this.spreadFlags;
    }

    public getUses(): Value[] {
        let uses: Value[] = [];
        uses.push(...this.args);
        for (const arg of this.args) {
            uses.push(...arg.getUses());
        }
        return uses;
    }

    protected argsToString(): string {
        const strs: string[] = [];
        strs.push('(');
        if (this.getArgs().length > 0) {
            for (let i = 0; i < this.getArgs().length; i++) {
                if (this.spreadFlags && this.spreadFlags[i]) {
                    strs.push('...');
                }
                strs.push(this.getArgs()[i].toString());
                strs.push(', ');
            }
            strs.pop();
        }
        strs.push(')');
        return strs.join('');
    }
}

export class ArkInstanceInvokeExpr extends AbstractInvokeExpr {
    private base: Local;

    constructor(base: Local, methodSignature: MethodSignature, args: Value[], realGenericTypes?: Type[], spreadFlags?: boolean[]) {
        super(methodSignature, args, realGenericTypes, spreadFlags);
        this.base = base;
    }

    /**
     * Returns the local of the instance of invoke expression.
     * @returns The local of the invoke expression's instance..
     */
    public getBase(): Local {
        return this.base;
    }

    public setBase(newBase: Local): void {
        this.base = newBase;
    }

    /**
     * Returns an **array** of values used in this invoke expression,
     * including all arguments and values each arguments used.
     * For {@link ArkInstanceInvokeExpr}, the return also contains the caller base and uses of base.
     * @returns An **array** of arguments used in the invoke expression.
     */
    public getUses(): Value[] {
        let uses: Value[] = [];
        uses.push(this.base);
        uses.push(...this.base.getUses());
        uses.push(...this.getArgs());
        for (const arg of this.getArgs()) {
            uses.push(...arg.getUses());
        }
        return uses;
    }

    public toString(): string {
        let strs: string[] = [];
        strs.push('instanceinvoke ');
        strs.push(this.base.toString());
        strs.push('.<');
        strs.push(this.getMethodSignature().toString());
        strs.push('>');
        strs.push(super.argsToString());
        return strs.join('');
    }

    public inferType(arkMethod: ArkMethod): AbstractInvokeExpr {
        return IRInference.inferInstanceInvokeExpr(this, arkMethod);
    }
}

export class ArkStaticInvokeExpr extends AbstractInvokeExpr {
    constructor(methodSignature: MethodSignature, args: Value[], realGenericTypes?: Type[], spreadFlags?: boolean[]) {
        super(methodSignature, args, realGenericTypes, spreadFlags);
    }

    public toString(): string {
        let strs: string[] = [];
        strs.push('staticinvoke <');
        strs.push(this.getMethodSignature().toString());
        strs.push('>');
        strs.push(super.argsToString());
        return strs.join('');
    }

    public inferType(arkMethod: ArkMethod): AbstractInvokeExpr {
        return IRInference.inferStaticInvokeExpr(this, arkMethod);
    }
}

/**
 *     1. Local PtrInvokeExpr
 *
 *      ```typescript
 *      func foo():void {
 *      }
 *      let ptr = foo;
 *      ptr();
 *      ```
 *     2. FieldRef PtrInvokeExpr
 *
 *      ```typescript
 *      class A {
 *          b:()=> void()
 *      }
 *      new A().b()
 *      ```
 */
export class ArkPtrInvokeExpr extends AbstractInvokeExpr {
    private funPtr: Local | AbstractFieldRef;

    constructor(methodSignature: MethodSignature, ptr: Local | AbstractFieldRef, args: Value[], realGenericTypes?: Type[], spreadFlags?: boolean[]) {
        super(methodSignature, args, realGenericTypes, spreadFlags);
        this.funPtr = ptr;
    }

    public setFunPtrLocal(ptr: Local | AbstractFieldRef): void {
        this.funPtr = ptr;
    }

    public getFuncPtrLocal(): Local | AbstractFieldRef {
        return this.funPtr;
    }

    public inferType(arkMethod: ArkMethod): AbstractInvokeExpr {
        this.getArgs().forEach(arg => TypeInference.inferValueType(arg, arkMethod));
        const ptrType = this.funPtr.getType();
        if (ptrType instanceof FunctionType) {
            this.setMethodSignature(ptrType.getMethodSignature());
        }
        IRInference.inferArgs(this, arkMethod);
        return IRInference.inferStaticInvokeExpr(this, arkMethod);
    }

    public toString(): string {
        let strs: string[] = [];
        strs.push('ptrinvoke ');
        let ptrName: string = '';
        if (this.funPtr instanceof Local) {
            ptrName = this.funPtr.getName();
        } else if (this.funPtr instanceof ArkInstanceFieldRef) {
            ptrName = this.funPtr.getBase().getName() + '.' + this.funPtr.getFieldName();
        } else if (this.funPtr instanceof ArkStaticFieldRef) {
            ptrName = this.funPtr.getFieldName();
        }
        strs.push(ptrName);
        strs.push('<');
        strs.push(this.getMethodSignature().toString());
        strs.push('>');
        strs.push(super.argsToString());
        return strs.join('');
    }

    public getUses(): Value[] {
        let uses: Value[] = [];
        uses.push(this.getFuncPtrLocal());
        uses.push(...this.getArgs());
        for (const arg of this.getArgs()) {
            uses.push(...arg.getUses());
        }
        return uses;
    }
}

export class ArkNewExpr extends AbstractExpr {
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
        return 'new ' + this.classType;
    }

    public inferType(arkMethod: ArkMethod): ArkNewExpr {
        const classSignature = this.classType.getClassSignature();
        if (classSignature.getDeclaringFileSignature().getFileName() === UNKNOWN_FILE_NAME) {
            const className = classSignature.getClassName();
            let type: Type | null | undefined = ModelUtils.findDeclaredLocal(new Local(className), arkMethod, 1)?.getType();
            if (TypeInference.isUnclearType(type)) {
                type = TypeInference.inferUnclearRefName(className, arkMethod.getDeclaringArkClass());
            }
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

export class ArkNewArrayExpr extends AbstractExpr {
    private baseType: Type;
    private size: Value;

    private fromLiteral: boolean;

    constructor(baseType: Type, size: Value, fromLiteral: boolean = false) {
        super();
        this.baseType = baseType;
        this.size = size;
        this.fromLiteral = fromLiteral;
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

    public inferType(arkMethod: ArkMethod): ArkNewArrayExpr {
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
        return 'newarray (' + this.baseType + ')[' + this.size + ']';
    }
}

export class ArkDeleteExpr extends AbstractExpr {
    private field: AbstractFieldRef;

    constructor(field: AbstractFieldRef) {
        super();
        this.field = field;
    }

    public getField(): AbstractFieldRef {
        return this.field;
    }

    public setField(newField: AbstractFieldRef): void {
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
        return 'delete ' + this.field;
    }
}

export class ArkAwaitExpr extends AbstractExpr {
    private promise: Value;

    constructor(promise: Value) {
        super();
        this.promise = promise;
    }

    public getPromise(): Value {
        return this.promise;
    }

    public setPromise(newPromise: Value): void {
        this.promise = newPromise;
    }

    public getType(): Type {
        const type = this.promise.getType();
        if (type instanceof UnclearReferenceType) {
            return type.getGenericTypes()[0];
        } else if (type instanceof ClassType) {
            return type.getRealGenericTypes()?.[0] ?? type;
        }
        return type;
    }

    public inferType(arkMethod: ArkMethod): ArkAwaitExpr {
        TypeInference.inferValueType(this.promise, arkMethod);
        return this;
    }

    public getUses(): Value[] {
        const uses: Value[] = [];
        uses.push(this.promise);
        uses.push(...this.promise.getUses());
        return uses;
    }

    public toString(): string {
        const str = 'await ' + this.promise;
        return str;
    }
}

export class ArkYieldExpr extends AbstractExpr {
    private yieldValue: Value;

    constructor(yieldValue: Value) {
        super();
        this.yieldValue = yieldValue;
    }

    public getYieldValue(): Value {
        return this.yieldValue;
    }

    public setYieldValue(newYieldValue: Value): void {
        this.yieldValue = newYieldValue;
    }

    public getType(): Type {
        return this.yieldValue.getType();
    }

    public getUses(): Value[] {
        const uses: Value[] = [];
        uses.push(this.yieldValue);
        uses.push(...this.yieldValue.getUses());
        return uses;
    }

    public toString(): string {
        const str = 'yield ' + this.yieldValue;
        return str;
    }
}

export enum NormalBinaryOperator {
    // TODO: unfold it
    NullishCoalescing = '??',

    // arithmetic
    Exponentiation = '**',
    Division = '/',
    Addition = '+',
    Subtraction = '-',
    Multiplication = '*',
    Remainder = '%',

    // shift
    LeftShift = '<<',
    RightShift = '>>',
    UnsignedRightShift = '>>>',

    // Bitwise
    BitwiseAnd = '&',
    BitwiseOr = '|',
    BitwiseXor = '^',

    // Logical
    LogicalAnd = '&&',
    LogicalOr = '||',
}

export enum RelationalBinaryOperator {
    LessThan = '<',
    LessThanOrEqual = '<=',
    GreaterThan = '>',
    GreaterThanOrEqual = '>=',
    Equality = '==',
    InEquality = '!=',
    StrictEquality = '===',
    StrictInequality = '!==',
    isPropertyOf = 'in',
}

export type BinaryOperator = NormalBinaryOperator | RelationalBinaryOperator;

// 二元运算表达式
export abstract class AbstractBinopExpr extends AbstractExpr {
    protected op1: Value;
    protected op2: Value;
    protected operator: BinaryOperator;

    protected type!: Type;

    constructor(op1: Value, op2: Value, operator: BinaryOperator) {
        super();
        this.op1 = op1;
        this.op2 = op2;
        this.operator = operator;
    }

    /**
     * Returns the first operand in the binary operation expression.
     * For example, the first operand in `a + b;` is `a`.
     * @returns The first operand in the binary operation expression.
     */
    public getOp1(): Value {
        return this.op1;
    }

    public setOp1(newOp1: Value): void {
        this.op1 = newOp1;
    }

    /**
     * Returns the second operand in the binary operation expression.
     * For example, the second operand in `a + b;` is `b`.
     * @returns The second operand in the binary operation expression.
     */
    public getOp2(): Value {
        return this.op2;
    }

    public setOp2(newOp2: Value): void {
        this.op2 = newOp2;
    }

    /**
     * Get the binary operator from the statement.
     * The binary operator can be divided into two categories,
     * one is the normal binary operator and the other is relational binary operator.
     * @returns The binary operator from the statement.
     * @example
     ```typescript
     if (expr instanceof AbstractBinopExpr) {
     let op1: Value = expr.getOp1();
     let op2: Value = expr.getOp2();
     let operator: string = expr.getOperator();
     ... ...
     }
     ```
     */
    public getOperator(): BinaryOperator {
        return this.operator;
    }

    public getType(): Type {
        if (!this.type) {
            this.setType();
        }
        return this.type;
    }

    public getUses(): Value[] {
        let uses: Value[] = [];
        uses.push(this.op1);
        uses.push(...this.op1.getUses());
        uses.push(this.op2);
        uses.push(...this.op2.getUses());
        return uses;
    }

    public toString(): string {
        return this.op1 + ' ' + this.operator + ' ' + this.op2;
    }

    protected inferOpType(op: Value, arkMethod: ArkMethod): void {
        TypeInference.inferValueType(op, arkMethod);
    }

    private parseType(op: Type): Type {
        if (op instanceof UnionType) {
            return op.getCurrType();
        } else if (op instanceof EnumValueType) {
            return op.getConstant()?.getType() || op;
        }
        return op;
    }

    public setType(): void {
        let op1Type = this.parseType(this.op1.getType());
        let op2Type = this.parseType(this.op2.getType());
        let type = UnknownType.getInstance();
        switch (this.operator) {
            case '+':
                if (op1Type === StringType.getInstance() || op2Type === StringType.getInstance()) {
                    type = StringType.getInstance();
                }
                if (op1Type === NumberType.getInstance() && op2Type === NumberType.getInstance()) {
                    type = NumberType.getInstance();
                }
                if (op1Type === BigIntType.getInstance() && op2Type === BigIntType.getInstance()) {
                    type = BigIntType.getInstance();
                }
                break;
            case '-':
            case '*':
            case '/':
            case '%':
            case '**':
                if (op1Type === BigIntType.getInstance() || op2Type === BigIntType.getInstance()) {
                    type = BigIntType.getInstance();
                } else {
                    type = NumberType.getInstance();
                }
                break;
            case '!=':
            case '!==':
            case '<':
            case '>':
            case '<=':
            case '>=':
            case '&&':
            case '||':
            case '==':
            case '===':
            case 'in':
                type = BooleanType.getInstance();
                break;
            case '&':
            case '|':
            case '^':
            case '<<':
            case '>>':
                if (op1Type === NumberType.getInstance() && op2Type === NumberType.getInstance()) {
                    type = NumberType.getInstance();
                }
                if (op1Type === BigIntType.getInstance() && op2Type === BigIntType.getInstance()) {
                    type = BigIntType.getInstance();
                }
                break;
            case '>>>':
                if (op1Type === NumberType.getInstance() && op2Type === NumberType.getInstance()) {
                    type = NumberType.getInstance();
                }
                break;
            case '??':
                if (op1Type === UnknownType.getInstance() || op1Type === UndefinedType.getInstance() || op1Type === NullType.getInstance()) {
                    type = op2Type;
                } else {
                    type = op1Type;
                }
                break;
            default:
        }
        this.type = type;
    }

    public inferType(arkMethod: ArkMethod): AbstractBinopExpr {
        this.inferOpType(this.op1, arkMethod);
        this.inferOpType(this.op2, arkMethod);
        this.setType();
        return this;
    }
}

export class ArkConditionExpr extends AbstractBinopExpr {
    constructor(op1: Value, op2: Value, operator: RelationalBinaryOperator) {
        super(op1, op2, operator);
    }

    public inferType(arkMethod: ArkMethod): ArkConditionExpr {
        this.inferOpType(this.op1, arkMethod);
        const op1Type = this.op1.getType();
        if (this.operator === RelationalBinaryOperator.InEquality && this.op2 === ValueUtil.getOrCreateNumberConst(0)) {
            if (op1Type instanceof StringType) {
                this.op2 = ValueUtil.createStringConst(EMPTY_STRING);
            } else if (op1Type instanceof BooleanType) {
                this.op2 = ValueUtil.getBooleanConstant(false);
            } else if (op1Type instanceof ClassType) {
                this.op2 = ValueUtil.getUndefinedConst();
            }
        } else {
            this.inferOpType(this.getOp2(), arkMethod);
        }
        this.type = BooleanType.getInstance();
        return this;
    }

    public fillType(): void {
        this.type = BooleanType.getInstance();
    }
}

export class ArkNormalBinopExpr extends AbstractBinopExpr {
    constructor(op1: Value, op2: Value, operator: NormalBinaryOperator) {
        super(op1, op2, operator);
    }
}

export class ArkTypeOfExpr extends AbstractExpr {
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
        return 'typeof ' + this.op;
    }

    public inferType(arkMethod: ArkMethod): AbstractExpr {
        if (this.op instanceof AbstractRef || this.op instanceof AbstractExpr) {
            this.op.inferType(arkMethod);
        }
        return this;
    }
}

export class ArkInstanceOfExpr extends AbstractExpr {
    private op: Value;
    private checkType: Type;

    constructor(op: Value, checkType: Type) {
        super();
        this.op = op;
        this.checkType = checkType;
    }

    public getOp(): Value {
        return this.op;
    }

    public setOp(newOp: Value): void {
        this.op = newOp;
    }

    public getCheckType(): Type {
        return this.checkType;
    }

    public setCheckType(type: Type): void {
        this.checkType = type;
    }

    public getType(): Type {
        return BooleanType.getInstance();
    }

    public getUses(): Value[] {
        let uses: Value[] = [];
        uses.push(this.op);
        uses.push(...this.op.getUses());
        return uses;
    }

    public toString(): string {
        return this.op + ' instanceof ' + this.checkType;
    }

    public inferType(arkMethod: ArkMethod): AbstractExpr {
        TypeInference.inferValueType(this.op, arkMethod);
        if (TypeInference.isUnclearType(this.checkType)) {
            const newType = TypeInference.inferUnclearedType(this.checkType, arkMethod.getDeclaringArkClass());
            if (newType) {
                this.checkType = newType;
            }
        }
        return this;
    }
}

// 类型转换
export class ArkCastExpr extends AbstractExpr {
    private op: Value;
    private type: Type;

    constructor(op: Value, type: Type) {
        super();
        this.op = op;
        this.type = type;
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
        return this.type;
    }

    public setType(type: Type): void {
        this.type = type;
    }

    public inferType(arkMethod: ArkMethod): AbstractExpr {
        if (TypeInference.isUnclearType(this.getType())) {
            const type = TypeInference.inferUnclearedType(this.type, arkMethod.getDeclaringArkClass()) ?? this.op.getType();
            if (type !== undefined && !TypeInference.isUnclearType(type)) {
                this.type = type;
                IRInference.inferRightWithSdkType(type, this.op.getType(), arkMethod.getDeclaringArkClass());
            }
        }
        return this;
    }

    public toString(): string {
        return '<' + this.type + '>' + this.op;
    }
}

export class ArkPhiExpr extends AbstractExpr {
    private args: Local[];
    private argToBlock: Map<Local, BasicBlock>;

    constructor() {
        super();
        this.args = [];
        this.argToBlock = new Map();
    }

    public getUses(): Value[] {
        let uses: Value[] = [];
        uses.push(...this.args);
        return uses;
    }

    public getArgs(): Local[] {
        return this.args;
    }

    public setArgs(args: Local[]): void {
        this.args = args;
    }

    public getArgToBlock(): Map<Local, BasicBlock> {
        return this.argToBlock;
    }

    public setArgToBlock(argToBlock: Map<Local, BasicBlock>): void {
        this.argToBlock = argToBlock;
    }

    public getType(): Type {
        return this.args[0].getType();
    }

    public toString(): string {
        let strs: string[] = [];
        strs.push('phi(');
        if (this.args.length > 0) {
            for (const arg of this.args) {
                strs.push(arg.toString());
                strs.push(', ');
            }
            strs.pop();
        }
        strs.push(')');
        return strs.join('');
    }
}

export enum UnaryOperator {
    Neg = '-',
    BitwiseNot = '~',
    LogicalNot = '!',
}

// unary operation expression
export class ArkUnopExpr extends AbstractExpr {
    private op: Value;
    private operator: UnaryOperator;

    constructor(op: Value, operator: UnaryOperator) {
        super();
        this.op = op;
        this.operator = operator;
    }

    public getUses(): Value[] {
        let uses: Value[] = [];
        uses.push(this.op);
        uses.push(...this.op.getUses());
        return uses;
    }

    public getOp(): Value {
        return this.op;
    }

    public setOp(newOp: Value): void {
        this.op = newOp;
    }

    public getType(): Type {
        return this.op.getType();
    }

    /**
     * Get the unary operator from the statement, such as `-`,`~`,`!`.
     * @returns the unary operator of a statement.
     */
    public getOperator(): UnaryOperator {
        return this.operator;
    }

    public toString(): string {
        return this.operator + this.op;
    }
}

export type AliasTypeOriginalModel = Type | ImportInfo | Local | ArkClass | ArkMethod | ArkField;

/**
 * Expression of the right hand of the type alias definition statement.
 * @category core/base/expr
 * @extends AbstractExpr
 * @example
 ```typescript
 let a: number = 123;
 type ABC = typeof a;
 ```
 * The AliasTypeExpr of the previous statement is with local 'a' as the 'originalObject' and 'transferWithTypeOf' is true.
 *
 * The Following case: import type with no clause name is not supported now,
 * whose 'originalObject' is {@link ImportInfo} with 'null' 'lazyExportInfo'.
 ```typescript
 let a = typeof import('./abc');
 ```
 */
export class AliasTypeExpr extends AbstractExpr {
    private originalType?: Type;
    private originalObject: AliasTypeOriginalModel;
    private readonly transferWithTypeOf: boolean = false;
    private realGenericTypes?: Type[];

    constructor(originalObject: AliasTypeOriginalModel, transferWithTypeOf?: boolean) {
        super();
        this.originalObject = originalObject;
        if (transferWithTypeOf !== undefined) {
            this.transferWithTypeOf = transferWithTypeOf;
        }
    }

    public getOriginalObject(): AliasTypeOriginalModel {
        return this.originalObject;
    }

    public setOriginalObject(object: AliasTypeOriginalModel): void {
        this.originalObject = object;
    }

    public getTransferWithTypeOf(): boolean {
        return this.transferWithTypeOf;
    }

    public setRealGenericTypes(realGenericTypes: Type[]): void {
        this.realGenericTypes = realGenericTypes;
    }

    public getRealGenericTypes(): Type[] | undefined {
        return this.realGenericTypes;
    }

    public getOriginalType(): Type | undefined {
        return this.originalType;
    }

    public setOriginalType(type: Type): Type {
        return this.originalType = type;
    }

    public getType(): Type {
        function getTypeOfImportInfo(importInfo: ImportInfo): Type {
            const arkExport = importInfo.getLazyExportInfo()?.getArkExport();
            const importClauseName = importInfo.getImportClauseName();
            let type;
            if (importClauseName.includes('.') && arkExport instanceof ArkClass) {
                type = TypeInference.inferUnclearRefName(importClauseName, arkExport);
            } else if (arkExport) {
                type = TypeInference.parseArkExport2Type(arkExport);
            }
            return type ?? UnknownType.getInstance();
        }

        const operator = this.getOriginalObject();
        if (!this.getTransferWithTypeOf()) {
            if (operator instanceof Type) {
                return TypeInference.replaceTypeWithReal(operator, this.getRealGenericTypes());
            }
            if (operator instanceof ImportInfo) {
                return getTypeOfImportInfo(operator);
            }
            if (operator instanceof ArkClass) {
                return TypeInference.replaceTypeWithReal(new ClassType(operator.getSignature(), operator.getGenericsTypes()), this.getRealGenericTypes());
            }
            return UnknownType.getInstance();
        }

        if (operator instanceof ImportInfo) {
            return getTypeOfImportInfo(operator);
        }
        if (operator instanceof Local || operator instanceof ArkField) {
            return operator.getType();
        }
        if (operator instanceof ArkClass) {
            return TypeInference.replaceTypeWithReal(new ClassType(operator.getSignature(), operator.getGenericsTypes()), this.getRealGenericTypes());
        }
        if (operator instanceof ArkMethod) {
            return TypeInference.replaceTypeWithReal(new FunctionType(operator.getSignature(), operator.getGenericTypes()), this.getRealGenericTypes());
        }
        return UnknownType.getInstance();
    }

    public inferType(arkMethod: ArkMethod): AbstractExpr {
        return IRInference.inferAliasTypeExpr(this, arkMethod);
    }

    /**
     * Returns all used values which mainly used for def-use chain analysis.
     * @returns Always returns empty array because her is the alias type definition which has no relationship with value flow.
     */
    public getUses(): Value[] {
        if (this.originalObject instanceof Local) {
            return [this.originalObject];
        }
        return [];
    }

    public toString(): string {
        let typeOf = '';
        if (this.getTransferWithTypeOf()) {
            typeOf = 'typeof ';
        }

        const typeObject = this.getOriginalObject();
        if (typeObject instanceof AliasType && this.getRealGenericTypes()) {
            return `${typeOf}${typeObject.getSignature().toString()}<${this.getRealGenericTypes()!.join(',')}>`;
        }
        if (typeObject instanceof Type) {
            return `${typeOf}${typeObject.getTypeString()}`;
        }
        if (typeObject instanceof ImportInfo) {
            let res = `${typeOf}import('${typeObject.getFrom()}')`;
            if (typeObject.getImportClauseName() !== '') {
                res = `${res}.${typeObject.getImportClauseName()}`;
            }
            return res;
        }
        if (typeObject instanceof Local) {
            return `${typeOf}${typeObject.toString()}`;
        }
        if (typeObject instanceof ArkClass || typeObject instanceof ArkMethod) {
            let res = `${typeOf}${typeObject.getSignature().toString()}`;
            if (this.getRealGenericTypes() && typeObject instanceof ArkClass) {
                res += `<${this.getRealGenericTypes()!.join(',')}>`;
            } else if (this.getRealGenericTypes() && typeObject instanceof ArkMethod) {
                const genericTypes = this.getRealGenericTypes()!.join(',');
                res = res.replace('(', `<${genericTypes}>(`).replace(/\([^)]*\)/g, `(${genericTypes})`);
            }
            return res;
        }
        return `${typeOf}${typeObject.getName()}`;
    }

    public static isAliasTypeOriginalModel(object: any): object is AliasTypeOriginalModel {
        return (
            object instanceof Type ||
            object instanceof ImportInfo ||
            object instanceof Local ||
            object instanceof ArkClass ||
            object instanceof ArkMethod ||
            object instanceof ArkField
        );
    }
}
