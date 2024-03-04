import { Stmt } from "../base/Stmt";

export class Edge {
    kind: number;

    public static getKind(srcStmt: Stmt, tgtStmt: Stmt): number {
        return 0;
    }
}