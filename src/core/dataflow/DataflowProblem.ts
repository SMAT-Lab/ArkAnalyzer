import { Stmt } from "../base/Stmt";
import { DataflowResult } from "./DataflowResult";
import { Edge } from "./Edge";
import { Fact } from "./Fact";


export abstract class DataflowProblem {
 
    public transferEdge(srcStmt: Stmt, tgtStmt: Stmt) {
        let edgeKind: number = Edge.getKind(srcStmt, tgtStmt);

        if (0 == edgeKind) {
            //normal
        } else if (1 == edgeKind) { //Call-Edge

        } else if (2 == edgeKind) { //Return-Edge

        } else if (3 == edgeKind) { //Call-To-Return-Edge

        }
    }

    /**
     * Transfer the outFact of srcStmt to the inFact of tgtStmt
     * 
     * Return true if keeping progagation (i.e., tgtStmt will be added to the WorkList for further analysis)
     */
    abstract transferNormalEdge(srcStmt: Stmt, tgtStmt: Stmt, result: DataflowResult): boolean;
    
    abstract transferCallToReturnEdge(srcStmt: Stmt, tgtStmt: Stmt, result: DataflowResult): boolean;

    abstract transferCallEdge(srcStmt: Stmt, tgtStmt: Stmt, result: DataflowResult): boolean;

    abstract transferReturnEdge(srcStmt: Stmt, tgtStmt: Stmt, result: DataflowResult): boolean;
}