import * as fs from 'fs';
import { NodeA, ASTree } from './Ast';
import { ArkExpression } from './Expr';


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

// todo:考虑多行statement的场景
export interface SimpleStmtPositionInfo {
    line: number;
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
    // readonly statements: NodeArray<Statement>;
}


export interface ArkFlowStmt extends ArkStmt {

}

export class ArkExpressionStatement extends ArkAbstractStmt implements ArkFlowStmt {
    expression: ArkExpression;
    constructor(positionInfo: SimpleStmtPositionInfo, expression: ArkExpression) {
        super(positionInfo)
        this.expression = expression
    }
}


export class ArkIfStatement extends ArkAbstractStmt implements ArkFlowStmt {
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

export class ArkBreakStatement extends ArkAbstractStmt implements ArkFlowStmt {
    // label?: Identifier;
}

export class ArkContinueStatement extends ArkAbstractStmt implements ArkFlowStmt {
    // label?: Identifier;
}

export class ArkReturnStatement extends ArkAbstractStmt implements ArkFlowStmt {
    expression?: ArkExpression;
    constructor(positionInfo: SimpleStmtPositionInfo, expression?: ArkExpression) {
        super(positionInfo)
        this.expression = expression
    }
}

export class ArkWithStatement extends ArkAbstractStmt implements ArkFlowStmt {
    expression?: ArkExpression;
    statement: ArkStmt;
    constructor(positionInfo: SimpleStmtPositionInfo, statement: ArkStmt, expression?: ArkExpression) {
        super(positionInfo)
        this.expression = expression;
        this.statement = statement;
    }
}

export class ArkSwitchStatement extends ArkAbstractStmt implements ArkFlowStmt {
    expression?: ArkExpression;
    // caseBlock: CaseBlock;
    constructor(positionInfo: SimpleStmtPositionInfo, expression?: ArkExpression) {
        super(positionInfo)
        this.expression = expression;
    }
}

export class ArkThrowStatement extends ArkAbstractStmt implements ArkFlowStmt {
    expression?: ArkExpression;
    constructor(positionInfo: SimpleStmtPositionInfo, expression?: ArkExpression) {
        super(positionInfo)
        this.expression = expression;
    }
}

export class ArkTryStatement extends ArkAbstractStmt implements ArkFlowStmt {
    tryBlock: ArkBlock;
    // catchClause?: CatchClause;
    finallyBlock?: ArkBlock;
    constructor(positionInfo: SimpleStmtPositionInfo, tryBlock: ArkBlock, finallyBlock?: ArkBlock) {
        super(positionInfo);
        this.tryBlock = tryBlock;
        this.finallyBlock = finallyBlock;
    }
}


export interface ArkIterationStatement extends ArkStmt {
    statement: ArkStmt;
}

export class ArkDoStatement extends ArkAbstractStmt implements ArkFlowStmt, ArkIterationStatement {
    statement: ArkStmt;
    expression: ArkExpression;
    constructor(positionInfo: SimpleStmtPositionInfo, statement: ArkStmt, expression: ArkExpression) {
        super(positionInfo);
        this.statement = statement;
        this.expression = expression;
    }
}

export class ArkWhileStatement extends ArkAbstractStmt implements ArkFlowStmt, ArkIterationStatement {
    statement: ArkStmt;
    expression: ArkExpression;
    constructor(positionInfo: SimpleStmtPositionInfo, statement: ArkStmt, expression: ArkExpression) {
        super(positionInfo);
        this.statement = statement;
        this.expression = expression;
    }
}

export class ArkForStatement extends ArkAbstractStmt implements ArkFlowStmt, ArkIterationStatement {
    statement: ArkStmt;
    // initializer?: ForInitializer;
    condition?: ArkExpression;
    incrementor?: ArkExpression;
    constructor(positionInfo: SimpleStmtPositionInfo, statement: ArkStmt, condition?: ArkExpression,
        incrementor?: ArkExpression) {
        super(positionInfo);
        this.condition = condition;
        this.incrementor = incrementor;
    }
}

export class ArkForInStatement extends ArkAbstractStmt implements ArkFlowStmt, ArkIterationStatement {
    statement: ArkStmt;
    // initializer?: ForInitializer;
    expression?: ArkExpression;
    constructor(positionInfo: SimpleStmtPositionInfo, statement: ArkStmt, expression?: ArkExpression) {
        super(positionInfo);
        this.statement = statement;
        this.expression = expression;
    }
}

export class ArkForOfStatement extends ArkAbstractStmt implements ArkFlowStmt, ArkIterationStatement {
    statement: ArkStmt;
    // readonly awaitModifier?: AwaitKeyword;
    // readonly initializer: ForInitializer;
    expression: ArkExpression;
    constructor(positionInfo: SimpleStmtPositionInfo, statement: ArkStmt, expression: ArkExpression) {
        super(positionInfo);
        this.statement = statement;
        this.expression = expression;
    }
}