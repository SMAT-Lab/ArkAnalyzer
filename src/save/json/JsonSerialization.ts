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

import {
    AliasType,
    AliasTypeSignature,
    AnnotationNamespaceType,
    AnnotationTypeQueryType,
    AnyType,
    ArkArrayRef,
    ArkAssignStmt,
    ArkAwaitExpr,
    ArkBody,
    ArkCastExpr,
    ArkCaughtExceptionRef,
    ArkClass,
    ArkConditionExpr,
    ArkDeleteExpr,
    ArkField,
    ArkFile,
    ArkIfStmt,
    ArkInstanceFieldRef,
    ArkInstanceInvokeExpr,
    ArkInstanceOfExpr,
    ArkInvokeStmt,
    ArkMethod,
    ArkNamespace,
    ArkNewArrayExpr,
    ArkNewExpr,
    ArkNormalBinopExpr,
    ArkParameterRef,
    ArkPhiExpr,
    ArkPtrInvokeExpr,
    ArkReturnStmt,
    ArkReturnVoidStmt,
    ArkStaticFieldRef,
    ArkStaticInvokeExpr,
    ArkThisRef,
    ArkThrowStmt,
    ArkTypeOfExpr,
    ArkUnopExpr,
    ArkYieldExpr,
    ArrayType,
    BasicBlock,
    BigIntType,
    BooleanType,
    Cfg,
    ClassSignature,
    ClassType,
    ClosureFieldRef,
    Constant,
    Decorator,
    EnumValueType,
    ExportInfo,
    FieldSignature,
    FileSignature,
    FunctionType,
    GenericType,
    GlobalRef,
    ImportInfo,
    IntersectionType,
    LexicalEnvType,
    LineColPosition,
    LiteralType,
    Local,
    MethodSignature,
    MethodSubSignature,
    NamespaceSignature,
    NeverType,
    NullType,
    NumberType,
    Scene,
    Stmt,
    StringType,
    TupleType,
    Type,
    UnclearReferenceType,
    UndefinedType,
    UnionType,
    UnknownType,
    Value,
    VoidType,
} from '../..';
import { MethodParameter } from '../../core/model/builder/ArkMethodBuilder';
import {
    AliasTypeSignatureDto,
    ArkFileDto,
    BasicBlockDto,
    CfgDto,
    ClassDto,
    ClassSignatureDto,
    ConstantDto,
    DecoratorDto,
    ExportInfoDto,
    FieldDto,
    FieldSignatureDto,
    FileSignatureDto,
    ImportInfoDto,
    LineColPositionDto,
    LocalDto,
    MethodBodyDto,
    MethodDto,
    MethodParameterDto,
    MethodSignatureDto,
    NamespaceDto,
    NamespaceSignatureDto,
    SceneDto,
    StmtDto,
    TypeDto,
    ValueDto,
    polymorphic,
} from './JsonDto';

export function serializeArkScene(scene: Scene): SceneDto {
    return {
        files: scene.getFiles().map(f => serializeArkFile(f)),
        sdkFiles: scene.getSdkArkFiles().map(f => serializeArkFile(f)),
    };
}

export function serializeArkFile(file: ArkFile): ArkFileDto {
    return {
        signature: serializeFileSignature(file.getFileSignature()),
        namespaces: file.getNamespaces().map(ns => serializeNamespace(ns)),
        classes: file.getClasses().map(cls => serializeClass(cls)),
        importInfos: file.getImportInfos().map(info => serializeImportInfo(info)),
        exportInfos: file.getExportInfos().map(info => serializeExportInfo(info)),
    };
}

export function serializeNamespace(namespace: ArkNamespace): NamespaceDto {
    return {
        signature: serializeNamespaceSignature(namespace.getSignature()),
        classes: namespace.getClasses().map(cls => serializeClass(cls)),
        namespaces: namespace.getNamespaces().map(ns => serializeNamespace(ns)),
    };
}

export function serializeClass(clazz: ArkClass): ClassDto {
    return {
        signature: serializeClassSignature(clazz.getSignature()),
        modifiers: clazz.getModifiers(),
        decorators: clazz.getDecorators().map(decorator => serializeDecorator(decorator)),
        typeParameters: clazz.getGenericsTypes()?.map(type => serializeType(type)),
        category: clazz.getCategory(),
        superClassName: clazz.getSuperClassName(),
        implementedInterfaceNames: clazz.getImplementedInterfaceNames(),
        fields: clazz.getFields().map(field => serializeField(field)),
        methods: clazz.getMethods(true).map(method => serializeMethod(method)),
    };
}

export function serializeField(field: ArkField): FieldDto {
    return {
        signature: serializeFieldSignature(field.getSignature()),
        modifiers: field.getModifiers(),
        decorators: field.getDecorators().map(decorator => serializeDecorator(decorator)),
        questionToken: field.getQuestionToken(),
        exclamationToken: field.getExclamationToken(),
    };
}

export function serializeMethod(method: ArkMethod): MethodDto {
    const body = method.getBody();
    return {
        signature: serializeMethodSignature(method.getSignature()),
        modifiers: method.getModifiers(),
        decorators: method.getDecorators().map(decorator => serializeDecorator(decorator)),
        typeParameters: method.getGenericTypes()?.map(type => serializeType(type)),
        body: body && serializeMethodBody(body),
    };
}

export function serializeMethodBody(body: ArkBody): MethodBodyDto {
    return {
        locals: Array.from(body.getLocals().values()).map(local => serializeLocal(local)),
        cfg: serializeCfg(body.getCfg()),
    };
}

export function serializeMethodParameter(parameter: MethodParameter): MethodParameterDto {
    return {
        name: parameter.getName(),
        type: serializeType(parameter.getType()),
        isOptional: parameter.isOptional(),
        isRest: parameter.isRest(),
    };
}

export function serializeImportInfo(importInfo: ImportInfo): ImportInfoDto {
    return {
        importName: importInfo.getImportClauseName(),
        importType: importInfo.getImportType(),
        importFrom: importInfo.getFrom(),
        nameBeforeAs: importInfo.getNameBeforeAs(),
        modifiers: importInfo.getModifiers(),
    };
}

export function serializeExportInfo(exportInfo: ExportInfo): ExportInfoDto {
    return {
        exportName: exportInfo.getExportClauseName(),
        exportType: exportInfo.getExportClauseType(),
        exportFrom: exportInfo.getFrom(),
        nameBeforeAs: exportInfo.getNameBeforeAs(),
        modifiers: exportInfo.getModifiers(),
    };
}

export function serializeDecorator(decorator: Decorator): DecoratorDto {
    return {
        kind: decorator.getKind(),
    };
}

export function serializeLineColPosition(position: LineColPosition): LineColPositionDto {
    return {
        line: position.getLineNo(),
        col: position.getColNo(),
    };
}

export function serializeType(type: Type): TypeDto {
    if (type === undefined) {
        throw new Error('Type is undefined');
    }

    if (type instanceof AnyType) {
        return polymorphic('AnyType', {});
    } else if (type instanceof UnknownType) {
        return polymorphic('UnknownType', {});
    } else if (type instanceof VoidType) {
        return polymorphic('VoidType', {});
    } else if (type instanceof NeverType) {
        return polymorphic('NeverType', {});
    } else if (type instanceof UnionType) {
        return polymorphic('UnionType', {
            types: type.getTypes().map(type => serializeType(type)),
        });
    } else if (type instanceof IntersectionType) {
        return polymorphic('IntersectionType', {
            types: type.getTypes().map(type => serializeType(type)),
        });
    } else if (type instanceof TupleType) {
        return polymorphic('TupleType', {
            types: type.getTypes().map(type => serializeType(type)),
        });
    } else if (type instanceof BooleanType) {
        return polymorphic('BooleanType', {});
    } else if (type instanceof NumberType) {
        return polymorphic('NumberType', {});
    } else if (type instanceof BigIntType) {
        return polymorphic('BigIntType', {});
    } else if (type instanceof StringType) {
        return polymorphic('StringType', {});
    } else if (type instanceof NullType) {
        return polymorphic('NullType', {});
    } else if (type instanceof UndefinedType) {
        return polymorphic('UndefinedType', {});
    } else if (type instanceof LiteralType) {
        return polymorphic('LiteralType', {
            literal: type.getLiteralName(),
        });
    } else if (type instanceof ClassType) {
        return polymorphic('ClassType', {
            signature: serializeClassSignature(type.getClassSignature()),
            typeParameters: type.getRealGenericTypes()?.map(type => serializeType(type)),
        });
    } else if (type instanceof FunctionType) {
        if (type.getMethodSignature().getMethodSubSignature().getReturnType() === type) {
            // Handle recursive function types.
            // This is a workaround for the issue where the function type refers to itself,
            // which can cause infinite recursion during serialization.
            // In this case, we return a simple FunctionType without a signature.
            console.warn('Detected recursive function type, replacing return type with UnknownType');
            const sig = type.getMethodSignature();
            const sub = sig.getMethodSubSignature();
            const sig2 = new MethodSignature(
                sig.getDeclaringClassSignature(),
                new MethodSubSignature(
                    sub.getMethodName(),
                    sub.getParameters(),
                    UnknownType.getInstance(),
                    sub.isStatic(),
                )
            );
            return polymorphic('FunctionType', {
                signature: serializeMethodSignature(sig2),
                typeParameters: type.getRealGenericTypes()?.map(type => serializeType(type)),
            });
        }
        return polymorphic('FunctionType', {
            signature: serializeMethodSignature(type.getMethodSignature()),
            typeParameters: type.getRealGenericTypes()?.map(type => serializeType(type)),
        });
    } else if (type instanceof ArrayType) {
        return polymorphic('ArrayType', {
            elementType: serializeType(type.getBaseType()),
            dimensions: type.getDimension(),
        });
    } else if (type instanceof UnclearReferenceType) {
        return polymorphic('UnclearReferenceType', {
            name: type.getName(),
            typeParameters: type.getGenericTypes().map(type => serializeType(type)),
        });
    } else if (type instanceof AliasType) {
        return polymorphic('AliasType', {
            name: type.getName(),
            originalType: serializeType(type.getOriginalType()),
            signature: serializeAliasTypeSignature(type.getSignature()),
        });
    } else if (type instanceof GenericType) {
        const constraint = type.getConstraint();
        const defaultType = type.getDefaultType();
        return polymorphic('GenericType', {
            name: type.getName(),
            constraint: constraint && serializeType(constraint),
            defaultType: defaultType && serializeType(defaultType),
        });
    } else if (type instanceof AnnotationNamespaceType) {
        return polymorphic('AnnotationNamespaceType', {
            originType: type.getOriginType(),
            namespaceSignature: serializeNamespaceSignature(type.getNamespaceSignature()),
        });
    } else if (type instanceof AnnotationTypeQueryType) {
        return polymorphic('AnnotationTypeQueryType', {
            originType: type.getOriginType(),
        });
    } else if (type instanceof LexicalEnvType) {
        const m = type.getNestedMethod();
        const s = m.getMethodSubSignature();
        const sig = new MethodSignature(m.getDeclaringClassSignature(), new MethodSubSignature(s.getMethodName(), [], UnknownType.getInstance()));
        return polymorphic('LexicalEnvType', {
            // method: serializeMethodSignature(type.getNestedMethod()),
            method: serializeMethodSignature(sig),
            closures: type.getClosures().map(closure => serializeLocal(closure)),
        });
    } else if (type instanceof EnumValueType) {
        return polymorphic('EnumValueType', {
            signature: serializeClassSignature(type.getFieldSignature().getDeclaringSignature() as ClassSignature),
            name: type.getFieldSignature().getFieldName(),
        });
    }

    // Fallback for unhandled type cases
    console.info(`Unhandled Type: ${type.constructor.name} (${type.toString()})`);
    return {
        kind: type.constructor.name,
        text: type.toString(),
    };
}

export function serializeFileSignature(file: FileSignature): FileSignatureDto {
    return {
        projectName: file.getProjectName(),
        fileName: file.getFileName(),
    };
}

export function serializeNamespaceSignature(namespace: NamespaceSignature): NamespaceSignatureDto {
    const dns = namespace.getDeclaringNamespaceSignature() ?? undefined;
    return {
        name: namespace.getNamespaceName(),
        declaringFile: serializeFileSignature(namespace.getDeclaringFileSignature()),
        declaringNamespace: dns && serializeNamespaceSignature(dns),
    };
}

export function serializeClassSignature(clazz: ClassSignature): ClassSignatureDto {
    const dns = clazz.getDeclaringNamespaceSignature() ?? undefined;
    return {
        name: clazz.getClassName(),
        declaringFile: serializeFileSignature(clazz.getDeclaringFileSignature()),
        declaringNamespace: dns && serializeNamespaceSignature(dns),
    };
}

export function serializeFieldSignature(field: FieldSignature): FieldSignatureDto {
    const declaringSignature: ClassSignature | NamespaceSignature = field.getDeclaringSignature();
    let declaringClass;
    if (declaringSignature instanceof ClassSignature) {
        declaringClass = serializeClassSignature(declaringSignature);
    } else {
        declaringClass = serializeNamespaceSignature(declaringSignature);
    }
    return {
        declaringClass,
        name: field.getFieldName(),
        type: serializeType(field.getType()),
    };
}

export function serializeMethodSignature(method: MethodSignature): MethodSignatureDto {
    return {
        declaringClass: serializeClassSignature(method.getDeclaringClassSignature()),
        name: method.getMethodSubSignature().getMethodName(),
        parameters: method
            .getMethodSubSignature()
            .getParameters()
            .map(param => serializeMethodParameter(param)),
        returnType: serializeType(method.getType()),
    };
}

export function serializeAliasTypeSignature(signature: AliasTypeSignature): AliasTypeSignatureDto {
    return {
        name: signature.getName(),
        method: serializeMethodSignature(signature.getDeclaringMethodSignature()),
    };
}

export function serializeCfg(cfg: Cfg): CfgDto {
    const blocks = Array.from(cfg.getBlocks()).map(block => serializeBasicBlock(block));

    // Sort blocks by their IDs for consistent output:
    blocks.sort((a, b) => a.id - b.id);

    // Check that block IDs match their indices in the array:
    blocks.forEach((block, index) => {
        if (block.id !== index) {
            console.warn(`Block ID ${block.id} does not match its index ${index} in serialized CFG blocks array`);
        }
    });

    return { blocks };
}

export function serializeBasicBlock(block: BasicBlock): BasicBlockDto {
    return {
        id: block.getId(),
        successors: block.getSuccessors().map(succ => succ.getId()),
        predecessors: block.getPredecessors().map(pred => pred.getId()),
        stmts: block.getStmts().map(stmt => serializeStmt(stmt)),
    };
}

export function serializeLocal(local: Local): LocalDto {
    return {
        name: local.getName(),
        type: serializeType(local.getType()),
    };
}

export function serializeConstant(constant: Constant): ConstantDto {
    let value = constant.getValue();
    if (constant.getType() instanceof NumberType) {
        value = Number(value).toString();
    }
    return {
        value,
        type: serializeType(constant.getType()),
    };
}

export function serializeValue(value: Value): ValueDto {
    if (value === undefined) {
        throw new Error('Value is undefined');
    }

    if (value instanceof Local) {
        return polymorphic('Local', serializeLocal(value));
    } else if (value instanceof Constant) {
        return polymorphic('Constant', serializeConstant(value));
    } else if (value instanceof ArkNewExpr) {
        return polymorphic('NewExpr', {
            classType: serializeType(value.getClassType()),
        });
    } else if (value instanceof ArkNewArrayExpr) {
        return polymorphic('NewArrayExpr', {
            elementType: serializeType(value.getBaseType()),
            size: serializeValue(value.getSize()),
        });
    } else if (value instanceof ArkDeleteExpr) {
        return polymorphic('DeleteExpr', {
            arg: serializeValue(value.getField()),
        });
    } else if (value instanceof ArkAwaitExpr) {
        return polymorphic('AwaitExpr', {
            arg: serializeValue(value.getPromise()),
        });
    } else if (value instanceof ArkYieldExpr) {
        return polymorphic('YieldExpr', {
            arg: serializeValue(value.getYieldValue()),
        });
    } else if (value instanceof ArkTypeOfExpr) {
        return polymorphic('TypeOfExpr', {
            arg: serializeValue(value.getOp()),
        });
    } else if (value instanceof ArkInstanceOfExpr) {
        return polymorphic('InstanceOfExpr', {
            arg: serializeValue(value.getOp()),
            checkType: serializeType(value.getCheckType()),
        });
    } else if (value instanceof ArkCastExpr) {
        return polymorphic('CastExpr', {
            arg: serializeValue(value.getOp()),
            type: serializeType(value.getType()),
        });
    } else if (value instanceof ArkPhiExpr) {
        const args = value.getArgs();
        const argToBlock = value.getArgToBlock();
        return polymorphic('PhiExpr', {
            args: args.map(arg => serializeValue(arg)),
            blocks: args.map(arg => argToBlock.get(arg)!.getId()),
            type: serializeType(value.getType()),
        });
    } else if (value instanceof ArkConditionExpr) {
        return polymorphic('ConditionExpr', {
            op: value.getOperator(),
            left: serializeValue(value.getOp1()),
            right: serializeValue(value.getOp2()),
            type: serializeType(value.getType()),
        });
    } else if (value instanceof ArkNormalBinopExpr) {
        return polymorphic('BinopExpr', {
            op: value.getOperator(),
            left: serializeValue(value.getOp1()),
            right: serializeValue(value.getOp2()),
        });
    } else if (value instanceof ArkUnopExpr) {
        return polymorphic('UnopExpr', {
            op: value.getOperator(),
            arg: serializeValue(value.getOp()),
        });
    } else if (value instanceof ArkInstanceInvokeExpr) {
        return polymorphic('InstanceCallExpr', {
            instance: serializeValue(value.getBase()),
            method: serializeMethodSignature(value.getMethodSignature()),
            args: value.getArgs().map(arg => serializeValue(arg)),
        });
    } else if (value instanceof ArkStaticInvokeExpr) {
        return polymorphic('StaticCallExpr', {
            method: serializeMethodSignature(value.getMethodSignature()),
            args: value.getArgs().map(arg => serializeValue(arg)),
        });
    } else if (value instanceof ArkPtrInvokeExpr) {
        return polymorphic('PtrCallExpr', {
            ptr: serializeValue(value.getFuncPtrLocal()),
            method: serializeMethodSignature(value.getMethodSignature()),
            args: value.getArgs().map(arg => serializeValue(arg)),
        });
    } else if (value instanceof ArkThisRef) {
        return polymorphic('ThisRef', {
            type: serializeType(value.getType()),
        });
    } else if (value instanceof ArkParameterRef) {
        return polymorphic('ParameterRef', {
            index: value.getIndex(),
            type: serializeType(value.getType()),
        });
    } else if (value instanceof ArkArrayRef) {
        return polymorphic('ArrayRef', {
            array: serializeValue(value.getBase()),
            index: serializeValue(value.getIndex()),
            type: serializeType(value.getType()),
        });
    } else if (value instanceof ArkCaughtExceptionRef) {
        return polymorphic('CaughtExceptionRef', {
            type: serializeType(value.getType()),
        });
    } else if (value instanceof GlobalRef) {
        const ref = value.getRef();
        return polymorphic('GlobalRef', {
            name: value.getName(),
            ref: ref ? serializeValue(ref) : null,
        });
    } else if (value instanceof ClosureFieldRef) {
        return polymorphic('ClosureFieldRef', {
            base: serializeLocal(value.getBase()),
            fieldName: value.getFieldName(),
            type: serializeType(value.getType()),
        });
    } else if (value instanceof ArkInstanceFieldRef) {
        return polymorphic('InstanceFieldRef', {
            instance: serializeValue(value.getBase()),
            field: serializeFieldSignature(value.getFieldSignature()),
        });
    } else if (value instanceof ArkStaticFieldRef) {
        return polymorphic('StaticFieldRef', {
            field: serializeFieldSignature(value.getFieldSignature()),
        });
    }

    // Fallback for unhandled value types
    console.info(`Unhandled Value: ${value.constructor.name} (${value.toString()})`);
    return {
        kind: value.constructor.name,
        text: value.toString(),
        type: serializeType(value.getType()),
    };
}

export function serializeStmt(stmt: Stmt): StmtDto {
    if (stmt instanceof ArkAssignStmt) {
        return polymorphic('AssignStmt', {
            left: serializeValue(stmt.getLeftOp()),
            right: serializeValue(stmt.getRightOp()),
        });
    } else if (stmt instanceof ArkInvokeStmt) {
        return polymorphic('CallStmt', {
            expr: serializeValue(stmt.getInvokeExpr()),
        });
    } else if (stmt instanceof ArkIfStmt) {
        return polymorphic('IfStmt', {
            condition: serializeValue(stmt.getConditionExpr()),
        });
    } else if (stmt instanceof ArkReturnVoidStmt) {
        return polymorphic('ReturnVoidStmt', {});
    } else if (stmt instanceof ArkReturnStmt) {
        return polymorphic('ReturnStmt', {
            arg: serializeValue(stmt.getOp()),
        });
    } else if (stmt instanceof ArkThrowStmt) {
        return polymorphic('ThrowStmt', {
            arg: serializeValue(stmt.getOp()),
        });
    }

    // Fallback for unhandled statement types
    console.info(`Unhandled Stmt: ${stmt.constructor.name} (${stmt.toString()})`);
    return {
        kind: stmt.constructor.name,
        text: stmt.toString(),
    };
}
