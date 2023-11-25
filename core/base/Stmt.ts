import * as fs from 'fs';
import { NodeA, ASTree } from './Ast';

export class Statement {
    type: string;
    code: string;
    next: Statement | null;
    walked: boolean;
    index: number;
    posStart: number | string;
    posEnd: number | string;
    constructor(type: string, code: string) {
        this.type = type;
        this.code = code;
        this.next = null;
        this.walked = false;
        this.index = 0;
        this.posStart = 0;// TODO: modify to use real pos number
        this.posEnd = 0;// TODO: modify to use real pos number
    }
}

export class ConditionStatement extends Statement {
    nextT: Statement | null;
    nextF: Statement | null;
    constructor(type: string, code: string) {
        super(type, code);
        this.nextT = null;
        this.nextF = null
    }
}

export class SwitchStatement extends Statement {
    nexts: Statement[];
    constructor(type: string, code: string) {
        super(type, code);
        this.nexts = [];
    }
}


abstract class StmtPositionInfo {
    pos: number;
    end: number;

    getFirstLine(): number {
        return this.pos;
    }

    getLastLine(): number {
        return this.end;
    }
}

interface Stmt {
    branchs(): boolean;

    getExpectedSuccessorCount(): number;

    containsInvokeExpr(): boolean;

    containsArrayRef(): boolean;

    containsFieldRef(): boolean;

    getPositionInfo(): StmtPositionInfo;
}

abstract class AbstractStmt implements Stmt {
    positionInfo: StmtPositionInfo;

    constructor(positionInfo: StmtPositionInfo) {
        this.positionInfo = positionInfo;
    }

    getExpectedSuccessorCount(): number {
        return 1;
    }

    containsInvokeExpr(): boolean {
        return false;
    }

    containsArrayRef(): boolean {
        return false;
    }

    containsFieldRef(): boolean {
        return false;
    }

    getPositionInfo(): StmtPositionInfo {
        return this.positionInfo;
    }

    branchs(): boolean {
        return false;
    }
}


class ArkAssignStmt extends AbstractStmt {
    leftOp: any;
    rightOp: any;

    constructor(leftOp: any, rightOp: any, positionInfo: StmtPositionInfo) {
        super(positionInfo);
        this.leftOp = leftOp;
        this.rightOp = rightOp;
    }

    getLeftOp() {
        return this.leftOp;
    }

    getRightOp() {
        return this.rightOp;
    }

    branches(): boolean {
        return false;
    }
}

interface BranchingStmt extends Stmt {

}



class ArkIfStmt extends AbstractStmt implements BranchingStmt {
    FALSE_BRANCH_IDX: number = 0;
    TRUE_BRANCH_IDX: number = 1;


    constructor(positionInfo: StmtPositionInfo) {
        super(positionInfo);
    }

    branches(): boolean {
        return true;
    }

    getExpectedSuccessorCount() {
        return 2;
    }
}


class ArkInvokeStmt extends AbstractStmt {
    constructor(positionInfo: StmtPositionInfo) {
        super(positionInfo);
    }

    containsInvokeExpr(): boolean {
        return true;
    }
}


class ArkReturnStmt extends AbstractStmt {
    op: any;
    constructor(op: any, positionInfo: StmtPositionInfo) {
        super(positionInfo);
        this.op = op;
    }

    containsInvokeExpr(): boolean {
        return true;
    }

    getOp(): any {
        return this.op;
    }

    getExpectedSuccessorCount(): number {
        return 0;
    }
}


class ArkReturnVoidStmt extends AbstractStmt {
    constructor(positionInfo: StmtPositionInfo) {
        super(positionInfo);
    }

    containsInvokeExpr(): boolean {
        return true;
    }


    getExpectedSuccessorCount(): number {
        return 0;
    }
}


class ArkThrowStmt extends AbstractStmt {
    op: any;
    constructor(op: any, positionInfo: StmtPositionInfo) {
        super(positionInfo);
        this.op = op;
    }
    containsInvokeExpr(): boolean {
        return true;
    }

    getOp(): any {
        return this.op;
    }

    getExpectedSuccessorCount(): number {
        return 0;
    }
}
