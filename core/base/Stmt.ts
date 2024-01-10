import { ArkField } from "../ArkField";
import { LinePosition } from "../common/Position";
import { ArkArrayRef, ArkFieldRef } from "../common/Ref";
import { Value, ValueTag } from "../common/Value";
import { ArkConditionExpr, ArkInvokeExpr } from "./Expr";

export class Stmt {
    private defs: Value[] = [];
    private uses: Value[] = [];
    private originPosition: number = 0;
    private position: number = 0;
    private valueVersion = new Map<Value, string>();
    private valueTags = new Map<Value, Set<ValueTag>>;

    constructor() {
    }

    public getUses(): Value[] {
        return this.uses;
    }

    public addUse(use: Value): void {
        this.uses.push(use);
    }

    public getdefs(): Value[] {
        return this.defs;
    }

    public addDef(def: Value): void {
        this.defs.push(def);
    }

    public getValueVersion(value: Value): string | undefined {
        return this.valueVersion.get(value);
    }

    public setValueVersion(value: Value, version: string): void {

    }

    public getValueTags(value: Value): Set<ValueTag> | undefined {
        return this.valueTags.get(value);
    }

    public setValueTag(value: Value, valueTag: ValueTag): void {
        this.valueTags.get(value)?.add(valueTag);
    }


    public isBranch(): boolean {
        return false;
    }

    public getExpectedSuccessorCount(): number {
        return 1;
    }

    // 属性变量、数组变量和函数变量包含在use和def中，不额外存储
    public containsInvokeExpr(): boolean {
        for (const use of this.uses) {
            if (use instanceof ArkInvokeExpr) {
                return true;
            }
        }
        return false;
    }

    public getInvokeExpr(): ArkInvokeExpr | undefined {
        for (const use of this.uses) {
            if (use instanceof ArkInvokeExpr) {
                return use as ArkInvokeExpr;
            }
        }
        return undefined;
    }


    public containsArrayRef(): boolean {
        for (const use of this.uses) {
            if (use instanceof ArkArrayRef) {
                return true;
            }
        }
        for (const def of this.defs) {
            if (def instanceof ArkArrayRef) {
                return true;
            }
        }
        return false;
    }

    public getArrayRef(): ArkArrayRef | undefined {
        for (const use of this.uses) {
            if (use instanceof ArkArrayRef) {
                return use as ArkArrayRef;
            }
        }
        for (const def of this.defs) {
            if (def instanceof ArkArrayRef) {
                return def as ArkArrayRef;
            }
        }
        return undefined;
    }

    public containsFieldRef(): boolean {
        for (const use of this.uses) {
            if (use instanceof ArkFieldRef) {
                return true;
            }
        }
        for (const def of this.defs) {
            if (def instanceof ArkFieldRef) {
                return true;
            }
        }
        return false;
    }

    public getFieldRef(): ArkFieldRef | undefined {
        for (const use of this.uses) {
            if (use instanceof ArkFieldRef) {
                return use as ArkFieldRef;
            }
        }
        for (const def of this.defs) {
            if (def instanceof ArkFieldRef) {
                return def as ArkFieldRef;
            }
        }
        return undefined;
    }

    public setPositionInfo(position: number) {
        this.position = position;
    }

    public getPositionInfo(): number {
        return this.position;
    }

    public setOriginPositionInfo(originPosition: number) {
        this.originPosition = originPosition;
    }

    public getOriginPositionInfo(): number {
        return this.originPosition;
    }

    public toString(): string {
        return 'Stmt';
    }
}

// 赋值
export class ArkAssignStmt extends Stmt {
    private leftOp: Value;
    private rightOp: Value;

    constructor(leftOp: Value, rightOp: Value) {
        super();
        this.leftOp = leftOp;
        this.rightOp = rightOp;
        this.addDef(leftOp);
        this.addUse(rightOp);
        for (const use of rightOp.getUses()) {
            this.addUse(use);
        }
    }

    public getLeftOp(): Value {
        return this.leftOp;
    }

    public getRightOp(): Value {
        return this.rightOp;
    }

    public toString(): string {
        return this.getLeftOp() + " = " + this.getRightOp();
    }
}

// 函数调用
export class ArkInvokeStmt extends Stmt {
    private invokeExpr: ArkInvokeExpr;

    constructor(invokeExpr: ArkInvokeExpr) {
        super();
        this.invokeExpr = invokeExpr;
        this.addUse(invokeExpr);
        for (const use of invokeExpr.getUses()) {
            this.addUse(use);
        }
    }

    public getInvokeExpr() {
        return this.invokeExpr;
    }

    public toString(): string {
        return this.invokeExpr.toString();
    }
}


export class ArkIfStmt extends Stmt {
    private conditionExpr: ArkConditionExpr;

    constructor(conditionExpr: ArkConditionExpr) {
        super();
        this.conditionExpr = conditionExpr;
        this.addUse(conditionExpr);
        for (const use of conditionExpr.getUses()) {
            this.addUse(use);
        }
    }

    public getConditionExprExpr() {
        return this.conditionExpr;
    }

    public toString(): string {
        return 'if ' + this.conditionExpr;
    }
}

export class ArkGotoStmt extends Stmt {
    constructor() {
        super();
    }

    public toString(): string {
        return 'goto';
    }
}


export class ArkReturnStmt extends Stmt {
    private op: Value;

    constructor(op: Value) {
        super();
        this.op = op;
    }

    public toString(): string {
        return 'return ' + this.op;
    }
}


export class ArkReturnVoidStmt extends Stmt {
    constructor() {
        super();
    }

    public toString(): string {
        return 'return';
    }
}


export class ArkNopStmt extends Stmt {
    constructor() {
        super();
    }

    public toString(): string {
        return 'nop';
    }
}


/*
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
*/