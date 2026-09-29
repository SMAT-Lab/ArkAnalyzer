/*
 * Copyright (c) 2024-2025 Huawei Device Co., Ltd.
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

import { StmtUseReplacer } from '../common/StmtUseReplacer';
import { Cfg } from '../graph/Cfg';
import { AbstractExpr, AbstractInvokeExpr, AliasTypeExpr, ArkConditionExpr } from './Expr';
import { AbstractFieldRef, ArkArrayRef } from './Ref';
import { Value } from './Value';
import { FullPosition, LineColPosition } from './Position';
import { ArkMetadata, ArkMetadataKind, ArkMetadataType } from '../model/ArkMetadata';
import { StmtDefReplacer } from '../common/StmtDefReplacer';
import { IRUtils } from '../common/IRUtils';
import { AliasType, ArrayType, IntersectionType, TupleType, Type, UnionType } from './Type';
import { ModifierType } from '../model/ArkBaseModel';
import { AbstractTypeExpr } from './TypeExpr';

const EMPTY_USES: Value[] = [];
const usesScratch: Value[] = [];
const POSITION_HOLE = -1;

/**
 * @category core/base/stmt
 */
export abstract class Stmt {
    protected text?: string; // just for debug
    protected originalText?: string;
    protected sourceCode?: string;
    /** The full position (start/end line/col) of this statement in the source file.
     *  Undefined when this statement is automatically generated during IR construction. */
    protected originFullPosition?: FullPosition;
    protected cfg!: Cfg;
    protected operandPositionsPacked?: number[]; // interleaved [first, last] packed LineCol words,
    // corresponding with def and uses one by one
    metadata?: ArkMetadata;

    public getMetadata(kind: ArkMetadataKind): ArkMetadataType | undefined {
        return this.metadata?.getMetadata(kind);
    }

    public setMetadata(kind: ArkMetadataKind, value: ArkMetadataType): void {
        if (!this.metadata) {
            this.metadata = new ArkMetadata();
        }
        return this.metadata?.setMetadata(kind, value);
    }

    /** Return a list of values which are uesd in this statement */
    public getUses(acc?: Value[]): Value[] {
        return acc ?? EMPTY_USES;
    }

    public replaceUse(oldUse: Value, newUse: Value): void {
        const stmtUseReplacer = new StmtUseReplacer(oldUse, newUse);
        stmtUseReplacer.caseStmt(this);
    }

    /**
     * Return the definition which is uesd in this statement. Generally, the definition is the left value of `=` in
     * 3AC.  For example, the definition in 3AC of `value = parameter0: @project-1/sample-1.ets: AnonymousClass-0` is
     * `value`,  and the definition in `$temp0 = staticinvoke <@_ProjectName/_FileName: xxx.create()>()` is `\$temp0`.
     * @returns The definition in 3AC (may be a **null**).
     * @example
     * 1. get the def in stmt.
     ```typescript
     for (const block of this.blocks) {
     for (const stmt of block.getStmts()) {
     const defValue = stmt.getDef();
     ...
     }
     }
     ```
     */
    public getDef(): Value | null {
        return null;
    }

    public replaceDef(oldDef: Value, newDef: Value): void {
        const stmtDefReplacer = new StmtDefReplacer(oldDef, newDef);
        stmtDefReplacer.caseStmt(this);
    }

    public getDefAndUses(acc?: Value[]): Value[] {
        const defAndUses = acc ?? [];
        const def = this.getDef();
        if (def) {
            defAndUses.push(def);
        }
        this.getUses(defAndUses);
        return defAndUses;
    }

    /**
     * Get the CFG (i.e., control flow graph) of an {@link ArkBody} in which the statement is.
     * A CFG contains a set of basic blocks and statements corresponding to each basic block.
     * Note that, "source code" and "three-address" are two types of {@link Stmt} in ArkAnalyzer.
     * Source code {@link Stmt} represents the statement of ets/ts source code, while three-address code {@link Stmt}
     * represents the statement after it has been converted into three-address code.  Since the source code {@link
     * Stmt} does not save its CFG reference, it returns **null**, while the `getCfg()` of the third address code
     * {@link Stmt} will return its CFG reference.
     * @returns The CFG (i.e., control flow graph) of an {@link ArkBody} in which the statement is.
     * @example
     * 1. get the ArkFile based on stmt.
     ```typescript
     const arkFile = stmt.getCfg()?.getDeclaringMethod().getDeclaringArkFile();
     ```
     2. get the ArkMethod based on stmt.
     ```typescript
     let sourceMethod: ArkMethod = stmt.getCfg()?.getDeclaringMethod();
     ```
     */
    public getCfg(): Cfg {
        return this.cfg;
    }

    public setCfg(cfg: Cfg): void {
        this.cfg = cfg;
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
        usesScratch.length = 0;
        this.getUses(usesScratch);
        for (const use of usesScratch) {
            if (use instanceof AbstractInvokeExpr) {
                return true;
            }
        }
        return false;
    }

    /**
     * Returns the method's invocation expression (including method signature and its arguments)
     * in the current statement. An **undefined** will be returned if there is no method used in this statement.
     * @returns  the method's invocation expression from the statement. An **undefined** will be returned if there is
     *     no method can be found in this statement.
     * @example
     * 1. get invoke expr based on stmt.
     ```typescript
     let invoke = stmt.getInvokeExpr();
     ```
     */
    public getInvokeExpr(): AbstractInvokeExpr | undefined {
        usesScratch.length = 0;
        this.getUses(usesScratch);
        for (const use of usesScratch) {
            if (use instanceof AbstractInvokeExpr) {
                return use as AbstractInvokeExpr;
            }
        }
        return undefined;
    }

    /**
     * Returns an array of expressions in the statement.
     * @returns An array of expressions in the statement.
     * @example
     * 1. Traverse expression of statement.

     ```typescript
     for (const expr of stmt.getExprs()) {
     ...
     }
     ```
     */
    public getExprs(): AbstractExpr[] {
        let exprs: AbstractExpr[] = [];
        for (const use of this.getUses()) {
            if (use instanceof AbstractExpr) {
                exprs.push(use);
            }
        }
        return exprs;
    }

    public getTypeExprs(): AbstractTypeExpr[] {
        let typeExprs: AbstractTypeExpr[] = [];
        for (const value of this.getDefAndUses()) {
            const valueType = value.getType();
            if (valueType instanceof AbstractTypeExpr) {
                typeExprs.push(valueType);
            }
        }
        return typeExprs;
    }

    public containsArrayRef(): boolean {
        usesScratch.length = 0;
        this.getUses(usesScratch);
        for (const use of usesScratch) {
            if (use instanceof ArkArrayRef) {
                return true;
            }
        }
        if (this.getDef() instanceof ArkArrayRef) {
            return true;
        }
        return false;
    }

    public getArrayRef(): ArkArrayRef | undefined {
        usesScratch.length = 0;
        this.getUses(usesScratch);
        for (const use of usesScratch) {
            if (use instanceof ArkArrayRef) {
                return use as ArkArrayRef;
            }
        }

        if (this.getDef() instanceof ArkArrayRef) {
            return undefined;
        }

        return undefined;
    }

    public containsFieldRef(): boolean {
        usesScratch.length = 0;
        this.getUses(usesScratch);
        for (const use of usesScratch) {
            if (use instanceof AbstractFieldRef) {
                return true;
            }
        }

        if (this.getDef() instanceof AbstractFieldRef) {
            return true;
        }
        return false;
    }

    public getFieldRef(): AbstractFieldRef | undefined {
        usesScratch.length = 0;
        this.getUses(usesScratch);
        for (const use of usesScratch) {
            if (use instanceof AbstractFieldRef) {
                return use as AbstractFieldRef;
            }
        }
        if (this.getDef() instanceof AbstractFieldRef) {
            return undefined;
        }
        return undefined;
    }

    /**
     * @deprecated Since version 1.0.91. Use setOriginFullPosition() instead.
     * @param originPositionInfo - The LineColPosition to set.
     */
    public setOriginPositionInfo(originPositionInfo: LineColPosition): void {
        this.originFullPosition = new FullPosition(
            originPositionInfo.getLineNo(),
            originPositionInfo.getColNo(),
            originPositionInfo.getLineNo(),
            originPositionInfo.getColNo()
        );
    }

    /**
     * Returns the original position of the statement.
     * The position consists of two parts: line number and column number.
     * In the source file, the former (i.e., line number) indicates which line the statement is in,
     * and the latter (i.e., column number) indicates the position of the statement in the line.
     * The position is described as `LineColPosition(lineNo,colNum)` in ArkAnalyzer,
     * and its default value is LineColPosition(-1,-1).
     * @deprecated Since version 1.0.91. Use getOriginFullPosition() instead.
     * @returns The original location of the statement as LineColPosition.
     * @example
     * 1. Get the stmt position info to make some condition judgements.
     ```typescript
     for (const stmt of stmts) {
     if (stmt.getOriginFullPosition()?.getFirstLine() === -1) {
     stmt.setOriginFullPosition(originalStmt.getOriginFullPosition()!);
     this.stmtToOriginalStmt.set(stmt, originalStmt);
     }
     }
     ```
     */
    public getOriginPositionInfo(): LineColPosition {
        if (this.originFullPosition === undefined) {
            return LineColPosition.DEFAULT;
        }
        return new LineColPosition(this.originFullPosition.getFirstLine(), this.originFullPosition.getFirstCol());
    }

    /**
     * Sets the full position (start/end line/col) of this statement in the source file.
     * @param originFullPosition - The full position in the source code to set.
     */
    public setOriginFullPosition(originFullPosition: FullPosition): void {
        this.originFullPosition = originFullPosition;
    }

    /**
     * Returns the full position (start/end line/col) of this statement in the source file.
     * @returns The full position in the source code of this statement, or undefined if this statement
     *          is automatically generated during IR construction.
     */
    public getOriginFullPosition(): FullPosition | undefined {
        return this.originFullPosition;
    }

    abstract toString(): string;

    public setText(text: string): void {
        this.text = text;
    }

    /**
     * @deprecated Source text is now stored on ArkFile only. This method has no effect.
     * @param originalText - The source text (ignored).
     */
    public setOriginalText(originalText: string): void {}
    /**
     * Returns the source text of this statement extracted from the declaring ArkFile
     * using the statement's origin position. Implements lazy loading with caching.
     * @returns The source text, or undefined if the statement was automatically generated
     *          during IR construction or if the extraction fails.
     */
    public getOriginalText(): string | undefined {
        if (this.sourceCode !== undefined) {
            return this.sourceCode;
        }
        if (!this.originFullPosition) {
            return undefined;
        }
        const arkFile = this.cfg?.getDeclaringMethod()?.getDeclaringArkFile();
        const code = arkFile?.getSourceTextByFullPosition(this.originFullPosition);
        if (code !== undefined) {
            this.sourceCode = code;
        }
        return code;
    }

    /**
     * Returns the absolute full position of this statement's invoke.
     * Start is the callee identifier; end is the CallExpression span end (right of `)`),
     * same half-open convention as {@link getOriginFullPosition}.
     * The span is captured from the AST at IR construction.
     * @returns Absolute `FullPosition` of `methodName(...)`, or `FullPosition.DEFAULT` if not found.
     */
    public getInvokeFullPosition(): FullPosition {
        let invoke: AbstractInvokeExpr | undefined;
        if (this instanceof ArkInvokeStmt) {
            invoke = this.getInvokeExpr();
        } else if (this instanceof ArkAssignStmt && this.getRightOp() instanceof AbstractInvokeExpr) {
            invoke = this.getRightOp() as AbstractInvokeExpr;
        } else {
            return FullPosition.DEFAULT;
        }
        if (!invoke) {
            return FullPosition.DEFAULT;
        }
        return invoke.getInvokeFullPosition() ?? FullPosition.DEFAULT;
    }

    /**
     * Clears the cached source text, forcing re-extraction on next getOriginalText call.
     */
    public clearSourceCode(): void {
        this.sourceCode = undefined;
    }

    public setOperandOriginalPositions(operandOriginalPositions: FullPosition[]): void {
        const packed = new Array<number>(operandOriginalPositions.length * 2);
        for (let i = 0; i < operandOriginalPositions.length; i++) {
            const position = operandOriginalPositions[i];
            if (position === undefined || position === null) {
                packed[2 * i] = POSITION_HOLE;
                packed[2 * i + 1] = POSITION_HOLE;
            } else {
                packed[2 * i] = position.getFirstPacked();
                packed[2 * i + 1] = position.getLastPacked();
            }
        }
        this.operandPositionsPacked = packed;
    }

    public getOperandOriginalPositions(): FullPosition[] | undefined {
        const packed = this.operandPositionsPacked;
        if (packed === undefined) {
            return undefined;
        }
        const positions = new Array<FullPosition>(packed.length >> 1);
        for (let i = 0; i < positions.length; i++) {
            const first = packed[2 * i];
            positions[i] = first < 0 ? (undefined as unknown as FullPosition) : FullPosition.fromPacked(first, packed[2 * i + 1]);
        }
        return positions;
    }

    /** @internal Compact interleaved [first, last] storage; splice in pairs. */
    public getOperandPositionsPacked(): number[] | undefined {
        return this.operandPositionsPacked;
    }

    public getOperandOriginalPosition(indexOrOperand: number | Value): FullPosition | null {
        let index: number = -1;
        if (typeof indexOrOperand !== 'number') {
            index = IRUtils.findOperandIdx(this, indexOrOperand);
        } else {
            index = indexOrOperand;
        }

        const packed = this.operandPositionsPacked;
        if (!packed || index < 0 || index > packed.length >> 1) {
            return null;
        }
        if (index === packed.length >> 1) {
            return undefined as unknown as FullPosition;
        }
        const first = packed[2 * index];
        return first < 0 ? (undefined as unknown as FullPosition) : FullPosition.fromPacked(first, packed[2 * index + 1]);
    }
}

export class ArkAssignStmt extends Stmt {
    private leftOp: Value;
    private rightOp: Value;

    constructor(leftOp: Value, rightOp: Value) {
        super();
        this.leftOp = leftOp;
        this.rightOp = rightOp;
    }

    /**
     * Returns the left operand of the assigning statement.
     * @returns The left operand of the assigning statement.
     * @example
     * 1. If the statement is `a=b;`, the right operand is `a`; if the statement is `dd = cc + 5;`, the right operand
     *     is `cc`.
     */
    public getLeftOp(): Value {
        return this.leftOp;
    }

    public setLeftOp(newLeftOp: Value): void {
        this.leftOp = newLeftOp;
    }

    /**
     * Returns the right operand of the assigning statement.
     * @returns The right operand of the assigning statement.
     * @example
     * 1. If the statement is `a=b;`, the right operand is `b`; if the statement is `dd = cc + 5;`, the right operand
     *     is `cc + 5`.
     * 2. Get the rightOp from stmt.
     ```typescript
     const rightOp = stmt.getRightOp();
     ```
     */
    public getRightOp(): Value {
        return this.rightOp;
    }

    public setRightOp(rightOp: Value): void {
        this.rightOp = rightOp;
    }

    public toString(): string {
        const str = this.getLeftOp() + ' = ' + this.getRightOp();
        return str;
    }

    public getDef(): Value | null {
        return this.leftOp;
    }

    public getUses(acc: Value[] = []): Value[] {
        this.leftOp.getUses(acc);
        acc.push(this.rightOp);
        this.rightOp.getUses(acc);
        return acc;
    }
}

export class ArkInvokeStmt extends Stmt {
    private invokeExpr: AbstractInvokeExpr;

    constructor(invokeExpr: AbstractInvokeExpr) {
        super();
        this.invokeExpr = invokeExpr;
    }

    public replaceInvokeExpr(newExpr: AbstractInvokeExpr): void {
        this.invokeExpr = newExpr;
    }

    public getInvokeExpr(): AbstractInvokeExpr {
        return this.invokeExpr;
    }

    public toString(): string {
        const str = this.invokeExpr.toString();
        return str;
    }

    public getUses(acc: Value[] = []): Value[] {
        acc.push(this.invokeExpr);
        this.invokeExpr.getUses(acc);
        return acc;
    }
}

export class ArkIfStmt extends Stmt {
    private conditionExpr: ArkConditionExpr;

    constructor(conditionExpr: ArkConditionExpr) {
        super();
        this.conditionExpr = conditionExpr;
    }

    /**
     * The condition expression consisit of two values as operands and one binary operator as operator.
     * The operator can indicate the relation between the two values, e.g., `<`, `<=`,`>`, `>=`, `==`, `!=`, `===`,
     * `!==`.
     * @returns a condition expression.
     * @example
     * 1. When a statement is `if (a > b)`, the operands are `a` and `b`, the operator is `<`. Therefore, the condition
     *     expression is `a > b`.
     * 2. get a conditon expr from a condition statement.
     ```typescript
     let expr = (this.original as ArkIfStmt).getConditionExpr();
     ```
     */
    public getConditionExpr(): ArkConditionExpr {
        return this.conditionExpr;
    }

    public setConditionExpr(newConditionExpr: ArkConditionExpr): void {
        this.conditionExpr = newConditionExpr;
    }

    public isBranch(): boolean {
        return true;
    }

    public getExpectedSuccessorCount(): number {
        return 2;
    }

    public toString(): string {
        const str = 'if ' + this.conditionExpr;
        return str;
    }

    public getUses(acc: Value[] = []): Value[] {
        acc.push(this.conditionExpr);
        this.conditionExpr.getUses(acc);
        return acc;
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

    public getOp(): Value {
        return this.op;
    }

    public setReturnValue(returnValue: Value): void {
        this.op = returnValue;
    }

    public toString(): string {
        const str = 'return ' + this.op;
        return str;
    }

    public getUses(acc: Value[] = []): Value[] {
        acc.push(this.op);
        this.op.getUses(acc);
        return acc;
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
        return str;
    }
}

export class ArkThrowStmt extends Stmt {
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

    public toString(): string {
        const str = 'throw ' + this.op;
        return str;
    }

    public getUses(acc: Value[] = []): Value[] {
        acc.push(this.op);
        this.op.getUses(acc);
        return acc;
    }
}

/**
 * Statement of type alias definition combines with the left hand as {@link AliasType} and right hand as {@link AliasTypeExpr}.
 * @category core/base/stmt
 * @extends Stmt
 * @example
 ```typescript
 type A = string;
 type B = import('./abc').TypeB;

 let c = 123;
 declare type C = typeof c;
 ```
 */
export class ArkAliasTypeDefineStmt extends Stmt {
    private aliasType: AliasType;
    private aliasTypeExpr: AliasTypeExpr;

    constructor(aliasType: AliasType, typeAliasExpr: AliasTypeExpr) {
        super();
        this.aliasType = aliasType;
        this.aliasTypeExpr = typeAliasExpr;
    }

    public getAliasType(): AliasType {
        return this.aliasType;
    }

    public getAliasTypeExpr(): AliasTypeExpr {
        return this.aliasTypeExpr;
    }

    public getAliasName(): string {
        return this.getAliasType().getName();
    }

    public toString(): string {
        let str = `type ${this.getAliasType().toString()} = ${this.getAliasTypeExpr().toString()}`;
        if (this.getAliasType().containsModifier(ModifierType.DECLARE)) {
            str = 'declare ' + str;
        }
        if (this.getAliasType().containsModifier(ModifierType.EXPORT)) {
            str = 'export ' + str;
        }
        return str;
    }

    public getUses(acc: Value[] = []): Value[] {
        for (const e of this.getTypeExprs()) {
            e.getUses(acc);
        }
        acc.push(this.aliasTypeExpr);
        return acc;
    }

    public getTypeExprs(): AbstractTypeExpr[] {
        function getTypeExprsInType(originalObject: Type): AbstractTypeExpr[] {
            let typeExprs: AbstractTypeExpr[] = [];
            if (originalObject instanceof AbstractTypeExpr) {
                typeExprs.push(originalObject);
            } else if (originalObject instanceof ArrayType) {
                typeExprs.push(...getTypeExprsInType(originalObject.getBaseType()));
            } else if (originalObject instanceof UnionType || originalObject instanceof IntersectionType || originalObject instanceof TupleType) {
                for (const member of originalObject.getTypes()) {
                    typeExprs.push(...getTypeExprsInType(member));
                }
            }
            return typeExprs;
        }

        const originalObject = this.getAliasTypeExpr().getOriginalObject();
        if (originalObject instanceof Type) {
            return getTypeExprsInType(originalObject);
        }
        return [];
    }
}
