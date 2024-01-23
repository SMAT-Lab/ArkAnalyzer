import { Stmt } from "../base/Stmt";

export class BasicBlock {
    private stmts: Stmt[] = [];
    private predecessorBlocks: BasicBlock[] = [];
    private successorBlocks: BasicBlock[] = new Array<BasicBlock>(1);

    constructor() {

    }

    public getStmts() {
        return this.stmts;
    }

    public addStmt(stmt: Stmt): void {
        this.stmts.push(stmt);
    }

    public getHead(): Stmt | null {
        if (this.stmts.length == 0) {
            return null;
        }
        return this.stmts[0];
    }

    public getTail(): Stmt | null {
        let size = this.stmts.length;
        if (size == 0) {
            return null;
        }
        return this.stmts[size - 1];
    }

    public getSuccessors(): BasicBlock[] {
        return this.successorBlocks;
    }

    public setSuccessorBlock(successorIdx: number, block: BasicBlock): boolean {
        this.updateSuccessorContainer();
        if (successorIdx >= this.successorBlocks.length) {
            return false;
        }

        this.successorBlocks[successorIdx] = block;
        return true;
    }

    public getPredecessors(): BasicBlock[] {
        return this.predecessorBlocks;
    }

    public addPredecessorBlock(block: BasicBlock): void {
        this.predecessorBlocks.push(block);
    }

    public updateSuccessorContainer(): void {
        let tail = this.getTail();
        if (tail) {
            let expectedSuccessorCount = tail.getExpectedSuccessorCount();
            if (expectedSuccessorCount != this.successorBlocks.length) {
                this.successorBlocks = new Array<BasicBlock>(expectedSuccessorCount);
            }
        }
    }

    // Simplify edition just for SSA
    public addStmtToFirst(stmt: Stmt) {
        this.stmts.splice(0, 0, stmt);
    }
}