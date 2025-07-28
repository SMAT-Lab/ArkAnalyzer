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
import { ArkMethod } from '../model/ArkMethod';
import {
    AliasType,
    AnnotationNamespaceType,
    AnyType,
    ArrayType,
    ClassType,
    FunctionType,
    GenericType,
    LexicalEnvType,
    NullType,
    Type,
    UnclearReferenceType,
    UndefinedType,
    UnionType,
    UnknownType,
} from '../base/Type';
import { Local } from '../base/Local';
import { TypeInference } from './TypeInference';
import {
    AbstractExpr,
    AbstractInvokeExpr,
    AliasTypeExpr,
    ArkInstanceInvokeExpr,
    ArkPtrInvokeExpr,
    ArkStaticInvokeExpr
} from '../base/Expr';
import Logger, { LOG_MODULE_TYPE } from '../../utils/logger';
import { Scene } from '../../Scene';
import { ArkClass } from '../model/ArkClass';
import { findArkExport, ModelUtils } from './ModelUtils';
import { ArkField, FieldCategory } from '../model/ArkField';
import { CALL_BACK } from './EtsConst';
import {
    AliasClassSignature,
    BaseSignature,
    ClassSignature,
    FieldSignature, FileSignature,
    MethodSignature,
    MethodSubSignature
} from '../model/ArkSignature';
import { CONSTRUCTOR_NAME, FUNCTION, IMPORT, SUPER_NAME, THIS_NAME } from './TSConst';
import { Builtin } from './Builtin';
import { ArkBody } from '../model/ArkBody';
import { ArkAssignStmt, ArkInvokeStmt } from '../base/Stmt';
import {
    AbstractFieldRef,
    AbstractRef,
    ArkArrayRef,
    ArkInstanceFieldRef,
    ArkParameterRef,
    ArkStaticFieldRef
} from '../base/Ref';
import { Value } from '../base/Value';
import { Constant } from '../base/Constant';
import {
    ANONYMOUS_CLASS_PREFIX,
    CALL_SIGNATURE_NAME,
    DEFAULT_ARK_CLASS_NAME, LEXICAL_ENV_NAME_PREFIX,
    NAME_DELIMITER,
    NAME_PREFIX,
    UNKNOWN_CLASS_NAME,
    UNKNOWN_FILE_NAME
} from './Const';
import { ValueUtil } from './ValueUtil';
import { ArkFile } from '../model/ArkFile';
import { AbstractTypeExpr, KeyofTypeExpr, TypeQueryExpr } from '../base/TypeExpr';
import { ArkBaseModel } from '../model/ArkBaseModel';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'IRInference');

export class IRInference {
    private static inferExportInfos(file: ArkFile): void {
        file.getExportInfos().forEach(exportInfo => {
            if (exportInfo.getArkExport() === undefined) {
                let arkExport = findArkExport(exportInfo);
                exportInfo.setArkExport(arkExport);
                if (arkExport) {
                    exportInfo.setExportClauseType(arkExport.getExportType());
                }
            }
        });
        file.getNamespaces().forEach(namespace => {
            namespace.getExportInfos().forEach(exportInfo => {
                if (exportInfo.getArkExport() === undefined) {
                    let arkExport = findArkExport(exportInfo);
                    exportInfo.setArkExport(arkExport);
                    arkExport !== null ? exportInfo.setExportClauseType(arkExport.getExportType()) : true;
                }
            });
        });
    }

    private static inferImportInfos(file: ArkFile): void {
        file.getImportInfos().forEach(importInfo => {
            importInfo.getLazyExportInfo();
        });
    }

    public static inferFile(file: ArkFile): void {
        this.inferImportInfos(file);
        ModelUtils.getAllClassesInFile(file).forEach(arkClass => {
            TypeInference.inferGenericType(arkClass.getGenericsTypes(), arkClass);
            const defaultArkMethod = arkClass.getDefaultArkMethod();
            if (defaultArkMethod) {
                TypeInference.inferTypeInMethod(defaultArkMethod);
            }
            arkClass.getFields().forEach(arkField => TypeInference.inferTypeInArkField(arkField));
            const methods = arkClass.getMethods().sort((a, b) => {
                const name = a.getName().split(NAME_DELIMITER).reverse().join();
                const anotherName = b.getName().split(NAME_DELIMITER).reverse().join();
                if (name.startsWith(anotherName)) {
                    return 1;
                } else if (anotherName.startsWith(name)) {
                    return -1;
                }
                return 0;
            });
            arkClass.getAllHeritageClasses();
            methods.forEach(arkMethod => TypeInference.inferTypeInMethod(arkMethod));
        });
        this.inferExportInfos(file);
    }

    public static inferStaticInvokeExpr(expr: ArkStaticInvokeExpr, arkMethod: ArkMethod): AbstractInvokeExpr {
        const fileSignature = expr.getMethodSignature().getDeclaringClassSignature().getDeclaringFileSignature();
        if (fileSignature !== FileSignature.DEFAULT && fileSignature !== Builtin.BUILT_IN_CLASSES_FILE_SIGNATURE) {
            return expr;
        }
        const arkClass = arkMethod.getDeclaringArkClass();
        const methodName = expr.getMethodSignature().getMethodSubSignature().getMethodName();
        expr.getArgs().forEach(arg => TypeInference.inferValueType(arg, arkMethod));
        if (methodName === IMPORT) {
            const arg = expr.getArg(0);
            let type;
            if (arg instanceof Constant) {
                type = TypeInference.inferDynamicImportType(arg.getValue(), arkClass);
            }
            if (type) {
                expr.getMethodSignature().getMethodSubSignature().setReturnType(type);
            }
            return expr;
        } else if (methodName === SUPER_NAME) {
            const superClass = arkClass.getSuperClass();
            if (superClass !== null) {
                const newMethodSignature = new MethodSignature(superClass.getSignature(), expr.getMethodSignature().getMethodSubSignature());
                expr.setMethodSignature(newMethodSignature);
            }
            return expr;
        }
        const className = expr.getMethodSignature().getDeclaringClassSignature().getClassName();
        if (className && className !== UNKNOWN_CLASS_NAME) {
            const baseType = TypeInference.inferBaseType(className, arkClass);
            if (baseType) {
                let result = this.inferInvokeExpr(expr, baseType, methodName, arkClass.getDeclaringArkFile().getScene());
                if (result) {
                    this.inferArgs(result, arkMethod);
                    return result;
                }
            }
            return expr;
        }
        return this.inferStaticInvokeExprByMethodName(methodName, arkMethod, expr);
    }

    private static inferStaticInvokeExprByMethodName(methodName: string, arkMethod: ArkMethod, expr: AbstractInvokeExpr): AbstractInvokeExpr {
        const arkClass = arkMethod.getDeclaringArkClass();
        const arkExport =
            ModelUtils.getStaticMethodWithName(methodName, arkClass) ??
            arkMethod.getFunctionLocal(methodName) ??
            ModelUtils.findDeclaredLocal(new Local(methodName), arkMethod) ??
            ModelUtils.getArkExportInImportInfoWithName(methodName, arkClass.getDeclaringArkFile()) ??
            arkClass.getDeclaringArkFile().getScene().getSdkGlobal(methodName);
        let method;
        let signature;
        if (arkExport instanceof ArkMethod) {
            method = arkExport;
        } else if (arkExport instanceof ArkClass) {
            method = arkExport.getMethodWithName(CONSTRUCTOR_NAME);
        } else if (arkExport instanceof Local) {
            const type = TypeInference.replaceAliasType(arkExport.getType());
            if (type instanceof ClassType) {
                const cls = arkClass.getDeclaringArkFile().getScene().getClass(type.getClassSignature());
                method = cls?.getMethodWithName(CONSTRUCTOR_NAME) ?? cls?.getMethodWithName(CALL_SIGNATURE_NAME);
            } else if (type instanceof FunctionType) {
                signature = type.getMethodSignature();
            }
        } else if (arkExport instanceof AliasType && arkExport.getOriginalType() instanceof FunctionType) {
            signature = (arkExport.getOriginalType() as FunctionType).getMethodSignature();
        }
        if (method) {
            signature = method.matchMethodSignature(expr.getArgs());
            TypeInference.inferSignatureReturnType(signature, method);
        }
        if (signature) {
            if (arkExport instanceof Local) {
                expr = new ArkPtrInvokeExpr(signature, arkExport, expr.getArgs(), expr.getRealGenericTypes());
            } else {
                expr.setMethodSignature(signature);
            }
            this.inferArgs(expr, arkMethod);
        }
        return expr;
    }

    public static inferInstanceInvokeExpr(expr: ArkInstanceInvokeExpr, arkMethod: ArkMethod): AbstractInvokeExpr {
        const arkClass = arkMethod.getDeclaringArkClass();
        TypeInference.inferRealGenericTypes(expr.getRealGenericTypes(), arkClass);
        this.inferBase(expr, arkMethod);

        const baseType: Type = TypeInference.replaceAliasType(expr.getBase().getType());
        let methodName = expr.getMethodSignature().getMethodSubSignature().getMethodName();
        if (methodName === CONSTRUCTOR_NAME &&
            expr.getMethodSignature().getDeclaringClassSignature().getDeclaringFileSignature().getFileName() !== UNKNOWN_FILE_NAME) {
            return expr;
        }
        if (methodName.startsWith(NAME_PREFIX)) {
            const declaringStmt = arkMethod.getBody()?.getLocals().get(methodName)?.getDeclaringStmt();
            if (declaringStmt instanceof ArkAssignStmt && declaringStmt.getRightOp() instanceof ArkInstanceFieldRef) {
                const rightOp = declaringStmt.getRightOp() as ArkInstanceFieldRef;
                methodName = rightOp.getBase().getName() + '.' + rightOp.getFieldName();
            }
        }
        const scene = arkClass.getDeclaringArkFile().getScene();
        if (methodName === 'forEach' && baseType instanceof ArrayType) {
            this.processForEach(expr.getArg(0), baseType, scene);
            return expr;
        }
        expr.getArgs().forEach(arg => TypeInference.inferValueType(arg, arkMethod));
        let result = this.inferInvokeExpr(expr, baseType, methodName, scene) ?? this.processExtendFunc(expr, arkMethod, methodName);
        if (result) {
            this.inferArgs(result, arkMethod);
            return result;
        }
        logger.warn('invoke ArkInstanceInvokeExpr MethodSignature type fail: ', expr.toString());
        return expr;
    }

    /**
     * process arkUI function with Annotation @Extend @Styles @AnimatableExtend
     * @param expr
     * @param arkMethod
     * @param methodName
     */
    private static processExtendFunc(expr: AbstractInvokeExpr, arkMethod: ArkMethod, methodName: string): AbstractInvokeExpr | null {
        const type = TypeInference.inferBaseType(methodName, arkMethod.getDeclaringArkClass());
        if (type instanceof FunctionType) {
            const methodSignature = type.getMethodSignature();
            // because of last stmt is ArkReturnVoidStmt, the ArkInvokeStmt at -2 before ArkReturnVoidStmt.
            const stmts = arkMethod.getDeclaringArkFile().getScene().getMethod(methodSignature)?.getCfg()?.getStmts();
            if (stmts) {
                const endStmt = stmts[stmts.length - 2];
                if (endStmt instanceof ArkInvokeStmt) {
                    methodSignature.getMethodSubSignature().setReturnType(endStmt.getInvokeExpr().getType());
                }
            }
            expr.setMethodSignature(methodSignature);
            return expr;
        }
        return null;
    }

    public static inferFieldRef(ref: ArkInstanceFieldRef, arkMethod: ArkMethod): AbstractRef {
        this.inferBase(ref, arkMethod);
        const baseType: Type = TypeInference.replaceAliasType(ref.getBase().getType());
        if (baseType instanceof ArrayType && ref.getFieldName() !== 'length') {
            return new ArkArrayRef(ref.getBase(), ValueUtil.createConst(ref.getFieldName()));
        }

        let newFieldSignature = this.generateNewFieldSignature(ref, arkMethod.getDeclaringArkClass(), baseType);
        if (newFieldSignature) {
            if (newFieldSignature.isStatic()) {
                return new ArkStaticFieldRef(newFieldSignature);
            }
            ref.setFieldSignature(newFieldSignature);
        }
        return ref;
    }

    private static inferBase(instance: ArkInstanceFieldRef | ArkInstanceInvokeExpr, arkMethod: ArkMethod): void {
        const base = instance.getBase();
        if (base.getName() === THIS_NAME) {
            const name = instance instanceof ArkInstanceFieldRef ? instance.getFieldName() :
                instance.getMethodSignature().getMethodSubSignature().getMethodName();
            if (name.includes('.')) {
                return;
            }
            const declaringArkClass = arkMethod.getDeclaringArkClass();
            if (declaringArkClass.isAnonymousClass()) {
                let newBase = this.inferThisLocal(arkMethod);
                if (newBase) {
                    instance.setBase(newBase);
                }
            } else if (base.getType() instanceof UnknownType) {
                base.setType(new ClassType(declaringArkClass.getSignature(), declaringArkClass.getRealTypes()));
            }
        } else {
            this.inferLocal(instance.getBase(), arkMethod);
        }
    }

    public static inferThisLocal(arkMethod: ArkMethod): Local | null {
        const arkClass = arkMethod.getDeclaringArkClass();
        if (!arkClass.isAnonymousClass()) {
            return null;
        }

        const value = arkMethod.getBody()?.getUsedGlobals()?.get(THIS_NAME);
        if (value instanceof Local) {
            return value;
        } else {
            const thisType = TypeInference.inferBaseType(arkClass.getSignature().getDeclaringClassName(), arkClass);
            if (thisType instanceof ClassType) {
                const newBase = new Local(THIS_NAME, thisType);
                let usedGlobals = arkMethod.getBody()?.getUsedGlobals();
                if (!usedGlobals) {
                    usedGlobals = new Map();
                    arkMethod.getBody()?.setUsedGlobals(usedGlobals);
                }
                usedGlobals.set(THIS_NAME, newBase);
                return newBase;
            }
        }
        return null;
    }

    public static inferArgs(expr: AbstractInvokeExpr, arkMethod: ArkMethod): void {
        const scene = arkMethod.getDeclaringArkFile().getScene();
        const parameters = expr.getMethodSignature().getMethodSubSignature().getParameters();
        let realTypes: Type[] = [];
        const len = expr.getArgs().length;
        for (let index = 0; index < len; index++) {
            const arg = expr.getArg(index);
            if (index >= parameters.length) {
                break;
            }
            const argType = arg.getType();
            const paramType = parameters[index].getType();
            this.inferArg(expr, argType, paramType, scene, realTypes);
        }
        if (realTypes.length > 0 && !expr.getRealGenericTypes()) {
            expr.setRealGenericTypes(realTypes);
        }
    }

    private static inferArg(expr: AbstractInvokeExpr, argType: Type, paramType: Type, scene: Scene, realTypes: Type[]): void {
        if (paramType instanceof UnionType) {
            paramType.getTypes().forEach(t => this.inferArg(expr, argType, t, scene, realTypes));
        } else if (paramType instanceof AliasType) {
            this.inferArg(expr, argType, paramType.getOriginalType(), scene, realTypes);
        } else if (paramType instanceof ArrayType && argType instanceof ArrayType) {
            this.inferArg(expr, argType.getBaseType(), paramType.getBaseType(), scene, realTypes);
        } else if (expr instanceof ArkInstanceInvokeExpr && expr.getBase().getType() instanceof ArrayType) {
            if (paramType instanceof ArrayType && paramType.getBaseType() instanceof GenericType) {
                this.inferArg(expr, argType, (expr.getBase().getType() as ArrayType).getBaseType(), scene, realTypes);
            }
        }

        if (paramType instanceof ClassType && scene.getProjectSdkMap().has(paramType.getClassSignature().getDeclaringFileSignature().getProjectName())) {
            this.inferArgTypeWithSdk(paramType, scene, argType);
        } else if (paramType instanceof GenericType || paramType instanceof AnyType) {
            realTypes.push(argType);
        } else if (paramType instanceof FunctionType && argType instanceof FunctionType) {
            const returnType = paramType.getMethodSignature().getType();
            if (paramType.getMethodSignature().getParamLength() > 0 && returnType instanceof GenericType) {
                const paramMethod = scene.getMethod(expr.getMethodSignature());
                const argMethod = scene.getMethod(argType.getMethodSignature());
                if (argMethod && paramMethod?.getGenericTypes()?.find(t => t === returnType)) {
                    TypeInference.inferTypeInMethod(argMethod);
                }
            }
            const realTypes = expr.getRealGenericTypes();
            TypeInference.inferFunctionType(argType, paramType.getMethodSignature().getMethodSubSignature(), realTypes);
        }
    }

    public static inferRightWithSdkType(leftType: Type, rightType: Type, ackClass: ArkClass): void {
        if (leftType instanceof AliasType) {
            this.inferRightWithSdkType(TypeInference.replaceAliasType(leftType), rightType, ackClass);
        } else if (leftType instanceof UnionType) {
            leftType.getTypes().forEach(t => this.inferRightWithSdkType(t, rightType, ackClass));
        } else if (leftType instanceof ClassType) {
            IRInference.inferArgTypeWithSdk(leftType, ackClass.getDeclaringArkFile().getScene(), rightType);
        } else if (rightType instanceof ArrayType && leftType instanceof ArrayType) {
            const baseType = TypeInference.replaceAliasType(leftType.getBaseType());
            if (baseType instanceof ClassType) {
                IRInference.inferArgTypeWithSdk(baseType, ackClass.getDeclaringArkFile().getScene(), rightType.getBaseType());
            }
        }
    }

    public static inferArgTypeWithSdk(sdkType: ClassType, scene: Scene, argType: Type): void {
        if (!scene.getProjectSdkMap().has(sdkType.getClassSignature().getDeclaringFileSignature().getProjectName())) {
            return;
        }
        if (argType instanceof UnionType) {
            argType.getTypes().forEach(t => this.inferArgTypeWithSdk(sdkType, scene, t));
        } else if (argType instanceof ClassType && argType.getClassSignature().getClassName().startsWith(ANONYMOUS_CLASS_PREFIX)) {
            this.inferAnonymousClass(scene.getClass(argType.getClassSignature()), sdkType.getClassSignature());
        } else if (argType instanceof FunctionType) {
            const param = scene.getClass(sdkType.getClassSignature())?.getMethodWithName(CALL_SIGNATURE_NAME)?.getSignature().getMethodSubSignature();
            const realTypes = sdkType.getRealGenericTypes();
            TypeInference.inferFunctionType(argType, param, realTypes);
        }
    }

    private static inferInvokeExpr(expr: AbstractInvokeExpr, baseType: Type, methodName: string, scene: Scene): AbstractInvokeExpr | null {
        if (baseType instanceof AliasType) {
            return this.inferInvokeExpr(expr, baseType.getOriginalType(), methodName, scene);
        } else if (baseType instanceof UnionType) {
            for (let type of baseType.flatType()) {
                if (type instanceof UndefinedType || type instanceof NullType) {
                    continue;
                }
                let result = this.inferInvokeExpr(expr, type, methodName, scene);
                if (result) {
                    return result;
                }
            }
        }
        if (baseType instanceof ClassType) {
            return this.inferInvokeExprWithDeclaredClass(expr, baseType, methodName, scene);
        } else if (baseType instanceof AnnotationNamespaceType) {
            const namespace = scene.getNamespace(baseType.getNamespaceSignature());
            if (namespace) {
                const foundMethod = ModelUtils.findPropertyInNamespace(methodName, namespace);
                if (foundMethod instanceof ArkMethod) {
                    let signature = foundMethod.matchMethodSignature(expr.getArgs());
                    TypeInference.inferSignatureReturnType(signature, foundMethod);
                    expr.setMethodSignature(signature);
                    return expr instanceof ArkInstanceInvokeExpr ? new ArkStaticInvokeExpr(signature, expr.getArgs(), expr.getRealGenericTypes()) : expr;
                }
            }
        } else if (baseType instanceof FunctionType) {
            return IRInference.inferInvokeExprWithFunction(methodName, expr, baseType, scene);
        } else if (baseType instanceof ArrayType) {
            return IRInference.inferInvokeExprWithArray(methodName, expr, baseType, scene);
        }
        return null;
    }

    private static inferInvokeExprWithArray(methodName: string, expr: AbstractInvokeExpr, baseType: ArrayType, scene: Scene): AbstractInvokeExpr | null {
        const arrayInterface = scene.getSdkGlobal(Builtin.ARRAY);
        if (arrayInterface instanceof ArkClass) {
            return this.inferInvokeExpr(expr, new ClassType(arrayInterface.getSignature(), [baseType.getBaseType()]), methodName, scene);
        } else if (methodName === Builtin.ITERATOR_FUNCTION) {
            expr.getMethodSignature().getMethodSubSignature().setReturnType(Builtin.ITERATOR_CLASS_TYPE);
            expr.setRealGenericTypes([baseType.getBaseType()]);
            return expr;
        }
        return null;
    }

    private static inferInvokeExprWithFunction(methodName: string, expr: AbstractInvokeExpr, baseType: FunctionType, scene: Scene): AbstractInvokeExpr | null {
        if (methodName === CALL_SIGNATURE_NAME) {
            expr.setMethodSignature(baseType.getMethodSignature());
            return expr;
        }
        const funcInterface = scene.getSdkGlobal(FUNCTION);
        if (funcInterface instanceof ArkClass) {
            const method = ModelUtils.findPropertyInClass(methodName, funcInterface);
            if (method instanceof ArkMethod) {
                expr.setRealGenericTypes([baseType]);
                expr.setMethodSignature(method.getSignature());
                return expr;
            }
        }
        return null;
    }

    private static inferInvokeExprWithDeclaredClass(
        expr: AbstractInvokeExpr,
        baseType: ClassType,
        methodName: string,
        scene: Scene
    ): AbstractInvokeExpr | null {
        if (Builtin.isBuiltinClass(baseType.getClassSignature().getClassName())) {
            expr.setMethodSignature(new MethodSignature(baseType.getClassSignature(), expr.getMethodSignature().getMethodSubSignature()));
        }
        let declaredClass = scene.getClass(baseType.getClassSignature());
        if (!declaredClass) {
            const globalClass = scene.getSdkGlobal(baseType.getClassSignature().getClassName());
            if (globalClass instanceof ArkClass) {
                declaredClass = globalClass;
            }
        }
        const method = declaredClass ? ModelUtils.findPropertyInClass(methodName, declaredClass) : null;
        if (method instanceof ArkMethod) {
            const methodSignature = method.matchMethodSignature(expr.getArgs());
            TypeInference.inferSignatureReturnType(methodSignature, method);
            expr.setMethodSignature(this.replaceMethodSignature(expr.getMethodSignature(), methodSignature));
            expr.setRealGenericTypes(IRInference.getRealTypes(expr, declaredClass, baseType, method));
            if (method.isStatic() && expr instanceof ArkInstanceInvokeExpr) {
                return new ArkStaticInvokeExpr(methodSignature, expr.getArgs(), expr.getRealGenericTypes());
            }
            return expr;
        } else if (method instanceof ArkField) {
            const type = method.getType();
            let methodSignature;
            if (type instanceof FunctionType) {
                methodSignature = type.getMethodSignature();
            } else if (type instanceof ClassType && type.getClassSignature().getClassName().endsWith(CALL_BACK)) {
                const callback = scene.getClass(type.getClassSignature())?.getMethodWithName(CALL_SIGNATURE_NAME);
                if (callback) {
                    methodSignature = callback.getSignature();
                }
            }
            if (methodSignature) {
                const ptr =
                    expr instanceof ArkInstanceInvokeExpr
                        ? new ArkInstanceFieldRef(expr.getBase(), method.getSignature())
                        : new ArkStaticFieldRef(method.getSignature());
                expr = new ArkPtrInvokeExpr(methodSignature, ptr, expr.getArgs(), expr.getRealGenericTypes());
            }
            return expr;
        } else if (methodName === CONSTRUCTOR_NAME) {
            //sdk隐式构造
            const subSignature = new MethodSubSignature(methodName, [], new ClassType(baseType.getClassSignature()));
            expr.setMethodSignature(new MethodSignature(baseType.getClassSignature(), subSignature));
            return expr;
        } else if (methodName === Builtin.ITERATOR_NEXT &&
            baseType.getClassSignature().getDeclaringFileSignature().getProjectName() === Builtin.DUMMY_PROJECT_NAME) {
            expr.getMethodSignature().getMethodSubSignature().setReturnType(Builtin.ITERATOR_RESULT_CLASS_TYPE);
            expr.setRealGenericTypes(baseType.getRealGenericTypes());
            return expr;
        }
        return null;
    }

    private static getRealTypes(expr: AbstractInvokeExpr, declaredClass: ArkClass | null, baseType: ClassType, method: ArkMethod): Type[] | undefined {
        let realTypes;
        const tmp: Type[] = [];
        if (method.getGenericTypes()) {
            expr.getMethodSignature().getMethodSubSignature().getParameters()
                .filter(p => !p.getName().startsWith(LEXICAL_ENV_NAME_PREFIX))
                .forEach((p, i) => {
                    if (TypeInference.checkType(p.getType(), t => t instanceof GenericType)) {
                        tmp.push(expr.getArg(i).getType());
                    }
                });
        }
        if (tmp.length > 0) {
            realTypes = tmp;
        } else if (declaredClass?.hasComponentDecorator()) {
            realTypes = [new ClassType(declaredClass?.getSignature())];
        } else {
            realTypes = baseType.getRealGenericTypes() ?? declaredClass?.getRealTypes();
        }
        return realTypes;
    }

    public static replaceMethodSignature(init: MethodSignature, declared: MethodSignature): MethodSignature {
        const className = init.getDeclaringClassSignature().getClassName();
        let classSignature;
        if (declared.getDeclaringClassSignature().getClassName().endsWith('Interface')) {
            classSignature = new AliasClassSignature(className, declared.getDeclaringClassSignature());
        }
        let newSubSignature;
        if (classSignature || newSubSignature) {
            return new MethodSignature(classSignature ?? declared.getDeclaringClassSignature(), newSubSignature ?? declared.getMethodSubSignature());
        }
        return declared;
    }

    private static processForEach(arg: Value, baseType: ArrayType, scene: Scene): void {
        const argType = arg.getType();
        if (argType instanceof FunctionType) {
            const argMethodSignature = argType.getMethodSignature();
            const argMethod = scene.getMethod(argMethodSignature);
            if (argMethod != null && argMethod.getBody()) {
                const body = argMethod.getBody() as ArkBody;
                const firstStmt = body.getCfg().getStartingStmt();
                if (firstStmt instanceof ArkAssignStmt && firstStmt.getRightOp() instanceof ArkParameterRef) {
                    const parameterRef = firstStmt.getRightOp() as ArkParameterRef;
                    parameterRef.setType(baseType.getBaseType());
                    const argMethodParams = argMethod.getSignature().getMethodSubSignature().getParameters();
                    const actualParam = argMethodParams[argMethodParams.length - 1];
                    actualParam.setType(baseType.getBaseType());
                }
                TypeInference.inferTypeInMethod(argMethod);
            }
        } else {
            logger.warn(`arg of forEach must be callable`);
        }
    }

    public static inferLocal(base: Local, arkMethod: ArkMethod): void {
        const arkClass = arkMethod.getDeclaringArkClass();
        let baseType: Type | null | undefined = base.getType();
        if (baseType instanceof UnclearReferenceType) {
            baseType = TypeInference.inferUnclearRefName(baseType.getName(), arkClass);
        } else if (TypeInference.isUnclearType(baseType)) {
            const declaringStmt = base.getDeclaringStmt();
            if (!declaringStmt || !declaringStmt.getOriginalText() || declaringStmt.getOriginalText()?.startsWith(base.getName())) {
                baseType = ModelUtils.findDeclaredLocal(base, arkMethod)?.getType() ?? TypeInference.inferBaseType(base.getName(), arkClass);
            }
        }
        if (baseType instanceof UnionType || (baseType && !TypeInference.isUnclearType(baseType))) {
            base.setType(baseType);
        }
    }

    private static generateNewFieldSignature(ref: AbstractFieldRef, arkClass: ArkClass, baseType: Type): FieldSignature | null {
        if (baseType instanceof UnionType) {
            for (let type of baseType.flatType()) {
                if (type instanceof UndefinedType || type instanceof NullType) {
                    continue;
                }
                let newFieldSignature = this.generateNewFieldSignature(ref, arkClass, type);
                if (!TypeInference.isUnclearType(newFieldSignature?.getType())) {
                    return newFieldSignature;
                }
            }
            return null;
        } else if (baseType instanceof AliasType) {
            return this.generateNewFieldSignature(ref, arkClass, baseType.getOriginalType());
        }
        const fieldName = ref.getFieldName().replace(/[\"|\']/g, '');
        const propertyAndType = TypeInference.inferFieldType(baseType, fieldName, arkClass);
        let propertyType = IRInference.repairType(propertyAndType?.[1], fieldName, arkClass);
        let staticFlag: boolean;
        let signature: BaseSignature;
        if (baseType instanceof ClassType) {
            const property = propertyAndType?.[0];
            if (property instanceof ArkField && property.getCategory() !== FieldCategory.ENUM_MEMBER &&
                !(property.getType() instanceof GenericType)) {
                return property.getSignature();
            }
            staticFlag =
                baseType.getClassSignature().getClassName() === DEFAULT_ARK_CLASS_NAME ||
                ((property instanceof ArkField || property instanceof ArkMethod) && property.isStatic());
            signature = property instanceof ArkMethod ? property.getSignature().getDeclaringClassSignature() : baseType.getClassSignature();
        } else if (baseType instanceof AnnotationNamespaceType) {
            staticFlag = true;
            signature = baseType.getNamespaceSignature();
        } else {
            return null;
        }
        return new FieldSignature(fieldName, signature, propertyType ?? ref.getType(), staticFlag);
    }

    private static repairType(propertyType: Type | undefined, fieldName: string, arkClass: ArkClass): Type | undefined {
        if (!propertyType || propertyType instanceof UnknownType) {
            const newType = TypeInference.inferBaseType(fieldName, arkClass);
            if (newType) {
                propertyType = newType;
            }
        } else if (TypeInference.isUnclearType(propertyType)) {
            const newType = TypeInference.inferUnclearedType(propertyType, arkClass);
            if (newType) {
                propertyType = newType;
            }
        }
        return propertyType;
    }

    public static inferAnonymousClass(anon: ArkClass | null, declaredSignature: ClassSignature, set: Set<string> = new Set()): void {
        if (!anon) {
            return;
        }
        const key = anon.getSignature().toString();
        if (set.has(key)) {
            return;
        } else {
            set.add(key);
        }
        const scene = anon.getDeclaringArkFile().getScene();
        const declaredClass = scene.getClass(declaredSignature);
        if (!declaredClass) {
            return;
        }
        for (const anonField of anon.getFields()) {
            const property = ModelUtils.findPropertyInClass(anonField.getName(), declaredClass);
            if (property instanceof ArkField) {
                this.assignAnonField(property, anonField, scene, set);
            } else if (property instanceof ArkMethod) {
                const type = anonField.getType();
                if (type instanceof FunctionType) {
                    this.assignAnonMethod(scene.getMethod(type.getMethodSignature()), property);
                }
                if (type instanceof UnknownType) {
                    anonField.setSignature(
                        new FieldSignature(anonField.getName(), property.getDeclaringArkClass().getSignature(), new FunctionType(property.getSignature()))
                    );
                }
            }
        }
        for (const anonMethod of anon.getMethods()) {
            this.assignAnonMethod(anonMethod, declaredClass.getMethodWithName(anonMethod.getName()));
        }
    }

    private static assignAnonMethod(anonMethod: ArkMethod | null, declaredMethod: ArkMethod | null): void {
        if (declaredMethod && anonMethod) {
            anonMethod.setDeclareSignatures(declaredMethod.matchMethodSignature(anonMethod.getSubSignature().getParameters()));
        }
    }

    private static assignAnonField(property: ArkField, anonField: ArkField, scene: Scene, set: Set<string>): void {
        function deepInfer(anonType: Type, declaredSignature: ClassSignature): void {
            if (anonType instanceof ClassType && anonType.getClassSignature().getClassName().startsWith(ANONYMOUS_CLASS_PREFIX)) {
                IRInference.inferAnonymousClass(scene.getClass(anonType.getClassSignature()), declaredSignature, set);
            }
        }

        const type = property.getSignature().getType();
        const fieldInitializer = anonField.getInitializer();
        const lastStmt = fieldInitializer[fieldInitializer.length - 1];
        if (lastStmt instanceof ArkAssignStmt) {
            const rightType = lastStmt.getRightOp().getType();
            if (type instanceof ClassType) {
                deepInfer(rightType, type.getClassSignature());
            } else if (type instanceof ArrayType && type.getBaseType() instanceof ClassType && rightType instanceof ArrayType) {
                const baseType = rightType.getBaseType();
                const classSignature = (type.getBaseType() as ClassType).getClassSignature();
                if (baseType instanceof UnionType) {
                    baseType.getTypes().forEach(t => deepInfer(t, classSignature));
                } else {
                    deepInfer(rightType.getBaseType(), classSignature);
                }
            } else if (type instanceof FunctionType && rightType instanceof FunctionType) {
                TypeInference.inferFunctionType(rightType, type.getMethodSignature().getMethodSubSignature(), type.getRealGenericTypes());
            }
            const leftOp = lastStmt.getLeftOp();
            if (leftOp instanceof AbstractFieldRef) {
                leftOp.setFieldSignature(property.getSignature());
            }
        }
        anonField.setSignature(property.getSignature());
    }

    public static inferAliasTypeExpr(expr: AliasTypeExpr, arkMethod: ArkMethod): AbstractExpr {
        const originalObject = expr.getOriginalObject();
        let model;
        if (originalObject instanceof Local) {
            model = ModelUtils.findArkModelByRefName(originalObject.getName(), arkMethod.getDeclaringArkClass());
        } else if (originalObject instanceof AbstractTypeExpr) {
            originalObject.inferType(arkMethod);
            model = originalObject;
        } else if (originalObject instanceof Type) {
            const type = TypeInference.inferUnclearedType(originalObject, arkMethod.getDeclaringArkClass());

            // If original Object is ClassType, AliasType or UnclearReferenceType with real generic types,
            // the type after infer should be revert back to the object itself.
            if (type instanceof ClassType) {
                const scene = arkMethod.getDeclaringArkFile().getScene();
                model = ModelUtils.findArkModelBySignature(type.getClassSignature(), scene);
            } else if (type instanceof AliasType) {
                const scene = arkMethod.getDeclaringArkFile().getScene();
                model = ModelUtils.findArkModelBySignature(type.getSignature(), scene);
            } else if (type) {
                model = type;
            }
            if (expr.getRealGenericTypes() !== undefined && originalObject instanceof UnclearReferenceType) {
                expr.setRealGenericTypes(originalObject.getGenericTypes());
            }
        }

        if (AliasTypeExpr.isAliasTypeOriginalModel(model)) {
            expr.setOriginalObject(model);
        }
        return expr;
    }

    public static inferTypeQueryExpr(expr: TypeQueryExpr, arkMethod: ArkMethod): void {
        let gTypes = expr.getGenerateTypes();
        if (gTypes) {
            for (let i = 0; i < gTypes.length; i++) {
                const newType = TypeInference.inferUnclearedType(gTypes[i], arkMethod.getDeclaringArkClass());
                if (newType) {
                    gTypes[i] = newType;
                }
            }
        }

        const opValue = expr.getOpValue();
        let opValueType;
        if (opValue instanceof ArkBaseModel) {
            opValueType = ModelUtils.parseArkBaseModel2Type(opValue) ?? UnknownType.getInstance();
        } else {
            opValueType = opValue.getType();
        }

        if (!TypeInference.isUnclearType(opValueType)) {
            return;
        }
        if (opValue instanceof Local) {
            const newOpValueType = TypeInference.inferBaseType(opValue.getName(), arkMethod.getDeclaringArkClass());
            const scene = arkMethod.getDeclaringArkFile().getScene();
            if (newOpValueType instanceof ClassType) {
                const newOpValue = ModelUtils.findArkModelBySignature(newOpValueType.getClassSignature(), scene);
                if (newOpValue instanceof ArkBaseModel) {
                    expr.setOpValue(newOpValue);
                }
            } else if (newOpValueType instanceof FunctionType) {
                const newOpValue = ModelUtils.findArkModelBySignature(newOpValueType.getMethodSignature(), scene);
                if (newOpValue instanceof ArkBaseModel) {
                    expr.setOpValue(newOpValue);
                }
            } else {
                this.inferLocal(opValue, arkMethod);
            }
        } else if (opValue instanceof AbstractRef || opValue instanceof AbstractExpr) {
            expr.setOpValue(opValue.inferType(arkMethod));
        }
    }

    public static inferKeyofTypeExpr(expr: KeyofTypeExpr, arkMethod: ArkMethod): void {
        const opType = expr.getOpType();
        if (TypeInference.isUnclearType(opType)) {
            if (opType instanceof TypeQueryExpr) {
                this.inferTypeQueryExpr(opType, arkMethod);
            } else {
                const type = TypeInference.inferUnclearedType(opType, arkMethod.getDeclaringArkClass());
                if (type) {
                    expr.setOpType(type);
                }
            }
        }
    }

    public static inferParameterRef(ref: ArkParameterRef, arkMethod: ArkMethod): AbstractRef {
        const paramType = ref.getType();
        if (paramType instanceof UnknownType || paramType instanceof UnclearReferenceType) {
            const signature = arkMethod.getDeclareSignatures()?.[0] ?? arkMethod.getSignature();
            const type1 = signature.getMethodSubSignature().getParameters()[ref.getIndex()]?.getType();
            if (!TypeInference.isUnclearType(type1)) {
                ref.setType(type1);
                return ref;
            }
        } else if (paramType instanceof LexicalEnvType) {
            paramType
                .getClosures()
                .filter(c => TypeInference.isUnclearType(c.getType()))
                .forEach(e => this.inferLocal(e, arkMethod));
            return ref;
        }
        let type = TypeInference.inferUnclearedType(paramType, arkMethod.getDeclaringArkClass());
        if (type) {
            ref.setType(type);
        }
        return ref;
    }
}
