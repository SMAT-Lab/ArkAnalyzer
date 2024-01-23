import { BasicBlock } from "../graph/BasicBlock";
import { Local } from "./Local";
import { Value } from "./Value";

export abstract class AbstractExpr implements Value {
    abstract getUses(): Value[];    
}

export class ArkInvokeExpr extends AbstractExpr {
    private methodSignature: string;
    private base: Local;
    private args: Value[];

    constructor(base: Local, methodSignature: string, args: Value[]) {
        super();
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

    public setArgs(newArgs: Value[]): void {
        this.args = newArgs;
    }

    public getBase(): Local {
        return this.base;
    }

    public setBase(newBase: Local): void {
        this.base = newBase;
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


export class ArkNewExpr extends AbstractExpr {
    private classSignature: string;

    constructor(classSignature: string) {
        super();
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

export class ArkNewArrayExpr extends AbstractExpr {
    private baseType: string;
    private size: Value;

    constructor(baseType: string, size: Value) {
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
export class ArkConditionExpr extends AbstractExpr {
    private condition: string;

    constructor(condition: string) {
        super();
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
        return uses;
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

    public getUses(): Value[] {
        let uses: Value[] = [];
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

    public getUses(): Value[] {
        let uses: Value[] = [];
        return uses;
    }

    public toString(): string {
        return 'lengthof ' + this.op;
    }
}

// 类型转换
export class ArkCastExpr extends AbstractExpr {
    private op: Value;
    private type: string;

    constructor(op: Value, type: string) {
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
        return uses;
    }

    public toString(): string {
        return '<' + this.type + '>' + this.op;
    }
}

export class ArkPhiExpr extends AbstractExpr {
    private args: Local[];
    private blockToArg: Map<BasicBlock, Local>;
    private argToBlock: Map<Local, BasicBlock>;

    constructor() {
        super();
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
