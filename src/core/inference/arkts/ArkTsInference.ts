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

import { ClassInference, ImportInfoInference, MethodInference, StmtInference } from '../ModelInference';
import { ImportInfo } from '../../model/ArkImport';
import { getArkFile, ModelUtils } from '../../common/ModelUtils';
import { ArkClass, ClassCategory } from '../../model/ArkClass';
import { TypeInference } from '../../common/TypeInference';
import { ArkMethod } from '../../model/ArkMethod';
import { MethodSignature } from '../../model/ArkSignature';
import { InferenceBuilder } from '../InferenceBuilder';
import {
    Bind,
    FieldRefInference,
    InferLanguage,
    InstanceInvokeExprInference,
    LocalInference,
    ValueInference
} from '../ValueInference';
import { ArkAliasTypeDefineStmt, Stmt } from '../../base/Stmt';
import { Value } from '../../base/Value';
import { AnyType, ClassType, FunctionType, GenericType, Type } from '../../base/Type';
import { AbstractFieldRef, ArkInstanceFieldRef, ArkParameterRef, GlobalRef } from '../../base/Ref';
import { Local } from '../../base/Local';
import { AbcMethodInference } from '../abc/AbcInference';
import { ANONYMOUS_CLASS_PREFIX, INSTANCE_INIT_METHOD_NAME } from '../../common/Const';
import { CONSTRUCTOR_NAME, THIS_NAME } from '../../common/TSConst';
import { AbstractInvokeExpr, AliasTypeExpr, ArkInstanceInvokeExpr } from '../../base/Expr';
import { IRInference } from '../../common/IRInference';
import { ArkField } from '../../model/ArkField';

class ArkTsImportInference extends ImportInfoInference {
    /**
     * get arkFile and assign to from file
     * @param fromInfo
     */
    public preInfer(fromInfo: ImportInfo): void {
        this.fromFile = getArkFile(fromInfo) || null;
    }
}

class ArkTsClassInference extends ClassInference {
    public preInfer(arkClass: ArkClass): void {
        super.preInfer(arkClass);
        TypeInference.inferGenericType(arkClass.getGenericsTypes(), arkClass);
        arkClass.getFields()
            .filter(p => TypeInference.isUnclearType(p.getType()))
            .forEach(f => {
                const newType = TypeInference.inferUnclearedType(f.getType(), arkClass);
                if (newType) {
                    f.getSignature().setType(newType);
                }
            });
    }
}

class ArkTsMethodInference extends MethodInference {

    public preInfer(arkMethod: ArkMethod): void {
        TypeInference.inferGenericType(arkMethod.getGenericTypes(), arkMethod.getDeclaringArkClass());
        arkMethod.getDeclareSignatures()?.forEach(x => this.inferMethodSignature(x, arkMethod));
        const implSignature = arkMethod.getImplementationSignature();
        if (implSignature) {
            this.inferMethodSignature(implSignature, arkMethod);
        }
    }

    private inferMethodSignature(ms: MethodSignature, arkMethod: ArkMethod): void {
        ms.getMethodSubSignature().getParameters().forEach(p => TypeInference.inferParameterType(p, arkMethod));
        TypeInference.inferSignatureReturnType(ms, arkMethod);
    }
}

export class ArkTsStmtInference extends StmtInference {

    constructor(valueInferences: ValueInference<Value>[]) {
        super(valueInferences);
    }

    public typeSpread(stmt: Stmt, method: ArkMethod): Set<Stmt> {
        if (stmt instanceof ArkAliasTypeDefineStmt && TypeInference.isUnclearType(stmt.getAliasType().getOriginalType())) {
            const originalType = stmt.getAliasTypeExpr().getOriginalType();
            if (originalType) {
                stmt.getAliasType().setOriginalType(originalType);
            }
        }
        return super.typeSpread(stmt, method);
    }

    public transferRight2Left(leftOp: Value, rightType: Type, method: ArkMethod): Stmt[] | undefined {
        const projectName = method.getDeclaringArkFile().getProjectName();
        if (!TypeInference.isUnclearType(rightType) || rightType instanceof GenericType || TypeInference.isDummyClassType(rightType)) {
            let leftType = leftOp.getType();
            if (TypeInference.isTypeCanBeOverride(leftType) || TypeInference.isAnonType(leftType, projectName)) {
                leftType = rightType;
            } else {
                leftType = TypeInference.union(leftType, rightType);
            }
            if (leftOp.getType() !== leftType) {
                return ArkTsStmtInference.updateUnionType(leftOp, leftType, method);
            }
        }
        return undefined;
    }

    public static updateUnionType(target: Value, srcType: Type, method: ArkMethod): Stmt[] | undefined {
        if (target instanceof Local) {
            target.setType(srcType);
            const globalRef = method.getBody()?.getUsedGlobals()?.get(target.getName());
            let result;
            if (globalRef instanceof GlobalRef) {
                result = this.updateGlobalRef(globalRef.getRef(), srcType);
            }
            return result ? result : target.getUsedStmts();
        } else if (target instanceof AbstractFieldRef) {
            target.getFieldSignature().setType(srcType);
        } else if (target instanceof ArkParameterRef) {
            target.setType(srcType);
        }
        return undefined;
    }

    public static updateGlobalRef(ref: Value | null, srcType: Type): Stmt[] | undefined {
        if (ref instanceof Local) {
            let leftType = ref.getType();
            if (TypeInference.isTypeCanBeOverride(leftType)) {
                leftType = srcType;
            } else {
                leftType = TypeInference.union(leftType, srcType);
            }
            if (ref.getType() !== leftType) {
                ref.setType(leftType);
                return ref.getUsedStmts();
            }
        }
        return undefined;
    }

}


export class ArkTsInferenceBuilder extends InferenceBuilder {

    public buildImportInfoInference(): ImportInfoInference {
        return new ArkTsImportInference();
    }

    public buildClassInference(): ClassInference {
        return new ArkTsClassInference(this.buildMethodInference());
    }

    public buildMethodInference(): MethodInference {
        return new ArkTsMethodInference(this.buildStmtInference());
    }

    public buildStmtInference(): StmtInference {
        const valueInferences = this.getValueInferences(InferLanguage.COMMON);
        this.getValueInferences(InferLanguage.ARK_TS1_1).forEach(e => valueInferences.push(e));
        return new ArkTsStmtInference(valueInferences);
    }
}

export class ArkTs2InferenceBuilder extends ArkTsInferenceBuilder {

}

export class JsInferenceBuilder extends InferenceBuilder {

    public buildImportInfoInference(): ImportInfoInference {
        return new ArkTsImportInference();
    }

    public buildMethodInference(): MethodInference {
        return new AbcMethodInference(this.buildStmtInference());
    }

    public buildStmtInference(): StmtInference {
        const valueInferences = this.getValueInferences(InferLanguage.COMMON);
        return new ArkTsStmtInference(valueInferences);
    }
}


@Bind(InferLanguage.ARK_TS1_1)
export class ArkTSFieldRefInference extends FieldRefInference {
    public preInfer(value: ArkInstanceFieldRef, stmt: Stmt): boolean {
        if (stmt.getDef() === value && this.isAnonClassThisRef(value, stmt.getCfg().getDeclaringMethod())) {
            return false;
        }
        return super.preInfer(value);
    }

    /**
     * Checks if a value represents an anonymous class 'this' field reference
     * Identifies field references that access fields directly on 'this' in anonymous class constructors
     * @param {Value} stmtDef - The value to check (typically a field reference)
     * @param {ArkMethod} arkMethod - The method containing the value
     * @returns {boolean} True if the value is an anonymous class 'this' field reference
     */
    private isAnonClassThisRef(stmtDef: Value, arkMethod: ArkMethod): boolean {
        return (arkMethod.getName() === INSTANCE_INIT_METHOD_NAME || arkMethod.getName() === CONSTRUCTOR_NAME) &&
            stmtDef instanceof ArkInstanceFieldRef &&
            stmtDef.getBase().getName() === THIS_NAME &&
            arkMethod.getDeclaringArkClass().isAnonymousClass() &&
            stmtDef.getFieldName().indexOf('.') === -1;
    }
}


@Bind(InferLanguage.ARK_TS1_1)
export class ArkTsInstanceInvokeExprInference extends InstanceInvokeExprInference {
    /**
     * Performs inference on an instance invocation expression within the context of a statement
     * Enhances the base implementation with real generic type inference and extension function support
     * @param {ArkInstanceInvokeExpr} value - The invocation expression to infer
     * @param {Stmt} stmt - The statement containing the invocation
     * @returns {Value | undefined} Returns a new expression if transformed, undefined otherwise
     */
    public infer(value: ArkInstanceInvokeExpr, stmt: Stmt): Value | undefined {
        const arkMethod = stmt.getCfg().getDeclaringMethod();
        TypeInference.inferRealGenericTypes(value.getRealGenericTypes(), arkMethod.getDeclaringArkClass());
        const result =
            IRInference.inferInstanceMember(value.getBase().getType(), value, arkMethod, InstanceInvokeExprInference.inferInvokeExpr) ??
            this.processExtendFunc(value, arkMethod, super.getMethodName(value, arkMethod));
        return !result || result === value ? undefined : result;
    }

    /**
     * process arkUI function with Annotation @Extend @Styles @AnimatableExtend
     * @param expr
     * @param arkMethod
     * @param methodName
     */
    private processExtendFunc(expr: AbstractInvokeExpr, arkMethod: ArkMethod, methodName: string): AbstractInvokeExpr | null {
        const annoMethod = arkMethod.getDeclaringArkClass().getMethodWithName(methodName) ??
            arkMethod.getDeclaringArkFile().getDefaultClass().getMethodWithName(methodName);
        if (annoMethod) {
            expr.setMethodSignature(annoMethod.getSignature());
            return expr;
        }
        return null;
    }
}


@Bind(InferLanguage.ARK_TS1_1)
export class AliasTypeExprInference extends ValueInference<AliasTypeExpr> {
    public getValueName(): string {
        return 'AliasTypeExpr';
    }

    public preInfer(value: AliasTypeExpr): boolean {
        return value.getOriginalType() === undefined;
    }

    public infer(value: AliasTypeExpr, stmt: Stmt): Value | undefined {
        let originalObject = value.getOriginalObject();
        const arkMethod = stmt.getCfg().getDeclaringMethod();

        let type;
        let originalLocal;
        if (originalObject instanceof Local) {
            originalLocal = ModelUtils.findArkModelByRefName(originalObject.getName(), arkMethod.getDeclaringArkClass());
            if (AliasTypeExpr.isAliasTypeOriginalModel(originalLocal)) {
                originalObject = originalLocal;
            }
        }
        if (originalObject instanceof ImportInfo) {
            const arkExport = originalObject.getLazyExportInfo()?.getArkExport();
            const importClauseName = originalObject.getImportClauseName();
            if (importClauseName.includes('.') && arkExport instanceof ArkClass) {
                type = TypeInference.inferUnclearRefName(importClauseName, arkExport);
            } else if (arkExport) {
                type = TypeInference.parseArkExport2Type(arkExport);
            }
        } else if (originalObject instanceof Type) {
            type = TypeInference.inferUnclearedType(originalObject, arkMethod.getDeclaringArkClass());
        } else if (originalObject instanceof ArkField) {
            type = originalObject.getType();
        } else {
            type = TypeInference.parseArkExport2Type(originalObject);
        }
        if (type) {
            const realGenericTypes = value.getRealGenericTypes();
            if (TypeInference.checkType(type, t => t instanceof GenericType || t instanceof AnyType) && realGenericTypes && realGenericTypes.length > 0) {
                TypeInference.inferRealGenericTypes(realGenericTypes, arkMethod.getDeclaringArkClass());
                type = TypeInference.replaceTypeWithReal(type, realGenericTypes);
            }
            value.setOriginalType(type);
            if (AliasTypeExpr.isAliasTypeOriginalModel(originalLocal)) {
                value.setOriginalObject(originalLocal);
            }
        }
        return undefined;
    }
}


@Bind(InferLanguage.ARK_TS1_1)
export class ArkTSLocalInference extends LocalInference {
    public getValueName(): string {
        return 'Local';
    }

    public preInfer(value: Local): boolean {
        const type = value.getType();
        if (value.getName() === THIS_NAME && type instanceof ClassType &&
            type.getClassSignature().getClassName().startsWith(ANONYMOUS_CLASS_PREFIX)) {
            return true;
        } else if (type instanceof FunctionType) {
            return true;
        }
        return super.preInfer(value);
    }

    public infer(value: Local, stmt: Stmt): Value | undefined {
        const name = value.getName();
        const type = value.getType();
        const arkMethod = stmt.getCfg().getDeclaringMethod();
        let newType;
        if (name === THIS_NAME) {
            newType = IRInference.inferThisLocal(arkMethod)?.getType();
            if (newType) {
                value.setType(newType);
            }
            return undefined;
        } else if (type instanceof FunctionType) {
            const methodSignature = type.getMethodSignature();
            methodSignature.getMethodSubSignature().getParameters().forEach(p => TypeInference.inferParameterType(p, arkMethod));
            TypeInference.inferSignatureReturnType(methodSignature, arkMethod);
            return undefined;
        } else {
            newType = TypeInference.inferUnclearedType(type, arkMethod.getDeclaringArkClass()) ?? this.getEnumValue(arkMethod.getDeclaringArkClass(), name);
        }
        if (newType) {
            value.setType(newType);
            return undefined;
        }
        return super.infer(value, stmt);
    }

    private getEnumValue(arkClass: ArkClass, name: string): Type | null {
        if (arkClass.getCategory() === ClassCategory.ENUM) {
            const field = arkClass.getStaticFieldWithName(name);
            if (field) {
                return TypeInference.getEnumValueType(field);
            }
        }
        return null;
    }
}
