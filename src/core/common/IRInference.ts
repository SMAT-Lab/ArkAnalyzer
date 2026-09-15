/*
 * Copyright (c) 2024-2026 Huawei Device Co., Ltd.
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
    BigIntType,
    ClassType,
    EnumValueType,
    FunctionType,
    GenericType,
    IntersectionType,
    LexicalEnvType,
    LiteralType,
    NullType,
    PrimitiveType,
    TupleType,
    Type,
    UnclearReferenceType,
    UndefinedType,
    UnionType,
    UnknownType,
} from '../base/Type';
import { Local } from '../base/Local';
import { TypeInference } from './TypeInference';
import { AbstractExpr, AbstractInvokeExpr, AliasTypeExpr, ArkInstanceInvokeExpr, ArkPtrInvokeExpr, ArkStaticInvokeExpr } from '../base/Expr';
import Logger, { LOG_MODULE_TYPE } from '../../utils/logger';
import { Scene } from '../../Scene';
import { ArkClass } from '../model/ArkClass';
import { findArkExport, ModelUtils } from './ModelUtils';
import { ArkField, FieldCategory } from '../model/ArkField';
import {
    AliasClassSignature,
    BaseSignature,
    ClassSignature,
    FieldSignature,
    FileSignature,
    MethodSignature,
    MethodSubSignature,
    NamespaceSignature,
    internAliasMethodSignature,
} from '../model/ArkSignature';
import { CALL, CONSTRUCTOR_NAME, FUNCTION, IMPORT, SUPER_NAME, THIS_NAME } from './TSConst';
import { Builtin } from './Builtin';
import { ArkBody } from '../model/ArkBody';
import { ArkAssignStmt } from '../base/Stmt';
import { AbstractFieldRef, AbstractRef, ArkArrayRef, ArkInstanceFieldRef, ArkParameterRef, ArkStaticFieldRef } from '../base/Ref';
import { Value } from '../base/Value';
import { Constant } from '../base/Constant';
import {
    ANONYMOUS_CLASS_PREFIX,
    CALL_SIGNATURE_NAME,
    CONSTRUCT_SIGNATURE_NAME,
    DEFAULT_ARK_CLASS_NAME,
    GETTER_PREFIX,
    LEXICAL_ENV_NAME_PREFIX,
    NAME_DELIMITER,
    NAME_PREFIX,
    UNKNOWN_CLASS_NAME,
    UNKNOWN_FILE_NAME,
} from './Const';
import { ValueUtil } from './ValueUtil';
import { ArkFile } from '../model/ArkFile';
import { AbstractTypeExpr, KeyofTypeExpr, TypeQueryExpr } from '../base/TypeExpr';
import { ArkBaseModel } from '../model/ArkBaseModel';
import { SdkUtils } from './SdkUtils';
import { SignatureCanonicalizerRegistry } from './SignatureCanonicalizerRegistry';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'IRInference');

export class IRInference {
    public static inferExportInfos(file: ArkFile): void {
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

    public static inferImportInfos(file: ArkFile): void {
        file.getImportInfos().forEach(importInfo => {
            importInfo.getLazyExportInfo();
        });
    }

    public static inferFile(file: ArkFile): void {
        this.inferImportInfos(file);
        ModelUtils.getAllClassesInFile(file).forEach(arkClass => {
            TypeInference.inferGenericType(arkClass.getGenericsTypes(), arkClass);
            arkClass.getAllHeritageClasses();
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
            methods.forEach(arkMethod => TypeInference.inferTypeInMethod(arkMethod));
        });
        this.inferExportInfos(file);
    }

    public static needInfer(fileSignature: FileSignature): boolean {
        // Builtin stub signatures carry FileSignature.DEFAULT (fileName '%unk') and are
        // covered by the UNKNOWN_FILE_NAME check below.
        return fileSignature.getFileName() === UNKNOWN_FILE_NAME;
    }

    public static inferStaticInvokeExpr(expr: ArkStaticInvokeExpr, arkMethod: ArkMethod): AbstractInvokeExpr {
        const fileSigID = expr.getMethodSignature().getDeclaringClassSignature().getDeclaringFileSigID();
        if (fileSigID !== 0) {
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
                const newMethodSignature = new MethodSignature(superClass.getClassSigID(), expr.getMethodSignature().getMethodSubSignature());
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

    public static inferStaticInvokeExprByMethodName(methodName: string, arkMethod: ArkMethod, expr: AbstractInvokeExpr): AbstractInvokeExpr {
        const registry = SignatureCanonicalizerRegistry.getInstance();
        const arkClass = arkMethod.getDeclaringArkClass();
        const arkExport =
            ModelUtils.getStaticMethodWithName(methodName, arkClass) ??
            IRInference.getNestedMethodInScopeChain(methodName, arkMethod) ??
            arkMethod.getFunctionLocal(methodName) ??
            ModelUtils.findDeclaredLocal(new Local(methodName), arkMethod) ??
            ModelUtils.getArkExportInImportInfoWithName(methodName, arkClass.getDeclaringArkFile()) ??
            SdkUtils.getSdkGlobal(methodName);
        let method;
        let signature;
        if (arkExport instanceof ArkMethod) {
            method = arkExport;
        } else if (arkExport instanceof ArkClass) {
            method = arkExport.getMethodWithName(CALL_SIGNATURE_NAME);
        } else {
            const arkExportType = TypeInference.parseArkExport2Type(arkExport);
            if (!arkExportType) {
                return expr;
            }
            const type = TypeInference.replaceAliasType(arkExportType);
            if (type instanceof ClassType) {
                const cls = registry.getClassBySig(type.getClassSignature());
                method = cls?.getMethodWithName(CALL_SIGNATURE_NAME);
            } else if (type instanceof FunctionType) {
                signature = type.getMethodSignature();
            }
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

    /**
     * Resolve a bare callee name to the nested method declared inside the calling method or
     * one of its enclosing methods (lexical scope chain). Nested methods are stored under
     * their composed name `%origin$outer` — the historical origin-prefix name matching was
     * retired (B2), so the composed name is constructed explicitly per scope level, which
     * is strictly more precise than the old prefix semantics (it cannot cross scopes).
     */
    private static getNestedMethodInScopeChain(methodName: string, arkMethod: ArkMethod): ArkMethod | null {
        let scope: ArkMethod | null | undefined = arkMethod;
        while (scope !== undefined && scope !== null) {
            const composedName = NAME_PREFIX + methodName + NAME_DELIMITER + scope.getName();
            const nested = scope.getDeclaringArkClass().getMethodWithName(composedName);
            if (nested !== null) {
                return nested;
            }
            scope = scope.getOuterMethod();
        }
        return null;
    }

    public static inferInstanceInvokeExpr(expr: ArkInstanceInvokeExpr, arkMethod: ArkMethod): AbstractInvokeExpr {
        const arkClass = arkMethod.getDeclaringArkClass();
        TypeInference.inferRealGenericTypes(expr.getRealGenericTypes(), arkClass);
        this.inferBase(expr, arkMethod);

        const baseType: Type = TypeInference.replaceAliasType(expr.getBase().getType());
        let methodName = expr.getMethodSignature().getMethodSubSignature().getMethodName();
        if (
            methodName === CONSTRUCTOR_NAME &&
            expr.getMethodSignature().getDeclaringClassSignature().getDeclaringFileSignature().getFileName() !== UNKNOWN_FILE_NAME
        ) {
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
        let result = this.inferInvokeExpr(expr, baseType, methodName, scene);
        if (result) {
            this.inferArgs(result, arkMethod);
            return result;
        }
        logger.warn('invoke ArkInstanceInvokeExpr MethodSignature type fail: ', expr.toString());
        return expr;
    }

    public static inferFieldRef(ref: ArkInstanceFieldRef, arkMethod: ArkMethod): AbstractRef {
        this.inferBase(ref, arkMethod);
        const baseType: Type = TypeInference.replaceAliasType(ref.getBase().getType());
        if (baseType instanceof ArrayType && ref.getFieldName() !== 'length') {
            // 替换埋葬（round27）：本 ref 即将被 ArkArrayRef 替换——temp 行随之
            // retire（数组访问无字段归宿，纯 retire；dynamic ref 独占行无共享者）。
            ref.retireTemp();
            return new ArkArrayRef(ref.getBase(), ValueUtil.createConst(ref.getFieldName()));
        }

        // A2 推广：判别联合消费——定义点（终点确定）走 graduateToFormal 快路径，
        // 新构造值（终点不确定）走 updateFieldSignature 决策表；static 为新建持有者
        // 保留构造（formal 分支持 canonical，params 分支构造实例）。
        const resolution = this.generateNewFieldSignature(ref, arkMethod.getDeclaringArkClass(), baseType);
        if (resolution !== null) {
            if ('formalId' in resolution) {
                if (resolution.formalId <= 0) {
                    return ref;
                }
                if (resolution.staticFlag) {
                    // 替换埋葬：static 形态转换（instance → static ref 替换）——产物为
                    // formal canonical（归宿已知，带替换记录 retire；cpp 侧同分支
                    // graduateToFormal 前置的对称补齐）。
                    ref.retireTempTo(resolution.formalId);
                    const canonical = SignatureCanonicalizerRegistry.getInstance().fieldSigCanonicalizer.get(resolution.formalId);
                    return new ArkStaticFieldRef(canonical!);
                }
                ref.graduateToFormal(resolution.formalId);
            } else {
                const params = resolution;
                if (params.staticFlag) {
                    // 替换埋葬：static params 形态（新 ref 自走首路径，旧 ref 纯 retire）。
                    ref.retireTemp();
                    let staticSig: FieldSignature;
                    if (typeof params.declaringOrID === 'number') {
                        staticSig = params.namespaceDeclared
                            ? new FieldSignature(params.fieldName, params.declaringOrID, params.type, params.staticFlag, true)
                            : new FieldSignature(params.fieldName, params.declaringOrID, params.type, params.staticFlag);
                    } else {
                        staticSig = new FieldSignature(params.fieldName, params.declaringOrID, params.type, params.staticFlag);
                    }
                    return new ArkStaticFieldRef(staticSig);
                }
                ref.updateFieldSignature(params.fieldName, params.declaringOrID, params.type, params.staticFlag, params.namespaceDeclared);
            }
        }
        return ref;
    }

    private static inferBase(instance: ArkInstanceFieldRef | ArkInstanceInvokeExpr, arkMethod: ArkMethod): void {
        const base = instance.getBase();
        if (base.getName() === THIS_NAME) {
            const name =
                instance instanceof ArkInstanceFieldRef ? instance.getFieldName() : instance.getMethodSignature().getMethodSubSignature().getMethodName();
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

    public static inferArg(expr: AbstractInvokeExpr, argType: Type, paramType: Type, scene: Scene, realTypes: Type[]): void {
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
        } else if (paramType instanceof GenericType) {
            if (!realTypes[paramType.getIndex()]) {
                realTypes[paramType.getIndex()] = argType;
            }
        } else if (paramType instanceof AnyType) {
            realTypes.push(argType);
        } else if (paramType instanceof FunctionType && argType instanceof FunctionType) {
            TypeInference.inferFunctionType(argType, paramType.getMethodSignature().getMethodSubSignature(), expr.getRealGenericTypes());
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
        } else if (rightType instanceof FunctionType && leftType instanceof FunctionType) {
            TypeInference.inferFunctionType(rightType, leftType.getMethodSignature().getMethodSubSignature(), undefined);
        }
    }

    public static inferArgTypeWithSdk(sdkType: ClassType, scene: Scene, argType: Type): void {
        const sdkProjectName = sdkType.getClassSignature().getDeclaringFileSignature().getProjectName();
        const className = sdkType.getClassSignature().getClassName();

        // When leftOp is local with Function annotation, the rightOp is a lambda function, which should be inferred as method later.
        if (!scene.getProjectSdkMap().has(sdkProjectName) || (sdkProjectName === SdkUtils.BUILT_IN_NAME && className === 'Function')) {
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
                // 多实体探测：跨文件同名 ns（Intl 系）的后续文件实体持有该文件声明的成员
                const foundMethod = ModelUtils.findPropertyInNamespaces(methodName, namespace);
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

    public static inferInvokeExprWithArray(methodName: string, expr: AbstractInvokeExpr, baseType: ArrayType, scene: Scene): AbstractInvokeExpr | null {
        const arrayInterface = SdkUtils.getSdkGlobal(Builtin.ARRAY);
        if (arrayInterface instanceof ArkClass) {
            return this.inferInvokeExpr(expr, new ClassType(arrayInterface.getSignature(), [baseType.getBaseType()]), methodName, scene);
        } else if (methodName === Builtin.ITERATOR_FUNCTION) {
            expr.getMethodSignature().getMethodSubSignature().setReturnType(Builtin.ITERATOR_CLASS_TYPE);
            expr.setRealGenericTypes([baseType.getBaseType()]);
            return expr;
        }
        return null;
    }

    public static inferInvokeExprWithFunction(methodName: string, expr: AbstractInvokeExpr, baseType: FunctionType, scene: Scene): AbstractInvokeExpr | null {
        if (methodName === CALL_SIGNATURE_NAME) {
            expr.setMethodSignature(baseType.getMethodSignature());
            return expr;
        }
        const funcInterface = SdkUtils.getSdkGlobal(FUNCTION);
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

    public static inferInvokeExprWithDeclaredClass(expr: AbstractInvokeExpr, baseType: ClassType, methodName: string, scene: Scene): AbstractInvokeExpr | null {
        const result = this.inferSpecialMethod(expr, baseType, methodName);
        if (result) {
            return result;
        }
        // 候选 declaredClass 序：签名归属实体优先（scene.getClass 值直查），再补该
        // 名字的全部全局成员提供者（同名实体 + declare var 的构造器侧类——等价旧
        // copyMembers 合并的成员并集）。成员签名自然归属真实声明实体。
        const declaredClasses: ArkClass[] = [];
        const bySig = scene.getClass(baseType.getClassSignature());
        if (bySig instanceof ArkClass) {
            declaredClasses.push(bySig);
        }
        for (const c of SdkUtils.getSdkGlobalMemberClasses(baseType.getClassSignature().getClassName())) {
            if (!declaredClasses.includes(c)) {
                declaredClasses.push(c);
            }
        }
        // ns 兄弟类候选：跨文件同名 namespace（Intl 系）中后续文件的同名类持有该文件
        // 声明的成员（等价旧 copyNamespace 互拷可见性；登记序 = DFS 文件序）。
        if (bySig instanceof ArkClass) {
            for (const sibling of SdkUtils.getNamespacedSiblingClasses(bySig)) {
                if (!declaredClasses.includes(sibling)) {
                    declaredClasses.push(sibling);
                }
            }
        }
        if (methodName === CONSTRUCTOR_NAME) {
            return this.invokeConstructorOnClasses(expr, declaredClasses, baseType, methodName);
        }
        // 成员聚合：跨实体收集同名 method/field 候选（方法重载分散在各实体的场景，
        // 如 ObjectConstructor.keys 的 es5/es2015.core 重载）。方法候选按"实参精确
        // 匹配"优先——对齐旧胖类 matchMethodSignature 的 find(isMatched) ?? [0] 语义。
        const methodCandidates: Array<{ method: ArkMethod; declaredClass: ArkClass }> = [];
        const fieldCandidates: Array<{ member: ArkField | Local; declaredClass: ArkClass }> = [];
        for (const declaredClass of declaredClasses) {
            const member = ModelUtils.findPropertyInClass(methodName, declaredClass);
            if (member instanceof ArkClass) {
                const m = member.getMethodWithName(CALL_SIGNATURE_NAME) ?? member.getMethodWithName(CONSTRUCTOR_NAME);
                if (m) {
                    methodCandidates.push({ method: m, declaredClass });
                }
            } else if (member instanceof ArkMethod) {
                methodCandidates.push({ method: member, declaredClass });
            } else if (member instanceof ArkField || member instanceof Local) {
                fieldCandidates.push({ member, declaredClass });
            }
        }
        for (const c of methodCandidates) {
            if (this.methodMatchesArgs(c.method, expr.getArgs(), scene)) {
                return this.invokeMatchedMethod(expr, c.method, c.declaredClass, baseType);
            }
        }
        if (methodCandidates.length > 0) {
            const c = methodCandidates[0];
            return this.invokeMatchedMethod(expr, c.method, c.declaredClass, baseType);
        }
        for (const f of fieldCandidates) {
            expr.setRealGenericTypes(IRInference.getRealTypes(expr, f.declaredClass, baseType));
            return this.changePtrInvokeExpr(f.member, scene, expr) ?? expr;
        }
        return null;
    }

    /** Whether any declaration of the method matches the given args precisely (arg-count window + type match). */
    private static methodMatchesArgs(method: ArkMethod, args: Value[], scene: Scene): boolean {
        return (method.getDeclareSignatures() ?? []).some((f: MethodSignature) => {
            const parameters = f.getMethodSubSignature().getParameters();
            const max = parameters.length;
            let min = 0;
            while (min < max && !parameters[min].isOptional()) {
                min++;
            }
            return args.length >= min && args.length <= max && ModelUtils.isMatched(parameters, args, scene);
        });
    }

    /** Bind the matched method onto the invoke expr (signature + generics + static conversion). */
    private static invokeMatchedMethod(expr: AbstractInvokeExpr, method: ArkMethod, declaredClass: ArkClass, baseType: ClassType): AbstractInvokeExpr {
        const methodSignature = method.matchMethodSignature(expr.getArgs());
        TypeInference.inferSignatureReturnType(methodSignature, method);
        expr.setMethodSignature(this.replaceMethodSignature(expr.getMethodSignature(), methodSignature));
        expr.setRealGenericTypes(IRInference.getRealTypes(expr, declaredClass, baseType, method));
        if (expr instanceof ArkInstanceInvokeExpr && (method.isStatic() || method.getDeclaringArkClass().isDefaultArkClass())) {
            return new ArkStaticInvokeExpr(methodSignature, expr.getArgs(), expr.getRealGenericTypes());
        }
        return expr;
    }

    /**
     * Constructor-call handling across candidate classes: the first candidate owning a
     * real construct-signature / call / constructor method wins; when none does, the
     * legacy stub signature (over the base type) is kept.
     */
    private static invokeConstructorOnClasses(
        expr: AbstractInvokeExpr,
        declaredClasses: ArkClass[],
        baseType: ClassType,
        methodName: string
    ): AbstractInvokeExpr {
        for (const declaredClass of declaredClasses) {
            const method =
                declaredClass.getMethodWithName(CONSTRUCT_SIGNATURE_NAME) ??
                declaredClass.getMethodWithName(CALL_SIGNATURE_NAME) ??
                declaredClass.getMethodWithName(CONSTRUCTOR_NAME);
            if (method) {
                return this.invokeMatchedMethod(expr, method, declaredClass, baseType);
            }
        }
        const subSignature = new MethodSubSignature(methodName, [], new ClassType(baseType.getClassSignature()));
        // getClassSignature() (not getClassSigID()): the class may still be unclear and live in
        // the temp canonicalizer; the object overload interns it properly.
        expr.setMethodSignature(new MethodSignature(baseType.getClassSignature(), subSignature));
        return expr;
    }

    private static inferSpecialMethod(expr: AbstractInvokeExpr, baseType: ClassType, methodName: string): AbstractInvokeExpr | null {
        // Fires only on the UNRESOLVED iterator stub (old: virtual 'ES2015' project check).
        // Resolved SDK IterableIterator types take the normal declared-class path below.
        if (methodName === Builtin.ITERATOR_NEXT && baseType.getClassSigID() === -1 && baseType.getClassSignature().getClassName() === Builtin.ITERATOR) {
            expr.getMethodSignature().getMethodSubSignature().setReturnType(Builtin.ITERATOR_RESULT_CLASS_TYPE);
            expr.setRealGenericTypes(baseType.getRealGenericTypes());
            return expr;
        }
        return null;
    }

    private static changePtrInvokeExpr(method: ArkField | Local, scene: Scene, expr: AbstractInvokeExpr | ArkInstanceInvokeExpr): ArkPtrInvokeExpr | null {
        let type: Type | undefined = method.getType();
        if (expr.getRealGenericTypes() && TypeInference.checkType(type, t => t instanceof GenericType || t instanceof AnyType)) {
            type = TypeInference.replaceTypeWithReal(type, expr.getRealGenericTypes());
        }
        if (type instanceof UnionType) {
            const funType = type.getTypes().find(t => t instanceof FunctionType);
            if (funType instanceof FunctionType) {
                type = funType;
            } else {
                type = type.getTypes().find(t => t instanceof ClassType);
            }
        }
        let methodSignature;
        if (type instanceof FunctionType) {
            methodSignature = type.getMethodSignature();
        } else if (type instanceof ClassType) {
            const methodName = type.getClassSignature().getClassName() === FUNCTION ? CALL : CALL_SIGNATURE_NAME;
            const callback = scene.getClass(type.getClassSignature())?.getMethodWithName(methodName);
            if (callback) {
                methodSignature = callback.getSignature();
            }
        }
        if (methodSignature) {
            const ptr =
                method instanceof Local
                    ? method
                    : expr instanceof ArkInstanceInvokeExpr
                      ? new ArkInstanceFieldRef(expr.getBase(), method.getSignature())
                      : new ArkStaticFieldRef(method.getSignature());
            return new ArkPtrInvokeExpr(methodSignature, ptr, expr.getArgs(), expr.getRealGenericTypes());
        }
        return null;
    }

    private static getRealTypes(expr: AbstractInvokeExpr, declaredClass: ArkClass | null, baseType: ClassType, method?: ArkMethod): Type[] | undefined {
        let realTypes;
        const tmp: Type[] = [];
        if (method?.getGenericTypes()) {
            expr.getMethodSignature()
                .getMethodSubSignature()
                .getParameters()
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
            realTypes = expr.getRealGenericTypes() ?? baseType.getRealGenericTypes() ?? declaredClass?.getRealTypes();
        }
        return realTypes;
    }

    public static replaceMethodSignature(init: MethodSignature, declared: MethodSignature): MethodSignature {
        const className = init.getDeclaringClassSignature().getClassName();
        let classSignature;
        // U+（display 归一化）：仅当 init 类名有信息量（非 %unk——组件 create/pop 的
        // init 由组件名直构）时包 alias。普通 interface 解析（init 为 %unk stub，
        // 如 TestInterface.callf）直接用 declared——alias 会把显示退化为 %unk。
        if (className !== UNKNOWN_CLASS_NAME && declared.getDeclaringClassSignature().getClassName().endsWith('Interface')) {
            classSignature = new AliasClassSignature(className, declared.getDeclaringClassSignature());
        }
        let newSubSignature;
        if (classSignature || newSubSignature) {
            const result = new MethodSignature(classSignature ?? declared.getDeclaringClassSignature(), newSubSignature ?? declared.getMethodSubSignature());
            // U+（display 归一化）：alias 产物 intern formal + 双注册 declared 的
            // ArkMethod model——expr 的 route() formal 命中持 SigID（display 由
            // formal canonical 自持，不再依赖 expr 锚定传入实例）。
            if (classSignature !== undefined) {
                internAliasMethodSignature(result, declared);
            }
            return result;
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
            if (!declaringStmt) {
                baseType = ModelUtils.findDeclaredLocal(base, arkMethod)?.getType() ?? TypeInference.inferBaseType(base.getName(), arkClass);
            }
        }
        if (baseType instanceof UnionType || (baseType && !TypeInference.isUnclearType(baseType))) {
            base.setType(baseType);
        }
    }

    public static inferInstanceMember<T extends U, U extends Value>(
        baseType: Type,
        value: T,
        arkMethod: ArkMethod,
        inferMember: (declareType: Type, value: T, arkMethod: ArkMethod) => U | null
    ): U | null {
        if (baseType instanceof PrimitiveType) {
            // Convert primitive types to their wrapper class types
            const name = baseType instanceof LiteralType ? typeof baseType.getLiteralName() : baseType.getName();
            const className = baseType instanceof BigIntType ? Builtin.BIGINT : name.charAt(0).toUpperCase() + name.slice(1);
            const arrayClass = SdkUtils.getSdkGlobal(className);
            if (arrayClass instanceof ArkClass) {
                return inferMember(new ClassType(arrayClass.getSignature(), arrayClass.getRealTypes()), value, arkMethod);
            }
        } else if (baseType instanceof EnumValueType) {
            const newType = baseType.getConstant()?.getType();
            return newType ? IRInference.inferInstanceMember(newType, value, arkMethod, inferMember) : null;
        } else if (baseType instanceof AliasType) {
            return IRInference.inferInstanceMember(TypeInference.replaceAliasType(baseType), value, arkMethod, inferMember);
        } else if (baseType instanceof UnionType || baseType instanceof IntersectionType) {
            for (let type of baseType.getTypes()) {
                if (type instanceof UndefinedType || type instanceof NullType) {
                    continue;
                }
                let result = IRInference.inferInstanceMember(type, value, arkMethod, inferMember);
                if (result) {
                    return result;
                }
            }
        } else if (baseType instanceof GenericType) {
            const newType = baseType.getDefaultType() ?? baseType.getConstraint();
            return newType ? IRInference.inferInstanceMember(newType, value, arkMethod, inferMember) : null;
        }
        return inferMember(baseType, value, arkMethod);
    }

    public static generateNewFieldSignature(
        ref: AbstractFieldRef,
        arkClass: ArkClass,
        baseType: Type
    ): { formalId: number; staticFlag: boolean; type: Type } | ReturnType<typeof IRInference.genFieldSigParams> | null {
        if (baseType instanceof UnionType) {
            for (let type of baseType.flatType()) {
                if (type instanceof UndefinedType || type instanceof NullType) {
                    continue;
                }
                let resolution = this.generateNewFieldSignature(ref, arkClass, type);
                // A2 推广：Union 试探按 resolution.type 判 unclear（formal 分支带
                // 定义点 type，params 分支即构造 type——零实例读取）。
                if (resolution !== null && !TypeInference.isUnclearType(resolution.type)) {
                    return resolution;
                }
            }
            return null;
        } else if (baseType instanceof AliasType) {
            return this.generateNewFieldSignature(ref, arkClass, baseType.getOriginalType());
        } else if (baseType instanceof ArrayType) {
            const arrayClass = SdkUtils.getSdkGlobal(Builtin.ARRAY);
            if (arrayClass instanceof ArkClass) {
                baseType = new ClassType(arrayClass.getSignature(), [baseType.getBaseType()]);
            }
        }
        return IRInference.getFieldSignature(ref, baseType, arkClass);
    }

    public static updateRefSignature(baseType: Type, ref: AbstractFieldRef, arkMethod: ArkMethod): AbstractRef | null {
        const fieldName = ref.getFieldName().replace(/[\"|\']/g, '');
        if (baseType instanceof TupleType) {
            const n = Number(fieldName);
            if (!isNaN(n) && n < baseType.getTypes().length) {
                ref.getFieldSignature().setType(baseType.getTypes()[n]);
            }
            return ref;
        } else if (baseType instanceof ArrayType) {
            if (ref instanceof ArkInstanceFieldRef && ref.isDynamic()) {
                const index = TypeInference.getLocalFromMethodBody(fieldName, arkMethod);
                // 替换埋葬（round27）：dynamic ref 被 ArkArrayRef 替换——纯 retire。
                ref.retireTemp();
                return new ArkArrayRef(ref.getBase(), index ?? ValueUtil.createConst(fieldName));
            } else {
                const arrayClass = SdkUtils.getSdkGlobal(Builtin.ARRAY);
                if (arrayClass instanceof ArkClass) {
                    baseType = new ClassType(arrayClass.getSignature(), [baseType.getBaseType()]);
                }
            }
        } else if (baseType instanceof FunctionType) {
            const arrayClass = SdkUtils.getSdkGlobal(Builtin.FUNCTION);
            if (arrayClass instanceof ArkClass) {
                baseType = new ClassType(arrayClass.getSignature());
            }
        }
        const { staticFlag, signature, formalId, value, params } = IRInference.genFieldSignature(fieldName, baseType, ref, arkMethod);
        if (value) {
            // 替换埋葬：getter 裸引用被 invokeExpr 替换——纯 retire（产物无字段归宿）。
            ref.retireTemp();
            return value;
        }
        if (params) {
            // A2 批 4：新构造值走参数式（零中间实例）——static 场景为新建持有者
            // 保留 new（首路径登记），非 static 就地演进 S。
            if (params.staticFlag) {
                // 替换埋葬：static params 形态替换——旧 ref 纯 retire。
                ref.retireTemp();
                let staticSig: FieldSignature;
                if (typeof params.declaringOrID === 'number') {
                    staticSig = params.namespaceDeclared
                        ? new FieldSignature(params.fieldName, params.declaringOrID, params.type, params.staticFlag, true)
                        : new FieldSignature(params.fieldName, params.declaringOrID, params.type, params.staticFlag);
                } else {
                    staticSig = new FieldSignature(params.fieldName, params.declaringOrID, params.type, params.staticFlag);
                }
                return new ArkStaticFieldRef(staticSig);
            }
            ref.updateFieldSignature(params.fieldName, params.declaringOrID, params.type, params.staticFlag, params.namespaceDeclared);
            return ref;
        }
        // 定义点分支（params 分流后 signature 必为 ArkField 定义点 canonical）：
        // A2 快路径——graduateToFormal（终点确定：换编号 + 划行 + declaring 联动，
        // formalId 由 genFieldSignature 从 property.getFieldSigID() 直读）。
        if (formalId === null || formalId <= 0) {
            return null;
        }
        if (staticFlag) {
            // 替换埋葬：static formal 形态替换——归宿已知（带替换记录 retire）。
            ref.retireTempTo(formalId);
            // static 场景为新建持有者（首路径构造，formal 签名直传）。
            return new ArkStaticFieldRef(signature!);
        }
        ref.graduateToFormal(formalId);
        return ref;
    }

    /** A2 批 4：新构造签名的参数元组（推导链主路径不再构造中间实例 N）。 */
    private static genFieldSigParams(
        fieldName: string,
        declaringOrID: BaseSignature | number,
        type: Type,
        staticFlag: boolean,
        namespaceDeclared: boolean = false
    ): {
        fieldName: string;
        declaringOrID: BaseSignature | number;
        type: Type;
        staticFlag: boolean;
        namespaceDeclared: boolean;
    } {
        return { fieldName, declaringOrID, type, staticFlag, namespaceDeclared };
    }

    private static genFieldSignature(
        fieldName: string,
        baseType: Type,
        ref: AbstractFieldRef,
        arkMethod: ArkMethod
    ): {
        staticFlag: boolean;
        signature: FieldSignature | null;
        /** 定义点分支的 formal FieldSigID（property.getFieldSigID() 直读）；null = 非定义点。 */
        formalId: number | null;
        value?: AbstractInvokeExpr;
        params?: ReturnType<typeof IRInference.genFieldSigParams>;
    } {
        const arkClass = arkMethod.getDeclaringArkClass();
        const propertyAndType = TypeInference.inferFieldType(baseType, fieldName, arkClass);
        let propertyType = IRInference.repairType(propertyAndType?.[1], fieldName, arkClass);
        let staticFlag: boolean = false;
        let signature: FieldSignature | null = null;
        let formalId: number | null = null;
        let params: ReturnType<typeof IRInference.genFieldSigParams> | undefined;
        if (baseType instanceof ClassType) {
            const property = propertyAndType?.[0] ?? IRInference.findPropertyFormChildrenClass(fieldName, arkClass, baseType);
            if (property instanceof ArkMethod && property.getName().startsWith(GETTER_PREFIX) && ref instanceof ArkInstanceFieldRef) {
                const expr = property.isStatic()
                    ? new ArkStaticInvokeExpr(property.getSignature(), [])
                    : new ArkInstanceInvokeExpr(ref.getBase(), property.getSignature(), []);
                return { staticFlag: staticFlag, signature: signature, formalId: formalId, value: expr };
            }
            staticFlag =
                baseType.getClassSignature().getClassName() === DEFAULT_ARK_CLASS_NAME ||
                ((property instanceof ArkField || property instanceof ArkMethod) && property.isStatic());
            if (property instanceof ArkField && property.getCategory() !== FieldCategory.ENUM_MEMBER) {
                // R 轮（泛型表示迁移）：非泛型与泛型字段统一用定义点签名（formal 身份）。
                // 泛型字段（定义点 type 为 GenericType）的使用点实例化由 ref.realFieldTypes
                // 承载（Expr.realGenericTypes 同构，getType() 动态组合）——原"构造使用点
                // 形态签名走 temp 双视图"退役。实参表从 baseType 提取（与 inferFieldType
                // 的 replaceTypeWithReal 同源）。实参表残留无害：getType 的 Generic/Any
                // 守卫使非泛型 type 不受影响。
                signature = property.getSignature();
                formalId = property.getFieldSigID();
                if (property.getType() instanceof GenericType) {
                    ref.setRealFieldTypes(baseType.getRealGenericTypes());
                }
            } else {
                // getClassSignature() (not getClassSigID()): the class may still be unclear and
                // live in the temp canonicalizer; the object overload interns it properly.
                // A2 批 4：参数元组替代 new FieldSignature（消费方按 static/更新分流）。
                const baseSignature = property instanceof ArkMethod ? property.getSignature().getDeclaringClassSignature() : baseType.getClassSignature();
                params = IRInference.genFieldSigParams(fieldName, baseSignature, propertyType ?? ref.getType(), staticFlag);
            }
        } else if (baseType instanceof AnnotationNamespaceType) {
            staticFlag = true;
            params = IRInference.genFieldSigParams(
                fieldName,
                baseType.getNamespaceSignature().getNamespaceSigID(),
                propertyType ?? ref.getType(),
                staticFlag,
                true
            );
        }
        return { staticFlag, signature, formalId, params };
    }

    private static getFieldSignature(
        ref: AbstractFieldRef,
        baseType: Type,
        arkClass: ArkClass
    ): { formalId: number; staticFlag: boolean; type: Type } | ReturnType<typeof IRInference.genFieldSigParams> | null {
        const fieldName = ref.getFieldName().replace(/[\"|\']/g, '');
        const propertyAndType = TypeInference.inferFieldType(baseType, fieldName, arkClass);
        let propertyType = IRInference.repairType(propertyAndType?.[1], fieldName, arkClass);
        let staticFlag: boolean;
        let signature: ClassSignature | NamespaceSignature;
        if (baseType instanceof ClassType) {
            let property = propertyAndType?.[0];
            if (!property) {
                const subField = this.findPropertyFormChildrenClass(fieldName, arkClass, baseType);
                if (subField) {
                    property = subField;
                }
            } else if (property instanceof ArkField && property.getCategory() !== FieldCategory.ENUM_MEMBER) {
                // R 轮（泛型表示迁移）：非泛型与泛型字段统一返回定义点签名；泛型字段的
                // 使用点实例化由 ref.realFieldTypes 承载（与 genFieldSignature 分支同构）。
                if (property.getType() instanceof GenericType) {
                    ref.setRealFieldTypes(baseType.getRealGenericTypes());
                }
                // A2 推广：定义点 canonical——formalId 直读（终点确定）。
                return { formalId: property.getFieldSigID(), staticFlag: property.isStatic(), type: property.getType() };
            }
            staticFlag =
                baseType.getClassSignature().getClassName() === DEFAULT_ARK_CLASS_NAME ||
                ((property instanceof ArkField || property instanceof ArkMethod) && property.isStatic());
            // Note: baseType.getClassSignature() (not getClassSigID()) — the class may still be
            // unclear and live in the temp canonicalizer (classSigID === -1); the object overload
            // interns it properly.
            signature = property instanceof ArkMethod ? property.getSignature().getDeclaringClassSignature() : baseType.getClassSignature();
        } else if (baseType instanceof ArrayType) {
            const property = propertyAndType?.[0];
            if (property instanceof ArkField) {
                // A2 推广：定义点 canonical（Array 字段）。
                return { formalId: property.getFieldSigID(), staticFlag: property.isStatic(), type: property.getType() };
            }
            return null;
        } else if (baseType instanceof AnnotationNamespaceType) {
            staticFlag = true;
            signature = baseType.getNamespaceSignature();
        } else {
            return null;
        }
        // 新构造值（终点不确定）——参数元组。
        return signature instanceof NamespaceSignature
            ? IRInference.genFieldSigParams(fieldName, signature.getNamespaceSigID(), propertyType ?? ref.getType(), staticFlag, true)
            : IRInference.genFieldSigParams(fieldName, signature, propertyType ?? ref.getType(), staticFlag);
    }

    private static findPropertyFormChildrenClass(fieldName: string, arkClass: ArkClass, baseType: ClassType): ArkField | ArkMethod | null {
        const registry = SignatureCanonicalizerRegistry.getInstance();
        if (baseType.getClassSignature().getClassName() !== DEFAULT_ARK_CLASS_NAME) {
            // Unclear stubs have no formal model, so getClassBySig returns undefined for
            // them — the extended-class lookup below is naturally skipped (read-only lookup).
            const extendedClasses = registry.getClassBySig(baseType.getClassSignature())?.getExtendedClassList();
            if (!extendedClasses) {
                return null;
            }
            for (const subClass of extendedClasses) {
                const property = TypeInference.inferFieldType(new ClassType(subClass.getSignature(), subClass.getRealTypes()), fieldName, subClass);
                if (property && property[0]) {
                    return property[0];
                }
            }
        }
        return null;
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
                    // 类型对齐而非签名过户：同 assignAnonField——只补类型，不把匿名字段
                    // intern 到声明类名下（防 model 顶替写穿）。
                    anonField.getSignature().setType(new FunctionType(property.getSignature()));
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
                // A2 快路径：定义点 canonical 回写（property 为 ArkField，ID 直读）。
                leftOp.graduateToFormal(property.getFieldSigID());
            }
        }
        // 类型对齐而非签名过户：只把声明侧类型拷贝到匿名类字段的自有 canonical 签名
        //（type 不参与 FieldSignature 的 hash/equals，改动无 ID 影响）。不再
        // setSignature(property.getSignature())——那会把匿名字段注册到 SDK 字段的
        // FieldSigID 名下、顶替其全局 model，导致 SDK 类字段视图读到匿名字段实例
        //（initializer 写穿，见对象字面量赋值 SDK 类型的回归用例）。
        // 精确类型优先（narrowing）：initializer 已推导出的精确类型（枚举成员
        // EnumValueType、number、string 等）保留；SDK 声明类型仅在匿名字段自身
        // 类型仍 unclear/unknown 时兜底（对齐 resolveLeftOp 对 localDef 的
        // "只增强、不覆盖"守卫模式）。
        if (TypeInference.isUnclearType(anonField.getSignature().getType())) {
            anonField.getSignature().setType(property.getSignature().getType());
        }
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
