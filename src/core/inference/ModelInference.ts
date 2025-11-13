/*
 * Copyright (c) 2024-2025 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


import { ModifierType } from '../model/ArkBaseModel';
import { ArkFile } from '../model/ArkFile';
import { ArkAssignStmt, ArkReturnStmt, Stmt } from '../base/Stmt';
import { Value } from '../base/Value';
import { ArkModel, Inference, InferenceFlow, InferenceManager } from './Inference';
import Logger, { LOG_MODULE_TYPE } from '../../utils/logger';
import { ExportInfo } from '../model/ArkExport';
import { ImportInfo } from '../model/ArkImport';
import { fileSignatureCompare, NamespaceSignature } from '../model/ArkSignature';
import { findArkExport, findExportInfoInfile, ModelUtils } from '../common/ModelUtils';
import { ArkMethod } from '../model/ArkMethod';
import { ClassType, FunctionType, GenericType, Type, VoidType } from '../base/Type';
import { TypeInference } from '../common/TypeInference';
import { AbstractFieldRef, ArkParameterRef, ArkStaticFieldRef, GlobalRef } from '../base/Ref';
import { CONSTRUCTOR_NAME, GLOBAL_THIS_NAME, PROMISE } from '../common/TSConst';
import { SdkUtils } from '../common/SdkUtils';
import { IRInference } from '../common/IRInference';
import { Local } from '../base/Local';
import { LEXICAL_ENV_NAME_PREFIX, NAME_PREFIX } from '../common/Const';
import { ArkClass } from '../model/ArkClass';
import { ValueInference } from './ValueInference';
import { AbstractTypeExpr } from '../base/TypeExpr';
import { AbstractInvokeExpr } from '../base/Expr';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'ModelInference');


/**
 * Abstract base class for performing inference on ArkModel instances
 * Implements both Inference and InferenceFlow interfaces to provide
 * a complete inference workflow with pre/post processing capabilities
 */
abstract class ArkModelInference implements Inference, InferenceFlow {
    /**
     * Performs the core inference operation on the provided model
     * @abstract
     * @param model - The ArkModel instance to perform inference on
     * @returns Inference result
     */
    public abstract infer(model: ArkModel): any;

    /**
     * Executes the complete inference workflow with error handling
     * @param model - The ArkModel instance to process
     * @returns Inference result or undefined if an error occurs
     */
    public doInfer(model: ArkModel): any {
        try {
            this.preInfer(model);
            const result = this.infer(model);
            return this.postInfer(model, result);
        } catch (error) {
            logger.warn('infer model failed:' + (error as Error).message);
        }
        return undefined;
    }

    /**
     * Pre-inference hook method for setup and preparation
     * Can be overridden by subclasses to add custom pre-processing logic
     * @param model - The ArkModel instance being processed
     */
    public preInfer(model: ArkModel): void {
    }

    /**
     * Post-inference hook method for cleanup and finalization
     * Can be overridden by subclasses to add custom post-processing logic
     * @param model - The ArkModel instance that was processed
     * @param result
     */
    public postInfer(model: ArkModel, result?: any): any {
    }
}

export abstract class ImportInfoInference extends ArkModelInference {
    protected fromFile: ArkFile | null = null;

    /**
     * get arkFile and assign to from file
     * @param fromInfo
     */
    public abstract preInfer(fromInfo: ImportInfo): void;

    /**
     * find export from file
     * @param fromInfo
     */
    public infer(fromInfo: ImportInfo): ExportInfo | null {
        const file = this.fromFile;
        if (!file) {
            logger.warn(`${fromInfo.getOriginName()} ${fromInfo.getFrom()} file not found: ${fromInfo.getDeclaringArkFile()?.getFileSignature()?.toString()}`);
            return null;
        }
        if (fileSignatureCompare(file.getFileSignature(), fromInfo.getDeclaringArkFile().getFileSignature())) {
            for (let exportInfo of file.getExportInfos()) {
                if (exportInfo.getOriginName() === fromInfo.getOriginName()) {
                    exportInfo.setArkExport(file.getDefaultClass());
                    return exportInfo;
                }
            }
            return null;
        }
        let exportInfo = findExportInfoInfile(fromInfo, file) || null;
        if (exportInfo === null) {
            logger.warn('export info not found, ' + fromInfo.getFrom() + ' in file: ' + fromInfo.getDeclaringArkFile().getFileSignature().toString());
            return null;
        }
        const arkExport = findArkExport(exportInfo);
        exportInfo.setArkExport(arkExport);
        if (arkExport) {
            exportInfo.setExportClauseType(arkExport.getExportType());
        }
        return exportInfo;
    }

    /**
     * cleanup fromFile and set exportInfo
     * @param fromInfo
     * @param exportInfo
     */
    public postInfer(fromInfo: ImportInfo, exportInfo: ExportInfo | null): void {
        if (exportInfo) {
            fromInfo.setExportInfo(exportInfo);
        }
        this.fromFile = null;
    }
}

export class FileInference extends ArkModelInference {
    private importInfoInference: ImportInfoInference;
    private classInference: ClassInference;

    constructor(importInfoInference: ImportInfoInference, classInference: ClassInference) {
        super();
        this.importInfoInference = importInfoInference;
        this.classInference = classInference;
    }

    public getClassInference(): ClassInference {
        return this.classInference;
    }

    /**
     * Pre-inference phase - processes unresolved import information in the file
     * @param {ArkFile} file
     */
    public preInfer(file: ArkFile): void {
        file.getImportInfos().filter(i => i.getExportInfo() === undefined)
            .forEach(info => this.importInfoInference.doInfer(info));

    }

    /**
     * Main inference phase - processes all arkClass definitions in the file
     * @param {ArkFile} file
     */
    public infer(file: ArkFile): void {
        ModelUtils.getAllClassesInFile(file).forEach(arkClass => this.classInference.doInfer(arkClass));
    }

    /**
     * Post-inference phase - processes export information for the file
     * @param {ArkFile} file
     */
    public postInfer(file: ArkFile): void {
        IRInference.inferExportInfos(file);
    }
}

export class ClassInference extends ArkModelInference {
    private methodInference: MethodInference;

    constructor(methodInference: MethodInference) {
        super();
        this.methodInference = methodInference;
    }

    public getMethodInference(): MethodInference {
        return this.methodInference;
    }

    /**
     * Pre-inference phase - processes heritage class information for the class
     * @param {ArkClass} arkClass
     */
    public preInfer(arkClass: ArkClass): void {
        arkClass.getAllHeritageClasses();
    }

    /**
     * Main inference phase - processes all methods in the class
     * @param {ArkClass} arkClass
     */
    public infer(arkClass: ArkClass): void {
        arkClass.getMethods(true).forEach(method => {
            this.methodInference.doInfer(method);
        });
    }
}

interface InferStmtResult {
    oldStmt: Stmt;
    replacedStmts?: Stmt[];
    impactedStmts?: Stmt[];
}

export class MethodInference extends ArkModelInference {
    private stmtInference: StmtInference;

    /** Set to track visited methods for cycle prevention when infer a callback function */
    private callBackVisited: Set<ArkMethod> | undefined;

    private static TIMEOUT_MS = 3000;

    constructor(stmtInference: StmtInference) {
        super();
        this.stmtInference = stmtInference;
    }

    /**
     * Marks a method as visited to prevent infinite recursion
     * @param {ArkMethod} method - The method to mark as visited
     */
    public markVisited(method: ArkMethod): void {
        if (!this.callBackVisited) {
            this.callBackVisited = new Set<ArkMethod>();
        }
        this.callBackVisited.add(method);
    }

    /**
     * Clears the visited methods set
     */
    public cleanVisited(): void {
        this.callBackVisited = undefined;
    }

    /**
     * Main inference phase - processes all statements in the method body
     * @param {ArkMethod} method - The method to analyze
     * @returns {InferStmtResult[]} Array of modified or impacted statements during inference
     */
    public infer(method: ArkMethod): InferStmtResult[] {
        const modifiedStmts: InferStmtResult[] = [];
        // timeout
        const startTime = Date.now();
        // Check for cycle prevention
        if (this.callBackVisited) {
            if (this.callBackVisited.has(method)) {
                return modifiedStmts;
            } else {
                this.callBackVisited.add(method);
            }
        }
        const body = method.getBody();
        if (!body) {
            return modifiedStmts;
        }
        // Process used globals
        body.getUsedGlobals()?.forEach((value, key) => {
            if (value instanceof GlobalRef && !value.getRef()) {
                const global = ModelUtils.findGlobalRef(key, method);
                if (global instanceof Local) {
                    const set = new Set(global.getUsedStmts());
                    value.getUsedStmts().filter(f => !set.has(f)).forEach(stmt => global.addUsedStmt(stmt));
                    value.setRef(global);
                }
            }
        });

        const workList = new Set(body.getCfg().getStmts());
        for (let stmt of workList) {
            if (Date.now() - startTime > MethodInference.TIMEOUT_MS) {
                logger.error(`Inference timeout for method: ${method.getName()}`);
                return modifiedStmts;
            }
            const result = this.stmtInference.doInfer(stmt);
            if (!result) {
                continue;
            }
            const inferResult = result as InferStmtResult;
            // collect modified Stmts to update CFG
            if (inferResult.replacedStmts) {
                modifiedStmts.push(inferResult);
            }
            // Add impacted statements to work list
            inferResult.impactedStmts?.filter(s => !workList.has(s)).forEach(e => workList.add(e));
            workList.delete(stmt);
        }
        return modifiedStmts;
    }

    /**
     * Post-inference phase - updates CFG and infers return type
     * @param {ArkMethod} method - The method that was analyzed
     * @param {InferStmtResult[]} modifiedStmts - Modified statements from inference phase
     */
    public postInfer(method: ArkMethod, modifiedStmts: InferStmtResult[]): void {
        // Update CFG
        const cfg = method.getCfg();
        if (modifiedStmts.length > 0 && cfg) {
            modifiedStmts.forEach(m => {
                cfg.insertAfter(m.replacedStmts!, m.oldStmt);
                cfg.remove(m.oldStmt);
            });
        }
        //infers return type
        if (!method.getBody() || method.getName() === CONSTRUCTOR_NAME ||
            !TypeInference.isUnclearType(method.getImplementationSignature()?.getMethodSubSignature().getReturnType())) {
            return;
        }
        const returnType = TypeInference.inferReturnType(method);
        if (returnType) {
            method.getImplementationSignature()?.getMethodSubSignature().setReturnType(returnType);
        }
    }
}


export class StmtInference extends ArkModelInference {
    private valueInferences: Map<string, ValueInference<Value>>;

    constructor(valueInferences: ValueInference<Value>[]) {
        super();
        this.valueInferences = new Map();
        valueInferences.forEach(v => this.valueInferences.set(v.getValueName(), v));
    }

    /**
     * Main inference phase - processes a statement and its associated values
     * @param {Stmt} stmt - The statement to analyze
     * @returns {Type | undefined} The original definition type before inference
     */
    public infer(stmt: Stmt): Type | undefined {
        const defType = stmt.getDef()?.getType();
        stmt.getDefAndUses().forEach(value => this.inferValue(value, stmt));
        return defType;
    }

    /**
     * Post-inference phase - handles type propagation and impact analysis
     * @param {Stmt} stmt - The statement that was analyzed
     * @param {Type | undefined} defType - The original definition type before inference
     * @returns {InferStmtResult | undefined} Inference result with impacted statements
     */
    public postInfer(stmt: Stmt, defType: Type | undefined): InferStmtResult | undefined {
        const method = stmt.getCfg().getDeclaringMethod();
        const impactedStmts = this.typeSpread(stmt, method);
        const finalDef = stmt.getDef();
        if (defType !== finalDef?.getType() && finalDef instanceof Local &&
            (method.getBody()?.getUsedGlobals()?.get(finalDef.getName()) || !finalDef.getName().startsWith(NAME_PREFIX))) {
            finalDef.getUsedStmts().forEach(e => impactedStmts.add(e));
        }
        return impactedStmts.size > 0 ? { oldStmt: stmt, impactedStmts: Array.from(impactedStmts) } : undefined;
    }

    /**
     * Recursively infers types for values and their dependencies
     * @param {Value} value - The value to infer
     * @param {Stmt} stmt - The containing statement
     * @param {Set<Value>} visited - Set of already visited values for cycle prevention
     */
    private inferValue(value: Value, stmt: Stmt, visited: Set<Value> = new Set()): void {
        if (visited.has(value)) {
            return;
        } else {
            visited.add(value);
        }
        const name = value.constructor.name;
        const valueInference = this.valueInferences.get(name);
        if (!valueInference) {
            logger.debug(name + ' valueInference not found');
            return;
        }
        const type = value.getType();
        if (type instanceof AbstractTypeExpr) {
            type.getUses().forEach(sub => this.inferValue(sub, stmt, visited));
        }
        value.getUses().forEach(sub => this.inferValue(sub, stmt, visited));
        valueInference.doInfer(value, stmt);
    }

    /**
     * Propagates types through statements and handles special cases
     * @param {Stmt} stmt - The statement to process
     * @param {ArkMethod} method - The containing method
     * @returns {Set<Stmt>} Set of statements impacted by type propagation
     */
    public typeSpread(stmt: Stmt, method: ArkMethod): Set<Stmt> {
        let impactedStmts: Set<Stmt>;
        const invokeExpr = stmt.getInvokeExpr();
        // Handle method invocation parameter spreading
        if (invokeExpr) {
            impactedStmts = this.paramSpread(invokeExpr, method);
        } else {
            impactedStmts = new Set<Stmt>();
        }
        if (stmt instanceof ArkAssignStmt) {
            this.transferTypeBidirectional(stmt, method, impactedStmts);
        } else if (stmt instanceof ArkReturnStmt) {
            // Handle return statements with async type resolution
            let returnType = method.getSignature().getType();
            if (method.containsModifier(ModifierType.ASYNC) && returnType instanceof ClassType &&
                returnType.getClassSignature().getClassName() === PROMISE) {
                const realGenericType = returnType.getRealGenericTypes()?.[0];
                if (realGenericType) {
                    returnType = realGenericType;
                }
            }
            IRInference.inferRightWithSdkType(returnType, stmt.getOp().getType(), method.getDeclaringArkClass());
        }

        return impactedStmts;
    }

    /**
     * Transfers types bidirectionally in assignment statements
     * @param {ArkAssignStmt} stmt - The assignment statement
     * @param {ArkMethod} method - The containing method
     * @param {Set<Stmt>} impactedStmts - Set to collect impacted statements
     */
    private transferTypeBidirectional(stmt: ArkAssignStmt, method: ArkMethod, impactedStmts: Set<Stmt>): void {
        const rightType = stmt.getRightOp().getType();
        const leftOp = stmt.getLeftOp();
        let leftType = leftOp.getType();
        // Transfer type from left to right operand
        this.transferLeft2Right(stmt.getRightOp(), leftType, method)?.forEach(a => impactedStmts.add(a));
        // Transfer type from right to left operand
        this.transferRight2Left(leftOp, rightType, method)?.forEach(a => impactedStmts.add(a));
        // Handle global this references
        if (leftOp instanceof ArkStaticFieldRef) {
            const declaringSignature = leftOp.getFieldSignature().getDeclaringSignature();
            if (declaringSignature instanceof NamespaceSignature && declaringSignature.getNamespaceName() === GLOBAL_THIS_NAME) {
                SdkUtils.computeGlobalThis(leftOp, method);
            }
        }
    }

    public transferLeft2Right(rightOp: Value, leftType: Type, method: ArkMethod): Stmt[] | undefined {
        const projectName = method.getDeclaringArkFile().getProjectName();
        // Skip if left type is unclear or anonymous
        if (TypeInference.isUnclearType(leftType) || TypeInference.isAnonType(leftType, projectName)) {
            return undefined;
        }
        const rightType = rightOp.getType();
        IRInference.inferRightWithSdkType(leftType, rightType, method.getDeclaringArkClass());
        return this.updateValueType(rightOp, leftType, method);
    }

    public transferRight2Left(leftOp: Value, rightType: Type, method: ArkMethod): Stmt[] | undefined {
        if (TypeInference.isUnclearType(rightType)) {
            return undefined;
        }
        return this.updateValueType(leftOp, rightType, method);
    }

    /**
     * Updates the type of a target value and returns impacted statements
     * @param {Value} target - The target value to update
     * @param {Type} srcType - The source type to apply
     * @param {ArkMethod} method - The containing method
     * @returns {Stmt[] | undefined} Array of statements impacted by the type update
     */
    public updateValueType(target: Value, srcType: Type, method: ArkMethod): Stmt[] | undefined {
        const type = target.getType();
        if (type !== srcType && TypeInference.isUnclearType(type)) {
            if (target instanceof Local) {
                target.setType(srcType);
                return target.getUsedStmts();
            } else if (target instanceof AbstractFieldRef) {
                target.getFieldSignature().setType(srcType);
            } else if (target instanceof ArkParameterRef) {
                target.setType(srcType);
            }
        }
        return undefined;
    }

    /**
     * Handles parameter type propagation for method invocations
     * @param {AbstractInvokeExpr} invokeExpr - The invocation expression
     * @param {ArkMethod} method - The containing method
     * @returns {Set<Stmt>} Set of statements impacted by parameter type propagation
     */
    private paramSpread(invokeExpr: AbstractInvokeExpr, method: ArkMethod): Set<Stmt> {
        const realTypes: Type[] = [];
        const result: Set<Stmt> = new Set();
        const len = invokeExpr.getArgs().length;
        const parameters = invokeExpr.getMethodSignature().getMethodSubSignature().getParameters()
            .filter(p => !p.getName().startsWith(LEXICAL_ENV_NAME_PREFIX));
        // Map arguments to parameters
        for (let index = 0; index < len; index++) {
            const arg = invokeExpr.getArg(index);
            if (index >= parameters.length) {
                break;
            }
            const paramType = parameters[index].getType();
            this.mapArgWithParam(arg, paramType, invokeExpr, method, realTypes)?.forEach(a => result.add(a));
        }
        // Set real generic types for the invocation
        if (realTypes.length > 0 && !invokeExpr.getRealGenericTypes()) {
            invokeExpr.setRealGenericTypes(realTypes);
        }
        return result;
    }

    /**
     * Maps argument types to parameter types and handles callback inference
     */
    private mapArgWithParam(arg: Value, paramType: Type, invokeExpr: AbstractInvokeExpr, method: ArkMethod, realTypes: Type[]): Stmt[] | undefined {
        const argType = arg.getType();
        const scene = method.getDeclaringArkFile().getScene();
        // Infer argument with parameter type
        IRInference.inferArg(invokeExpr, argType, paramType, scene, realTypes);
        // Handle callback function inference
        if (argType instanceof FunctionType) {
            const callback = scene.getMethod(argType.getMethodSignature());
            const paramLength = callback?.getImplementationSignature()?.getParamLength();
            // Infer callback method if it has parameters
            if (callback && paramLength && paramLength > 0) {
                const inference = InferenceManager.getInstance().getInference(callback.getDeclaringArkFile().getLanguage());
                if (inference instanceof FileInference) {
                    const methodInference = inference.getClassInference().getMethodInference();
                    methodInference.markVisited(method);
                    methodInference.doInfer(callback);
                    methodInference.cleanVisited();
                }
            }
            // Infer map function return type for generic resolution
            const returnType = argType.getMethodSignature().getMethodSubSignature().getReturnType();
            if (!TypeInference.isUnclearType(returnType) && !(returnType instanceof VoidType) && paramType instanceof FunctionType) {
                const declareReturnType = paramType.getMethodSignature().getMethodSubSignature().getReturnType();
                const realGenericTypes = invokeExpr.getRealGenericTypes();
                if (declareReturnType instanceof GenericType && realGenericTypes && !realGenericTypes[declareReturnType.getIndex()]) {
                    realGenericTypes[declareReturnType.getIndex()] = returnType;
                }
            }
        }
        // Update argument type if parameter type is clear
        if (!TypeInference.isUnclearType(paramType) && !TypeInference.isAnonType(paramType, scene.getProjectName())) {
            return this.updateValueType(arg, paramType, method);
        }
        return undefined;
    }


}