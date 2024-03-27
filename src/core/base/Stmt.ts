import { StmtUseReplacer } from "../common/StmtUseReplacer";
import { Cfg } from "../graph/Cfg";
import { ArkFile } from "../model/ArkFile";
import { AbstractExpr, AbstractInvokeExpr, ArkConditionExpr } from "./Expr";
import { LineColPosition } from "./Position";
import { AbstractFieldRef, ArkArrayRef } from "./Ref";
import { Value, ValueTag } from "./Value";

export class Stmt {
    private text: string = '';
    private def: Value | null = null;
    private uses: Value[] = [];
    private originPosition: number = 0;
    private position: number = 0;
    private etsPosition: LineColPosition;
    private valueVersion = new Map<Value, string>();
    private valueTags = new Map<Value, Set<ValueTag>>;
    private cfg: Cfg | null = null;

    private originColumn: number = -1;
    private column: number = -1;

    constructor() {
    }

    /** Return a list of values which are uesd in this statement */
    public getUses(): Value[] {
        let uses: Value[] = [];
        for (const use of this.uses) {
            if (!(use instanceof AbstractExpr)) {
                uses.push(use);
            }
        }
        return uses;
    }

    public addUse(use: Value): void {
        this.uses.push(use);
    }

    public replaceUse(oldUse: Value, newUse: Value): void {
        let stmtUseReplacer = new StmtUseReplacer(oldUse, newUse);
        stmtUseReplacer.caseStmt(this);
    }

    public replaceUses(uses: Value[]): void {
        this.uses = Array.from(uses);
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

    public getCfg(): Cfg | null {
        return this.cfg;
    }

    public setCfg(cfg: Cfg): void {
        this.cfg = cfg
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
            if (use instanceof AbstractInvokeExpr) {
                return true;
            }
        }
        return false;
    }

    public getInvokeExpr(): AbstractInvokeExpr | undefined {
        for (const use of this.uses) {
            if (use instanceof AbstractInvokeExpr) {
                return use as AbstractInvokeExpr;
            }
        }
        return undefined;
    }

    public getExprs(): AbstractExpr[] {
        let exprs: AbstractExpr[] = [];
        for (const use of this.uses) {
            if (use instanceof AbstractExpr) {
                exprs.push(use);
            }
        }
        return exprs;
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
            if (use instanceof AbstractFieldRef) {
                return true;
            }
        }

        if (this.def instanceof AbstractFieldRef) {
            return true;
        }
        return false;
    }

    public getFieldRef(): AbstractFieldRef | undefined {
        for (const use of this.uses) {
            if (use instanceof AbstractFieldRef) {
                return use as AbstractFieldRef;
            }
        }
        if (this.def instanceof AbstractFieldRef) {
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

    public setOriginPositionInfo(originPosition: number): void {
        this.originPosition = originPosition;
    }

    public getOriginPositionInfo(): number {
        return this.originPosition;
    }

    public setEtsPositionInfo(position: LineColPosition) {
        this.etsPosition = position;
    }

    public async getEtsPositionInfo(arkFile: ArkFile): Promise<LineColPosition> {
        if (!this.etsPosition) {
            const etsPosition = await arkFile.getEtsOriginalPositionFor(new LineColPosition(this.originPosition, this.originColumn));
            this.setEtsPositionInfo(etsPosition);
        }
        return this.etsPosition;
    }

    public setColumn(nweColumn: number) {
        this.column = nweColumn;
    }

    public getColumn(): number {
        return this.column;
    }

    public setOriginColumn(newOriginColumn: number): void {
        this.originColumn = newOriginColumn;
    }

    public getOriginColumn(): number {
        return this.originColumn;
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
        this.updateUses();
    }

    public getLeftOp(): Value {
        return this.leftOp;
    }

    public setLeftOp(newLeftOp: Value): void {
        this.leftOp = newLeftOp;
        this.setDef(newLeftOp);
    }

    public getRightOp(): Value {
        return this.rightOp;
    }

    public setRightOp(rightOp: Value): void {
        this.rightOp = rightOp;
        this.updateUses();
    }

    public toString(): string {
        const str = this.getLeftOp() + " = " + this.getRightOp();
        this.setText(str);
        return str;
    }

    private updateUses(): void {
        let uses: Value[] = [];
        uses.push(...this.leftOp.getUses());
        uses.push(this.rightOp);
        uses.push(...this.rightOp.getUses());
        this.replaceUses(uses);
    }
}


export class ArkInvokeStmt extends Stmt {
    private invokeExpr: AbstractInvokeExpr;

    constructor(invokeExpr: AbstractInvokeExpr) {
        super();
        this.invokeExpr = invokeExpr;
        this.updateUses();
    }

    public replaceInvokeExpr(newExpr: AbstractInvokeExpr) {
        this.invokeExpr = newExpr
    }

    public getInvokeExpr() {
        return this.invokeExpr;
    }

    public toString(): string {
        const str = this.invokeExpr.toString();
        this.setText(str);
        return str;
    }

    private updateUses(): void {
        let uses: Value[] = [];
        uses.push(this.invokeExpr);
        uses.push(...this.invokeExpr.getUses());
        this.replaceUses(uses);
    }
}


export class ArkIfStmt extends Stmt {
    private conditionExpr: ArkConditionExpr;

    constructor(conditionExpr: ArkConditionExpr) {
        super();
        this.conditionExpr = conditionExpr;
        this.updateUses();
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
        const str = 'if ' + this.conditionExpr;
        this.setText(str);
        return str;
    }

    private updateUses(): void {
        let uses: Value[] = [];
        uses.push(this.conditionExpr);
        uses.push(...this.conditionExpr.getUses());
        this.replaceUses(uses);
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
        const str = 'goto';
        this.setText(str);
        return str;
    }
}


export class ArkReturnStmt extends Stmt {
    private op: Value;

    constructor(op: Value) {
        super();
        this.op = op;
        this.updateUses();
    }

    public getExpectedSuccessorCount(): number {
        return 0;
    }

    public getOp(): Value {
        return this.op;
    }

    public setReturnValue(returnValue: Value): void {
        this.op = returnValue;
        this.updateUses();
    }

    public toString(): string {
        const str = 'return ' + this.op;
        this.setText(str);
        return str;
    }

    private updateUses(): void {
        let uses: Value[] = [];
        uses.push(this.op);
        uses.push(...this.op.getUses());
        this.replaceUses(uses);
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
        const str = 'return';
        this.setText(str);
        return str;
    }
}


export class ArkNopStmt extends Stmt {
    constructor() {
        super();
    }

    public toString(): string {
        const str = 'nop';
        this.setText(str);
        return str;
    }
}

export class ArkSwitchStmt extends Stmt {
    private key: Value;
    private cases: Value[];  // default as an extra block

    constructor(key: Value, cases: Value[]) {
        super();
        this.key = key;
        this.cases = cases;
        this.updateUses();
    }

    public getKey(): Value {
        return this.key;
    }

    public getCases(): Value[] {
        return this.cases;
    }

    public isBranch(): boolean {
        return true;
    }

    public getExpectedSuccessorCount(): number {
        return this.cases.length + 1;
    }

    public toString(): string {
        let strs: string[] = [];
        strs.push('switch(' + this.key + ') {');
        for (const c of this.cases) {
            strs.push('case ');
            strs.push(c.toString());
            strs.push(': ');
            strs.push(', ');
        }

        strs.push('default : }');
        const str = strs.join('');
        this.setText(str);
        return str;
    }

    private updateUses(): void {
        let uses: Value[] = [];
        uses.push(this.key);
        uses.push(...this.key.getUses());
        this.replaceUses(uses);
    }
}

export class ArkDeleteStmt extends Stmt {
    private field: AbstractFieldRef;

    constructor(field: AbstractFieldRef) {
        super();
        this.field = field;
        this.updateUses();
    }

    public getField(): AbstractFieldRef {
        return this.field;
    }

    public setField(newField: AbstractFieldRef): void {
        this.field = newField;
    }

    public toString(): string {
        const str = 'delete ' + this.field;
        this.setText(str);
        return str;
    }

    private updateUses(): void {
        let uses: Value[] = [];
        uses.push(this.field);
        uses.push(...this.field.getUses());
        this.replaceUses(uses);
    }
}

export class ArkThrowStmt extends Stmt {
    private op: Value;

    constructor(op: Value) {
        super();
        this.op = op;
        this.updateUses();
    }

    public getOp(): Value {
        return this.op;
    }

    public toString(): string {
        const str = 'throw ' + this.op;
        this.setText(str);
        return str;
    }

    private updateUses(): void {
        let uses: Value[] = [];
        uses.push(this.op);
        uses.push(...this.op.getUses());
        this.replaceUses(uses);
    }
}