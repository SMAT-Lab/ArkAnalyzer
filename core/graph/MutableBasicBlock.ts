import { Stmt } from "../base/Stmt";

export class MutableBasicBlock {
    private predecessorBlocks: MutableBasicBlock[];
    private successorBlocks: MutableBasicBlock[];

    private stmts: Stmt[];

    constructor() {
        this.predecessorBlocks = [];
        this.successorBlocks = [];
        this.stmts = [];
    }

    public addStmt(newStmt: Stmt): void {
        this.stmts.push(newStmt);
    }

    public removeStmt(stmt: Stmt): void {
        let i = this.stmts.indexOf(stmt);
        this.stmts.splice(i, 1);
    }

    public replaceStmt(oldStmt: Stmt, newStmt: Stmt): void {
        let i = this.stmts.indexOf(oldStmt);
        this.stmts.splice(i, 1, newStmt);
    }

    public getStmts(): Stmt[] {
        let stmts: Stmt[] = [];
        stmts.push(...this.stmts);
        return stmts;
    }


    public getSuccessors(): MutableBasicBlock[] {
        let successors: MutableBasicBlock[] = [];
        successors.push(...this.successorBlocks);
        return successors;
    }

    public getPredecessors(): MutableBasicBlock[] {
        let predecessors: MutableBasicBlock[] = [];
        predecessors.push(...this.predecessorBlocks);
        return predecessors;
    }

    public getHead(): Stmt {
        if (this.stmts.length == 0) {
            throw new Error();
        }
        return this.stmts[0];
    }

    public getTail(): Stmt {
        let size = this.stmts.length;
        if (size < 1) {
            throw new Error();
        }
        return this.stmts[size - 1];
    }

    public addPredecessorBlock(block: MutableBasicBlock): void {
        this.predecessorBlocks.push(block);
    }

    public setSuccessorBlock(successorIdx: number, block: MutableBasicBlock): boolean {
        this.updateSuccessorContainer(this.getTail());
        if (successorIdx >= this.successorBlocks.length) {
            return false;
        }
        this.successorBlocks[successorIdx] = block;
        return true;
    }


    private updateSuccessorContainer(newStmt: Stmt): void {
        const expectedSuccessorCount = newStmt.getExpectedSuccessorCount();
        if (expectedSuccessorCount != this.successorBlocks.length) {
            // TODO:ts对象数组
            this.successorBlocks = [];
            for (let i = 0; i < expectedSuccessorCount; i++) {
                this.successorBlocks.push(new MutableBasicBlock());
            }
        }
    }
}