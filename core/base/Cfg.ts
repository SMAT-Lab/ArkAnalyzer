
/**
 * In this Cfg, every Stmt is represented as a node.
 */

import * as fs from 'fs';
import { NodeA, ASTree } from './Ast';
import { Statement, ConditionStatement, SwitchStatement } from "./Stmt";

export class CFG {
    name: string;
    astRoot: NodeA;
    entry: Statement;
    loopStack: ConditionStatement[];
    switchExitStack: Statement[];
    functions: CFG[];
    breakin: string;
    constructor(ast: NodeA, name: string) {
        this.name = name;
        this.astRoot = ast;
        this.entry = new Statement("entry", "");
        this.loopStack = [];
        this.switchExitStack = [];
        this.functions = [];
        this.breakin = ""
        this.buildCFG();
    }

    walkAST(lastStatement: Statement, nextStatement: Statement, node: NodeA) {
        function judgeLastType(s: Statement) {
            if (lastStatement.type == "ifStatement") {
                let lastIf = lastStatement as ConditionStatement;
                if (lastIf.nextT == null) {
                    lastIf.nextT = s;
                }
                else {
                    lastIf.nextF = s;
                }
            }
            else if (lastStatement.type == "loopStatement") {
                let lastLoop = lastStatement as ConditionStatement;
                lastLoop.nextT = s;
            }
            else if (lastStatement.type == "catchOrNot") {
                let lastLoop = lastStatement as ConditionStatement;
                lastLoop.nextT = s;
            }
            else
                lastStatement.next = s;
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


        for (let i = 0; i < node.children.length; i++) {
            let c = node.children[i];
            if (c.kind == "FirstStatement" || c.kind == "VariableStatement" || c.kind == "ExpressionStatement") {
                let block = checkBlock(c);
                if (block == null) {
                    let s = new Statement("statement", c.text);
                    judgeLastType(s);
                    lastStatement = s;
                }
                else {
                    let beginCode = c.text.substring(0, block.start - c.start);
                    let begin = new Statement("statement", beginCode);
                    judgeLastType(begin);
                    let end = new Statement("inBlockExit", "");
                    this.walkAST(begin, end, block.children[1]);
                    lastStatement = end;
                }
            }
            if (c.kind == "ReturnStatement") {
                let s = new Statement("statement", c.text);
                judgeLastType(s);
                lastStatement = s;
                break;
            }
            if (c.kind == "BreakStatement") {
                let brstm = new Statement("breakStatement", "break;");
                judgeLastType(brstm);
                if (this.breakin == "loop")
                    brstm.next = this.loopStack[this.loopStack.length - 1].nextF;
                if (this.breakin == "switch")
                    brstm.next = this.switchExitStack[this.switchExitStack.length - 1];
                lastStatement = brstm;
            }
            if (c.kind == "ContinueStatement") {
                let constm = new Statement("continueStatement", "continue;");
                judgeLastType(constm);
                constm.next = this.loopStack[this.loopStack.length - 1];
                lastStatement = constm;
            }
            if (c.kind == "IfStatement") {
                let ifstm: ConditionStatement = new ConditionStatement("ifStatement", "");
                judgeLastType(ifstm);
                let ifexit: Statement = new Statement("ifExit", "");
                let elsed: boolean = false;
                let expressionCondition = false;
                for (let j = 0; j < c.children.length; j++) {
                    let ifchild = c.children[j];
                    if (ifchild.kind == "BinaryExpression") {
                        expressionCondition = true;
                        ifstm.code = "if(" + ifchild.text + ")";
                    }
                    if ((ifchild.kind == "CloseParenToken" || ifchild.kind == "ElseKeyword") && c.children[j + 1].kind != "Block") {
                        let tempBlock = new NodeA(undefined, null, [], "undefined", 0);
                        tempBlock.kind = "Block";
                        tempBlock.text = "tempBlock";
                        let temp0 = new NodeA(undefined, null, [], "undefined", 0);
                        let temp1 = new NodeA(undefined, null, [c.children[j + 1]], "undefined", 0);
                        tempBlock.children = [temp0, temp1];
                        c.children[j + 1] = tempBlock;
                    }
                    if (ifchild.kind == "ElseKeyword")
                        elsed = true;
                    if (ifchild.kind == "Block") {
                        this.walkAST(ifstm, ifexit, ifchild.children[1])
                    }
                }
                if (!expressionCondition) {
                    for (let ifchild of c.children) {
                        if (ifchild.kind == "PrefixUnaryExpression" || ifchild.kind == "Identifier") {
                            ifstm.code = "if(" + ifchild.text + ")";
                            break;
                        }
                    }
                }
                if (!elsed) {
                    ifstm.nextF = ifexit;
                }
                lastStatement = ifexit;
            }
            if (c.kind == "WhileStatement") {
                this.breakin = "loop";
                let loopstm = new ConditionStatement("loopStatement", "");
                this.loopStack.push(loopstm);
                judgeLastType(loopstm);
                let loopExit = new Statement("loopExit", "");
                loopstm.nextF = loopExit;
                let expressionCondition = false;
                for (let j = 0; j < c.children.length; j++) {
                    let loopchild = c.children[j];
                    if (loopchild.kind == "BinaryExpression") {
                        expressionCondition = true;
                        loopstm.code = "while(" + loopchild.text + ")";
                    }
                    if ((loopchild.kind == "CloseParenToken") && c.children[j + 1].kind != "Block") {
                        let tempBlock = new NodeA(undefined, null, [], "undefined", 0);
                        tempBlock.kind = "Block";
                        tempBlock.text = "tempBlock";
                        let temp0 = new NodeA(undefined, null, [], "undefined", 0);
                        let temp1 = new NodeA(undefined, null, [c.children[j + 1]], "undefined", 0);
                        tempBlock.children = [temp0, temp1];
                        c.children[j + 1] = tempBlock;
                    }
                    if (loopchild.kind == "Block") {
                        this.walkAST(loopstm, loopstm, loopchild.children[1]);
                    }
                }
                if (!expressionCondition) {
                    for (let loopchild of c.children) {
                        if (loopchild.kind == "PrefixUnaryExpression" || loopchild.kind == "Identifier") {
                            loopstm.code = "while(" + loopchild.text + ")";
                            break;
                        }
                    }
                }
                lastStatement = loopExit;
                this.loopStack.pop();
            }
            if (c.kind == "ForStatement" || c.kind == "ForInStatement" || c.kind == "ForOfStatement") {
                this.breakin = "loop";
                let loopstm = new ConditionStatement("loopStatement", "");
                this.loopStack.push(loopstm);
                judgeLastType(loopstm);
                let loopExit = new Statement("loopExit", "");
                loopstm.nextF = loopExit;
                let code: string = "";
                for (let loopchild of c.children) {
                    if (loopchild.kind != "Block") {
                        code += loopchild.text;
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
                let loopstm = new ConditionStatement("loopStatement", "");
                this.loopStack.push(loopstm);
                let loopExit = new Statement("loopExit", "");
                loopstm.nextF = loopExit;
                let expressionCondition = false;
                for (let loopchild of c.children) {
                    if (loopchild.kind == "BinaryExpression") {
                        expressionCondition = true;
                        loopstm.code = "while(" + loopchild.text + ")";
                    }
                    if (loopchild.kind == "Block") {
                        this.walkAST(lastStatement, loopstm, loopchild.children[1]);
                    }
                }
                let lastType = lastStatement.type;
                if (lastType == "ifStatement" || lastType == "loopStatement") {
                    let lastCondition = lastStatement as ConditionStatement;
                    loopstm.nextT = lastCondition.nextT;
                }
                else {
                    loopstm.nextT = lastStatement.next;
                }
                if (!expressionCondition) {
                    for (let loopchild of c.children) {
                        if (loopchild.kind == "PrefixUnaryExpression" || loopchild.kind == "Identifier") {
                            loopstm.code = "while(" + loopchild.text + ")";
                            break;
                        }
                    }
                }
                lastStatement = loopExit;
                this.loopStack.pop();
            }
            if (c.kind == "SwitchStatement") {
                this.breakin = "switch";
                let switchstm = new SwitchStatement("switchStatement", "");
                judgeLastType(switchstm);
                let switchExit = new Statement("switchExit", "");
                this.switchExitStack.push(switchExit);
                for (let schild of c.children) {
                    if (schild.kind != "CaseBlock") {
                        switchstm.code += schild.text;
                    }
                    else {
                        let lastCaseExit: Statement | null = null;
                        let preCaseWords = "";
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
                                preCaseWords += caseWords + " "
                            }
                            else {
                                caseWords = preCaseWords + caseWords;
                                let casestm = new Statement("statement", caseWords);
                                switchstm.nexts.push(casestm);
                                let caseExit = new Statement("caseExit", "");
                                this.walkAST(casestm, caseExit, syntaxList);
                                if (lastCaseExit) {
                                    lastCaseExit.next = casestm.next;
                                }
                                if (j == schild.children[1].children.length - 1) {
                                    caseExit.next = switchExit;
                                }
                                else {
                                    lastCaseExit = caseExit;
                                }
                                preCaseWords = ""
                            }

                        }
                    }
                }
                lastStatement = switchExit;
                this.switchExitStack.pop();
            }
            if (c.kind == "Block") {
                let blockExit = new Statement("blockExit", "");
                this.walkAST(lastStatement, blockExit, c.children[1]);
                lastStatement = blockExit;
            }
            // if(c.kind=="FunctionDeclaration"){

            //     let fname="";
            //     let block:NodeA|null=null;
            //     for(let funchild of c.children){
            //         if(funchild.kind!="Block"){
            //             fname+=funchild.text+' ';
            //         }
            //         else{
            //             block=funchild;
            //             break;
            //         }
            //     }
            //     if(block==null){
            //         console.log("function without block");
            //         process.exit();
            //     }
            //     let funCFG=new CFG(block.children[1],fname);
            //     this.functions.push(funCFG);

            //     let funstm=new statement("statement",fname);
            //     judgeLastType(funstm);
            //     lastStatement=funstm;
            // }
            if (c.kind == "TryStatement") {
                let trystm = new Statement("statement", "try");
                judgeLastType(trystm);
                let tryExit = new Statement("tryExit", "");
                this.walkAST(trystm, tryExit, c.children[1].children[1]);
                lastStatement = tryExit;
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
                    }
                    if (trychild.kind == "FinallyKeyword") {
                        haveFinal = true;
                    }
                }
                if (catchClause) {
                    let catchOrNot = new ConditionStatement("catchOrNot", catchClause.children[0].text + catchClause.children[1].text + catchClause.children[2].text + catchClause.children[3].text);
                    judgeLastType(catchOrNot);
                    let catchExit = new Statement("catchExit", "");
                    catchOrNot.nextF = catchExit;
                    this.walkAST(catchOrNot, catchExit, catchClause.children[4].children[1]);
                    lastStatement = catchExit;
                }
                if (finalBlock) {
                    let final = new Statement("statement", "finally");
                    judgeLastType(final);
                    let finalExit = new Statement("finalExit", "");
                    this.walkAST(final, finalExit, finalBlock.children[1]);
                    lastStatement = finalExit;
                }
            }
            // if(c.kind=="ClassDeclaration"){
            //     let cname="";
            //     let syntaxList:NodeA|null=null;
            //     for(let child of c.children){
            //         if(child.kind=="Identifier")
            //             cname=child.text;
            //         if(child.kind=="SyntaxList")
            //             syntaxList=child;
            //     }
            //     if(syntaxList==null){
            //         console.log("class without syntaxlist");
            //         process.exit();
            //     }
            //     let cons:CFG|null=null;
            //     let methods:CFG[]=[];
            //     for(let child of syntaxList.children){
            //         if(child.kind=="MethodDeclaration"||child.kind=="Constructor"){
            //             let methodName="";
            //             let block:NodeA|null=null;
            //             for(let mechild of child.children){
            //                 if(mechild.kind!="Block"){
            //                     methodName+=mechild.text+' ';
            //                 }
            //                 else{
            //                     block=mechild;
            //                     break;
            //                 }
            //             }
            //             if(block==null){
            //                 console.log("method without block");
            //                 process.exit();
            //             }
            //             let methodCFG=new CFG(block.children[1],methodName);
            //             if(child.kind=="MethodDeclaration")
            //                 methods.push(methodCFG);
            //             else
            //                 cons=methodCFG;
            //         }
            //     }
            //     if(cons==null){
            //         console.log("class without constructor");
            //         process.exit();
            //     }
            //     let cl=new Class(cname,methods,cons);
            //     this.classes.push(cl);
            // }
            // if(c.kind=="StructDeclaration"){
            //     let cname="";
            //     let syntaxList:NodeA|null=null;
            //     for(let child of c.children){
            //         if(child.kind=="Identifier")
            //             cname=child.text;
            //         if(child.kind=="SyntaxList")
            //             syntaxList=child;
            //     }
            //     if(syntaxList==null){
            //         console.log("structor without syntaxlist");
            //         process.exit();
            //     }
            //     let build:CFG|null=null;
            //     let methods:CFG[]=[];
            //     for(let child of syntaxList.children){
            //         if(child.kind=="MethodDeclaration"||child.kind=="Build"){
            //             let methodName="";
            //             let block:NodeA|null=null;
            //             for(let mechild of child.children){
            //                 if(mechild.kind!="Block"){
            //                     methodName+=mechild.text+' ';
            //                 }
            //                 else{
            //                     block=mechild;
            //                     break;
            //                 }
            //             }
            //             if(block==null){
            //                 console.log("method without block");
            //                 process.exit();
            //             }
            //             let methodCFG=new CFG(block.children[1],methodName);
            //             if(child.kind=="MethodDeclaration")
            //                 methods.push(methodCFG);
            //             else
            //                 build=methodCFG;
            //         }
            //     }
            //     if(build==null){
            //         console.log("struct without build");
            //         process.exit();
            //     }
            //     let st=new Struct(cname,methods,build);
            //     this.structs.push(st);
            // }
        }
        if (lastStatement.type != "breakStatement" && lastStatement.type != "continueStatement")
            lastStatement.next = nextStatement;

    }

    deleteExit(stm: Statement) {
        if (stm.walked)
            return;
        stm.walked = true;
        if (stm.type == "ifStatement" || stm.type == "loopStatement" || stm.type == "catchOrNot") {
            let cstm = stm as ConditionStatement;
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
                console.log("ifnext error");
                process.exit();
            }
            this.deleteExit(cstm.nextT);
            this.deleteExit(cstm.nextF);
        }
        else if (stm.type == "switchStatement") {
            let sstm = stm as SwitchStatement;
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
            if (stm.next != null)
                this.deleteExit(stm.next);
        }
    }
    resetWalked(stm: Statement) {
        if (!stm.walked)
            return;
        stm.walked = false;
        if (stm.type == "ifStatement" || stm.type == "loopStatement" || stm.type == "catchOrNot") {
            let cstm = stm as ConditionStatement;
            if (cstm.nextT == null || cstm.nextF == null) {
                console.log("ifnext error");
                process.exit();
            }
            this.resetWalked(cstm.nextF);
            this.resetWalked(cstm.nextT);
        }
        else if (stm.type == "switchStatement") {
            let sstm = stm as SwitchStatement;
            for (let j in sstm.nexts) {
                this.resetWalked(sstm.nexts[j]);
            }
        }
        else {
            if (stm.next != null)
                this.resetWalked(stm.next);
        }

    }

    buildCFG() {
        const exit: Statement = new Statement("exit", "");
        this.walkAST(this.entry, exit, this.astRoot)
        this.deleteExit(this.entry);
        this.resetWalked(this.entry);
    }
}