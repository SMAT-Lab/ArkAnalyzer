import { Stmt } from "../base/Stmt";

export class Edge {
    kind: number;

    public static getKind(srcStmt: Stmt, tgtStmt: Stmt): number {
        return 0;
    }
}

export class PathEdgePoint<D> {
    public node:Stmt;
    public fact:D;

    constructor(node:Stmt, fact:D){
        this.node = node;
        this.fact = fact;
    }
}

export class PathEdge<D> {
    public edgeStart:PathEdgePoint<D>;
    public edgeEnd:PathEdgePoint<D>;

    constructor(start:PathEdgePoint<D>, end:PathEdgePoint<D>) {
        this.edgeStart=start;
        this.edgeEnd=end;
    }
}
