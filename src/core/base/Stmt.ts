import { ArkField } from "../model/ArkField";
import { LinePosition } from "./Position";
import { ArkArrayRef, ArkFieldRef } from "./Ref";
import { Value, ValueTag } from "./Value";
import { ArkConditionExpr, ArkInvokeExpr } from "./Expr";

export class Stmt {
    private text: string = '';
    private def: Value | null = null;
    private uses: Value[] = [];
    private originPosition: number = 0;
    private position: number = 0;
    private valueVersion = new Map<Value, string>();
    private valueTags = new Map<Value, Set<ValueTag>>;

    constructor() {
    }

    /** Return a list of values which are uesd in this statement */
    public getUses(): Value[] {
        return this.uses;
    }

    public addUse(use: Value): void {
        this.uses.push(use);
    }

    /** Return the def which is uesd in this statement */
    public getDef(): Value | null {
        return this.def;
    }

    public setDef(def: Value): void {
        this.def = def;
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

    /** 
     * Return true if the following statement may not execute after this statement.
     * The ArkIfStmt and ArkGotoStmt will return true.
     */
    public isBranch(): boolean {
        return false;
    }

    /** Return the number of statements which this statement may go to */
    public getExpectedSuccessorCount(): number {
        return 1;
    }

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
        if (this.def instanceof ArkArrayRef) {
            return true;
        }
        return false;
    }

    public getArrayRef(): ArkArrayRef | undefined {
        for (const use of this.uses) {
            if (use instanceof ArkArrayRef) {
                return use as ArkArrayRef;
            }
        }

        if (this.def instanceof ArkArrayRef) {
            return undefined;
        }

        return undefined;
    }

    public containsFieldRef(): boolean {
        for (const use of this.uses) {
            if (use instanceof ArkFieldRef) {
                return true;
            }
        }

        if (this.def instanceof ArkFieldRef) {
            return true;
        }
        return false;
    }

    public getFieldRef(): ArkFieldRef | undefined {
        for (const use of this.uses) {
            if (use instanceof ArkFieldRef) {
                return use as ArkFieldRef;
            }
        }
        if (this.def instanceof ArkFieldRef) {
            return undefined;
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
        return this.text;
    }

    public setText(text: string): void {
        this.text = text;
    }
}


export class ArkAssignStmt extends Stmt {
    private leftOp: Value;
    private rightOp: Value;

    constructor(leftOp: Value, rightOp: Value) {
        super();
        this.leftOp = leftOp;
        this.rightOp = rightOp;
        this.setDef(leftOp);
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

    public isBranch(): boolean {
        return true;
    }

    public getExpectedSuccessorCount(): number {
        return 2;
    }

    public toString(): string {
        return 'if ' + this.conditionExpr;
    }
}


export class ArkGotoStmt extends Stmt {
    constructor() {
        super();
    }

    public isBranch(): boolean {
        return true;
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

    public getExpectedSuccessorCount(): number {
        return 0;
    }

    public toString(): string {
        return 'return ' + this.op;
    }
}


export class ArkReturnVoidStmt extends Stmt {
    constructor() {
        super();
    }

    public getExpectedSuccessorCount(): number {
        return 0;
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