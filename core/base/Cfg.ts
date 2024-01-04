
/**
 * In this Cfg, every Stmt is represented as a node.
 */

import { NodeA, ASTree } from './Ast';
import * as fs from 'fs';
import { exec } from 'child_process';
import { ArkClass } from '../ArkClass';
import exp from 'constants';
import { ArkAssignStmt, ArkInvokeStmt, Stmt } from './Stmt';
import { Local } from '../common/Local';
import { Value } from '../common/Value';
import { ArkFieldRef } from '../common/Ref';
import { ArkInvokeExpr, ArkNewExpr } from './Expr';


export class statement {
    type: string;
    //节点对应源代码    
    code: string;
    next: statement | null;
    lasts: statement[];
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
    threeAdressStmts: Stmt[];
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
        this.threeAdressStmts = [];
        this.haveCall = false;
        this.block = null;
        this.ifExitPass = false
    }
}

export class conditionStatement extends statement {
    nextT: statement | null;
    nextF: statement | null;
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

export class switchStatement extends statement {
    nexts: statement[];
    cases: Case[] = [];
    default: statement | null = null;
    constructor(type: string, code: string, astNode: NodeA, scopeID: number) {
        super(type, code, astNode, scopeID);
        this.nexts = [];
    }
}

export class tryStatement extends statement {
    tryFirst: statement | null = null;
    catchStatements: statement[];
    catchErrors: string[] = [];
    finallyStatement: statement | null = null;
    constructor(type: string, code: string, astNode: NodeA, scopeID: number) {
        super(type, code, astNode, scopeID);
        this.catchStatements = [];
    }
}

export class Case {
    value: string;
    stm: statement;
    constructor(value: string, stm: statement) {
        this.value = value;
        this.stm = stm;
    }
}

export class DefUseChain {
    def: statement;
    use: statement;
    constructor(def: statement, use: statement) {
        this.def = def;
        this.use = use;
    }
}

export class Variable {
    name: string;
    lastDef: statement;
    defUse: DefUseChain[];
    constructor(name: string, lastDef: statement) {
        this.name = name;
        this.lastDef = lastDef;
        this.defUse = [];
    }
}

export class Scope {
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

export class Block {
    id: number;
    stms: statement[];
    nexts: Block[];
    walked: boolean = false;
    loopStmt: statement | null;
    constructor(id: number, stms: statement[], nexts: Block[], loopStmt: statement | null) {
        this.id = id;
        this.stms = stms;
        this.nexts = nexts;
        this.loopStmt = loopStmt;
    }
}

export class Catch {
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

export class CFG {
    name: string;
    astRoot: NodeA;
    entry: statement;
    exit: statement;
    loopStack: conditionStatement[];
    switchExitStack: statement[];
    functions: CFG[];
    breakin: string;
    statementArray: statement[];
    dotEdges: number[][];
    scopes: Scope[];
    scopeLevel: number;
    tempVariableNum: number;
    current3ACstm: statement;
    blocks: Block[];
    entryBlock: Block;
    exitBlock: Block;
    currentDeclarationKeyword: string;
    variables: Variable[];
    declaringClass: ArkClass | null;
    importFromPath: string[];
    catches: Catch[];

    constructor(ast: NodeA, name: string | undefined, declaringClass: ArkClass | null) {
        if (name)
            this.name = name;
        else
            this.name = "undefined";
        this.astRoot = ast;
        this.declaringClass = declaringClass;
        this.entry = new statement("entry", "", ast, 0);
        this.loopStack = [];
        this.switchExitStack = [];
        this.functions = [];
        this.breakin = "";
        this.statementArray = [];
        this.dotEdges = [];
        this.exit = new statement("exit", "return;", null, 0);
        this.scopes = [];
        this.scopeLevel = 0;
        this.tempVariableNum = 0;
        this.current3ACstm = this.entry;
        this.blocks = [];
        this.entryBlock = new Block(this.blocks.length, [this.entry], [], null);
        // this.blocks.push(this.entryBlock);
        this.exitBlock = new Block(-1, [this.entry], [], null);
        this.currentDeclarationKeyword = "";
        this.variables = [];
        this.importFromPath = [];
        this.catches = [];
        this.buildCFG();
    }

    walkAST(lastStatement: statement, nextStatement: statement, node: NodeA) {
        function judgeLastType(s: statement) {
            if (lastStatement.type == "ifStatement") {
                let lastIf = lastStatement as conditionStatement;
                if (lastIf.nextT == null) {
                    lastIf.nextT = s;
                }
                else {
                    lastIf.nextF = s;
                }
            }
            else if (lastStatement.type == "loopStatement") {
                let lastLoop = lastStatement as conditionStatement;
                lastLoop.nextT = s;
            }
            else if (lastStatement.type == "catchOrNot") {
                let lastLoop = lastStatement as conditionStatement;
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

        for (let i = 0; i < node.children.length; i++) {
            let c = node.children[i];
            if (c.kind == "FirstStatement" || c.kind == "VariableStatement" || c.kind == "ExpressionStatement" || c.kind == "ThrowStatement") {
                if (c.kind == "FirstStatement" || c.kind == "VariableStatement") {
                    let declList = c.children[this.findChildIndex(c, "VariableDeclarationList")];
                    declList = declList.children[this.findChildIndex(declList, "SyntaxList")];
                    for (let decl of declList.children) {
                        scope.variable.add(decl.children[0]?.text);
                    }
                }
                let block = checkBlock(c);
                if (block == null) {
                    let s = new statement("statement", c.text, c, scope.id);
                    judgeLastType(s);
                    lastStatement = s;
                }
                else {
                    let beginCode = c.text.substring(0, block.start - c.start);
                    let begin = new statement("statement", beginCode, c, scope.id);
                    judgeLastType(begin);
                    let end = new statement("inBlockExit", "", c, scope.id);
                    this.walkAST(begin, end, block.children[1]);
                    lastStatement = end;
                }
            }
            if (c.kind == "ImportDeclaration") {
                let stm = new statement("statement", c.text, c, scope.id);
                judgeLastType(stm);
                lastStatement = stm;
                stm.astNode = c;
                let indexPath = this.findChildIndex(c, "FromKeyword") + 1;
                this.importFromPath.push(c.children[indexPath].text);
            }
            if (c.kind == "ReturnStatement") {
                let s = new statement("statement", c.text, c, scope.id);
                judgeLastType(s);
                s.astNode = c;
                lastStatement = s;
                break;
            }
            if (c.kind == "BreakStatement") {
                let brstm = new statement("breakStatement", "break;", c, scope.id);
                judgeLastType(brstm);
                let p: NodeA | null = c;
                while (p) {
                    if (p.kind.includes("While") || p.kind.includes("For")) {
                        brstm.next = this.loopStack[this.loopStack.length - 1].nextF;
                        break;
                    }
                    if (p.kind.includes("CaseClause")) {
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
                let constm = new statement("continueStatement", "continue;", c, scope.id);
                judgeLastType(constm);
                constm.next = this.loopStack[this.loopStack.length - 1];
                lastStatement = constm;
            }
            if (c.kind == "IfStatement") {
                let ifstm: conditionStatement = new conditionStatement("ifStatement", "", c, scope.id);
                judgeLastType(ifstm);
                let ifexit: statement = new statement("ifExit", "", c, scope.id);
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
                // if(!expressionCondition){
                //     for(let ifchild of c.children){
                //         if(ifchild.kind=="PrefixUnaryExpression"||ifchild.kind=="Identifier"||ifchild.kind=="PropertyAccessExpression"){
                //             ifstm.code="if("+ifchild.text+")";
                //             ifstm.condition=ifchild.text;
                //             break;
                //         }
                //     }
                // }
                if (!elsed) {
                    ifstm.nextF = ifexit;
                }
                lastStatement = ifexit;
            }
            if (c.kind == "WhileStatement") {
                this.breakin = "loop";
                let loopstm = new conditionStatement("loopStatement", "", c, scope.id);
                this.loopStack.push(loopstm);
                judgeLastType(loopstm);
                let loopExit = new statement("loopExit", "", c, scope.id);
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
            if (c.kind == "ForStatement" || c.kind == "ForInStatement" || c.kind == "ForOfStatement") {
                this.breakin = "loop";
                let loopstm = new conditionStatement("loopStatement", "", c, scope.id);
                this.loopStack.push(loopstm);
                judgeLastType(loopstm);
                let loopExit = new statement("loopExit", "", c, scope.id);
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
                lastStatement = loopExit;
                this.loopStack.pop();
            }
            if (c.kind == "DoStatement") {
                this.breakin = "loop";
                let loopstm = new conditionStatement("loopStatement", "", c, scope.id);
                this.loopStack.push(loopstm);
                let loopExit = new statement("loopExit", "", c, scope.id);
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
                    let lastCondition = lastStatement as conditionStatement;
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
                let switchstm = new switchStatement("switchStatement", "", c, scope.id);
                judgeLastType(switchstm);
                let switchExit = new statement("switchExit", "", null, scope.id);
                this.switchExitStack.push(switchExit);
                for (let schild of c.children) {
                    if (schild.kind != "CaseBlock") {
                        switchstm.code += schild.text;
                    }
                    else {
                        let lastCaseExit: statement | null = null;
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
                                let casestm = new statement("statement", caseWords, caseClause, scope.id);
                                switchstm.nexts.push(casestm);
                                let caseExit = new statement("caseExit", "", null, scope.id);
                                this.walkAST(casestm, caseExit, syntaxList);
                                for (let w of preCases) {
                                    if (casestm.next) {
                                        let cas = new Case(w, casestm.next);
                                        switchstm.cases.push(cas);
                                    }
                                }
                                if (casestm.next) {
                                    if (thisCase[0] == "c") {
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
                let blockExit = new statement("blockExit", "", c, scope.id);
                this.walkAST(lastStatement, blockExit, c.children[1]);
                lastStatement = blockExit;
            }
            if (c.kind == "TryStatement") {
                let trystm = new tryStatement("tryStatement", "try", c, scope.id);
                judgeLastType(trystm);
                let tryExit = new statement("try exit", "", c, scope.id);
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
                        let catchOrNot = new conditionStatement("catchOrNot", text, c, scope.id);
                        // judgeLastType(catchOrNot);
                        let catchExit = new statement("catch exit", "", c, scope.id);
                        catchOrNot.nextF = catchExit;
                        let block = catchClause.children[this.findChildIndex(catchClause, "Block")];
                        this.walkAST(catchOrNot, catchExit, block.children[1]);
                        if (!catchOrNot.nextT) {
                            catchOrNot.nextT = catchExit;
                        }
                        // lastStatement=catchExit;

                        trystm.catchStatements.push(catchOrNot.nextT);
                        let VD = catchClause.children[this.findChildIndex(catchClause, "VariableDeclaration")];
                        let error = VD.children[this.findChildIndex(VD, "TypeReference")];
                        if (error) {
                            trystm.catchErrors.push(error.text);
                        }
                        else {
                            trystm.catchErrors.push("Error");
                        }
                    }
                    if (trychild.kind == "FinallyKeyword") {
                        haveFinal = true;
                    }
                }
                if (finalBlock) {
                    let final = new statement("statement", "finally", c, scope.id);
                    // judgeLastType(final);
                    let finalExit = new statement("finally exit", "", c, scope.id);
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

    deleteExit(stm: statement) {
        if (stm.walked)
            return;
        stm.walked = true;
        if (stm.type == "ifStatement" || stm.type == "loopStatement" || stm.type == "catchOrNot") {
            let cstm = stm as conditionStatement;
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
                this.errorIf(cstm);
                return;
            }
            this.deleteExit(cstm.nextT);
            this.deleteExit(cstm.nextF);
        }
        else if (stm.type == "switchStatement") {
            let sstm = stm as switchStatement;
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
        }
        else if (stm.type == "tryStatement") {
            let trystm = stm as tryStatement;
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

    buildBlocks(stm: statement, block: Block) {
        if (stm.type.includes(" exit") || stm.walked)
            return;
        stm.walked = true;
        if (stm.type == "entry") {
            let b = new Block(this.blocks.length, [], [], null);
            this.blocks.push(b);
            block.nexts.push(b);
            if (stm.next != null)
                this.buildBlocks(stm.next, b);
            return;
        }
        if (stm.type != "loopStatement" && stm.type != "SwitchStatement" && stm.type != "tryStatement") {
            block.stms.push(stm);
            stm.block = block;
        }
        if (stm.type == "ifStatement" || stm.type == "loopStatement" || stm.type == "catchOrNot") {
            let cstm = stm as conditionStatement;
            if (cstm.nextT == null || cstm.nextF == null) {
                this.errorIf(cstm);
                return;
            }
            // this.blocks=this.blocks.filter((b)=>b.stms.length!=0);
            let b2: Block;
            if (cstm.type == "loopStatement") {
                this.blocks = this.blocks.filter((b) => b.stms.length != 0);
                let loopBlock = new Block(this.blocks.length, [cstm], [], null);
                this.blocks.push(loopBlock);
                block.nexts.push(loopBlock);
                block = loopBlock;
                cstm.block = block;
            }
            this.buildBlocks(cstm.nextT, block);
            this.blocks = this.blocks.filter((b) => b.stms.length != 0);
            b2 = new Block(this.blocks.length, [], [], null);
            this.blocks.push(b2);
            block.nexts.push(b2);
            this.buildBlocks(cstm.nextF, b2);
        }
        else if (stm.type == "switchStatement") {
            let sstm = stm as switchStatement;
            for (let j in sstm.nexts) {
                let sn: statement | null = sstm.nexts[j].next;
                this.blocks = this.blocks.filter((b) => b.stms.length != 0);
                let b = new Block(this.blocks.length, [], [], null);
                this.blocks.push(b);
                block.nexts.push(b);
                if (sn)
                    this.buildBlocks(sn, b);
            }
        }
        else if (stm.type == "tryStatement") {
            let trystm = stm as tryStatement;
            if (!trystm.tryFirst) {
                console.log("try without tryFirst");
                process.exit();
            }
            this.blocks = this.blocks.filter((b) => b.stms.length != 0);
            let tryFirstBlock = new Block(this.blocks.length, [], [], null);
            this.blocks.push(tryFirstBlock);
            // block.nexts.push(tryFirstBlock);
            this.buildBlocks(trystm.tryFirst, tryFirstBlock);

            this.blocks = this.blocks.filter((b) => b.stms.length != 0);
            let finallyBlock = new Block(this.blocks.length, [], [], null);
            this.blocks.push(finallyBlock);
            // block.nexts.push(afterTry);
            if (trystm.finallyStatement) {
                this.buildBlocks(trystm.finallyStatement, finallyBlock);
                // let stm=new statement("gotoStatement","goto label"+finallyBlock.id,null,tryFirstBlock.stms[0].scopeID);
                // tryFirstBlock.stms.push(stm);
            }
            else {
                let stm = new statement("tmp", "", null, -1);
                finallyBlock.stms = [stm];
            }
            // let catchBlocks:Block[]=[];
            for (let i = 0; i < trystm.catchStatements.length; i++) {
                this.blocks = this.blocks.filter((b) => b.stms.length != 0);
                let b = new Block(this.blocks.length, [], [], null);
                this.blocks.push(b);
                this.buildBlocks(trystm.catchStatements[i], b);
                // if(trystm.finallyStatement){
                //     let stm=new statement("gotoStatement","goto label"+finallyBlock.id,null,tryFirstBlock.stms[0].scopeID);
                //     b.stms.push(stm);
                // }
                this.catches.push(new Catch(trystm.catchErrors[i], tryFirstBlock.id, finallyBlock.id, b.id));
            }
            if (trystm.finallyStatement) {
                this.resetWalkedPartial(trystm.finallyStatement);
                this.blocks = this.blocks.filter((b) => b.stms.length != 0);
                let errorFinallyBlock = new Block(this.blocks.length, [], [], null);
                this.blocks.push(errorFinallyBlock);
                for (let stm of finallyBlock.stms) {
                    errorFinallyBlock.stms.push(stm);
                }
                let stm = new statement("Statement", "throw Error", null, trystm.finallyStatement.scopeID);
                errorFinallyBlock.stms.push(stm);
                this.catches.push(new Catch("Error", tryFirstBlock.id, finallyBlock.id, errorFinallyBlock.id));
                for (let i = 0; i < trystm.catchStatements.length; i++) {
                    let block = trystm.catchStatements[i].block
                    if (!block) {
                        console.log("catch without block");
                        process.exit();
                    }
                    this.catches.push(new Catch(trystm.catchErrors[i], block.id, finallyBlock.id, errorFinallyBlock.id));
                    let goto = new statement("gotoStatement", "goto label" + finallyBlock.id, null, finallyBlock.stms[0].scopeID);
                    block.stms.push(goto);
                }
            }
            this.blocks = this.blocks.filter((b) => b.stms.length != 0);
            let nextBlock = new Block(this.blocks.length, [], [], null);
            this.blocks.push(nextBlock);
            block.nexts.push(nextBlock);
            if (trystm.next)
                this.buildBlocks(trystm.next, nextBlock);
            let goto = new statement("gotoStatement", "goto label" + nextBlock.id, null, tryFirstBlock.stms[0].scopeID);
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
                    block.nexts.push(stm.next.block);
                    return;
                }
                if (stm.next.type == "loopStatement" && stm.next.block) {
                    block.nexts.push(stm.next.block);
                    block = stm.next.block;
                    return;
                }

                stm.next.passTmies++;
                if (stm.next.passTmies == stm.next.lasts.length || stm.next.type == "loopStatement") {
                    if (stm.next.scopeID != stm.scopeID) {
                        this.blocks = this.blocks.filter((b) => b.stms.length != 0);
                        let b = new Block(this.blocks.length, [], [], null);
                        this.blocks.push(b);
                        block.nexts.push(b);
                        block = b;
                    }
                    this.buildBlocks(stm.next, block);
                }
            }


            // if(stm.next?.type.includes("Exit")){
            //     let p=stm.next;
            //     let ifExitStop=false;
            //     while(p.type.includes("Exit")){
            //         if(p.type=="ifExit"){
            //             if(!p.ifExitPass&&p.lasts.length>1){
            //                 ifExitStop=true;
            //                 p.ifExitPass=true;
            //             }
            //         }
            //         if(p.next==null){
            //             console.log("error exit");
            //             process.exit();
            //         }
            //         p=p.next;
            //     }
            //     stm.next=p;
            //     if(ifExitStop||stm.type=="breakStatement"||stm.type=="continueStatement")
            //         return;
            //     // this.blocks=this.blocks.filter((b)=>b.stms.length!=0);
            //     let b=new Block(this.blocks.length,[],[],null);
            //     this.blocks.push(b);
            //     block.nexts.push(b);
            //     block=b;
            // }
            // if(stm.next!=null){
            //     if(stm.type=="continueStatement"&&stm.next.block){
            //         block.nexts.push(stm.next.block);
            //         return;
            //     }
            //     if(stm.next.type=="loopStatement"&&stm.next.block){
            //         block.nexts.push(stm.next.block);
            //         block=stm.next.block;
            //     }
            //     stm.passTmies++;
            //     if(stm.passTmies==stm.lasts.length)
            //         this.buildBlocks(stm.next,block);

            // }
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

    buildLastAndHaveCall(stm: statement) {
        if (stm.walked)
            return;
        stm.walked = true;
        if (stm.astNode) {
            stm.haveCall = this.nodeHaveCall(stm.astNode);
            stm.line = stm.astNode.line;
        }

        if (stm.type == "ifStatement" || stm.type == "loopStatement" || stm.type == "catchOrNot") {
            let cstm = stm as conditionStatement;
            if (cstm.nextT == null || cstm.nextF == null) {
                this.errorIf(cstm);
                return;
            }
            cstm.nextT.lasts.push(cstm);
            cstm.nextF.lasts.push(cstm);
            this.buildLastAndHaveCall(cstm.nextT);
            this.buildLastAndHaveCall(cstm.nextF);
        }
        else if (stm.type == "switchStatement") {
            let sstm = stm as switchStatement;
            for (let s of sstm.nexts) {
                s.lasts.push(sstm);
                this.buildLastAndHaveCall(s);
            }
        }
        else if (stm.type == "tryStatement") {
            let trystm = stm as tryStatement;
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
    resetWalkedPartial(stm: statement) {
        // for(let stm of this.statementArray){
        //     stm.walked=false;
        // }
        if (!stm.walked)
            return;
        stm.walked = false;
        if (stm.type == "ifStatement" || stm.type == "loopStatement" || stm.type == "catchOrNot") {
            let cstm = stm as conditionStatement;
            if (cstm.nextT == null || cstm.nextF == null) {
                this.errorIf(cstm);
                return;
            }
            this.resetWalkedPartial(cstm.nextF);
            this.resetWalkedPartial(cstm.nextT);
        }
        else if (stm.type == "switchStatement") {
            let sstm = stm as switchStatement;
            for (let j in sstm.nexts) {
                this.resetWalkedPartial(sstm.nexts[j]);
            }
        }
        else if (stm.type == "tryStatement") {
            let trystm = stm as tryStatement;
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

    resetWalkedBlock(block: Block) {
        if (!block.walked)
            return;
        block.walked = true;
        for (let bn of block.nexts) {
            this.resetWalkedBlock(bn);
        }
    }

    cfg2Array(stm: statement) {

        if (!stm.walked)
            return;
        stm.walked = false;
        stm.index = this.statementArray.length;
        if (!stm.type.includes(" exit"))
            this.statementArray.push(stm);
        if (stm.type == "ifStatement" || stm.type == "loopStatement" || stm.type == "catchOrNot") {
            let cstm = stm as conditionStatement;
            if (cstm.nextT == null || cstm.nextF == null) {
                this.errorIf(cstm);
                return;
            }
            this.cfg2Array(cstm.nextF);
            this.cfg2Array(cstm.nextT);
        }
        else if (stm.type == "switchStatement") {
            let sstm = stm as switchStatement;
            for (let ss of sstm.nexts) {
                this.cfg2Array(ss);
            }
        }
        else if (stm.type == "tryStatement") {
            let trystm = stm as tryStatement;
            if (trystm.tryFirst) {
                this.cfg2Array(trystm.tryFirst);
            }
            for (let cat of trystm.catchStatements) {
                this.cfg2Array(cat);
            }
            if (trystm.finallyStatement) {
                this.cfg2Array(trystm.finallyStatement);
            }
        }
        else {
            if (stm.next != null)
                this.cfg2Array(stm.next);
        }
    }

    // buildBlocks2(){
    //     for(let stm of this.statementArray){
    //         if(stm.type.includes("Exit")){
    //             this.statementArray.splice(this.statementArray.indexOf(stm),1);
    //         }
    //         if(stm.type=="switchStatement"){
    //             let sstm=stm as switchStatement;
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

    getDotEdges(stm: statement) {
        if (this.statementArray.length == 0)
            this.cfg2Array(this.entry);
        if (stm.walked)
            return;
        stm.walked = true;
        if (stm.type == "ifStatement" || stm.type == "loopStatement" || stm.type == "catchOrNot") {
            let cstm = stm as conditionStatement;
            if (cstm.nextT == null || cstm.nextF == null) {
                this.errorIf(cstm);
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
            let sstm = stm as switchStatement;
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

    dfsUseDef(stm: statement, node: NodeA, mode: string) {
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
                        for (let v of this.variables) {
                            if (v.name == node.text) {
                                set.add(v);
                                let chain = new DefUseChain(v.lastDef, stm);
                                v.defUse.push(chain);
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

        // if(stm.type=="ifStatement"||stm.type=="loopStatement"||stm.type=="catchOrNot"){
        //     let cstm=stm as conditionStatement;
        //     if(cstm.nextT==null||cstm.nextF==null){
        //         this.errorIf(cstm);
        //         return;
        //     }
        //     this.generateUseDef(cstm.nextF);
        //     this.generateUseDef(cstm.nextT);
        // }
        // else if(stm.type=="switchStatement"){
        //     let sstm=stm as switchStatement;
        //     for(let j in sstm.nexts){
        //         this.generateUseDef(sstm.nexts[j]);
        //     }
        // }
        // else{
        //     if(stm.next!=null)
        //         this.generateUseDef(stm.next);
        // }

    }

    ac3(node: NodeA, tempV: number, begin: boolean) {
        if (node.kind == "Block")
            return;
        let threeAdressStmt: any;
        let simpleStm: string = "let temp" + tempV + "=";
        if (begin) {
            simpleStm = this.currentDeclarationKeyword;
        }

        if (node.children.length == 1 || node.children.length == 2 && node.children[1].text == ";") {
            this.ac3(node.children[0], tempV, begin);
            return;
        }
        if (node.kind == "BinaryExpression" && node.children[1].kind == "FirstAssignment") {
            let leftOpNames: string[] = [];
            if (node.children[0].children.length > 0) {
                for (let i = 0; i < node.children[0].children.length; i++) {
                    let child = node.children[0].children[i];
                    if (i == 0 || i == 2) {
                        if (child.children.length > 0) {
                            simpleStm += "temp" + this.tempVariableNum;
                            leftOpNames.push("temp" + this.tempVariableNum);
                            this.ac3(child, this.tempVariableNum++, false);
                        }
                        else {
                            simpleStm += child.text;
                            leftOpNames.push(child.text);
                        }
                    }
                    else {
                        simpleStm += child.text;
                        leftOpNames.push(child.text);
                    }
                }
            }
            else {
                simpleStm += node.children[0].text;
                leftOpNames.push(node.children[0].text);
            }

            let leftOp: any;
            if (leftOpNames.length > 1) {
                leftOp = new ArkFieldRef(new Local(leftOpNames.join('')));
            } else {
                leftOp = new Local(leftOpNames[0]);
            }


            simpleStm += "=";
            let rightOp: Local;
            if (node.children[2].children.length > 0) {
                simpleStm += "temp" + this.tempVariableNum;
                rightOp = new Local("temp" + this.tempVariableNum);
                this.ac3(node.children[2], this.tempVariableNum++, false);
            }
            else {
                simpleStm += node.children[2].text;
                rightOp = new Local(node.children[2].text);
            }
            simpleStm += ";"
            threeAdressStmt = new ArkAssignStmt(leftOp, rightOp);
        }
        else if (node.kind == "CallExpression" || node.kind == "NewExpression") {
            let leftOp = new Local("temp" + tempV);

            let rigtOpNames: string[] = [];
            if (node.kind == "CallExpression") {
                if (node.children[0].children[0]?.children.length > 0)
                    simpleStm += "temp" + this.tempVariableNum;
                let propertyAccessExpression = node.children[0];
                // this.ac3(propertyAccessExpression,this.tempVariableNum++);
                if (propertyAccessExpression.children.length == 0) {
                    simpleStm += propertyAccessExpression.text;
                    rigtOpNames.push(propertyAccessExpression.text);
                }
                for (let i = 0; i < propertyAccessExpression.children.length; i++) {
                    let cc = propertyAccessExpression.children[i];
                    if (i == 0 && cc.children.length > 0) {
                        rigtOpNames.push("temp" + this.tempVariableNum);
                        this.ac3(cc, this.tempVariableNum++, false);
                    }
                    else {
                        simpleStm += cc.text;
                        rigtOpNames.push(cc.text);
                    }
                }
            }
            else {
                if (node.children[1].children.length == 0) {
                    simpleStm += "new " + node.children[this.findChildIndex(node, "Identifier")].text;
                    rigtOpNames.push(node.children[this.findChildIndex(node, "Identifier")].text);
                }
                else {
                    simpleStm += "new temp" + this.tempVariableNum;
                    rigtOpNames.push("temp" + this.tempVariableNum);
                    this.ac3(node.children[1], this.tempVariableNum++, false);
                }
            }
            simpleStm += "(";

            let args: Value[] = [];
            let params = node.children[this.findChildIndex(node, "SyntaxList")];
            for (let param of params.children) {
                if (param.children.length < 2)
                    simpleStm += param.text;
                else {
                    simpleStm += "temp" + this.tempVariableNum;
                    this.ac3(param, this.tempVariableNum++, false);
                }

                if (param.kind != 'CommaToken') {
                    args.push(new Local(param.text));
                }
            }
            simpleStm += ")";
            // for(let i=1;i<node.children.length;i++){
            //     simpleStm+=node.children[i].text;
            // }

            let rightOp: any;
            if (node.kind == "CallExpression") {
                let methodSignature = rigtOpNames.join('');
                rightOp = new ArkInvokeExpr(methodSignature, args);
                threeAdressStmt = new ArkAssignStmt(leftOp, rightOp);
            } else {
                let classSignature = rigtOpNames.join('');                
                threeAdressStmt = new ArkAssignStmt(leftOp, new ArkNewExpr(classSignature));
                this.current3ACstm.threeAdressStmts.push(threeAdressStmt);

                let methodSignature = 'constructor';
                threeAdressStmt = new ArkInvokeStmt(new ArkInvokeExpr(methodSignature, args));
            }


        }
        else {
            let leftOp = new Local("temp" + tempV);
            let rightOpName = '';
            for (let child of node.children) {
                if (child.kind == "PropertyAccessExpression" || child.kind == "BinaryExpression" || child.kind == "CallExpression" || node.kind == "NewExpression" || child.kind == "ElementAccessExpression" || child.kind == "ConditionalExpression") {
                    if (child.kind == "CallExpression" && node.children.length < 3) {
                        this.ac3(child, this.tempVariableNum++, false);
                        return;
                    }
                    simpleStm += "temp" + this.tempVariableNum;
                    rightOpName += "temp" + this.tempVariableNum;
                    this.ac3(child, this.tempVariableNum++, false);
                }
                else if (child.kind == "ParenthesizedExpression") {
                    simpleStm += "temp" + this.tempVariableNum;
                    this.ac3(child.children[1], this.tempVariableNum++, false);
                }
                else {
                    if (child.kind != "Block") {
                        if (child.kind.includes("Keyword")) {
                            simpleStm += " " + child.text + " ";
                        }
                        else
                            simpleStm += child.text;
                        rightOpName += child.text;
                    }
                }
            }

            let rightOp: any;
            if (node.kind == 'PropertyAccessExpression') {
                rightOp = new ArkFieldRef(new Local(rightOpName));
            }
            threeAdressStmt = new ArkAssignStmt(leftOp, rightOp);
        }
        if (simpleStm[simpleStm.length - 1] != ")")
            simpleStm += ";";
        this.current3ACstm.addressCode3.push(simpleStm);
        this.current3ACstm.threeAdressStmts.push(threeAdressStmt);
    }

    getNumOfIdentifier(node: NodeA, stm: statement) {
        if (node.kind == "Identifier")
            stm.numOfIdentifier++;
        for (let child of node.children)
            this.getNumOfIdentifier(child, stm);
    }

    get3AddressCode() {
        // if(stm.walked)return;
        // stm.walked = true;
        for (let stm of this.statementArray) {
            if (stm.astNode && stm.code != "") {
                let node: NodeA = stm.astNode;
                if (stm.type == "ifStatement" || stm.type == "loopStatement" || stm.type == "catchOrNot") {
                    node = node.children[this.findChildIndex(node, "OpenParenToken") + 1]
                }
                this.getNumOfIdentifier(node, stm);
                if (stm.numOfIdentifier > 2) {
                    this.current3ACstm = stm;
                    if (stm.astNode.kind == "FirstStatement") {
                        let declList = stm.astNode.children[this.findChildIndex(stm.astNode, "VariableDeclarationList")];
                        this.currentDeclarationKeyword = declList.children[0].text + " ";
                        let decls = declList.children[this.findChildIndex(declList, "SyntaxList")];
                        for (let decl of decls.children) {
                            this.ac3(decl, this.tempVariableNum++, true);
                        }
                    }
                    else {
                        this.currentDeclarationKeyword = "";
                        this.ac3(stm.astNode, this.tempVariableNum++, true);
                    }
                }

            }
            // if (stm.addressCode3.length < 3) {
            //     stm.addressCode3 = [];
            // }
        }
        // if(stm.type=="ifStatement"||stm.type=="loopStatement"||stm.type=="catchOrNot"){
        //     let cstm=stm as conditionStatement;
        //     if(cstm.nextT==null||cstm.nextF==null){
        //         this.errorIf(cstm);
        //         return;
        //     }
        //     this.get3AddressCode(cstm.nextF);
        //     this.get3AddressCode(cstm.nextT);
        // }
        // else if(stm.type=="switchStatement"){
        //     let sstm=stm as switchStatement;
        //     for(let j in sstm.nexts){
        //         this.get3AddressCode(sstm.nexts[j]);
        //     }
        // }
        // else{
        //     if(stm.next!=null)
        //         this.get3AddressCode(stm.next);
        // }
    }


    errorIf(stm: statement) {
        console.log("ifnext error");
        console.log(stm)
        process.exit();
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

    public insertStatementAfter(stm: statement, text: string): NodeA {
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

        // let insertStm=new statement("statement",text,insertAST.root.children[0],stm.scopeID);
        // insertStm.next=stm.next;
        // insertStm.lasts.push(stm);
        // stm.next=insertStm;
        // if(!insertStm.next)
        //     return;
        // insertStm.next.lasts[insertStm.next.lasts.indexOf(stm)]=insertStm;
    }

    public insertStatementBefore(stm: statement, text: string): NodeA {
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

        // let insertStm=new statement("statement",text,insertAST.root.children[0],stm.scopeID);
        // insertStm.next=stm;
        // insertStm.lasts=stm.lasts;
        // for(let l of stm.lasts){
        //     if(l.type=="ifStatement"||l.type=="loopStatement"||l.type=="catchOrNot"){
        //         let cstm=l as conditionStatement;
        //         if(cstm.nextT==stm)
        //             cstm.nextT=insertStm;
        //         if(cstm.nextF==stm)
        //             cstm.nextF=insertStm;
        //     }
        //     else if(l.type=="switchStatement"){
        //         let sstm=stm as switchStatement;
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

    removeStatement(stm: statement) {
        let astNode = stm.astNode;
        if (astNode && astNode.parent) {
            astNode.parent.children.splice(astNode.parent.children.indexOf(astNode), 1);
            this.updateParentText(astNode.parent);
        }
    }

    // forOfIn2For(stm:conditionStatement){
    //     if(!stm.astNode)
    //         return;
    //     let node=stm.astNode;
    //     let VariableDeclarationList=node.children[this.findChildIndex(node,"VariableDeclarationList")];
    //     let SyntaxList=VariableDeclarationList.children[this.findChildIndex(VariableDeclarationList,"SyntaxList")];
    //     let decl=SyntaxList.children[0].children[0].text;
    //     let array=node.children[this.findChildIndex(node,"Identifier")];
    // }

    getStatementByText(text: string) {
        const ret: statement[] = [];
        for (let stm of this.statementArray) {
            if (stm.code.replace(/\s/g, '') == text.replace(/\s/g, '')) {
                ret.push(stm);
            }
        }
        return ret;
    }

    stm23AC(stm: statement) {
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

    // simplifyByStm(stm:statement){
    //     if(stm.walked)
    //         return;
    //     stm.walked=true;
    //     this.stm23AC(stm)
    //     if(stm.type=="ifStatement"||stm.type=="loopStatement"||stm.type=="catchOrNot"){
    //         let cstm=stm as conditionStatement;
    //         if(cstm.nextT==null||cstm.nextF==null){
    //             this.errorIf(cstm);
    //             return;
    //         }
    //         this.simplifyByStm(cstm.nextF);
    //         this.simplifyByStm(cstm.nextT);
    //     }
    //     else if(stm.type=="switchStatement"){
    //         let sstm=stm as switchStatement;
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
        for (let bi = 0; bi < this.blocks.length; bi++) {
            let block = this.blocks[bi];
            if (bi != 0)
                text += "label" + block.id + ":\n";
            let length = block.stms.length
            for (let i = 0; i < length; i++) {
                let stm = block.stms[i];
                if (stm.type == "ifStatement" || stm.type == "loopStatement" || stm.type == "catchOrNot") {
                    let cstm = stm as conditionStatement;
                    if (cstm.nextT == null || cstm.nextF == null) {
                        this.errorIf(cstm);
                        return;
                    }
                    if (!cstm.nextF.block || !cstm.nextT.block) {
                        console.log("nextF without block");
                        process.exit();
                    }
                    stm.code = "if !(" + cstm.condition + ") goto label" + cstm.nextF.block.id
                    // text+="    if !("+cstm.condition+") goto label"+cstm.nextF.block.id+'\n';
                    if (i == length - 1 && bi + 1 < this.blocks.length && this.blocks[bi + 1].id != cstm.nextT.block.id) {
                        let gotoStm = new statement("gotoStatement", "goto label" + cstm.nextT.block.id, null, block.stms[0].scopeID);
                        block.stms.push(gotoStm);
                        length++;
                    }
                    // text+="    goto label"+cstm.nextT.block.id+'\n'
                }
                else if (stm.type == "breakStatement" || stm.type == "continueStatement") {
                    if (!stm.next?.block) {
                        console.log("break/continue without block");
                        process.exit();
                    }
                    stm.code = "goto label" + stm.next?.block.id;
                }
                else {
                    // text+="    "+block.stms[i].code+'\n';
                    if (i == length - 1 && stm.next?.block && (bi + 1 < this.blocks.length && this.blocks[bi + 1].id != stm.next.block.id || bi + 1 == this.blocks.length)) {
                        let gotoStm = new statement("statement", "goto label" + stm.next?.block.id, null, block.stms[0].scopeID);
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
                        if (ac.includes("if") || ac.includes("while")) {
                            let cstm = stm as conditionStatement;
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
                    let sstm = stm as switchStatement;
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
    }

    public printThreeAddressStmts() {
        console.log('----- printThreeAddressStmts -----');
        for (const stmt of this.statementArray) {
            for (const threeAddressStmt of stmt.threeAdressStmts) {
                console.log(threeAddressStmt);
            }
        }
    }

    public printThreeAddressStrs() {
        console.log('----- printThreeAddressStrs -----');
        for (const stmt of this.statementArray) {
            for (const threeAddressstr of stmt.addressCode3) {
                console.log(threeAddressstr);
            }
        }
    }

    buildCFG() {
        this.walkAST(this.entry, this.exit, this.astRoot);
        this.deleteExit(this.entry);
        this.cfg2Array(this.entry);
        this.resetWalked();
        this.buildLastAndHaveCall(this.entry);
        this.resetWalked();
        this.buildBlocks(this.entry, this.entryBlock);
        this.blocks = this.blocks.filter((b) => b.stms.length != 0);
        this.resetWalked();
        this.generateUseDef();
        this.resetWalked();
        this.get3AddressCode();
    }
}