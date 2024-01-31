import path from "path";
import { isPrimaryType } from "../../utils/typeReferenceUtils";
import { Constant } from "../base/Constant";
import { DefUseChain } from "../base/DefUseChain";
import { ArkBinopExpr, ArkCastExpr, ArkNewExpr, ArkStaticInvokeExpr } from "../base/Expr";
import { Local } from "../base/Local";
import { ArkInstanceFieldRef, ArkParameterRef } from "../base/Ref";
import { ArkAssignStmt, Stmt } from "../base/Stmt";
import { ArkClass } from "../model/ArkClass";
import { ArkFile } from "../model/ArkFile";
import { BasicBlock } from "./BasicBlock";

export class Cfg {
    private blocks: Set<BasicBlock> = new Set();
    private stmtToBlock: Map<Stmt, BasicBlock> = new Map();
    private startingStmt: Stmt = new Stmt();

    private defUseChains: DefUseChain[] = [];
    declaringClass: ArkClass;

    constructor() {

    }

    public getStmts(): Stmt[] {
        let stmts = new Array<Stmt>();
        for (const block of this.blocks) {
            stmts.push(...block.getStmts());
        }
        return stmts;
    }

    // TODO
    public insertBefore(beforeStmt: Stmt, newStmt: Stmt): void {
        const block = this.stmtToBlock.get(beforeStmt) as BasicBlock;
        // Simplify edition just for SSA
        block.addStmtToFirst(newStmt);
        this.stmtToBlock.set(newStmt, block);
    }

    // TODO: 添加block之间的边
    public addBlock(block: BasicBlock): void {
        this.blocks.add(block);

        for (const stmt of block.getStmts()) {
            this.stmtToBlock.set(stmt, block);
        }
    }


    public getBlocks(): Set<BasicBlock> {
        return this.blocks;
    }


    public getStartingBlock(): BasicBlock | undefined {
        return this.stmtToBlock.get(this.startingStmt);
    }

    public getStartingStmt(): Stmt {
        return this.startingStmt;
    }

    public setStartingStmt(newStartingStmt: Stmt): void {
        this.startingStmt = newStartingStmt;
    }

    // TODO: 整理成类似jimple的输出
    public toString(): string {
        return 'cfg';
    }


    buildDefUseChain() {
        const locals: Set<Local> = new Set();
        for (const block of this.blocks) {
            for (let stmtIndex = 0; stmtIndex < block.getStmts().length; stmtIndex++) {
                const stmt = block.getStmts()[stmtIndex];
                // 填declareStmt
                const defValue = stmt.getDef()
                if (defValue && defValue instanceof Local && !locals.has(defValue)) {
                    defValue.setDeclaringStmt(stmt);
                    locals.add(defValue);
                }

                for (const value of stmt.getUses()) {
                    if (value instanceof Local) {
                        const local = value as Local;
                        local.addUsedStmt(stmt)
                    }
                    const name = value.toString();
                    const defStmts: Stmt[] = [];
                    // 判断本block之前有无对应def
                    for (let i = stmtIndex - 1; i >= 0; i--) {
                        const beforeStmt = block.getStmts()[i];
                        if (beforeStmt.getDef() && beforeStmt.getDef()?.toString() == name) {
                            defStmts.push(beforeStmt);
                            break;
                        }
                    }
                    // 本block有对应def直接结束,否则找所有的前序block
                    if (defStmts.length != 0) {
                        this.defUseChains.push(new DefUseChain(value, defStmts[0], stmt));
                    }
                    else {
                        const needWalkBlocks: BasicBlock[] = [];
                        for (const predecessor of block.getPredecessors()) {
                            needWalkBlocks.push(predecessor);
                        }
                        const walkedBlocks = new Set();
                        while (needWalkBlocks.length > 0) {
                            const predecessor = needWalkBlocks.pop();
                            if (!predecessor) {
                                return;
                            }
                            const predecessorStmts = predecessor.getStmts();
                            let predecessorHasDef = false;
                            for (let i = predecessorStmts.length - 1; i >= 0; i--) {
                                const beforeStmt = predecessorStmts[i];
                                if (beforeStmt.getDef() && beforeStmt.getDef()?.toString() == name) {
                                    defStmts.push(beforeStmt);
                                    predecessorHasDef = true;
                                    break;
                                }
                            }
                            if (!predecessorHasDef) {
                                for (const morePredecessor of predecessor.getPredecessors()) {
                                    if (!walkedBlocks.has(morePredecessor))
                                        needWalkBlocks.unshift(morePredecessor);
                                }
                            }
                            walkedBlocks.add(predecessor);
                        }
                        for (const def of defStmts) {
                            this.defUseChains.push(new DefUseChain(value, def, stmt))
                        }
                    }
                }
            }
        }
    }

    public typeReference(){
        for(let block of this.blocks){
            for(let stmt of block.getStmts()){
                // console.log(stmt)
                if(stmt instanceof ArkAssignStmt){
                    const leftOp=stmt.getLeftOp();
                    const rightOp=stmt.getRightOp();
                    if(leftOp instanceof Local){
                        if (rightOp instanceof ArkNewExpr) {
                            leftOp.setType(this.getTypeNewExpr(rightOp));
                        } else if (rightOp instanceof ArkBinopExpr){
                            let op1 = rightOp.getOp1()
                            let op2 = rightOp.getOp2()
                            let op1Type: string, op2Type: string
                            if (op1 instanceof Local) {
                                let declaringStmt = op1.getDeclaringStmt()
                                if (declaringStmt instanceof ArkAssignStmt) {
                                    op1Type = (<Local>(declaringStmt.getLeftOp())).getType()
                                }
                            } else if (op1 instanceof Constant) {
                                op1Type = op1.getType()
                            }
                            if (op2 instanceof Local) {
                                let declaringStmt = op2.getDeclaringStmt()
                                if (declaringStmt instanceof ArkAssignStmt) {
                                    op2Type = (<Local>(declaringStmt.getLeftOp())).getType()
                                }
                            } else if (op2 instanceof Constant) {
                                op2Type = op2.getType()
                            }
                            leftOp.setType(this.resolveBinaryResultType(op1Type!, op2Type!, rightOp.getOperator()));
                        } else if (rightOp instanceof ArkCastExpr) {

                        } else if (rightOp instanceof ArkInstanceFieldRef) {
                            // console.log(rightOp)
                            let completeClassName = rightOp.getBase().getType()
                            let lastDotIndex = completeClassName.lastIndexOf('.')
                            let targetArkFile = this.getArkFileByName(
                                completeClassName.substring(0, lastDotIndex), this.declaringClass.getDeclaringArkFile()
                            )
                            let classInstance = this.resolveClassInstance(
                                completeClassName, targetArkFile)
                            if (classInstance != null) {
                                for (let field of classInstance.getFields()) {
                                    // console.log(field.getType())
                                    if (field.getName() === rightOp.getFieldName()) {
                                        let fieldType = field.getType()
                                        if (isPrimaryType(fieldType)) {
                                            leftOp.setType(fieldType)
                                        } else {
                                            let classInstanceFile = this.getArkFileByName(
                                                classInstance.getSignature().getArkFile(),
                                                this.declaringClass.getDeclaringArkFile())
                                            if (classInstanceFile != null) {
                                                let fieldTypeClassName = this.searchImportClass(
                                                    classInstanceFile,
                                                    fieldType
                                                )
                                                leftOp.setType(fieldTypeClassName)
                                            }
                                        }
                                    }
                                }
                            }
                        } else if (rightOp instanceof Local || rightOp instanceof ArkParameterRef) {
                            let rightOpType = rightOp.getType()
                            if (isPrimaryType(rightOpType)) {
                                leftOp.setType(rightOpType)
                            } else {
                                // TODO: 对应函数参数的解析,可能会与类属性解析冲突
                                if (!rightOpType.includes(".")) {
                                    let completeClassName = this.searchImportClass(
                                        this.declaringClass.getDeclaringArkFile(),
                                        rightOpType)
                                    leftOp.setType(completeClassName)
                                } else {
                                    leftOp.setType(rightOpType)
                                }
                            }
                        } else if (rightOp instanceof Constant) {
                            leftOp.setType(rightOp.getType())
                        } else if (rightOp instanceof ArkStaticInvokeExpr){
                            // const staticInvokeExpr=rightOp as ArkStaticInvokeExpr;
                            // if(staticInvokeExpr.toString().includes("<AnonymousFunc-")){
                            leftOp.setType("Callable");
                            // }
                        }
                    }
                }
            }
        }
    }

    private resolveBinaryResultType(op1Type: string, op2Type: string, operator: string): string {
        switch (operator) {
            case "+":
                if (op1Type === "string" || op2Type === "string") {
                    return "string";
                }
                if (op1Type === "number" && op2Type === "number") {
                    return "number";
                }
                break;
            case "-":
            case "*":
            case "/":
            case "%":
                if (op1Type === "number" && op2Type === "number") {
                    return "number";
                }
                break;
            case "<":
            case "<=":
            case ">":
            case ">=":
            case "==":
            case "!=":
            case "===":
            case "!==":
            case "&&":
            case "||":
                return "boolean";
            case "&":
            case "|":
            case "^":
            case "<<":
            case ">>":
            case ">>>":
                if (op1Type === "number" && op2Type === "number") {
                    return "number";
                }
                break;
        }
        return "";
    }

    private getTypeNewExpr(newExpr:ArkNewExpr): string {
        const className = newExpr.getClassSignature();
        const file = this.declaringClass.getDeclaringArkFile();
        return this.searchImportClass(file, className);
    }

    private searchImportClass(file: ArkFile, className: string): string {
        for (let classInFile of file.getClasses()) {
            if (className == classInFile.getName()) {
                return classInFile.getSignature().getArkFile() + "." + className;
            }
        }
        for (let importInfo of file.getImportInfos()) {
            const importFromDir=importInfo.getImportFrom();
            if (className == importInfo.getImportClauseName() && importFromDir != undefined) {
                const fileDir = file.getName().split("\\");
                const importDir = importFromDir.split(/[\/\\]/).filter(item => item !== '.');
                let realName = importInfo.getNameBeforeAs()?importInfo.getNameBeforeAs():importInfo.getImportClauseName()
                let parentDirNum = 0;
                while (importDir[parentDirNum] == "..") {
                    parentDirNum++;
                }
                if (parentDirNum < fileDir.length) {
                    let realImportFileName = path.dirname("");
                    for (let i = 0; i < fileDir.length - parentDirNum - 1; i++) {
                        realImportFileName = path.join(realImportFileName, fileDir[i])
                    }
                    for (let i = parentDirNum; i < importDir.length; i++) {
                        realImportFileName = path.join(realImportFileName, importDir[i])
                    }
                    realImportFileName += ".ts";
                    const scene = file.getScene();
                    if (scene) {
                        for (let sceneFile of scene.arkFiles) {
                            if (sceneFile.getName() == realImportFileName) {
                                return this.searchImportClass(sceneFile, realName!);
                            }
                        }
                    }
                }
            }
        }
        return "";
    }
    protected resolveClassInstance(classCompleteName: string, file: ArkFile|null) {
        if (file == null)
            return null
        let lastDotIndex = classCompleteName.lastIndexOf('.')
        let classRealName = classCompleteName.substring(lastDotIndex + 1)
        for (let arkClass of file.getClasses()) {
            if (arkClass.getName() === classRealName) {
                return arkClass
            }
        }
        return null
    }

    protected getArkFileByName(fileName: string, currentFile: ArkFile) {
        for (let sceneFile of currentFile.getScene().arkFiles) {
            if (sceneFile.getName() === fileName) {
                return sceneFile
            }
        }
        return null
    }
}