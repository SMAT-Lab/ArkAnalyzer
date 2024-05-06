import { SceneConfig } from "../../Config";
import { Scene } from "../../Scene";
import { ArkBody } from "../model/ArkBody";
import {DataflowProblem, FlowFunction} from "./DataflowProblem"
import {Local} from "../base/Local"
import {Value} from "../base/Value"
import {ClassType, NumberType, Type} from "../base/Type"
import {ArkAssignStmt, ArkInvokeStmt, ArkReturnStmt, Stmt} from "../base/Stmt"
import { ArkMethod } from "../model/ArkMethod";
import {Constant} from "../base/Constant"
import { AbstractFieldRef, ArkInstanceFieldRef, ArkParameterRef, ArkStaticFieldRef } from "../base/Ref";
import { ModelUtils } from "../common/ModelUtils";
import { DataflowSolver } from "./DataflowSolver"
import { ArkBinopExpr, ArkInstanceInvokeExpr, ArkStaticInvokeExpr } from "../base/Expr";
import { UndefinedType } from "../base/Type";
import { factEqual } from "../dataflow/DataflowSolver";
import { FileSignature } from "../model/ArkSignature";
import { NamespaceSignature } from "../model/ArkSignature";
import { ArkClass } from "../model/ArkClass";

export class UndefinedVariableChecker extends DataflowProblem<Value> {
    zeroValue : Constant = new Constant('undefined', UndefinedType.getInstance());
    entryPoint: Stmt;
    entryMethod: ArkMethod;
    scene: Scene;
    classMap: Map<FileSignature | NamespaceSignature, ArkClass[]>;
    globalVariableMap: Map<FileSignature | NamespaceSignature, Local[]>;
    constructor(stmt: Stmt, method: ArkMethod){
        super();
        this.entryPoint = stmt;
        this.entryMethod = method;
        this.scene = method.getDeclaringArkFile().getScene();
        this.classMap = this.scene.getClassMap();
        this.globalVariableMap = this.scene.getGlobalVariableMap();
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

                        // 加入所有的全局变量和静态属性（may analysis）
                        const staticFields = entryMethod.getDeclaringArkClass().getStaticFields(checkerInstance.classMap);
                        for (const field of staticFields) {
                            if (field.getInitializer() == undefined) {
                                ret.add(new ArkStaticFieldRef(field.getSignature()));
                            }
                        }
                        for (const local of entryMethod.getDeclaringArkClass().getGlobalVariable(checkerInstance.globalVariableMap)) {
                            ret.add(local);
                        }
                        return ret;
                    } 
                    if (!factEqual(srcStmt.getDef(), dataFact)) {
                        if (!(dataFact instanceof Local && dataFact.getName() == srcStmt.getDef()!.toString()))
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
                        } else if (factEqual(rightOp, dataFact) || rightOp.getType() instanceof UndefinedType) {
                            ret.add(assigned);
                        } else if (rightOp instanceof ArkInstanceFieldRef) {
                            const base = rightOp.getBase();
                            if (base == dataFact || !base.getDeclaringStmt()){
                                console.log("undefined base")
                                console.log(srcStmt.toString());
                                console.log(srcStmt.getOriginPositionInfo());
                            }
                        } else if (dataFact instanceof ArkInstanceFieldRef && rightOp == dataFact.getBase()) {
                            const field = new ArkInstanceFieldRef(srcStmt.getLeftOp() as Local, dataFact.getFieldSignature());
                            ret.add(field);
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
                    // 加上调用函数能访问到的所有静态变量，如果不考虑多线程，加上所有变量，考虑则要统计之前已经处理过的变量并排除
                    for (const field of method.getDeclaringArkClass().getStaticFields(checkerInstance.classMap)) {
                        if (field.getInitializer() == undefined) {
                            ret.add(new ArkStaticFieldRef(field.getSignature()));
                        }
                    }
                    for (const local of method.getDeclaringArkClass().getGlobalVariable(checkerInstance.globalVariableMap)) {
                        ret.add(local);
                    }
                }
                else {
                    const callExpr = srcStmt.getExprs()[0];
                    if (callExpr instanceof ArkInstanceInvokeExpr && dataFact instanceof ArkInstanceFieldRef && callExpr.getBase().getName() == dataFact.getBase().getName()){
                        // todo:base转this
                        const baseType = callExpr.getBase().getType() as ClassType;
                        const arkClass = checkerInstance.scene.getClass(baseType.getClassSignature());
                        const constructor = arkClass?.getMethodWithName("constructor");
                        const block = [...constructor!.getCfg().getBlocks()][0];
                        for (const stmt of block.getStmts()){
                            const def = stmt.getDef()
                            if (def && def instanceof ArkInstanceFieldRef && def.getBase().getName() == "this" && def.getFieldName() == dataFact.getFieldName()){
                                ret.add(def);
                                break;
                            }
                        }
                    } else if (callExpr instanceof ArkStaticInvokeExpr && dataFact instanceof ArkStaticFieldRef && callExpr.getMethodSignature().getDeclaringClassSignature() == dataFact.getFieldSignature().getDeclaringClassSignature()){
                        ret.add(dataFact);
                    }
                }
                const callStmt = srcStmt as ArkInvokeStmt;
                const args = callStmt.getInvokeExpr().getArgs();
                for (let i = 0; i < args.length; i++){
                    if (args[i] == dataFact || checkerInstance.isUndefined(args[i]) && checkerInstance.getZeroValue() == dataFact){
                        const realParameter = [...method.getCfg().getBlocks()][0].getStmts()[i].getDef();
                        if (realParameter)
                            ret.add(realParameter);
                    }
                    else if (dataFact instanceof ArkInstanceFieldRef && dataFact.getBase().getName() == args[i].toString()){
                        const realParameter = [...method.getCfg().getBlocks()][0].getStmts()[i].getDef();
                        if (realParameter) {
                            const retRef = new ArkInstanceFieldRef(realParameter as Local, dataFact.getFieldSignature());
                            ret.add(retRef);
                        }
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
                if (dataFact instanceof ArkInstanceFieldRef && dataFact.getBase().getName() == "this"){
                    // todo:this转base。
                    const expr = callStmt.getExprs()[0];
                    if (expr instanceof ArkInstanceInvokeExpr){
                        const fieldRef = new ArkInstanceFieldRef(expr.getBase(),dataFact.getFieldSignature());
                        ret.add(fieldRef);
                    }
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

export class UndefinedVariableSolver extends DataflowSolver<Value> {
    constructor(problem: UndefinedVariableChecker, scene: Scene){
        super(problem, scene);
    }
}

