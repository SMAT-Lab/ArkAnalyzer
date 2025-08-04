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

import { Constant } from '../../core/base/Constant';
import {
    AbstractBinopExpr,
    AbstractExpr,
    ArkAwaitExpr,
    ArkCastExpr,
    ArkDeleteExpr,
    ArkInstanceInvokeExpr,
    ArkInstanceOfExpr,
    ArkNewArrayExpr,
    ArkNewExpr,
    ArkNormalBinopExpr,
    ArkStaticInvokeExpr,
    ArkTypeOfExpr,
    ArkUnopExpr,
    ArkYieldExpr,
    NormalBinaryOperator,
} from '../../core/base/Expr';
import { Local } from '../../core/base/Local';
import { ArkClass, ClassCategory } from '../../core/model/ArkClass';
import { ArkMethod } from '../../core/model/ArkMethod';
import { ClassSignature, classSignatureCompare, MethodSignature } from '../../core/model/ArkSignature';
import { ArkCodeBuffer } from '../ArkStream';
import Logger, { LOG_MODULE_TYPE } from '../../utils/logger';
import { PrinterUtils } from '../base/PrinterUtils';
import { SourceMethod } from './SourceMethod';
import {
    AliasType,
    ArrayType,
    ClassType,
    FunctionType,
    GenericType,
    IntersectionType,
    LiteralType,
    PrimitiveType,
    StringType,
    TupleType,
    Type,
    UnclearReferenceType,
    UnionType,
    UnknownType,
    VoidType,
} from '../../core/base/Type';
import { SourceClass } from './SourceClass';
import { Value } from '../../core/base/Value';
import { AbstractRef, ArkArrayRef, ArkInstanceFieldRef, ArkStaticFieldRef, ArkThisRef } from '../../core/base/Ref';
import { ArkFile } from '../../core/model/ArkFile';
import { COMPONENT_CREATE_FUNCTION, COMPONENT_CUSTOMVIEW, COMPONENT_IF, COMPONENT_POP_FUNCTION } from '../../core/common/EtsConst';
import { INSTANCE_INIT_METHOD_NAME } from '../../core/common/Const';
import { ArkAssignStmt } from '../../core/base/Stmt';
import { ArkNamespace } from '../../core/model/ArkNamespace';
import { AbstractTypeExpr, KeyofTypeExpr, TypeQueryExpr } from '../../core/base/TypeExpr';
import { ArkBaseModel } from '../../core/model/ArkBaseModel';
import { ArkField } from '../../core/model/ArkField';
import { ExportInfo } from '../../core/model/ArkExport';
import { ImportInfo } from '../../core/model/ArkImport';
import { BIGINT_KEYWORD, CONSTRUCTOR_NAME, SUPER_NAME, THIS_NAME } from '../../core/common/TSConst';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'SourceTransformer');

export interface TransformerContext {
    getArkFile(): ArkFile;

    getDeclaringArkNamespace(): ArkNamespace | undefined;

    getMethod(signature: MethodSignature): ArkMethod | null;

    getClass(signature: ClassSignature): ArkClass | null;

    getPrinter(): ArkCodeBuffer;

    transTemp2Code(temp: Local, isLeftOp: boolean): string;

    isInBuilderMethod(): boolean;
}

export class SourceTransformer {
    protected context: TransformerContext;

    constructor(context: TransformerContext) {
        this.context = context;
    }

    private anonymousMethodToString(method: ArkMethod, indent: string): string {
        let mtdPrinter = new SourceMethod(method, indent);
        mtdPrinter.setInBuilder(this.context.isInBuilderMethod());
        return mtdPrinter.dump().trimStart();
    }

    private anonymousClassToString(cls: ArkClass, indent: string): string {
        let clsPrinter = new SourceClass(cls, indent);
        return clsPrinter.dump().trimStart();
    }

    public instanceInvokeExprToString(invokeExpr: ArkInstanceInvokeExpr, isAttr: boolean): string {
        let methodName = invokeExpr.getMethodSignature().getMethodSubSignature().getMethodName();
        if (methodName === INSTANCE_INIT_METHOD_NAME) {
            return '';
        }
        let args: string[] = [];
        invokeExpr.getArgs().forEach(v => {
            args.push(this.valueToString(v));
        });
        let genericCode = isAttr ? '' : this.genericTypesToString(invokeExpr.getRealGenericTypes());
        if (isAttr && this.context.isInBuilderMethod()) {
            return `.${methodName}${genericCode}(${args.join(', ')})`;
        }

        const base = invokeExpr.getBase();
        if (base.getName() === THIS_NAME) {
            if (methodName === CONSTRUCTOR_NAME) {
                return `super(${args.join(', ')})`;
            }
            // If base type is not match the method declaring class, here take it as super.foo() even though the source code may be this.foo().
            // Because it can not distinguish exactly whether it's this.foo() or super.foo() when foo is only defined in super class.
            const baseType = base.getType();
            if (baseType instanceof ClassType) {
                if (!classSignatureCompare(baseType.getClassSignature(), invokeExpr.getMethodSignature().getDeclaringClassSignature())) {
                    return `super.${methodName}${genericCode}(${args.join(', ')})`;
                }
            }
        }
        return `${this.valueToString(base)}.${methodName}${genericCode}(${args.join(', ')})`;
    }

    private transBuilderMethod(className: string, methodName: string, args: string[], invokeExpr: ArkStaticInvokeExpr, genericCode: string): string | null {
        if (className === COMPONENT_CUSTOMVIEW) {
            if (methodName === COMPONENT_CREATE_FUNCTION) {
                // Anonymous @Builder method
                if (args.length > 1) {
                    // remove the substring '() =>' or '(x, y): type =>' at the beginning of args[1]
                    const pattern = /^\([^)]*\)\s*:\s*\w*\s*=>\s*/;
                    args[1] = args[1].replace(pattern, '');
                }
                return `${args.join(' ')}`;
            }
            if (methodName === COMPONENT_POP_FUNCTION) {
                return '';
            }
        }

        if (PrinterUtils.isComponentCreate(invokeExpr)) {
            if (className === COMPONENT_IF) {
                return `if (${args.join(', ')})`;
            }
            return `${className}${genericCode}(${args.join(', ')})`;
        }

        if (PrinterUtils.isComponentIfBranchInvoke(invokeExpr)) {
            let arg0 = invokeExpr.getArg(0) as Constant;
            if (arg0.getValue() === '0') {
                return ``;
            } else {
                return '} else {';
            }
        }

        if (PrinterUtils.isComponentPop(invokeExpr)) {
            return '}';
        }

        return null;
    }

    public staticInvokeExprToString(invokeExpr: ArkStaticInvokeExpr): string {
        let methodSignature = invokeExpr.getMethodSignature();
        let method = this.context.getMethod(methodSignature);
        if (method && PrinterUtils.isAnonymousMethod(method.getName())) {
            return this.anonymousMethodToString(method, this.context.getPrinter().getIndent());
        }

        let classSignature = methodSignature.getDeclaringClassSignature();
        let className = PrinterUtils.getStaticInvokeClassFullName(classSignature, this.context.getDeclaringArkNamespace());
        let methodName = methodSignature.getMethodSubSignature().getMethodName();
        let args: string[] = [];
        invokeExpr.getArgs().forEach(v => {
            args.push(this.valueToString(v));
        });

        let genericCode = this.genericTypesToString(invokeExpr.getRealGenericTypes());

        if (this.context.isInBuilderMethod()) {
            const res = this.transBuilderMethod(className, methodName, args, invokeExpr, genericCode);
            if (res !== null) {
                return res;
            }
        }

        if (className && className.length > 0 && methodName !== SUPER_NAME) {
            return `${className}.${methodName}${genericCode}(${args.join(', ')})`;
        }
        return `${methodName}${genericCode}(${args.join(', ')})`;
    }

    private genericTypesToString(types: Type[] | undefined): string {
        if (!types) {
            return '';
        }

        let code = this.typeArrayToString(types);
        if (code.length > 0) {
            return `<${code}>`;
        }
        return '';
    }

    public typeArrayToString(types: Type[], split: string = ', '): string {
        let typesStr: string[] = [];
        types.forEach(t => {
            typesStr.push(this.typeToString(t));
        });

        return typesStr.join(split);
    }

    public static constToString(value: Constant): string {
        if (value.getType().toString() === 'string') {
            return `'${PrinterUtils.escape(value.getValue())}'`;
        } else if (value.getType().toString() === BIGINT_KEYWORD) {
            return `${value.getValue()}n`;
        } else {
            return value.getValue();
        }
    }

    private exprToString(expr: AbstractExpr): string {
        if (expr instanceof ArkInstanceInvokeExpr) {
            const isAttr = PrinterUtils.isComponentAttributeInvoke(expr);
            return `${this.instanceInvokeExprToString(expr, isAttr)}`;
        }

        if (expr instanceof ArkStaticInvokeExpr) {
            return `${this.staticInvokeExprToString(expr)}`;
        }

        if (expr instanceof ArkNewArrayExpr) {
            return `new Array<${this.typeToString(expr.getBaseType())}>(${expr.getSize()})`;
        }

        if (expr instanceof ArkNewExpr) {
            return `new ${this.typeToString(expr.getType())}()`;
        }

        if (expr instanceof ArkDeleteExpr) {
            return `delete ${this.valueToString(expr.getField())}`;
        }

        if (expr instanceof AbstractBinopExpr) {
            let op1: Value = expr.getOp1();
            let op2: Value = expr.getOp2();
            let operator: string = expr.getOperator();

            return `${this.valueToString(op1, false, operator)} ${operator} ${this.valueToString(op2, false, operator)}`;
        }

        if (expr instanceof ArkTypeOfExpr) {
            return `typeof(${this.valueToString(expr.getOp())})`;
        }

        if (expr instanceof ArkInstanceOfExpr) {
            return `${this.valueToString(expr.getOp())} instanceof ${this.typeToString(expr.getType())}`;
        }

        if (expr instanceof ArkCastExpr) {
            let baseOp = expr.getOp();
            return `${this.valueToString(baseOp)} as ${this.typeToString(expr.getType())}`;
        }

        if (expr instanceof ArkUnopExpr) {
            return `${expr.getOperator()}${this.valueToString(expr.getOp())}`;
        }

        if (expr instanceof ArkAwaitExpr) {
            return `await ${this.valueToString(expr.getPromise())}`;
        }

        if (expr instanceof ArkYieldExpr) {
            return `yield ${this.valueToString(expr.getYieldValue())}`;
        }

        logger.info(`exprToString ${expr.constructor} not support.`);
        // ArkPhiExpr
        return `${expr}`;
    }

    public refToString(value: AbstractRef): string {
        if (value instanceof ArkInstanceFieldRef) {
            return `${this.valueToString(value.getBase())}.${value.getFieldName()}`;
        }

        if (value instanceof ArkStaticFieldRef) {
            return `${value.getFieldSignature().getBaseName()}.${value.getFieldName()}`;
        }

        if (value instanceof ArkArrayRef) {
            let index = value.getIndex();
            if (index instanceof Constant && index.getType() instanceof StringType && PrinterUtils.isTemp(index.getValue())) {
                return `${this.valueToString(value.getBase())}[${this.valueToString(new Local(index.getValue()))}]`;
            }
            return `${this.valueToString(value.getBase())}[${this.valueToString(value.getIndex())}]`;
        }

        if (value instanceof ArkThisRef) {
            return 'this';
        }

        // ArkCaughtExceptionRef
        logger.info(`refToString ${value.constructor} not support.`);
        return `${value}`;
    }

    public valueToString(value: Value, isLeftOp: boolean = false, operator?: string): string {
        if (value instanceof AbstractExpr) {
            return this.exprToString(value);
        }

        if (value instanceof AbstractRef) {
            return this.refToString(value);
        }

        if (value instanceof Constant) {
            return SourceTransformer.constToString(value);
        }

        if (value instanceof Local) {
            return this.localToString(value, isLeftOp, operator);
        }

        logger.info(`valueToString ${value.constructor} not support.`);
        return `${value}`;
    }

    private localToString(value: Local, isLeftOp: boolean = false, operator?: string): string {
        if (PrinterUtils.isAnonymousMethod(value.getName())) {
            let methodSignature = (value.getType() as FunctionType).getMethodSignature();
            let anonymousMethod = this.context.getMethod(methodSignature);
            if (anonymousMethod) {
                return this.anonymousMethodToString(anonymousMethod, this.context.getPrinter().getIndent());
            }
        }
        if (PrinterUtils.isAnonymousClass(value.getName())) {
            let clsSignature = (value.getType() as ClassType).getClassSignature();
            let cls = this.context.getClass(clsSignature);
            if (cls) {
                return this.anonymousClassToString(cls, this.context.getPrinter().getIndent());
            }
        }

        if (operator === NormalBinaryOperator.Division || operator === NormalBinaryOperator.Multiplication || operator === NormalBinaryOperator.Remainder) {
            if (PrinterUtils.isTemp(value.getName())) {
                let stmt = value.getDeclaringStmt();
                if (stmt instanceof ArkAssignStmt && stmt.getRightOp() instanceof ArkNormalBinopExpr) {
                    return `(${this.context.transTemp2Code(value, isLeftOp)})`;
                }
            }
        }

        return this.context.transTemp2Code(value, isLeftOp);
    }

    public literalObjectToString(type: ClassType): string {
        let name = type.getClassSignature().getClassName();
        if (PrinterUtils.isAnonymousClass(name)) {
            let cls = this.context.getClass(type.getClassSignature());
            if (cls) {
                return this.anonymousClassToString(cls, this.context.getPrinter().getIndent());
            }
        }
        return name;
    }

    public typeToString(type: Type): string {
        if (type instanceof LiteralType) {
            return this.literalType2string(type);
        }

        if (type instanceof PrimitiveType || type instanceof GenericType) {
            return type.getName();
        }

        if (type instanceof UnionType || type instanceof IntersectionType) {
            return this.multipleType2string(type);
        }

        if (type instanceof UnknownType) {
            return 'any';
        }

        if (type instanceof VoidType) {
            return 'void';
        }

        if (type instanceof ClassType) {
            return this.classType2string(type);
        }
        if (type instanceof ArrayType) {
            return this.arrayType2string(type);
        }
        if (type instanceof TupleType) {
            return this.tupleType2string(type);
        }

        if (type instanceof FunctionType) {
            let methodSignature = type.getMethodSignature();
            let method = this.context.getMethod(methodSignature);
            if (method && PrinterUtils.isAnonymousMethod(method.getName())) {
                return new SourceMethod(method).toArrowFunctionTypeString();
            }
        }

        if (type instanceof UnclearReferenceType) {
            return this.unclearReferenceType2string(type);
        }

        if (type instanceof AliasType) {
            return this.aliasType2string(type);
        }

        if (type instanceof KeyofTypeExpr) {
            return this.keyofTypeExpr2string(type);
        }

        if (type instanceof TypeQueryExpr) {
            return this.typeQueryExpr2string(type);
        }

        if (!type) {
            return 'any';
        }

        logger.info(`valueToString ${type.constructor} not support.`);
        return type.toString();
    }

    private literalType2string(type: LiteralType): string {
        let literalName = type.getLiteralName();
        if (typeof literalName === 'string' && literalName.endsWith('Keyword')) {
            return literalName.substring(0, literalName.length - 'Keyword'.length).toLowerCase();
        }
        return `${literalName}`;
    }

    private multipleType2string(type: UnionType | IntersectionType): string {
        let typesStr: string[] = [];
        for (const member of type.getTypes()) {
            if (member instanceof UnionType || member instanceof IntersectionType) {
                typesStr.push(`(${this.typeToString(member)})`);
            } else {
                typesStr.push(this.typeToString(member));
            }
        }
        if (type instanceof UnionType) {
            return typesStr.join(' | ');
        } else {
            return typesStr.join(' & ');
        }
    }

    private arrayType2string(type: ArrayType): string {
        const readonly = type.getReadonlyFlag() ? 'readonly ' : '';
        const dimensions: string[] = [];
        for (let i = 0; i < type.getDimension(); i++) {
            dimensions.push('[]');
        }

        let baseType = type.getBaseType();
        if (baseType instanceof UnionType || baseType instanceof IntersectionType || baseType instanceof AbstractTypeExpr) {
            return `${readonly}(${this.typeToString(baseType)})${dimensions.join('')}`;
        }
        return `${readonly}${this.typeToString(baseType)}${dimensions.join('')}`;
    }

    private tupleType2string(type: TupleType): string {
        const readonly = type.getReadonlyFlag() ? 'readonly ' : '';
        let typesStr: string[] = [];
        for (const member of type.getTypes()) {
            typesStr.push(this.typeToString(member));
        }
        return `${readonly}[${typesStr.join(', ')}]`;
    }

    private aliasType2string(type: AliasType): string {
        let typesStr: string[] = [];
        let genericTypes = type.getRealGenericTypes() ?? type.getGenericTypes();
        if (genericTypes) {
            for (const gType of genericTypes) {
                typesStr.push(this.typeToString(gType));
            }
        }
        if (typesStr.length > 0) {
            return `${type.getName()}<${typesStr.join(', ')}>`;
        }
        return type.getName();
    }

    private keyofTypeExpr2string(type: KeyofTypeExpr): string {
        if (type.getOpType() instanceof UnionType || type.getOpType() instanceof IntersectionType) {
            return `keyof (${this.typeToString(type.getOpType())})`;
        }
        return `keyof ${this.typeToString(type.getOpType())}`;
    }

    private typeQueryExpr2string(type: TypeQueryExpr): string {
        const gTypes = type.getGenerateTypes();
        const genericStr = this.genericTypesToString(gTypes);
        const opValue = type.getOpValue();
        if (opValue instanceof ArkBaseModel) {
            if (opValue instanceof ArkClass || opValue instanceof ArkMethod || opValue instanceof ArkNamespace || opValue instanceof ArkField) {
                return `typeof ${opValue.getName()}${genericStr}`;
            } else if (opValue instanceof ExportInfo) {
                return `typeof ${opValue.getExportClauseName()}${genericStr}`;
            } else if (opValue instanceof ImportInfo) {
                return `typeof ${opValue.getImportClauseName()}${genericStr}`;
            } else {
                return `typeof *invalid*`;
            }
        } else {
            return `typeof ${this.valueToString(opValue)}${genericStr}`;
        }
    }

    private unclearReferenceType2string(type: UnclearReferenceType): string {
        let genericTypes = type.getGenericTypes();
        if (genericTypes.length > 0) {
            return `${type.getName()}<${genericTypes.map(value => this.typeToString(value)).join(', ')}>`;
        }
        return type.getName();
    }

    private classType2string(type: ClassType): string {
        const name = PrinterUtils.getStaticInvokeClassFullName(type.getClassSignature());
        if (PrinterUtils.isDefaultClass(name)) {
            return 'any';
        }
        if (PrinterUtils.isAnonymousClass(name)) {
            let cls = this.context.getClass(type.getClassSignature());
            if (cls && cls.getCategory() === ClassCategory.TYPE_LITERAL) {
                return this.anonymousClassToString(cls, this.context.getPrinter().getIndent());
            }
            return 'Object';
        }
        let genericTypes = type.getRealGenericTypes();
        if (genericTypes && genericTypes.length > 0) {
            return `${name}${this.genericTypesToString(genericTypes)}`;
        }
        return name;
    }
}
