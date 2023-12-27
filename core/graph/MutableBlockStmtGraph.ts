import { Stmt } from "../base/Stmt";
import { MutableBasicBlock } from "./MutableBasicBlock";

export class MutableBlockStmtGraph {
    private stmtToBlock: Map<Stmt, MutableBasicBlock>;
    private blocks: Set<MutableBasicBlock>;

    constructor() {
        this.stmtToBlock = new Map<Stmt, MutableBasicBlock>;
        this.blocks = new Set<MutableBasicBlock>;
    }


    public addBlock(stmts: Stmt[]): MutableBasicBlock {
        let firstStmt = stmts[0];
        let block = this.getOrCreateBlock(firstStmt);


        for (let i = 1; i < stmts.length; i++) {
            let stmt = stmts[i];
            let oldBlock = this.addNodeToBlock(block, stmt);
            if (oldBlock) {
                // TODO:
            }
        }
        return block;
    }

    private getOrCreateBlock(stmt: Stmt): MutableBasicBlock {
        let block = this.stmtToBlock.get(stmt);
        if (!block) {
            block = this.createStmtsBlock(stmt);
        }
        return block;
    }

    private addNodeToBlock(block: MutableBasicBlock, stmt: Stmt): MutableBasicBlock | undefined {
        block.addStmt(stmt);
        let oldBlock = this.stmtToBlock.get(stmt);
        this.stmtToBlock.set(stmt, block);
        return oldBlock;
    }

    private createStmtsBlock(stmt: Stmt): MutableBasicBlock {
        let block = new MutableBasicBlock();
        if (!this.addNodeToBlock(block, stmt)) {
            // throw new Error();
        }
        this.blocks.add(block);
        return block;
    }

    public putEdge(stmtA: Stmt, succesorIdx: number, stmtB: Stmt) {
        let blockA = this.stmtToBlock.get(stmtA);
        let blockB = this.stmtToBlock.get(stmtB);

        if (!blockA) {
            blockA = this.createStmtsBlock(stmtA);
        }

        if (stmtA.branches()) {
            if (!blockB) {
                blockB = this.createStmtsBlock(stmtB);
                blockA.setSuccessorBlock(succesorIdx, blockB);
                blockB.addPredecessorBlock(blockA);
            } else {
                if (blockB.getHead() == stmtB) {
                    blockA.setSuccessorBlock(succesorIdx, blockB);
                    blockB.addPredecessorBlock(blockA);
                } else {
                    // TODO
                }
            }
        } else {
            if (blockB == null) {
                this.addNodeToBlock(blockA, stmtB);
            } else {
                if (blockB.getHead() == stmtB) {
                    if (blockB.getPredecessors().length == 0) {
                        for (const stmt of blockB.getStmts()) {
                            this.addNodeToBlock(blockA, stmt);
                        }
                        this.blocks.delete(blockB);
                    } else {

                        blockA.setSuccessorBlock(succesorIdx, blockB);
                        blockB.addPredecessorBlock(blockA);
                    }
                } else {
                    throw new Error();
                }
            }
        }
    }
}