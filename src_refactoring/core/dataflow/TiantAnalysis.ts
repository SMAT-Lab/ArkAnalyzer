
import { Scene } from "../../Scene";
import { ArkBody } from "../model/ArkBody";
import { DataflowProblem, FlowFunction } from "./DataflowProblem"
import { Local } from "../base/Local"
import { Value } from "../base/Value"
import { ArkAssignStmt, ArkInvokeStmt, ArkReturnStmt, Stmt } from "../base/Stmt"
import { ArkMethod } from "../model/ArkMethod";
import { Constant } from "../base/Constant"
import { AbstractFieldRef, ArkInstanceFieldRef, ArkParameterRef, ArkStaticFieldRef } from "../base/Ref";
import { DataflowSolver } from "./DataflowSolver"
import { AbstractInvokeExpr, ArkBinopExpr, ArkInstanceInvokeExpr, ArkStaticInvokeExpr } from "../base/Expr";
import { UndefinedType } from "../base/Type";
import { factEqual } from "./DataflowSolver";
import { FileSignature } from "../model/ArkSignature";
import { NamespaceSignature } from "../model/ArkSignature";
import { ArkClass } from "../model/ArkClass";
import Logger from "../../utils/logger";
import { ArkNamespace } from "../model/ArkNamespace";
import * as fs from 'fs';
const logger = Logger.getLogger();

export class TiantAnalysisChecker extends DataflowProblem<Value> {
    zeroValue: Constant = new Constant('zeroValue', UndefinedType.getInstance());
    entryPoint: Stmt;
    entryMethod: ArkMethod;
    scene: Scene;
    classMap: Map<FileSignature | NamespaceSignature, ArkClass[]>;
    globalVariableMap: Map<FileSignature | NamespaceSignature, Local[]>;
    sources: ArkMethod[];
    sinks: ArkMethod[];
    constructor(stmt: Stmt, method: ArkMethod){
        super();
        this.entryPoint = stmt;
        this.entryMethod = method;
        this.scene = method.getDeclaringArkFile().getScene();
        this.classMap = this.scene.getClassMap();
        this.globalVariableMap = this.scene.getGlobalVariableMap();
    }

    getEntryPoint(): Stmt {
        return this.entryPoint;
    }

    getEntryMethod(): ArkMethod {
        return this.entryMethod;
    }

    private callSource(val: Value): boolean {
        if (val instanceof AbstractInvokeExpr) {
            for (const source of this.sources) {
                if (source.getSignature() == val.getMethodSignature()) {
                    return true;
                }
            }
        }
        return false;
    }

    public setSources(methods: ArkMethod[]): void {
        this.sources = methods;
    }

    public setSinks(methods: ArkMethod[]): void {
        this.sinks = methods;
    }

    getNormalFlowFunction(srcStmt:Stmt, tgtStmt:Stmt): FlowFunction<Value> {
        let checkerInstance: TiantAnalysisChecker = this;
        return new class implements FlowFunction<Value> {
            getDataFacts(dataFact: Value): Set<Value> {
                let ret: Set<Value> = new Set();
                if (checkerInstance.getEntryPoint() == srcStmt && checkerInstance.getZeroValue() == dataFact) {
                    let entryMethod = checkerInstance.getEntryMethod();
                    let body: ArkBody = entryMethod.getBody();
                    const parameters =  [...entryMethod.getCfg().getBlocks()][0].getStmts().slice(0,entryMethod.getParameters().length);
                    for (let i = 0; i < parameters.length;i++) {
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
                    let stmt: ArkAssignStmt = (srcStmt as ArkAssignStmt);
                    let assigned: Value = stmt.getLeftOp();
                    let rightOp: Value = stmt.getRightOp();
                    if (checkerInstance.getZeroValue() == dataFact) {
                        if (checkerInstance.callSource(rightOp)) {
                            ret.add(assigned);
                        }
                    } else if (factEqual(rightOp, dataFact) || rightOp.getType() instanceof UndefinedType) {
                        ret.add(assigned);
                        if (assigned instanceof ArkInstanceFieldRef) {
                            // 往前找到assigned的base的最后一次赋值
                            // const base = assigned.getBase();
                            // const aliasObjects = findAliasObjects(base, stmt);

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

    getCallFlowFunction(srcStmt:Stmt, method:ArkMethod): FlowFunction<Value> {
        let checkerInstance: TiantAnalysisChecker = this;
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
                } else {
                    const callExpr = srcStmt.getExprs()[0] as AbstractInvokeExpr;
                    if (callExpr instanceof ArkInstanceInvokeExpr && dataFact instanceof ArkInstanceFieldRef && callExpr.getBase().getName() == dataFact.getBase().getName()){
                        // todo:base转this
                        const _this = [...srcStmt.getCfg()!.getBlocks()][0].getStmts()[0].getDef();
                        const thisRef = new ArkInstanceFieldRef(_this as Local, dataFact.getFieldSignature());
                        ret.add(thisRef);
                    } else if (callExpr instanceof ArkStaticInvokeExpr && dataFact instanceof ArkStaticFieldRef && callExpr.getMethodSignature().getDeclaringClassSignature() == dataFact.getFieldSignature().getDeclaringClassSignature()){
                        ret.add(dataFact);
                    }
                    for (const sink of checkerInstance.sinks) {
                        if (callExpr.getMethodSignature() == sink.getSignature()) {
                            for (const param of callExpr.getArgs()) {
                                if (factEqual(param, dataFact)) {
                                    console.log("source: " + dataFact);
                                    console.log("sink: "+ srcStmt.getOriginPositionInfo().toString() + ", " + srcStmt.toString());
                                }
                            }
                        }
                    }
                }
                const callStmt = srcStmt as ArkInvokeStmt;
                const args = callStmt.getInvokeExpr().getArgs();
                for (let i = 0; i < args.length; i++){
                    if (args[i] == dataFact || checkerInstance.callSource(args[i]) && checkerInstance.getZeroValue() == dataFact){
                        const realParameter = [...method.getCfg().getBlocks()][0].getStmts()[i].getDef();
                        if (realParameter)
                            ret.add(realParameter);
                    } else if (dataFact instanceof ArkInstanceFieldRef && dataFact.getBase().getName() == args[i].toString()){
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

    getExitToReturnFlowFunction(srcStmt:Stmt, tgtStmt:Stmt, callStmt:Stmt): FlowFunction<Value> {
        let checkerInstance: TiantAnalysisChecker = this;
        return new class implements FlowFunction<Value> {
            getDataFacts(dataFact: Value): Set<Value> {
                let ret: Set<Value> = new Set<Value>();
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
                        if (checkerInstance.callSource(retVal) || checkerInstance.callSource(ass.getRightOp())) {
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

    getCallToReturnFlowFunction(srcStmt:Stmt, tgtStmt:Stmt): FlowFunction<Value> {
        let checkerInstance: TiantAnalysisChecker = this;
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

    createZeroValue(): Value {
        return this.zeroValue;
    }

    getZeroValue(): Value {
        return this.zeroValue;
    }

    Json2ArkMethod(path: string): ArkMethod[] {
        
        let arkMethods: ArkMethod[] = [];
        const data = fs.readFileSync(path, 'utf-8');
        const objects = JSON.parse(data)
        for (const object of objects) {
            const file = this.scene.getSdkArkFilestMap().get(object.file);
            if (!file) {
                console.log("no file: " + object.file);
                continue;
            }
            let arkClass: ArkClass | null = null;
            if (object.namespace == "_") {
                for (const clas of file.getClasses()) {
                    if (clas.getName() == object.class) {
                        arkClass = clas;
                        break;
                    }
                }
            } else {
                let arkNamespace: ArkNamespace | null = null;
                for (const ns of file.getNamespaces()) {
                    if (ns.getName() == object.namespace) {
                        arkNamespace = ns;
                        break;
                    }
                }
                if (arkNamespace) {
                    for (const clas of arkNamespace.getClasses()) {
                        if (clas.getName() == object.class) {
                            arkClass = clas;
                            break;
                        }
                    }
                } else {
                    console.log("no namespace: " + object.namespace);
                    continue;
                }
            }
            if (!arkClass) {
                console.log("no class: " + object.class);
                continue;
            } else {
                let arkMethod: ArkMethod | null = null;
                for (const method of arkClass.getMethods()) {
                    if (method.getName() == object.method) {
                        arkMethod = method;
                        break;
                    }
                }
                if (arkMethod) {
                    arkMethods.push(arkMethod);
                } else {
                    console.log("no method: " + object.method);
                    continue;
                }
            }
        }
        return arkMethods;
    }

    public addSinksFromJson
}

export class TiantAnalysisSolver extends DataflowSolver<Value> {
    constructor(problem: TiantAnalysisChecker, scene: Scene){
        super(problem, scene);
    }
}