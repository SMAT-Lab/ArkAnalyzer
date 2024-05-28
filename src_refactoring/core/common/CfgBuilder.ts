import * as ts from 'typescript';
import Logger from "../../utils/logger";
import {Constant} from '../base/Constant';
import {
    AbstractInvokeExpr,
    ArkBinopExpr,
    ArkCastExpr,
    ArkConditionExpr,
    ArkInstanceInvokeExpr,
    ArkLengthExpr,
    ArkNewArrayExpr,
    ArkNewExpr,
    ArkStaticInvokeExpr,
    ArkTypeOfExpr,
    ArkUnopExpr
} from '../base/Expr';
import {Local} from '../base/Local';
import {
    AbstractFieldRef,
    ArkArrayRef,
    ArkCaughtExceptionRef,
    ArkInstanceFieldRef,
    ArkParameterRef,
    ArkStaticFieldRef,
    ArkThisRef
} from '../base/Ref';
import {
    ArkAssignStmt,
    ArkDeleteStmt,
    ArkGotoStmt,
    ArkIfStmt,
    ArkInvokeStmt,
    ArkReturnStmt,
    ArkReturnVoidStmt,
    ArkSwitchStmt,
    ArkThrowStmt,
    Stmt
} from '../base/Stmt';
import {
    AnnotationNamespaceType,
    AnnotationTypeQueryType,
    AnyType,
    ArrayObjectType,
    ArrayType,
    CallableType,
    ClassType,
    NumberType,
    StringType,
    TupleType,
    Type,
    UndefinedType,
    UnionType,
    UnknownType
} from '../base/Type';
import {Value} from '../base/Value';
import {BasicBlock} from '../graph/BasicBlock';
import {Cfg} from '../graph/Cfg';
import {ArkClass} from '../model/ArkClass';
import {ArkMethod} from '../model/ArkMethod';
import {ClassSignature, FieldSignature, MethodSignature, MethodSubSignature} from '../model/ArkSignature';
import {ExportInfo} from '../model/ArkExport';
import {IRUtils} from './IRUtils';
import {TypeInference} from './TypeInference';
import {LineColPosition} from "../base/Position";
import {MethodLikeNode, buildArkMethodFromArkClass} from "../model/builder/ArkMethodBuilder";
import {buildNormalArkClassFromArkFile, buildNormalArkClassFromArkNamespace} from "../model/builder/ArkClassBuilder";

const logger = Logger.getLogger();

class StatementBuilder {
    type: string;
    //节点对应源代码    
    code: string;
    next: StatementBuilder | null;
    lasts: StatementBuilder[];
    walked: boolean;
    index: number;
    // TODO:以下两个属性需要获取    
    line: number;//行号//ast节点存了一个start值为这段代码的起始地址，可以从start开始往回查原文有几个换行符确定行号    
    column: number; // 列  
    astNode: ts.Node | null;//ast节点对象
    // use: Set<Variable>;
    // def: Set<Variable>;
    // defspecial: Set<Variable>;
    scopeID: number;
    addressCode3: string[];
    threeAddressStmts: Stmt[];
    haveCall: boolean;
    block: Block | null;
    ifExitPass: boolean;
    passTmies: number = 0;
    numOfIdentifier: number = 0;
    isDoWhile: boolean = false;

    constructor(type: string, code: string, astNode: ts.Node | null, scopeID: number) {
        this.type = type;
        this.code = code;
        this.next = null;
        this.lasts = [];
        this.walked = false;
        this.index = 0;
        this.line = 0;
        this.astNode = astNode;
        this.scopeID = scopeID;
        // this.use = new Set<Variable>;
        // this.def = new Set<Variable>;
        // this.defspecial = new Set<Variable>;
        // this.addressCode3 = [];
        this.threeAddressStmts = [];
        this.haveCall = false;
        this.block = null;
        this.ifExitPass = false
    }
}

class ConditionStatementBuilder extends StatementBuilder {
    nextT: StatementBuilder | null;
    nextF: StatementBuilder | null;
    loopBlock: Block | null;
    condition: string;
    doStatement: StatementBuilder | null = null;

    constructor(type: string, code: string, astNode: ts.Node, scopeID: number) {
        super(type, code, astNode, scopeID);
        this.nextT = null;
        this.nextF = null;
        this.loopBlock = null;
        this.condition = "";
    }
}

class SwitchStatementBuilder extends StatementBuilder {
    nexts: StatementBuilder[];
    cases: Case[] = [];
    default: StatementBuilder | null = null;

    constructor(type: string, code: string, astNode: ts.Node, scopeID: number) {
        super(type, code, astNode, scopeID);
        this.nexts = [];
    }
}

class TryStatementBuilder extends StatementBuilder {
    tryFirst: StatementBuilder | null = null;
    tryExit: StatementBuilder | null = null;
    catchStatement: StatementBuilder | null = null;
    catchError: string = "";
    finallyStatement: StatementBuilder | null = null;

    constructor(type: string, code: string, astNode: ts.Node, scopeID: number) {
        super(type, code, astNode, scopeID);
    }
}

class Case {
    value: string;
    stm: StatementBuilder;

    constructor(value: string, stm: StatementBuilder) {
        this.value = value;
        this.stm = stm;
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
    level: number;
    parent: Scope | null;

    constructor(id: number, variable: Set<String>, level: number) {
        this.id = id;
        this.level = level;
        this.parent = null;
    }
}

class Block {
    id: number;
    stms: StatementBuilder[];
    nexts: Set<Block>;
    lasts: Set<Block>;
    walked: boolean = false;
    loopStmt: StatementBuilder | null;

    constructor(id: number, stms: StatementBuilder[], loopStmt: StatementBuilder | null) {
        this.id = id;
        this.stms = stms;
        this.nexts = new Set();
        this.lasts = new Set();
        this.loopStmt = loopStmt;
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

class textError extends Error {
    constructor(message: string) {
        // 调用父类的构造函数，并传入错误消息
        super(message);

        // 设置错误类型的名称
        this.name = "textError";
    }
}

function getNumOfIdentifier(node: ts.Node, sourceFile: ts.SourceFile): number {
    let num = 0;
    if (ts.SyntaxKind[node.kind] == "Identifier")
        return 1;
    for (let child of node.getChildren(sourceFile))
        num += getNumOfIdentifier(child, sourceFile);
    return num;
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
    scopeLevel: number;
    tempVariableNum: number;
    current3ACstm: StatementBuilder;
    blocks: Block[];
    entryBlock: Block;
    exitBlock: Block;
    currentDeclarationKeyword: string;
    variables: Variable[];
    declaringClass: ArkClass;
    importFromPath: string[];
    catches: Catch[];

    anonymousFuncIndex: number;
    anonymousFunctions: CfgBuilder[];

    anonymousClassIndex: number;
    private sourceFile: ts.SourceFile;
    private declaringMethod: ArkMethod;

    private locals: Set<Local> = new Set();
    private thisLocal: Local = new Local('this');
    private paraLocals: Local[] = [];

    constructor(ast: ts.Node, name: string, declaringMethod: ArkMethod, sourceFile: ts.SourceFile) {
        this.name = name;
        this.astRoot = ast;
        this.declaringMethod = declaringMethod;
        this.declaringClass = declaringMethod.getDeclaringArkClass();
        this.entry = new StatementBuilder("entry", "", ast, 0);
        this.loopStack = [];
        this.switchExitStack = [];
        this.functions = [];
        this.breakin = "";
        this.statementArray = [];
        this.dotEdges = [];
        this.exit = new StatementBuilder("exit", "return;", null, 0);
        this.scopes = [];
        this.scopeLevel = 0;
        this.tempVariableNum = 0;
        this.current3ACstm = this.entry;
        this.blocks = [];
        this.entryBlock = new Block(this.blocks.length, [this.entry], null);
        this.exitBlock = new Block(-1, [this.entry], null);
        this.currentDeclarationKeyword = "";
        this.variables = [];
        this.importFromPath = [];
        this.catches = [];
        this.anonymousFuncIndex = 0;
        this.anonymousFunctions = [];
        this.anonymousClassIndex = 0;
        this.sourceFile = sourceFile;
        this.buildCfgBuilder();
    }

    walkAST(lastStatement: StatementBuilder, nextStatement: StatementBuilder, nodes: ts.Node[]) {
        function judgeLastType(s: StatementBuilder) {
            if (lastStatement.type == "ifStatement") {
                let lastIf = lastStatement as ConditionStatementBuilder;
                if (lastIf.nextT == null) {
                    lastIf.nextT = s;
                } else {
                    lastIf.nextF = s;
                }
            } else if (lastStatement.type == "loopStatement") {
                let lastLoop = lastStatement as ConditionStatementBuilder;
                lastLoop.nextT = s;
            } else if (lastStatement.type == "catchOrNot") {
                let lastLoop = lastStatement as ConditionStatementBuilder;
                lastLoop.nextT = s;
            } else {
                lastStatement.next = s;
            }

        }

        function checkBlock(node: ts.Node, sourceFile: ts.SourceFile): ts.Node | null {
            if (ts.SyntaxKind[node.kind] == "Block")
                return node;
            else {
                let ret: ts.Node | null = null;
                for (let child of node.getChildren(sourceFile)) {
                    ret = ret || checkBlock(child, sourceFile);
                }
                return ret;
            }
        }

        function getAnonymous(node: ts.Node, sourceFile: ts.SourceFile): ts.Node | null {
            const stack: ts.Node[] = [];
            stack.push(node);
            while (stack.length > 0) {
                const n = stack.pop();
                if (!n)
                    return null;
                if (ts.SyntaxKind[n?.kind] == "FunctionExpression" || ts.SyntaxKind[n?.kind] == "ArrowFunction") {
                    return n;
                }
                if (n.getChildren(sourceFile)) {
                    for (let i = n.getChildren(sourceFile).length - 1; i >= 0; i--) {
                        stack.push(n.getChildren(sourceFile)[i]);
                    }
                }
            }
            return null;
        }

        // logger.info(node.getText(this.sourceFile))

        this.scopeLevel++;
        let scope = new Scope(this.scopes.length, new Set(), this.scopeLevel);
        for (let i = this.scopes.length - 1; i >= 0; i--) {
            if (this.scopes[i].level == this.scopeLevel - 1) {
                scope.parent = this.scopes[i];
                break;
            }
        }
        this.scopes.push(scope)

        for (let i = 0; i < nodes.length; i++) {
            let c = nodes[i];
            if (ts.isVariableStatement(c) || ts.isExpressionStatement(c) || ts.isThrowStatement(c)) {
                let s = new StatementBuilder("statement", c.getText(this.sourceFile), c, scope.id);
                judgeLastType(s);
                lastStatement = s;
            } else if (ts.isReturnStatement(c)) {
                let s = new StatementBuilder("returnStatement", c.getText(this.sourceFile), c, scope.id);
                judgeLastType(s);
                s.astNode = c;
                lastStatement = s;
                break;
            } else if (ts.isBreakStatement(c)) {
                let brstm = new StatementBuilder("breakStatement", "break;", c, scope.id);
                judgeLastType(brstm);
                let p: ts.Node | null = c;
                while (p) {
                    if (ts.SyntaxKind[p.kind].includes("While") || ts.SyntaxKind[p.kind].includes("For")) {
                        brstm.next = this.loopStack[this.loopStack.length - 1].nextF;
                        break;
                    }
                    if (ts.SyntaxKind[p.kind].includes("CaseClause") || ts.SyntaxKind[p.kind].includes("DefaultClause")) {
                        brstm.next = this.switchExitStack[this.switchExitStack.length - 1];
                        break;
                    }
                    p = p.parent;
                }
                lastStatement = brstm;
            } else if (ts.isContinueStatement(c)) {
                let constm = new StatementBuilder("continueStatement", "continue;", c, scope.id);
                judgeLastType(constm);
                constm.next = this.loopStack[this.loopStack.length - 1];
                lastStatement = constm;
            } else if (ts.isIfStatement(c)) {
                let ifstm: ConditionStatementBuilder = new ConditionStatementBuilder("ifStatement", "", c, scope.id);
                judgeLastType(ifstm);
                let ifexit: StatementBuilder = new StatementBuilder("ifExit", "", c, scope.id);
                ifstm.condition = c.expression.getText(this.sourceFile);
                ifstm.code = "if (" + ifstm.condition + ")";
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
                }
                if (!ifstm.nextF) {
                    ifstm.nextF = ifexit;
                }
                lastStatement = ifexit;
            } else if (ts.isWhileStatement(c)) {
                this.breakin = "loop";
                let loopstm = new ConditionStatementBuilder("loopStatement", "", c, scope.id);
                this.loopStack.push(loopstm);
                judgeLastType(loopstm);
                let loopExit = new StatementBuilder("loopExit", "", c, scope.id);
                loopstm.nextF = loopExit;
                loopstm.condition = c.expression.getText(this.sourceFile);
                loopstm.code = "if (" + loopstm.condition + ")";
                if (ts.isBlock(c.statement)) {
                    this.walkAST(loopstm, loopExit, [...c.statement.statements]);
                } else {
                    this.walkAST(loopstm, loopExit, [c.statement]);
                }
                if (!loopstm.nextF) {
                    loopstm.nextF = loopExit;
                }
                if (!loopstm.nextT) {
                    loopstm.nextT = loopExit;
                }
                lastStatement = loopExit;
                this.loopStack.pop();
            }
            if (ts.isForStatement(c) || ts.isForInStatement(c) || ts.isForOfStatement(c)) {
                this.breakin = "loop";
                let loopstm = new ConditionStatementBuilder("loopStatement", "", c, scope.id);
                this.loopStack.push(loopstm);
                judgeLastType(loopstm);
                let loopExit = new StatementBuilder("loopExit", "", c, scope.id);
                loopstm.nextF = loopExit;
                if (ts.isForStatement(c)) {
                    loopstm.code = c.initializer?.getText(this.sourceFile) + "; " + c.condition?.getText(this.sourceFile) + "; " + c.incrementor?.getText(this.sourceFile);
                } else if (ts.isForOfStatement(c)) {
                    loopExit.code = c.initializer?.getText(this.sourceFile) + " of " + c.expression.getText(this.sourceFile);
                } else {
                    loopExit.code = c.initializer?.getText(this.sourceFile) + " in " + c.expression.getText(this.sourceFile);
                }
                if (ts.isBlock(c.statement)) {
                    this.walkAST(loopstm, loopExit, [...c.statement.statements]);
                } else {
                    this.walkAST(loopstm, loopExit, [c.statement]);
                }
                if (!loopstm.nextF) {
                    loopstm.nextF = loopExit;
                }
                if (!loopstm.nextT) {
                    loopstm.nextT = loopExit;
                }
                lastStatement = loopExit;
                this.loopStack.pop();
            } else if (ts.isDoStatement(c)) {
                this.breakin = "loop";
                let loopstm = new ConditionStatementBuilder("loopStatement", "", c, scope.id);
                this.loopStack.push(loopstm);
                let loopExit = new StatementBuilder("loopExit", "", c, scope.id);
                loopstm.nextF = loopExit;
                loopstm.condition = c.expression.getText(this.sourceFile);
                loopstm.code = "while (" + loopstm.condition + ")";
                if (ts.isBlock(c.statement)) {
                    this.walkAST(lastStatement, loopstm, [...c.statement.statements]);
                } else {
                    this.walkAST(lastStatement, loopstm, [c.statement]);
                }
                let lastType = lastStatement.type;
                if (lastType == "ifStatement" || lastType == "loopStatement") {
                    let lastCondition = lastStatement as ConditionStatementBuilder;
                    loopstm.nextT = lastCondition.nextT;
                } else {
                    loopstm.nextT = lastStatement.next;
                }
                if (loopstm.nextT && loopstm.nextT != loopstm) {
                    loopstm.nextT.isDoWhile = true;
                    loopstm.doStatement = loopstm.nextT;
                }
                lastStatement = loopExit;
                this.loopStack.pop();
            } else if (ts.isSwitchStatement(c)) {
                this.breakin = "switch";
                let switchstm = new SwitchStatementBuilder("switchStatement", "", c, scope.id);
                judgeLastType(switchstm);
                let switchExit = new StatementBuilder("switchExit", "", null, scope.id);
                this.switchExitStack.push(switchExit);
                switchExit.code = "switch (" + c.expression + ")";
                let lastCaseExit: StatementBuilder | null = null;
                for (let i = 0; i < c.caseBlock.clauses.length; i++) {
                    const clause = c.caseBlock.clauses[i];
                    let casestm: StatementBuilder;
                    if (ts.isCaseClause(clause)) {
                        casestm = new StatementBuilder("statement", "case " + clause.expression + ":", clause, scope.id);
                    } else {
                        casestm = new StatementBuilder("statement", "default:", clause, scope.id);
                    }

                    switchstm.nexts.push(casestm);
                    let caseExit = new StatementBuilder("caseExit", "", null, scope.id);
                    this.walkAST(casestm, caseExit, [...clause.statements]);
                    if (ts.isCaseClause(clause)) {
                        const cas = new Case(casestm.code, casestm.next!);
                        switchstm.cases.push(cas);
                    } else {
                        switchstm.default = casestm.next;
                    }

                    if (lastCaseExit) {
                        lastCaseExit.next = casestm.next;
                    }
                    lastCaseExit = caseExit;
                    if (i == c.caseBlock.clauses.length - 1) {
                        caseExit.next = switchExit;
                    }
                }

                lastStatement = switchExit;
                this.switchExitStack.pop();
            } else if (ts.isBlock(c)) {
                let blockExit = new StatementBuilder("blockExit", "", c, scope.id);
                this.walkAST(lastStatement, blockExit, c.getChildren(this.sourceFile)[1].getChildren(this.sourceFile));
                lastStatement = blockExit;
            } else if (ts.isTryStatement(c)) {
                let trystm = new TryStatementBuilder("tryStatement", "try", c, scope.id);
                judgeLastType(trystm);
                let tryExit = new StatementBuilder("try exit", "", c, scope.id);
                trystm.tryExit = tryExit;
                this.walkAST(trystm, tryExit, [...c.tryBlock.statements]);
                trystm.tryFirst = trystm.next;
                if (c.catchClause) {
                    let text = "catch";
                    if (c.catchClause.variableDeclaration) {
                        text += "(" + c.catchClause.variableDeclaration.getText(this.sourceFile) + ")";
                    }
                    let catchOrNot = new ConditionStatementBuilder("catchOrNot", text, c, scope.id);
                    let catchExit = new StatementBuilder("catch exit", "", c, scope.id);
                    catchOrNot.nextF = catchExit;
                    this.walkAST(catchOrNot, catchExit, [...c.catchClause.block.statements]);
                    if (!catchOrNot.nextT) {
                        catchOrNot.nextT = catchExit;
                    }
                    const catchStatement = new StatementBuilder("statement", catchOrNot.code, c.catchClause, catchOrNot.nextT.scopeID);
                    catchStatement.next = catchOrNot.nextT;
                    trystm.catchStatement = catchStatement;
                    if (c.catchClause.variableDeclaration) {
                        trystm.catchError = c.catchClause.variableDeclaration.getText(this.sourceFile);
                    } else {
                        trystm.catchError = "Error";
                    }

                }
                if (c.finallyBlock && c.finallyBlock.statements.length > 0) {
                    let final = new StatementBuilder("statement", "finally", c, scope.id);
                    let finalExit = new StatementBuilder("finally exit", "", c, scope.id);
                    this.walkAST(final, finalExit, [...c.finallyBlock.statements]);
                    trystm.finallyStatement = final.next;
                }
                lastStatement = trystm;
            }

        }
        this.scopeLevel--;
        if (lastStatement.type != "breakStatement" && lastStatement.type != "continueStatement") {
            lastStatement.next = nextStatement;
        }
    }

    addReturnInEmptyMethod() {
        if (this.entry.next == this.exit) {
            const ret = new StatementBuilder("returnStatement", "return;", null, this.entry.scopeID);
            this.entry.next = ret;
            ret.next = this.exit;
        }
    }

    deleteExit(stm: StatementBuilder) {
        if (stm.walked)
            return;
        stm.walked = true;
        if (stm.type == "ifStatement" || stm.type == "loopStatement" || stm.type == "catchOrNot") {
            let cstm = stm as ConditionStatementBuilder;
            if (cstm.nextT?.type.includes("Exit")) {
                let p = cstm.nextT;
                while (p.type.includes("Exit")) {
                    if (p.next == null) {
                        logger.error("exit error");
                        process.exit();
                    }
                    p = p.next;
                }
                cstm.nextT = p;
            }
            if (cstm.nextF?.type.includes("Exit")) {
                let p = cstm.nextF;
                while (p.type.includes("Exit")) {
                    if (p.next == null) {
                        logger.error("exit error");
                        process.exit();
                    }
                    p = p.next;
                }
                cstm.nextF = p;
            }
            if (cstm.nextT == null || cstm.nextF == null) {
                this.errorTest(cstm);
                return;
            }
            this.deleteExit(cstm.nextT);
            this.deleteExit(cstm.nextF);
        } else if (stm.type == "switchStatement") {
            let sstm = stm as SwitchStatementBuilder;
            for (let j in sstm.nexts) {
                let caseClause = sstm.nexts[j];
                if (caseClause.type.includes("Exit")) {
                    let p = caseClause;
                    while (p.type.includes("Exit")) {
                        if (p.next == null) {
                            logger.error("exit error");
                            process.exit();
                        }
                        p = p.next;
                    }
                    sstm.nexts[j] = p;
                }
                this.deleteExit(sstm.nexts[j]);
            }
        } else if (stm.type == "tryStatement") {
            let trystm = stm as TryStatementBuilder;
            if (trystm.tryFirst) {
                this.deleteExit(trystm.tryFirst);
            }
            if (trystm.catchStatement) {
                this.deleteExit(trystm.catchStatement);
            }
            if (trystm.finallyStatement) {
                this.deleteExit(trystm.finallyStatement);
            }
        } else {
            if (stm.next?.type.includes("Exit")) {
                let p = stm.next;
                while (p.type.includes("Exit")) {
                    if (p.next == null) {
                        logger.error("error exit");
                        process.exit();
                    }
                    p = p.next;
                }
                stm.next = p;
            }
            if (stm.next)
                this.deleteExit(stm.next);
        }
    }

    buildNewBlock(stms: StatementBuilder[]): Block {
        let block: Block;
        if (this.blocks.length > 0 && this.blocks[this.blocks.length - 1].stms.length == 0) {
            block = this.blocks[this.blocks.length - 1];
            block.stms = stms;
        } else {
            block = new Block(this.blocks.length, stms, null);
            this.blocks.push(block);
        }
        return block;
    }

    buildBlocks(stm: StatementBuilder, block: Block) {
        if (stm.type.includes(" exit")) {
            stm.block = block;
            return;
        }
        if (stm.walked || stm.type == "exit")
            return;
        stm.walked = true;
        if (stm.type == "entry") {
            let b = this.buildNewBlock([]);
            // block.nexts.push(b);
            if (stm.next != null)
                this.buildBlocks(stm.next, b);
            return;
        }
        if (stm.type != "loopStatement" && stm.type != "tryStatement" || (stm instanceof ConditionStatementBuilder && stm.doStatement)) {
            block.stms.push(stm);
            stm.block = block;
        }
        if (stm.type == "ifStatement" || stm.type == "loopStatement" || stm.type == "catchOrNot") {
            let cstm = stm as ConditionStatementBuilder;
            if (cstm.nextT == null || cstm.nextF == null) {
                this.errorTest(cstm);
                return;
            }
            if (cstm.type == "loopStatement" && !cstm.doStatement) {
                let loopBlock = this.buildNewBlock([cstm]);
                block = loopBlock;
                cstm.block = block;
            }
            let b1 = this.buildNewBlock([]);
            this.buildBlocks(cstm.nextT, b1);
            let b2 = this.buildNewBlock([]);
            this.buildBlocks(cstm.nextF, b2);
        } else if (stm.type == "switchStatement") {
            let sstm = stm as SwitchStatementBuilder;
            for (const cas of sstm.cases) {
                this.buildBlocks(cas.stm, this.buildNewBlock([]));
            }
            if (sstm.default) {
                this.buildBlocks(sstm.default, this.buildNewBlock([]));
            }

        } else if (stm.type == "tryStatement") {
            let trystm = stm as TryStatementBuilder;
            if (!trystm.tryFirst) {
                logger.error("try without tryFirst");
                process.exit();
            }
            let tryFirstBlock = this.buildNewBlock([]);
            trystm.block = tryFirstBlock;
            if (block.stms.length > 0) {
                block.nexts.add(tryFirstBlock);
                tryFirstBlock.lasts.add(block);
            }
            this.buildBlocks(trystm.tryFirst, tryFirstBlock);

            const lastBlocksInTry: Set<Block> = new Set();
            if (!trystm.tryExit) {
                process.exit();
            }
            for (let stm of trystm.tryExit.lasts) {
                if (stm.block)
                    lastBlocksInTry.add(stm.block);
            }

            let finallyBlock = this.buildNewBlock([]);
            let lastFinallyBlock: Block | null = null;
            if (trystm.finallyStatement) {
                this.buildBlocks(trystm.finallyStatement, finallyBlock);
                lastFinallyBlock = this.blocks[this.blocks.length - 1];
            } else {
                let stm = new StatementBuilder("tmp", "", null, -1);
                finallyBlock.stms = [stm];
            }
            for (let lastBlockInTry of lastBlocksInTry) {
                lastBlockInTry.nexts.add(finallyBlock);
                finallyBlock.lasts.add(lastBlockInTry);
            }
            if (trystm.catchStatement) {
                let catchBlock = this.buildNewBlock([]);
                this.buildBlocks(trystm.catchStatement, catchBlock);
                for (let lastBlockInTry of lastBlocksInTry) {
                    lastBlockInTry.nexts.add(catchBlock);
                    catchBlock.lasts.add(lastBlockInTry);
                }

                catchBlock.nexts.add(finallyBlock);
                finallyBlock.lasts.add(catchBlock);
                this.catches.push(new Catch(trystm.catchError, tryFirstBlock.id, finallyBlock.id, catchBlock.id));
            }
            let nextBlock = this.buildNewBlock([]);
            if (lastFinallyBlock) {
                finallyBlock = lastFinallyBlock;
            }
            if (trystm.next)
                this.buildBlocks(trystm.next, nextBlock);
            let goto = new StatementBuilder("gotoStatement", "goto label" + nextBlock.id, null, trystm.tryFirst.scopeID);
            goto.block = finallyBlock;
            if (trystm.finallyStatement) {
                if (trystm.catchStatement)
                    finallyBlock.stms.push(goto);
            } else {
                finallyBlock.stms = [goto];
            }
            finallyBlock.nexts.add(nextBlock);
            nextBlock.lasts.add(finallyBlock);
            if (nextBlock.stms.length == 0) {
                const returnStatement = new StatementBuilder("returnStatement", "return;", null, trystm.tryFirst.scopeID);
                goto.next = returnStatement;
                returnStatement.lasts = [goto];
                nextBlock.stms.push(returnStatement);
                returnStatement.block = nextBlock;
            }
        } else {
            if (stm.next) {
                if (stm.type == "continueStatement" && stm.next.block) {
                    return;
                }
                if (stm.next.type == "loopStatement" && stm.next.block) {
                    block = stm.next.block;
                    return;
                }

                stm.next.passTmies++;
                if (stm.next.passTmies == stm.next.lasts.length || (stm.next.type == "loopStatement") || stm.next.isDoWhile) {
                    if (stm.next.scopeID != stm.scopeID && !stm.next.type.includes(" exit") && !(stm.next instanceof ConditionStatementBuilder && stm.next.doStatement)) {
                        let b = this.buildNewBlock([]);
                        block = b;
                    }
                    this.buildBlocks(stm.next, block);
                }
            }
        }
    }

    buildBlocksNextLast() {
        for (let block of this.blocks) {
            for (let originStatement of block.stms) {
                let lastStatement = (block.stms.indexOf(originStatement) == block.stms.length - 1);
                if (originStatement instanceof ConditionStatementBuilder) {
                    let nextT = originStatement.nextT?.block;
                    if (nextT && (lastStatement || nextT != block) && !originStatement.nextT?.type.includes(" exit")) {
                        block.nexts.add(nextT);
                        nextT.lasts.add(block);
                    }
                    let nextF = originStatement.nextF?.block;
                    if (nextF && (lastStatement || nextF != block) && !originStatement.nextF?.type.includes(" exit")) {
                        block.nexts.add(nextF);
                        nextF.lasts.add(block);
                    }
                } else if (originStatement instanceof SwitchStatementBuilder) {
                    for (const cas of originStatement.cases) {
                        const next = cas.stm.block;
                        if (next && (lastStatement || next != block) && !cas.stm.type.includes(" exit")) {
                            block.nexts.add(next);
                            next.lasts.add(block);
                        }
                    }
                    if (originStatement.default) {
                        const next = originStatement.default.block;
                        if (next && (lastStatement || next != block) && !originStatement.default.type.includes(" exit")) {
                            block.nexts.add(next);
                            next.lasts.add(block);
                        }
                    }
                } else {
                    let next = originStatement.next?.block;
                    if (next && (lastStatement || next != block) && !originStatement.next?.type.includes(" exit")) {
                        block.nexts.add(next);
                        next.lasts.add(block);
                    }
                }

            }
        }
    }

    addReturnBlock() {
        let notReturnStmts: StatementBuilder[] = [];
        for (let stmt of this.exit.lasts) {
            if (stmt.type != "returnStatement") {
                notReturnStmts.push(stmt);
            }
        }
        if (notReturnStmts.length < 1) {
            return;
        }
        const returnStatement = new StatementBuilder("returnStatement", "return;", null, this.exit.scopeID);
        if (notReturnStmts.length == 1 && !(notReturnStmts[0] instanceof ConditionStatementBuilder)) {
            const notReturnStmt = notReturnStmts[0];
            notReturnStmt.next = returnStatement;
            returnStatement.lasts = [notReturnStmt];
            returnStatement.next = this.exit;
            this.exit.lasts[this.exit.lasts.indexOf(notReturnStmt)] = returnStatement;
            notReturnStmt.block?.stms.push(returnStatement);
            returnStatement.block = notReturnStmt.block;
        } else {
            let returnBlock = new Block(this.blocks.length, [returnStatement], null);
            returnStatement.block = returnBlock;
            this.blocks.push(returnBlock);
            for (const notReturnStmt of notReturnStmts) {
                notReturnStmt.next = returnStatement;
                returnStatement.lasts.push(notReturnStmt);
                returnStatement.next = this.exit;
                this.exit.lasts[this.exit.lasts.indexOf(notReturnStmt)] = returnStatement;
                notReturnStmt.block?.nexts.add(returnBlock);
            }
        }
    }

    nodeHaveCall(node: ts.Node): boolean {
        if (ts.SyntaxKind[node.kind] == "CallExpression" || ts.SyntaxKind[node.kind] == "NewExpression") {
            return true;
        }
        let haveCall = false;
        for (let child of node.getChildren(this.sourceFile)) {
            if (ts.SyntaxKind[child.kind] == "Block")
                continue;
            haveCall = haveCall || this.nodeHaveCall(child);
        }
        return haveCall;
    }

    buildLastAndHaveCall(stm: StatementBuilder) {
        if (stm.walked)
            return;
        stm.walked = true;
        if (stm.astNode) {
            stm.haveCall = this.nodeHaveCall(stm.astNode);
            const start = stm.astNode.getStart(this.sourceFile);
            const position = ts.getLineAndCharacterOfPosition(this.sourceFile, start);
            stm.line = position.line + 1; // ast的行号是从0开始
            stm.column = position.character + 1;
        }

        if (stm.type == "ifStatement" || stm.type == "loopStatement" || stm.type == "catchOrNot") {
            let cstm = stm as ConditionStatementBuilder;
            if (cstm.nextT == null || cstm.nextF == null) {
                this.errorTest(cstm);
                return;
            }
            cstm.nextT.lasts.push(cstm);
            cstm.nextF.lasts.push(cstm);
            this.buildLastAndHaveCall(cstm.nextT);
            this.buildLastAndHaveCall(cstm.nextF);
        } else if (stm.type == "switchStatement") {
            let sstm = stm as SwitchStatementBuilder;
            for (let s of sstm.nexts) {
                s.lasts.push(sstm);
                this.buildLastAndHaveCall(s);
            }
        } else if (stm.type == "tryStatement") {
            let trystm = stm as TryStatementBuilder;
            if (trystm.tryFirst) {
                this.buildLastAndHaveCall(trystm.tryFirst);
            }
            if (trystm.catchStatement) {
                this.buildLastAndHaveCall(trystm.catchStatement);
            }
            if (trystm.finallyStatement) {
                this.buildLastAndHaveCall(trystm.finallyStatement);
            }
        } else {
            if (stm.next) {
                stm.next?.lasts.push(stm);
                this.buildLastAndHaveCall(stm.next);
            }
        }

    }

    resetWalked() {
        for (let stm of this.statementArray) {
            stm.walked = false;
        }
    }

    resetWalkedPartial(stm: StatementBuilder) {
        if (!stm.walked)
            return;
        stm.walked = false;
        if (stm.type == "ifStatement" || stm.type == "loopStatement" || stm.type == "catchOrNot") {
            let cstm = stm as ConditionStatementBuilder;
            if (cstm.nextT == null || cstm.nextF == null) {
                this.errorTest(cstm);
                return;
            }
            this.resetWalkedPartial(cstm.nextF);
            this.resetWalkedPartial(cstm.nextT);
        } else if (stm.type == "switchStatement") {
            let sstm = stm as SwitchStatementBuilder;
            for (let j in sstm.nexts) {
                this.resetWalkedPartial(sstm.nexts[j]);
            }
        } else if (stm.type == "tryStatement") {
            let trystm = stm as TryStatementBuilder;
            if (trystm.tryFirst) {
                this.resetWalkedPartial(trystm.tryFirst);
            }
            if (trystm.catchStatement) {
                this.resetWalkedPartial(trystm.catchStatement);
            }
            if (trystm.finallyStatement) {
                this.resetWalkedPartial(trystm.finallyStatement);
            }
        } else {
            if (stm.next != null)
                this.resetWalkedPartial(stm.next);
        }

    }


    CfgBuilder2Array(stm: StatementBuilder) {

        if (!stm.walked)
            return;
        stm.walked = false;
        stm.index = this.statementArray.length;
        if (!stm.type.includes(" exit"))
            this.statementArray.push(stm);
        if (stm.type == "ifStatement" || stm.type == "loopStatement" || stm.type == "catchOrNot") {
            let cstm = stm as ConditionStatementBuilder;
            if (cstm.nextT == null || cstm.nextF == null) {
                this.errorTest(cstm);
                return;
            }
            this.CfgBuilder2Array(cstm.nextF);
            this.CfgBuilder2Array(cstm.nextT);
        } else if (stm.type == "switchStatement") {
            let sstm = stm as SwitchStatementBuilder;
            for (let ss of sstm.nexts) {
                this.CfgBuilder2Array(ss);
            }
        } else if (stm.type == "tryStatement") {
            let trystm = stm as TryStatementBuilder;
            if (trystm.tryFirst) {
                this.CfgBuilder2Array(trystm.tryFirst);
            }
            if (trystm.catchStatement) {
                this.CfgBuilder2Array(trystm.catchStatement);
            }
            if (trystm.finallyStatement) {
                this.CfgBuilder2Array(trystm.finallyStatement);
            }
        } else {
            if (stm.next != null)
                this.CfgBuilder2Array(stm.next);
        }
    }

    getDotEdges(stm: StatementBuilder) {
        if (this.statementArray.length == 0)
            this.CfgBuilder2Array(this.entry);
        if (stm.walked)
            return;
        stm.walked = true;
        if (stm.type == "ifStatement" || stm.type == "loopStatement" || stm.type == "catchOrNot") {
            let cstm = stm as ConditionStatementBuilder;
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
        } else if (stm.type == "switchStatement") {
            let sstm = stm as SwitchStatementBuilder;
            for (let ss of sstm.nexts) {
                let edge = [sstm.index, ss.index];
                this.dotEdges.push(edge);
                this.getDotEdges(ss);
            }
        } else {
            if (stm.next != null) {
                let edge = [stm.index, stm.next.index];
                this.dotEdges.push(edge);
                this.getDotEdges(stm.next);
            }
        }
    }

    findChildIndex(node: ts.Node, kind: string): number {
        for (let i = 0; i < node.getChildren(this.sourceFile).length; i++) {
            if (ts.SyntaxKind[node.getChildren(this.sourceFile)[i].kind] == kind)
                return i;
        }
        return -1;
    }


    // utils begin
    private getChild(node: ts.Node, childKind: string): ts.Node | null {
        for (let i = 0; i < node.getChildren(this.sourceFile).length; i++) {
            if (ts.SyntaxKind[node.getChildren(this.sourceFile)[i].kind] == childKind)
                return node.getChildren(this.sourceFile)[i];
        }
        return null;
    }

    private needExpansion(node: ts.Node): boolean {
        let nodeKind = ts.SyntaxKind[node.kind];
        if (nodeKind == 'PropertyAccessExpression' || nodeKind == 'CallExpression') {
            return true;
        }
        return false;
    }

    private support(node: ts.Node): boolean {
        let nodeKind = ts.SyntaxKind[node.kind];
        if (nodeKind == 'ImportDeclaration' || nodeKind == 'TypeAliasDeclaration') {
            return false;
        }
        return true;
    }

    private getSyntaxListItems(node: ts.Node): ts.Node[] {
        let items: ts.Node[] = [];
        for (const child of node.getChildren(this.sourceFile)) {
            if (ts.SyntaxKind[child.kind] != 'CommaToken') {
                items.push(child);
            }
        }
        return items;
    }

    // temp function
    private nopStmt(node: ts.Node): boolean {
        let nodeKind = ts.SyntaxKind[node.kind];
        if (nodeKind == 'BinaryExpression' || nodeKind == 'VoidExpression') {
            return true;
        }
        return false;
    }

    private shouldBeConstant(node: ts.Node): boolean {
        let nodeKind = ts.SyntaxKind[node.kind];
        if (nodeKind == 'FirstTemplateToken' ||
            (nodeKind.includes('Literal') && nodeKind != 'ArrayLiteralExpression' && nodeKind != 'ObjectLiteralExpression') ||
            nodeKind == 'NullKeyword' || nodeKind == 'TrueKeyword' || nodeKind == 'FalseKeyword') {
            return true;
        }
        return false;
    }

    private getOriginalLocal(local: Local, addToLocal: boolean = true): Local {
        let oriName = local.getName();
        for (const oriLocal of this.locals) {
            if (oriLocal.getName() == oriName) {
                return oriLocal;
            }
        }
        if (addToLocal) {
            this.locals.add(local);
        }
        return local;
    }

    // utils end


    private generateTempValue(): Local {
        let tempLeftOpName = "$temp" + this.tempVariableNum;
        this.tempVariableNum++;
        let tempLeftOp = new Local(tempLeftOpName);
        this.locals.add(tempLeftOp);
        return tempLeftOp;
    }

    private generateAssignStmtForValue(value: Value): Local {
        let leftOp = this.generateTempValue();
        let rightOp = value;
        this.current3ACstm.threeAddressStmts.push(new ArkAssignStmt(leftOp, rightOp));
        return leftOp;
    }

    private objectLiteralNodeToLocal(objectLiteralNode: ts.Node): Local {
        let anonymousClassName = 'AnonymousClass$' + this.name + '$' + this.anonymousClassIndex;
        this.anonymousClassIndex++;

        // TODO: 解析类体
        let arkClass: ArkClass = new ArkClass();
        arkClass.setName(anonymousClassName);
        let arkFile = this.declaringClass.getDeclaringArkFile();
        arkClass.setDeclaringArkFile(arkFile);
        const {line, character} = ts.getLineAndCharacterOfPosition(
            this.sourceFile,
            objectLiteralNode.getStart(this.sourceFile)
        );
        arkClass.setLine(line + 1);
        arkClass.setColumn(character + 1);
        arkClass.genSignature();
        arkFile.addArkClass(arkClass);
        const classSignature = arkClass.getSignature();
        const classType = new ClassType(classSignature);

        let newExpr = new ArkNewExpr(classType);
        let tempObj = this.generateAssignStmtForValue(newExpr);
        let methodSubSignature = new MethodSubSignature();
        methodSubSignature.setMethodName('constructor');
        let methodSignature = new MethodSignature();
        methodSignature.setDeclaringClassSignature(classSignature);
        methodSignature.setMethodSubSignature(methodSubSignature);
        let args: Value[] = [];
        this.current3ACstm.threeAddressStmts.push(new ArkInvokeStmt(new ArkInstanceInvokeExpr(tempObj, methodSignature, args)));

        return tempObj;
    }

    private templateSpanNodeToValue(templateSpanExprNode: ts.Node): Value {
        let exprNode = templateSpanExprNode.getChildren(this.sourceFile)[0];
        let expr = this.astNodeToValue(exprNode);
        let literalNode = templateSpanExprNode.getChildren(this.sourceFile)[1];
        let oriLiteralText = literalNode.getText(this.sourceFile);
        let literalText = '';
        if (ts.SyntaxKind[literalNode.kind] == 'TemplateMiddle') {
            literalText = oriLiteralText.substring(1, oriLiteralText.length - 2);
        } else {
            literalText = oriLiteralText.substring(1, oriLiteralText.length - 1);
        }

        if (literalText.length == 0) {
            return expr;
        }
        let combinationExpr = new ArkBinopExpr(expr, new Constant(literalText, StringType.getInstance()), '+');
        return this.generateAssignStmtForValue(combinationExpr);
    }

    private astNodeToTemplateExpr(templateExprNode: ts.Node): Value {
        let subValues: Value[] = [];
        let templateHeadNode = templateExprNode.getChildren(this.sourceFile)[0];
        let templateHeadText = templateHeadNode.getText(this.sourceFile);
        subValues.push(new Constant(templateHeadText.substring(1, templateHeadText.length - 2), StringType.getInstance()));

        let syntaxListNode = templateExprNode.getChildren(this.sourceFile)[1];
        for (const child of syntaxListNode.getChildren(this.sourceFile)) {
            subValues.push(this.templateSpanNodeToValue(child));
        }

        let combinationExpr = new ArkBinopExpr(subValues[0], subValues[1], '+');
        let prevCombination = this.generateAssignStmtForValue(combinationExpr);
        for (let i = 2; i < subValues.length; i++) {
            combinationExpr = new ArkBinopExpr(prevCombination, subValues[i], '+');
            prevCombination = this.generateAssignStmtForValue(combinationExpr);
        }
        return prevCombination;
    }

    // TODO:支持更多场景
    private astNodeToConditionExpr(conditionExprNode: ts.Node): ArkConditionExpr {
        let conditionValue = this.astNodeToValue(conditionExprNode);
        let conditionExpr: ArkConditionExpr;
        if ((conditionValue instanceof ArkBinopExpr) && isRelationalOperator(conditionValue.getOperator())) {
            conditionExpr = new ArkConditionExpr(conditionValue.getOp1(), conditionValue.getOp2(), flipOperator(conditionValue.getOperator()));
        } else {
            if (IRUtils.moreThanOneAddress(conditionValue)) {
                conditionValue = this.generateAssignStmtForValue(conditionValue);
            }
            conditionExpr = new ArkConditionExpr(conditionValue, new Constant('0', NumberType.getInstance()), '==');
        }
        return conditionExpr;

        function isRelationalOperator(operator: string): boolean {
            return operator == '<' || operator == '<=' || operator == '>' || operator == '>=' ||
                operator == '==' || operator == '===' || operator == '!=' || operator == '!==';
        }

        function flipOperator(operator: string): string {
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

    private astNodeToValue(node: ts.Node): Value {
        let value: any;
        if (ts.SyntaxKind[node.kind] == 'Identifier' || ts.SyntaxKind[node.kind] == 'ThisKeyword' || ts.SyntaxKind[node.kind] == 'SuperKeyword') {
            // TODO:识别外部变量
            value = new Local(node.getText(this.sourceFile));
            value = this.getOriginalLocal(value);
        } else if (ts.SyntaxKind[node.kind] == 'Parameter') {
            let identifierNode = node.getChildren(this.sourceFile)[0];
            let typeNode = node.getChildren(this.sourceFile)[2];
            value = new Local(identifierNode.getText(this.sourceFile));
            value = this.getOriginalLocal(value);
        } else if (this.shouldBeConstant(node)) {
            const typeStr = this.resolveKeywordType(node);
            let constant = new Constant(node.getText(this.sourceFile), TypeInference.buildTypeFromStr(typeStr));
            value = this.generateAssignStmtForValue(constant);
        } else if (ts.SyntaxKind[node.kind] == 'BinaryExpression') {
            let op1 = this.astNodeToValue(node.getChildren(this.sourceFile)[0]);
            let operator = node.getChildren(this.sourceFile)[1].getText(this.sourceFile);
            let op2 = this.astNodeToValue(node.getChildren(this.sourceFile)[2]);
            if (IRUtils.moreThanOneAddress(op1)) {
                op1 = this.generateAssignStmtForValue(op1);
            }
            if (IRUtils.moreThanOneAddress(op2)) {
                op2 = this.generateAssignStmtForValue(op2);
            }
            value = new ArkBinopExpr(op1, op2, operator);
        }
        // TODO:属性访问需要展开
        else if (ts.SyntaxKind[node.kind] == 'PropertyAccessExpression') {
            let baseValue = this.astNodeToValue(node.getChildren(this.sourceFile)[0]);
            if (IRUtils.moreThanOneAddress(baseValue)) {
                baseValue = this.generateAssignStmtForValue(baseValue);
            }
            let base = baseValue as Local;

            let fieldName = node.getChildren(this.sourceFile)[2].getText(this.sourceFile);
            const fieldSignature = new FieldSignature();
            fieldSignature.setFieldName(fieldName);
            value = new ArkInstanceFieldRef(base, fieldSignature);
        } else if (ts.SyntaxKind[node.kind] == 'ElementAccessExpression') {
            let baseValue = this.astNodeToValue(node.getChildren(this.sourceFile)[0]);
            if (!(baseValue instanceof Local)) {
                baseValue = this.generateAssignStmtForValue(baseValue);
            }

            let elementNodeIdx = this.findChildIndex(node, 'OpenBracketToken') + 1;
            let elementValue = this.astNodeToValue(node.getChildren(this.sourceFile)[elementNodeIdx]);
            if (IRUtils.moreThanOneAddress(elementValue)) {
                elementValue = this.generateAssignStmtForValue(elementValue);
            }

            // temp
            if (elementValue instanceof Constant) {
                if (elementValue.getValue().startsWith('\'')) {
                    let oldValue = elementValue.getValue();
                    elementValue.setValue(oldValue.substring(1, oldValue.length - 1));
                } else if (elementValue.getValue().startsWith('"')) {
                    let oldValue = elementValue.getValue();
                    elementValue.setValue(oldValue.substring(2, oldValue.length - 2));
                }
            }

            let baseLocal = baseValue as Local;
            if (baseLocal.getType() instanceof ArrayType) {
                value = new ArkArrayRef(baseLocal as Local, elementValue);
            } else {
                let fieldName = elementValue.toString();
                const fieldSignature = new FieldSignature();
                fieldSignature.setFieldName(fieldName);
                value = new ArkInstanceFieldRef(baseLocal, fieldSignature);
            }
        } else if (ts.SyntaxKind[node.kind] == "CallExpression") {
            let syntaxListNode = node.getChildren(this.sourceFile)[this.findChildIndex(node, 'OpenParenToken') + 1];
            let argNodes = this.getSyntaxListItems(syntaxListNode);
            let args: Value[] = [];
            for (const argNode of argNodes) {
                let argValue = this.astNodeToValue(argNode);
                if (IRUtils.moreThanOneAddress(argValue)) {
                    argValue = this.generateAssignStmtForValue(argValue);
                }

                args.push(argValue);
            }

            let calleeNode = node.getChildren(this.sourceFile)[0];
            let methodValue = this.astNodeToValue(calleeNode);

            let classSignature = new ClassSignature();
            let methodSubSignature = new MethodSubSignature();
            let methodSignature = new MethodSignature();
            methodSignature.setDeclaringClassSignature(classSignature);
            methodSignature.setMethodSubSignature(methodSubSignature);

            if (methodValue instanceof ArkInstanceFieldRef) {
                let methodName = methodValue.getFieldName();
                let base = methodValue.getBase()
                methodSubSignature.setMethodName(methodName);
                value = new ArkInstanceInvokeExpr(base, methodSignature, args);
            } else if (methodValue instanceof ArkStaticFieldRef) {
                methodSubSignature.setMethodName(methodValue.getFieldName());
                value = new ArkStaticInvokeExpr(methodSignature, args);
            } else {
                methodSubSignature.setMethodName(calleeNode.getText(this.sourceFile));
                value = new ArkStaticInvokeExpr(methodSignature, args);
            }
        } else if (ts.SyntaxKind[node.kind] == "ArrowFunction") {
            let arrowFuncName = 'AnonymousFunc$' + this.name + '$' + this.anonymousFuncIndex;
            this.anonymousFuncIndex++;

            let argsNode = node.getChildren(this.sourceFile)[1];
            let args: Value[] = [];
            for (let argNode of argsNode.getChildren(this.sourceFile)) {
                if (ts.SyntaxKind[argNode.kind] != 'CommaToken') {
                    args.push(this.astNodeToValue(argNode));
                }
            }
            let arrowArkMethod = new ArkMethod();
            arrowArkMethod.setName(arrowFuncName);
            buildArkMethodFromArkClass(node as ts.ArrowFunction, this.declaringClass, arrowArkMethod, this.sourceFile);
            arrowArkMethod.genSignature();

            this.declaringClass.addMethod(arrowArkMethod);

            let callableType = new CallableType(arrowArkMethod.getSignature());
            value = new Local(arrowFuncName, callableType);
            this.locals.add(value);
        }
        // TODO:函数表达式视作静态方法还是普通方法
        else if (ts.SyntaxKind[node.kind] == 'FunctionExpression') {
            let funcExprName = '';
            if (ts.SyntaxKind[node.getChildren(this.sourceFile)[1].kind] != 'OpenParenToken') {
                funcExprName = node.getChildren(this.sourceFile)[1].getText(this.sourceFile);
            } else {
                funcExprName = 'AnonymousFunc-' + this.name + '-' + this.anonymousFuncIndex;
                this.anonymousFuncIndex++;
            }

            let argsNode = this.getChild(node, 'SyntaxList') as ts.Node;
            let args: Value[] = [];
            for (let argNode of argsNode.getChildren(this.sourceFile)) {
                if (ts.SyntaxKind[argNode.kind] != 'CommaToken') {
                    args.push(this.astNodeToValue(argNode));
                }
            }
            let exprArkMethod = new ArkMethod();
            buildArkMethodFromArkClass(node as ts.FunctionExpression, this.declaringClass, exprArkMethod, this.sourceFile);
            exprArkMethod.genSignature();
            this.declaringClass.addMethod(exprArkMethod);

            let callableType = new CallableType(exprArkMethod.getSignature());
            value = new Local(funcExprName, callableType);
            this.locals.add(value);
        } else if (ts.SyntaxKind[node.kind] == "ClassExpression") {
            let cls: ArkClass = new ArkClass();
            const declaringArkNamespace = cls.getDeclaringArkNamespace();
            if (declaringArkNamespace) {
                buildNormalArkClassFromArkNamespace(node as ts.ClassExpression, declaringArkNamespace, cls, this.sourceFile);
                declaringArkNamespace.addArkClass(cls);
            } else {
                let arkFile = this.declaringClass.getDeclaringArkFile();
                buildNormalArkClassFromArkFile(node as ts.ClassExpression, arkFile, cls, this.sourceFile);
                arkFile.addArkClass(cls);
            }

            // if (cls.isExported()) {
            //     let exportClauseName: string = cls.getName();
            //     let exportClauseType: string = "Class";
            //     let exportInfo = new ExportInfo();
            //     exportInfo.build(exportClauseName, exportClauseType, new LineColPosition(-1, -1));
            //     arkFile.addExportInfos(exportInfo);
            // }

            value = new Local(cls.getName(), new ClassType(cls.getSignature()));
        } else if (ts.SyntaxKind[node.kind] == "ObjectLiteralExpression") {
            value = this.objectLiteralNodeToLocal(node);
        } else if (ts.SyntaxKind[node.kind] == "NewExpression") {
            const className = node.getChildren(this.sourceFile)[1].getText(this.sourceFile);
            if (className == 'Array') {
                let baseType: Type = AnyType.getInstance();
                if (this.findChildIndex(node, 'FirstBinaryOperator') != -1) {
                    const baseTypeNode = node.getChildren(this.sourceFile)[this.findChildIndex(node, 'FirstBinaryOperator') + 1];
                    baseType = this.getTypeNode(baseTypeNode);
                }
                let size: number = 0;
                let sizeValue: Value | null = null;
                const argSyntaxListNode = node.getChildren(this.sourceFile)[this.findChildIndex(node, 'OpenParenToken') + 1];
                const argNodes = this.getSyntaxListItems(argSyntaxListNode);
                const items: Constant[] = [];
                if (argNodes.length == 1 && ts.SyntaxKind[argNodes[0].kind] == 'FirstLiteralToken') {
                    size = parseInt(argNodes[0].getText(this.sourceFile));
                } else if (argNodes.length == 1 && ts.SyntaxKind[argNodes[0].kind] == 'Identifier') {
                    size = -1;
                    sizeValue = this.getOriginalLocal(new Local(argNodes[0].getText(this.sourceFile)), false);
                } else if (argNodes.length >= 1) {
                    size = argNodes.length;
                    if (baseType == AnyType.getInstance()) {
                        baseType = TypeInference.buildTypeFromStr(this.resolveKeywordType(argNodes[0]));
                    }
                    for (const sizeNode of argNodes) {
                        items.push(new Constant(sizeNode.getText(this.sourceFile), baseType));
                    }
                }

                if (sizeValue == null) {
                    sizeValue = new Constant(size.toString(), NumberType.getInstance());
                }
                let newArrayExpr = new ArkNewArrayExpr(baseType, sizeValue);
                value = this.generateAssignStmtForValue(newArrayExpr);
                value.setType(new ArrayObjectType(baseType, 1));

                for (let index = 0; index < items.length; index++) {
                    let arrayRef = new ArkArrayRef(value, new Constant(index.toString(), NumberType.getInstance()));
                    const arrayItem = items[index];
                    this.current3ACstm.threeAddressStmts.push(new ArkAssignStmt(arrayRef, arrayItem));
                }
            } else {
                let classSignature = new ClassSignature();
                classSignature.setClassName(className);
                const classType = new ClassType(classSignature);
                let newExpr = new ArkNewExpr(classType);
                value = this.generateAssignStmtForValue(newExpr);


                let methodSubSignature = new MethodSubSignature();
                methodSubSignature.setMethodName('constructor');
                let methodSignature = new MethodSignature();
                methodSignature.setDeclaringClassSignature(classSignature);
                methodSignature.setMethodSubSignature(methodSubSignature);

                let syntaxListNode = node.getChildren(this.sourceFile)[this.findChildIndex(node, 'OpenParenToken') + 1];
                let argNodes = this.getSyntaxListItems(syntaxListNode);
                let args: Value[] = [];
                for (const argNode of argNodes) {
                    args.push(this.astNodeToValue(argNode));
                }

                this.current3ACstm.threeAddressStmts.push(new ArkInvokeStmt(new ArkInstanceInvokeExpr(value as Local, methodSignature, args)));
            }
        } else if (ts.SyntaxKind[node.kind] == 'ArrayLiteralExpression') {
            let syntaxListNode = node.getChildren(this.sourceFile)[1];
            let size = 0;
            for (const syntaxNode of syntaxListNode.getChildren(this.sourceFile)) {
                if (ts.SyntaxKind[syntaxNode.kind] != 'CommaToken') {
                    size += 1;
                }
            }

            let newArrayExpr = new ArkNewArrayExpr(UnknownType.getInstance(), new Constant(size.toString(), NumberType.getInstance()));
            value = this.generateAssignStmtForValue(newArrayExpr);
            const itemTypes = new Set<Type>();

            let argsNode = node.getChildren(this.sourceFile)[1];
            let index = 0;
            for (let argNode of argsNode.getChildren(this.sourceFile)) {
                if (ts.SyntaxKind[argNode.kind] != 'CommaToken') {
                    let arrayRef = new ArkArrayRef(value as Local, new Constant(index.toString(), NumberType.getInstance()));
                    const itemTypeStr = this.resolveKeywordType(argNode);
                    const itemType = TypeInference.buildTypeFromStr(itemTypeStr);
                    const arrayItem = new Constant(argNode.getText(this.sourceFile), itemType);
                    itemTypes.add(itemType);

                    this.current3ACstm.threeAddressStmts.push(new ArkAssignStmt(arrayRef, arrayItem));
                    index++;
                }
            }

            if (itemTypes.size == 1) {
                newArrayExpr.setBaseType(itemTypes.keys().next().value);
            } else if (itemTypes.size > 1) {
                newArrayExpr.setBaseType(new UnionType(Array.from(itemTypes.keys())));
            }
            value.setType(new ArrayType(newArrayExpr.getBaseType(), 1));
        } else if (ts.SyntaxKind[node.kind] == 'PrefixUnaryExpression') {
            let token = node.getChildren(this.sourceFile)[0].getText(this.sourceFile);
            if (token == '++' || token == '--') {
                value = this.astNodeToValue(node.getChildren(this.sourceFile)[1]);
                let binopExpr = new ArkBinopExpr(value, new Constant('1', NumberType.getInstance()), token[0]);
                this.current3ACstm.threeAddressStmts.push(new ArkAssignStmt(value, binopExpr));
            } else {
                let op = this.astNodeToValue(node.getChildren(this.sourceFile)[1]);
                let arkUnopExpr = new ArkUnopExpr(op, token);
                value = this.generateAssignStmtForValue(arkUnopExpr);
            }
        } else if (ts.SyntaxKind[node.kind] == 'PostfixUnaryExpression') {
            let token = node.getChildren(this.sourceFile)[1].getText(this.sourceFile);
            value = this.astNodeToValue(node.getChildren(this.sourceFile)[0]);
            let binopExpr = new ArkBinopExpr(value, new Constant('1', NumberType.getInstance()), token[0]);
            this.current3ACstm.threeAddressStmts.push(new ArkAssignStmt(value, binopExpr));
        } else if (ts.SyntaxKind[node.kind] == 'TemplateExpression') {
            value = this.astNodeToTemplateExpr(node);
        } else if (ts.SyntaxKind[node.kind] == 'AwaitExpression') {
            value = this.astNodeToValue(node.getChildren(this.sourceFile)[1]);
        } else if (ts.SyntaxKind[node.kind] == 'ParenthesizedExpression') {
            const parenthesizedValue = this.astNodeToValue(node.getChildren(this.sourceFile)[1]);
            value = this.generateAssignStmtForValue(parenthesizedValue);
        } else if (ts.SyntaxKind[node.kind] == 'SpreadElement') {
            value = this.astNodeToValue(node.getChildren(this.sourceFile)[1]);
        } else if (ts.SyntaxKind[node.kind] == 'TypeOfExpression') {
            value = new ArkTypeOfExpr(this.astNodeToValue(node.getChildren(this.sourceFile)[1]));
        } else if (ts.SyntaxKind[node.kind] == 'AsExpression') {
            let typeName = node.getChildren(this.sourceFile)[2].getText(this.sourceFile);
            let op = this.astNodeToValue(node.getChildren(this.sourceFile)[0]);
            value = new ArkCastExpr(op, TypeInference.buildTypeFromStr(typeName));
        } else if (ts.SyntaxKind[node.kind] == 'TypeAssertionExpression') {
            let typeName = node.getChildren(this.sourceFile)[this.findChildIndex(node, 'FirstBinaryOperator') + 1].getText(this.sourceFile);
            let opNode = node.getChildren(this.sourceFile)[this.findChildIndex(node, 'GreaterThanToken') + 1]
            let op = this.astNodeToValue(opNode);
            value = new ArkCastExpr(op, TypeInference.buildTypeFromStr(typeName));
        } else if (ts.SyntaxKind[node.kind] == 'ArrayBindingPattern' || ts.SyntaxKind[node.kind] == 'ObjectBindingPattern') {
            value = this.generateTempValue();
        } else if (ts.SyntaxKind[node.kind] == 'VoidExpression') {
            this.astNodeToThreeAddressStmt(node.getChildren(this.sourceFile)[1]);
            value = new Constant('undefined', UndefinedType.getInstance());
        } else if (ts.SyntaxKind[node.kind] == 'VariableDeclarationList') {
            let declsNode = node.getChildren(this.sourceFile)[this.findChildIndex(node, "SyntaxList")];
            let syntaxListItems = this.getSyntaxListItems(declsNode);
            value = new Local(syntaxListItems[0].getText(this.sourceFile));
            value = this.getOriginalLocal(value);
        } else if (ts.SyntaxKind[node.kind] == 'ConditionalExpression') {
            // TODO:新增block
            let conditionIdx = this.findChildIndex(node, 'QuestionToken') - 1;
            let conditionExprNode = node.getChildren(this.sourceFile)[conditionIdx];
            let conditionExpr = this.astNodeToConditionExpr(conditionExprNode);
            this.current3ACstm.threeAddressStmts.push(new ArkIfStmt(conditionExpr));

            let resultLocal = this.generateTempValue();
            let whenTrueIdx = this.findChildIndex(node, 'QuestionToken') + 1;
            let whenTrueNode = node.getChildren(this.sourceFile)[whenTrueIdx];
            this.current3ACstm.threeAddressStmts.push(new ArkAssignStmt(resultLocal, this.astNodeToValue(whenTrueNode)));
            let whenFalseIdx = this.findChildIndex(node, 'ColonToken') + 1;
            let whenFalseNode = node.getChildren(this.sourceFile)[whenFalseIdx];
            this.current3ACstm.threeAddressStmts.push(new ArkAssignStmt(resultLocal, this.astNodeToValue(whenFalseNode)));
            value = resultLocal;
        } else if (ts.SyntaxKind[node.kind] == 'NonNullExpression') {
            value = this.astNodeToValue(node.getChildren(this.sourceFile)[0]);
        } else {
            value = new Constant(node.getText(this.sourceFile));
        }
        return value;
    }

    private astNodeToCompoundAssignment(node: ts.Node): Stmt[] {
        let operator = node.getChildren(this.sourceFile)[1].getText(this.sourceFile);
        if (!isCompoundAssignment(operator)) {
            return [];
        }

        let stmts: Stmt[] = [];
        let leftOpNode = node.getChildren(this.sourceFile)[0];
        let leftOp = this.astNodeToValue(leftOpNode);
        let rightOpNode = node.getChildren(this.sourceFile)[2];
        let rightOp = this.astNodeToValue(rightOpNode);
        if (IRUtils.moreThanOneAddress(leftOp) && IRUtils.moreThanOneAddress(rightOp)) {
            rightOp = this.generateAssignStmtForValue(rightOp);
        }
        stmts.push(new ArkAssignStmt(leftOp, new ArkBinopExpr(leftOp, rightOp, operator.substring(0, operator.length - 1))));
        return stmts;

        function isCompoundAssignment(operator: string): boolean {
            return operator == '+=' || operator == '-=' || operator == '*=' || operator == '**=' ||
                operator == '/=' || operator == '%=' || operator == '>>=' || operator == '>>>=' ||
                operator == '<<=';
        }
    }

    private astNodeToThreeAddressAssignStmt(node: ts.Node): Stmt[] {
        let leftOpNode = node.getChildren(this.sourceFile)[0];
        let leftOp = this.astNodeToValue(leftOpNode);

        let leftOpType = this.getTypeNode(node);

        let rightOpNode: ts.Node;
        let rightOp: Value;
        if (this.findChildIndex(node, 'FirstAssignment') != -1) {
            rightOpNode = node.getChildren(this.sourceFile)[this.findChildIndex(node, 'FirstAssignment') + 1];
            rightOp = this.astNodeToValue(rightOpNode);
        } else {
            rightOp = new Constant('undefined', UndefinedType.getInstance());
        }

        if (leftOp instanceof Local) {
            leftOp.setType(leftOpType);
            if ((leftOpType instanceof UnknownType) && !(rightOp.getType() instanceof UnknownType)) {
                leftOp.setType(rightOp.getType());
            }
        }

        if (IRUtils.moreThanOneAddress(leftOp) && IRUtils.moreThanOneAddress(rightOp)) {
            rightOp = this.generateAssignStmtForValue(rightOp);
        }

        let threeAddressAssignStmts: Stmt[] = [];
        threeAddressAssignStmts.push(new ArkAssignStmt(leftOp, rightOp));

        if (ts.SyntaxKind[leftOpNode.kind] == 'ArrayBindingPattern' || ts.SyntaxKind[leftOpNode.kind] == 'ObjectBindingPattern') {
            let argNodes = this.getSyntaxListItems(leftOpNode.getChildren(this.sourceFile)[1]);
            let index = 0;
            for (const argNode of argNodes) {
                // TODO:数组条目类型
                let arrayRef = new ArkArrayRef(leftOp as Local, new Constant(index.toString(), NumberType.getInstance()));
                let arrayItem = new Constant(argNode.getText(this.sourceFile));
                threeAddressAssignStmts.push(new ArkAssignStmt(arrayItem, arrayRef));
                index++;
            }
        }
        return threeAddressAssignStmts;
    }

    private astNodeToThreeAddressSwitchStatement(switchAstNode: ts.Node) {
        let exprNode = switchAstNode.getChildren(this.sourceFile)[this.findChildIndex(switchAstNode, 'OpenParenToken') + 1];
        let exprValue = this.astNodeToValue(exprNode);
        if (IRUtils.moreThanOneAddress(exprValue)) {
            exprValue = this.generateAssignStmtForValue(exprValue);
        }

        let caseBlockNode = switchAstNode.getChildren(this.sourceFile)[this.findChildIndex(switchAstNode, 'CloseParenToken') + 1];
        let syntaxList = caseBlockNode.getChildren(this.sourceFile)[1];
        let caseValues: Value[] = [];
        for (const caseNode of syntaxList.getChildren(this.sourceFile)) {
            if (ts.SyntaxKind[caseNode.kind] == 'DefaultClause') {
                continue;
            }
            let caseExprNode = caseNode.getChildren(this.sourceFile)[1];
            let caseExprValue = this.astNodeToValue(caseExprNode);
            if (IRUtils.moreThanOneAddress(caseExprValue)) {
                caseExprValue = this.generateAssignStmtForValue(caseExprValue);
            }
            caseValues.push(caseExprValue);
        }
        this.current3ACstm.threeAddressStmts.push(new ArkSwitchStmt(exprValue, caseValues));
    }

    private astNodeToThreeAddressIterationStatement(node: ts.Node) {
        if (ts.SyntaxKind[node.kind] == "ForStatement") {
            let openParenTokenIdx = this.findChildIndex(node, 'OpenParenToken');
            let mayConditionIdx = openParenTokenIdx + 3;
            if (ts.SyntaxKind[node.getChildren(this.sourceFile)[openParenTokenIdx + 1].kind] != 'SemicolonToken') {
                let initializer = node.getChildren(this.sourceFile)[openParenTokenIdx + 1]
                this.astNodeToThreeAddressStmt(initializer);
            } else {
                mayConditionIdx = openParenTokenIdx + 2;
            }

            let incrementorIdx = mayConditionIdx + 2;
            if (ts.SyntaxKind[node.getChildren(this.sourceFile)[mayConditionIdx].kind] != 'SemicolonToken') {
                let conditionExprNode = node.getChildren(this.sourceFile)[mayConditionIdx];
                let conditionExpr = this.astNodeToConditionExpr(conditionExprNode);
                this.current3ACstm.threeAddressStmts.push(new ArkIfStmt(conditionExpr));
            } else {
                incrementorIdx = mayConditionIdx + 1;
            }

            if (ts.SyntaxKind[node.getChildren(this.sourceFile)[incrementorIdx].kind] != 'SemicolonToken') {
                let incrementorNode = node.getChildren(this.sourceFile)[incrementorIdx];
                this.astNodeToThreeAddressStmt(incrementorNode);
            }
        } else if (ts.SyntaxKind[node.kind] == "ForOfStatement") {
            // 暂时只支持数组遍历
            let varIdx = this.findChildIndex(node, 'OpenParenToken') + 1;
            let varNode = node.getChildren(this.sourceFile)[varIdx];
            let iterableIdx = varIdx + 2;
            let iterableNode = node.getChildren(this.sourceFile)[iterableIdx];

            let iterableValue = this.astNodeToValue(iterableNode);
            let lenghtLocal = this.generateTempValue();
            this.current3ACstm.threeAddressStmts.push(new ArkAssignStmt(lenghtLocal, new ArkLengthExpr(iterableValue)));
            let indexLocal = this.generateTempValue();
            this.current3ACstm.threeAddressStmts.push(new ArkAssignStmt(indexLocal, new Constant('0', NumberType.getInstance())));
            let varLocal = this.astNodeToValue(varNode);
            let arrayRef = new ArkArrayRef(iterableValue as Local, indexLocal);
            this.current3ACstm.threeAddressStmts.push(new ArkAssignStmt(varLocal, arrayRef));

            let conditionExpr = new ArkConditionExpr(indexLocal, lenghtLocal, ' >= ');
            this.current3ACstm.threeAddressStmts.push(new ArkIfStmt(conditionExpr));
            let incrExpr = new ArkBinopExpr(indexLocal, new Constant('1', NumberType.getInstance()), '+');
            this.current3ACstm.threeAddressStmts.push(new ArkAssignStmt(indexLocal, incrExpr));
            this.current3ACstm.threeAddressStmts.push(new ArkAssignStmt(varLocal, arrayRef));
        } else if (ts.SyntaxKind[node.kind] == "ForInStatement") {
            // 暂时只支持数组遍历
            let varIdx = this.findChildIndex(node, 'OpenParenToken') + 1;
            let varNode = node.getChildren(this.sourceFile)[varIdx];
            let iterableIdx = varIdx + 2;
            let iterableNode = node.getChildren(this.sourceFile)[iterableIdx];

            let iterableValue = this.astNodeToValue(iterableNode);
            let lenghtLocal = this.generateTempValue();
            this.current3ACstm.threeAddressStmts.push(new ArkAssignStmt(lenghtLocal, new ArkLengthExpr(iterableValue)));
            let indexLocal = this.generateTempValue();
            this.current3ACstm.threeAddressStmts.push(new ArkAssignStmt(indexLocal, new Constant('0', NumberType.getInstance())));
            let varLocal = this.astNodeToValue(varNode);
            this.current3ACstm.threeAddressStmts.push(new ArkAssignStmt(varLocal, indexLocal));

            let conditionExpr = new ArkConditionExpr(indexLocal, lenghtLocal, ' >= ');
            this.current3ACstm.threeAddressStmts.push(new ArkIfStmt(conditionExpr));

            let incrExpr = new ArkBinopExpr(indexLocal, new Constant('1', NumberType.getInstance()), '+');
            this.current3ACstm.threeAddressStmts.push(new ArkAssignStmt(indexLocal, incrExpr));
            this.current3ACstm.threeAddressStmts.push(new ArkAssignStmt(varLocal, indexLocal));
        } else if (ts.SyntaxKind[node.kind] == "WhileStatement" || ts.SyntaxKind[node.kind] == "DoStatement") {
            let conditionIdx = this.findChildIndex(node, 'OpenParenToken') + 1;
            let conditionExprNode = node.getChildren(this.sourceFile)[conditionIdx];
            let conditionExpr = this.astNodeToConditionExpr(conditionExprNode);
            this.current3ACstm.threeAddressStmts.push(new ArkIfStmt(conditionExpr));
        }
    }

    private astNodeToThreeAddressStmt(node: ts.Node) {
        let threeAddressStmts: Stmt[] = [];
        if (ts.SyntaxKind[node.kind] == "ReturnStatement") {
            let childCnt = node.getChildren(this.sourceFile).length;
            if (childCnt > 1 && ts.SyntaxKind[node.getChildren(this.sourceFile)[1].kind] != 'SemicolonToken') {
                let op = this.astNodeToValue(node.getChildren(this.sourceFile)[1]);
                if (IRUtils.moreThanOneAddress(op)) {
                    op = this.generateAssignStmtForValue(op);
                }
                threeAddressStmts.push(new ArkReturnStmt(op));
            } else {
                threeAddressStmts.push(new ArkReturnVoidStmt());
            }
        } else if (ts.SyntaxKind[node.kind] == "FirstStatement" || ts.SyntaxKind[node.kind] == "VariableDeclarationList") {
            let declListNode = node;
            if (ts.SyntaxKind[node.kind] == 'FirstStatement') {
                declListNode = node.getChildren(this.sourceFile)[this.findChildIndex(node, "VariableDeclarationList")];
            }
            let declsNode = declListNode.getChildren(this.sourceFile)[this.findChildIndex(declListNode, "SyntaxList")];
            let syntaxListItems = this.getSyntaxListItems(declsNode);
            for (let declNode of syntaxListItems) {
                this.astNodeToThreeAddressStmt(declNode);
            }
        } else if ((ts.SyntaxKind[node.kind] == 'BinaryExpression' && ts.SyntaxKind[node.getChildren(this.sourceFile)[1].kind] == 'FirstAssignment')
            || (ts.SyntaxKind[node.kind] == 'VariableDeclaration')) {
            threeAddressStmts.push(...this.astNodeToThreeAddressAssignStmt(node));
        } else if ((ts.SyntaxKind[node.kind] == 'BinaryExpression')) {
            threeAddressStmts.push(...this.astNodeToCompoundAssignment(node));
        } else if (ts.SyntaxKind[node.kind] == "ExpressionStatement") {
            let expressionNodeIdx = 0;
            if (ts.SyntaxKind[node.getChildren(this.sourceFile)[0].kind] == 'JSDocComment') {
                expressionNodeIdx = 1;
            }
            let expressionNode = node.getChildren(this.sourceFile)[expressionNodeIdx];
            this.astNodeToThreeAddressStmt(expressionNode);
        } else if (ts.SyntaxKind[node.kind] == 'IfStatement') {
            let conditionExprNode = node.getChildren(this.sourceFile)[this.findChildIndex(node, 'OpenParenToken') + 1];
            let conditionExpr = this.astNodeToConditionExpr(conditionExprNode);
            threeAddressStmts.push(new ArkIfStmt(conditionExpr));
        } else if (ts.SyntaxKind[node.kind] == 'PostfixUnaryExpression' || ts.SyntaxKind[node.kind] == 'PrefixUnaryExpression') {
            this.astNodeToValue(node);
        } else if (ts.SyntaxKind[node.kind] == 'ForStatement' || ts.SyntaxKind[node.kind] == 'ForOfStatement' || ts.SyntaxKind[node.kind] == 'ForInStatement'
            || ts.SyntaxKind[node.kind] == 'WhileStatement' || ts.SyntaxKind[node.kind] == 'DoStatement') {
            this.astNodeToThreeAddressIterationStatement(node);
        } else if (ts.SyntaxKind[node.kind] == 'BreakStatement' || ts.SyntaxKind[node.kind] == 'ContinueStatement') {
            threeAddressStmts.push(new ArkGotoStmt());
        } else if (ts.SyntaxKind[node.kind] == 'SwitchStatement') {
            this.astNodeToThreeAddressSwitchStatement(node);
        } else if (ts.SyntaxKind[node.kind] == 'ThrowStatement') {
            let op = this.astNodeToValue(node.getChildren(this.sourceFile)[1]);
            if (IRUtils.moreThanOneAddress(op)) {
                op = this.generateAssignStmtForValue(op);
            }
            threeAddressStmts.push(new ArkThrowStmt(op));
        } else if (ts.SyntaxKind[node.kind] == 'CatchClause') {
            let catchedValueNode = node.getChildren(this.sourceFile)[this.findChildIndex(node, 'OpenParenToken') + 1];
            let catchedValue = new Local(catchedValueNode.getText(this.sourceFile));
            catchedValue = this.getOriginalLocal(catchedValue);

            let caughtExceptionRef = new ArkCaughtExceptionRef(UnknownType.getInstance());
            threeAddressStmts.push(new ArkAssignStmt(catchedValue, caughtExceptionRef));
        } else if (ts.SyntaxKind[node.kind] == 'CallExpression') {
            threeAddressStmts.push(new ArkInvokeStmt(this.astNodeToValue(node) as AbstractInvokeExpr));
        } else if (ts.SyntaxKind[node.kind] == "AwaitExpression") {
            let expressionNode = node.getChildren(this.sourceFile)[1];
            this.astNodeToThreeAddressStmt(expressionNode);
        } else if (ts.SyntaxKind[node.kind] == 'VoidExpression') {
            this.astNodeToThreeAddressStmt(node.getChildren(this.sourceFile)[1]);
        } else if (ts.SyntaxKind[node.kind] == 'DeleteExpression') {
            let popertyAccessExprNode = node.getChildren(this.sourceFile)[1];
            let popertyAccessExpr = this.astNodeToValue(popertyAccessExprNode) as AbstractFieldRef;
            threeAddressStmts.push(new ArkDeleteStmt(popertyAccessExpr));
        } else if (this.nopStmt(node)) {
            // threeAddressStmts.push(new ArkNopStmt());
        } else {
            // logger.info('unsupported stmt node, type:', ts.SyntaxKind[node.kind], ', text:', node.getText(this.sourceFile));
        }

        this.current3ACstm.threeAddressStmts.push(...threeAddressStmts);
        return;
    }

    private transformToThreeAddress() {
        // process parameters        
        if (this.blocks.length > 0 && this.blocks[0].stms.length > 0) {       // 临时处理默认函数函数体为空的情况
            this.current3ACstm = this.blocks[0].stms[0];
            let index = 0;
            for (const methodParameter of this.declaringMethod.getParameters()) {
                let parameterRef = new ArkParameterRef(index, methodParameter.getType());
                let parameterLocal = this.generateAssignStmtForValue(parameterRef);
                parameterLocal.setName(methodParameter.getName());
                index++;
                this.paraLocals.push(parameterLocal);
            }
            let thisRef = new ArkThisRef(this.declaringClass.getSignature().getType());
            this.thisLocal = this.generateAssignStmtForValue(thisRef);
            this.thisLocal.setName('this');
            this.thisLocal.setType(thisRef.getType());
        }

        for (let blockId = 0; blockId < this.blocks.length; blockId++) {
            let currBlock = this.blocks[blockId];
            for (const originStmt of currBlock.stms) {
                if (originStmt.astNode && originStmt.code != "" && this.support(originStmt.astNode)) {
                    this.current3ACstm = originStmt;
                    this.astNodeToThreeAddressStmt(originStmt.astNode);
                } else if (originStmt.code.startsWith('return')) {
                    // 额外添加的return语句特殊处理
                    originStmt.threeAddressStmts.push(new ArkReturnVoidStmt());
                } else if (originStmt.type == 'gotoStatement') {
                    // 额外添加的goto语句特殊处理
                    originStmt.threeAddressStmts.push(new ArkGotoStmt());
                }
            }
        }
    }


    errorTest(stm: StatementBuilder) {
        let mes = "ifnext error    ";
        if (this.declaringClass?.getDeclaringArkFile()) {
            mes += this.declaringClass?.getDeclaringArkFile().getName() + "." + this.declaringClass.getName() + "." + this.name;
        }
        mes += "\n" + stm.code;
        // console.log(mes)
        throw new textError(mes);
    }

    getStatementByText(text: string) {
        const ret: StatementBuilder[] = [];
        for (let stm of this.statementArray) {
            if (stm.code.replace(/\s/g, '') == text.replace(/\s/g, '')) {
                ret.push(stm);
            }
        }
        return ret;
    }

    // stm23AC(stm: StatementBuilder) {
    //     if (stm.addressCode3.length > 0) {
    //         if (stm.type.includes("loop") || stm.type.includes("if") || stm.type.includes("switch")) {
    //             let last3AC: ts.Node = new ts.Node(undefined, null, [], "temp", -1, "undefined");
    //             for (let i = 0; i < stm.addressCode3.length; i++) {
    //                 let ac = stm.addressCode3[i]
    //                 let temp = this.insertStatementBefore(stm, ac);
    //                 last3AC = temp;
    //             }
    //             if (!stm.astNode) {
    //                 logger.error("stm without ast");
    //                 process.exit();
    //             }
    //             let block = stm.astNode.getChildren(this.sourceFile)[this.findChildIndex(stm.astNode, "Block")];
    //             block.parent = last3AC;
    //             last3AC.getChildren(this.sourceFile)[last3AC.getChildren(this.sourceFile).length - 1] = block;
    //             this.updateParentText(last3AC);
    //             this.removeStatement(stm);
    //         } else {
    //             for (let i = 0; i < stm.addressCode3.length; i++) {
    //                 let ac = stm.addressCode3[i]
    //                 this.insertStatementBefore(stm, ac);
    //             }
    //             this.removeStatement(stm);
    //         }
    //     }
    // }

    // simplify() {
    //     for (let stm of this.statementArray) {
    //         this.stm23AC(stm)
    //     }
    // }

    printBlocks() {
        let text = "";
        if (this.declaringClass?.getDeclaringArkFile()) {
            text += this.declaringClass.getDeclaringArkFile().getName() + "\n";
        }
        for (let bi = 0; bi < this.blocks.length; bi++) {
            let block = this.blocks[bi];
            if (bi != 0)
                text += "label" + block.id + ":\n";
            let length = block.stms.length
            for (let i = 0; i < length; i++) {
                let stm = block.stms[i];
                if (stm.type == "ifStatement" || stm.type == "loopStatement" || stm.type == "catchOrNot") {
                    let cstm = stm as ConditionStatementBuilder;
                    if (cstm.nextT == null || cstm.nextF == null) {
                        this.errorTest(cstm);
                        return;
                    }
                    if (!cstm.nextF.block || !cstm.nextT.block) {
                        this.errorTest(cstm);
                        return;
                    }
                    stm.code = "if !(" + cstm.condition + ") goto label" + cstm.nextF.block.id
                    if (i == length - 1 && bi + 1 < this.blocks.length && this.blocks[bi + 1].id != cstm.nextT.block.id) {
                        let gotoStm = new StatementBuilder("gotoStatement", "goto label" + cstm.nextT.block.id, null, block.stms[0].scopeID);
                        block.stms.push(gotoStm);
                        length++;
                    }
                } else if (stm.type == "breakStatement" || stm.type == "continueStatement") {
                    if (!stm.next?.block) {
                        this.errorTest(stm);
                        return;
                    }
                    stm.code = "goto label" + stm.next?.block.id;
                } else {
                    if (i == length - 1 && stm.next?.block && (bi + 1 < this.blocks.length && this.blocks[bi + 1].id != stm.next.block.id || bi + 1 == this.blocks.length)) {
                        let gotoStm = new StatementBuilder("StatementBuilder", "goto label" + stm.next?.block.id, null, block.stms[0].scopeID);
                        block.stms.push(gotoStm);
                        length++;
                    }
                }
                if (stm.addressCode3.length == 0) {
                    text += "    " + stm.code + "\n";
                } else {
                    for (let ac of stm.addressCode3) {
                        if (ac.startsWith("if") || ac.startsWith("while")) {
                            let cstm = stm as ConditionStatementBuilder;
                            let condition = ac.substring(ac.indexOf("("));
                            let goto = "";
                            if (cstm.nextF?.block)
                                goto = "if !" + condition + " goto label" + cstm.nextF?.block.id;
                            stm.addressCode3[stm.addressCode3.indexOf(ac)] = goto;
                            text += "    " + goto + "\n";
                        } else
                            text += "    " + ac + "\n";
                    }
                }
            }

        }
        for (let cat of this.catches) {
            text += "catch " + cat.errorName + " from label " + cat.from + " to label " + cat.to + " with label" + cat.withLabel + "\n";
        }
    }

    private addFirstBlock() {
        for (let block of this.blocks) {
            block.id += 1;
        }
        this.blocks.splice(0, 0, new Block(0, [], null));
    }

    private insertBlockbBefore(blocks: Block[], id: number) {
        blocks.splice(id, 0, new Block(0, [], null));
        for (let i = id; i < blocks.length; i++) {
            blocks[i].id += 1;
        }
    }


    public printThreeAddressStmts() {
        // format
        let indentation = ' '.repeat(4);
        let lineEnd = ';\n';

        let stmtBlocks: Block[] = [];
        stmtBlocks.push(...this.blocks);
        let blockId = 0;
        if (stmtBlocks[blockId].stms[blockId].type == 'loopStatement') {
            this.insertBlockbBefore(stmtBlocks, blockId);
            blockId = 1;
        }
        blockId += 1;
        for (; blockId < stmtBlocks.length; blockId++) {
            let currStmt = stmtBlocks[blockId].stms[0];
            let lastStmt = stmtBlocks[blockId - 1].stms[0];
            if (currStmt.type == 'loopStatement' && lastStmt.type == 'loopStatement') {
                this.insertBlockbBefore(stmtBlocks, blockId);
                blockId++;
            }
        }


        let blockTailStmtStrs = new Map<number, string[]>();
        let blockStmtStrs = new Map<number, string[]>();
        for (let blockId = 0; blockId < stmtBlocks.length; blockId++) {
            let currBlock = stmtBlocks[blockId];
            let currStmtStrs: string[] = [];
            for (const originStmt of currBlock.stms) {
                if (originStmt.type == 'ifStatement') {
                    currStmtStrs.push(...ifStmtToString(originStmt));
                } else if (originStmt.type == 'loopStatement') {
                    currStmtStrs.push(...iterationStmtToString(originStmt));
                } else if (originStmt.type == 'switchStatement') {
                    currStmtStrs.push(...switchStmtToString(originStmt, this.sourceFile));
                } else if (originStmt.type == 'breakStatement' || originStmt.type == 'continueStatement') {
                    currStmtStrs.push(...jumpStmtToString(originStmt));
                } else {
                    for (const threeAddressStmt of originStmt.threeAddressStmts) {
                        currStmtStrs.push(threeAddressStmt.toString());
                    }
                }
            }
            blockStmtStrs.set(blockId, currStmtStrs);
        }

        // add tail stmts and print to str
        let functionBodyStr = 'method: ' + this.name + ' {\n';
        for (let blockId = 0; blockId < stmtBlocks.length; blockId++) {
            let stmtStrs: string[] = [];
            let currStmtStrs = blockStmtStrs.get(blockId);
            if (currStmtStrs != undefined) {
                stmtStrs.push(...currStmtStrs);
            }
            let tailStmtStrs = blockTailStmtStrs.get(blockId);
            if (tailStmtStrs != undefined) {
                stmtStrs.push(...tailStmtStrs);
            }

            if (blockId != 0) {
                functionBodyStr += "label" + blockId + ':\n';
            }
            functionBodyStr += indentation;
            functionBodyStr += stmtStrs.join(lineEnd + indentation);
            functionBodyStr += lineEnd;
        }

        functionBodyStr += '}\n';
        logger.info(functionBodyStr);

        function ifStmtToString(originStmt: StatementBuilder): string[] {
            let ifStmt = originStmt as ConditionStatementBuilder;

            let strs: string[] = [];
            for (const threeAddressStmt of ifStmt.threeAddressStmts) {
                if (threeAddressStmt instanceof ArkIfStmt) {
                    let nextBlockId = ifStmt.nextF?.block?.id;
                    strs.push(threeAddressStmt.toString() + ' goto label' + nextBlockId);
                } else {
                    strs.push(threeAddressStmt.toString());
                }
            }
            return strs;
        }

        function iterationStmtToString(originStmt: StatementBuilder): string[] {
            let iterationStmt = originStmt as ConditionStatementBuilder;

            let bodyBlockId = iterationStmt.nextT?.block?.id as number;
            if (blockTailStmtStrs.get(bodyBlockId) == undefined) {
                blockTailStmtStrs.set(bodyBlockId, []);
            }
            let currTailStmtStrs = blockTailStmtStrs.get(bodyBlockId) as string[];

            let preBlockId = bodyBlockId - 1;
            if (blockTailStmtStrs.get(preBlockId) == undefined) {
                blockTailStmtStrs.set(preBlockId, []);
            }
            let preTailStmtStrs = blockTailStmtStrs.get(preBlockId) as string[];

            let strs: string[] = [];
            let findIf = false;
            let appendAfterIf = iterationStmt.astNode && (ts.SyntaxKind[iterationStmt.astNode.kind] == "ForOfStatement" || ts.SyntaxKind[iterationStmt.astNode.kind] == "ForInStatement");
            for (const threeAddressStmt of iterationStmt.threeAddressStmts) {
                if (threeAddressStmt instanceof ArkIfStmt) {
                    let nextBlockId = iterationStmt.nextF?.block?.id;
                    strs.push(threeAddressStmt.toString() + ' goto label' + nextBlockId);
                    findIf = true;
                } else if (!findIf) {
                    preTailStmtStrs.push(threeAddressStmt.toString());
                } else if (threeAddressStmt instanceof ArkGotoStmt) {
                    currTailStmtStrs.push('goto label' + bodyBlockId);
                } else if (appendAfterIf) {
                    strs.push(threeAddressStmt.toString());
                    appendAfterIf = false;
                } else {
                    currTailStmtStrs.push(threeAddressStmt.toString());
                }
            }
            return strs;
        }

        // TODO:参考soot还是sootup处理switch
        function switchStmtToString(originStmt: StatementBuilder, sourceFile: ts.SourceFile): string[] {
            let switchStmt = originStmt as SwitchStatementBuilder;


            let identifierStr = switchStmt.astNode?.getChildren(sourceFile)[2].getText(sourceFile);
            let str = 'lookupswitch(' + identifierStr + '){\n' + indentation;

            let strs: string[] = [];
            let nextBlockId = -1;
            for (const item of switchStmt.cases) {
                strs.push(indentation + item.value + 'goto label' + item.stm.block?.id);
                nextBlockId = item.stm.next?.block?.id as number;
            }
            strs.push(indentation + 'default: goto label' + nextBlockId);
            str += strs.join(lineEnd + indentation);

            str += lineEnd + indentation + '}';
            return [str];
        }

        function jumpStmtToString(originStmt: StatementBuilder): string[] {
            let targetId = originStmt.next?.block?.id as number;
            return ["goto label" + targetId];
        }
    }

    public printThreeAddressStrs() {
        logger.info('#### printThreeAddressStrs ####');
        for (const stmt of this.statementArray) {
            logger.info('------ origin stmt: ', stmt.code);
            for (const threeAddressstr of stmt.addressCode3) {
                logger.info(threeAddressstr);
            }
        }
    }

    public printThreeAddressStrsAndStmts() {
        for (const stmt of this.statementArray) {
            if (stmt.astNode && stmt.code) {
                logger.info('----- origin stmt: ', stmt.code);
                logger.info('-- threeAddressStrs:');
                for (const threeAddressstr of stmt.addressCode3) {
                    logger.info(threeAddressstr);
                }
                logger.info('-- threeAddressStmts:');
                for (const threeAddressStmt of stmt.threeAddressStmts) {
                    logger.info(threeAddressStmt);
                }
            }
        }
    }

    public printOriginStmts() {
        logger.info('#### printOriginStmts ####');
        for (const stmt of this.statementArray) {
            logger.info(stmt);
        }
    }


    // TODO: Add more APIs to the class 'Cfg', and use these to build Cfg
    public buildOriginalCfg(): Cfg {
        let originalCfg = new Cfg();
        let blockBuilderToBlock = new Map<Block, BasicBlock>();
        for (const blockBuilder of this.blocks) {
            let block = new BasicBlock();
            for (const stmtBuilder of blockBuilder.stms) {
                if (stmtBuilder.astNode == null) {
                    continue;
                }
                let originlStmt: Stmt = new Stmt();
                originlStmt.setText(stmtBuilder.code);
                originlStmt.setPositionInfo(stmtBuilder.line);
                originlStmt.setOriginPositionInfo(stmtBuilder.line);
                originlStmt.setColumn(stmtBuilder.column);
                originlStmt.setOriginColumn(stmtBuilder.column);
                block.addStmt(originlStmt);
            }
            originalCfg.addBlock(block);

            // build the map
            blockBuilderToBlock.set(blockBuilder, block);
        }

        // link block
        for (const [blockBuilder, block] of blockBuilderToBlock) {
            for (const successorBuilder of blockBuilder.nexts) {
                let successorBlock = blockBuilderToBlock.get(successorBuilder) as BasicBlock;
                successorBlock.addPredecessorBlock(block);
                block.addSuccessorBlock(successorBlock);
            }
        }

        return originalCfg;
    }

    // TODO: Add more APIs to class 'Cfg', and use these to build Cfg
    public buildCfg(): Cfg {
        let cfg = new Cfg();
        cfg.declaringClass = this.declaringClass;
        let blockBuilderToBlock = new Map<Block, BasicBlock>();
        let stmtPos = -1;
        for (const blockBuilder of this.blocks) {
            let block = new BasicBlock();
            for (const stmtBuilder of blockBuilder.stms) {
                for (const threeAddressStmt of stmtBuilder.threeAddressStmts) {
                    if (stmtPos == -1) {
                        stmtPos = stmtBuilder.line;
                        cfg.setStartingStmt(threeAddressStmt);
                    }
                    threeAddressStmt.setOriginPositionInfo(stmtBuilder.line);
                    threeAddressStmt.setPositionInfo(stmtPos);
                    stmtPos++;
                    block.addStmt(threeAddressStmt);

                    threeAddressStmt.setCfg(cfg);
                }
            }
            cfg.addBlock(block);

            // build the map
            blockBuilderToBlock.set(blockBuilder, block);
        }

        // link block
        for (const [blockBuilder, block] of blockBuilderToBlock) {
            for (const successorBuilder of blockBuilder.nexts) {
                let successorBlock = blockBuilderToBlock.get(successorBuilder) as BasicBlock;
                successorBlock.addPredecessorBlock(block);
                block.addSuccessorBlock(successorBlock);
            }
        }

        return cfg;
    }

    public getLocals(): Set<Local> {
        return this.locals;
    }

    private getTypeNode(node: ts.Node): Type {
        for (let child of node.getChildren(this.sourceFile)) {
            let result = this.resolveTypeNode(child)
            if (result !== UnknownType.getInstance()) {
                return result
            }
        }
        return UnknownType.getInstance();
    }

    private resolveTypeNode(node: ts.Node): Type {
        let typeNode: ts.Node
        switch (ts.SyntaxKind[node.kind]) {
            case "BooleanKeyword":
            case "NumberKeyword":
            case "StringKeyword":
            case "VoidKeyword":
            case "AnyKeyword":
                return TypeInference.buildTypeFromStr(this.resolveKeywordType(node));
            case "ArrayType":
                typeNode = node.getChildren(this.sourceFile)[0];
                const typeStr = typeNode.getText(this.sourceFile);
                return new ArrayType(TypeInference.buildTypeFromStr(typeStr), 1);
            case "TypeReference":
                return new AnnotationNamespaceType(node.getText(this.sourceFile))
            case "UnionType":
                const types: Type[] = [];
                typeNode = node.getChildren(this.sourceFile)[0];
                for (const singleTypeNode of typeNode.getChildren(this.sourceFile)) {
                    if (ts.SyntaxKind[singleTypeNode.kind] != "BarToken") {
                        const singleType = this.resolveTypeNode(singleTypeNode)
                        types.push(singleType);
                    }
                }
                return new UnionType(types);
            case 'TupleType':
                const tupleTypes: Type[] = [];
                typeNode = node.getChildren(this.sourceFile)[1];
                for (const singleTypeNode of typeNode.getChildren(this.sourceFile)) {
                    if (ts.SyntaxKind[singleTypeNode.kind] != "CommaToken") {
                        const singleType = this.resolveTypeNode(singleTypeNode)
                        tupleTypes.push(singleType);
                    }
                }
                return new TupleType(tupleTypes);
            case 'TypeQuery':
                return new AnnotationTypeQueryType(node.getChildren(this.sourceFile)[1].getText(this.sourceFile))
        }
        return UnknownType.getInstance();
    }

    private resolveKeywordType(node: ts.Node): string {
        switch (ts.SyntaxKind[node.kind]) {
            case 'TrueKeyword':
            case 'FalseKeyword':
            case "BooleanKeyword":
            case "FalseKeyword":
            case "TrueKeyword":
                return "boolean";
            case "NumberKeyword":
            case "FirstLiteralToken":
                return "number";
            case "StringKeyword":
            case "StringLiteral":
                return "string";
            case "VoidKeyword":
                return "void";
            case "AnyKeyword":
                return "any";
            case 'NullKeyword':
                return 'null';
            case 'RegularExpressionLiteral':
                return 'RegularExpression';
            default:
                return "";
        }
    }

    buildCfgBuilder() {
        let stmts: ts.Node[] = [];
        if (ts.isSourceFile(this.astRoot)) {
            stmts = [...this.astRoot.statements];
        } else if (ts.isFunctionDeclaration(this.astRoot) || ts.isMethodDeclaration(this.astRoot) || ts.isConstructorDeclaration(this.astRoot)
            || ts.isGetAccessor(this.astRoot) || ts.isGetAccessorDeclaration(this.astRoot) || ts.isFunctionExpression(this.astRoot)) {
            if (this.astRoot.body) {
                stmts = [...this.astRoot.body.statements];
            }
        } else if (ts.isArrowFunction(this.astRoot) && ts.isBlock(this.astRoot.body)) {
            stmts = [...this.astRoot.body.statements];
        }
        this.walkAST(this.entry, this.exit, stmts);
        this.addReturnInEmptyMethod();
        this.deleteExit(this.entry);
        this.CfgBuilder2Array(this.entry);
        this.resetWalked();
        this.buildLastAndHaveCall(this.entry);
        this.resetWalked();
        this.buildBlocks(this.entry, this.entryBlock);
        this.blocks = this.blocks.filter((b) => b.stms.length != 0);
        this.buildBlocksNextLast();
        this.addReturnBlock();
        this.resetWalked();
        // this.generateUseDef();
        // this.resetWalked();

        // this.printBlocks();

        this.transformToThreeAddress();
    }
}