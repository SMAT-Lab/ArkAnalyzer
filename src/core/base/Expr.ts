import { TypeInference } from "../common/TypeInference";
import { BasicBlock } from "../graph/BasicBlock";
import { MethodSignature } from "../model/ArkSignature";
import { Local } from "./Local";
import { ArrayType, BooleanType, ClassType, NumberType, Type } from "./Type";
import { Value } from "./Value";

export abstract class AbstractExpr implements Value {
    abstract getUses(): Value[];

    abstract getType(): Type;
}

export abstract class AbstractInvokeExpr extends AbstractExpr {
    private methodSignature: MethodSignature;
    private args: Value[];

    constructor(methodSignature: MethodSignature, args: Value[]) {
        super();
        this.methodSignature = methodSignature;
        this.args = args;
    }

    public getMethodSignature(): MethodSignature {
        return this.methodSignature;
    }

    public setMethodSignature(newMethodSignature: MethodSignature): void {
        this.methodSignature = newMethodSignature;
    }

    public getArg(index: number): Value {
        return this.args[index];
    }

    public getArgs(): Value[] {
        return this.args;
    }

    public setArgs(newArgs: Value[]): void {
        this.args = newArgs;
    }

    public getType(): Type {
        return this.methodSignature.getType();
    }

    public getUses(): Value[] {
        let uses: Value[] = [];
        uses.push(...this.args);
        for (const arg of this.args) {
            uses.push(...arg.getUses());
        }
        return uses;
    }
}

export class ArkInstanceInvokeExpr extends AbstractInvokeExpr {
    private base: Local;

    constructor(base: Local, methodSignature: MethodSignature, args: Value[]) {
        super(methodSignature, args);
        this.base = base;
    }

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
        strs.push('.');
        strs.push(this.getMethodSignature().toString());
        strs.push('(');
        if (this.getArgs().length > 0) {
            for (const arg of this.getArgs()) {
                strs.push(arg.toString());
                strs.push(', ');
            }
            strs.pop();
        }
        strs.push(')');
        return strs.join('');
    }
}

export class ArkStaticInvokeExpr extends AbstractInvokeExpr {
    constructor(methodSignature: MethodSignature, args: Value[]) {
        super(methodSignature, args);
    }

    public toString(): string {
        let strs: string[] = [];
        strs.push('staticinvoke ');
        strs.push(this.getMethodSignature().toString());
        strs.push('(');
        if (this.getArgs().length > 0) {
            for (const arg of this.getArgs()) {
                strs.push(arg.toString());
                strs.push(', ');
            }
            strs.pop();
        }
        strs.push(')');
        return strs.join('');
    }
}


export class ArkNewExpr extends AbstractExpr {
    private classType: ClassType;

    constructor(classType: ClassType) {
        super();
        this.classType = classType;
    }

    public getUses(): Value[] {
        let uses: Value[] = [];
        return uses;
    }

    public getType(): Type {
        return this.classType;
    }

    public toString(): string {
        return 'new ' + this.classType;
    }
}

export class ArkNewArrayExpr extends AbstractExpr {
    private baseType: Type;
    private size: Value;

    constructor(baseType: Type, size: Value) {
        super();
        this.baseType = baseType;
        this.size = size;
    }

    public getSize(): Value {
        return this.size;
    }

    public setSize(newSize: Value): void {
        this.size = newSize;
    }

    public getType(): ArrayType {
        // TODO: support multi-dimension array
        return new ArrayType(this.baseType, 1);
    }

    public getBaseType(): Type {
        return this.baseType;
    }

    public setBaseType(newType: Type): void {
        this.baseType = newType;
    }

    public getUses(): Value[] {
        let uses: Value[] = [this.size];
        uses.push(...this.size.getUses());
        return uses;
    }

    public toString(): string {
        return 'newarray ' + this.baseType + '[' + this.size + ']';
    }
}


// 二元运算表达式
export class ArkBinopExpr extends AbstractExpr {
    private op1: Value;
    private op2: Value;
    private operator: string;

    constructor(op1: Value, op2: Value, operator: string) {
        super();
        this.op1 = op1;
        this.op2 = op2;
        this.operator = operator;
    }

    public getOp1(): Value {
        return this.op1;
    }

    public setOp1(newOp1: Value): void {
        this.op1 = newOp1;
    }

    public getOp2(): Value {
        return this.op2;
    }

    public setOp2(newOp2: Value): void {
        this.op2 = newOp2;
    }

    public getOperator(): string {
        return this.operator;
    }

    public getType(): Type {
        return TypeInference.inferTypeOfBinopExpr(this);
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
}

export class ArkConditionExpr extends ArkBinopExpr {
    constructor(op1: Value, op2: Value, operator: string) {
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
}


export class ArkInstanceOfExpr extends AbstractExpr {
    private op: Value;
    private checkType: string;

    constructor(op: Value, checkType: string) {
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
}

export class ArkLengthExpr extends AbstractExpr {
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

    public getType(): Type {
        return NumberType.getInstance();
    }

    public getUses(): Value[] {
        let uses: Value[] = [];
        uses.push(this.op);
        uses.push(...this.op.getUses());
        return uses;
    }

    public toString(): string {
        return 'lengthof ' + this.op;
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

    public toString(): string {
        return '<' + this.type + '>' + this.op;
    }
}

export class ArkPhiExpr extends AbstractExpr {
    private args: Local[];
    private blockToArg: Map<BasicBlock, Local>;
    private argToBlock: Map<Local, BasicBlock>;

    // private type:Type;

    constructor() {
        super();
        this.args = [];
        this.blockToArg = new Map();
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

// unary operation expression
export class ArkUnopExpr extends AbstractExpr {
    private op: Value;
    private operator: string;

    constructor(op: Value, operator: string) {
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

    public getType(): Type {
        return this.op.getType();
    }


    public toString(): string {
        return this.operator + this.op;
    }
}
