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

import { Local } from '../../../../core/base/Local';
import { ArkAliasTypeDefineStmt, ArkReturnStmt, ArkReturnVoidStmt, Stmt } from '../../../../core/base/Stmt';
import { BasicBlock } from '../../../../core/graph/BasicBlock';
import { Cfg } from '../../../../core/graph/Cfg';
import { ArkClass } from '../../../../core/model/ArkClass';
import { ArkMethod } from '../../../../core/model/ArkMethod';
import { ArkCxxIRTransformer, ValueAndStmts } from '../../common/ArkIRTransformer';
import { IRUtils } from '../../common/IRUtils';
import { AliasType, ClassType, UnclearReferenceType, UnknownType, VoidType } from '../../../../core/base/Type';
import { CxxTrap } from '../../base/Trap';
import { GlobalRef } from '../../../../core/base/Ref';
import { CxxSwitchBuilder } from './SwitchBuilder';
import { CxxConditionBuilder } from './ConditionBuilder';
import { CxxTrapBuilder } from './TrapBuilder';
import { ModifierType } from '../../../../core/model/ArkBaseModel';
import { BlockBuilder as CoreBlockBuilder, Catch, TextError, Variable, Scope } from '../../../../core/graph/builder/CfgBuilder';
import { ModelUtils } from '../../../../core/common/ModelUtils';
import { CONSTRUCTOR_NAME, PROMISE } from '../../../../core/common/TSConst';
import { astKind, CxxAstNode, CxxTranslationUnit } from '../../ast/ArkCxxAstNode';
import { CxxLoopBuilder } from './LoopBuilder';
import { CxxIfBuilder } from './IfBuilder';

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

export class Case {
    value: string;
    stmt: StatementBuilder;
    valueNode!: CxxAstNode;

    constructor(value: string, stmt: StatementBuilder) {
        this.value = value;
        this.stmt = stmt;
    }
}

export class StatementBuilder {
    type: string;
    // Source code corresponding to the node
    code: string;
    next: StatementBuilder | null;
    lasts: Set<StatementBuilder>;
    walked: boolean;
    index: number;
    // TODO:The following two properties need to be obtained
    line: number; // Line number: ast node stores a start value as the starting address of this code, you can count how many line
    column: number; // Column
    astNode: CxxAstNode | null; // Ast node object
    scopeID: number;
    addressCode3: string[] = [];
    block: BlockBuilder | null;
    ifExitPass: boolean;
    passTimes: number = 0;
    numOfIdentifier: number = 0;
    isDoWhile: boolean = false;
    hasDoWhileBody: boolean = false;
    constructor(type: string, code: string, astNode: CxxAstNode | null, scopeID: number) {
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

    constructor(type: string, code: string, astNode: CxxAstNode, scopeID: number) {
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

    constructor(type: string, code: string, astNode: CxxAstNode, scopeID: number) {
        super(type, code, astNode, scopeID);
        this.nexts = [];
    }
}

export class TryStatementBuilder extends StatementBuilder {
    tryFirst: StatementBuilder | null = null;
    tryExit: StatementBuilder | null = null;
    catchStatement: StatementBuilder[] = [];
    catchError: CxxAstNode[] = [];
    finallyStatement: StatementBuilder | null = null;
    afterFinal: StatementBuilder | null = null;

    constructor(type: string, code: string, astNode: CxxAstNode, scopeID: number) {
        super(type, code, astNode, scopeID);
    }
}

export class CfgBuilder {
    name: string;
    astRoot: CxxAstNode;
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

    private sourceFile: CxxAstNode;
    private declaringMethod: ArkMethod;
    private gotoStmtMap: Map<string, StatementBuilder[]>;
    private labelStmtMap: Map<string, StatementBuilder>;

    constructor(ast: CxxAstNode, name: string, declaringMethod: ArkMethod, sourceFile: CxxAstNode) {
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
        this.gotoStmtMap = new Map();
        this.labelStmtMap = new Map();
    }

    public getDeclaringMethod(): ArkMethod {
        return this.declaringMethod;
    }

    judgeLastType(s: StatementBuilder, lastStatement: StatementBuilder): void {
        if (lastStatement.type === 'ifStatement') {
            let lastIf = lastStatement as ConditionStatementBuilder;
            if (lastIf.nextT === null) {
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
            // Process the passTimes when multiple goto entries exist in a node
            if (lastStatement.code.includes('goto label:') &&
                lastStatement.lasts.size > 1 && s.passTimes === 0) {
                s.passTimes += (lastStatement.lasts.size - 1);
            }
        }
    }

    ASTNodeBreakStatement(c: CxxAstNode, lastStatement: StatementBuilder): void {
        let p: CxxAstNode | null = c;
        while (p && p.id !== this.astRoot.id) {
            let pKind = p.kind.toString();
            if (pKind === 'WhileStmt' || pKind === 'DoStmt' || pKind === 'ForStmt') {
                const lastLoopNextF = this.loopStack[this.loopStack.length - 1].nextF!;
                this.judgeLastType(lastLoopNextF, lastStatement);
                lastLoopNextF.lasts.add(lastStatement);
                return;
            }
            if (pKind === 'CaseStmt' || pKind === 'DefaultStmt') {
                const lastSwitchExit = this.switchExitStack[this.switchExitStack.length - 1];
                this.judgeLastType(lastSwitchExit, lastStatement);
                lastSwitchExit.lasts.add(lastStatement);
                return;
            }
            p = (p.parent ?? p.getParent?.(true)) ?? null;
        }
    }

    ASTNodeIfStatement(c: CxxAstNode, lastStatement: StatementBuilder, scopeID: number): StatementBuilder {
        let ifstm: ConditionStatementBuilder = new ConditionStatementBuilder('ifStatement', 'IfStmt', c, scopeID);
        this.judgeLastType(ifstm, lastStatement);
        let ifexit: StatementBuilder = new StatementBuilder('ifExit', '', c, scopeID);
        this.exits.push(ifexit);
        ifstm.condition = c.inner[0].code;
        ifstm.code = 'if (' + ifstm.condition + ')';
        if (c.inner.length >= 2) { // length >= 2 means there is a condition and a body
            if (c.inner[1].kind === astKind.CompoundStmt) {
                // Body is a braced block { ... }
                this.walkAST(ifstm, ifexit, [...c.inner[1].inner]);
            } else {
                // Reaching this branch means there's no braces {}
                this.walkAST(ifstm, ifexit, [c.inner[1]]);
            }
        } else if (c.inner.length === 1) {
            // Only one child; treat it as the body
            this.walkAST(ifstm, ifexit, [c.inner[0]]);
        }
        if (c.inner.length > 2) {
            if (c.inner[2].kind === astKind.CompoundStmt) {
                // Handle else here
                this.walkAST(ifstm, ifexit, [...c.inner[2].inner]);
            } else {
                // Handle else-if here
                this.walkAST(ifstm, ifexit, [c.inner[2]]);
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

    ASTNodeWhileStatement(c: CxxAstNode, lastStatement: StatementBuilder, scopeID: number): StatementBuilder {
        this.breakin = 'loop';
        let loopstm = new ConditionStatementBuilder('loopStatement', '', c, scopeID);
        this.loopStack.push(loopstm);
        this.judgeLastType(loopstm, lastStatement);
        let loopExit = new StatementBuilder('loopExit', '', c, scopeID);
        this.exits.push(loopExit);
        loopstm.nextF = loopExit;
        loopExit.lasts.add(loopstm);
        loopstm.condition = c.inner[0].code;
        loopstm.code = 'while (' + loopstm.condition + ')';
        if (c.inner.length >= 2) {
            if (c.inner[1].kind === astKind.CompoundStmt) {
                this.walkAST(loopstm, loopstm, [...c.inner[1].inner]);
            } else {
                this.walkAST(loopstm, loopstm, [c.inner[1]]);
            }
        } else if (c.inner.length === 1 && c.inner[0].kind.toString() === astKind.CompoundStmt) {
            this.walkAST(loopstm, loopstm, [c.inner[0]]);
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

    getPrefix(s: string, varName: string): string {
        const index = s.indexOf(varName);
        if (index === -1) {
            return s;
        }
        return s.substring(0, index);
    }

    ASTNodeForStatement(c: CxxAstNode, lastStatement: StatementBuilder, scopeID: number): StatementBuilder {
        this.breakin = 'loop';
        let loopstm = new ConditionStatementBuilder('loopStatement', '', c, scopeID);
        this.loopStack.push(loopstm);
        this.judgeLastType(loopstm, lastStatement);
        let loopExit = new StatementBuilder('loopExit', '', c, scopeID);
        this.exits.push(loopExit);
        loopstm.nextF = loopExit;
        loopExit.lasts.add(loopstm);
        loopstm.code = this.getPrefix(c.code, ' {\r\n');
        if (c.inner[c.inner.length - 1].kind === astKind.CompoundStmt) {
            this.walkAST(loopstm, loopstm, [...c.inner[c.inner.length - 1].inner]);
        } else {
            this.walkAST(loopstm, loopstm, [c.inner[c.inner.length - 1]]);
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

    ASTNodeDoStatement(c: CxxAstNode, lastStatement: StatementBuilder, scopeID: number): StatementBuilder {
        this.breakin = 'loop';
        let loopstm = new ConditionStatementBuilder('loopStatement', '', c, scopeID);
        this.loopStack.push(loopstm);
        let loopExit = new StatementBuilder('loopExit', '', c, scopeID);
        this.exits.push(loopExit);
        loopstm.nextF = loopExit;
        loopExit.lasts.add(loopstm);
        loopstm.condition = c.inner[1].code;
        loopstm.code = 'while (' + loopstm.condition + ')';
        loopstm.isDoWhile = true;
        for (let idx = 0; idx < c.inner[0].inner.length; idx++) {
            let kind = c.inner[0].inner[idx].kind;
            if (kind !== 'NullStmt') {
                loopstm.hasDoWhileBody = true;
            }
        }
        if (c.inner[0].kind.toString() === 'CompoundStmt') {
            this.walkAST(lastStatement, loopstm, [...c.inner[0].inner]);
        } else {
            this.walkAST(lastStatement, loopstm, [c.inner[0]]);
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

    private sliceCaseDefaultNode(node: CxxAstNode, clauses: CxxAstNode[]): void {
        if (node.kind === 'CaseStmt') {
            for (let i = 0; i < node.inner.length; i++) {
                let isCaseOrDefault = node.inner[i].kind === astKind.CaseStmt || node.inner[i].kind === astKind.DefaultStmt;
                if (isCaseOrDefault) {
                    clauses.push(node);
                    this.sliceCaseDefaultNode(node.inner[i], clauses);
                }
                if (i === node.inner.length - 1 && !isCaseOrDefault) {
                    clauses.push(node);
                }
            }
        } else {
            // Divide subsequent nodes into cases
            clauses.push(node);
        }
    }

    // Convert cpp's case-default ast format to TS's caseClause/defaultClause
    private getCaseDefClauseAsts(switchNode: CxxAstNode): CxxAstNode[] {
        // When cpp parses case: without statements and no break,
        // it will treat the following case/default as inner nodes of that case,
        // so the original ast needs to be split into individual cases and defaults
        let length = switchNode.inner.length;
        let tempClauses: CxxAstNode[] = [];
        for (let node of switchNode.inner[length - 1].inner) {
            this.sliceCaseDefaultNode(node, tempClauses);
        }
        // When there are no case brackets, case and break/continue are separate nodes in cpp,
        // here we add the break/continue nodes as inner members of case or default nodes
        return tempClauses.reduce((acc: CxxAstNode[], curr: CxxAstNode, idx: number, arr: CxxAstNode[]) => {
            if (['CaseStmt', 'DefaultStmt'].includes(curr.kind)) {
                curr.parent = switchNode.inner[length - 1];
                // Reconstruct the syntax tree structure
                while (idx + 1 < arr.length && !([astKind.CaseStmt, astKind.DefaultStmt] as string[]).includes(arr[idx + 1].kind)) {
                    arr[idx + 1].parent = curr;
                    curr.inner.push(arr[idx + 1]);
                    idx++;
                }
                acc.push(curr);
            }
            return acc;
        }, [] as CxxAstNode[]);
    }

    ASTNodeSwitchStatement(c: CxxAstNode, lastStatement: StatementBuilder, scopeID: number): StatementBuilder {
        // In the switchNode node, inner [length-1] is Case related and inner [length-2] is a switch variable, which may be preceded by a declaration statement
        this.breakin = 'switch';
        let switchstm = new SwitchStatementBuilder('switchStatement', '', c, scopeID);
        this.judgeLastType(switchstm, lastStatement);
        let switchExit = new StatementBuilder('switchExit', '', null, scopeID);
        this.exits.push(switchExit);
        this.switchExitStack.push(switchExit);
        switchExit.lasts.add(switchstm);
        switchstm.code = 'switch (' + c.inner[0].code + ')';
        let lastCaseExit: StatementBuilder | null = null;
        c.inner[c.inner.length - 1].inner = this.getCaseDefClauseAsts(c);
        const astNodeCase = c.inner[c.inner.length - 1];
        for (let i = 0; i < astNodeCase.inner.length; i++) {
            const clause = astNodeCase.inner[i];
            let casestm: StatementBuilder;
            let caseBody: CxxAstNode[] = [...clause.inner];
            if (clause.kind.toString() === 'CaseStmt') {
                casestm = new StatementBuilder('statement', 'case ' + clause.inner[0].code + ':', clause, scopeID);
                caseBody = caseBody.slice(1);
            } else {
                casestm = new StatementBuilder('statement', 'default:', clause, scopeID);
            }
            switchstm.nexts.push(casestm);
            casestm.lasts.add(switchstm);
            let caseExit = new StatementBuilder('caseExit', '', null, scopeID);
            this.exits.push(caseExit);
            this.walkAST(casestm, caseExit, caseBody);
            if (clause.kind.toString() === 'CaseStmt') {
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
            if (i === astNodeCase.inner.length - 1) {
                caseExit.next = switchExit;
                switchExit.lasts.add(caseExit);
            }
        }
        this.switchExitStack.pop();
        return switchExit;
    }

    private ASTNodeCXXMemberCallExpr(
        innerNode: CxxAstNode,
        lastStatement: StatementBuilder,
        scopeID: number
    ): StatementBuilder {
        let caller = '';
        let callee = '';
        const first = innerNode?.inner?.[0];
        if (first && first.kind === 'MemberExpr') {
            let childInner: CxxAstNode = first;
            // Callee: name is preferred. Some JSONs may only have code
            const op = childInner.isArrow ? '->' : '.';
            callee = op + (childInner.name || childInner.code || '');
            // 2) Go down through ImplicitCastExpr chain until DeclRefExpr or other end points use the optional chain at the same time to avoid out of bounds
            while (childInner.inner && childInner.inner.length > 0) {
                const n0 = childInner.inner[0];
                const innerKind = n0?.kind;
                if (innerKind === astKind.DeclRefExpr) {
                    // 3) Safely read referencedDecl? .name； Use n0. name/n0. code/empty string at the bottom
                    caller = n0.referencedDecl?.name || n0.name || n0.code || '';
                    break;
                }
                if (innerKind === astKind.ImplicitCastExpr) {
                    childInner = n0; // Continue to traverse downward
                    continue;
                }
                // Other nodes stop
                break;
            }
        }

        const nodeCode = caller + callee;
        const s = new StatementBuilder('statement', nodeCode, innerNode, scopeID);
        this.judgeLastType(s, lastStatement);
        return s;
    }


    ASTNodeGotoStatement(innerNode: CxxAstNode, lastStatement: StatementBuilder, scopeID: number): void {
        let s = new StatementBuilder('gotoStatement', innerNode.code, innerNode, scopeID);
        this.judgeLastType(s, lastStatement);
        let label: string = innerNode.code.substring(innerNode.code.indexOf('goto ') + 5);
        let gotoStmtsOfLabel = this.gotoStmtMap.get(label);
        if (gotoStmtsOfLabel === undefined) {
            this.gotoStmtMap.set(label, [s]);
            this.handleLabelStmtPassTimes(s, label);
        } else {
            gotoStmtsOfLabel.push(s);
            this.handleLabelStmtPassTimes(s, label);
        }
    }

    handleLabelStmtPassTimes(s: StatementBuilder, label: string): void {
        if (this.labelStmtMap.has(label)) {
            const labelStmt = this.labelStmtMap.get(label);
            if (labelStmt?.next) {
                labelStmt.next.passTimes = (labelStmt.next.passTimes || 0) + 1;
            }
            this.judgeLastType(<StatementBuilder> this.labelStmtMap.get(label)?.next, s);
        }
    }

    private judgeLastStmtForLabel(s: StatementBuilder, lastStatement: StatementBuilder, gotoStatement: StatementBuilder | undefined):void {
        if (lastStatement.type === 'ifStatement') {
            let lastIf = lastStatement as ConditionStatementBuilder;
            if (lastIf.nextT!.type === 'gotoStatement') {
                lastIf.nextT = s;
                s.lasts.add(lastIf);
            } else if (lastIf.nextF!.type === 'gotoStatement') {
                lastIf.nextF = s;
                s.lasts.add(lastIf);
            }
        } else if (lastStatement.type === 'switchStatement') {
            let lastSwitch = lastStatement as SwitchStatementBuilder;
            for (let i = 0; i < lastSwitch.nexts.length; i++) {
                if (lastSwitch.nexts[i] === gotoStatement) {
                    lastSwitch.nexts[i] = s;
                    s.lasts.add(lastSwitch);
                }
            }
        } else {
            lastStatement.next = s;
            s.lasts.add(lastStatement);
        }
    }

    ASTNodeLabelStatement(innerNode: CxxAstNode, lastStatement: StatementBuilder, scopeID: number): StatementBuilder {
        let labelStmt = new StatementBuilder('statement', 'goto label:' + innerNode.name, innerNode, scopeID);
        // Handle the sequence relationship between goto statements and label statements
        let label: string = innerNode.code.substring(0, innerNode.code.indexOf(':'));
        if (!this.labelStmtMap.has(label)) {
            this.labelStmtMap.set(label, labelStmt);
        }
        for (const [key, gotoStmts] of this.gotoStmtMap) {
            if (key === label) {
                for (const gotoStmt of gotoStmts) {
                    for (const lastStmt of [...gotoStmt.lasts]) {
                        this.judgeLastStmtForLabel(labelStmt, lastStmt, gotoStmt);
                    }
                }
            }
        }

        // Handle the sequence relationship between label statements and the previous statement
        this.judgeLastStmtForLabel(labelStmt, lastStatement, undefined);
        // Processing nodes within labelStmt
        let labelExit = new StatementBuilder('labelExit', '', innerNode, scopeID);
        this.exits.push(labelExit);
        this.walkAST(labelStmt, labelExit, [...innerNode.inner]);
        // Remove labelStmt
        for (const stmt of [...labelStmt.lasts]) {
            labelStmt.next!.lasts.add(stmt);
            if (stmt.type === 'ifStatement') {
                let lastIf = stmt as ConditionStatementBuilder;
                if (lastIf.nextT === labelStmt) {
                    lastIf.nextT = labelStmt.next;
                } else {
                    lastIf.nextF = labelStmt.next;
                }
            } else if (stmt.type === 'switchStatement') {
                let lastSwitch = stmt as SwitchStatementBuilder;
                for (let i = 0; i < lastSwitch.nexts.length; i++) {
                    if (lastSwitch.nexts[i] === labelStmt && labelStmt.next) {
                        lastSwitch.nexts[i] = labelStmt.next;
                    }
                }
            } else {
                stmt.next = labelStmt.next;
            }
        }
        labelStmt.next!.lasts.delete(labelStmt);
        return labelExit;
    }

    removeAfterBraces(str: string): string {
        const index = str.indexOf('{\r\n    ');
        if (index !== -1) {
            return str.substring(0, index);
        }
        return str;
    }

    ASTNodeTryStatement(c: CxxAstNode, lastStatement: StatementBuilder, scopeID: number): StatementBuilder {
        let trystmt = new TryStatementBuilder('tryStatement', 'try', c, scopeID);
        this.judgeLastType(trystmt, lastStatement);
        let tryExit = new StatementBuilder('tryExit', '', c, scopeID);
        this.exits.push(tryExit);
        trystmt.tryExit = tryExit;

        let tryBlock: CxxAstNode | undefined = undefined;
        let catchBlockList: CxxAstNode[] = [];
        for (const node of c.inner) {
            if (node.kind === astKind.CompoundStmt) {
                tryBlock = node;
            } else if (node.kind === astKind.CXXCatchStmt) {
                catchBlockList.push(node);
            }
        }

        this.walkAST(trystmt, tryExit, tryBlock?.inner ?? []);
        trystmt.tryFirst = trystmt.next;
        trystmt.next?.lasts.add(trystmt);
        for (const catchBlock of catchBlockList) {
            let text = '';
            if (catchBlock.code) {
                text += this.removeAfterBraces(catchBlock.code);
            }
            if (catchBlock.inner?.length === 0) {
                continue;
            }
            let catchOrNot = new ConditionStatementBuilder('catchOrNot', text, catchBlock, scopeID);
            let catchExit = new StatementBuilder('catch exit', '', catchBlock, scopeID);
            catchOrNot.nextF = catchExit;
            catchExit.lasts.add(catchOrNot);
            if (catchBlock.inner && catchBlock.inner[0].id === '0x0') {
                catchBlock.inner[0].kind = 'catch_all_exception';
            }
            this.walkAST(catchOrNot, catchExit, catchBlock.inner[catchBlock.inner.length - 1].inner);
            if (!catchOrNot.nextT) {
                catchOrNot.nextT = catchExit;
                catchExit.lasts.add(catchOrNot);
            }
            const catchStatement = new StatementBuilder('statement', catchOrNot.code, catchBlock, catchOrNot.nextT.scopeID);
            catchStatement.next = catchOrNot.nextT;
            trystmt.catchStatement.push(catchStatement);
            catchStatement.lasts.add(trystmt);
            trystmt.catchError.push(catchBlock.inner[0]);
        }
        let final = new StatementBuilder('statement', 'finally', c, scopeID);
        let finalExit = new StatementBuilder('finallyExit', '', c, scopeID);
        this.exits.push(finalExit);
        let dummyFinally = new StatementBuilder('statement', 'dummyFinally', c, new Scope(this.scopes.length).id);
        final.next = dummyFinally;
        dummyFinally.lasts.add(final);
        dummyFinally.next = finalExit;
        finalExit.lasts.add(dummyFinally);
        trystmt.finallyStatement = final.next;
        tryExit.next = final.next;
        final.next?.lasts.add(tryExit);

        trystmt.next = finalExit;
        finalExit.lasts.add(trystmt);
        return finalExit;
    }

    private hitsControlBoundaryBeforeRoot(node: CxxAstNode): boolean {
        const CONTROL_BOUNDARY_KINDS = new Set<string>([
            astKind.IfStmt,
            astKind.WhileStmt,
            astKind.DoStmt,
            astKind.ForStmt,
            astKind.CaseStmt,
            astKind.DefaultStmt,
            astKind.CXXTryStmt,
        ]);

        let p: CxxAstNode | null = node;
        const rootId = this.astRoot.id;
        while (p && p.id !== rootId) {
            if (CONTROL_BOUNDARY_KINDS.has(p.kind)) {
                return true;
            }
            p = (p.parent ?? p.getParent?.(true)) ?? null;
        }
        return false;
    }

    walkAST(lastStatement: StatementBuilder, nextStatement: StatementBuilder, nodes: CxxAstNode[]): void {
        let scope = new Scope(this.scopes.length);
        this.scopes.push(scope);
        let gotoLabel = lastStatement.next?.type === 'gotoStatement' && nextStatement.type === 'blockExit';
        for (let i = 0; i < nodes.length; i++) {
            let innerNode = nodes[i];
            let nodeKind = innerNode.kind;
            if (nodeKind === 'LabelStmt' && this.gotoStmtMap.get(innerNode.name) !== undefined) {
                gotoLabel = false;
            }
            if (gotoLabel && nodeKind !== astKind.CompoundStmt) { // Skip the code between goto and label in the code block
                continue;
            }
            lastStatement = this.handleASTStmtSuccession(innerNode, lastStatement, scope);
            if (nodeKind === astKind.ReturnStmt) {
                break;
            } else if (nodeKind === astKind.BreakStmt || nodeKind === astKind.ContinueStmt) {
                return;
            } else if (nodeKind === astKind.GotoStmt) {
                if (this.hitsControlBoundaryBeforeRoot(innerNode)) {
                    return;
                }
            }
        }
        if (lastStatement.type !== 'breakStatement' && lastStatement.type !== 'continueStatement' && lastStatement.type !== 'returnStatement') {
            lastStatement.next = nextStatement;
            nextStatement.lasts.add(lastStatement);
        }
    }

    handleASTStmtSuccession(innerNode: CxxAstNode, lastStatement: StatementBuilder, scope: Scope): StatementBuilder {
        let s: StatementBuilder;

        // 直接使用 innerNode.kind 进行 switch
        switch (innerNode.kind) {
            case astKind.AtomicCallExpr:
            case astKind.BinaryOperator:
            case astKind.CallExpr:
            case astKind.CompoundAssignOperator:
            case astKind.CXXConstructExpr:
            case astKind.CXXCtorInitializer:
            case astKind.CXXDeleteExpr:
            case astKind.CXXOperatorCallExpr:
            case astKind.CXXThrowExpr:
            case astKind.DeclStmt:
            case astKind.RecoveryExpr:
            case astKind.TypedefDecl:
            case astKind.TypeAliasDecl:
            case astKind.TypeAliasTemplateDecl:
            case astKind.UnaryOperator:
            case astKind.VarDecl:
                s = new StatementBuilder('statement', innerNode.code, innerNode, scope.id);
                this.judgeLastType(s, lastStatement);
                lastStatement = s;
                break;
            case astKind.BreakStmt:
                this.ASTNodeBreakStatement(innerNode, lastStatement);
                break;
            case astKind.CompoundStmt:
                let blockExit = new StatementBuilder('blockExit', '', innerNode, scope.id);
                this.exits.push(blockExit);
                this.walkAST(lastStatement, blockExit, [...innerNode.inner]);
                lastStatement = blockExit;
                break;
            case astKind.ContinueStmt:
                const lastLoop = this.loopStack[this.loopStack.length - 1];
                this.judgeLastType(lastLoop, lastStatement);
                lastLoop.lasts.add(lastStatement);
                break;
            case astKind.CXXMemberCallExpr:
                lastStatement = this.ASTNodeCXXMemberCallExpr(innerNode, lastStatement, scope.id);
                break;
            case astKind.CXXForRangeStmt:
            case astKind.ForStmt:
                lastStatement = this.ASTNodeForStatement(innerNode, lastStatement, scope.id);
                break;
            case astKind.CXXTryStmt:
                lastStatement = this.ASTNodeTryStatement(innerNode, lastStatement, scope.id);
                break;
            case astKind.DoStmt:
                lastStatement = this.ASTNodeDoStatement(innerNode, lastStatement, scope.id);
                break;
            case astKind.ExprWithCleanups:
                lastStatement = this.ASTNodeImplicitCastExpr(innerNode, lastStatement, scope);
                break;
            case astKind.GotoStmt:
            case astKind.IndirectGotoStmt:
                this.ASTNodeGotoStatement(innerNode, lastStatement, scope.id);
                break;
            case astKind.IfStmt:
                lastStatement = this.ASTNodeIfStatement(innerNode, lastStatement, scope.id);
                break;
            case astKind.LabelStmt:
                lastStatement = this.ASTNodeLabelStatement(innerNode, lastStatement, scope.id);
                break;
            case astKind.ReturnStmt:
                s = new StatementBuilder('returnStatement', innerNode.code, innerNode, scope.id);
                this.judgeLastType(s, lastStatement);
                lastStatement = s;
                break;
            case astKind.SwitchStmt:
                lastStatement = this.ASTNodeSwitchStatement(innerNode, lastStatement, scope.id);
                break;
            case astKind.WhileStmt:
                lastStatement = this.ASTNodeWhileStatement(innerNode, lastStatement, scope.id);
                break;
            case astKind.NullStmt:
                break;
            case astKind.ParmVarDecl:
                s = new StatementBuilder('statement', 'ParmVarDecl', innerNode, scope.id);
                this.judgeLastType(s, lastStatement);
                lastStatement = s;
                break;
            case astKind.ImplicitCastExpr:
                lastStatement = this.ASTNodeImplicitCastExpr(innerNode, lastStatement, scope);
                break;
            default:
                break;
        }
        return lastStatement;
    }

    private ASTNodeImplicitCastExpr(implicitCastExpr: CxxAstNode, lastStatement: StatementBuilder, scope: Scope): StatementBuilder {
        for (let i = 0; i < implicitCastExpr.inner.length; i++) {
            let inner = implicitCastExpr.inner[i];
            lastStatement = this.handleASTStmtSuccession(inner, lastStatement, scope);
        }
        return lastStatement;
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
        // The next of some statements, such as the exit statement after return, cannot be cleared
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
            stmt.next.passTimes++;
            if (stmt.next.passTimes === stmt.next.lasts.size || stmt.next.type === 'loopStatement' || stmt.next.isDoWhile) {
                if (
                    stmt.next.scopeID !== stmt.scopeID &&
                    !(stmt.next instanceof ConditionStatementBuilder && stmt.next.doStatement)
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
            // add afterSwitch when the every case is return
            if (stmt.afterSwitch && stmt.afterSwitch.lasts.size === 0) {
                stmtQueue.push(stmt.afterSwitch);
            }
        } else if (stmt instanceof TryStatementBuilder) {
            if (stmt.finallyStatement) {
                stmtQueue.push(stmt.finallyStatement);
            }
            if (stmt.catchStatement) {
                for (let catchStmt of stmt.catchStatement) {
                    stmtQueue.push(catchStmt);
                }
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
                if (stmt.type === 'loopStatement' && block.stmts.length > 0 && !stmt.hasDoWhileBody) {
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
            let p: CxxAstNode | null = notReturnStmts[0].astNode;
            while (p && p.id !== this.astRoot.id) {
                if (p.kind === astKind.CXXTryStmt || p.kind === astKind.SwitchStmt) {
                    TryOrSwitchExit = true;
                    break;
                }
                p = (p.parent ?? p.getParent?.(true)) ?? null;
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

    addStmtBuilderPosition(): void {
        for (const stmt of this.statementArray) {
            if (stmt.astNode) {
                if (stmt.astNode.range?.begin && stmt.astNode.range.begin.line) {
                    stmt.line = stmt.astNode.range.begin.line;
                } else {
                    stmt.line = 0;
                }
                if (stmt.astNode.range?.begin && stmt.astNode.range.begin.col) {
                    stmt.column = stmt.astNode.range.begin.col;
                } else {
                    stmt.column = 0;
                }
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
            if (cstm.nextT === null || cstm.nextF === null) {
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
            let trystmt = stmt as TryStatementBuilder;
            if (trystmt.tryFirst) {
                this.CfgBuilder2Array(trystmt.tryFirst);
            }
            if (trystmt.catchStatement) {
                for (let catchStmt of trystmt.catchStatement) {
                    this.CfgBuilder2Array(catchStmt);
                }
            }
            if (trystmt.finallyStatement) {
                this.CfgBuilder2Array(trystmt.finallyStatement);
            }
            if (trystmt.next) {
                this.CfgBuilder2Array(trystmt.next);
            }
        } else {
            if (stmt.next !== null) {
                this.CfgBuilder2Array(stmt.next);
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

    getFuncBodyStmt(): CxxAstNode[] {
        let stmts: CxxAstNode[] = [];
        if (this.astRoot.inner) {
            for (let i = 0; i < this.astRoot.inner.length; i++) {
                const allowedInnerKinds: string[] = [
                    astKind.CXXConstructExpr,
                    astKind.CXXCtorInitializer
                ];

                if (this.astRoot.kind === astKind.CXXConstructorDecl && allowedInnerKinds.includes(this.astRoot.inner[i].kind)) {
                    stmts.push(this.astRoot.inner[i]);
                }
                const length = this.astRoot.inner[i].inner.length;
                if (this.astRoot.inner[i].kind === astKind.ParmVarDecl && length > 0 &&
                    this.astRoot.inner[i].inner[length - 1].kind !== astKind.TypeRef) {
                    stmts.push(this.astRoot.inner[i]);
                    continue;
                }
                if (this.astRoot.inner[i].kind === astKind.CompoundStmt) {
                    stmts.push(...this.astRoot.inner[i].inner);
                    break;
                }
            }
        }
        return stmts;
    }

    buildCfgBuilder(): void {
        let stmts: CxxAstNode[] = [];
        const translationUnitKinds: string[] = [
            astKind.TranslationUnitDecl,
            astKind.NamespaceDecl
        ];

        const functionKinds: string[] = [
            astKind.FunctionDecl,
            astKind.CXXMethodDecl,
            astKind.CXXConstructorDecl,
            astKind.LambdaExpr,
            astKind.FunctionTemplateDecl,
            astKind.CXXDestructorDecl
        ];

        if (translationUnitKinds.includes(this.astRoot.kind)) {
            stmts = [...this.astRoot.inner];
        } else if (functionKinds.includes(this.astRoot.kind)) {
            stmts = this.getFuncBodyStmt();
        }

        this.walkAST(this.entry, this.exit, stmts);

        this.addReturnInEmptyMethod();
        this.deleteExit();
        this.CfgBuilder2Array(this.entry);
        this.addStmtBuilderPosition();
        this.buildBlocks();
        this.blocks = this.blocks.filter(b => b.stmts.length !== 0);
        this.buildBlocksNextLast();
        this.addReturnStmt();
    }

    public isBodyEmpty(): boolean {
        return this.emptyBody;
    }

    public buildCfg(): {
        cfg: Cfg;
        locals: Set<Local>;
        globals: Map<string, GlobalRef> | null;
        aliasTypeMap: Map<string, [AliasType, ArkAliasTypeDefineStmt]>;
        traps: CxxTrap[];
    } {
        if (this.astRoot.kind === astKind.LambdaExpr && this.astRoot.inner[this.astRoot.inner.length - 1].kind !== astKind.CompoundStmt) {
            return this.buildCfgForSimpleArrowFunction();
        }

        return this.buildNormalCfg();
    }

    public buildCfgForSimpleArrowFunction(): {
        cfg: Cfg;
        locals: Set<Local>;
        globals: Map<string, GlobalRef> | null;
        aliasTypeMap: Map<string, [AliasType, ArkAliasTypeDefineStmt]>;
        traps: CxxTrap[];
    } {
        const stmts: Stmt[] = [];
        const arkIRTransformer = new ArkCxxIRTransformer(this.sourceFile as CxxTranslationUnit, this.declaringMethod);
        stmts.push(...arkIRTransformer.prebuildStmts());
        const expressionBodyNode = this.astRoot;
        const expressionBodyStmts: Stmt[] = [];
        let {
            value: expressionBodyValue,
            valueOriginalPositions: expressionBodyPositions,
            stmts: tempStmts,
        } = arkIRTransformer.cxxNodeToValueAndStmts(expressionBodyNode);
        expressionBodyStmts.push(...tempStmts);
        if (IRUtils.moreThanOneAddress(expressionBodyValue)) {
            ({
                value: expressionBodyValue,
                valueOriginalPositions: expressionBodyPositions,
                stmts: tempStmts,
            } = arkIRTransformer.generateAssignStmtForValue(expressionBodyValue, expressionBodyPositions));
            expressionBodyStmts.push(...tempStmts);
        }
        const returnStmt = new ArkReturnStmt(expressionBodyValue);
        returnStmt.setOperandOriginalPositions([expressionBodyPositions[0], ...expressionBodyPositions]);
        expressionBodyStmts.push(returnStmt);
        arkIRTransformer.cxxMapStmtsToTsStmt(expressionBodyStmts, expressionBodyNode);
        stmts.push(...expressionBodyStmts);
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
        traps: CxxTrap[];
    } {
        const { blockBuilderToCfgBlock, basicBlockSet, arkIRTransformer } = this.initializeBuild();
        const {
            blocksContainLoopCondition,
            blockBuildersBeforeTry,
            blockBuildersContainSwitch,
            valueAndStmtsOfSwitchAndCasesAll,
        } = this.processBlocks(blockBuilderToCfgBlock, basicBlockSet, arkIRTransformer);
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
        const trapBuilder = new CxxTrapBuilder(blockBuildersBeforeTry, blockBuilderToCfgBlock, basicBlockSet);
        const traps = trapBuilder.buildTraps();
        this.removeEmptyBlocks(basicBlockSet);
        const cfg = this.createCfg(blockBuilderToCfgBlock, basicBlockSet, currBlockId);
        return {
            cfg,
            locals: arkIRTransformer.getLocals(),
            globals: arkIRTransformer.getGlobals(),
            aliasTypeMap: arkIRTransformer.getAliasTypeMap(),
            traps,
        };
    }

    /**
     * Removes empty basic blocks from the CFG.
     *
     * Strategy:
     * 1. Identify all empty blocks first (Snapshot).
     * 2. For each empty block, bypass it by connecting its predecessors directly to its successors.
     * 3. Delete the empty block.
     *
     * Note: This version strictly performs deletion and does NOT trigger block merging.
     */
    private removeEmptyBlocks(basicBlockSet: Set<BasicBlock>): void {
        // Phase 1: Identify all candidates for removal.
        // We collect them into an array to avoid concurrent modification issues
        // during the initial filtering.
        const emptyBlocks = Array.from(basicBlockSet).filter(bb => bb.getStmts().length === 0);

        for (const bb of emptyBlocks) {
            // Double-check existence as a previous iteration might have merged/deleted it.
            if (!basicBlockSet.has(bb)) {
                continue;
            }

            // Phase 2: Perform the surgical removal and graph relinking.
            this.bypassAndRemoveBlock(bb, basicBlockSet);
        }
    }

    /**
     * Bypasses a block by connecting all its predecessors directly to its successors.
     */
    private bypassAndRemoveBlock(bb: BasicBlock, basicBlockSet: Set<BasicBlock>): void {
        const predecessors = bb.getPredecessors();
        const successors = bb.getSuccessors();

        // Link every Predecessor to every Successor (Pred -> Succ)
        for (const pred of predecessors) {
            // Sever the connection to the target block
            pred.removeSuccessorBlock(bb);

            for (const succ of successors) {
                // Prevent introducing trivial self-loops (Pred -> Pred)
                if (pred === succ) {
                    continue;
                }

                // Standard Handshake: Maintain bidirectional CFG edges
                pred.addSuccessorBlock(succ);
                succ.addPredecessorBlock(pred);
            }
        }

        // Phase 3: Final cleanup of outgoing edges from the removed block
        for (const succ of successors) {
            succ.removePredecessorBlock(bb);
        }

        // Phase 4: Erase from the global set
        basicBlockSet.delete(bb);
    }

    private initializeBuild(): {
        blockBuilderToCfgBlock: Map<BlockBuilder, BasicBlock>;
        basicBlockSet: Set<BasicBlock>;
        arkIRTransformer: ArkCxxIRTransformer;
    } {
        const blockBuilderToCfgBlock = new Map<BlockBuilder, BasicBlock>();
        const basicBlockSet = new Set<BasicBlock>();
        const arkIRTransformer = new ArkCxxIRTransformer(this.sourceFile as CxxTranslationUnit, this.declaringMethod);
        return { blockBuilderToCfgBlock, basicBlockSet, arkIRTransformer };
    }

    private processBlocks(
        blockBuilderToCfgBlock: Map<BlockBuilder, BasicBlock>,
        basicBlockSet: Set<BasicBlock>,
        arkIRTransformer: ArkCxxIRTransformer
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
                    const valueAndStmtsOfSwitchAndCases = arkIRTransformer.cxxSwitchStatementToValueAndStmts(statementBuilder.astNode as CxxAstNode);
                    valueAndStmtsOfSwitchAndCasesAll.push(valueAndStmtsOfSwitchAndCases);
                    continue;
                } else if (statementBuilder.type === '') {
                    blockBuildersContainSwitch.push(this.blocks[i]);
                    continue;
                }
                if (statementBuilder.astNode && statementBuilder.code !== '') {
                    stmtsInBlock.push(...arkIRTransformer.cxxNodeToStmts(statementBuilder.astNode));
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
        return { blocksContainLoopCondition, blockBuildersBeforeTry, blockBuildersContainSwitch, valueAndStmtsOfSwitchAndCasesAll };
    }

    private generateReturnStmt(arkIRTransformer: ArkCxxIRTransformer): Stmt {
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
        if (!(this.declaringMethod.getSubSignature().getReturnType() instanceof VoidType)) {
            const methodName = this.declaringMethod.getSubSignature().getMethodName();
            return new ArkReturnStmt(new Local((methodName === 'main' ? '0' : 'undefinedValue'), this.declaringMethod.getSubSignature().getReturnType()));
        }
        return new ArkReturnVoidStmt();
    }

    private adjustBlocks(
        blockBuilderToCfgBlock: Map<BlockBuilder, BasicBlock>,
        blocksContainLoopCondition: Set<BlockBuilder>,
        basicBlockSet: Set<BasicBlock>,
        blockBuildersContainSwitch: BlockBuilder[],
        valueAndStmtsOfSwitchAndCasesAll: ValueAndStmts[][],
        arkIRTransformer: ArkCxxIRTransformer
    ): void {
        const asCoreMap = blockBuilderToCfgBlock as unknown as Map<CoreBlockBuilder, BasicBlock>;
        const asCoreArr = blockBuildersContainSwitch as unknown as CoreBlockBuilder[];
        const loopBuilder = new CxxLoopBuilder();
        loopBuilder.rebuildBlocksInLoop(blockBuilderToCfgBlock, blocksContainLoopCondition, basicBlockSet, this.blocks);
        const switchBuilder = new CxxSwitchBuilder();
        switchBuilder.buildSwitch(asCoreMap, asCoreArr, valueAndStmtsOfSwitchAndCasesAll, arkIRTransformer, basicBlockSet);
        const conditionalBuilder = new CxxConditionBuilder();
        conditionalBuilder.rebuildBlocksContainConditionalOperator(
            asCoreMap,
            basicBlockSet,
            ModelUtils.isArkUIBuilderMethod(this.declaringMethod)
        );
        const ifBuilder = new CxxIfBuilder();
        ifBuilder.rebuildIf(basicBlockSet);
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
