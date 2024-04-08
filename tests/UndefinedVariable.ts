import { SceneConfig } from "../src/Config";
import { Scene } from "../src/Scene";
import { ArkBody } from "../src/core/model/ArkBody";
import {DataflowProblem, FlowFunction} from "../src/core/dataflow/DataflowProblem"
import {Local} from "../src/core/base/Local"
import {Value} from "../src/core/base/Value"
import {NumberType, Type} from "../src/core/base/Type"
import {ArkAssignStmt, ArkInvokeStmt, ArkReturnStmt, Stmt} from "../src/core/base/Stmt"
import { ArkMethod } from "../src/core/model/ArkMethod";
import { LiteralType } from "../src/core/base/Type";
import {ValueUtil} from "../src/core/common/ValueUtil"
import {Constant} from "../src/core/base/Constant"
import { ArkInstanceFieldRef, ArkParameterRef } from "../src/core/base/Ref";
import { ModelUtils } from "../src/core/common/ModelUtils";
import { DataflowSolver } from "../src/core/dataflow/DataflowSolver"
import { ArkBinopExpr, ArkInstanceInvokeExpr } from "../src/core/base/Expr";
import { UndefinedType } from "../src/core/base/Type";


class UndefinedVariableChecker extends DataflowProblem<Value> {
    zeroValue : Constant = new Constant('undefined', UndefinedType.getInstance());
    entryPoint: Stmt;
    entryMethod: ArkMethod;
    scene: Scene;
    constructor(stmt: Stmt, method: ArkMethod){
        super();
        this.entryPoint = stmt;
        this.entryMethod = method;
        this.scene = method.getDeclaringArkFile().getScene();
    }

    getEntryPoint() : Stmt {
        return this.entryPoint;
    }

    getEntryMethod() : ArkMethod {
        return this.entryMethod;
    }

    private isUndefined(val : Value) : boolean {
        if (val instanceof Constant) {
            let constant : Constant = val as Constant;
            if (constant.getType() instanceof UndefinedType) {
                return true;
            } 
        }
        return false;
    }

    getNormalFlowFunction(srcStmt:Stmt, tgtStmt:Stmt) : FlowFunction<Value> {
            let checkerInstance: UndefinedVariableChecker = this;
            return new class implements FlowFunction<Value> {
                getDataFacts(dataFact: Value): Set<Value> {
                    let ret: Set<Value> = new Set();
                    if (checkerInstance.getEntryPoint() == srcStmt && checkerInstance.getZeroValue() == dataFact) {
                        let entryMethod = checkerInstance.getEntryMethod();
                        let body : ArkBody = entryMethod.getBody();
                        const parameters =  [...entryMethod.getCfg().getBlocks()][0].getStmts().slice(0,entryMethod.getParameters().length);
                        for (let i = 0;i < parameters.length;i++) {
                            const para  = parameters[i].getDef();
                            if (para)
                                ret.add(para);
                        }
                        ret.add(checkerInstance.getZeroValue());
                        return ret;
                    } 
                    if (srcStmt.getDef() != dataFact) {
                        ret.add(dataFact);
                    } 
                    if (srcStmt instanceof ArkAssignStmt ) {
                        let ass: ArkAssignStmt = (srcStmt as ArkAssignStmt);
                        let assigned : Value = ass.getLeftOp();
                        let rightOp : Value = ass.getRightOp();
                        if (checkerInstance.getZeroValue() == dataFact) {
                            if (checkerInstance.isUndefined(rightOp)) {
                                ret.add(assigned);
                            }
                        } else if (rightOp == dataFact || rightOp.getType() instanceof UndefinedType) {
                            ret.add(assigned);
                        } else if (rightOp instanceof ArkInstanceFieldRef) {
                            const base = rightOp.getBase();
                            if (base == dataFact){
                                console.log("undefined base")
                                console.log(srcStmt.toString());
                                console.log(srcStmt.getOriginPositionInfo());
                            }
                        }
                    }

                    return ret;
                }
        }
    }

    getCallFlowFunction(srcStmt:Stmt, method:ArkMethod) : FlowFunction<Value> {
        let checkerInstance: UndefinedVariableChecker = this;
        return new class implements FlowFunction<Value> {
            getDataFacts(dataFact: Value): Set<Value> {
                const ret:Set<Value> = new Set();
                if (checkerInstance.getZeroValue() == dataFact) {
                    ret.add(checkerInstance.getZeroValue());
                        if (method.getDeclaringArkClass().getName() != '_DEFAULT_ARK_CLASS' && method.getName() == "constructor"){
                            const arkClass = method.getDeclaringArkClass().getFields();
                            // todo:类constructor后要考察所有属性
                        }
                        
                        const callExpr = srcStmt.getExprs()[0];
                        if (callExpr instanceof ArkInstanceInvokeExpr && dataFact instanceof ArkInstanceFieldRef && callExpr.getBase() == dataFact.getBase()){
                            // todo:base转this
                        }
                }
                const callStmt = srcStmt as ArkInvokeStmt;
                const args = callStmt.getInvokeExpr().getArgs();
                for (let i = 0; i < args.length; i++){
                    if (args[i] == dataFact || checkerInstance.isUndefined(args[i]) && checkerInstance.getZeroValue() == dataFact){
                        const realParameter = [...method.getCfg().getBlocks()][0].getStmts()[i].getDef();
                        if (realParameter)
                            ret.add(realParameter)
                    }
                }

                return ret;
            }

        }
    }

    getExitToReturnFlowFunction(srcStmt:Stmt, tgtStmt:Stmt, callStmt:Stmt) : FlowFunction<Value> {
        let checkerInstance: UndefinedVariableChecker = this;
        return new class implements FlowFunction<Value> {
            getDataFacts(dataFact: Value): Set<Value> {
                let ret : Set<Value> = new Set<Value>();
                if (dataFact == checkerInstance.getZeroValue()) {
                    ret.add(checkerInstance.getZeroValue());
                }
                if (!(callStmt instanceof ArkAssignStmt)) {
                    return ret;
                }
                if (srcStmt instanceof ArkReturnStmt) {
                    let ass: ArkAssignStmt = callStmt as ArkAssignStmt;
                    let leftOp: Value = ass.getLeftOp();
                    let retVal: Value = (srcStmt as ArkReturnStmt).getOp();
                    if (dataFact == checkerInstance.getZeroValue()) {
                        ret.add(checkerInstance.getZeroValue());
                        if (checkerInstance.isUndefined(retVal)) {
                            ret.add(leftOp);
                        }

                    } else if (retVal == dataFact) {
                        ret.add(leftOp);
                    }
                }
                if (dataFact instanceof ArkInstanceFieldRef && dataFact.getBase().getName() == "this"){
                    // todo:this转base。不能new一个t.a的ref，考虑去pathSet拿
                }
                return ret;
            }

        }
    }

    getCallToReturnFlowFunction(srcStmt:Stmt, tgtStmt:Stmt) : FlowFunction<Value> {
        let checkerInstance: UndefinedVariableChecker = this;
        return new class implements FlowFunction<Value> {
            getDataFacts(dataFact: Value): Set<Value> {
                const ret:Set<Value> = new Set();
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

    createZeroValue() : Value {
        return this.zeroValue;
    }

    getZeroValue() : Value {
        return this.zeroValue;
    }
}

class instanceSolver extends DataflowSolver<Value> {
    constructor(problem: UndefinedVariableChecker, scene: Scene){
        super(problem, scene);
    }
}


const config_path = "tests\\resources\\ifds\\UndefinedVariable\\ifdsTestConfig.json";
let config: SceneConfig = new SceneConfig();
config.buildFromJson(config_path);
const scene = new Scene(config);
const defaultMethod = scene.getFiles()[0].getDefaultClass().getDefaultArkMethod();
const method = ModelUtils.getMethodWithName("main",defaultMethod!);
if(method){
    const problem = new UndefinedVariableChecker([...method.getCfg().getBlocks()][0].getStmts()[method.getParameters().length],method);
    const solver = new instanceSolver(problem, scene);
    solver.solve();
    debugger
}
