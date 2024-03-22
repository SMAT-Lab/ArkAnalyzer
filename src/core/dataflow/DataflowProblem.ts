import { Stmt } from "../base/Stmt";
import { Value } from "../base/Value";
import { ArkMethod } from "../model/ArkMethod";
import { DataflowResult } from "./DataflowResult";
import { Edge } from "./Edge";


export abstract class DataflowProblem<D> {


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
    /*
    abstract transferNormalEdge(srcStmt: Stmt, tgtStmt: Stmt, result: DataflowResult): boolean;
    
    abstract transferCallToReturnEdge(srcStmt: Stmt, tgtStmt: Stmt, result: DataflowResult): boolean;

    abstract transferCallEdge(srcStmt: Stmt, tgtStmt: Stmt, result: DataflowResult): boolean;

    abstract transferReturnEdge(srcStmt: Stmt, tgtStmt: Stmt, result: DataflowResult): boolean;
    */

    abstract getNormalFlowFunction(srcStmt:Stmt, tgtStmt:Stmt) : FlowFunction<D>;

    abstract getCallFlowFunction(srcStmt:Stmt, method:ArkMethod) : FlowFunction<D>;

    abstract getExitToReturnFlowFunction(srcStmt:Stmt, tgtStmt:Stmt, callStmt:Stmt) : FlowFunction<D>;

    abstract getCallToReturnFlowFunction(srcStmt:Stmt, tgtStmt:Stmt) : FlowFunction<D>;

    abstract createZeroValue() : D;

    abstract getEntryPoint() : Stmt;

    abstract getEntryMethod() : ArkMethod;
}

export interface FlowFunction<D>  {
    getDataFacts(d:D) : Set<D>;
}