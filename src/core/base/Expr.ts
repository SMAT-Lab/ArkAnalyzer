import { BasicBlock } from "../graph/BasicBlock";
import { Local } from "./Local";
import { Value } from "./Value";


export interface Expr extends Value { }

export class ArkInvokeExpr implements Expr {
    private methodSignature: string;
    private base: Local;
    private args: Value[];

    constructor(base: Local, methodSignature: string, args: Value[]) {
        this.methodSignature = methodSignature;
        this.base = base;
        this.args = args;
    }

    public getMethodSignature(): string {
        return this.methodSignature;
    }

    public getArg(index: number): Value {
        return this.args[index];
    }

    public getArgs(): Value[] {
        return this.args;
    }

    public getUses(): Value[] {
        let uses: Value[] = [];
        for (const arg of this.args) {
            uses.push(...arg.getUses());
        }
        return uses;
    }

    public toString(): string {
        let strs: string[] = [];
        strs.push(this.base.toString());
        strs.push('.');
        strs.push(this.methodSignature);
        strs.push('(');
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


export class ArkNewExpr implements Expr {
    private classSignature: string;

    constructor(classSignature: string) {
        this.classSignature = classSignature;
    }

    public getClassSignature(): string {
        return this.classSignature;
    }

    public getUses(): Value[] {
        let uses: Value[] = [];
        return uses;
    }

    public toString(): string {
        return 'new ' + this.classSignature;
    }
}

export class ArkNewArrayExpr implements Expr {
    private baseType: string;
    private size: Value;

    constructor(baseType: string, size: Value) {
        this.baseType = baseType;
        this.size = size;
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
export class ArkBinopExpr implements Expr {
    private op1: Value;
    private op2: Value;
    private operator: string;

    constructor(op1: Value, op2: Value, operator: string) {
        this.op1 = op1;
        this.op2 = op2;
        this.operator = operator;
    }

    public getUses(): Value[] {
        let uses: Value[] = [];
        uses.push(this.op1);
        uses.push(this.op2);
        return uses;
    }

    public toString(): string {
        return this.op1 + ' ' + this.operator + ' ' + this.op2;
    }
}

// TODO:表示为二元比较
export class ArkConditionExpr implements Expr {
    private condition: string;

    constructor(condition: string) {
        this.condition = condition;
    }

    public getUses(): Value[] {
        let uses: Value[] = [];
        return uses;
    }

    public toString(): string {
        return this.condition;
    }
}


export class ArkTypeOfExpr implements Expr {
    private op: Value;

    constructor(op: Value) {
        this.op = op;
    }

    public getUses(): Value[] {
        let uses: Value[] = [];
        return uses;
    }

    public toString(): string {
        return 'typeof ' + this.op;
    }
}


export class ArkInstanceOfExpr implements Expr {
    private op: Value;
    private checkType: string;

    constructor(op: Value, checkType: string) {
        this.op = op;
        this.checkType = checkType;
    }

    public getUses(): Value[] {
        let uses: Value[] = [];
        return uses;
    }

    public toString(): string {
        return this.op + ' instanceof ' + this.checkType;
    }
}

export class ArkLengthExpr implements Expr {
    private op: Value;

    constructor(op: Value) {
        this.op = op;
    }

    public getUses(): Value[] {
        let uses: Value[] = [];
        return uses;
    }

    public toString(): string {
        return 'lengthof ' + this.op;
    }
}

// 类型转换
export class ArkCastExpr implements Expr {
    private op: Value;
    private type: string;

    constructor(op: Value, type: string) {
        this.op = op;
        this.type = type;
    }

    public getUses(): Value[] {
        let uses: Value[] = [];
        return uses;
    }

    public toString(): string {
        return '<' + this.type + '>' + this.op;
    }
}

export class ArkPhiExpr implements Expr {
    private args: Local[];
    private blockToArg: Map<BasicBlock, Local>;
    private argToBlock: Map<Local, BasicBlock>;

    constructor() {
        this.args = [];
        this.blockToArg = new Map();
        this.argToBlock = new Map();
    }

    public getUses(): Value[] {
        let uses: Value[] = [];
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
