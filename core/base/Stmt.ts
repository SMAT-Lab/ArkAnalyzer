
import { Value, LValue } from '../comon/Value';
import { Position } from '../comon/Position';
import { AbstractConditionExpr, AbstractInvokeExpr } from './Expr';



export interface Stmt {
    getUses(): Value[];

    getDefs(): LValue[];

    getUsesAndDefs(): Value[];

    branches(): boolean;

    getExpectedSuccessorCount(): number;

    containsInvokeExpr(): boolean;

    getInvokeExpr(): AbstractInvokeExpr;

    containsFieldRef(): boolean;

    // getFieldRef():JFieldRef;

    getPositionInfo(): Position;
}


export abstract class AbstractStmt implements Stmt {
    protected readonly positionInfo: Position

    constructor(positionInfo: Position) {
        this.positionInfo = positionInfo;
    }

    public getUses(): Value[] {
        return [];
    }

    public getDefs(): LValue[] {
        return [];
    }

    public getUsesAndDefs(): Value[] {
        let values: Value[] = [];
        values.push(...this.getUses());
        values.push(...this.getDefs());
        return values;
    }

    public getExpectedSuccessorCount(): number {
        return 1;
    }

    public branches(): boolean {
        return false;
    }


    public containsInvokeExpr(): boolean {
        return false;
    }

    public abstract getInvokeExpr():AbstractInvokeExpr;

    public containsFieldRef(): boolean {
        return false;
    }

    public getPositionInfo(): Position {
        return this.positionInfo;
    }
}


export class ArkIfStmt extends AbstractStmt {
    public static THEN_BRANCH_IDX: number = 0;
    public static ELSE_BRANCH_IDX: number = 1;

    private condition: AbstractConditionExpr;

    constructor(condition: AbstractConditionExpr, positionInfo: Position) {
        super(positionInfo);
        this.condition = condition;
    }

    public getCondition(): AbstractConditionExpr {
        return this.condition;
    }

    public getUses(): Value[] {
        let uses: Value[] = [];
        return uses;
    }

    public getExpectedSuccessorCount(): number {
        return 2;
    }

    public branches(): boolean {
        return true;
    }

    public getInvokeExpr(): never {
        throw new Error();
    }
}


export class ArkGotoStmt extends AbstractStmt {
    public static BRANCH_IDX: number = 0;

    constructor(positionInfo: Position) {
        super(positionInfo);
    }

    public getExpectedSuccessorCount(): number {
        return 1;
    }

    public branches(): boolean {
        return true;
    }

    public getInvokeExpr(): never {
        throw new Error();
    }
}


export abstract class AbstractDefinitionStmt extends AbstractStmt {
    constructor(positionInfo: Position) {
        super(positionInfo);
    }


    public abstract getLeftOp(): LValue;

    public abstract getRightOp(): Value;

    public getUses(): Value[] {
        let uses: Value[] = [];
        return uses;
    }

    public getDefs(): Value[] {
        let defs: Value[] = [];
        return defs;
    }
}


export class ArkAssignStmt extends AbstractDefinitionStmt {
    private leftOp: LValue;
    private rightOp: Value;

    constructor(leftOp: LValue, rightOp: Value, positionInfo: Position) {
        super(positionInfo);
        this.leftOp = leftOp;
        this.rightOp = rightOp;
    }

    public getLeftOp(): LValue {
        return this.leftOp;
    }

    public getRightOp(): LValue {
        return this.rightOp;
    }


    public containsInvokeExpr(): boolean {
        return this.getRightOp() instanceof AbstractInvokeExpr;
    }

    public getInvokeExpr(): AbstractInvokeExpr {
        if (!this.containsInvokeExpr()) {
            throw new Error();
        }
        return <AbstractInvokeExpr>this.getRightOp();
    }
}


export class ArkReturnStmt extends AbstractStmt {
    private returnValue: Value;

    constructor(returnValue: Value, positionInfo: Position) {
        super(positionInfo);
        this.returnValue = returnValue;
    }

    public getReturnValue(): Value {
        return this.returnValue;
    }

    public getExpectedSuccessorCount(): number {
        return 0;
    }

    public getInvokeExpr(): never {
        throw new Error();
    }
}


export class ArkReturnVoidStmt extends AbstractStmt {
    constructor(positionInfo: Position) {
        super(positionInfo);
    }


    public getExpectedSuccessorCount(): number {
        return 0;
    }

    public getInvokeExpr(): never {
        throw new Error();
    }
}


export class ArkInvokeStmt extends AbstractStmt {
    private invokeExpr: AbstractInvokeExpr;

    constructor(invokeExpr: AbstractInvokeExpr, positionInfo: Position) {
        super(positionInfo);
        this.invokeExpr = invokeExpr;
    }

    public getUses(): Value[] {
        let uses: Value[] = [];
        return uses;
    }

    public getDefs(): Value[] {
        let defs: Value[] = [];
        return defs;
    }

    public containsInvokeExpr(): boolean {
        return false;
    }

    public getInvokeExpr(): AbstractInvokeExpr {
        return this.invokeExpr;
    }
}