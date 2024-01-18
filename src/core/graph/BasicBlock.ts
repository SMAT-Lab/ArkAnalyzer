import { VoidExpression } from "typescript";
import { Stmt } from "../base/Stmt";

export class BasicBlock {
    private stmts: Stmt[] = [];

    constructor() {

    }

    public getStmts() {
        return Array.from(this.stmts);
    }

    public addStmt(stmt: Stmt): void {
        this.stmts.push(stmt);
    }
}