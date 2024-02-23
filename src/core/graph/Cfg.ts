import { DefUseChain } from "../base/DefUseChain";
import { Local } from "../base/Local";
import { Stmt } from "../base/Stmt";
import { ArkClass } from "../model/ArkClass";
import { BasicBlock } from "./BasicBlock";

export class Cfg {
    private blocks: Set<BasicBlock> = new Set();
    private stmtToBlock: Map<Stmt, BasicBlock> = new Map();
    private startingStmt: Stmt = new Stmt();

    private defUseChains: DefUseChain[] = [];
    declaringClass: ArkClass;

    constructor() {

    }

    public getStmts(): Stmt[] {
        let stmts = new Array<Stmt>();
        for (const block of this.blocks) {
            stmts.push(...block.getStmts());
        }
        return stmts;
    }

    // TODO
    public insertBefore(beforeStmt: Stmt, newStmt: Stmt): void {
        const block = this.stmtToBlock.get(beforeStmt) as BasicBlock;
        // Simplify edition just for SSA
        block.addStmtToFirst(newStmt);
        this.stmtToBlock.set(newStmt, block);
    }

    // TODO: 添加block之间的边
    public addBlock(block: BasicBlock): void {
        this.blocks.add(block);

        for (const stmt of block.getStmts()) {
            this.stmtToBlock.set(stmt, block);
        }
    }


    public getBlocks(): Set<BasicBlock> {
        return this.blocks;
    }


    public getStartingBlock(): BasicBlock | undefined {
        return this.stmtToBlock.get(this.startingStmt);
    }

    public getStartingStmt(): Stmt {
        return this.startingStmt;
    }

    public setStartingStmt(newStartingStmt: Stmt): void {
        this.startingStmt = newStartingStmt;
    }

    // TODO: 整理成类似jimple的输出
    public toString(): string {
        return 'cfg';
    }


    buildDefUseChain() {
        const locals: Set<Local> = new Set();
        for (const block of this.blocks) {
            for (let stmtIndex = 0; stmtIndex < block.getStmts().length; stmtIndex++) {
                const stmt = block.getStmts()[stmtIndex];
                // 填declareStmt
                const defValue = stmt.getDef()
                if (defValue && defValue instanceof Local && !locals.has(defValue)) {
                    defValue.setDeclaringStmt(stmt);
                    locals.add(defValue);
                }

                for (const value of stmt.getUses()) {
                    if (value instanceof Local) {
                        const local = value as Local;
                        local.addUsedStmt(stmt)
                    }
                    const name = value.toString();
                    const defStmts: Stmt[] = [];
                    // 判断本block之前有无对应def
                    for (let i = stmtIndex - 1; i >= 0; i--) {
                        const beforeStmt = block.getStmts()[i];
                        if (beforeStmt.getDef() && beforeStmt.getDef()?.toString() == name) {
                            defStmts.push(beforeStmt);
                            break;
                        }
                    }
                    // 本block有对应def直接结束,否则找所有的前序block
                    if (defStmts.length != 0) {
                        this.defUseChains.push(new DefUseChain(value, defStmts[0], stmt));
                    }
                    else {
                        const needWalkBlocks: BasicBlock[] = [];
                        for (const predecessor of block.getPredecessors()) {
                            needWalkBlocks.push(predecessor);
                        }
                        const walkedBlocks = new Set();
                        while (needWalkBlocks.length > 0) {
                            const predecessor = needWalkBlocks.pop();
                            if (!predecessor) {
                                return;
                            }
                            const predecessorStmts = predecessor.getStmts();
                            let predecessorHasDef = false;
                            for (let i = predecessorStmts.length - 1; i >= 0; i--) {
                                const beforeStmt = predecessorStmts[i];
                                if (beforeStmt.getDef() && beforeStmt.getDef()?.toString() == name) {
                                    defStmts.push(beforeStmt);
                                    predecessorHasDef = true;
                                    break;
                                }
                            }
                            if (!predecessorHasDef) {
                                for (const morePredecessor of predecessor.getPredecessors()) {
                                    if (!walkedBlocks.has(morePredecessor))
                                        needWalkBlocks.unshift(morePredecessor);
                                }
                            }
                            walkedBlocks.add(predecessor);
                        }
                        for (const def of defStmts) {
                            this.defUseChains.push(new DefUseChain(value, def, stmt))
                        }
                    }
                }
            }
        }
    }

    // public typeReference() {
    //     for (let block of this.blocks) {
    //         for (let stmt of block.getStmts()) {
    //             // complete signature
    //             for (const expr of stmt.getExprs()) {
    //                 if (expr instanceof ArkNewExpr) {
    //                     const typeStr = this.getTypeNewExpr(expr);
    //                     expr.setClassSignature(typeStrToClassSignature(typeStr));
    //                 } else if (expr instanceof ArkInstanceInvokeExpr) {
    //                     // console.log('base type:',expr.getBase().getType());

    //                     const classSignature = typeStrToClassSignature(expr.getBase().getType());
    //                     const className = classSignature.getClassType();
    //                     const arkFile = this.declaringClass.getDeclaringArkFile();
    //                     const typeStr = searchImportMessage(arkFile, className, matchClassInFile);
    //                     // console.log('typeStr:',typeStr);

    //                     const methodSignature = expr.getMethodSignature();
    //                     methodSignature.setArkClass(typeStrToClassSignature(typeStr));
    //                 } else if (expr instanceof ArkStaticInvokeExpr) {
    //                     const methodSignature = expr.getMethodSignature();
    //                     const funcName = methodSignature.getMethodSubSignature().getMethodName();
    //                     let methodSignatureKey = this.declaringClass.getDeclaringArkFile().getArkSignature() + '.' + funcName;
    //                     const arkInstancesMap = this.declaringClass.getDeclaringArkFile().getScene().getArkInstancesMap();
    //                     const method = arkInstancesMap.get(methodSignatureKey);

    //                     let newMethodSignature = new MethodSignature();
    //                     newMethodSignature.setMethodSubSignature(methodSignature.getMethodSubSignature());
    //                     if (method instanceof ArkMethod) {
    //                         // method is in this file
    //                         newMethodSignature = method.getSignature();
    //                     } else if (method instanceof ImportInfo) {
    //                         // method from import
    //                         const targetArkSignatureKey = method.getTargetArkSignature();
    //                         const arkMethod = arkInstancesMap.get(targetArkSignatureKey);
    //                         if (arkMethod instanceof ArkMethod) {
    //                             newMethodSignature = arkMethod.getSignature();
    //                         }
    //                     }
    //                     expr.setMethodSignature(newMethodSignature);
    //                 }
    //             }

    //             // console.log(stmt.toString())
    //             if (stmt instanceof ArkAssignStmt) {
    //                 const leftOp = stmt.getLeftOp();
    //                 const rightOp = stmt.getRightOp();
    //                 let leftPossibleTypes: string[] = []
    //                 if (leftOp instanceof Local) {
    //                     // console.log(stmt.toString())
    //                     if (leftOp.getType() != "" && leftOp.getType() != "any") {
    //                         // 若存在变量类型声明，则进行解析
    //                         let leftOpTypes = splitType(leftOp.getType(), '|')
    //                         for (let leftOpType of leftOpTypes) {
    //                             if (isPrimaryType(leftOpType)) {
    //                                 // leftPossibleTypes.push(leftOpType)
    //                             } else {
    //                                 let classInstanceName = searchImportMessage(
    //                                     this.declaringClass.getDeclaringArkFile(),
    //                                     leftOpType, matchClassInFile);
    //                                 // leftPossibleTypes.push(classInstanceName)
    //                                 // if (!leftOpType.includes('.')) {
    //                                 //     //类名解析
    //                                 //     let classInstanceName = searchImportMessage(
    //                                 //         this.declaringClass.getDeclaringArkFile(),
    //                                 //         leftOpType, matchClassInFile);
    //                                 //     leftPossibleTypes.push(classInstanceName)
    //                                 // } else {
    //                                 //     //类属性解析
    //                                 //     let fieldNames = splitType(leftOpType, '.')
    //                                 //     let fieldArkFile = this.declaringClass.getDeclaringArkFile()
    //                                 //     let resolveResult = resolveClassInstanceField(fieldNames, fieldArkFile)
    //                                 //     if (resolveResult != null)
    //                                 //         leftPossibleTypes.push(resolveResult)
    //                                 // }
    //                             }
    //                         }
    //                         leftOp.setType(transformArrayToString(leftPossibleTypes))
    //                         if (this.declaringClass.getDeclaringArkFile().getName() == "main.ts") {
    //                             // console.log("stmt: " + stmt.toString())
    //                             // console.log("\t" + leftOp.getType())
    //                         }
    //                         // continue
    //                     }
    //                     if (rightOp instanceof ArkNewExpr) {
    //                         if (leftOp.getType() == "" || leftOp.getType() == "any") {
    //                             leftOp.setType(rightOp.getClassSignature().toString());
    //                         }
    //                     } else if (rightOp instanceof ArkBinopExpr) {
    //                         let op1 = rightOp.getOp1()
    //                         let op2 = rightOp.getOp2()
    //                         let op1Type: string, op2Type: string
    //                         if (op1 instanceof Local) {
    //                             let declaringStmt = op1.getDeclaringStmt()
    //                             if (declaringStmt instanceof ArkAssignStmt) {
    //                                 op1Type = (<Local>(declaringStmt.getLeftOp())).getType()
    //                             }
    //                         } else if (op1 instanceof Constant) {
    //                             op1Type = op1.getType()
    //                         }
    //                         if (op2 instanceof Local) {
    //                             let declaringStmt = op2.getDeclaringStmt()
    //                             if (declaringStmt instanceof ArkAssignStmt) {
    //                                 op2Type = (<Local>(declaringStmt.getLeftOp())).getType()
    //                             }
    //                         } else if (op2 instanceof Constant) {
    //                             op2Type = op2.getType()
    //                         }
    //                         leftOp.setType(resolveBinaryResultType(op1Type!, op2Type!, rightOp.getOperator()));
    //                     } else if (rightOp instanceof ArkCastExpr) {
    //                         // TODO
    //                     } else if (rightOp instanceof ArkInstanceFieldRef) {
    //                         let completeClassNames = splitType(rightOp.getBase().getType(), '|')
    //                         for (let completeClassName of completeClassNames) {
    //                             let lastDotIndex = completeClassName.lastIndexOf('.')
    //                             let targetArkFile = getArkFileByName(
    //                                 completeClassName.substring(0, lastDotIndex),
    //                                 this.declaringClass.getDeclaringArkFile().getScene()
    //                             )
    //                             let classInstance = resolveClassInstance(
    //                                 completeClassName, targetArkFile)
    //                             if (classInstance != null) {
    //                                 for (let field of classInstance.getFields()) {
    //                                     if (field.getName() === rightOp.getFieldName()) {
    //                                         let fieldTypes = splitType(field.getType(), '|')
    //                                         for (let fieldType of fieldTypes) {
    //                                             if (isPrimaryTypeKeyword(fieldType)) {
    //                                                 leftPossibleTypes.push(resolvePrimaryTypeKeyword(fieldType))
    //                                             } else {
    //                                                 let classInstanceFile = getArkFileByName(
    //                                                     classInstance.getSignature().getArkFile(),
    //                                                     this.declaringClass.getDeclaringArkFile().getScene())
    //                                                 if (classInstanceFile != null) {
    //                                                     let fieldTypeClassName = searchImportMessage(
    //                                                         classInstanceFile,
    //                                                         fieldType,
    //                                                         matchClassInFile
    //                                                     )
    //                                                     if (fieldTypeClassName === "")
    //                                                         continue
    //                                                     leftPossibleTypes.push(fieldTypeClassName)
    //                                                 }
    //                                             }
    //                                         }
    //                                     }
    //                                 }
    //                             }
    //                         }
    //                         leftOp.setType(transformArrayToString(leftPossibleTypes))
    //                     } else if (rightOp instanceof Local) {
    //                         let rightOpTypes = splitType(rightOp.getType(), '|')
    //                         for (let rightOpType of rightOpTypes) {
    //                             if (isPrimaryType(rightOpType)) {
    //                                 leftPossibleTypes.push(rightOpType)
    //                             } else {
    //                                 if (!rightOpType.includes(".")) {
    //                                     let completeClassName = searchImportMessage(
    //                                         this.declaringClass.getDeclaringArkFile(),
    //                                         rightOpType, matchClassInFile)
    //                                     leftPossibleTypes.push(completeClassName)
    //                                 } else {
    //                                     leftPossibleTypes.push(rightOpType)
    //                                 }
    //                             }
    //                         }
    //                         leftOp.setType(transformArrayToString(leftPossibleTypes))
    //                     } else if (rightOp instanceof Constant) {
    //                         // console.log(rightOp)
    //                         leftOp.setType(rightOp.getType())
    //                         // } else if (rightOp instanceof ArkStaticInvokeExpr && (leftOp.getType()=="" || leftOp.getType()=="any")){
    //                         // const staticInvokeExpr=rightOp as ArkStaticInvokeExpr;
    //                         // if(staticInvokeExpr.toString().includes("<AnonymousFunc-")){
    //                         // leftOp.setType("Callable");
    //                         // }/
    //                     } else if (rightOp instanceof ArkInstanceInvokeExpr) {
    //                         const inputString: string = rightOp.getMethodSignature().toString();
    //                         const regex = /<([^>]+)>/g;
    //                         const matches: string[] = [];
    //                         let match;
    //                         while ((match = regex.exec(inputString)) !== null) {
    //                             const contentInsideAngleBrackets = match[1]; // 获取匹配的内容（去掉尖括号）
    //                             matches.push(contentInsideAngleBrackets);
    //                         }
    //                         let modefiedList = matches.map(str => str.replace("()", ""));
    //                         modefiedList = modefiedList.map(str => str.replace(".ts", ""));
    //                         modefiedList = modefiedList.map(str => str.replace("\\", "/"));

    //                         let methodMapSignature = "";
    //                         for (let i = 0; i < modefiedList.length; i++) {
    //                             if (i == 0 && i != modefiedList.length - 1) {
    //                                 methodMapSignature += '<' + modefiedList[i] + '>.';
    //                             }
    //                             else if (i != modefiedList.length - 1) {
    //                                 methodMapSignature += modefiedList[i] + '.';
    //                             }
    //                             else {
    //                                 methodMapSignature += modefiedList[i];
    //                             }
    //                         }
    //                         const map = this.declaringClass.getDeclaringArkFile().getScene().getArkInstancesMap();
    //                         const method = map.get(methodMapSignature);
    //                         if (method && method instanceof ArkMethod)
    //                             leftOp.setType(method.getReturnType().join('|'));
    //                     } else if (rightOp instanceof ArkStaticInvokeExpr) {
    //                         const inputString: string = rightOp.getMethodSignature().toString();
    //                         const regex = /<([^>]+)>/g;
    //                         const matches: string[] = [];
    //                         let match;
    //                         while ((match = regex.exec(inputString)) !== null) {
    //                             const contentInsideAngleBrackets = match[1]; // 获取匹配的内容（去掉尖括号）
    //                             matches.push(contentInsideAngleBrackets);
    //                         }
    //                         let modefiedList = matches.map(str => str.replace("()", ""));
    //                         modefiedList = modefiedList.map(str => str.replace(".ts", ""));
    //                         modefiedList = modefiedList.map(str => str.replace("\\", "/"));

    //                         let methodMapSignature = this.declaringClass.getDeclaringArkFile().getArkSignature() + '.';
    //                         for (let i = 0; i < modefiedList.length; i++) {
    //                             if (i == 0 && i != modefiedList.length - 1) {
    //                                 methodMapSignature += '<' + modefiedList[i] + '>.';
    //                             }
    //                             else if (i != modefiedList.length - 1) {
    //                                 methodMapSignature += modefiedList[i] + '.';
    //                             }
    //                             else {
    //                                 methodMapSignature += modefiedList[i];
    //                             }
    //                         }
    //                         const map = this.declaringClass.getDeclaringArkFile().getScene().getArkInstancesMap();
    //                         const method = map.get(methodMapSignature);
    //                         if (method && method instanceof ArkMethod)
    //                             leftOp.setType(method.getReturnType().join('|'));
    //                     } else if (rightOp instanceof ArkThisRef) {
    //                         leftOp.setType(rightOp.getType())
    //                     } else if (rightOp instanceof ArkParameterRef) {
    //                         let rightOpTypes = splitType(rightOp.getType(), '|')
    //                         for (let rightOpType of rightOpTypes) {
    //                             if (isPrimaryTypeKeyword(rightOpType)) {
    //                                 leftPossibleTypes.push(resolvePrimaryTypeKeyword(rightOpType))
    //                             } else {
    //                                 let completeClassName = searchImportMessage(
    //                                     this.declaringClass.getDeclaringArkFile(),
    //                                     rightOpType, matchClassInFile)
    //                                 leftPossibleTypes.push(completeClassName)
    //                             }
    //                         }
    //                         leftOp.setType(transformArrayToString(leftPossibleTypes))
    //                     }
    //                 }
    //             }
    //         }
    //     }
    // }


    // private getTypeNewExpr(newExpr: ArkNewExpr): string {
    //     const className = newExpr.getClassSignature().getClassType();
    //     const file = this.declaringClass.getDeclaringArkFile();
    //     return searchImportMessage(file, className, matchClassInFile);
    // }
}