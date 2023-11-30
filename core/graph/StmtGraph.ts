import {ArkStmt} from '../base/Stmt'
import * as ts from "typescript";

export class StmtGraph{
    statemnents:ArkStmt[];


    // construct from ast
    constructor(root:ts.Node){
        this.buildGraph(root);
    }


    public getNodes():ArkStmt[]{
        return this.statemnents;
    }

    public getStartingStmt(){        
    }

    // todo: 实现
    public successors(curr:ArkStmt):ArkStmt[]{        
        return this.statemnents;
    }

    // todo: 实现
    public predecessors(curr:ArkStmt):ArkStmt[]{        
        return this.statemnents;
    }    


    // for test
    public printStmtGraph(){

    }

    
    private buildGraph(root:ts.Node){

    }
}