import { SceneConfig } from "../src/Config";
import { Scene } from "../src/Scene";
import { ArkBody } from "../src/core/model/ArkBody";
import {DataflowProblem, FlowFunction} from "../src/core/dataflow/DataflowProblem"
import {Local} from "../src/core/base/Local"
import {ArkAssignStmt, ArkInvokeStmt, Stmt} from "../src/core/base/Stmt"
import { ArkMethod } from "../src/core/model/ArkMethod";

class PossibleDivZeroChecker extends DataflowProblem<Local> {
    zeroValue : Local = new Local("zeroValue");

    getEntryPoint() : Stmt {
        // TODO
        return new Stmt();
    }

    getEntryMethod() : ArkMethod {
        // TODO
        return new ArkMethod();
    }


    getNormalFlowFunction(srcStmt:Stmt, tgtStmt:Stmt) : FlowFunction<Local> {
            let checkerInstance: PossibleDivZeroChecker = this;
            return new class implements FlowFunction<Local> {
                isPrameter (d: Local) : boolean{
                    // TODO
                    return false;
                }

                getDataFacts(dataFact: Local): Set<Local> {
                    let ret: Set<Local> = new Set<Local>();
                    if (checkerInstance.getEntryPoint() == srcStmt && checkerInstance.getZeroValue() == dataFact) {
                        // handle zero fact and entry point case
                        let entryMethod = checkerInstance.getEntryMethod();
                        let body : ArkBody = entryMethod.getBody();
                        let locals :Set<Local> = body.getLocals();
                        //TODO add all parameters to the ret;
                        /*
                        if (local is Prameter) {
                            ret.add(local)
                        }
                        */
                    }
                    
                    if (srcStmt instanceof ArkAssignStmt) {
                        let ass : ArkAssignStmt = (srcStmt as ArkAssignStmt);
                        // case : a = b and b = 0;= d
                        if (checkerInstance.getEntryPoint() == srcStmt && checkerInstance.getZeroValue() == dataFact) {
                            for (let local of ret) {
                                if (ass.getRightOp() == local && ass.getLeftOp() instanceof Local) {
                                    ret.add((ass.getLeftOp() as Local));
                                }
                            } 
                        } else if (ass.getRightOp() == dataFact && ass.getLeftOp() instanceof Local) {
                            ret.add((ass.getLeftOp() as Local));
                        }
                    }

                    // handle 0->0 reachability case
                    if (checkerInstance.getZeroValue() == dataFact) {
                        ret.add(checkerInstance.getZeroValue());
                    }
                    return ret;
                }
        }
    }

    getCallFlowFunction(srcStmt:Stmt, method:ArkMethod) : FlowFunction<Local> {
        let checkerInstance: PossibleDivZeroChecker = this;
        return new class implements FlowFunction<Local> {
            getDataFacts(dataFact: Local): Set<Local> {
                const ret:Set<Local> = new Set();
                if (checkerInstance.getZeroValue() == dataFact) {
                    ret.add(checkerInstance.getZeroValue());
                }
                const callStmt = srcStmt as ArkInvokeStmt;
                const args = callStmt.getInvokeExpr().getArgs();
                for (let i = 0; i < args.length; i++){
                    if (args[i] == dataFact){
                        // arkmethod的参数类型为ArkParameterRef，不是local，只能通过第一个block的对应位置找到真正参数的定义获取local
                        const realParameter = method.getCfg().getBlocks()[0].getStmts()[i].getDef();
                        ret.add(realParameter)
                    }
                }
                return ret;
            }

        }
    }

    getExitToReturnFlowFunction(srcStmt:Stmt, tgtStmt:Stmt) : FlowFunction<Local> {
        return new class implements FlowFunction<Local> {
            getDataFacts(d: Local): Set<Local> {
                throw new Error("Method not implemented.");
            }

        }
    }

    getCallToReturnFlowFunction(srcStmt:Stmt, tgtStmt:Stmt) : FlowFunction<Local> {
        let checkerInstance: PossibleDivZeroChecker = this;
        return new class implements FlowFunction<Local> {
            getDataFacts(dataFact: Local): Set<Local> {
                const ret:Set<Local> = new Set();
                if (checkerInstance.getZeroValue() == dataFact) {
                    ret.add(checkerInstance.getZeroValue());
                }
                const defValue = srcStmt.getDef();
                if (!(defValue && defValue ==dataFact)){
                    ret.add(dataFact);
                }
                return ret;
            }

        }
    }

    createZeroValue() : Local {
        return this.zeroValue;
    }

    getZeroValue() : Local {
        return this.zeroValue;
    }
}
