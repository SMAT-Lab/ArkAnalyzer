import { Value } from "../comon/Value";
import { MethodSignature } from "../ArkSignature";

export interface Expr extends Value { }


// 函数调用表达式
export abstract class AbstractInvokeExpr implements Expr {
    private methodSignature: MethodSignature;
    private args: Value[];

    constructor(methodSignature: MethodSignature, args: Value[]) {
        this.methodSignature = methodSignature;
        this.args = args;
    }

    public getUses(): Value[] {
        let uses: Value[] = [];
        return uses;
    }

    public getMethodSignature(): MethodSignature {
        return this.methodSignature;
    }

    public getArgs(): Value[] {
        return this.args;
    }
}

export abstract class AbstractInstanceInvokeExpr extends AbstractInvokeExpr {
    private base: Value;

    constructor(base: Value, methodSignature: MethodSignature, args: Value[]) {
        super(methodSignature, args);
        this.base = base;
    }

    public getBase(): Value {
        return this.base;
    }

    public getUses(): Value[] {
        let uses: Value[] = [];
        return uses;
    }
}


export class ArkInterfaceInvokeExpr extends AbstractInstanceInvokeExpr {
    constructor(base: Value, methodSignature: MethodSignature, args: Value[]) {
        super(base, methodSignature, args);
    }
}


// 构造函数、私有函数、虚拟初始化函数
export class ArkSpecialInvokeExpr extends AbstractInstanceInvokeExpr {
    constructor(base: Value, methodSignature: MethodSignature, args: Value[]) {
        super(base, methodSignature, args);
    }
}


export class ArkStaticInvokeExpr extends AbstractInvokeExpr {
    constructor(methodSignature: MethodSignature, args: Value[]) {
        super(methodSignature, args);
    }
}


// SSA phi函数
export class ArkPhiExpr implements Expr {
    private args: Value[];
    // private blockToArg:Map<>;
    // private argToBlock:Map<>;

    constructor(args: Value[]) {
        this.args = args;
    }


    public getArgs() {
        return this.args;
    }

    public getUses(): Value[] {
        let uses: Value[] = [];
        return uses;
    }
}


export class ArkNewExpr implements Expr {
    constructor() {

    }


    public getUses(): Value[] {
        let uses: Value[] = [];
        return uses;
    }
}

export class ArkDeleteExpr implements Expr {
    constructor() {

    }


    public getUses(): Value[] {
        let uses: Value[] = [];
        return uses;
    }

}




// 一元运算表达式
export abstract class AbstractUnopExpr implements Expr {
    private op: Value;

    constructor(op: Value) {
        this.op = op;
    }

    public getOp(): Value {
        return this.op;
    }

    public getUses(): Value[] {
        let uses: Value[] = [];
        return uses;
    }
}


export class ArkNegExpr extends AbstractUnopExpr {
    constructor(op: Value) {
        super(op);
    }
}



// 二元运算表达式
export abstract class AbstractBinopExpr implements Expr {
    private op1: Value;
    private op2: Value;

    constructor(op1: Value, op2: Value) {
        this.op1 = op1;
        this.op2 = op2;
    }

    public getUses(): Value[] {
        let uses: Value[] = [];
        return uses;
    }
}


// 条件运算表达式
export abstract class AbstractConditionExpr extends AbstractBinopExpr {
    constructor(op1: Value, op2: Value) {
        super(op1, op2);
    }
}


// ==
export class ArkEqExpr extends AbstractConditionExpr {
    constructor(op1: Value, op2: Value) {
        super(op1, op2);
    }
}


// >=
export class ArkGeExpr extends AbstractConditionExpr {
    constructor(op1: Value, op2: Value) {
        super(op1, op2);
    }
}


// >
export class ArkGtExpr extends AbstractConditionExpr {
    constructor(op1: Value, op2: Value) {
        super(op1, op2);
    }
}


// <=
export class ArkLeExpr extends AbstractConditionExpr {
    constructor(op1: Value, op2: Value) {
        super(op1, op2);
    }
}


// <
export class ArkLtExpr extends AbstractConditionExpr {
    constructor(op1: Value, op2: Value) {
        super(op1, op2);
    }
}


// !=
export class ArkNeExpr extends AbstractConditionExpr {
    constructor(op1: Value, op2: Value) {
        super(op1, op2);
    }
}


// &&
export class ArkLogicAndExpr extends AbstractConditionExpr {
    constructor(op1: Value, op2: Value) {
        super(op1, op2);
    }
}


// ||
export class ArkLogicOrExpr extends AbstractConditionExpr {
    constructor(op1: Value, op2: Value) {
        super(op1, op2);
    }
}


// 算术运算表达式
export abstract class AbstractArithmeticExpr extends AbstractBinopExpr {
    constructor(op1: Value, op2: Value) {
        super(op1, op2);
    }
}


export class ArkAddExpr extends AbstractArithmeticExpr {
    constructor(op1: Value, op2: Value) {
        super(op1, op2);
    }
}


export class ArkSubExpr extends AbstractArithmeticExpr {
    constructor(op1: Value, op2: Value) {
        super(op1, op2);
    }
}


export class ArkMulExpr extends AbstractArithmeticExpr {
    constructor(op1: Value, op2: Value) {
        super(op1, op2);
    }
}


export class ArkDivExpr extends AbstractArithmeticExpr {
    constructor(op1: Value, op2: Value) {
        super(op1, op2);
    }
}


// 取余 %
export class ArkRemExpr extends AbstractArithmeticExpr {
    constructor(op1: Value, op2: Value) {
        super(op1, op2);
    }
}



// 位运算表达式
export abstract class AbstractBitwiseExpr extends AbstractBinopExpr {
    constructor(op1: Value, op2: Value) {
        super(op1, op2);
    }
}


export class ArkBitwiseAndExpr extends AbstractBitwiseExpr {
    constructor(op1: Value, op2: Value) {
        super(op1, op2);
    }
}

export class ArkBitwiseOrExpr extends AbstractBitwiseExpr {
    constructor(op1: Value, op2: Value) {
        super(op1, op2);
    }
}


export class ArkBitwiseXorExpr extends AbstractBitwiseExpr {
    constructor(op1: Value, op2: Value) {
        super(op1, op2);
    }
}


// 左移 <<
export class ArkBitwiseShlExpr extends AbstractBitwiseExpr {
    constructor(op1: Value, op2: Value) {
        super(op1, op2);
    }
}


// 右移 >>
export class ArkBitwiseShrExpr extends AbstractBitwiseExpr {
    constructor(op1: Value, op2: Value) {
        super(op1, op2);
    }
}


// 无符号右移 >>>
export class ArkBitwiseUshrExpr extends AbstractBitwiseExpr {
    constructor(op1: Value, op2: Value) {
        super(op1, op2);
    }
}