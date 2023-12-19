import * as fs from 'fs';
import * as ts from 'typescript';

import { NodeA, ASTree } from './Ast';
import {
    ArkExpression,
    ArkIdentifier,
    ArkLiteralExpression,
    LiteralType,
} from './Expr'
import { text } from 'stream/consumers';



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

export class NoSimpleStmtPositionInfo extends SimpleStmtPositionInfo {
    constructor() {
        super(0, 0)
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

// 单句变量定义，融合tsc VariableDeclaration和VariableStatement
export class ArkVariableStatement extends ArkAbstractStmt {
    name: ArkIdentifier;
    // readonly type?: TypeNode;                      // Optional type annotation
    initializer?: ArkExpression;
    constructor(positionInfo: SimpleStmtPositionInfo, name: ArkIdentifier, initializer?: ArkExpression) {
        super(positionInfo);
        this.name = name;
        this.initializer = initializer;
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



// AST node to ArkStatemen
export function ASTNode2ArkStatements(node: ts.Node): ArkStmt[] {
    let arkStatements: ArkStmt[] = [];
    if (ts.isVariableStatement(node)) {
        arkStatements.push(ASTNode2VariableStatement(node as ts.VariableStatement));
    }
    return arkStatements;
}

function ASTNode2VariableStatement(variableStatement: ts.VariableStatement): ArkStmt {

    let variableDeclaration = variableStatement.declarationList.declarations[0];
    let identifier = variableDeclaration.name as ts.Identifier;
    let arkIdentifier = new ArkIdentifier(identifier.text)

    let noSimpleStmtPositionInfo = new NoSimpleStmtPositionInfo();
    if (variableDeclaration.initializer == undefined) {
        return new ArkVariableStatement(noSimpleStmtPositionInfo, arkIdentifier);
    }

    let arkInitializer;
    let initializer = variableDeclaration.initializer;
    if (ts.isLiteralTypeLiteral(initializer)) {
        let text, literalType;
        if (ts.isLiteralExpression(initializer)) {
            text = initializer.text;

            if (ts.isNumericLiteral(initializer)) {
                literalType = LiteralType.NumericLiteral;
            }
            else if (ts.isStringLiteral(initializer)) {
                literalType = LiteralType.StringLiteral;
            }
        }
        else if (initializer.kind === ts.SyntaxKind.TrueKeyword) {
            text = 'true';
            literalType = LiteralType.BooleanLiteral;
        }
        else if (initializer.kind === ts.SyntaxKind.FalseKeyword) {
            text = 'false';
            literalType = LiteralType.BooleanLiteral;
        }
        if (literalType !== undefined && text !== undefined) {
            arkInitializer = new ArkLiteralExpression(text, literalType);
        }
    }
    return new ArkVariableStatement(new NoSimpleStmtPositionInfo, arkIdentifier, arkInitializer);
}
