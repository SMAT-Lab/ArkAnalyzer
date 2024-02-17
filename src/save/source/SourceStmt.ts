import { Constant } from "../../core/base/Constant";
import { ArkBinopExpr, ArkInstanceInvokeExpr, ArkLengthExpr, ArkNewArrayExpr, ArkNewExpr, ArkStaticInvokeExpr } from "../../core/base/Expr";
import { Local } from "../../core/base/Local";
import { ArkInstanceFieldRef, ArkParameterRef } from "../../core/base/Ref";
import { ArkAssignStmt, ArkGotoStmt, ArkIfStmt, ArkInvokeStmt, ArkReturnStmt, ArkReturnVoidStmt, ArkSwitchStmt, Stmt} from '../../core/base/Stmt';
import { Value } from "../../core/base/Value";
import { StmtReader } from './SourceBody';


abstract class SourceStmt extends Stmt {
    original: Stmt;

    constructor(original: Stmt, stmtReader: StmtReader) {
        super();
        this.original = original;
        this.setPositionInfo(original.getPositionInfo());
        this.transfer2ts(stmtReader);
    }

    protected abstract transfer2ts(stmtReader: StmtReader): void;

    protected transferType(type: string) {
        if (type == 'int') {
            return 'number';
        }
        return type;
    }

    protected instanceInvokeExprToString(invokeExpr: ArkInstanceInvokeExpr) {
        let methodName = invokeExpr.getMethodSignature().getMethodSubSignature().getMethodName();
        let args: string[] = [];
        invokeExpr.getArgs().forEach((v)=>{args.push(v.toString())});
        if (invokeExpr.getBase() instanceof Local) {
            return `${invokeExpr.getBase().getName()}.${methodName}(${args.join(',')})`;
        } else if (invokeExpr.getBase() instanceof Constant) {
            let base: Constant = invokeExpr.getBase() as unknown as Constant;
            return `${base.getValue()}.${methodName}(${args.join(',')})`;
        } else {
            console.log('= SourceStmt.instanceInvokeExprToString: error.', invokeExpr.getBase(), methodName);
        }
    }

    protected staticInvokeExprToString(invokeExpr: ArkStaticInvokeExpr) {
        let methodName = invokeExpr.getMethodSignature().getMethodSubSignature().getMethodName();
        let args: string[] = [];
        invokeExpr.getArgs().forEach((v)=>{args.push(v.toString())});
        return `${methodName}(${args.join(',')})`;
    }
}

export class SourceAssignStmt extends SourceStmt {
    constructor(original: ArkAssignStmt, stmtReader: StmtReader) {
        super(original, stmtReader);
    }

    protected transfer2ts(stmtReader: StmtReader): void {
        let leftOp = (this.original as ArkAssignStmt).getLeftOp();
        let rightOp = (this.original as ArkAssignStmt).getRightOp();
        console.log('SourceAssignStmt->transfer2ts', leftOp, rightOp);
        
        // omit this = this: <tests\sample\sample.ts>.<_DEFAULT_ARK_CLASS>
        if (leftOp instanceof Local && leftOp.getName() == 'this') {
            this.setText('');
            return;
        }

        // name = parameter0: StringKeyword
        if (rightOp instanceof ArkParameterRef) {
            this.setText('');
            return;
        }

        // temp2 = myPerson.<age>
        if (rightOp instanceof ArkInstanceFieldRef) {
            if (rightOp.getBase() instanceof Constant) {
                this.setText(`${leftOp} = ${(rightOp.getBase() as unknown as Constant).getValue()}.${rightOp.getFieldName()};`);
            } else {
                this.setText(`${leftOp} = ${rightOp.getBase().getName()}.${rightOp.getFieldName()};`);
            }
            return;
        }

        if (rightOp instanceof ArkBinopExpr) {
            let binopExpr = new SourceBinopExpr(rightOp);
            this.setText(`${leftOp} = ${binopExpr};`);
            return;
        }

        if (rightOp instanceof ArkNewArrayExpr) {
            this.setText(`${leftOp} = new Array<${this.transferType(rightOp.getBaseType())}>(${rightOp.getSize()});`);
            return;
        }

        if (rightOp instanceof ArkInstanceInvokeExpr) {
            this.setText(`${leftOp} = ${this.instanceInvokeExprToString(rightOp)};`);
            return;
        }

        if (rightOp instanceof ArkStaticInvokeExpr) {
            this.setText(`${leftOp} = ${this.staticInvokeExprToString(rightOp)};`);
            return;
        }

        if (rightOp instanceof ArkLengthExpr) {
            this.setText(`${leftOp} = ${rightOp.getOp()}.length;`);
            return;
        }

        // temp1 = new Person
        // temp1.constructor(10)
        if (leftOp instanceof Local && rightOp instanceof ArkNewExpr) {
            if (stmtReader.hasNext()) {
                let stmt = stmtReader.next();
                let rollback = true;
                if (stmt instanceof ArkInvokeStmt && stmt.getInvokeExpr() as ArkInstanceInvokeExpr) {
                    let instanceInvokeExpr = stmt.getInvokeExpr() as ArkInstanceInvokeExpr;
                    if ('constructor' == instanceInvokeExpr.getMethodSignature().getMethodSubSignature().getMethodName() && instanceInvokeExpr.getBase().getName() == leftOp.getName()) {
                        let args: string[] = [];
                        instanceInvokeExpr.getArgs().forEach((v)=>{args.push(v.toString())});
                        this.setText(`${leftOp.toString()} = new ${rightOp.getClassSignature().getClassType()}(${args.join(',')});`);
                        rollback = false;
                    }
                }
                if (rollback) {
                    stmtReader.rollback();
                    this.setText(`${leftOp} = new ${rightOp.getClassSignature()}();`);
                }
            } else {
                this.setText(`${leftOp} = new ${rightOp.getClassSignature()}();`);
            }
            return;
        }
        
        this.setText(`${this.original};`);
    }
}

export class SourceInvokeStmt extends SourceStmt {
    constructor(original: ArkInvokeStmt, stmtReader: StmtReader) {
        super(original, stmtReader);
    }

    protected transfer2ts(stmtReader: StmtReader): void {
        let invokeExpr = this.original.getInvokeExpr();
        if (invokeExpr instanceof ArkStaticInvokeExpr) {
            this.setText(`${this.staticInvokeExprToString(invokeExpr)};`);
            return;
        } else if (invokeExpr instanceof ArkInstanceInvokeExpr) {
            this.setText(`${this.instanceInvokeExprToString(invokeExpr)};`);
            return;
        } else {
            this.setText(this.original + ';');
        }
    }
}

export class SourceIfStmt extends SourceStmt {
    constructor(original: ArkIfStmt, stmtReader: StmtReader) {
        super(original, stmtReader);
    }

    protected transfer2ts(stmtReader: StmtReader): void {
        let code: string;
        code = `if (${(this.original as ArkIfStmt).getConditionExprExpr().getOp1()}`;
        code += ` ${(this.original as ArkIfStmt).getConditionExprExpr().getOperator()} `;
        code += `${(this.original as ArkIfStmt).getConditionExprExpr().getOp2()}) {`;
        this.setText(code);
    }
}

export class SourceWhileStmt extends SourceStmt {
    constructor(original: ArkIfStmt, stmtReader: StmtReader) {
        super(original, stmtReader);
    }

    protected transfer2ts(stmtReader: StmtReader): void {
        let code: string;
        code = `while (${(this.original as ArkIfStmt).getConditionExprExpr().getOp1()}`;
        code += ` ${this.transferOperator()} `;
        code += `${(this.original as ArkIfStmt).getConditionExprExpr().getOp2()}) {`;
        this.setText(code);
    }
    
    protected transferOperator(): string {
        let operator = (this.original as ArkIfStmt).getConditionExprExpr().getOperator().trim();
        if (this.isRelationalOperator(operator)) {
            return this.flipOperator(operator);
        }
        return operator;
    }

    protected isRelationalOperator(operator: string): boolean {
        return operator == '<' || operator == '<=' || operator == '>' || operator == '>=' ||
            operator == '==' || operator == '===' || operator == '!=' || operator == '!==';
    }

    protected flipOperator(operator: string): string {
        let newOperater = '';
        switch (operator) {
            case '<':
                newOperater = '>='
                break;
            case '<=':
                newOperater = '>'
                break;
            case '>':
                newOperater = '<='
                break;
            case '>=':
                newOperater = '<'
                break;
            case '==':
                newOperater = '!='
                break;
            case '===':
                newOperater = '!=='
                break;
            case '!=':
                newOperater = '=='
                break;
            case '!==':
                newOperater = '==='
                break;
            default:
                break;
        }
        return newOperater;
    }
}

export class SourceForStmt extends SourceWhileStmt {
    constructor(original: ArkIfStmt, stmtReader: StmtReader) {
        super(original, stmtReader);
    }

    protected transfer2ts(stmtReader: StmtReader): void {
        let code: string;
        code = `for (; ${(this.original as ArkIfStmt).getConditionExprExpr().getOp1()}`;
        code += ` ${this.transferOperator()} `;
        code += `${(this.original as ArkIfStmt).getConditionExprExpr().getOp2()}; `;
        while (stmtReader.hasNext()) {
            code += `${stmtReader.next()}`;
            if (stmtReader.hasNext()) {
                code += ', ';
            }
        }
        code += `) {`;
        this.setText(code);
        console.log('SourceForStmt->transfer2ts:', (this.original as ArkIfStmt).getConditionExprExpr());
    }
}

export class SourceElseStmt extends SourceStmt {
    constructor(original: ArkIfStmt, stmtReader: StmtReader) {
        super(original, stmtReader);
    }

    protected transfer2ts(stmtReader: StmtReader): void {
        this.setText('} else {');
    }
}

export class SourceContinueStmt extends SourceStmt {
    constructor(original: ArkGotoStmt, stmtReader: StmtReader) {
        super(original, stmtReader);
    }
    // trans 2 break or continue
    protected transfer2ts(stmtReader: StmtReader): void {
        this.setText('continue;');
    }
}

export class SourceBreakStmt extends SourceStmt {
    constructor(original: ArkGotoStmt, stmtReader: StmtReader) {
        super(original, stmtReader);
    }
    // trans 2 break or continue
    protected transfer2ts(stmtReader: StmtReader): void {
        this.setText('break;');
    }
}

export class SourceReturnStmt extends SourceStmt {
    constructor(original: ArkReturnStmt, stmtReader: StmtReader) {
        super(original, stmtReader);
    }

    protected transfer2ts(stmtReader: StmtReader): void {
        this.setText(`return ${(this.original as ArkReturnStmt).getOp()};`);
    }
}

export class SourceReturnVoidStmt extends SourceStmt {
    constructor(original: ArkReturnVoidStmt, stmtReader: StmtReader) {
        super(original, stmtReader);
    }

    protected transfer2ts(stmtReader: StmtReader): void {
        if (this.original.getOriginPositionInfo() == 0) {
            this.setText('');
        } else {
            this.setText('return;');
        }
    }
}

export class SourceSwitchStmt extends SourceStmt {
    constructor(original: ArkSwitchStmt, stmtReader: StmtReader) {
        super(original, stmtReader);
    }

    protected transfer2ts(stmtReader: StmtReader): void {
        this.setText(`switch (${(this.original as ArkSwitchStmt).getKey()}) {`);
    }
}

export class SourceCaseStmt extends SourceStmt {
    caseIndex: number;
    constructor(original: ArkSwitchStmt, stmtReader: StmtReader, index:number) {
        super(original, stmtReader);
        this.caseIndex = index;
        this.transfer2ts(stmtReader);
    }

    public isDefault(): boolean {
        let cases = (this.original as ArkSwitchStmt).getCases();
        return this.caseIndex >= cases.length;
    }

    protected transfer2ts(stmtReader: StmtReader): void {
        let cases = (this.original as ArkSwitchStmt).getCases();
        if (this.caseIndex < cases.length) {
            this.setText(`case ${(this.original as ArkSwitchStmt).getCases()[this.caseIndex]}:`);
        } else {
            this.setText('default: ');
        }
    }
}

export class SourceCompoundEndStmt extends Stmt {
    constructor(text: string) {
        super();
        this.setText(text);
    }
}

class SourceBinopExpr {
    binopExpr: ArkBinopExpr;
    constructor(binopExpr: ArkBinopExpr) {
        this.binopExpr = binopExpr;
    }

    public toString(): string {
        let outStr = '';
        let op1: Value = this.binopExpr.getOp1();
        let op2: Value = this.binopExpr.getOp2();
        let operator: string = this.binopExpr.getOperator();

        if (op1 instanceof Constant) {
            if (op1.getType() == 'string' && !op1.getValue().startsWith('\'')) {
                outStr = `'${op1.getValue()}'`;
            } else {
                outStr = op1.getValue();
            }
        } else {
            outStr += op1;
        }
        outStr += ' ' + operator + ' ';
        if (op2 instanceof Constant) {
            if (op2.getType() == 'string' && !op2.getValue().startsWith('\'')) {
                outStr += `'${op2.getValue()}'`;
            } else {
                outStr += op2.getValue();
            }
        } else {
            outStr += op2;
        }
        return outStr;
    }
}