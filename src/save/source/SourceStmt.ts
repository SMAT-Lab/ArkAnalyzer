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

import { Constant } from '../../core/base/Constant';
import {
    ArkInstanceInvokeExpr,
    ArkNewArrayExpr,
    ArkNewExpr,
    ArkStaticInvokeExpr,
    NormalBinaryOperator
} from '../../core/base/Expr';
import { Local } from '../../core/base/Local';
import {
    ArkArrayRef,
    ArkInstanceFieldRef,
    ArkParameterRef,
    ArkStaticFieldRef,
    ClosureFieldRef
} from '../../core/base/Ref';
import {
    ArkAliasTypeDefineStmt,
    ArkAssignStmt,
    ArkIfStmt,
    ArkInvokeStmt,
    ArkReturnStmt,
    ArkReturnVoidStmt,
    ArkThrowStmt,
    Stmt
} from '../../core/base/Stmt';
import { AliasType, ClassType, Type } from '../../core/base/Type';
import { Value } from '../../core/base/Value';
import { BasicBlock } from '../../core/graph/BasicBlock';
import Logger, { LOG_MODULE_TYPE } from '../../utils/logger';
import { ArkCodeBuffer } from '../ArkStream';
import { StmtReader } from './SourceBody';
import { SourceTransformer, TransformerContext } from './SourceTransformer';
import { CLASS_CATEGORY_COMPONENT, PrinterUtils } from '../base/PrinterUtils';
import { ValueUtil } from '../../core/common/ValueUtil';
import { ArkClass, ClassCategory } from '../../core/model/ArkClass';
import { modifiers2stringArray } from '../../core/model/ArkBaseModel';
import { ArkMetadataKind, CommentsMetadata } from '../../core/model/ArkMetadata';
import { ImportInfo } from '../../core/model/ArkImport';
import { ArkMethod } from '../../core/model/ArkMethod';
import { Dump } from '../base/BasePrinter';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'SourceStmt');
const IGNOR_TYPES = new Set<string>(['any', 'Map', 'Set']);

export interface StmtPrinterContext extends TransformerContext {
    getStmtReader(): StmtReader;

    setTempCode(temp: string, code: string): void;

    hasTempVisit(temp: string): boolean;

    setTempVisit(temp: string): void;

    setSkipStmt(stmt: Stmt): void;

    getLocals(): Map<string, Local>;

    defineLocal(local: Local): void;

    isLocalDefined(local: Local): boolean;

    isInDefaultMethod(): boolean;
}

export abstract class SourceStmt implements Dump {
    original: Stmt;
    context: StmtPrinterContext;
    line: number;
    text: string = '';
    transformer: SourceTransformer;

    constructor(context: StmtPrinterContext, original: Stmt) {
        this.original = original;
        this.context = context;
        this.line = original.getOriginPositionInfo().getLineNo();
        this.transformer = new SourceTransformer(context);
    }

    public getLine(): number {
        return this.line;
    }

    public setLine(line: number): void {
        this.line = line;
    }

    public dump(): string {
        this.beforeDump();
        let code = this.dumpTs();
        this.afterDump();
        return code;
    }

    protected beforeDump(): void {}

    protected afterDump(): void {}

    protected dumpTs(): string {
        let content: string[] = [];
        const commentsMetadata = this.original.getMetadata(ArkMetadataKind.LEADING_COMMENTS);
        if (commentsMetadata instanceof CommentsMetadata) {
            const comments = commentsMetadata.getComments();
            comments.forEach(comment => {
                content.push(`${this.printer.getIndent()}${comment.content}\n`);
            });
        }
        if (this.text.length > 0) {
            content.push(`${this.printer.getIndent()}${this.text}\n`);
        }
        return content.join('');
    }

    protected get printer(): ArkCodeBuffer {
        return this.context.getPrinter();
    }

    public toString(): string {
        return this.text;
    }

    protected setText(text: string): void {
        this.text = text;
    }

    protected getIntent(): string {
        return this.context.getPrinter().getIndent();
    }

    public abstract transfer2ts(): void;

    protected isLocalTempValue(value: Value): boolean {
        if (!(value instanceof Local)) {
            return false;
        }

        return PrinterUtils.isTemp(value.getName());
    }
}

enum AssignStmtDumpType {
    NORMAL,
    TEMP_REPLACE,
    COMPONENT_CREATE,
    PARAM_REPLACE,
}

export class SourceAssignStmt extends SourceStmt {
    private leftOp: Value = ValueUtil.getUndefinedConst();
    private rightOp: Value = ValueUtil.getUndefinedConst();
    private leftCode: string = '';
    private rightCode: string = '';
    private dumpType?: AssignStmtDumpType;
    private leftTypeCode: string;

    constructor(context: StmtPrinterContext, original: ArkAssignStmt) {
        super(context, original);
        this.leftTypeCode = '';
    }

    public transfer2ts(): void {
        this.leftOp = (this.original as ArkAssignStmt).getLeftOp();
        this.rightOp = (this.original as ArkAssignStmt).getRightOp();

        if (this.rightOp instanceof ArkParameterRef) {
            this.setText('');
            this.dumpType = AssignStmtDumpType.PARAM_REPLACE;
            return;
        }

        if (
            (this.leftOp instanceof Local && this.leftOp.getName() === 'this') ||
            (this.rightOp instanceof Constant && this.rightOp.getValue() === 'undefined') ||
            this.rightOp instanceof ClosureFieldRef
        ) {
            this.setText('');
            this.dumpType = AssignStmtDumpType.NORMAL;
            return;
        }

        this.leftCode = this.transformer.valueToString(this.leftOp, true);

        if (this.leftOp instanceof Local && this.rightOp instanceof ArkNewExpr) {
            this.transferRightNewExpr();
        } else if (this.leftOp instanceof Local && this.rightOp instanceof ArkNewArrayExpr) {
            this.transferRightNewArrayExpr();
        } else if (this.rightOp instanceof ArkStaticInvokeExpr && PrinterUtils.isComponentCreate(this.rightOp)) {
            this.transferRightComponentCreate();
        } else if (this.rightOp instanceof ArkInstanceInvokeExpr && PrinterUtils.isConstructorInvoke(this.rightOp)) {
            this.transferConstructorInvokeExpr(this.rightOp);
        } else if (this.rightOp instanceof ArkInstanceInvokeExpr && PrinterUtils.isComponentAttributeInvoke(this.rightOp)) {
            this.transferRightComponentAttribute();
        } else {
            this.rightCode = this.transformer.valueToString(this.rightOp);
        }

        if (this.isLocalTempValue(this.leftOp)) {
            this.context.setTempCode((this.leftOp as Local).getName(), this.rightCode);
        }

        if ((this.leftOp instanceof ArkInstanceFieldRef && this.leftOp.getBase().getName() === 'this') || this.leftOp instanceof ArkStaticFieldRef) {
            this.context.setTempCode(this.leftOp.getFieldName(), this.rightCode);
        }

        if (this.dumpType === undefined) {
            this.setText(`${this.leftCode} = ${this.rightCode}`);
            this.dumpType = AssignStmtDumpType.TEMP_REPLACE;
        }

        let leftOpType = this.leftOp.getType();
        if (leftOpType instanceof ClassType) {
            let name = leftOpType.getClassSignature().getClassName();
            if (PrinterUtils.isAnonymousClass(name)) {
                this.leftTypeCode = 'any';
            } else {
                this.leftTypeCode = name;
            }
        } else {
            this.leftTypeCode = this.transformer.typeToString(leftOpType);
        }
        if (IGNOR_TYPES.has(this.leftTypeCode)) {
            this.leftTypeCode = '';
        }
    }

    protected beforeDump(): void {
        if (this.dumpType === AssignStmtDumpType.PARAM_REPLACE && this.leftOp instanceof Local) {
            this.context.defineLocal(this.leftOp);
        }

        if (this.dumpType !== AssignStmtDumpType.TEMP_REPLACE) {
            return;
        }

        if (this.context.hasTempVisit(this.leftCode)) {
            this.setText('');
            return;
        } else if (PrinterUtils.isTemp(this.leftCode)) {
            this.setText(`${this.rightCode};`);
            return;
        }
        if (this.leftOp instanceof Local && this.context.getLocals().has(this.leftOp.getName()) && !this.isLocalTempValue(this.leftOp)) {
            if (this.context.isLocalDefined(this.leftOp)) {
                this.setText(`${this.leftCode} = ${this.rightCode};`);
                return;
            }
            let flag = this.leftOp.getConstFlag() ? 'const' : 'let';
            if (this.context.getArkFile().getExportInfoBy(this.leftCode) && this.context.isInDefaultMethod()) {
                this.setText(`export ${flag} ${this.leftCode} = ${this.rightCode};`);
            } else {
                if (this.leftTypeCode.length > 0) {
                    this.setText(`${flag} ${this.leftCode}: ${this.leftTypeCode} = ${this.rightCode};`);
                } else {
                    this.setText(`${flag} ${this.leftCode} = ${this.rightCode};`);
                }
            }
            this.context.defineLocal(this.leftOp);
        } else {
            this.setText(`${this.leftCode} = ${this.rightCode};`);
        }
    }

    protected afterDump(): void {
        if (this.dumpType === AssignStmtDumpType.COMPONENT_CREATE) {
            this.printer.incIndent();
        }
    }

    private getClassOriginType(type: Type): number | undefined {
        if (!(type instanceof ClassType)) {
            return undefined;
        }

        let signature = type.getClassSignature();
        let cls = this.context.getClass(signature);
        if (!cls) {
            return undefined;
        }
        return PrinterUtils.getOriginType(cls);
    }

    /**
     * temp1 = new Person
     * temp1.constructor(10)
     */
    private transferRightNewExpr(): void {
        let originType = this.getClassOriginType(this.rightOp.getType());
        if (this.context.getStmtReader().hasNext()) {
            let stmt = this.context.getStmtReader().next();
            let rollback = true;
            if (stmt instanceof ArkAssignStmt && stmt.getRightOp() instanceof ArkInstanceInvokeExpr) {
                let instanceInvokeExpr = stmt.getRightOp() as ArkInstanceInvokeExpr;
                if (
                    'constructor' === instanceInvokeExpr.getMethodSignature().getMethodSubSignature().getMethodName() &&
                    instanceInvokeExpr.getBase().getName() === (this.leftOp as Local).getName()
                ) {
                    this.handleConstructorInvoke(instanceInvokeExpr, originType);
                    return;
                }
            }
            if (rollback) {
                this.context.getStmtReader().rollback();
            }
        }

        if (originType === CLASS_CATEGORY_COMPONENT) {
            this.rightCode = `${this.transformer.typeToString(this.rightOp.getType())}()`;
        } else if (originType === ClassCategory.TYPE_LITERAL || originType === ClassCategory.OBJECT) {
            this.rightCode = `${this.transformer.typeToString(this.rightOp.getType())}`;
        } else {
            this.rightCode = `new ${this.transformer.typeToString(this.rightOp.getType())}()`;
        }
    }

    private handleConstructorInvoke(instanceInvokeExpr: ArkInstanceInvokeExpr, originType?: number): void {
        let args: string[] = [];
        instanceInvokeExpr.getArgs().forEach(v => {
            args.push(this.transformer.valueToString(v));
        });

        if (originType === CLASS_CATEGORY_COMPONENT) {
            this.rightCode = `${this.transformer.typeToString(this.rightOp.getType())}(${args.join(', ')})`;
        } else if (originType === ClassCategory.TYPE_LITERAL || originType === ClassCategory.OBJECT) {
            this.rightCode = `${this.transformer.literalObjectToString(this.rightOp.getType() as ClassType)}`;
        } else {
            this.rightCode = `new ${this.transformer.typeToString(this.rightOp.getType())}(${args.join(', ')})`;
        }
    }

    private transferConstructorInvokeExpr(expr: ArkInstanceInvokeExpr): void {
        let rightCode = this.transformer.valueToString(this.rightOp);
        const pattern = /\([^)]*\)\.constructor/;
        this.rightCode = rightCode.replace(pattern, '');
        this.dumpType = AssignStmtDumpType.NORMAL;
    }

    /**
     * $temp0 = newarray[4]
     * $temp0[0] = 1
     * $temp0[1] = 2
     * $temp0[2] = 3
     */
    private transferRightNewArrayExpr(): void {
        let arrayExpr = new SourceNewArrayExpr(this.rightOp as ArkNewArrayExpr);
        let localName = (this.leftOp as Local).getName();
        while (this.context.getStmtReader().hasNext()) {
            let stmt = this.context.getStmtReader().next();
            if (stmt instanceof ArkAssignStmt) {
                let left = stmt.getLeftOp();
                if (left instanceof ArkArrayRef && left.getBase().getName() === localName) {
                    arrayExpr.addInitValue(this.transformer.valueToString(stmt.getRightOp()));
                } else {
                    this.context.getStmtReader().rollback();
                    break;
                }
            } else {
                this.context.getStmtReader().rollback();
                break;
            }
        }
        this.rightCode = arrayExpr.toString();
    }

    private transferRightComponentCreate(): void {
        this.rightCode = this.transformer.valueToString(this.rightOp);
        if (this.context.getStmtReader().hasNext()) {
            let stmt = this.context.getStmtReader().next();
            if (stmt instanceof ArkInvokeStmt) {
                let expr = stmt.getInvokeExpr();
                if (expr instanceof ArkStaticInvokeExpr && PrinterUtils.isComponentPop(expr)) {
                    this.setText(`${this.rightCode}`);
                    this.dumpType = AssignStmtDumpType.NORMAL;
                    return;
                }
            }

            this.context.getStmtReader().rollback();
        }
        this.setText(`${this.rightCode} {`);
        this.dumpType = AssignStmtDumpType.COMPONENT_CREATE;
    }

    private transferRightComponentAttribute(): void {
        this.rightCode = this.transformer.valueToString(this.rightOp);
        this.setText(`${this.rightCode}`);
        this.dumpType = AssignStmtDumpType.NORMAL;
    }
}

export class SourceInvokeStmt extends SourceStmt {
    constructor(context: StmtPrinterContext, original: ArkInvokeStmt) {
        super(context, original);
    }

    public transfer2ts(): void {
        let invokeExpr = this.original.getInvokeExpr();
        let code = '';
        let isAttr = false;
        if (invokeExpr instanceof ArkStaticInvokeExpr) {
            if (PrinterUtils.isComponentPop(invokeExpr)) {
                code = '}';
                isAttr = true;
            } else {
                code = this.transformer.staticInvokeExprToString(invokeExpr);
                isAttr = PrinterUtils.isComponentIfElseInvoke(invokeExpr);
            }
        } else if (invokeExpr instanceof ArkInstanceInvokeExpr) {
            isAttr = PrinterUtils.isComponentAttributeInvoke(invokeExpr);
            code = this.transformer.instanceInvokeExprToString(invokeExpr, isAttr);
        }

        if (code.length > 0 && !isAttr) {
            this.setText(`${code};`);
        } else {
            this.setText(`${code}`);
        }
    }

    protected beforeDump(): void {
        let invokeExpr = this.original.getInvokeExpr();
        if (
            (invokeExpr instanceof ArkStaticInvokeExpr && PrinterUtils.isComponentPop(invokeExpr)) ||
            (invokeExpr instanceof ArkStaticInvokeExpr && PrinterUtils.isComponentIfElseInvoke(invokeExpr))
        ) {
            this.printer.decIndent();
            return;
        }
    }

    protected afterDump(): void {
        let invokeExpr = this.original.getInvokeExpr();
        if (invokeExpr instanceof ArkStaticInvokeExpr && PrinterUtils.isComponentIfElseInvoke(invokeExpr)) {
            this.printer.incIndent();
            return;
        }
    }
}

export class SourceIfStmt extends SourceStmt {
    constructor(context: StmtPrinterContext, original: ArkIfStmt) {
        super(context, original);
    }

    public transfer2ts(): void {
        let code: string;
        let expr = (this.original as ArkIfStmt).getConditionExpr();
        code = `if (${this.transformer.valueToString(expr.getOp1())}`;
        code += ` ${expr.getOperator()} `;
        code += `${this.transformer.valueToString(expr.getOp2())}) {`;
        this.setText(code);
    }

    protected afterDump(): void {
        this.printer.incIndent();
    }
}

export class SourceWhileStmt extends SourceStmt {
    block: BasicBlock;

    constructor(context: StmtPrinterContext, original: ArkIfStmt, block: BasicBlock) {
        super(context, original);
        this.block = block;
    }

    protected afterDump(): void {
        this.printer.incIndent();
    }

    /**
     * $temp2 = $temp1.next()
     * $temp3 = $temp2.done()
     * if $temp3 === true
     *  $temp4 = $temp2.value
     *  $temp5 = <> cast
     * @returns
     */
    private forOf2ts(): boolean {
        let expr = (this.original as ArkIfStmt).getConditionExpr();
        let temp3 = expr.getOp1();
        let op2 = expr.getOp2();
        let firstStmt = this.context.getStmtReader().first();
        if (!(firstStmt instanceof ArkAssignStmt)) {
            return false;
        }

        if (!(this.isLocalTempValue(temp3) && op2 instanceof Constant && (op2 as Constant).getValue() === 'true')) {
            return false;
        }

        let stmt = (temp3 as Local).getDeclaringStmt();
        if (!(stmt instanceof ArkAssignStmt)) {
            return false;
        }

        let done = stmt.getRightOp();
        if (!(done instanceof ArkInstanceFieldRef)) {
            return false;
        }

        if (done.getFieldSignature().toString() !== '@ES2015/BuiltinClass: IteratorResult.done') {
            return false;
        }

        let temp2 = done.getBase();
        stmt = temp2.getDeclaringStmt();
        if (!(stmt instanceof ArkAssignStmt)) {
            return false;
        }

        let next = stmt.getRightOp();
        if (!(next instanceof ArkInstanceInvokeExpr)) {
            return false;
        }

        if (next.getMethodSignature().getMethodSubSignature().getMethodName() !== 'next') {
            return false;
        }

        let temp1 = next.getBase();
        stmt = temp1.getDeclaringStmt();
        if (!(stmt instanceof ArkAssignStmt)) {
            return false;
        }

        let iterator = stmt.getRightOp();
        if (!(iterator instanceof ArkInstanceInvokeExpr)) {
            return false;
        }

        if (iterator.getMethodSignature().getMethodSubSignature().getMethodName() !== 'Symbol.iterator') {
            return false;
        }

        return this.getForOf2ts(temp3 as Local, temp1, iterator);
    }

    private getForOf2ts(temp3: Local, temp1: Local, iterator: ArkInstanceInvokeExpr): boolean {
        let successors = this.block.getSuccessors();
        if (successors.length !== 2) {
            return false;
        }

        let stmts = successors[0].getStmts();
        if (stmts.length < 2) {
            return false;
        }

        let stmt = stmts[1];
        if (!(stmt instanceof ArkAssignStmt)) {
            return false;
        }

        this.context.setSkipStmt(stmts[0]);
        this.context.setSkipStmt(stmts[1]);

        while (this.context.getStmtReader().hasNext()) {
            this.context.getStmtReader().next();
        }

        let v = stmt.getLeftOp() as Local;
        let valueName = v.getName();
        if (!this.isLocalTempValue(v)) {
            this.setText(`for (let ${valueName} of ${this.transformer.valueToString(iterator.getBase())}) {`);
            this.context.setTempVisit((temp1 as Local).getName());
            this.context.setTempVisit((temp3 as Local).getName());
            return true;
        }

        // iterate map 'for (let [key, value] of map)'
        let stmtReader = new StmtReader(stmts);
        stmtReader.next();
        stmtReader.next();

        let arrayValueNames = [];
        while (stmtReader.hasNext()) {
            stmt = stmtReader.next();
            if (!(stmt instanceof ArkAssignStmt)) {
                break;
            }
            let ref = stmt.getRightOp();
            if (!(ref instanceof ArkArrayRef)) {
                break;
            }
            if (ref.getBase().getName() !== valueName) {
                break;
            }
            let name = (stmt.getLeftOp() as Local).getName();
            arrayValueNames.push(name);
            this.context.setTempVisit(name);
        }

        this.setText(`for (let [${arrayValueNames.join(', ')}] of ${this.transformer.valueToString(iterator.getBase())}) {`);
        this.context.setTempVisit((temp3 as Local).getName());

        return true;
    }

    public transfer2ts(): void {
        if (this.forOf2ts()) {
            return;
        }
        let code: string;
        let expr = (this.original as ArkIfStmt).getConditionExpr();
        code = `while (${this.valueToString(expr.getOp1())}`;
        code += ` ${expr.getOperator().trim()} `;
        code += `${this.valueToString(expr.getOp2())}) {`;
        this.setText(code);
    }

    protected valueToString(value: Value): string {
        if (!(value instanceof Local)) {
            return this.transformer.valueToString(value);
        }

        for (const stmt of this.block.getStmts()) {
            if (!(stmt instanceof ArkAssignStmt)) {
                continue;
            }
            if (PrinterUtils.isDeIncrementStmt(stmt, NormalBinaryOperator.Addition) && (stmt.getLeftOp() as Local).getName() === value.getName()) {
                this.context.setSkipStmt(stmt);
                return `${value.getName()}++`;
            }

            if (PrinterUtils.isDeIncrementStmt(stmt, NormalBinaryOperator.Subtraction) && (stmt.getLeftOp() as Local).getName() === value.getName()) {
                this.context.setSkipStmt(stmt);
                return `${value.getName()}--`;
            }
        }

        return this.transformer.valueToString(value);
    }
}

export class SourceForStmt extends SourceWhileStmt {
    incBlock: BasicBlock;

    constructor(context: StmtPrinterContext, original: ArkIfStmt, block: BasicBlock, incBlock: BasicBlock) {
        super(context, original, block);
        this.incBlock = incBlock;
    }

    public transfer2ts(): void {
        let code: string;
        let expr = (this.original as ArkIfStmt).getConditionExpr();
        code = `for (; ${this.transformer.valueToString(expr.getOp1())}`;
        code += ` ${expr.getOperator().trim()} `;
        code += `${this.transformer.valueToString(expr.getOp2())}; `;

        let stmtReader = new StmtReader(this.incBlock.getStmts());
        while (stmtReader.hasNext()) {
            let sourceStmt = stmt2SourceStmt(this.context, stmtReader.next());
            sourceStmt.transfer2ts();
            code += sourceStmt.toString();
            if (stmtReader.hasNext()) {
                code += ', ';
            }
        }
        code += `) {`;
        this.setText(code);
    }
}

export class SourceDoStmt extends SourceStmt {
    constructor(context: StmtPrinterContext, stmt: Stmt) {
        super(context, stmt);
    }

    public transfer2ts(): void {
        this.setText('do {');
    }

    protected afterDump(): void {
        this.printer.incIndent();
    }
}

export class SourceDoWhileStmt extends SourceWhileStmt {
    constructor(context: StmtPrinterContext, stmt: ArkIfStmt, block: BasicBlock) {
        super(context, stmt, block);
    }

    public transfer2ts(): void {
        let code: string;
        let expr = (this.original as ArkIfStmt).getConditionExpr();
        code = `} while (${this.valueToString(expr.getOp1())}`;
        code += ` ${expr.getOperator().trim()} `;
        code += `${this.valueToString(expr.getOp2())})`;
        this.setText(code);
    }

    protected beforeDump(): void {
        this.printer.decIndent();
    }

    protected afterDump(): void {}
}

export class SourceElseStmt extends SourceStmt {
    constructor(context: StmtPrinterContext, original: Stmt) {
        super(context, original);
    }

    public transfer2ts(): void {
        this.setText('} else {');
    }

    protected beforeDump(): void {
        this.printer.decIndent();
    }

    protected afterDump(): void {
        this.printer.incIndent();
    }
}

export class SourceContinueStmt extends SourceStmt {
    constructor(context: StmtPrinterContext, original: Stmt) {
        super(context, original);
    }

    // trans 2 break or continue
    public transfer2ts(): void {
        this.setText('continue;');
    }
}

export class SourceBreakStmt extends SourceStmt {
    constructor(context: StmtPrinterContext, original: Stmt) {
        super(context, original);
    }

    // trans 2 break or continue
    public transfer2ts(): void {
        this.setText('break;');
    }
}

export class SourceReturnStmt extends SourceStmt {
    constructor(context: StmtPrinterContext, original: ArkReturnStmt) {
        super(context, original);
    }

    public transfer2ts(): void {
        this.setText(`return ${this.transformer.valueToString((this.original as ArkReturnStmt).getOp())};`);
    }
}

export class SourceReturnVoidStmt extends SourceStmt {
    constructor(context: StmtPrinterContext, original: ArkReturnVoidStmt) {
        super(context, original);
    }

    public transfer2ts(): void {
        if (this.original.getOriginPositionInfo().getLineNo() <= 0) {
            this.setText('');
        } else {
            this.setText('return;');
        }
    }
}

export class SourceCompoundEndStmt extends SourceStmt {
    constructor(context: StmtPrinterContext, stmt: Stmt, text: string) {
        super(context, stmt);
        this.setText(text);
    }

    public transfer2ts(): void {}

    protected beforeDump(): void {
        this.printer.decIndent();
    }
}

export class SourceCommonStmt extends SourceStmt {
    constructor(context: StmtPrinterContext, stmt: Stmt) {
        super(context, stmt);
    }

    public transfer2ts(): void {
        this.setText(this.original.toString());
    }
}

export class SourceThrowStmt extends SourceStmt {
    constructor(context: StmtPrinterContext, original: ArkThrowStmt) {
        super(context, original);
    }

    public transfer2ts(): void {
        this.setText(`throw ${this.transformer.valueToString((this.original as ArkThrowStmt).getOp())};`);
    }
}

export class SourceTypeAliasStmt extends SourceStmt {
    aliasType: AliasType;
    constructor(context: StmtPrinterContext, original: Stmt, aliasType: AliasType) {
        super(context, original);
        this.aliasType = aliasType;
    }

    public transfer2ts(): void {
        let modifiersArray: string[] = modifiers2stringArray(this.aliasType.getModifiers());
        let modifier = modifiersArray.length > 0 ? `${modifiersArray.join(' ')} ` : '';

        const expr = (this.original as ArkAliasTypeDefineStmt).getAliasTypeExpr();
        let typeOf = expr.getTransferWithTypeOf() ? 'typeof ' : '';
        let realGenericTypes = expr.getRealGenericTypes() ? `<${expr.getRealGenericTypes()!.join(', ')}>` : '';
        let genericTypes = this.aliasType.getGenericTypes() ? `<${this.transformer.typeArrayToString(this.aliasType.getGenericTypes()!)}>` : '';

        let typeObject = expr.getOriginalObject();
        if (typeObject instanceof Type) {
            if (typeObject instanceof AliasType) {
                this.setText(`${modifier}type ${this.aliasType.getName()}${genericTypes} = ${typeOf}${typeObject.getName()}${realGenericTypes};`);
            } else {
                this.setText(
                    `${modifier}type ${this.aliasType.getName()}${genericTypes} = ${typeOf}${this.transformer.typeToString(typeObject)}${realGenericTypes};`
                );
            }
            return;
        }
        if (typeObject instanceof ImportInfo) {
            let exprStr = `import('${typeObject.getFrom()}')`;
            if (typeObject.getImportClauseName() !== '') {
                exprStr = `${exprStr}.${typeObject.getImportClauseName()}`;
            }
            this.setText(`${modifier}type ${this.aliasType.getName()}${genericTypes} = ${typeOf}${exprStr}${realGenericTypes};`);
            return;
        }
        if (typeObject instanceof Local) {
            this.setText(
                `${modifier}type ${this.aliasType.getName()}${genericTypes} = ${typeOf}${this.transformer.valueToString(typeObject)}${realGenericTypes};`
            );
            return;
        }
        if (typeObject instanceof ArkClass) {
            let classTS = this.generateClassTS(typeObject);
            this.setText(`${modifier}type ${this.aliasType.getName()}${genericTypes} = ${typeOf}${classTS}${realGenericTypes};`);
            return;
        }
        if (typeObject instanceof ArkMethod) {
            this.setText(`${modifier}type ${this.aliasType.getName()}${genericTypes} = ${typeOf}${typeObject.getName()}${realGenericTypes};`);
            return;
        }
        this.setText(`${modifier}type ${this.aliasType.getName()}${genericTypes} = ${typeOf}${typeObject.getName()}${realGenericTypes};`);
    }

    private generateClassTS(arkClass: ArkClass): string {
        let res = '';
        let classType = new ClassType(arkClass.getSignature());
        if (arkClass.getCategory() === ClassCategory.TYPE_LITERAL || arkClass.getCategory() === ClassCategory.OBJECT) {
            res = this.transformer.literalObjectToString(classType);
        } else {
            res = this.transformer.typeToString(classType);
        }
        return res;
    }
}

export class SourceTryStmt extends SourceStmt {
    constructor(context: StmtPrinterContext, stmt: Stmt) {
        super(context, stmt);
    }

    public transfer2ts(): void {
        this.setText('try {');
    }

    protected afterDump(): void {
        this.printer.incIndent();
    }
}

export class SourceCatchStmt extends SourceStmt {
    block: BasicBlock | undefined;
    constructor(context: StmtPrinterContext, stmt: Stmt, block?: BasicBlock) {
        super(context, stmt);
        this.block = block;
    }

    public transfer2ts(): void {
        if (this.block) {
            let stmt = this.block!.getHead()!;
            if (stmt instanceof ArkAssignStmt) {
                if (stmt.getLeftOp() instanceof Local) {
                    let name = (stmt.getLeftOp() as Local).getName();
                    this.setText(`} catch (${name}) {`);
                    this.context.setSkipStmt(stmt);
                    return;
                }
            }
        }
        this.setText('} catch (e) {');
    }

    protected beforeDump(): void {
        this.printer.decIndent();
    }

    protected afterDump(): void {
        this.printer.incIndent();
    }
}

export class SourceFinallyStmt extends SourceStmt {
    constructor(context: StmtPrinterContext, stmt: Stmt) {
        super(context, stmt);
    }

    public transfer2ts(): void {
        this.setText('} finally {');
    }

    protected beforeDump(): void {
        this.printer.decIndent();
    }

    protected afterDump(): void {
        this.printer.incIndent();
    }
}

export class SourceNewArrayExpr {
    expr: ArkNewArrayExpr;
    values: string[];

    constructor(expr: ArkNewArrayExpr) {
        this.expr = expr;
        this.values = [];
    }

    public addInitValue(value: string): void {
        this.values.push(value);
    }

    public toString(): string {
        return `[${this.values.join(', ')}]`;
    }
}

export function stmt2SourceStmt(context: StmtPrinterContext, stmt: Stmt): SourceStmt {
    if (stmt instanceof ArkAssignStmt) {
        return new SourceAssignStmt(context, stmt);
    }
    if (stmt instanceof ArkInvokeStmt) {
        return new SourceInvokeStmt(context, stmt);
    }
    if (stmt instanceof ArkReturnVoidStmt) {
        return new SourceReturnVoidStmt(context, stmt);
    }
    if (stmt instanceof ArkReturnStmt) {
        return new SourceReturnStmt(context, stmt);
    }
    if (stmt instanceof ArkThrowStmt) {
        return new SourceThrowStmt(context, stmt);
    }
    if (stmt instanceof ArkAliasTypeDefineStmt) {
        return new SourceTypeAliasStmt(context, stmt, stmt.getAliasType());
    }
    logger.info(`stmt2SourceStmt ${stmt.constructor} not support.`);
    return new SourceCommonStmt(context, stmt);
}
