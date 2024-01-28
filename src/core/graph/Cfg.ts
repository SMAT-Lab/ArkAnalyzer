import { DefUseChain } from "../base/DefUseChain";
import { Local } from "../base/Local";
import { ArkAssignStmt, Stmt } from "../base/Stmt";
import { BasicBlock } from "./BasicBlock";
import { ArkFile } from "../model/ArkFile";
import {ArkBinopExpr, ArkCastExpr, ArkConditionExpr, ArkNewExpr} from "../base/Expr";
import { ArkClass } from "../model/ArkClass";

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
                        local.addUses(stmt)
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
                if(stmt instanceof ArkAssignStmt){
                    const leftOp=stmt.getLeftOp();
                    const rightOp=stmt.getRightOp();
                    if(leftOp instanceof Local){
                        if (rightOp instanceof ArkNewExpr) {
                            leftOp.setType(this.getTypeNewExpr(rightOp));
                        } else if (rightOp instanceof ArkBinopExpr){
                            let op1 = rightOp.getOp1()
                            let op2 = rightOp.getOp2()
                            // console.log(rightOp)
                        } else if (rightOp instanceof ArkConditionExpr) {

                        } else if (rightOp instanceof ArkCastExpr) {

                        }
                    }
                }
            }
        }
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
            let importClassName:string;
            let nameBeforeAs=importInfo.getNameBeforeAs()
            if(nameBeforeAs!=undefined){
                importClassName=nameBeforeAs;
            }
            else{
                importClassName=importInfo.getImportClauseName()
            }
            if (className == importClassName && importFromDir != undefined) {
                const fileDir = file.getName().split("\\");
                const importDir = importFromDir.split(/[\/\\]/).filter(item => item !== '.');
                let parentDirNum = 0;
                while (importDir[parentDirNum] == "..") {
                    parentDirNum++;
                }
                if (parentDirNum < fileDir.length) {
                    let realImportFileName = "";
                    for (let i = 0; i < fileDir.length - parentDirNum - 1; i++) {
                        realImportFileName += fileDir[i] + "\\";
                    }
                    for (let i = parentDirNum; i < importDir.length; i++) {
                        realImportFileName += importDir[i];
                        if (i != importDir.length - 1) {
                            realImportFileName += "\\";
                        }
                    }
                    realImportFileName += ".ts";
                    const scene = file.getScene();
                    if (scene) {
                        for (let sceneFile of scene.arkFiles) {
                            if (sceneFile.getName() == realImportFileName) {
                                return this.searchImportClass(sceneFile, className);
                            }
                        }
                    }
                }
            }
        }
        return "";
    }

}