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
import { Local } from '../../../core/base/Local';
import { ArkAliasTypeDefineStmt, ArkReturnStmt, ArkReturnVoidStmt, Stmt } from '../../../core/base/Stmt';
import { BasicBlock } from '../../../core/graph/BasicBlock';
import { Cfg } from '../../../core/graph/Cfg';
import { ArkClass } from '../../../core/model/ArkClass';
import { ArkMethod } from '../../../core/model/ArkMethod';
import { ArkIRTransformerCpp, ValueAndStmts } from '../../common/ArkIRTransformer';
import { IRUtils } from '../../common/IRUtils';
import { AliasType, ClassType, UnclearReferenceType, UnknownType, VoidType } from '../../../core/base/Type';
import { Trap } from '../../../core/base/Trap';
import { GlobalRef } from '../../../core/base/Ref';
import { LoopBuilder } from '../../../core/graph/builder/LoopBuilder';
import { SwitchBuilder } from '../../../core/graph/builder/SwitchBuilder';
import { ConditionBuilder } from '../../../core/graph/builder/ConditionBuilder';
import { TrapBuilder } from '../../../core/graph/builder/TrapBuilder';
import { ModifierType } from '../../../core/model/ArkBaseModel';
import { BlockBuilder, Case, Catch, TextError, Variable, Scope } from '../../../core/graph/builder/CfgBuilder';
import { ModelUtils } from '../../../core/common/ModelUtils';
import { CONSTRUCTOR_NAME, PROMISE } from '../../../core/common/TSConst';
import { CppAstNode, CppTranslationUnit } from '../../../ast/ArkCxxAstNode';

export class StatementBuilder {
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
    astNode: any | null; //ast节点对象
    scopeID: number;
    addressCode3: string[] = [];
    block: BlockBuilder | null;
    ifExitPass: boolean;
    passTmies: number = 0;
    numOfIdentifier: number = 0;
    isDoWhile: boolean = false;

    constructor(type: string, code: string, astNode: any | null, scopeID: number) {
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

    constructor(type: string, code: string, astNode: any, scopeID: number) {
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

    constructor(type: string, code: string, astNode: any, scopeID: number) {
        super(type, code, astNode, scopeID);
        this.nexts = [];
    }
}

export class TryStatementBuilder extends StatementBuilder {
    tryFirst: StatementBuilder | null = null;
    tryExit: StatementBuilder | null = null;
    catchStatement: any[] = [];
    catchError: any[] = [];
    finallyStatement: StatementBuilder | null = null;
    afterFinal: StatementBuilder | null = null;

    constructor(type: string, code: string, astNode: any, scopeID: number) {
        super(type, code, astNode, scopeID);
    }
}

export class CfgBuilder {
    name: string;
    astRoot: any;
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

    private sourceFile: CppAstNode;
    private declaringMethod: ArkMethod;

    constructor(ast: CppAstNode, name: string, declaringMethod: ArkMethod, sourceFile: any) {
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
        this.declaringMethod.gotoStmtMap = new Map();
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
        }
    }

    ASTNodeBreakStatement(c: CppAstNode, lastStatement: StatementBuilder): void {
        let p: CppAstNode | null = c;
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

    ASTNodeIfStatement(c: CppAstNode, lastStatement: StatementBuilder, scopeID: number): StatementBuilder {
        let ifstm: ConditionStatementBuilder = new ConditionStatementBuilder('ifStatement', 'IfStmt', c, scopeID);
        this.judgeLastType(ifstm, lastStatement);
        let ifexit: StatementBuilder = new StatementBuilder('ifExit', '', c, scopeID);
        this.exits.push(ifexit);
        ifstm.condition = c.inner[0].code;
        ifstm.code = 'if (' + ifstm.condition + ')';
        if (c.inner.length >= 2 && c.inner[1].kind.toString() === 'CompoundStmt') {
            this.walkAST(ifstm, ifexit, [...c.inner[1].inner]);
        } else {
            this.walkAST(ifstm, ifexit, [c.inner[1]]);
        }
        if (c.inner.length > 2) {
            if (c.inner[2].kind.toString() === 'CompoundStmt') {
                this.walkAST(ifstm, ifexit, [...c.inner[2].inner]);
            } else {
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

    ASTNodeWhileStatement(c: CppAstNode, lastStatement: StatementBuilder, scopeID: number): StatementBuilder {
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
        if (c.inner[1].kind.toString() === 'CompoundStmt') {
            this.walkAST(loopstm, loopstm, [...c.inner[1].inner]);
        } else {
            this.walkAST(loopstm, loopstm, [c.inner[1]]);
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

    ASTNodeForStatement(c: CppAstNode, lastStatement: StatementBuilder, scopeID: number): StatementBuilder {
        this.breakin = 'loop';
        let loopstm = new ConditionStatementBuilder('loopStatement', '', c, scopeID);
        this.loopStack.push(loopstm);
        this.judgeLastType(loopstm, lastStatement);
        let loopExit = new StatementBuilder('loopExit', '', c, scopeID);
        this.exits.push(loopExit);
        loopstm.nextF = loopExit;
        loopExit.lasts.add(loopstm);
        loopstm.code = this.getPrefix(c.code, ' {\r\n');
        if (c.inner[c.inner.length - 1].kind === 'CompoundStmt') {
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

    ASTNodeDoStatement(c: CppAstNode, lastStatement: StatementBuilder, scopeID: number): StatementBuilder {
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

    private sliceCaseDefaultNode(node: CppAstNode, clauses: CppAstNode[]): void {
        if (node.kind === 'BreakStmt' || node.kind === 'DefaultStmt' || node.kind === 'ContinueStmt') {
            clauses.push(node);
            return;
        }
        if (node.kind === 'CaseStmt') {
            for (let i = 0; i < node.inner.length; i++) {
                let isCaseOrDefault = node.inner[i].kind === 'CaseStmt' || node.inner[i].kind === 'DefaultStmt';
                if (isCaseOrDefault) {
                    let caseClause = JSON.parse(JSON.stringify(node));
                    caseClause.inner = caseClause.inner.slice(0, i);
                    clauses.push(caseClause);
                    this.sliceCaseDefaultNode(node.inner[i], clauses);
                }
                if (i === node.inner.length - 1 && !isCaseOrDefault) {
                    clauses.push(node);
                }
            }
        }
    }

    // 将cpp的case-default的ast格式转换成TS的caseClause/defaultClause
    private getCaseDefClauseAsts(switchNode: CppAstNode):CppAstNode[] {
        // cpp解析case:后面没有语句且没有break时，会把后面的case/default作为该case的inner节点，因此要把原有的ast拆分成一个个的case，default
        let tempClauses: CppAstNode[] = [];
        for (let node of switchNode.inner[1].inner) {
            this.sliceCaseDefaultNode(node, tempClauses);
        }
        // 没有case括号时，cpp中case和break/continue是分开的两个节点，此处将break/continue节点加入作为case或default节点的inner成员
        return tempClauses.reduce((acc: CppAstNode[], curr: CppAstNode, idx: number, arr: CppAstNode[]) => {
            if (['CaseStmt', 'DefaultStmt'].includes(curr.kind.toString())) {
                curr.parent = switchNode.inner[1];
                if (idx + 1 < arr.length && ['BreakStmt', 'ContinueStmt'].includes(arr[idx + 1].kind.toString())) {
                    arr[idx + 1].parent = curr;
                    curr.inner.push(arr[idx + 1]);
                }
                acc.push(curr);
            }
            return acc;
        }, [] as CppAstNode[]);
    }

    ASTNodeSwitchStatement(c: CppAstNode, lastStatement: StatementBuilder, scopeID: number): StatementBuilder {
        this.breakin = 'switch';
        let switchstm = new SwitchStatementBuilder('switchStatement', '', c, scopeID);
        this.judgeLastType(switchstm, lastStatement);
        let switchExit = new StatementBuilder('switchExit', '', null, scopeID);
        this.exits.push(switchExit);
        this.switchExitStack.push(switchExit);
        switchExit.lasts.add(switchstm);
        switchstm.code = 'switch (' + c.inner[0].code + ')';
        let lastCaseExit: StatementBuilder | null = null;
        c.inner[1].inner = this.getCaseDefClauseAsts(c);

        for (let i = 0; i < c.inner[1].inner.length; i++) {
            const clause = c.inner[1].inner[i];
            let casestm: StatementBuilder;
            let caseBody: CppAstNode[] = [...clause.inner];
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
            if (i === c.inner[1].inner.length - 1) {
                caseExit.next = switchExit;
                switchExit.lasts.add(caseExit);
            }
        }
        this.switchExitStack.pop();
        return switchExit;
    }

    private ASTNodeCXXMemberCallExpr(
        innerNode: CppAstNode,
        lastStatement: StatementBuilder,
        scopeID: number
    ): StatementBuilder {
        let caller = '';
        let callee = '';
        const first = innerNode?.inner?.[0];
        if (first && first.kind === 'MemberExpr') {
            let childInner: CppAstNode = first;
            // callee：优先用 name，有些 JSON 可能只有 code
            callee = '.' + (childInner.name || childInner.code || '');
            // 2) 向下穿过 ImplicitCastExpr 链，直到 DeclRefExpr 或其他终点 同时使用可选链，避免越界
            while (childInner.inner && childInner.inner.length > 0) {
                const n0 = childInner.inner[0];
                const innerKind = n0?.kind;
                if (innerKind === 'DeclRefExpr') {
                    // 3) 安全读取 referencedDecl?.name；兜底使用 n0.name / n0.code / 空串
                    caller = n0.referencedDecl?.name || n0.name || n0.code || '';
                    break;
                }
                if (innerKind === 'ImplicitCastExpr') {
                    childInner = n0; // 继续向下剥
                    continue;
                }
                // 其他节点就停止
                break;
            }
        }

        const nodeCode = caller + callee;
        const s = new StatementBuilder('statement', nodeCode, innerNode, scopeID);
        this.judgeLastType(s, lastStatement);
        return s;
    }


    ASTNodeGotoStatement(innerNode: CppAstNode, lastStatement: StatementBuilder, scopeID: number): void {
        let s = new StatementBuilder('gotoStatement', innerNode.code, innerNode, scopeID);
        this.judgeLastType(s, lastStatement);
        let label: string = innerNode.code.substring(innerNode.code.indexOf('goto ') + 5);
        let gotoStmtsOfLabel = this.declaringMethod.gotoStmtMap.get(label);
        if (gotoStmtsOfLabel === undefined) {
            this.declaringMethod.gotoStmtMap.set(label, [s]);
        } else {
            gotoStmtsOfLabel.push(s);
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

    ASTNodeLabelStatement(innerNode: CppAstNode, lastStatement: StatementBuilder, scopeID: number): StatementBuilder {
        let labelStmt = new StatementBuilder('statement', 'goto label:' + innerNode.name, innerNode, scopeID);
        // 处理goto语句与label语句的前后关系

        const idx = innerNode.code.indexOf(':');
        if (idx === -1) {
            return new StatementBuilder('gotoStatement', innerNode.code, innerNode, scopeID);
        }
        const label = innerNode.code.substring(0, idx);
        const gotoStmts = this.declaringMethod.gotoStmtMap.get(label);
        if (!gotoStmts) {
            let s = new StatementBuilder('gotoStatement', innerNode.code, innerNode, scopeID);
            this.declaringMethod.gotoStmtMap.set(label, [s]);
        } else {
            for (const gotoStmt of gotoStmts) {
                for (const lastStmt of [...gotoStmt.lasts]) {
                    this.judgeLastStmtForLabel(labelStmt, lastStmt, gotoStmt);
                }
            }
        }

        // 处理label语句和前一句的前后关系
        this.judgeLastStmtForLabel(labelStmt, lastStatement, undefined);
        // labelStmt内节点的处理
        let labelExit = new StatementBuilder('labelExit', '', innerNode, scopeID);
        this.exits.push(labelExit);
        this.walkAST(labelStmt, labelExit, [...innerNode.inner]);
        // 去除labelStmt
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

    ASTNodeTryStatement(c: CppAstNode, lastStatement: StatementBuilder, scopeID: number): StatementBuilder {
        let trystm = new TryStatementBuilder('tryStatement', 'try', c, scopeID);
        this.judgeLastType(trystm, lastStatement);
        let tryExit = new StatementBuilder('tryExit', '', c, scopeID);
        this.exits.push(tryExit);
        trystm.tryExit = tryExit;

        let tryBlock: CppAstNode | undefined = undefined;
        let catchBlockList: CppAstNode[] = [];
        for (const node of c.inner) {
            if (node.kind === 'CompoundStmt') {
                tryBlock = node;
            } else if (node.kind === 'CXXCatchStmt') {
                catchBlockList.push(node);
            }
        }

        this.walkAST(trystm, tryExit, tryBlock?.inner ?? []);
        trystm.tryFirst = trystm.next;
        trystm.next?.lasts.add(trystm);
        for (const catchBlock of catchBlockList) {
            let text = '';
            if (catchBlock.code) {
                text += this.removeAfterBraces(catchBlock.code);
            }
            let catchOrNot = new ConditionStatementBuilder('catchOrNot', text, c, scopeID);
            let catchExit = new StatementBuilder('catch exit', '', c, scopeID);
            catchOrNot.nextF = catchExit;
            catchExit.lasts.add(catchOrNot);
            if (catchBlock.inner && catchBlock.inner[0].id === '0x0') {
                catchBlock.inner[0].kind = 'catch_all_exception';
            }
            this.walkAST(catchOrNot, catchExit, catchBlock.inner);
            if (!catchOrNot.nextT) {
                catchOrNot.nextT = catchExit;
                catchExit.lasts.add(catchOrNot);
            }
            const catchStatement = new StatementBuilder('statement', catchOrNot.code, catchBlock, catchOrNot.nextT.scopeID);
            catchStatement.next = catchOrNot.nextT;
            trystm.catchStatement.push(catchStatement);
            catchStatement.lasts.add(trystm);
            if (catchBlock.inner[0].name) {
                trystm.catchError.push(catchBlock.inner[0].name);
            } else {
                trystm.catchError.push('Error');
            }
        }
        let final = new StatementBuilder('statement', 'finally', c, scopeID);
        let finalExit = new StatementBuilder('finallyExit', '', c, scopeID);
        this.exits.push(finalExit);
        let dummyFinally = new StatementBuilder('statement', 'dummyFinally', c, new Scope(this.scopes.length).id);
        final.next = dummyFinally;
        dummyFinally.lasts.add(final);
        dummyFinally.next = finalExit;
        finalExit.lasts.add(dummyFinally);
        trystm.finallyStatement = final.next;
        tryExit.next = final.next;
        final.next?.lasts.add(tryExit);

        trystm.next = finalExit;
        finalExit.lasts.add(trystm);
        return finalExit;
    }

    walkAST(lastStatement: StatementBuilder, nextStatement: StatementBuilder, nodes: CppAstNode[]): void {
        let scope = new Scope(this.scopes.length);
        this.scopes.push(scope);
        for (let i = 0; i < nodes.length; i++) {
            let innerNode = nodes[i];
            let nodeKind = innerNode.kind.toString();
            if (nodeKind === 'ReturnStmt') {
                let s = new StatementBuilder('returnStatement', innerNode.code, innerNode, scope.id);
                this.judgeLastType(s, lastStatement);
                lastStatement = s;
                break;
            } else if (nodeKind === 'DeclStmt' || nodeKind === 'VarDecl' || nodeKind === 'TypedefDecl') {
                let s = new StatementBuilder('statement', innerNode.code, innerNode, scope.id);
                this.judgeLastType(s, lastStatement);
                lastStatement = s;
            } else if (nodeKind === 'ExprWithCleanups') {
                let s = new StatementBuilder('statement', 'ExprWithCleanups', innerNode, scope.id);
                this.judgeLastType(s, lastStatement);
                lastStatement = s;
            } else if (
                [
                    'CallExpr',
                    'CXXOperatorCallExpr',
                    'BinaryOperator',
                    'UnaryOperator',
                    'CompoundAssignOperator',
                    'AtomicCallExpr',
                    'CXXConstructExpr',
                    'CXXCtorInitializer',
                ].includes(nodeKind)
            ) {
                let s = new StatementBuilder('statement', innerNode.code, innerNode, scope.id);
                this.judgeLastType(s, lastStatement);
                lastStatement = s;
            } else if (nodeKind === 'CXXMemberCallExpr') {
                lastStatement = this.ASTNodeCXXMemberCallExpr(innerNode, lastStatement, scope.id);
            } else if (nodeKind === 'IfStmt') {
                lastStatement = this.ASTNodeIfStatement(innerNode, lastStatement, scope.id);
            } else if (nodeKind === 'ForStmt' || nodeKind === 'CXXForRangeStmt') {
                lastStatement = this.ASTNodeForStatement(innerNode, lastStatement, scope.id);
            } else if (nodeKind === 'RecoveryExpr') {
                let s = new StatementBuilder('statement', innerNode.code, innerNode, scope.id);
                this.judgeLastType(s, lastStatement);
                lastStatement = s;
            } else if (nodeKind === 'WhileStmt') {
                lastStatement = this.ASTNodeWhileStatement(innerNode, lastStatement, scope.id);
            } else if (nodeKind === 'BreakStmt') {
                this.ASTNodeBreakStatement(innerNode, lastStatement);
                return;
            } else if (nodeKind === 'DoStmt') {
                lastStatement = this.ASTNodeDoStatement(innerNode, lastStatement, scope.id);
            } else if (nodeKind === 'SwitchStmt') {
                lastStatement = this.ASTNodeSwitchStatement(innerNode, lastStatement, scope.id);
            } else if (nodeKind === 'ContinueStmt') {
                const lastLoop = this.loopStack[this.loopStack.length - 1];
                this.judgeLastType(lastLoop, lastStatement);
                lastLoop.lasts.add(lastStatement);
                return;
            } else if (nodeKind === 'CompoundStmt') {
                let blockExit = new StatementBuilder('blockExit', '', innerNode, scope.id);
                this.exits.push(blockExit);
                this.walkAST(lastStatement, blockExit, [...innerNode.inner]);
                lastStatement = blockExit;
            } else if (nodeKind === 'CXXThrowExpr') {
                let s = new StatementBuilder('statement', innerNode.code, innerNode, scope.id);
                this.judgeLastType(s, lastStatement);
                lastStatement = s;
            } else if (nodeKind === 'CXXTryStmt') {
                lastStatement = this.ASTNodeTryStatement(innerNode, lastStatement, scope.id);
            } else if (nodeKind === 'GotoStmt' || nodeKind === 'IndirectGotoStmt') {
                this.ASTNodeGotoStatement(innerNode, lastStatement, scope.id);
                let p: CppAstNode | null = innerNode;
                while (p && p.id !== this.astRoot.id) {
                    if (['IfStmt', 'WhileStmt', 'DoStmt', 'ForStmt', 'CaseStmt', 'DefaultStmt', 'CXXTryStmt'].includes(p.kind)) {
                        return;
                    }
                    p = (p.parent ?? p.getParent?.(true)) ?? null;
                }
            } else if (nodeKind === 'LabelStmt') {
                lastStatement = this.ASTNodeLabelStatement(innerNode, lastStatement, scope.id);
            } else if (nodeKind === 'CXXDeleteExpr') {
                let s = new StatementBuilder('statement', innerNode.code, innerNode, scope.id);
                this.judgeLastType(s, lastStatement);
                lastStatement = s;
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
            let p: CppAstNode | null = notReturnStmts[0].astNode;
            while (p && p.id !== this.astRoot.id) {
                if (p.kind === 'CXXTryStmt' || p.kind === 'SwitchStmt') {
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
            let trystm = stmt as TryStatementBuilder;
            if (trystm.tryFirst) {
                this.CfgBuilder2Array(trystm.tryFirst);
            }
            if (trystm.catchStatement) {
                for (let catchStmt of trystm.catchStatement) {
                    this.CfgBuilder2Array(catchStmt);
                }
            }
            if (trystm.finallyStatement) {
                this.CfgBuilder2Array(trystm.finallyStatement);
            }
            if (trystm.next) {
                this.CfgBuilder2Array(trystm.next);
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

    getFuncBodyStmt(): CppAstNode[] {
        let stmts: CppAstNode[] = [];
        if (this.astRoot.inner) {
            for (let i = 0; i < this.astRoot.inner.length; i++) {
                if (this.astRoot.kind === 'CXXConstructorDecl' && ['CXXConstructExpr', 'CXXCtorInitializer'].includes(this.astRoot.inner[i].kind)) {
                    stmts.push(this.astRoot.inner[i]);
                }
                if (this.astRoot.inner[i].kind === 'CompoundStmt') {
                    stmts.push(...this.astRoot.inner[i].inner);
                    break;
                }
            }
        }
        return stmts;
    }

    buildCfgBuilder(): void {
        let stmts: CppAstNode[] = [];
        if (this.astRoot.kind.toString() === 'TranslationUnit') {
            stmts = [...this.astRoot.inner];
        } else if (
            ['FunctionDecl', 'CXXMethodDecl', 'CXXConstructorDecl', 'LambdaExpr', 'FunctionTemplate', 'CXXDestructorDecl'].includes(
                this.astRoot.kind.toString()
            )
        ) {
            stmts = this.getFuncBodyStmt();
        }
        if (!ModelUtils.isArkUIBuilderMethod(this.declaringMethod)) {
            this.walkAST(this.entry, this.exit, stmts);
        } else {
            this.handleBuilder(stmts);
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

    private handleBuilder(stmts: CppAstNode[]): void {
        let lastStmt = this.entry;
        for (const stmt of stmts) {
            const stmtBuilder = new StatementBuilder('statement', stmt.code, stmt, 0);
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
        if (this.astRoot.kind.toString() === 'LambdaExpr' && this.astRoot.inner[this.astRoot.inner.length - 1].kind.toString() !== 'CompoundStmt') {
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
        const arkIRTransformer = new ArkIRTransformerCpp(this.sourceFile as CppTranslationUnit, this.declaringMethod);
        arkIRTransformer.prebuildStmts().forEach(stmt => stmts.push(stmt));
        const expressionBodyNode = this.astRoot;
        const expressionBodyStmts: Stmt[] = [];
        let {
            value: expressionBodyValue,
            valueOriginalPositions: expressionBodyPositions,
            stmts: tempStmts,
        } = arkIRTransformer.cppNodeToValueAndStmts(expressionBodyNode);
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
        arkIRTransformer.mapStmtsToTsStmtCpp(expressionBodyStmts, expressionBodyNode);
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

        const trapBuilder = new TrapBuilder(blockBuildersBeforeTry, blockBuilderToCfgBlock, arkIRTransformer, basicBlockSet);
        const traps = trapBuilder.buildTraps();

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
        arkIRTransformer: ArkIRTransformerCpp;
    } {
        const blockBuilderToCfgBlock = new Map<BlockBuilder, BasicBlock>();
        const basicBlockSet = new Set<BasicBlock>();
        const arkIRTransformer = new ArkIRTransformerCpp(this.sourceFile as CppTranslationUnit, this.declaringMethod);
        return { blockBuilderToCfgBlock, basicBlockSet, arkIRTransformer };
    }

    private processBlocks(
        blockBuilderToCfgBlock: Map<BlockBuilder, BasicBlock>,
        basicBlockSet: Set<BasicBlock>,
        arkIRTransformer: ArkIRTransformerCpp
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
                    const valueAndStmtsOfSwitchAndCases = arkIRTransformer.switchStatementToValueAndStmtsCpp(statementBuilder.astNode as CppAstNode);
                    valueAndStmtsOfSwitchAndCasesAll.push(valueAndStmtsOfSwitchAndCases);
                    continue;
                }
                if (statementBuilder.astNode && statementBuilder.code !== '') {
                    arkIRTransformer.cppNodeToStmts(statementBuilder.astNode).forEach(s => stmtsInBlock.push(s));
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

    private generateReturnStmt(arkIRTransformer: ArkIRTransformerCpp): Stmt {
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
        arkIRTransformer: ArkIRTransformerCpp
    ): void {
        const loopBuilder = new LoopBuilder();
        loopBuilder.rebuildBlocksInLoop(blockBuilderToCfgBlock, blocksContainLoopCondition, basicBlockSet, this.blocks);
        const switchBuilder = new SwitchBuilder();
        switchBuilder.buildSwitch(blockBuilderToCfgBlock, blockBuildersContainSwitch, valueAndStmtsOfSwitchAndCasesAll, arkIRTransformer, basicBlockSet);
        const conditionalBuilder = new ConditionBuilder();
        conditionalBuilder.rebuildBlocksContainConditionalOperator(
            blockBuilderToCfgBlock,
            basicBlockSet,
            ModelUtils.isArkUIBuilderMethod(this.declaringMethod)
        );
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
