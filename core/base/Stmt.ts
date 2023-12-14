import * as fs from 'fs';
import { NodeA, ASTree } from './Ast';
import {
    ArkExpression,
    ArkIdentifier,
}
    from './Expr'


export class Statement {
    type: string;
    code: string;
    next: Statement | null;
    walked: boolean;
    index: number;
    constructor(type: string, code: string) {
        this.type = type;
        this.code = code;
        this.next = null;
        this.walked = false;
        this.index = 0;
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





export class SimpleStmtPositionInfo {
    pos: number;
    end: number;
    constructor(pos: number, end: number) {
        this.pos = pos;
        this.end = end;
    }
}

export interface ArkStmt {

}

export abstract class ArkAbstractStmt implements ArkStmt {
    positionInfo: SimpleStmtPositionInfo;
    constructor(positionInfo: SimpleStmtPositionInfo) {
        this.positionInfo = positionInfo;
    }
}

export class ArkBlock extends ArkAbstractStmt {
    statements: ArkStmt[];
    constructor(positionInfo: SimpleStmtPositionInfo, statements: ArkStmt[]) {
        super(positionInfo);
        this.statements = statements;
    }
}


export class ArkExpressionStatement extends ArkAbstractStmt {
    expression: ArkExpression;
    constructor(positionInfo: SimpleStmtPositionInfo, expression: ArkExpression) {
        super(positionInfo)
        this.expression = expression
    }
}

export class ArkReturnStatement extends ArkAbstractStmt {
    expression?: ArkExpression;
    constructor(positionInfo: SimpleStmtPositionInfo, expression?: ArkExpression) {
        super(positionInfo)
        this.expression = expression
    }
}

export class ArkWithStatement extends ArkAbstractStmt {
    expression?: ArkExpression;
    statement: ArkStmt;
    constructor(positionInfo: SimpleStmtPositionInfo, statement: ArkStmt, expression?: ArkExpression) {
        super(positionInfo)
        this.expression = expression;
        this.statement = statement;
    }
}

export class ArkSwitchStatement extends ArkAbstractStmt {
    expression?: ArkExpression;
    // caseBlock: CaseBlock;
    constructor(positionInfo: SimpleStmtPositionInfo, expression?: ArkExpression) {
        super(positionInfo)
        this.expression = expression;
    }
}

export class ArkThrowStatement extends ArkAbstractStmt {
    expression?: ArkExpression;
    constructor(positionInfo: SimpleStmtPositionInfo, expression?: ArkExpression) {
        super(positionInfo)
        this.expression = expression;
    }
}

export class ArkTryStatement extends ArkAbstractStmt {
    tryBlock: ArkBlock;
    // catchClause?: CatchClause;
    finallyBlock?: ArkBlock;
    constructor(positionInfo: SimpleStmtPositionInfo, tryBlock: ArkBlock, finallyBlock?: ArkBlock) {
        super(positionInfo);
        this.tryBlock = tryBlock;
        this.finallyBlock = finallyBlock;
    }
}

export interface ArkBranchingStmt extends ArkStmt {
}


export class ArkIfStatement extends ArkAbstractStmt implements ArkBranchingStmt {
    expression: ArkExpression;
    thenStatement: ArkStmt;
    elseStatement?: ArkStmt;
    constructor(positionInfo: SimpleStmtPositionInfo, expression: ArkExpression, thenStatement: ArkStmt,
        elseStatement?: ArkStmt) {
        super(positionInfo)
        this.expression = expression;
        this.thenStatement = thenStatement;
        this.elseStatement = elseStatement;
    }
}

export class ArkBreakStatement extends ArkAbstractStmt implements ArkBranchingStmt {
    label?: ArkIdentifier;
    constructor(positionInfo: SimpleStmtPositionInfo, label?: ArkIdentifier) {
        super(positionInfo);
        this.label = label;
    }
}

export class ArkContinueStatement extends ArkAbstractStmt implements ArkBranchingStmt {
    label?: ArkIdentifier;
    constructor(positionInfo: SimpleStmtPositionInfo, label?: ArkIdentifier) {
        super(positionInfo);
        this.label = label;
    }
}


export interface ArkIterationStatement extends ArkStmt {
    statement: ArkStmt; // 循环体
}

export class ArkDoStatement extends ArkAbstractStmt implements ArkIterationStatement {
    statement: ArkStmt;
    expression: ArkExpression;
    constructor(positionInfo: SimpleStmtPositionInfo, statement: ArkStmt, expression: ArkExpression) {
        super(positionInfo);
        this.statement = statement;
        this.expression = expression;
    }
}

export class ArkWhileStatement extends ArkAbstractStmt implements ArkIterationStatement {
    statement: ArkStmt;
    expression: ArkExpression;
    constructor(positionInfo: SimpleStmtPositionInfo, statement: ArkStmt, expression: ArkExpression) {
        super(positionInfo);
        this.statement = statement;
        this.expression = expression;
    }
}

export class ArkForStatement extends ArkAbstractStmt implements ArkIterationStatement {
    statement: ArkStmt;
    initializer?: ArkExpression;
    condition?: ArkExpression;
    incrementor?: ArkExpression;
    constructor(positionInfo: SimpleStmtPositionInfo, statement: ArkStmt, initializer?: ArkExpression, condition?: ArkExpression,
        incrementor?: ArkExpression) {
        super(positionInfo);
        this.statement = statement;
        this.initializer = initializer;
        this.condition = condition;
        this.incrementor = incrementor;
    }
}

export class ArkForInStatement extends ArkAbstractStmt implements ArkIterationStatement {
    statement: ArkStmt;
    initializer?: ArkExpression;
    expression?: ArkExpression;
    constructor(positionInfo: SimpleStmtPositionInfo, statement: ArkStmt, initializer?: ArkExpression, expression?: ArkExpression) {
        super(positionInfo);
        this.initializer = initializer;
        this.statement = statement;
        this.expression = expression;
    }
}

export class ArkForOfStatement extends ArkAbstractStmt implements ArkIterationStatement {
    statement: ArkStmt;
    initializer?: ArkExpression;
    expression?: ArkExpression;
    constructor(positionInfo: SimpleStmtPositionInfo, statement: ArkStmt, initializer?: ArkExpression, expression?: ArkExpression) {
        super(positionInfo);
        this.initializer = initializer;
        this.statement = statement;
        this.expression = expression;
    }
}