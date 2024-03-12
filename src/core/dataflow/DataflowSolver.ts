import { StmtReader } from "../../save/source/SourceBody";
import { Stmt } from "../base/Stmt";
import { DataflowProblem } from "./DataflowProblem";
import { DataflowResult } from "./DataflowResult";

export abstract class DataflowSolver {
    
    private problem: DataflowProblem;
    private result: DataflowResult;
    private workList: Stmt[] = [];

    constructor(problem: DataflowProblem, result: DataflowResult) {
        this.problem = problem;
        this.result = result;
    }


    protected solve(problem: DataflowProblem): DataflowResult {
        let result: DataflowResult = this.init();
        this.doSolve();
        return result;
    }

    protected init(): DataflowResult {
        return new DataflowResult();
    }

    protected doSolve() {
        
        while (this.workList.length != 0) {
            let stmt = this.workList.pop();
        }
    }
}




