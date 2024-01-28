import * as fs from 'fs';
import { ASTree, NodeA } from '../base/Ast';
import { Constant } from '../base/Constant';
import { AbstractInvokeExpr, ArkBinopExpr, ArkCastExpr, ArkConditionExpr, ArkInstanceInvokeExpr, ArkLengthExpr, ArkNewArrayExpr, ArkNewExpr, ArkStaticInvokeExpr, ArkTypeOfExpr } from '../base/Expr';
import { Local } from '../base/Local';
import { ArkArrayRef, ArkInstanceFieldRef, ArkStaticFieldRef } from '../base/Ref';
import { ArkAssignStmt, ArkGotoStmt, ArkIfStmt, ArkInvokeStmt, ArkReturnStmt, ArkReturnVoidStmt, Stmt } from '../base/Stmt';
import { Value } from '../base/Value';
import { BasicBlock } from '../graph/BasicBlock';
import { Cfg } from '../graph/Cfg';
import { ArkClass } from '../model/ArkClass';
import { ArkMethod } from '../model/ArkMethod';
import { ExportInfo } from './ExportBuilder';
import { IRUtils } from './IRUtils';


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
    astNode: NodeA | null;//ast节点对象
    use: Set<Variable>;
    def: Set<Variable>;
    defspecial: Set<Variable>;
    scopeID: number;
    addressCode3: string[];
    threeAddressStmts: Stmt[];
    haveCall: boolean;
    block: Block | null;
    ifExitPass: boolean;
    passTmies: number = 0;
    numOfIdentifier: number = 0;

    constructor(type: string, code: string, astNode: NodeA | null, scopeID: number) {
        this.type = type;
        this.code = code;
        this.next = null;
        this.lasts = [];
        this.walked = false;
        this.index = 0;
        this.line = 0;
        this.astNode = astNode;
        this.scopeID = scopeID;
        this.use = new Set<Variable>;
        this.def = new Set<Variable>;
        this.defspecial = new Set<Variable>;
        this.addressCode3 = [];
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
    constructor(type: string, code: string, astNode: NodeA, scopeID: number) {
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
    constructor(type: string, code: string, astNode: NodeA, scopeID: number) {
        super(type, code, astNode, scopeID);
        this.nexts = [];
    }
}

class TryStatementBuilder extends StatementBuilder {
    tryFirst: StatementBuilder | null = null;
    tryExit: StatementBuilder | null = null;
    catchStatements: StatementBuilder[];
    catchErrors: string[] = [];
    finallyStatement: StatementBuilder | null = null;
    constructor(type: string, code: string, astNode: NodeA, scopeID: number) {
        super(type, code, astNode, scopeID);
        this.catchStatements = [];
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
    variable: Set<String>;
    level: number;
    parent: Scope | null;
    constructor(id: number, variable: Set<String>, level: number) {
        this.id = id;
        this.variable = variable;
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

function getNumOfIdentifier(node: NodeA): number {
    let num = 0;
    if (node.kind == "Identifier")
        return 1;
    for (let child of node.children)
        num += getNumOfIdentifier(child);
    return num;
}

export class CfgBuilder {
    name: string;
    astRoot: NodeA;
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

    private locals: Set<Local> = new Set();

    constructor(ast: NodeA, name: string, declaringClass: ArkClass) {
        this.name = name;
        this.astRoot = ast;
        this.declaringClass = declaringClass;
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
        // this.blocks.push(this.entryBlock);
        this.exitBlock = new Block(-1, [this.entry], null);
        this.currentDeclarationKeyword = "";
        this.variables = [];
        this.importFromPath = [];
        this.catches = [];
        this.anonymousFuncIndex = 0;
        this.anonymousFunctions = [];
        this.buildCfgBuilder();
    }

    walkAST(lastStatement: StatementBuilder, nextStatement: StatementBuilder, node: NodeA) {
        function judgeLastType(s: StatementBuilder) {
            if (lastStatement.type == "ifStatement") {
                let lastIf = lastStatement as ConditionStatementBuilder;
                if (lastIf.nextT == null) {
                    lastIf.nextT = s;
                }
                else {
                    lastIf.nextF = s;
                }
            }
            else if (lastStatement.type == "loopStatement") {
                let lastLoop = lastStatement as ConditionStatementBuilder;
                lastLoop.nextT = s;
            }
            else if (lastStatement.type == "catchOrNot") {
                let lastLoop = lastStatement as ConditionStatementBuilder;
                lastLoop.nextT = s;
            }
            else {
                lastStatement.next = s;
            }

        }
        function checkBlock(node: NodeA): NodeA | null {
            if (node.kind == "Block")
                return node;
            else {
                let ret: NodeA | null = null;
                for (let child of node.children) {
                    ret = ret || checkBlock(child);
                }
                return ret;
            }
        }
        function getAnonymous(node: NodeA): NodeA | null {
            const stack: NodeA[] = [];
            stack.push(node);
            while (stack.length > 0) {
                const n = stack.pop();
                if (!n)
                    return null;
                if (n?.kind == "FunctionExpression" || n?.kind == "ArrowFunction") {
                    return n;
                }
                if (n.children) {
                    for (let i = n.children.length - 1; i >= 0; i--) {
                        stack.push(n.children[i]);
                    }
                }
            }
            return null;
        }

        // console.log(node.text)

        this.scopeLevel++;
        let scope = new Scope(this.scopes.length, new Set(), this.scopeLevel);
        for (let i = this.scopes.length - 1; i >= 0; i--) {
            if (this.scopes[i].level == this.scopeLevel - 1) {
                scope.parent = this.scopes[i];
                break;
            }
        }
        this.scopes.push(scope)

        for (let i = 0; i < node?.children.length; i++) {
            let c = node.children[i];
            if (c.kind == "FirstStatement" || c.kind == "VariableStatement" || c.kind == "ExpressionStatement" || c.kind == "ThrowStatement") {
                if (c.kind == "FirstStatement" || c.kind == "VariableStatement") {
                    let declList = c.children[this.findChildIndex(c, "VariableDeclarationList")];
                    declList = declList.children[this.findChildIndex(declList, "SyntaxList")];
                    for (let decl of declList.children) {
                        scope.variable.add(decl.children[0]?.text);
                    }
                }
                let s = new StatementBuilder("statement", c.text, c, scope.id);
                judgeLastType(s);
                lastStatement = s;
                // let block = checkBlock(c);
                // if (block == null) {
                //     let s = new StatementBuilder("statement", c.text, c, scope.id);
                //     judgeLastType(s);
                //     lastStatement = s;
                // }
                // else {
                //     let anonymous = getAnonymous(c);
                //     if (anonymous) {
                //         let block = anonymous.children[this.findChildIndex(anonymous, "Block")];
                //         let syntaxList = block.children[this.findChildIndex(block, "SyntaxList")];
                //         let anoFuc = new CfgBuilder(syntaxList, "anonymous" + (this.anonymousFunctions.length + 1), this.declaringClass);
                //         this.anonymousFunctions.push(anoFuc);

                //         let tempText = "anonymous" + this.anonymousFunctions.length;
                //         let OpenParenTokenIndex = this.findChildIndex(anonymous, "OpenParenToken");
                //         let ColonTokenIndex = this.findChildIndex(anonymous, "ColonToken");
                //         let end = 0;
                //         if (ColonTokenIndex > 0) {
                //             end = ColonTokenIndex + 1;
                //         }
                //         else {
                //             end = this.findChildIndex(anonymous, "CloseParenToken");
                //         }
                //         let start = OpenParenTokenIndex;
                //         while (start <= end) {
                //             tempText += anonymous.children[start].text;
                //             start++;
                //         }
                //         anonymous.text = tempText;
                //         let p = anonymous.parent;
                //         while (p && p != c) {
                //             p.text = "";
                //             for (let pc of p.children) {
                //                 p.text += pc.text;
                //                 if (pc.kind.includes("Keyword")) {
                //                     p.text += ' ';
                //                 }
                //             }
                //             p = p.parent;
                //         }
                //         c.text = "";
                //         for (let cc of c.children) {
                //             c.text += cc.text;
                //             if (cc.kind.includes("Keyword")) {
                //                 c.text += ' ';
                //             }
                //         }

                //         let s = new StatementBuilder("statement", c.text, c, scope.id);
                //         judgeLastType(s);
                //         lastStatement = s;
                //     }
                // }
            }
            if (c.kind == "ImportDeclaration") {
                let stm = new StatementBuilder("statement", c.text, c, scope.id);
                judgeLastType(stm);
                lastStatement = stm;
                stm.astNode = c;
                let indexPath = this.findChildIndex(c, "FromKeyword") + 1;
                this.importFromPath.push(c.children[indexPath].text);
            }
            if (c.kind == "ReturnStatement") {
                let s = new StatementBuilder("returnStatement", c.text, c, scope.id);
                judgeLastType(s);
                s.astNode = c;
                lastStatement = s;
                break;
            }
            if (c.kind == "BreakStatement") {
                let brstm = new StatementBuilder("breakStatement", "break;", c, scope.id);
                judgeLastType(brstm);
                let p: NodeA | null = c;
                while (p) {
                    if (p.kind.includes("While") || p.kind.includes("For")) {
                        brstm.next = this.loopStack[this.loopStack.length - 1].nextF;
                        break;
                    }
                    if (p.kind.includes("CaseClause") || p.kind.includes("DefaultClause")) {
                        brstm.next = this.switchExitStack[this.switchExitStack.length - 1];
                        break;
                    }
                    p = p.parent;
                }
                // if(this.breakin=="loop")
                //     brstm.next=this.loopStack[this.loopStack.length-1].nextF;
                // if(this.breakin=="switch")
                //     brstm.next=this.switchExitStack[this.switchExitStack.length-1];
                lastStatement = brstm;
            }
            if (c.kind == "ContinueStatement") {
                let constm = new StatementBuilder("continueStatement", "continue;", c, scope.id);
                judgeLastType(constm);
                constm.next = this.loopStack[this.loopStack.length - 1];
                lastStatement = constm;
            }
            if (c.kind == "IfStatement") {
                let ifstm: ConditionStatementBuilder = new ConditionStatementBuilder("ifStatement", "", c, scope.id);
                judgeLastType(ifstm);
                let ifexit: StatementBuilder = new StatementBuilder("ifExit", "", c, scope.id);
                let elsed: boolean = false;
                // let expressionCondition=false;
                for (let j = 0; j < c.children.length; j++) {
                    let ifchild = c.children[j];
                    if (ifchild.kind == "OpenParenToken") {
                        ifstm.condition = c.children[j + 1].text;
                        // expressionCondition=true;
                        ifstm.code = "if(" + ifstm.condition + ")";
                    }
                    if ((ifchild.kind == "CloseParenToken" || ifchild.kind == "ElseKeyword") && c.children[j + 1].kind != "Block") {
                        let tempBlock = new NodeA(undefined, c, [], "undefined", 0, "Block");
                        tempBlock.kind = "Block";
                        tempBlock.text = "tempBlock";
                        let temp0 = new NodeA(undefined, tempBlock, [], "undefined", 0, "undefined");
                        let temp1 = new NodeA(undefined, tempBlock, [c.children[j + 1]], "undefined", 0, "undefined");
                        tempBlock.children = [temp0, temp1];
                        c.children[j + 1] = tempBlock;
                    }
                    if (ifchild.kind == "ElseKeyword")
                        elsed = true;
                    if (ifchild.kind == "Block") {
                        this.walkAST(ifstm, ifexit, ifchild.children[1])
                    }
                }
                if (!elsed || !ifstm.nextF) {
                    ifstm.nextF = ifexit;
                }
                if (!ifstm.nextT) {
                    ifstm.nextT = ifexit;
                }
                lastStatement = ifexit;
            }
            if (c.kind == "WhileStatement") {
                this.breakin = "loop";
                let loopstm = new ConditionStatementBuilder("loopStatement", "", c, scope.id);
                this.loopStack.push(loopstm);
                judgeLastType(loopstm);
                let loopExit = new StatementBuilder("loopExit", "", c, scope.id);
                loopstm.nextF = loopExit;
                // let expressionCondition=false;
                for (let j = 0; j < c.children.length; j++) {
                    let loopchild = c.children[j];
                    if (loopchild.kind == "OpenParenToken") {
                        // expressionCondition=true;
                        loopstm.condition = c.children[j + 1].text;
                        loopstm.code = "while(" + loopstm.condition + ")";
                    }
                    if ((loopchild.kind == "CloseParenToken") && c.children[j + 1].kind != "Block") {
                        let tempBlock = new NodeA(undefined, c, [], "undefined", 0, "Block");
                        tempBlock.kind = "Block";
                        tempBlock.text = "tempBlock";
                        let temp0 = new NodeA(undefined, tempBlock, [], "undefined", 0, "undefined");
                        let temp1 = new NodeA(undefined, tempBlock, [c.children[j + 1]], "undefined", 0, "undefined");
                        tempBlock.children = [temp0, temp1];
                        c.children[j + 1] = tempBlock;
                    }
                    if (loopchild.kind == "Block") {
                        this.walkAST(loopstm, loopstm, loopchild.children[1]);
                    }
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
            if (c.kind == "ForStatement" || c.kind == "ForInStatement" || c.kind == "ForOfStatement") {
                this.breakin = "loop";
                let loopstm = new ConditionStatementBuilder("loopStatement", "", c, scope.id);
                this.loopStack.push(loopstm);
                judgeLastType(loopstm);
                let loopExit = new StatementBuilder("loopExit", "", c, scope.id);
                loopstm.nextF = loopExit;
                let code: string = "";
                for (let loopchild of c.children) {
                    if (loopchild.kind != "Block") {
                        code += loopchild.text + ' ';
                    }
                    else {
                        loopstm.code = code;
                        this.walkAST(loopstm, loopstm, loopchild.children[1]);
                    }
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
            if (c.kind == "DoStatement") {
                this.breakin = "loop";
                let loopstm = new ConditionStatementBuilder("loopStatement", "", c, scope.id);
                this.loopStack.push(loopstm);
                let loopExit = new StatementBuilder("loopExit", "", c, scope.id);
                loopstm.nextF = loopExit;
                // let expressionCondition=false;
                for (let j = 0; j < c.children.length; j++) {
                    let loopchild = c.children[j]
                    if (loopchild.kind == "OpenParenToken") {
                        // expressionCondition=true;
                        loopstm.condition = c.children[j + 1].text;
                        loopstm.code = "while(" + loopstm.condition + ")";
                    }
                    if (loopchild.kind == "Block") {
                        this.walkAST(lastStatement, loopstm, loopchild.children[1]);
                    }
                }
                let lastType = lastStatement.type;
                if (lastType == "ifStatement" || lastType == "loopStatement") {
                    let lastCondition = lastStatement as ConditionStatementBuilder;
                    loopstm.nextT = lastCondition.nextT;
                }
                else {
                    loopstm.nextT = lastStatement.next;
                }
                // if(!expressionCondition){
                //     for(let loopchild of c.children){
                //         if(loopchild.kind=="PrefixUnaryExpression"||loopchild.kind=="Identifier"||loopchild.kind=="PropertyAccessExpression"){
                //             loopstm.code="while("+loopchild.text+")";
                //             loopstm.condition=loopchild.text;
                //             break;
                //         }
                //     }
                // }
                lastStatement = loopExit;
                this.loopStack.pop();
            }
            if (c.kind == "SwitchStatement") {
                this.breakin = "switch";
                let switchstm = new SwitchStatementBuilder("switchStatement", "", c, scope.id);
                judgeLastType(switchstm);
                let switchExit = new StatementBuilder("switchExit", "", null, scope.id);
                this.switchExitStack.push(switchExit);
                for (let schild of c.children) {
                    if (schild.kind != "CaseBlock") {
                        switchstm.code += schild.text;
                    }
                    else {
                        let lastCaseExit: StatementBuilder | null = null;
                        let preCases: string[] = [];
                        for (let j = 0; j < schild.children[1].children.length; j++) {
                            let caseClause = schild.children[1].children[j];
                            let syntaxList: NodeA | null = null;
                            let caseWords = "";
                            for (let caseChild of caseClause.children) {
                                if (caseChild.kind == "SyntaxList") {
                                    syntaxList = caseChild;
                                    break;
                                }
                                else {
                                    caseWords += caseChild.text + " ";
                                }
                            }
                            if (syntaxList == null) {
                                console.log("caseClause without syntaxList");
                                process.exit();
                            }
                            if (syntaxList.children.length == 0) {
                                preCases.push(caseWords);
                            }
                            else {
                                let thisCase = caseWords;
                                for (let w of preCases) {
                                    caseWords += w + " ";
                                }
                                caseWords += caseWords;
                                let casestm = new StatementBuilder("statement", caseWords, caseClause, scope.id);
                                switchstm.nexts.push(casestm);
                                let caseExit = new StatementBuilder("caseExit", "", null, scope.id);
                                this.walkAST(casestm, caseExit, syntaxList);
                                for (let w of preCases) {
                                    if (casestm.next) {
                                        let cas = new Case(w, casestm.next);
                                        switchstm.cases.push(cas);
                                    }
                                }
                                if (casestm.next) {
                                    if (caseClause.kind == "CaseClause") {
                                        let cas = new Case(thisCase, casestm.next);
                                        switchstm.cases.push(cas);
                                    }
                                    else
                                        switchstm.default = casestm.next;
                                }
                                if (lastCaseExit) {
                                    lastCaseExit.next = casestm.next;
                                }
                                if (j == schild.children[1].children.length - 1) {
                                    caseExit.next = switchExit;
                                }
                                else {
                                    lastCaseExit = caseExit;
                                }
                                preCases = [];
                            }

                        }
                    }
                }
                if (switchstm.default == null)
                    switchstm.default = switchExit;
                lastStatement = switchExit;
                this.switchExitStack.pop();
            }
            if (c.kind == "Block") {
                let blockExit = new StatementBuilder("blockExit", "", c, scope.id);
                this.walkAST(lastStatement, blockExit, c.children[1]);
                lastStatement = blockExit;
            }
            if (c.kind == "TryStatement") {
                let trystm = new TryStatementBuilder("tryStatement", "try", c, scope.id);
                judgeLastType(trystm);
                let tryExit = new StatementBuilder("try exit", "", c, scope.id);
                trystm.tryExit = tryExit;
                this.walkAST(trystm, tryExit, c.children[1].children[1]);
                trystm.tryFirst = trystm.next;
                // lastStatement=tryExit;
                let catchClause: NodeA | null = null;
                let finalBlock: NodeA | null = null;
                let haveFinal = false;
                for (let trychild of c.children) {
                    if (haveFinal) {
                        finalBlock = trychild;
                        break;
                    }
                    if (trychild.kind == "CatchClause") {
                        catchClause = trychild;
                        let text = "catch";
                        if (catchClause.children.length > 2) {
                            text = catchClause.children[0].text + catchClause.children[1].text + catchClause.children[2].text + catchClause.children[3].text
                        }
                        let catchOrNot = new ConditionStatementBuilder("catchOrNot", text, c, scope.id);
                        // judgeLastType(catchOrNot);
                        let catchExit = new StatementBuilder("catch exit", "", c, scope.id);
                        catchOrNot.nextF = catchExit;
                        let block = catchClause.children[this.findChildIndex(catchClause, "Block")];
                        this.walkAST(catchOrNot, catchExit, block.children[1]);
                        if (!catchOrNot.nextT) {
                            catchOrNot.nextT = catchExit;
                        }
                        // lastStatement=catchExit;

                        trystm.catchStatements.push(catchOrNot.nextT);
                        let VD = catchClause.children[this.findChildIndex(catchClause, "VariableDeclaration")];
                        if (VD) {
                            let error = VD.children[this.findChildIndex(VD, "TypeReference")];
                            if (error) {
                                trystm.catchErrors.push(error.text);
                            }
                            else {
                                trystm.catchErrors.push("Error");
                            }
                        }
                        else {
                            trystm.catchErrors.push("Error");
                        }
                    }
                    if (trychild.kind == "FinallyKeyword") {
                        haveFinal = true;
                    }
                }
                if (finalBlock && finalBlock.children[1].children.length > 0) {
                    let final = new StatementBuilder("statement", "finally", c, scope.id);
                    // judgeLastType(final);
                    let finalExit = new StatementBuilder("finally exit", "", c, scope.id);
                    this.walkAST(final, finalExit, finalBlock.children[1]);
                    // lastStatement=finalExit;

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
                        console.log("exit error");
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
                        console.log("exit error");
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
        }
        else if (stm.type == "switchStatement") {
            let sstm = stm as SwitchStatementBuilder;
            for (let j in sstm.nexts) {
                let caseClause = sstm.nexts[j];
                if (caseClause.type.includes("Exit")) {
                    let p = caseClause;
                    while (p.type.includes("Exit")) {
                        if (p.next == null) {
                            console.log("exit error");
                            process.exit();
                        }
                        p = p.next;
                    }
                    sstm.nexts[j] = p;
                }
                this.deleteExit(sstm.nexts[j]);
            }
            if (sstm.default?.type.includes("Exit")) {
                let p = sstm.default;
                while (p.type.includes("Exit") && p.next) {
                    p = p.next;
                }
                sstm.default = p;
            }
        }
        else if (stm.type == "tryStatement") {
            let trystm = stm as TryStatementBuilder;
            if (trystm.tryFirst) {
                this.deleteExit(trystm.tryFirst);
            }
            for (let cat of trystm.catchStatements) {
                this.deleteExit(cat);
            }
            if (trystm.finallyStatement) {
                this.deleteExit(trystm.finallyStatement);
            }
        }
        else {
            if (stm.next?.type.includes("Exit")) {
                let p = stm.next;
                while (p.type.includes("Exit")) {
                    if (p.next == null) {
                        console.log("error exit");
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
        }
        else {
            block = new Block(this.blocks.length, stms, null);
        }
        this.blocks.push(block);
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
        if (stm.type != "loopStatement" && stm.type != "switchStatement" && stm.type != "tryStatement") {
            block.stms.push(stm);
            stm.block = block;
        }
        if (stm.type == "ifStatement" || stm.type == "loopStatement" || stm.type == "catchOrNot") {
            let cstm = stm as ConditionStatementBuilder;
            if (cstm.nextT == null || cstm.nextF == null) {
                this.errorTest(cstm);
                return;
            }
            if (cstm.type == "loopStatement") {
                let loopBlock = this.buildNewBlock([cstm]);
                block = loopBlock;
                cstm.block = block;
            }
            let b1 = this.buildNewBlock([]);
            this.buildBlocks(cstm.nextT, b1);
            let b2 = this.buildNewBlock([]);
            // block.nexts.push(b2);
            this.buildBlocks(cstm.nextF, b2);
        }
        else if (stm.type == "switchStatement") {
            let sstm = stm as SwitchStatementBuilder;
            for (let j in sstm.nexts) {
                let sn: StatementBuilder | null = sstm.nexts[j].next;
                let b = this.buildNewBlock([]);
                // block.nexts.push(b);
                if (sn)
                    this.buildBlocks(sn, b);
            }
        }
        else if (stm.type == "tryStatement") {
            let trystm = stm as TryStatementBuilder;
            if (!trystm.tryFirst) {
                console.log("try without tryFirst");
                process.exit();
            }
            let tryFirstBlock = this.buildNewBlock([]);
            trystm.block = tryFirstBlock;
            if (block.stms.length > 0) {
                block.nexts.add(tryFirstBlock);
                tryFirstBlock.lasts.add(block);
            }
            // block.nexts.push(tryFirstBlock);
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
            // block.nexts.push(afterTry);
            if (trystm.finallyStatement) {
                this.buildBlocks(trystm.finallyStatement, finallyBlock);
                // let stm=new StatementBuilder("gotoStatement","goto label"+finallyBlock.id,null,tryFirstBlock.stms[0].scopeID);
                // tryFirstBlock.stms.push(stm);
            }
            else {
                let stm = new StatementBuilder("tmp", "", null, -1);
                finallyBlock.stms = [stm];
            }
            for (let lastBlockInTry of lastBlocksInTry) {
                lastBlockInTry.nexts.add(finallyBlock);
                finallyBlock.lasts.add(lastBlockInTry);
            }
            // let catchBlocks:Block[]=[];
            for (let i = 0; i < trystm.catchStatements.length; i++) {
                let catchBlock = this.buildNewBlock([]);
                this.buildBlocks(trystm.catchStatements[i], catchBlock);
                for (let lastBlockInTry of lastBlocksInTry) {
                    lastBlockInTry.nexts.add(catchBlock);
                    catchBlock.lasts.add(lastBlockInTry);
                }

                catchBlock.nexts.add(finallyBlock);
                finallyBlock.lasts.add(catchBlock);
                // if(trystm.finallyStatement){
                //     let stm=new StatementBuilder("gotoStatement","goto label"+finallyBlock.id,null,tryFirstBlock.stms[0].scopeID);
                //     b.stms.push(stm);
                // }
                this.catches.push(new Catch(trystm.catchErrors[i], tryFirstBlock.id, finallyBlock.id, catchBlock.id));
            }
            if (trystm.finallyStatement) {
                this.resetWalkedPartial(trystm.finallyStatement);
                let errorFinallyBlock = this.buildNewBlock([]);
                for (let lastBlockInTry of lastBlocksInTry) {
                    lastBlockInTry.nexts.add(errorFinallyBlock);
                    errorFinallyBlock.lasts.add(lastBlockInTry);
                }

                for (let stm of finallyBlock.stms) {
                    errorFinallyBlock.stms.push(stm);
                }
                let stm = new StatementBuilder("statement", "throw Error", null, trystm.finallyStatement.scopeID);
                errorFinallyBlock.stms.push(stm);
                this.catches.push(new Catch("Error", tryFirstBlock.id, finallyBlock.id, errorFinallyBlock.id));
                for (let i = 0; i < trystm.catchStatements.length; i++) {
                    let block = trystm.catchStatements[i].block
                    if (!block) {
                        console.log("catch without block");
                        process.exit();
                    }
                    this.catches.push(new Catch(trystm.catchErrors[i], block.id, finallyBlock.id, errorFinallyBlock.id));
                    let goto = new StatementBuilder("gotoStatement", "goto label" + finallyBlock.id, null, finallyBlock.stms[0].scopeID);
                    block.stms.push(goto);
                    block.nexts.add(errorFinallyBlock);
                    errorFinallyBlock.lasts.add(block);
                }
            }
            let nextBlock = this.buildNewBlock([]);
            // block.nexts.push(nextBlock);
            if (trystm.next)
                this.buildBlocks(trystm.next, nextBlock);
            let goto = new StatementBuilder("gotoStatement", "goto label" + nextBlock.id, null, trystm.tryFirst.scopeID);
            goto.block = finallyBlock;
            if (trystm.finallyStatement) {
                finallyBlock.stms.push(goto);
            }
            else {
                finallyBlock.stms = [goto];
            }
        }
        else {
            if (stm.next) {
                if (stm.type == "continueStatement" && stm.next.block) {
                    // block.nexts.push(stm.next.block);
                    return;
                }
                if (stm.next.type == "loopStatement" && stm.next.block) {
                    // block.nexts.push(stm.next.block);
                    block = stm.next.block;
                    return;
                }

                stm.next.passTmies++;
                if (stm.next.passTmies == stm.next.lasts.length || stm.next.type == "loopStatement") {
                    if (stm.next.scopeID != stm.scopeID && !stm.next.type.includes(" exit")) {
                        let b = this.buildNewBlock([]);
                        // block.nexts.push(b);
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
                }
                else if (originStatement instanceof SwitchStatementBuilder) {
                    for (let nextStatement of originStatement.nexts) {
                        let next = nextStatement.block;
                        if (next && (lastStatement || next != block) && !nextStatement.type.includes(" exit")) {
                            block.nexts.add(next);
                            next.lasts.add(block);
                        }
                    }
                }
                else {
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
        const returnStatement = new StatementBuilder("returnStatement", "return;", null, this.exit.scopeID);
        if (notReturnStmts.length == 1) {
            const notReturnStmt = notReturnStmts[0];
            notReturnStmt.next = returnStatement;
            returnStatement.lasts = [notReturnStmt];
            returnStatement.next = this.exit;
            this.exit.lasts[this.exit.lasts.indexOf(notReturnStmt)] = returnStatement;
            notReturnStmt.block?.stms.push(returnStatement);
        }
        else if (notReturnStmts.length > 1) {
            let returnBlock = new Block(this.blocks.length, [returnStatement], null);
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

    nodeHaveCall(node: NodeA): boolean {
        if (node.kind == "CallExpression" || node.kind == "NewExpression") {
            return true;
        }
        let haveCall = false;
        for (let child of node.children) {
            if (child.kind == "Block")
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
            stm.line = stm.astNode.line + 1; // ast的行号是从0开始
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
        }
        else if (stm.type == "switchStatement") {
            let sstm = stm as SwitchStatementBuilder;
            for (let s of sstm.nexts) {
                s.lasts.push(sstm);
                this.buildLastAndHaveCall(s);
            }
        }
        else if (stm.type == "tryStatement") {
            let trystm = stm as TryStatementBuilder;
            if (trystm.tryFirst) {
                this.buildLastAndHaveCall(trystm.tryFirst);
            }
            for (let cat of trystm.catchStatements) {
                this.buildLastAndHaveCall(cat);
            }
            if (trystm.finallyStatement) {
                this.buildLastAndHaveCall(trystm.finallyStatement);
            }
        }
        else {
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
        // for(let stm of this.statementArray){
        //     stm.walked=false;
        // }
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
        }
        else if (stm.type == "switchStatement") {
            let sstm = stm as SwitchStatementBuilder;
            for (let j in sstm.nexts) {
                this.resetWalkedPartial(sstm.nexts[j]);
            }
        }
        else if (stm.type == "tryStatement") {
            let trystm = stm as TryStatementBuilder;
            if (trystm.tryFirst) {
                this.resetWalkedPartial(trystm.tryFirst);
            }
            for (let cat of trystm.catchStatements) {
                this.resetWalkedPartial(cat);
            }
            if (trystm.finallyStatement) {
                this.resetWalkedPartial(trystm.finallyStatement);
            }
        }
        else {
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
        }
        else if (stm.type == "switchStatement") {
            let sstm = stm as SwitchStatementBuilder;
            for (let ss of sstm.nexts) {
                this.CfgBuilder2Array(ss);
            }
        }
        else if (stm.type == "tryStatement") {
            let trystm = stm as TryStatementBuilder;
            if (trystm.tryFirst) {
                this.CfgBuilder2Array(trystm.tryFirst);
            }
            for (let cat of trystm.catchStatements) {
                this.CfgBuilder2Array(cat);
            }
            if (trystm.finallyStatement) {
                this.CfgBuilder2Array(trystm.finallyStatement);
            }
        }
        else {
            if (stm.next != null)
                this.CfgBuilder2Array(stm.next);
        }
    }

    // buildBlocks2(){
    //     for(let stm of this.statementArray){
    //         if(stm.type.includes("Exit")){
    //             this.statementArray.splice(this.statementArray.indexOf(stm),1);
    //         }
    //         if(stm.type=="SwitchStatementBuilder"){
    //             let sstm=stm as SwitchStatementBuilder;
    //             if(sstm.default?.type.includes("Exit")){
    //                 let p=sstm.default;
    //                 while(p.type.includes("Exit")){
    //                     if(p.next)
    //                         p=p.next;
    //                     else{
    //                         console.log("exit error");
    //                         process.exit();
    //                     }
    //                 }
    //                 sstm.default=p;
    //             }
    //         }
    //     }
    // }

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
            // let edge="Node"+cstm.index+" -> "+"Node"+cstm.nextF.index;
            let edge = [cstm.index, cstm.nextF.index];
            this.dotEdges.push(edge);
            edge = [cstm.index, cstm.nextT.index];
            // edge="Node"+cstm.index+" -> "+"Node"+cstm.nextT.index;
            this.dotEdges.push(edge);
            this.getDotEdges(cstm.nextF);
            this.getDotEdges(cstm.nextT);
        }
        else if (stm.type == "switchStatement") {
            let sstm = stm as SwitchStatementBuilder;
            for (let ss of sstm.nexts) {
                // let edge="Node"+sstm.index+" -> "+"Node"+ss.index;
                let edge = [sstm.index, ss.index];
                this.dotEdges.push(edge);
                this.getDotEdges(ss);
            }
        }
        else {
            if (stm.next != null) {
                // let edge="Node"+stm.index+" -> "+"Node"+stm.next.index;
                let edge = [stm.index, stm.next.index];
                this.dotEdges.push(edge);
                this.getDotEdges(stm.next);
            }
        }
    }

    generateDot() {
        this.resetWalked();
        this.getDotEdges(this.entry);
        const filename = this.name + ".dot";


        let fileContent = "digraph G {\n";

        for (let stm of this.statementArray) {
            if (stm.type == "entry" || stm.type == "exit")
                fileContent += "Node" + stm.index + " [label=\"" + stm.type.replace(/"/g, '\\"') + "\"];\n";
            else
                fileContent += "Node" + stm.index + " [label=\"" + stm.code.replace(/"/g, '\\"') + "\"];\n";
        }
        for (let edge of this.dotEdges) {
            fileContent += "Node" + edge[0] + " -> " + "Node" + edge[1] + ";\n";
        }
        fileContent += "}";
        fs.writeFile(filename, fileContent, (err) => {
            if (err) {
                console.error(`Error writing to file: ${err.message}`);
            }
        });

        // const dotCommand = "dot -Tpng "+filename+" -o "+this.name+".png";
        // exec(dotCommand, (error, stdout, stderr) => {
        // if (error) {
        //     console.error(`Error: ${error.message}`);
        //     return;
        // }
        // if (stderr) {
        //     console.error(`stderr: ${stderr}`);
        //     return;
        // }
        // });

    }

    dfsUseDef(stm: StatementBuilder, node: NodeA, mode: string) {
        let set: Set<Variable> = new Set();
        if (mode == "use")
            set = stm.use;
        else if (mode == "def")
            set = stm.def;

        if (node.kind == "Identifier") {
            for (let v of this.variables) {
                if (v.name == node.text) {
                    set.add(v);
                    if (mode == "use") {
                        let chain = new DefUseChain(v.lastDef, stm);
                        v.defUse.push(chain);
                    }
                    else {
                        v.lastDef = stm;
                        for (let p of v.properties) {
                            p.lastDef = stm;
                        }
                    }
                    return;
                }
            }
        }
        if (node.kind == "PropertyAccessExpression") {
            // this.dfsUseDef(stm,node.children[0],mode);
            for (let v of this.variables) {
                if (v.name == node.children[0].text) {
                    if (mode == "use") {
                        for (let prop of this.variables) {
                            if (prop.name == node.text) {
                                set.add(prop);
                                let chain = new DefUseChain(prop.lastDef, stm);
                                prop.defUse.push(chain);
                                if (prop.lastDef == v.lastDef) {
                                    set.add(v);
                                    chain = new DefUseChain(v.lastDef, stm);
                                    v.defUse.push(chain);
                                }
                                return;
                            }
                        }
                        set.add(v);
                        let chain = new DefUseChain(v.lastDef, stm);
                        v.defUse.push(chain);
                    }
                    else {
                        for (let v of this.variables) {
                            if (v.name == node.text) {
                                v.lastDef = stm;
                                return;
                            }
                        }
                        const property = new Variable(node.text, stm);
                        this.variables.push(property);
                        for (let v of this.variables) {
                            if (v.name == node.children[0].text) {
                                v.properties.push(property);
                                property.propOf = v;
                            }
                        }
                    }
                    return;
                }
            }
        }
        let indexOfDef = -1;
        if (node.kind == "VariableDeclaration") {
            indexOfDef = 0;
            this.dfsUseDef(stm, node.children[indexOfDef], "def");
        }
        if (node.kind == "BinaryExpression" && node.children[1].kind == "FirstAssignment") {
            indexOfDef = 0;
        }
        if (node.kind == "BinaryExpression" && node.children[1].kind == "FirstAssignment") {
            indexOfDef = 0;
        }
        for (let i = 0; i < node.children.length; i++) {
            if (i == indexOfDef)
                continue;
            let child = node.children[i];
            this.dfsUseDef(stm, child, mode);
        }
        for (let i = 0; i < node.children.length; i++) {
            let child = node.children[i];
            if (child.kind == "FirstAssignment") {
                if (i >= 2 && node.children[i - 2].kind == "ColonToken") {
                    indexOfDef = i - 3;
                    this.dfsUseDef(stm, node.children[indexOfDef], "def");
                }
                else {
                    indexOfDef = i - 1;
                    this.dfsUseDef(stm, node.children[indexOfDef], "def");
                }
            }
            if (child.kind.includes("EqualsToken") && child.kind != "EqualsEqualsToken") {
                this.dfsUseDef(stm, node.children[i - 1], "def");
            }
            else if (child.kind == "PlusPlusToken" || child.kind == "MinusMinusToken") {
                if (i == 0)
                    this.dfsUseDef(stm, node.children[i + 1], "def");
                else
                    this.dfsUseDef(stm, node.children[i - 1], "def");
            }
        }
    }
    findChildIndex(node: NodeA, kind: string): number {
        for (let i = 0; i < node.children.length; i++) {
            if (node.children[i].kind == kind)
                return i;
        }
        return -1;
    }
    generateUseDef() {
        // if(stm.walked)return;
        // stm.walked = true;
        for (let stm of this.statementArray) {
            if (stm.astNode == null) continue;
            let node: NodeA = stm.astNode;
            let c = stm.astNode;
            switch (stm.astNode?.kind) {
                case "FirstStatement":
                case "VariableStatement":
                    let declList = c.children[this.findChildIndex(c, "VariableDeclarationList")];
                    declList = declList.children[this.findChildIndex(declList, "SyntaxList")];
                    for (let decl of declList.children) {
                        if (decl.children[0]) {
                            const v = new Variable(decl.children[0]?.text, stm);
                            this.variables.push(v);
                            this.dfsUseDef(stm, decl, "use");
                        }
                    }
                    break;
                case "ImportDeclaration":
                    let importClause = c.children[this.findChildIndex(c, "ImportClause")];
                    let nameImport = importClause.children[0]
                    if (nameImport.kind == "NamedImports") {
                        let syntaxList = nameImport.children[this.findChildIndex(nameImport, "SyntaxList")];
                        for (let importSpecifier of syntaxList.children) {
                            if (importSpecifier.kind != "ImportSpecifier")
                                continue;
                            const v = new Variable(importSpecifier.text, stm);
                            this.variables.push(v);
                            stm.def.add(v);
                        }
                    }
                    else if (nameImport.kind == "NamespaceImport") {
                        let identifier = nameImport.children[this.findChildIndex(nameImport, "Identifier")];
                        const v = new Variable(identifier.text, stm);
                        this.variables.push(v);
                        stm.def.add(v);
                    }
                    break;
                case "IfStatement":
                case "WhileStatement":
                case "DoStatement":
                    for (let child of node.children) {
                        if (child.kind == "Identifier") {
                            for (let v of this.variables) {
                                if (v.name == child.text)
                                    stm.use.add(v);
                            }
                        }
                        else if (child.kind == "BinaryExpression") {
                            this.dfsUseDef(stm, child, "use");
                        }
                    }
                    break;
                case "ForStatement":
                    let semicolon = 0;
                    let beforeDef = new Set<Variable>;
                    for (let child of node.children) {
                        if (child.kind == "SemicolonToken") {
                            semicolon++;
                            if (semicolon == 2) {
                                beforeDef = new Set(stm.def);
                            }
                        }
                        if (child.kind == "Block") {
                            break;
                        }
                        this.dfsUseDef(stm, child, "use");
                    }
                    for (let element of stm.def) {
                        if (!beforeDef.has(element)) {
                            stm.defspecial.add(element)
                        }
                    }
                    break;
                case "ForInStatement":
                    let indexOfIn = this.findChildIndex(node, "InKeyword");
                    this.dfsUseDef(stm, node.children[indexOfIn + 1], "use");
                    this.dfsUseDef(stm, node.children[indexOfIn - 1], "use");
                    break;
                case "ForOfStatement":
                    let indexOfOf = this.findChildIndex(node, "LastContextualKeyword");//of
                    this.dfsUseDef(stm, node.children[indexOfOf + 1], "use");
                    this.dfsUseDef(stm, node.children[indexOfOf - 1], "use");
                    break;
                default:
                    if (stm.type != "entry" && stm.type != "exit")
                        this.dfsUseDef(stm, node, "use");
            }
        }
    }


    // utils begin
    private getChild(node: NodeA, childKind: string): NodeA | null {
        for (let i = 0; i < node.children.length; i++) {
            if (node.children[i].kind == childKind)
                return node.children[i];
        }
        return null;
    }

    private needExpansion(node: NodeA): boolean {
        let nodeKind = node.kind;
        if (nodeKind == 'PropertyAccessExpression' || nodeKind == 'CallExpression') {
            return true;
        }
        return false;
    }

    private support(node: NodeA): boolean {
        let nodeKind = node.kind;
        if (nodeKind == 'ImportDeclaration' || nodeKind == 'TypeAliasDeclaration') {
            return false;
        }
        return true;
    }

    // temp function
    private toSupport(node: NodeA): boolean {
        let nodeKind = node.kind;
        if (nodeKind == 'SwitchStatement'
            || nodeKind == 'CaseClause'
            || nodeKind == 'DefaultClause'
            || nodeKind == 'TryStatement'
            || nodeKind == 'ThrowStatement') {
            return true;
        }
        return false;
    }

    private getSyntaxListItems(node: NodeA): NodeA[] {
        let items: NodeA[] = [];
        for (const child of node.children) {
            if (child.kind != 'CommaToken') {
                items.push(child);
            }
        }
        return items;
    }

    // temp function
    // TODO: 支持i += 1;之类的复合赋值语句
    private nopStmt(node: NodeA): boolean {
        let nodeKind = node.kind;
        if (nodeKind == 'BinaryExpression' || nodeKind == 'VoidExpression') {
            return true;
        }
        return false;
    }

    private shouldBeConstant(node: NodeA): boolean {
        let nodeKind = node.kind;
        if (nodeKind == 'FirstTemplateToken' || (nodeKind.includes('Literal') && nodeKind != 'ArrayLiteralExpression')
            || nodeKind.includes('Keyword')) {
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


    private generateTempValue(): Value {
        let tempLeftOpName = "temp" + this.tempVariableNum;
        this.tempVariableNum++;
        let tempLeftOp = new Local(tempLeftOpName);
        this.locals.add(tempLeftOp);
        return tempLeftOp;
    }

    private generateAssignStmt(node: NodeA | Value): Value {
        let leftOp = this.generateTempValue();
        let rightOp: any;
        if (node instanceof NodeA) {
            rightOp = this.astNodeToValue(node);
        } else {
            rightOp = node;
        }
        this.current3ACstm.threeAddressStmts.push(new ArkAssignStmt(leftOp, rightOp));
        return leftOp;
    }

    // TODO:支持更多场景
    private astNodeToConditionExpr(conditionExprNode: NodeA): ArkConditionExpr {
        let conditionValue = this.astNodeToValue(conditionExprNode);
        let conditionExpr: ArkConditionExpr;
        if ((conditionValue instanceof ArkBinopExpr) && isRelationalOperator(conditionValue.getOperator())) {
            conditionExpr = new ArkConditionExpr(conditionValue.getOp1(), conditionValue.getOp2(), flipOperator(conditionValue.getOperator()));
        } else {
            if (IRUtils.moreThanOneAddress(conditionValue)) {
                conditionValue = this.generateAssignStmt(conditionValue);
            }
            conditionExpr = new ArkConditionExpr(conditionValue, new Constant('0'), '==');
        }
        return conditionExpr;

        function isRelationalOperator(operator: string): boolean {
            return operator == '<' || operator == '<=' || operator == '>' || operator == '<' ||
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

    private astNodeToValue(node: NodeA): Value {
        let value: any;
        if (node.kind == 'Identifier') {
            // console.log("[astNodeToValue] Identifier " + node.children[0])
            value = new Local(node.text);
            value = this.getOriginalLocal(value);
        }
        else if (node.kind == 'Parameter') {
            let identifierNode = node.children[0];
            let typeNode = node.children[2];
            value = new Local(identifierNode.text);
            value = this.getOriginalLocal(value);
        }
        else if (this.shouldBeConstant(node)) {
            value = new Constant(node.text);
            if (value instanceof Constant) {
                // console.log(node.kind)
                value.setType(this.resolveKeywordType(node))
            }
        }
        else if (node.kind == 'BinaryExpression') {
            let op1 = this.astNodeToValue(node.children[0]);
            let operator = node.children[1].text;
            let op2 = this.astNodeToValue(node.children[2]);
            if (IRUtils.moreThanOneAddress(op1)) {
                op1 = this.generateAssignStmt(op1);
            }
            if (IRUtils.moreThanOneAddress(op2)) {
                op2 = this.generateAssignStmt(op2);
            }
            value = new ArkBinopExpr(op1, op2, operator);
        }
        // TODO:属性访问需要展开
        else if (node.kind == 'PropertyAccessExpression') {
            let tempBase = new Local(node.children[0].text);
            let base = this.getOriginalLocal(tempBase, false);
            if (base == tempBase) {
                let fieldSignature = node.text;
                value = new ArkStaticFieldRef(fieldSignature);
            } else {
                let fieldSignature = node.children[2].text;
                value = new ArkInstanceFieldRef(base, fieldSignature);
            }
        }
        else if (node.kind == 'ElementAccessExpression') {
            let baseValue = this.astNodeToValue(node.children[0]);
            let indexNodeIdx = this.findChildIndex(node, 'OpenBracketToken') + 1;
            let indexValue = this.astNodeToValue(node.children[indexNodeIdx]);
            if (!(baseValue instanceof Local)) {
                baseValue = this.generateAssignStmt(baseValue);
            }

            value = new ArkArrayRef(baseValue as Local, indexValue);
        }
        else if (node.kind == "CallExpression") {
            let syntaxListNode = node.children[this.findChildIndex(node, 'OpenParenToken') + 1];
            let argNodes = this.getSyntaxListItems(syntaxListNode);
            let args: Value[] = [];
            for (const argNode of argNodes) {
                let argValue = this.astNodeToValue(argNode);
                if (IRUtils.moreThanOneAddress(argValue)) {
                    argValue = this.generateAssignStmt(argValue);
                }

                args.push(argValue);
            }

            let calleeNode = node.children[0];
            let methodValue = this.astNodeToValue(calleeNode);
            if (methodValue instanceof ArkInstanceFieldRef) {
                value = new ArkInstanceInvokeExpr(methodValue.getBase(), methodValue.getFieldName(), args);
            } else if (methodValue instanceof ArkStaticFieldRef) {
                value = new ArkStaticInvokeExpr(methodValue.getFieldName(), args);
            } else {
                value = new ArkStaticInvokeExpr(calleeNode.text, args);
            }
        }
        // TODO:箭头函数视作静态方法还是普通方法
        else if (node.kind == "ArrowFunction") {
            let arrowFuncName = 'AnonymousFunc-' + this.name + '-' + this.anonymousFuncIndex;
            if (node.methodNodeInfo) {
                node.methodNodeInfo.updateName4anonymousFunc(arrowFuncName);
            }
            else {
                throw new Error('No MethodNodeInfo found for ArrowFunction node. Please check.');
            }
            this.anonymousFuncIndex++;

            let argsNode = node.children[1];
            let args: Value[] = [];
            for (let argNode of argsNode.children) {
                if (argNode.kind != 'CommaToken') {
                    args.push(this.astNodeToValue(argNode));
                }
            }
            let arrowArkMethod = new ArkMethod();
            arrowArkMethod.buildArkMethodFromAstNode(node, this.declaringClass);
            this.declaringClass.addMethod(arrowArkMethod);
            value = new ArkStaticInvokeExpr(arrowArkMethod.getSignature().toString(), args);
        }
        // TODO:函数表达式视作静态方法还是普通方法
        else if (node.kind == 'FunctionExpression') {
            let funcExprName = '';
            if (node.children[1].kind != 'OpenParenToken') {
                funcExprName = node.children[1].text;
            } else {
                funcExprName = 'AnonymousFunc-' + this.name + '-' + this.anonymousFuncIndex;
                this.anonymousFuncIndex++;
            }

            if (node.methodNodeInfo) {
                node.methodNodeInfo.updateName4anonymousFunc(funcExprName);
            }
            else {
                throw new Error('No MethodNodeInfo found for ArrowFunction node. Please check.');
            }

            let argsNode = this.getChild(node, 'SyntaxList') as NodeA;
            let args: Value[] = [];
            for (let argNode of argsNode.children) {
                if (argNode.kind != 'CommaToken') {
                    args.push(this.astNodeToValue(argNode));
                }
            }
            let exprArkMethod = new ArkMethod();
            exprArkMethod.buildArkMethodFromAstNode(node, this.declaringClass);
            this.declaringClass.addMethod(exprArkMethod);
            value = new ArkStaticInvokeExpr(exprArkMethod.getSignature().toString(), args);
        }
        else if (node.kind == "ClassExpression") {
            let cls: ArkClass = new ArkClass();
            let arkFile = this.declaringClass.getDeclaringArkFile();
            cls.buildArkClassFromAstNode(node, arkFile);
            arkFile.addArkClass(cls);
            if (cls.isExported()) {
                let exportClauseName: string = cls.getName();
                let exportClauseType: string = "Class";
                let exportInfo = new ExportInfo();
                exportInfo.build(exportClauseName, exportClauseType);
                arkFile.addExportInfos(exportInfo);
            }
        }
        else if (node.kind == "NewExpression") {
            let classSignature = node.children[1].text;
            value = new ArkNewExpr(classSignature);
        }
        else if (node.kind == 'ArrayLiteralExpression') {
            let syntaxListNode = node.children[1];
            let size = 0;
            for (const syntaxNode of syntaxListNode.children) {
                if (syntaxNode.kind != 'CommaToken') {
                    size += 1;
                }
            }
            // TODO:得到准确类型
            value = new ArkNewArrayExpr('int', new Constant(size.toString()));
        }
        else if (node.kind == 'PrefixUnaryExpression') {
            let token = node.children[0].text;
            if (token == '++' || token == '--') {
                value = this.astNodeToValue(node.children[1]);
                let binopExpr = new ArkBinopExpr(value, new Constant('1'), token[0]);
                this.current3ACstm.threeAddressStmts.push(new ArkAssignStmt(value, binopExpr));
            } else {
                value = new Local(node.text);
                value = this.getOriginalLocal(value);
            }
        }
        else if (node.kind == 'PostfixUnaryExpression') {
            let token = node.children[1].text;
            value = this.astNodeToValue(node.children[0]);
            let binopExpr = new ArkBinopExpr(value, new Constant('1'), token[0]);
            this.current3ACstm.threeAddressStmts.push(new ArkAssignStmt(value, binopExpr));
        }
        else if (node.kind == 'TemplateExpression') {
            value = new Local(node.text);
            value = this.getOriginalLocal(value);
        }
        else if (node.kind == 'AwaitExpression') {
            value = this.astNodeToValue(node.children[1]);
        }
        else if (node.kind == 'ParenthesizedExpression') {
            value = this.astNodeToValue(node.children[1]);
        }
        else if (node.kind == 'SpreadElement') {
            value = this.astNodeToValue(node.children[1]);
        }
        else if (node.kind == 'TypeOfExpression') {
            value = new ArkTypeOfExpr(this.astNodeToValue(node.children[1]));
        }
        else if (node.kind == 'AsExpression') {
            let typeName = node.children[2].text;
            let op = this.astNodeToValue(node.children[0]);
            value = new ArkCastExpr(op, typeName);
        }
        else if (node.kind == 'TypeAssertionExpression') {
            let typeName = node.children[this.findChildIndex(node, 'FirstBinaryOperator') + 1].text;
            let opNode = node.children[this.findChildIndex(node, 'GreaterThanToken') + 1]
            let op = this.astNodeToValue(opNode);
            value = new ArkCastExpr(op, typeName);
        }
        else if (node.kind == 'ArrayBindingPattern' || node.kind == 'ObjectBindingPattern') {
            value = this.generateTempValue();
        }
        else if (node.kind == 'VoidExpression') {
            this.astNodeToThreeAddressStmt(node.children[1]);
            value = new Constant('undefined');
        }
        else if (node.kind == 'VariableDeclarationList') {
            let declsNode = node.children[this.findChildIndex(node, "SyntaxList")];
            let syntaxListItems = this.getSyntaxListItems(declsNode);
            value = new Local(syntaxListItems[0].text);
            value = this.getOriginalLocal(value);
        }
        else if (node.kind == 'ConditionalExpression') {
            // TODO:新增block
            let conditionIdx = this.findChildIndex(node, 'QuestionToken') - 1;
            let conditionExprNode = node.children[conditionIdx];
            let conditionExpr = this.astNodeToConditionExpr(conditionExprNode);
            this.current3ACstm.threeAddressStmts.push(new ArkIfStmt(conditionExpr));

            let resultLocal = this.generateTempValue();
            let whenTrueIdx = this.findChildIndex(node, 'QuestionToken') + 1;
            let whenTrueNode = node.children[whenTrueIdx];
            this.current3ACstm.threeAddressStmts.push(new ArkAssignStmt(resultLocal, this.astNodeToValue(whenTrueNode)));
            let whenFalseIdx = this.findChildIndex(node, 'ColonToken') + 1;
            let whenFalseNode = node.children[whenFalseIdx];
            this.current3ACstm.threeAddressStmts.push(new ArkAssignStmt(resultLocal, this.astNodeToValue(whenFalseNode)));
            value = resultLocal;
        }
        else if (this.toSupport(node)) {
            value = new Constant(node.text);
        }
        else {
            console.log('unsupported expr node type:', node.kind, ', text:', node.text)
            value = new Constant(node.text);
        }
        return value;
    }

    private astNodeToThreeAddressAssignStmt(node: NodeA): Stmt[] {
        let leftOpNode = node.children[0];
        let leftOp = this.astNodeToValue(leftOpNode);

        let leftOpType = this.getTypeNode(node)

        let rightOpNode = new NodeA(undefined, null, [], 'dummy', -1, 'dummy');
        let rightOp: Value;
        if (this.findChildIndex(node, 'FirstAssignment') != -1) {
            rightOpNode = node.children[this.findChildIndex(node, 'FirstAssignment') + 1];
            rightOp = this.astNodeToValue(rightOpNode);
        } else {
            rightOp = new Constant('undefined');
        }


        if (leftOp instanceof Local) {
            leftOp.setType(leftOpType)
        }
        // console.log("[astNodeToThreeAddressAssignStmt] left: " + leftOp + " type: " + leftOpType + " right: " + rightOp)
        if (IRUtils.moreThanOneAddress(leftOp) && IRUtils.moreThanOneAddress(rightOp)) {
            rightOp = this.generateAssignStmt(rightOp);
        }

        let threeAddressAssignStmts: Stmt[] = [new ArkAssignStmt(leftOp, rightOp)];
        if (rightOp instanceof ArkNewExpr) {
            let methodSignature = 'constructor';

            let syntaxListNode = rightOpNode.children[this.findChildIndex(rightOpNode, 'OpenParenToken') + 1];
            let argNodes = this.getSyntaxListItems(syntaxListNode);
            let args: Value[] = [];
            for (const argNode of argNodes) {
                args.push(this.astNodeToValue(argNode));
            }
            threeAddressAssignStmts.push(new ArkInvokeStmt(new ArkInstanceInvokeExpr(leftOp as Local, methodSignature, args)));
        } else if (rightOp instanceof ArkNewArrayExpr) {
            let argsNode = rightOpNode.children[1];
            let index = 0;
            for (let argNode of argsNode.children) {
                if (argNode.kind != 'CommaToken') {
                    // TODO:数组条目类型
                    let arrayRef = new ArkArrayRef(leftOp as Local, new Constant(index.toString()));
                    let arrayItem = new Constant(argNode.text);
                    threeAddressAssignStmts.push(new ArkAssignStmt(arrayRef, arrayItem));
                    index++;
                }
            }
        }

        if (leftOpNode.kind == 'ArrayBindingPattern' || leftOpNode.kind == 'ObjectBindingPattern') {
            let argNodes = this.getSyntaxListItems(leftOpNode.children[1]);
            let index = 0;
            for (const argNode of argNodes) {
                // TODO:数组条目类型
                let arrayRef = new ArkArrayRef(leftOp as Local, new Constant(index.toString()));
                let arrayItem = new Constant(argNode.text);
                threeAddressAssignStmts.push(new ArkAssignStmt(arrayItem, arrayRef));
                index++;
            }
        }
        return threeAddressAssignStmts;
    }

    private astNodeToThreeAddressSwitchStatement(node: NodeA) {

    }

    private astNodeToThreeAddressIterationStatement(node: NodeA) {
        if (node.kind == "ForStatement") {
            let openParenTokenIdx = this.findChildIndex(node, 'OpenParenToken');
            let mayConditionIdx = openParenTokenIdx + 3;
            if (node.children[openParenTokenIdx + 1].kind != 'SemicolonToken') {
                let initializer = node.children[openParenTokenIdx + 1]
                this.astNodeToThreeAddressStmt(initializer);
            } else {
                mayConditionIdx = openParenTokenIdx + 2;
            }

            let incrementorIdx = mayConditionIdx + 2;
            if (node.children[mayConditionIdx].kind != 'SemicolonToken') {
                let conditionExprNode = node.children[mayConditionIdx];
                let conditionExpr = this.astNodeToConditionExpr(conditionExprNode);
                this.current3ACstm.threeAddressStmts.push(new ArkIfStmt(conditionExpr));
            } else {
                incrementorIdx = mayConditionIdx + 1;
            }

            if (node.children[incrementorIdx].kind != 'SemicolonToken') {
                let incrementorNode = node.children[incrementorIdx];
                this.astNodeToThreeAddressStmt(incrementorNode);
            }
        } else if (node.kind == "ForOfStatement" || node.kind == "ForInStatement") {
            // 暂时只支持数组遍历
            let varIdx = this.findChildIndex(node, 'OpenParenToken') + 1;
            let varNode = node.children[varIdx];
            let iterableIdx = varIdx + 2;
            let iterableNode = node.children[iterableIdx];

            let iterableValue = this.astNodeToValue(iterableNode);
            let lenghtLocal = this.generateTempValue();
            this.current3ACstm.threeAddressStmts.push(new ArkAssignStmt(lenghtLocal, new ArkLengthExpr(iterableValue)));
            let indexLocal = this.generateTempValue();
            this.current3ACstm.threeAddressStmts.push(new ArkAssignStmt(indexLocal, new Constant('0')));

            let conditionExpr = new ArkConditionExpr(indexLocal, lenghtLocal, ' >= ');
            this.current3ACstm.threeAddressStmts.push(new ArkIfStmt(conditionExpr));

            let varLocal = this.astNodeToValue(varNode);
            let arrayRef = new ArkArrayRef(iterableValue as Local, indexLocal);
            this.current3ACstm.threeAddressStmts.push(new ArkAssignStmt(varLocal, arrayRef));

            let incrExpr = new ArkBinopExpr(indexLocal, new Constant('1'), '+');
            this.current3ACstm.threeAddressStmts.push(new ArkAssignStmt(indexLocal, incrExpr));
        } else if (node.kind == "WhileStatement" || node.kind == "DoStatement") {
            let conditionIdx = this.findChildIndex(node, 'OpenParenToken') + 1;
            let conditionExprNode = node.children[conditionIdx];
            let conditionExpr = this.astNodeToConditionExpr(conditionExprNode);
            this.current3ACstm.threeAddressStmts.push(new ArkIfStmt(conditionExpr));
        }
    }

    private astNodeToThreeAddressStmt(node: NodeA) {
        let threeAddressStmts: Stmt[] = [];
        if (node.kind == "ReturnStatement") {
            let childCnt = node.children.length;
            if (childCnt > 1 && node.children[1].kind != 'SemicolonToken') {
                let op = this.astNodeToValue(node.children[1]);
                if (IRUtils.moreThanOneAddress(op)) {
                    op = this.generateAssignStmt(op);
                }
                threeAddressStmts.push(new ArkReturnStmt(op));
            } else {
                threeAddressStmts.push(new ArkReturnVoidStmt());
            }
        }
        else if (node.kind == "FirstStatement" || node.kind == "VariableDeclarationList") {
            let declListNode = node;
            if (node.kind == 'FirstStatement') {
                declListNode = node.children[this.findChildIndex(node, "VariableDeclarationList")];
            }
            let declsNode = declListNode.children[this.findChildIndex(declListNode, "SyntaxList")];
            let syntaxListItems = this.getSyntaxListItems(declsNode);
            for (let declNode of syntaxListItems) {
                this.astNodeToThreeAddressStmt(declNode);
            }
        }
        else if ((node.kind == 'BinaryExpression' && node.children[1].kind == 'FirstAssignment')
            || (node.kind == 'VariableDeclaration')) {
            threeAddressStmts.push(...this.astNodeToThreeAddressAssignStmt(node));
        } else if (node.kind == "ExpressionStatement") {
            let expressionNodeIdx = 0;
            if (node.children[0].kind == 'JSDocComment') {
                expressionNodeIdx = 1;
            }
            let expressionNode = node.children[expressionNodeIdx];
            this.astNodeToThreeAddressStmt(expressionNode);
        } else if (node.kind == 'IfStatement') {
            let conditionExprNode = node.children[this.findChildIndex(node, 'OpenParenToken') + 1];
            let conditionExpr = this.astNodeToConditionExpr(conditionExprNode);
            threeAddressStmts.push(new ArkIfStmt(conditionExpr));
        } else if (node.kind == 'PostfixUnaryExpression' || node.kind == 'PrefixUnaryExpression') {
            this.astNodeToValue(node);
        }
        else if (node.kind == 'ForStatement' || node.kind == 'ForOfStatement' || node.kind == 'ForInStatement'
            || node.kind == 'WhileStatement' || node.kind == 'DoStatement') {
            this.astNodeToThreeAddressIterationStatement(node);
        }
        else if (node.kind == 'BreakStatement' || node.kind == 'ContinueStatement') {
            threeAddressStmts.push(new ArkGotoStmt());
        }
        else if (node.kind == 'CallExpression') {
            threeAddressStmts.push(new ArkInvokeStmt(this.astNodeToValue(node) as AbstractInvokeExpr));
        }
        else if (node.kind == 'NewExpression') {
            let leftOp = this.generateTempValue();
            let rightOp = this.astNodeToValue(node);
            threeAddressStmts.push(new ArkAssignStmt(leftOp, rightOp));

            let methodSignature = 'constructor';

            let syntaxListNode = node.children[this.findChildIndex(node, 'OpenParenToken') + 1];
            let argNodes = this.getSyntaxListItems(syntaxListNode);
            let args: Value[] = [];
            for (const argNode of argNodes) {
                args.push(this.astNodeToValue(argNode));
            }
            threeAddressStmts.push(new ArkInvokeStmt(new ArkInstanceInvokeExpr(leftOp as Local, methodSignature, args)));
        }
        else if (node.kind == "AwaitExpression") {
            let expressionNode = node.children[1];
            this.astNodeToThreeAddressStmt(expressionNode);
        }
        else if (node.kind == 'VoidExpression') {
            this.astNodeToThreeAddressStmt(node.children[1]);
        }
        else if (this.toSupport(node)) {

        }
        else if (this.nopStmt(node)) {
            // threeAddressStmts.push(new ArkNopStmt());
        }
        else {
            console.log('unsupported stmt node, type:', node.kind, ', text:', node.text);
        }

        this.current3ACstm.threeAddressStmts.push(...threeAddressStmts);
        return;
    }

    private transformToThreeAddress() {
        for (let blockId = 0; blockId < this.blocks.length; blockId++) {
            let currBlock = this.blocks[blockId];
            for (const originStmt of currBlock.stms) {
                if (originStmt.astNode && originStmt.code != "" && this.support(originStmt.astNode)) {
                    this.current3ACstm = originStmt;
                    this.astNodeToThreeAddressStmt(originStmt.astNode);
                } else if (originStmt.code == 'return;') {
                    // 额外添加的return语句特殊处理
                    originStmt.threeAddressStmts.push(new ArkReturnVoidStmt());
                }
            }
        }
    }


    errorTest(stm: StatementBuilder) {
        let mes = "";
        if (this.declaringClass?.getDeclaringArkFile()) {
            mes = this.declaringClass?.getDeclaringArkFile().getName() + "." + this.declaringClass.getName() + "." + this.name;
        }
        else {
            mes = "ifnext error"
        }
        mes += "\n" + stm.code;
        throw new textError(mes);
    }

    updateParentText(node: NodeA) {
        if (!node)
            return;
        node.text = ""
        for (let child of node.children) {
            node.text += child.text;
            if (child.kind.includes("Keyword"))
                node.text += " ";
            if (node.kind == "SyntaxList" && child.kind.includes("Statement"))
                node.text += "\r\n";
        }
        if (node.parent)
            this.updateParentText(node.parent);
    }

    public insertStatementAfter(stm: StatementBuilder, text: string): NodeA {
        let insertAST = new ASTree(text);
        let parent: NodeA;
        if (stm.astNode?.parent)
            parent = stm.astNode.parent;
        else {
            if (!this.entry.astNode) {
                console.log("entry without astNode");
                process.exit();
            }
            parent = this.entry.astNode;
        }
        let insertPosition = -1;
        if (stm.astNode)
            insertPosition = parent.children.indexOf(stm.astNode) + 1;
        else
            insertPosition = parent.children.length;
        let stmAST = insertAST.root.children[0];
        parent.children.splice(insertPosition, 0, stmAST);
        stmAST.parent = parent;
        this.updateParentText(parent);
        return stmAST;

        // let insertStm=new StatementBuilder("StatementBuilder",text,insertAST.root.children[0],stm.scopeID);
        // insertStm.next=stm.next;
        // insertStm.lasts.push(stm);
        // stm.next=insertStm;
        // if(!insertStm.next)
        //     return;
        // insertStm.next.lasts[insertStm.next.lasts.indexOf(stm)]=insertStm;
    }

    public insertStatementBefore(stm: StatementBuilder, text: string): NodeA {
        let insertAST = new ASTree(text);
        let parent: NodeA;
        if (stm.astNode?.parent)
            parent = stm.astNode.parent;
        else {
            if (!this.entry.astNode) {
                console.log("entry without astNode");
                process.exit();
            }
            parent = this.entry.astNode;
        }
        let insertPosition = -1;
        if (stm.astNode)
            insertPosition = parent.children.indexOf(stm.astNode);
        else
            insertPosition = parent.children.length;
        let stmAST = insertAST.root.children[0]
        parent.children.splice(insertPosition, 0, stmAST);
        stmAST.parent = parent;
        this.updateParentText(parent);
        return stmAST;

        // let insertStm=new StatementBuilder("StatementBuilder",text,insertAST.root.children[0],stm.scopeID);
        // insertStm.next=stm;
        // insertStm.lasts=stm.lasts;
        // for(let l of stm.lasts){
        //     if(l.type=="ifStatement"||l.type=="loopStatement"||l.type=="catchOrNot"){
        //         let cstm=l as ConditionStatementBuilder;
        //         if(cstm.nextT==stm)
        //             cstm.nextT=insertStm;
        //         if(cstm.nextF==stm)
        //             cstm.nextF=insertStm;
        //     }
        //     else if(l.type=="SwitchStatementBuilder"){
        //         let sstm=stm as SwitchStatementBuilder;
        //         for(let j in sstm.nexts){
        //             if(sstm.nexts[j]==stm){
        //                 sstm.nexts[j]=insertStm;
        //                 break;
        //             }
        //         }
        //     }
        //     else{
        //         if(l.next!=null)
        //             l.next=insertStm;
        //     }
        // }
        // stm.lasts=[insertStm];
    }

    removeStatement(stm: StatementBuilder) {
        let astNode = stm.astNode;
        if (astNode && astNode.parent) {
            astNode.parent.children.splice(astNode.parent.children.indexOf(astNode), 1);
            this.updateParentText(astNode.parent);
        }
    }

    // forOfIn2For(stm:ConditionStatementBuilder){
    //     if(!stm.astNode)
    //         return;
    //     let node=stm.astNode;
    //     let VariableDeclarationList=node.children[this.findChildIndex(node,"VariableDeclarationList")];
    //     let SyntaxList=VariableDeclarationList.children[this.findChildIndex(VariableDeclarationList,"SyntaxList")];
    //     let decl=SyntaxList.children[0].children[0].text;
    //     let array=node.children[this.findChildIndex(node,"Identifier")];
    // }

    getStatementByText(text: string) {
        const ret: StatementBuilder[] = [];
        for (let stm of this.statementArray) {
            if (stm.code.replace(/\s/g, '') == text.replace(/\s/g, '')) {
                ret.push(stm);
            }
        }
        return ret;
    }

    stm23AC(stm: StatementBuilder) {
        if (stm.addressCode3.length > 0) {
            if (stm.type.includes("loop") || stm.type.includes("if") || stm.type.includes("switch")) {
                let last3AC: NodeA = new NodeA(undefined, null, [], "temp", -1, "undefined");
                for (let i = 0; i < stm.addressCode3.length; i++) {
                    let ac = stm.addressCode3[i]
                    let temp = this.insertStatementBefore(stm, ac);
                    last3AC = temp;
                }
                if (!stm.astNode) {
                    console.log("stm without ast");
                    process.exit();
                }
                let block = stm.astNode.children[this.findChildIndex(stm.astNode, "Block")];
                block.parent = last3AC;
                last3AC.children[last3AC.children.length - 1] = block;
                this.updateParentText(last3AC);
                this.removeStatement(stm);
            }
            else {
                for (let i = 0; i < stm.addressCode3.length; i++) {
                    let ac = stm.addressCode3[i]
                    this.insertStatementBefore(stm, ac);
                }
                this.removeStatement(stm);
            }
        }
    }

    // simplifyByStm(stm:StatementBuilder){
    //     if(stm.walked)
    //         return;
    //     stm.walked=true;
    //     this.stm23AC(stm)
    //     if(stm.type=="ifStatement"||stm.type=="loopStatement"||stm.type=="catchOrNot"){
    //         let cstm=stm as ConditionStatementBuilder;
    //         if(cstm.nextT==null||cstm.nextF==null){
    //             this.errorTest(cstm);
    //             return;
    //         }
    //         this.simplifyByStm(cstm.nextF);
    //         this.simplifyByStm(cstm.nextT);
    //     }
    //     else if(stm.type=="SwitchStatementBuilder"){
    //         let sstm=stm as SwitchStatementBuilder;
    //         for(let j in sstm.nexts){
    //             this.simplifyByStm(sstm.nexts[j]);
    //         }
    //     }
    //     else{
    //         if(stm.next!=null)
    //             this.simplifyByStm(stm.next);
    //     }
    // }

    simplify() {
        for (let stm of this.statementArray) {
            this.stm23AC(stm)
        }
        // this.simplifyByStm(this.entry);
    }

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
                    // text+="    if !("+cstm.condition+") goto label"+cstm.nextF.block.id+'\n';
                    if (i == length - 1 && bi + 1 < this.blocks.length && this.blocks[bi + 1].id != cstm.nextT.block.id) {
                        let gotoStm = new StatementBuilder("gotoStatement", "goto label" + cstm.nextT.block.id, null, block.stms[0].scopeID);
                        block.stms.push(gotoStm);
                        length++;
                    }
                    // text+="    goto label"+cstm.nextT.block.id+'\n'
                }
                else if (stm.type == "breakStatement" || stm.type == "continueStatement") {
                    if (!stm.next?.block) {
                        this.errorTest(stm);
                        return;
                    }
                    stm.code = "goto label" + stm.next?.block.id;
                }
                else {
                    // text+="    "+block.stms[i].code+'\n';
                    if (i == length - 1 && stm.next?.block && (bi + 1 < this.blocks.length && this.blocks[bi + 1].id != stm.next.block.id || bi + 1 == this.blocks.length)) {
                        let gotoStm = new StatementBuilder("StatementBuilder", "goto label" + stm.next?.block.id, null, block.stms[0].scopeID);
                        block.stms.push(gotoStm);
                        length++;
                    }
                    // text+="    goto label"+stm.next?.block.id+'\n';
                }
                // text+="    "+stm.code+"\n";
                if (stm.addressCode3.length == 0) {
                    text += "    " + stm.code + "\n";
                }
                else {
                    for (let ac of stm.addressCode3) {
                        if (ac.startsWith("if") || ac.startsWith("while")) {
                            let cstm = stm as ConditionStatementBuilder;
                            let condition = ac.substring(ac.indexOf("("));
                            let goto = "";
                            if (cstm.nextF?.block)
                                goto = "if !" + condition + " goto label" + cstm.nextF?.block.id;
                            stm.addressCode3[stm.addressCode3.indexOf(ac)] = goto;
                            text += "    " + goto + "\n";
                        }
                        else
                            text += "    " + ac + "\n";
                    }
                }
                if (stm.type == "switchStatement") {
                    let sstm = stm as SwitchStatementBuilder;
                    for (let cas of sstm.cases) {
                        if (cas.stm.block)
                            text += "        " + cas.value + "goto label" + cas.stm.block.id + '\n';
                    }
                    if (sstm.default?.block)
                        text += "        default : goto label" + sstm.default?.block.id + '\n';
                }
            }

        }
        for (let cat of this.catches) {
            text += "catch " + cat.errorName + " from label " + cat.from + " to label " + cat.to + " with label" + cat.withLabel + "\n";
        }
        console.log(text);
        // text+='\n\n';
        // fs.appendFileSync('ac3texts.txt', text);
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
                    // console.log('loopStatement');
                    currStmtStrs.push(...iterationStmtToString(originStmt));
                } else if (originStmt.type == 'switchStatement') {
                    // console.log('switchStatement');
                    currStmtStrs.push(...switchStmtToString(originStmt));
                } else if (originStmt.type == 'breakStatement' || originStmt.type == 'continueStatement') {
                    currStmtStrs.push(...jumpStmtToString(originStmt));
                }
                else {
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
        console.log(functionBodyStr);

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
            let appendAfterIf = iterationStmt.astNode?.kind == "ForOfStatement" || iterationStmt.astNode?.kind == "ForInStatement";
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
        function switchStmtToString(originStmt: StatementBuilder): string[] {
            let switchStmt = originStmt as SwitchStatementBuilder;


            let identifierStr = switchStmt.astNode?.children[2].text;
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
        console.log('#### printThreeAddressStrs ####');
        for (const stmt of this.statementArray) {
            console.log('------ origin stmt: ', stmt.code);
            for (const threeAddressstr of stmt.addressCode3) {
                console.log(threeAddressstr);
            }
        }
    }

    public printThreeAddressStrsAndStmts() {
        // console.log('#### printThreeAddressStrsAndStmts ####');
        for (const stmt of this.statementArray) {
            if (stmt.astNode && stmt.code) {
                console.log('----- origin stmt: ', stmt.code);
                console.log('-- threeAddressStrs:');
                for (const threeAddressstr of stmt.addressCode3) {
                    console.log(threeAddressstr);
                }
                console.log('-- threeAddressStmts:');
                for (const threeAddressStmt of stmt.threeAddressStmts) {
                    console.log(threeAddressStmt);
                }
            }
        }
    }

    public printOriginStmts() {
        console.log('#### printOriginStmts ####');
        for (const stmt of this.statementArray) {
            console.log(stmt);
        }
    }

    buildCfgBuilder() {
        this.walkAST(this.entry, this.exit, this.astRoot);
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

    // TODO: Add more APIs to the class 'Cfg', and use these to build Cfg
    public buildOriginalCfg(): Cfg {
        let originalCfg = new Cfg();
        let blockBuilderToBlock = new Map<Block, BasicBlock>();
        let blockBuilderToSuccessor = new Map<Block, Block[]>();
        for (const blockBuilder of this.blocks) {
            let block = new BasicBlock();
            for (const stmtBuilder of blockBuilder.stms) {
                let originlStmt = new Stmt();
                originlStmt.setText(stmtBuilder.code);
                block.addStmt(originlStmt);
            }
            originalCfg.addBlock(block);

            // build the map
            blockBuilderToBlock.set(blockBuilder, block);
            let successors = new Array<Block>();
            let tail = blockBuilder.stms[blockBuilder.stms.length - 1];
            if (tail instanceof ConditionStatementBuilder) {
                let nextTBlockId = tail.nextT?.block?.id
                if (nextTBlockId) {
                    successors.push(this.blocks[nextTBlockId]);
                }
                let nextFBlockId = tail.nextF?.block?.id;
                if (nextFBlockId) {
                    successors.push(this.blocks[nextFBlockId]);
                }
            } else if (tail instanceof SwitchStatementBuilder) {
                for (const nxt of tail.nexts) {
                    let nextBlockId = nxt.block?.id;
                    if (nextBlockId) {
                        successors.push(this.blocks[nextBlockId]);
                    }
                }
            }
            blockBuilderToSuccessor.set(blockBuilder, successors);
        }

        // link block
        for (const [blockBuilder, block] of blockBuilderToBlock) {
            let successors = blockBuilderToSuccessor.get(blockBuilder) as Block[];
            for (let i = 0; i < successors.length; i++) {
                let successor = successors[i];
                block.setSuccessorBlock(i, blockBuilderToBlock.get(successor) as BasicBlock);
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
                    threeAddressStmt.setText(threeAddressStmt.toString());
                    threeAddressStmt.setOriginPositionInfo(stmtBuilder.line);
                    threeAddressStmt.setPositionInfo(stmtPos);
                    stmtPos++;
                    block.addStmt(threeAddressStmt);

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

    private getTypeNode(node: NodeA): string {
        let typeNode: NodeA
        for (let child of node.children) {
            // console.log(child.kind)
            switch (child.kind) {
                case "BooleanKeyword":
                case "NumberKeyword":
                case "StringKeyword":
                case "VoidKeyword":
                case "AnyKeyword":
                    return this.resolveKeywordType(child)
                case "ArrayType":
                    typeNode = child.children[0]
                    let typeKeyword: string
                    if (typeNode.kind == "TypeReference") {
                        typeKeyword = typeNode.children[0].text
                    } else {
                        typeKeyword = typeNode.text
                    }
                    return typeKeyword + "[]"
                case "TypeReference":
                    typeNode = child.children[0]
                    if (typeNode.kind == "Identifier") {
                        return typeNode.text
                    }
                    return ""
            }
        }
        return ""
    }

    private resolveKeywordType(node: NodeA): string {
        switch (node.kind) {
            case "BooleanKeyword":
                return "boolean"
            case "NumberKeyword":
            case "FirstLiteralToken":
                return "number"
            case "StringKeyword":
            case "StringLiteralToken":
                return "string"
            case "VoidKeyword":
                return "void"
            case "AnyKeyword":
                return "any"
            default:
                return ""
        }
    }
}