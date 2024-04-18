import { SceneConfig } from "../src/Config";
import { Scene } from "../src/Scene";
import { ArkBody } from "../src/core/model/ArkBody";
import {DataflowProblem, FlowFunction} from "../src/core/dataflow/DataflowProblem"
import {Local} from "../src/core/base/Local"
import {Value} from "../src/core/base/Value"
import {ClassType, NumberType, Type} from "../src/core/base/Type"
import {ArkAssignStmt, ArkInvokeStmt, ArkReturnStmt, Stmt} from "../src/core/base/Stmt"
import { ArkMethod } from "../src/core/model/ArkMethod";
import { LiteralType } from "../src/core/base/Type";
import {ValueUtil} from "../src/core/common/ValueUtil"
import {Constant} from "../src/core/base/Constant"
import { AbstractFieldRef, ArkInstanceFieldRef, ArkParameterRef, ArkStaticFieldRef } from "../src/core/base/Ref";
import { ModelUtils } from "../src/core/common/ModelUtils";
import { DataflowSolver } from "../src/core/dataflow/DataflowSolver"
import { ArkBinopExpr, ArkInstanceInvokeExpr } from "../src/core/base/Expr";
import { UndefinedType } from "../src/core/base/Type";
import { FieldSignature, fieldSignatureCompare } from "../src/core/model/ArkSignature";
import { factEqual } from "../src/core/dataflow/DataflowSolver";


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

                        // 加入所有的全局变量和静态属性（may analysis）
                        const file = entryMethod.getDeclaringArkFile();
                        const classes = file.getClasses();
                        for (const importInfo of file.getImportInfos()){
                            const importClass = ModelUtils.getClassWithName(importInfo.getImportClauseName(), entryMethod);
                            if (importClass && !classes.includes(importClass)) {
                                classes.push(importClass);
                            }
                        }
                        const nameSpaces = file.getNamespaces();
                        for (const importInfo of file.getImportInfos()){
                            const importNameSpace = ModelUtils.getClassWithName(importInfo.getImportClauseName(), entryMethod);
                            if (importNameSpace && !classes.includes(importNameSpace)) {
                                classes.push(importNameSpace);
                            }
                        }
                        while (nameSpaces.length > 0) {
                            const nameSpace = nameSpaces.pop()!;
                            for (const exportInfo of nameSpace.getExportInfos()) {
                                const clas = ModelUtils.getClassInNamespaceWithName(exportInfo.getExportClauseName(), nameSpace);
                                if (clas && !classes.includes(clas)) {
                                    classes.push(clas);
                                    continue;
                                }
                                const ns = ModelUtils.getNamespaceInNamespaceWithName(exportInfo.getExportClauseName(), nameSpace);
                                if (ns && !nameSpaces.includes(ns)) {
                                    nameSpaces.push(ns);
                                }
                            }
                        }
                        for (const arkClass of classes) {
                            for (const field of arkClass.getFields()) {
                                if (field.isStatic() && field.getInitializer() == undefined) {
                                    ret.add(new ArkStaticFieldRef(field.getSignature()));
                                }
                            }
                        }

                        return ret;
                    } 
                    if (!factEqual(srcStmt.getDef(), dataFact)) {
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
                            if (base == dataFact){
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
                }
                else {
                    const callExpr = srcStmt.getExprs()[0];
                    if (callExpr instanceof ArkInstanceInvokeExpr && dataFact instanceof ArkInstanceFieldRef && callExpr.getBase().getName() == dataFact.getBase().getName()){
                        // todo:base转this
                        const baseType = callExpr.getBase().getType() as ClassType;
                        const arkClass = checkerInstance.scene.getClass(baseType.getClassSignature());
                        const constructor = ModelUtils.getMethodInClassWithName("constructor", arkClass!);
                        const block = [...constructor!.getCfg().getBlocks()][0];
                        for (const stmt of block.getStmts()){
                            const def = stmt.getDef()
                            if (def && def instanceof ArkInstanceFieldRef && def.getBase().getName() == "this" && def.getFieldName() == dataFact.getFieldName()){
                                ret.add(def);
                                break;
                            }
                        }
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
const method = ModelUtils.getMethodWithName("U4",defaultMethod!);
if(method){
    const problem = new UndefinedVariableChecker([...method.getCfg().getBlocks()][0].getStmts()[method.getParameters().length],method);
    const solver = new instanceSolver(problem, scene);
    solver.solve();
    debugger
}
