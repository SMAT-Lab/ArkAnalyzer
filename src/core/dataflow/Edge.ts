import { Stmt } from "../base/Stmt";
import {Fact} from "../dataflow/Fact"

export class Edge {
    kind: number;

    public static getKind(srcStmt: Stmt, tgtStmt: Stmt): number {
        return 0;
    }
}

export class PathEdgePoint<D> {
    public Node:Stmt;
    public fact:D;
}

export class PathEdge<D> {
    public edgeStart:PathEdgePoint<D>;
    public edgeEnd:PathEdgePoint<D>;

    constructor(start:PathEdgePoint<D>, end:PathEdgePoint<D>) {
        this.edgeStart=start;
        this.edgeEnd=end;
    }
}
