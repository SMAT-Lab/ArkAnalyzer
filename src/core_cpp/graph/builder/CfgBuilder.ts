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

import * as ts from 'ohos-typescript';
import { Local } from '../../base/Local';
import { ArkAliasTypeDefineStmt, ArkReturnStmt, ArkReturnVoidStmt, Stmt } from '../../base/Stmt';
import { BasicBlock } from '../BasicBlock';
import { Cfg } from '../Cfg';
import { ArkClass } from '../../model/ArkClass';
import { ArkMethod } from '../../model/ArkMethod';
import { ArkIRTransformer, ValueAndStmts } from '../../common/ArkIRTransformer';
import { ModelUtils } from '../../common/ModelUtils';
import { IRUtils } from '../../common/IRUtils';
import { AliasType, ClassType, UnclearReferenceType, UnknownType, VoidType } from '../../base/Type';
import { Trap } from '../../base/Trap';
import { GlobalRef } from '../../base/Ref';
import { LoopBuilder } from './LoopBuilder';
import { SwitchBuilder } from './SwitchBuilder';
import { ConditionBuilder } from './ConditionBuilder';
import { TrapBuilder } from './TrapBuilder';
import { CONSTRUCTOR_NAME, PROMISE } from '../../common/TSConst';
import { ModifierType } from '../../model/ArkBaseModel';

class StatementBuilder {
    type: string;
    //节点对应源代码
    code: string;
    next: StatementBuilder | null;
    lasts: Set<StatementBuilder>;
    walked: boolean;
    index: number;
    // TODO:以下两个属性需要获取
    line: number; //行号//ast节点存了一个start值为这段代码的起始地址，可以从start开始往回查原文有几个换行符确定行号
    column: number; // 列
    astNode: ts.Node | null; //ast节点对象
    scopeID: number;
    addressCode3: string[] = [];
    block: BlockBuilder | null;
    ifExitPass: boolean;
    passTmies: number = 0;
    numOfIdentifier: number = 0;
    isDoWhile: boolean = false;

    constructor(type: string, code: string, astNode: ts.Node | null, scopeID: number) {
        this.type = type;
        this.code = code;
        this.next = null;
        this.lasts = new Set();
        this.walked = false;
        this.index = 0;
        this.line = -1;
        this.column = -1;
        this.astNode = astNode;
        this.scopeID = scopeID;
        this.block = null;
        this.ifExitPass = false;
    }
}

class ConditionStatementBuilder extends StatementBuilder {
    nextT: StatementBuilder | null;
    nextF: StatementBuilder | null;
    loopBlock: BlockBuilder | null;
    condition: string;
    doStatement: StatementBuilder | null = null;

    constructor(type: string, code: string, astNode: ts.Node, scopeID: number) {
        super(type, code, astNode, scopeID);
        this.nextT = null;
        this.nextF = null;
        this.loopBlock = null;
        this.condition = '';
    }
}

export class SwitchStatementBuilder extends StatementBuilder {
    nexts: StatementBuilder[];
    cases: Case[] = [];
    default: StatementBuilder | null = null;
    afterSwitch: StatementBuilder | null = null;

    constructor(type: string, code: string, astNode: ts.Node, scopeID: number) {
        super(type, code, astNode, scopeID);
        this.nexts = [];
    }
}

export class TryStatementBuilder extends StatementBuilder {
    tryFirst: StatementBuilder | null = null;
    tryExit: StatementBuilder | null = null;
    catchStatement: StatementBuilder | null = null;
    catchError: string = '';
    finallyStatement: StatementBuilder | null = null;
    afterFinal: StatementBuilder | null = null;

    constructor(type: string, code: string, astNode: ts.Node, scopeID: number) {
        super(type, code, astNode, scopeID);
    }
}

class Case {
    value: string;
    stmt: StatementBuilder;
    valueNode!: ts.Node;

    constructor(value: string, stmt: StatementBuilder) {
        this.value = value;
        this.stmt = stmt;
    }
}

class DefUseChain {
    def: StatementBuilder;
    use: StatementBuilder;

    constructor(def: StatementBuilder, use: StatementBuilder) {
        this.def = def;
        this.use = use;
    }
}

class Variable {
    name: string;
    lastDef: StatementBuilder;
    defUse: DefUseChain[];
    properties: Variable[] = [];
    propOf: Variable | null = null;

    constructor(name: string, lastDef: StatementBuilder) {
        this.name = name;
        this.lastDef = lastDef;
        this.defUse = [];
    }
}

class Scope {
    id: number;

    constructor(id: number) {
        this.id = id;
    }
}

export class BlockBuilder {
    id: number;
    stmts: StatementBuilder[];
    nexts: BlockBuilder[] = [];
    lasts: BlockBuilder[] = [];
    walked: boolean = false;

    constructor(id: number, stmts: StatementBuilder[]) {
        this.id = id;
        this.stmts = stmts;
    }
}

class Catch {
    errorName: string;
    from: number;
    to: number;
    withLabel: number;

    constructor(errorName: string, from: number, to: number, withLabel: number) {
        this.errorName = errorName;
        this.from = from;
        this.to = to;
        this.withLabel = withLabel;
    }
}

class TextError extends Error {
    constructor(message: string) {
        // 调用父类的构造函数，并传入错误消息
        super(message);

        // 设置错误类型的名称
        this.name = 'TextError';
    }
}

export class CfgBuilder {
    name: string;
    astRoot: ts.Node;
    entry: StatementBuilder;
    exit: StatementBuilder;
    loopStack: ConditionStatementBuilder[];
    switchExitStack: StatementBuilder[];
    functions: CfgBuilder[];
    breakin: string;
    statementArray: StatementBuilder[];
    dotEdges: number[][];
    scopes: Scope[];
    tempVariableNum: number;
    current3ACstm: StatementBuilder;
    blocks: BlockBuilder[];
    currentDeclarationKeyword: string;
    variables: Variable[];
    declaringClass: ArkClass;
    importFromPath: string[];
    catches: Catch[];
    exits: StatementBuilder[] = [];
    emptyBody: boolean = false;
    arrowFunctionWithoutBlock: boolean = false;

    private sourceFile: ts.SourceFile;
    private declaringMethod: ArkMethod;

    constructor(ast: ts.Node, name: string, declaringMethod: ArkMethod, sourceFile: ts.SourceFile) {
        this.name = name;
        this.astRoot = ast;
        this.declaringMethod = declaringMethod;
        this.declaringClass = declaringMethod.getDeclaringArkClass();
        this.entry = new StatementBuilder('entry', '', ast, 0);
        this.loopStack = [];
        this.switchExitStack = [];
        this.functions = [];
        this.breakin = '';
        this.statementArray = [];
        this.dotEdges = [];
        this.exit = new StatementBuilder('exit', 'return;', null, 0);
        this.scopes = [];
        this.tempVariableNum = 0;
        this.current3ACstm = this.entry;
        this.blocks = [];
        this.currentDeclarationKeyword = '';
        this.variables = [];
        this.importFromPath = [];
        this.catches = [];
        this.sourceFile = sourceFile;
        this.arrowFunctionWithoutBlock = true;
    }

    public getDeclaringMethod(): ArkMethod {
        return this.declaringMethod;
    }

    judgeLastType(s: StatementBuilder, lastStatement: StatementBuilder): void {
        if (lastStatement.type === 'ifStatement') {
            let lastIf = lastStatement as ConditionStatementBuilder;
            if (lastIf.nextT == null) {
                lastIf.nextT = s;
                s.lasts.add(lastIf);
            } else {
                lastIf.nextF = s;
                s.lasts.add(lastIf);
            }
        } else if (lastStatement.type === 'loopStatement') {
            let lastLoop = lastStatement as ConditionStatementBuilder;
            lastLoop.nextT = s;
            s.lasts.add(lastLoop);
        } else if (lastStatement.type === 'catchOrNot') {
            let lastLoop = lastStatement as ConditionStatementBuilder;
            lastLoop.nextT = s;
            s.lasts.add(lastLoop);
        } else {
            lastStatement.next = s;
            s.lasts.add(lastStatement);
        }
    }

    ASTNodeBreakStatement(c: ts.Node, lastStatement: StatementBuilder): void {
        let p: ts.Node | null = c;
        while (p && p !== this.astRoot) {
            if (ts.isWhileStatement(p) || ts.isDoStatement(p) || ts.isForStatement(p) || ts.isForInStatement(p) || ts.isForOfStatement(p)) {
                const lastLoopNextF = this.loopStack[this.loopStack.length - 1].nextF!;
                this.judgeLastType(lastLoopNextF, lastStatement);
                lastLoopNextF.lasts.add(lastStatement);
                return;
            }
            if (ts.isCaseClause(p) || ts.isDefaultClause(p)) {
                const lastSwitchExit = this.switchExitStack[this.switchExitStack.length - 1];
                this.judgeLastType(lastSwitchExit, lastStatement);
                lastSwitchExit.lasts.add(lastStatement);
                return;
            }
            p = p.parent;
        }
    }

    ASTNodeIfStatement(c: ts.IfStatement, lastStatement: StatementBuilder, scopeID: number): StatementBuilder {
        let ifstm: ConditionStatementBuilder = new ConditionStatementBuilder('ifStatement', '', c, scopeID);
        this.judgeLastType(ifstm, lastStatement);
        let ifexit: StatementBuilder = new StatementBuilder('ifExit', '', c, scopeID);
        this.exits.push(ifexit);
        ifstm.condition = c.expression.getText(this.sourceFile);
        ifstm.code = 'if (' + ifstm.condition + ')';
        if (ts.isBlock(c.thenStatement)) {
            this.walkAST(ifstm, ifexit, [...c.thenStatement.statements]);
        } else {
            this.walkAST(ifstm, ifexit, [c.thenStatement]);
        }
        if (c.elseStatement) {
            if (ts.isBlock(c.elseStatement)) {
                this.walkAST(ifstm, ifexit, [...c.elseStatement.statements]);
            } else {
                this.walkAST(ifstm, ifexit, [c.elseStatement]);
            }
        }
        if (!ifstm.nextT) {
            ifstm.nextT = ifexit;
            ifexit.lasts.add(ifstm);
        }
        if (!ifstm.nextF) {
            ifstm.nextF = ifexit;
            ifexit.lasts.add(ifstm);
        }
        return ifexit;
    }

    ASTNodeWhileStatement(c: ts.WhileStatement, lastStatement: StatementBuilder, scopeID: number): StatementBuilder {
        this.breakin = 'loop';
        let loopstm = new ConditionStatementBuilder('loopStatement', '', c, scopeID);
        this.loopStack.push(loopstm);
        this.judgeLastType(loopstm, lastStatement);
        let loopExit = new StatementBuilder('loopExit', '', c, scopeID);
        this.exits.push(loopExit);
        loopstm.nextF = loopExit;
        loopExit.lasts.add(loopstm);
        loopstm.condition = c.expression.getText(this.sourceFile);
        loopstm.code = 'while (' + loopstm.condition + ')';
        if (ts.isBlock(c.statement)) {
            this.walkAST(loopstm, loopstm, [...c.statement.statements]);
        } else {
            this.walkAST(loopstm, loopstm, [c.statement]);
        }
        if (!loopstm.nextF) {
            loopstm.nextF = loopExit;
            loopExit.lasts.add(loopstm);
        }
        if (!loopstm.nextT) {
            loopstm.nextT = loopExit;
            loopExit.lasts.add(loopstm);
        }
        this.loopStack.pop();
        return loopExit;
    }

    ASTNodeForStatement(c: ts.ForInOrOfStatement | ts.ForStatement, lastStatement: StatementBuilder, scopeID: number): StatementBuilder {
        this.breakin = 'loop';
        let loopstm = new ConditionStatementBuilder('loopStatement', '', c, scopeID);
        this.loopStack.push(loopstm);
        this.judgeLastType(loopstm, lastStatement);
        let loopExit = new StatementBuilder('loopExit', '', c, scopeID);
        this.exits.push(loopExit);
        loopstm.nextF = loopExit;
        loopExit.lasts.add(loopstm);
        loopstm.code = 'for (';
        if (ts.isForStatement(c)) {
            loopstm.code +=
                c.initializer?.getText(this.sourceFile) + '; ' + c.condition?.getText(this.sourceFile) + '; ' + c.incrementor?.getText(this.sourceFile);
        } else if (ts.isForOfStatement(c)) {
            loopstm.code += c.initializer?.getText(this.sourceFile) + ' of ' + c.expression.getText(this.sourceFile);
        } else {
            loopstm.code += c.initializer?.getText(this.sourceFile) + ' in ' + c.expression.getText(this.sourceFile);
        }
        loopstm.code += ')';
        if (ts.isBlock(c.statement)) {
            this.walkAST(loopstm, loopstm, [...c.statement.statements]);
        } else {
            this.walkAST(loopstm, loopstm, [c.statement]);
        }
        if (!loopstm.nextF) {
            loopstm.nextF = loopExit;
            loopExit.lasts.add(loopstm);
        }
        if (!loopstm.nextT) {
            loopstm.nextT = loopExit;
            loopExit.lasts.add(loopstm);
        }
        this.loopStack.pop();
        return loopExit;
    }

    ASTNodeDoStatement(c: ts.DoStatement, lastStatement: StatementBuilder, scopeID: number): StatementBuilder {
        this.breakin = 'loop';
        let loopstm = new ConditionStatementBuilder('loopStatement', '', c, scopeID);
        this.loopStack.push(loopstm);
        let loopExit = new StatementBuilder('loopExit', '', c, scopeID);
        this.exits.push(loopExit);
        loopstm.nextF = loopExit;
        loopExit.lasts.add(loopstm);
        loopstm.condition = c.expression.getText(this.sourceFile);
        loopstm.code = 'while (' + loopstm.condition + ')';
        loopstm.isDoWhile = true;
        if (ts.isBlock(c.statement)) {
            this.walkAST(lastStatement, loopstm, [...c.statement.statements]);
        } else {
            this.walkAST(lastStatement, loopstm, [c.statement]);
        }
        let lastType = lastStatement.type;
        if (lastType === 'ifStatement' || lastType === 'loopStatement') {
            let lastCondition = lastStatement as ConditionStatementBuilder;
            loopstm.nextT = lastCondition.nextT;
            lastCondition.nextT?.lasts.add(loopstm);
        } else {
            loopstm.nextT = lastStatement.next;
            lastStatement.next?.lasts.add(loopstm);
        }
        if (loopstm.nextT && loopstm.nextT !== loopstm) {
            loopstm.nextT.isDoWhile = true;
            loopstm.doStatement = loopstm.nextT;
        }
        this.loopStack.pop();
        return loopExit;
    }

    ASTNodeSwitchStatement(c: ts.SwitchStatement, lastStatement: StatementBuilder, scopeID: number): StatementBuilder {
        this.breakin = 'switch';
        let switchstm = new SwitchStatementBuilder('switchStatement', '', c, scopeID);
        this.judgeLastType(switchstm, lastStatement);
        let switchExit = new StatementBuilder('switchExit', '', null, scopeID);
        this.exits.push(switchExit);
        this.switchExitStack.push(switchExit);
        switchExit.lasts.add(switchstm);
        switchstm.code = 'switch (' + c.expression + ')';
        let lastCaseExit: StatementBuilder | null = null;
        for (let i = 0; i < c.caseBlock.clauses.length; i++) {
            const clause = c.caseBlock.clauses[i];
            let casestm: StatementBuilder;
            if (ts.isCaseClause(clause)) {
                casestm = new StatementBuilder('statement', 'case ' + clause.expression.getText(this.sourceFile) + ':', clause, scopeID);
            } else {
                casestm = new StatementBuilder('statement', 'default:', clause, scopeID);
            }
            switchstm.nexts.push(casestm);
            casestm.lasts.add(switchstm);
            let caseExit = new StatementBuilder('caseExit', '', null, scopeID);
            this.exits.push(caseExit);
            this.walkAST(casestm, caseExit, [...clause.statements]);
            if (ts.isCaseClause(clause)) {
                const cas = new Case(casestm.code, casestm.next!);
                switchstm.cases.push(cas);
            } else {
                switchstm.default = casestm.next;
            }
            switchstm.nexts[switchstm.nexts.length - 1] = casestm.next!;
            for (const stmt of [...casestm.lasts]) {
                casestm.next!.lasts.add(stmt);
            }
            casestm.next!.lasts.delete(casestm);

            if (lastCaseExit) {
                lastCaseExit.next = casestm.next;
                casestm.next?.lasts.add(lastCaseExit);
            }
            lastCaseExit = caseExit;
            if (i === c.caseBlock.clauses.length - 1) {
                caseExit.next = switchExit;
                switchExit.lasts.add(caseExit);
            }
        }
        this.switchExitStack.pop();
        return switchExit;
    }

    ASTNodeTryStatement(c: ts.TryStatement, lastStatement: StatementBuilder, scopeID: number): StatementBuilder {
        let trystm = new TryStatementBuilder('tryStatement', 'try', c, scopeID);
        this.judgeLastType(trystm, lastStatement);
        let tryExit = new StatementBuilder('tryExit', '', c, scopeID);
        this.exits.push(tryExit);
        trystm.tryExit = tryExit;
        this.walkAST(trystm, tryExit, [...c.tryBlock.statements]);
        trystm.tryFirst = trystm.next;
        trystm.next?.lasts.add(trystm);
        if (c.catchClause) {
            let text = 'catch';
            if (c.catchClause.variableDeclaration) {
                text += '(' + c.catchClause.variableDeclaration.getText(this.sourceFile) + ')';
            }
            let catchOrNot = new ConditionStatementBuilder('catchOrNot', text, c, scopeID);
            let catchExit = new StatementBuilder('catch exit', '', c, scopeID);
            catchOrNot.nextF = catchExit;
            catchExit.lasts.add(catchOrNot);
            this.walkAST(catchOrNot, catchExit, [...c.catchClause.block.statements]);
            if (!catchOrNot.nextT) {
                catchOrNot.nextT = catchExit;
                catchExit.lasts.add(catchOrNot);
            }
            const catchStatement = new StatementBuilder('statement', catchOrNot.code, c.catchClause, catchOrNot.nextT.scopeID);
            catchStatement.next = catchOrNot.nextT;
            trystm.catchStatement = catchStatement;
            catchStatement.lasts.add(trystm);
            if (c.catchClause.variableDeclaration) {
                trystm.catchError = c.catchClause.variableDeclaration.getText(this.sourceFile);
            } else {
                trystm.catchError = 'Error';
            }
        }
        let final = new StatementBuilder('statement', 'finally', c, scopeID);
        let finalExit = new StatementBuilder('finallyExit', '', c, scopeID);
        this.exits.push(finalExit);
        if (c.finallyBlock && c.finallyBlock.statements.length > 0) {
            this.walkAST(final, finalExit, [...c.finallyBlock.statements]);
        } else {
            let dummyFinally = new StatementBuilder('statement', 'dummyFinally', c, new Scope(this.scopes.length).id);
            final.next = dummyFinally;
            dummyFinally.lasts.add(final);
            dummyFinally.next = finalExit;
            finalExit.lasts.add(dummyFinally);
        }
        trystm.finallyStatement = final.next;
        tryExit.next = final.next;
        final.next?.lasts.add(tryExit);

        trystm.next = finalExit;
        finalExit.lasts.add(trystm);
        return finalExit;
    }

    walkAST(lastStatement: StatementBuilder, nextStatement: StatementBuilder, nodes: ts.Node[]): void {
        let scope = new Scope(this.scopes.length);
        this.scopes.push(scope);
        for (let i = 0; i < nodes.length; i++) {
            let c = nodes[i];
            if (ts.isVariableStatement(c) || ts.isExpressionStatement(c) || ts.isThrowStatement(c) || ts.isTypeAliasDeclaration(c)) {
                let s = new StatementBuilder('statement', c.getText(this.sourceFile), c, scope.id);
                this.judgeLastType(s, lastStatement);
                lastStatement = s;
            } else if (!this.declaringMethod.isDefaultArkMethod() && ts.isFunctionDeclaration(c)) {
                let s = new StatementBuilder('functionDeclarationStatement', c.getText(this.sourceFile), c, scope.id);
                this.judgeLastType(s, lastStatement);
                lastStatement = s;
            } else if (!this.declaringMethod.isDefaultArkMethod() && ts.isClassDeclaration(c)) {
                let s = new StatementBuilder('classDeclarationStatement', c.getText(this.sourceFile), c, scope.id);
                this.judgeLastType(s, lastStatement);
                lastStatement = s;
            } else if (ts.isReturnStatement(c)) {
                let s = new StatementBuilder('returnStatement', c.getText(this.sourceFile), c, scope.id);
                this.judgeLastType(s, lastStatement);
                lastStatement = s;
                break;
            } else if (ts.isBreakStatement(c)) {
                this.ASTNodeBreakStatement(c, lastStatement);
                return;
            } else if (ts.isContinueStatement(c)) {
                const lastLoop = this.loopStack[this.loopStack.length - 1];
                this.judgeLastType(lastLoop, lastStatement);
                lastLoop.lasts.add(lastStatement);
                return;
            } else if (ts.isIfStatement(c)) {
                lastStatement = this.ASTNodeIfStatement(c, lastStatement, scope.id);
            } else if (ts.isWhileStatement(c)) {
                lastStatement = this.ASTNodeWhileStatement(c, lastStatement, scope.id);
            }
            if (ts.isForStatement(c) || ts.isForInStatement(c) || ts.isForOfStatement(c)) {
                lastStatement = this.ASTNodeForStatement(c, lastStatement, scope.id);
            } else if (ts.isDoStatement(c)) {
                lastStatement = this.ASTNodeDoStatement(c, lastStatement, scope.id);
            } else if (ts.isSwitchStatement(c)) {
                lastStatement = this.ASTNodeSwitchStatement(c, lastStatement, scope.id);
            } else if (ts.isBlock(c)) {
                let blockExit = new StatementBuilder('blockExit', '', c, scope.id);
                this.exits.push(blockExit);
                this.walkAST(lastStatement, blockExit, c.getChildren(this.sourceFile)[1].getChildren(this.sourceFile));
                lastStatement = blockExit;
            } else if (ts.isTryStatement(c)) {
                lastStatement = this.ASTNodeTryStatement(c, lastStatement, scope.id);
            } else if (ts.isExportAssignment(c)) {
                if (ts.isNewExpression(c.expression) || ts.isObjectLiteralExpression(c.expression)) {
                    let s = new StatementBuilder('statement', c.getText(this.sourceFile), c, scope.id);
                    this.judgeLastType(s, lastStatement);
                    lastStatement = s;
                }
            }
        }
        if (lastStatement.type !== 'breakStatement' && lastStatement.type !== 'continueStatement' && lastStatement.type !== 'returnStatement') {
            lastStatement.next = nextStatement;
            nextStatement.lasts.add(lastStatement);
        }
    }

    addReturnInEmptyMethod(): void {
        if (this.entry.next === this.exit) {
            const ret = new StatementBuilder('returnStatement', 'return;', null, this.entry.scopeID);
            this.entry.next = ret;
            ret.lasts.add(this.entry);
            ret.next = this.exit;
            this.exit.lasts = new Set([ret]);
        }
    }

    deleteExitAfterCondition(last: ConditionStatementBuilder, exit: StatementBuilder): void {
        if (last.nextT === exit) {
            last.nextT = exit.next;
            const lasts = exit.next!.lasts;
            lasts.delete(exit);
            lasts.add(last);
        } else if (last.nextF === exit) {
            last.nextF = exit.next;
            const lasts = exit.next!.lasts;
            lasts.delete(exit);
            lasts.add(last);
        }
    }

    deleteExitAfterSwitch(last: SwitchStatementBuilder, exit: StatementBuilder): void {
        if (exit.type === 'switchExit') {
            last.afterSwitch = exit.next;
        }
        exit.next!.lasts.delete(exit);
        last.nexts = last.nexts.filter(item => item !== exit);
        if (last.nexts.length === 0) {
            last.next = exit.next;
            exit.next?.lasts.add(last);
        }
    }

    deleteExit(): void {
        for (const exit of this.exits) {
            const lasts = [...exit.lasts];
            for (const last of lasts) {
                if (last instanceof ConditionStatementBuilder) {
                    this.deleteExitAfterCondition(last, exit);
                } else if (last instanceof SwitchStatementBuilder) {
                    this.deleteExitAfterSwitch(last, exit);
                } else if (last instanceof TryStatementBuilder && exit.type === 'finallyExit') {
                    last.afterFinal = exit.next;
                    last.next = last.tryFirst;
                    exit.lasts.delete(last);
                } else {
                    last.next = exit.next;
                    const lasts = exit.next!.lasts;
                    lasts.delete(exit);
                    lasts.add(last);
                }
            }
        }
        // 部分语句例如return后面的exit语句的next无法在上面清除
        for (const exit of this.exits) {
            if (exit.next && exit.next.lasts.has(exit)) {
                exit.next.lasts.delete(exit);
            }
        }
    }

    addStmt2BlockStmtQueueInSpecialCase(stmt: StatementBuilder, stmtQueue: StatementBuilder[]): StatementBuilder | null {
        if (stmt.next) {
            if (((stmt.type === 'continueStatement' || stmt.next.type === 'loopStatement') && stmt.next.block) || stmt.next.type.includes('exit')) {
                return null;
            }
            stmt.next.passTmies++;
            if (stmt.next.passTmies === stmt.next.lasts.size || stmt.next.type === 'loopStatement' || stmt.next.isDoWhile) {
                if (
                    stmt.next.scopeID !== stmt.scopeID &&
                    !(stmt.next instanceof ConditionStatementBuilder && stmt.next.doStatement) &&
                    !(ts.isCaseClause(stmt.astNode!) || ts.isDefaultClause(stmt.astNode!))
                ) {
                    stmtQueue.push(stmt.next);
                    return null;
                }
                return stmt.next;
            }
        }
        return null;
    }

    addStmt2BlockStmtQueue(stmt: StatementBuilder, stmtQueue: StatementBuilder[]): StatementBuilder | null {
        if (stmt instanceof ConditionStatementBuilder) {
            stmtQueue.push(stmt.nextF!);
            stmtQueue.push(stmt.nextT!);
        } else if (stmt instanceof SwitchStatementBuilder) {
            if (stmt.nexts.length === 0) {
                stmtQueue.push(stmt.afterSwitch!);
            }
            for (let i = stmt.nexts.length - 1; i >= 0; i--) {
                stmtQueue.push(stmt.nexts[i]);
            }
        } else if (stmt instanceof TryStatementBuilder) {
            if (stmt.finallyStatement) {
                stmtQueue.push(stmt.finallyStatement);
            }
            if (stmt.catchStatement) {
                stmtQueue.push(stmt.catchStatement);
            }
            if (stmt.tryFirst) {
                stmtQueue.push(stmt.tryFirst);
            }
        } else if (stmt.next) {
            return this.addStmt2BlockStmtQueueInSpecialCase(stmt, stmtQueue);
        }
        return null;
    }

    buildBlocks(): void {
        const stmtQueue = [this.entry];
        const handledStmts: Set<StatementBuilder> = new Set();
        while (stmtQueue.length > 0) {
            let stmt = stmtQueue.pop()!;
            if (stmt.type.includes('exit')) {
                continue;
            }
            if (handledStmts.has(stmt)) {
                continue;
            }
            const block = new BlockBuilder(this.blocks.length, []);
            this.blocks.push(block);
            while (stmt && !handledStmts.has(stmt)) {
                if (stmt.type === 'loopStatement' && block.stmts.length > 0 && !stmt.isDoWhile) {
                    stmtQueue.push(stmt);
                    break;
                }
                if (stmt.type.includes('Exit')) {
                    break;
                }
                block.stmts.push(stmt);
                stmt.block = block;
                handledStmts.add(stmt);
                const addRet = this.addStmt2BlockStmtQueue(stmt, stmtQueue);
                if (addRet instanceof StatementBuilder) {
                    stmt = addRet;
                } else {
                    break;
                }
            }
        }
    }

    buildConditionNextBlocks(originStatement: ConditionStatementBuilder, block: BlockBuilder, isLastStatement: boolean): void {
        let nextT = originStatement.nextT?.block;
        if (nextT && (isLastStatement || nextT !== block) && !originStatement.nextT?.type.includes(' exit')) {
            block.nexts.push(nextT);
            nextT.lasts.push(block);
        }
        let nextF = originStatement.nextF?.block;
        if (nextF && (isLastStatement || nextF !== block) && !originStatement.nextF?.type.includes(' exit')) {
            block.nexts.push(nextF);
            nextF.lasts.push(block);
        }
    }

    buildSwitchNextBlocks(originStatement: SwitchStatementBuilder, block: BlockBuilder, isLastStatement: boolean): void {
        if (originStatement.nexts.length === 0) {
            const nextBlock = originStatement.afterSwitch!.block;
            if (nextBlock && (isLastStatement || nextBlock !== block)) {
                block.nexts.push(nextBlock);
                nextBlock.lasts.push(block);
            }
        }
        for (const next of originStatement.nexts) {
            const nextBlock = next.block;
            if (nextBlock && (isLastStatement || nextBlock !== block)) {
                block.nexts.push(nextBlock);
                nextBlock.lasts.push(block);
            }
        }
    }

    buildNormalNextBlocks(originStatement: StatementBuilder, block: BlockBuilder, isLastStatement: boolean): void {
        let next = originStatement.next?.block;
        if (next && (isLastStatement || next !== block) && !originStatement.next?.type.includes(' exit')) {
            block.nexts.push(next);
            next.lasts.push(block);
        }
    }

    buildBlocksNextLast(): void {
        for (let block of this.blocks) {
            for (let originStatement of block.stmts) {
                let isLastStatement = block.stmts.indexOf(originStatement) === block.stmts.length - 1;
                if (originStatement instanceof ConditionStatementBuilder) {
                    this.buildConditionNextBlocks(originStatement, block, isLastStatement);
                } else if (originStatement instanceof SwitchStatementBuilder) {
                    this.buildSwitchNextBlocks(originStatement, block, isLastStatement);
                } else {
                    this.buildNormalNextBlocks(originStatement, block, isLastStatement);
                }
            }
        }
    }

    addReturnBlock(returnStatement: StatementBuilder, notReturnStmts: StatementBuilder[]): void {
        let returnBlock = new BlockBuilder(this.blocks.length, [returnStatement]);
        returnStatement.block = returnBlock;
        this.blocks.push(returnBlock);
        for (const notReturnStmt of notReturnStmts) {
            if (notReturnStmt instanceof ConditionStatementBuilder) {
                if (this.exit === notReturnStmt.nextT) {
                    notReturnStmt.nextT = returnStatement;
                    notReturnStmt.block?.nexts.splice(0, 0, returnBlock);
                } else if (this.exit === notReturnStmt.nextF) {
                    notReturnStmt.nextF = returnStatement;
                    notReturnStmt.block?.nexts.push(returnBlock);
                }
            } else {
                notReturnStmt.next = returnStatement;
                notReturnStmt.block?.nexts.push(returnBlock);
            }
            returnStatement.lasts.add(notReturnStmt);
            returnStatement.next = this.exit;
            const lasts = [...this.exit.lasts];
            lasts[lasts.indexOf(notReturnStmt)] = returnStatement;
            this.exit.lasts = new Set(lasts);
            returnBlock.lasts.push(notReturnStmt.block!);
        }
        this.exit.block = returnBlock;
    }

    addReturnStmt(): void {
        let notReturnStmts: StatementBuilder[] = [];
        for (let stmt of [...this.exit.lasts]) {
            if (stmt.type !== 'returnStatement') {
                notReturnStmts.push(stmt);
            }
        }
        if (notReturnStmts.length < 1) {
            return;
        }
        const returnStatement = new StatementBuilder('returnStatement', 'return;', null, this.exit.scopeID);
        let TryOrSwitchExit = false;
        if (notReturnStmts.length === 1 && notReturnStmts[0].block) {
            let p: ts.Node | null = notReturnStmts[0].astNode;
            while (p && p !== this.astRoot) {
                if (ts.isTryStatement(p) || ts.isSwitchStatement(p)) {
                    TryOrSwitchExit = true;
                    break;
                }
                p = p.parent;
            }
        }
        if (notReturnStmts.length === 1 && !(notReturnStmts[0] instanceof ConditionStatementBuilder) && !TryOrSwitchExit) {
            const notReturnStmt = notReturnStmts[0];
            notReturnStmt.next = returnStatement;
            returnStatement.lasts = new Set([notReturnStmt]);
            returnStatement.next = this.exit;
            const lasts = [...this.exit.lasts];
            lasts[lasts.indexOf(notReturnStmt)] = returnStatement;
            this.exit.lasts = new Set(lasts);
            notReturnStmt.block?.stmts.push(returnStatement);
            returnStatement.block = notReturnStmt.block;
        } else {
            this.addReturnBlock(returnStatement, notReturnStmts);
        }
    }

    resetWalked(): void {
        for (let stmt of this.statementArray) {
            stmt.walked = false;
        }
    }

    addStmtBuilderPosition(): void {
        for (const stmt of this.statementArray) {
            if (stmt.astNode) {
                const { line, character } = ts.getLineAndCharacterOfPosition(this.sourceFile, stmt.astNode.getStart(this.sourceFile));
                stmt.line = line + 1;
                stmt.column = character + 1;
            }
        }
    }

    CfgBuilder2Array(stmt: StatementBuilder): void {
        if (stmt.walked) {
            return;
        }
        stmt.walked = true;
        stmt.index = this.statementArray.length;
        if (!stmt.type.includes(' exit')) {
            this.statementArray.push(stmt);
        }
        if (stmt.type === 'ifStatement' || stmt.type === 'loopStatement' || stmt.type === 'catchOrNot') {
            let cstm = stmt as ConditionStatementBuilder;
            if (cstm.nextT == null || cstm.nextF == null) {
                this.errorTest(cstm);
                return;
            }
            this.CfgBuilder2Array(cstm.nextF);
            this.CfgBuilder2Array(cstm.nextT);
        } else if (stmt.type === 'switchStatement') {
            let sstm = stmt as SwitchStatementBuilder;
            for (let ss of sstm.nexts) {
                this.CfgBuilder2Array(ss);
            }
        } else if (stmt.type === 'tryStatement') {
            let trystm = stmt as TryStatementBuilder;
            if (trystm.tryFirst) {
                this.CfgBuilder2Array(trystm.tryFirst);
            }
            if (trystm.catchStatement) {
                this.CfgBuilder2Array(trystm.catchStatement);
            }
            if (trystm.finallyStatement) {
                this.CfgBuilder2Array(trystm.finallyStatement);
            }
            if (trystm.next) {
                this.CfgBuilder2Array(trystm.next);
            }
        } else {
            if (stmt.next != null) {
                this.CfgBuilder2Array(stmt.next);
            }
        }
    }

    getDotEdges(stmt: StatementBuilder): void {
        if (this.statementArray.length === 0) {
            this.CfgBuilder2Array(this.entry);
        }
        if (stmt.walked) {
            return;
        }
        stmt.walked = true;
        if (stmt.type === 'ifStatement' || stmt.type === 'loopStatement' || stmt.type === 'catchOrNot') {
            let cstm = stmt as ConditionStatementBuilder;
            if (cstm.nextT == null || cstm.nextF == null) {
                this.errorTest(cstm);
                return;
            }
            let edge = [cstm.index, cstm.nextF.index];
            this.dotEdges.push(edge);
            edge = [cstm.index, cstm.nextT.index];
            this.dotEdges.push(edge);
            this.getDotEdges(cstm.nextF);
            this.getDotEdges(cstm.nextT);
        } else if (stmt.type === 'switchStatement') {
            let sstm = stmt as SwitchStatementBuilder;
            for (let ss of sstm.nexts) {
                let edge = [sstm.index, ss.index];
                this.dotEdges.push(edge);
                this.getDotEdges(ss);
            }
        } else {
            if (stmt.next != null) {
                let edge = [stmt.index, stmt.next.index];
                this.dotEdges.push(edge);
                this.getDotEdges(stmt.next);
            }
        }
    }

    errorTest(stmt: StatementBuilder): void {
        let mes = 'ifnext error    ';
        if (this.declaringClass?.getDeclaringArkFile()) {
            mes += this.declaringClass?.getDeclaringArkFile().getName() + '.' + this.declaringClass.getName() + '.' + this.name;
        }
        mes += '\n' + stmt.code;
        throw new TextError(mes);
    }

    buildStatementBuilder4ArrowFunction(stmt: ts.Node): void {
        let s = new StatementBuilder('statement', stmt.getText(this.sourceFile), stmt, 0);
        this.entry.next = s;
        s.lasts = new Set([this.entry]);
        s.next = this.exit;
        this.exit.lasts = new Set([s]);
    }

    buildCfgBuilder(): void {
        let stmts: ts.Node[] = [];
        if (ts.isSourceFile(this.astRoot)) {
            stmts = [...this.astRoot.statements];
        } else if (
            ts.isFunctionDeclaration(this.astRoot) ||
            ts.isMethodDeclaration(this.astRoot) ||
            ts.isConstructorDeclaration(this.astRoot) ||
            ts.isGetAccessorDeclaration(this.astRoot) ||
            ts.isSetAccessorDeclaration(this.astRoot) ||
            ts.isFunctionExpression(this.astRoot) ||
            ts.isClassStaticBlockDeclaration(this.astRoot)
        ) {
            if (this.astRoot.body) {
                stmts = [...this.astRoot.body.statements];
            } else {
                this.emptyBody = true;
            }
        } else if (ts.isArrowFunction(this.astRoot)) {
            if (ts.isBlock(this.astRoot.body)) {
                stmts = [...this.astRoot.body.statements];
            }
        } else if (
            ts.isMethodSignature(this.astRoot) ||
            ts.isConstructSignatureDeclaration(this.astRoot) ||
            ts.isCallSignatureDeclaration(this.astRoot) ||
            ts.isFunctionTypeNode(this.astRoot)
        ) {
            this.emptyBody = true;
        } else if (ts.isModuleDeclaration(this.astRoot) && ts.isModuleBlock(this.astRoot.body!)) {
            stmts = [...this.astRoot.body.statements];
        }
        if (!ModelUtils.isArkUIBuilderMethod(this.declaringMethod)) {
            this.walkAST(this.entry, this.exit, stmts);
        } else {
            this.handleBuilder(stmts);
        }
        if (ts.isArrowFunction(this.astRoot) && !ts.isBlock(this.astRoot.body)) {
            this.buildStatementBuilder4ArrowFunction(this.astRoot.body);
        }
        this.addReturnInEmptyMethod();
        this.deleteExit();
        this.CfgBuilder2Array(this.entry);
        this.addStmtBuilderPosition();
        this.buildBlocks();
        this.blocks = this.blocks.filter(b => b.stmts.length !== 0);
        this.buildBlocksNextLast();
        this.addReturnStmt();
    }

    private handleBuilder(stmts: ts.Node[]): void {
        let lastStmt = this.entry;
        for (const stmt of stmts) {
            const stmtBuilder = new StatementBuilder('statement', stmt.getText(this.sourceFile), stmt, 0);
            lastStmt.next = stmtBuilder;
            stmtBuilder.lasts.add(lastStmt);
            lastStmt = stmtBuilder;
        }
        lastStmt.next = this.exit;
        this.exit.lasts.add(lastStmt);
    }

    public isBodyEmpty(): boolean {
        return this.emptyBody;
    }

    public buildCfg(): {
        cfg: Cfg;
        locals: Set<Local>;
        globals: Map<string, GlobalRef> | null;
        aliasTypeMap: Map<string, [AliasType, ArkAliasTypeDefineStmt]>;
        traps: Trap[];
    } {
        if (ts.isArrowFunction(this.astRoot) && !ts.isBlock(this.astRoot.body)) {
            return this.buildCfgForSimpleArrowFunction();
        }

        return this.buildNormalCfg();
    }

    public buildCfgForSimpleArrowFunction(): {
        cfg: Cfg;
        locals: Set<Local>;
        globals: Map<string, GlobalRef> | null;
        aliasTypeMap: Map<string, [AliasType, ArkAliasTypeDefineStmt]>;
        traps: Trap[];
    } {
        const stmts: Stmt[] = [];
        const arkIRTransformer = new ArkIRTransformer(this.sourceFile, this.declaringMethod);
        arkIRTransformer.prebuildStmts().forEach(stmt => stmts.push(stmt));
        const expressionBodyNode = (this.astRoot as ts.ArrowFunction).body as ts.Expression;
        const expressionBodyStmts: Stmt[] = [];
        let {
            value: expressionBodyValue,
            valueOriginalPositions: expressionBodyPositions,
            stmts: tempStmts,
        } = arkIRTransformer.tsNodeToValueAndStmts(expressionBodyNode);
        tempStmts.forEach(stmt => expressionBodyStmts.push(stmt));
        if (IRUtils.moreThanOneAddress(expressionBodyValue)) {
            ({
                value: expressionBodyValue,
                valueOriginalPositions: expressionBodyPositions,
                stmts: tempStmts,
            } = arkIRTransformer.generateAssignStmtForValue(expressionBodyValue, expressionBodyPositions));
            tempStmts.forEach(stmt => expressionBodyStmts.push(stmt));
        }
        const returnStmt = new ArkReturnStmt(expressionBodyValue);
        returnStmt.setOperandOriginalPositions([expressionBodyPositions[0], ...expressionBodyPositions]);
        expressionBodyStmts.push(returnStmt);
        arkIRTransformer.mapStmtsToTsStmt(expressionBodyStmts, expressionBodyNode);
        expressionBodyStmts.forEach(stmt => stmts.push(stmt));
        const cfg = new Cfg();
        const blockInCfg = new BasicBlock();
        blockInCfg.setId(0);
        stmts.forEach(stmt => {
            blockInCfg.addStmt(stmt);
            stmt.setCfg(cfg);
        });
        cfg.addBlock(blockInCfg);
        cfg.setStartingStmt(stmts[0]);
        return {
            cfg: cfg,
            locals: arkIRTransformer.getLocals(),
            globals: arkIRTransformer.getGlobals(),
            aliasTypeMap: arkIRTransformer.getAliasTypeMap(),
            traps: [],
        };
    }

    public buildNormalCfg(): {
        cfg: Cfg;
        locals: Set<Local>;
        globals: Map<string, GlobalRef> | null;
        aliasTypeMap: Map<string, [AliasType, ArkAliasTypeDefineStmt]>;
        traps: Trap[];
    } {
        const { blockBuilderToCfgBlock, basicBlockSet, arkIRTransformer } = this.initializeBuild();
        const { blocksContainLoopCondition, blockBuildersBeforeTry, blockBuildersContainSwitch, valueAndStmtsOfSwitchAndCasesAll } = this.processBlocks(
            blockBuilderToCfgBlock,
            basicBlockSet,
            arkIRTransformer
        );

        const currBlockId = this.blocks.length;
        this.linkBasicBlocks(blockBuilderToCfgBlock);
        this.adjustBlocks(
            blockBuilderToCfgBlock,
            blocksContainLoopCondition,
            basicBlockSet,
            blockBuildersContainSwitch,
            valueAndStmtsOfSwitchAndCasesAll,
            arkIRTransformer
        );

        const trapBuilder = new TrapBuilder();
        const traps = trapBuilder.buildTraps(blockBuilderToCfgBlock, blockBuildersBeforeTry, arkIRTransformer, basicBlockSet);

        const cfg = this.createCfg(blockBuilderToCfgBlock, basicBlockSet, currBlockId);
        return {
            cfg,
            locals: arkIRTransformer.getLocals(),
            globals: arkIRTransformer.getGlobals(),
            aliasTypeMap: arkIRTransformer.getAliasTypeMap(),
            traps,
        };
    }

    private initializeBuild(): {
        blockBuilderToCfgBlock: Map<BlockBuilder, BasicBlock>;
        basicBlockSet: Set<BasicBlock>;
        arkIRTransformer: ArkIRTransformer;
    } {
        const blockBuilderToCfgBlock = new Map<BlockBuilder, BasicBlock>();
        const basicBlockSet = new Set<BasicBlock>();
        const arkIRTransformer = new ArkIRTransformer(this.sourceFile, this.declaringMethod);
        return { blockBuilderToCfgBlock, basicBlockSet, arkIRTransformer };
    }

    private processBlocks(
        blockBuilderToCfgBlock: Map<BlockBuilder, BasicBlock>,
        basicBlockSet: Set<BasicBlock>,
        arkIRTransformer: ArkIRTransformer
    ): {
        blocksContainLoopCondition: Set<BlockBuilder>;
        blockBuildersBeforeTry: Set<BlockBuilder>;
        blockBuildersContainSwitch: BlockBuilder[];
        valueAndStmtsOfSwitchAndCasesAll: ValueAndStmts[][];
    } {
        const blocksContainLoopCondition = new Set<BlockBuilder>();
        const blockBuildersBeforeTry = new Set<BlockBuilder>();
        const blockBuildersContainSwitch: BlockBuilder[] = [];
        const valueAndStmtsOfSwitchAndCasesAll: ValueAndStmts[][] = [];
        for (let i = 0; i < this.blocks.length; i++) {
            const stmtsInBlock: Stmt[] = [];
            if (i === 0) {
                arkIRTransformer.prebuildStmts().forEach(stmt => stmtsInBlock.push(stmt));
            }
            const stmtsCnt = this.blocks[i].stmts.length;
            if (this.blocks[i].stmts[stmtsCnt - 1].type === 'tryStatement') {
                blockBuildersBeforeTry.add(this.blocks[i]);
            }
            for (const statementBuilder of this.blocks[i].stmts) {
                if (statementBuilder.type === 'loopStatement') {
                    blocksContainLoopCondition.add(this.blocks[i]);
                } else if (statementBuilder instanceof SwitchStatementBuilder) {
                    blockBuildersContainSwitch.push(this.blocks[i]);
                    const valueAndStmtsOfSwitchAndCases = arkIRTransformer.switchStatementToValueAndStmts(statementBuilder.astNode as ts.SwitchStatement);
                    valueAndStmtsOfSwitchAndCasesAll.push(valueAndStmtsOfSwitchAndCases);
                    continue;
                }
                if (statementBuilder.astNode && statementBuilder.code !== '') {
                    arkIRTransformer.tsNodeToStmts(statementBuilder.astNode).forEach(s => stmtsInBlock.push(s));
                } else if (statementBuilder.code.startsWith('return')) {
                    stmtsInBlock.push(this.generateReturnStmt(arkIRTransformer));
                }
            }
            const blockInCfg = new BasicBlock();
            blockInCfg.setId(this.blocks[i].id);
            for (const stmt of stmtsInBlock) {
                blockInCfg.addStmt(stmt);
            }
            basicBlockSet.add(blockInCfg);
            blockBuilderToCfgBlock.set(this.blocks[i], blockInCfg);
        }
        return {
            blocksContainLoopCondition,
            blockBuildersBeforeTry,
            blockBuildersContainSwitch,
            valueAndStmtsOfSwitchAndCasesAll,
        };
    }

    private generateReturnStmt(arkIRTransformer: ArkIRTransformer): Stmt {
        if (this.name === CONSTRUCTOR_NAME) {
            this.declaringMethod.getSubSignature().setReturnType(arkIRTransformer.getThisLocal().getType());
            return new ArkReturnStmt(arkIRTransformer.getThisLocal());
        }
        if (this.declaringMethod.getSubSignature().getReturnType() instanceof UnknownType && !this.declaringMethod.getAsteriskToken()) {
            if (this.declaringMethod.containsModifier(ModifierType.ASYNC)) {
                const promise = this.declaringMethod.getDeclaringArkFile().getScene().getSdkGlobal(PROMISE);
                if (promise instanceof ArkClass) {
                    this.declaringMethod.getSubSignature().setReturnType(new ClassType(promise.getSignature()));
                } else {
                    this.declaringMethod.getSubSignature().setReturnType(new UnclearReferenceType(PROMISE, [VoidType.getInstance()]));
                }
            } else {
                this.declaringMethod.getSubSignature().setReturnType(VoidType.getInstance());
            }
        }
        return new ArkReturnVoidStmt();
    }

    private adjustBlocks(
        blockBuilderToCfgBlock: Map<BlockBuilder, BasicBlock>,
        blocksContainLoopCondition: Set<BlockBuilder>,
        basicBlockSet: Set<BasicBlock>,
        blockBuildersContainSwitch: BlockBuilder[],
        valueAndStmtsOfSwitchAndCasesAll: ValueAndStmts[][],
        arkIRTransformer: ArkIRTransformer
    ): void {
        const loopBuilder = new LoopBuilder();
        loopBuilder.rebuildBlocksInLoop(blockBuilderToCfgBlock, blocksContainLoopCondition, basicBlockSet, this.blocks);
        const switchBuilder = new SwitchBuilder();
        switchBuilder.buildSwitch(blockBuilderToCfgBlock, blockBuildersContainSwitch, valueAndStmtsOfSwitchAndCasesAll, arkIRTransformer, basicBlockSet);
        const conditionalBuilder = new ConditionBuilder();
        conditionalBuilder.rebuildBlocksContainConditionalOperator(basicBlockSet, ModelUtils.isArkUIBuilderMethod(this.declaringMethod));
    }

    private createCfg(blockBuilderToCfgBlock: Map<BlockBuilder, BasicBlock>, basicBlockSet: Set<BasicBlock>, prevBlockId: number): Cfg {
        let currBlockId = prevBlockId;
        for (const blockBuilder of this.blocks) {
            if (blockBuilder.id === -1) {
                blockBuilder.id = currBlockId++;
                const block = blockBuilderToCfgBlock.get(blockBuilder) as BasicBlock;
                block.setId(blockBuilder.id);
            }
        }

        const cfg = new Cfg();
        const startingBasicBlock = blockBuilderToCfgBlock.get(this.blocks[0])!;
        cfg.setStartingStmt(startingBasicBlock.getStmts()[0]);
        currBlockId = 0;
        for (const basicBlock of basicBlockSet) {
            basicBlock.setId(currBlockId++);
            cfg.addBlock(basicBlock);
        }
        for (const stmt of cfg.getStmts()) {
            stmt.setCfg(cfg);
        }
        return cfg;
    }

    private linkBasicBlocks(blockBuilderToCfgBlock: Map<BlockBuilder, BasicBlock>): void {
        for (const [blockBuilder, cfgBlock] of blockBuilderToCfgBlock) {
            for (const successorBlockBuilder of blockBuilder.nexts) {
                if (!blockBuilderToCfgBlock.get(successorBlockBuilder)) {
                    continue;
                }
                const successorBlock = blockBuilderToCfgBlock.get(successorBlockBuilder) as BasicBlock;
                cfgBlock.addSuccessorBlock(successorBlock);
            }
            for (const predecessorBlockBuilder of blockBuilder.lasts) {
                if (!blockBuilderToCfgBlock.get(predecessorBlockBuilder)) {
                    continue;
                }
                const predecessorBlock = blockBuilderToCfgBlock.get(predecessorBlockBuilder) as BasicBlock;
                cfgBlock.addPredecessorBlock(predecessorBlock);
            }
        }
    }
}
