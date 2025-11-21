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

import { ClassCategory } from '../../core/model/ArkClass';
import { ExportType } from '../../core/model/ArkExport';

// Polymorphic wrapper type for discriminated unions
type Polymorphic<K, T> = T & { _: K; };

// Base unhandled DTO for fallback cases
interface UnhandledDto {
    _?: undefined;
    kind: string; // constructor.name
    text: string; // toString()
}

// Helper function to create polymorphic DTOs
export function polymorphic<K, T>(
    kind: K,
    value: T,
): Polymorphic<K, T> {
    // Override the '_' property, but make it first:
    let t = { ...value };
    delete (t as any)._;
    return { _: kind, ...t };
}

// Base interfaces
export interface LineColPositionDto {
    line: number;
    col: number;
}

export interface DecoratorDto {
    kind: string;
}

// Signature DTOs
export interface FileSignatureDto {
    projectName: string;
    fileName: string;
}

export interface NamespaceSignatureDto {
    name: string;
    declaringFile: FileSignatureDto;
    declaringNamespace?: NamespaceSignatureDto;
}

export interface ClassSignatureDto {
    name: string;
    declaringFile: FileSignatureDto;
    declaringNamespace?: NamespaceSignatureDto;
}

export interface FieldSignatureDto {
    declaringClass: ClassSignatureDto | NamespaceSignatureDto;
    name: string;
    type: TypeDto;
}

export interface MethodParameterDto {
    name: string;
    type: TypeDto;
    isOptional: boolean;
    isRest: boolean;
}

export interface MethodSignatureDto {
    declaringClass: ClassSignatureDto;
    name: string;
    parameters: MethodParameterDto[];
    returnType: TypeDto;
}

export interface AliasTypeSignatureDto {
    name: string;
    method: MethodSignatureDto;
}

// Type DTOs using polymorphic pattern
export type TypeDto =
    | Polymorphic<'AnyType', AnyTypeDto>
    | Polymorphic<'UnknownType', UnknownTypeDto>
    | Polymorphic<'VoidType', VoidTypeDto>
    | Polymorphic<'NeverType', NeverTypeDto>
    | Polymorphic<'UnionType', UnionTypeDto>
    | Polymorphic<'IntersectionType', IntersectionTypeDto>
    | Polymorphic<'TupleType', TupleTypeDto>
    | Polymorphic<'BooleanType', BooleanTypeDto>
    | Polymorphic<'NumberType', NumberTypeDto>
    | Polymorphic<'BigIntType', BigIntTypeDto>
    | Polymorphic<'StringType', StringTypeDto>
    | Polymorphic<'NullType', NullTypeDto>
    | Polymorphic<'UndefinedType', UndefinedTypeDto>
    | Polymorphic<'LiteralType', LiteralTypeDto>
    | Polymorphic<'ClassType', ClassTypeDto>
    | Polymorphic<'FunctionType', FunctionTypeDto>
    | Polymorphic<'ArrayType', ArrayTypeDto>
    | Polymorphic<'UnclearReferenceType', UnclearReferenceTypeDto>
    | Polymorphic<'GenericType', GenericTypeDto>
    | Polymorphic<'AliasType', AliasTypeDto>
    | Polymorphic<'AnnotationNamespaceType', AnnotationNamespaceTypeDto>
    | Polymorphic<'AnnotationTypeQueryType', AnnotationTypeQueryTypeDto>
    | Polymorphic<'EnumValueType', EnumValueTypeDto>
    | Polymorphic<'LexicalEnvType', LexicalEnvTypeDto>
    | UnhandledTypeDto;

export interface AnyTypeDto { }

export interface UnknownTypeDto { }

export interface VoidTypeDto { }

export interface NeverTypeDto { }

export interface UnionTypeDto {
    types: TypeDto[];
}

export interface IntersectionTypeDto {
    types: TypeDto[];
}

export interface TupleTypeDto {
    types: TypeDto[];
}

export interface BooleanTypeDto { }

export interface NumberTypeDto { }

export interface BigIntTypeDto { }

export interface StringTypeDto { }

export interface NullTypeDto { }

export interface UndefinedTypeDto { }

export interface LiteralTypeDto {
    literal: string | number | boolean;
}

export interface ClassTypeDto {
    signature: ClassSignatureDto;
    typeParameters?: TypeDto[];
}

export interface FunctionTypeDto {
    signature: MethodSignatureDto;
    typeParameters?: TypeDto[];
}

export interface ArrayTypeDto {
    elementType: TypeDto;
    dimensions: number;
}

export interface UnclearReferenceTypeDto {
    name: string;
    typeParameters: TypeDto[];
}

export interface GenericTypeDto {
    name: string;
    constraint?: TypeDto;
    defaultType?: TypeDto;
}

export interface AliasTypeDto {
    name: string;
    originalType: TypeDto;
    signature: AliasTypeSignatureDto;
}

export interface AnnotationNamespaceTypeDto {
    originType: string;
    namespaceSignature: NamespaceSignatureDto;
}

export interface AnnotationTypeQueryTypeDto {
    originType: string;
}

export interface LexicalEnvTypeDto {
    method: MethodSignatureDto;
    closures: LocalDto[];
}

export interface EnumValueTypeDto {
    signature: ClassSignatureDto;
    name: string;
}

export interface UnhandledTypeDto extends UnhandledDto { }

// Import/Export DTOs
export interface ImportInfoDto {
    importName: string;
    importType: string;
    importFrom: string | undefined;
    nameBeforeAs: string | undefined;
    modifiers: number;
}

export interface ExportInfoDto {
    exportName: string;
    exportType: ExportType;
    exportFrom: string | undefined;
    nameBeforeAs: string | undefined;
    modifiers: number;
}

// Local and Constant DTOs
export interface LocalDto {
    name: string;
    type: TypeDto;
}

export interface ConstantDto {
    value: string;
    type: TypeDto;
}

// Value DTOs using polymorphic pattern
export type ValueDto =
    | Polymorphic<'Local', LocalValueDto>
    | Polymorphic<'Constant', ConstantValueDto>
    | Polymorphic<'NewExpr', NewExprDto>
    | Polymorphic<'NewArrayExpr', NewArrayExprDto>
    | Polymorphic<'DeleteExpr', DeleteExprDto>
    | Polymorphic<'AwaitExpr', AwaitExprDto>
    | Polymorphic<'YieldExpr', YieldExprDto>
    | Polymorphic<'TypeOfExpr', TypeOfExprDto>
    | Polymorphic<'InstanceOfExpr', InstanceOfExprDto>
    | Polymorphic<'CastExpr', CastExprDto>
    | Polymorphic<'PhiExpr', PhiExprDto>
    | Polymorphic<'ConditionExpr', ConditionExprDto>
    | Polymorphic<'BinopExpr', BinopExprDto>
    | Polymorphic<'UnopExpr', UnopExprDto>
    | Polymorphic<'InstanceCallExpr', InstanceCallExprDto>
    | Polymorphic<'StaticCallExpr', StaticCallExprDto>
    | Polymorphic<'PtrCallExpr', PtrCallExprDto>
    | Polymorphic<'ThisRef', ThisRefDto>
    | Polymorphic<'ParameterRef', ParameterRefDto>
    | Polymorphic<'ArrayRef', ArrayRefDto>
    | Polymorphic<'CaughtExceptionRef', CaughtExceptionRefDto>
    | Polymorphic<'GlobalRef', GlobalRefDto>
    | Polymorphic<'ClosureFieldRef', ClosureFieldRefDto>
    | Polymorphic<'InstanceFieldRef', InstanceFieldRefDto>
    | Polymorphic<'StaticFieldRef', StaticFieldRefDto>
    | UnhandledValueDto;

export interface LocalValueDto extends LocalDto { }

export interface ConstantValueDto extends ConstantDto { }

export interface NewExprDto {
    classType: TypeDto;
}

export interface NewArrayExprDto {
    elementType: TypeDto;
    size: ValueDto;
}

export interface DeleteExprDto {
    arg: ValueDto;
}

export interface AwaitExprDto {
    arg: ValueDto;
}

export interface YieldExprDto {
    arg: ValueDto;
}

export interface TypeOfExprDto {
    arg: ValueDto;
}

export interface InstanceOfExprDto {
    arg: ValueDto;
    checkType: TypeDto;
}

export interface CastExprDto {
    arg: ValueDto;
    type: TypeDto;
}

export interface PhiExprDto {
    args: ValueDto[];
    blocks: number[];
    type: TypeDto;
}

export interface ConditionExprDto {
    op: string;
    left: ValueDto;
    right: ValueDto;
    type: TypeDto;
}

export interface BinopExprDto {
    op: string;
    left: ValueDto;
    right: ValueDto;
}

export interface UnopExprDto {
    op: string;
    arg: ValueDto;
}

export interface InstanceCallExprDto {
    instance: ValueDto;
    method: MethodSignatureDto;
    args: ValueDto[];
}

export interface StaticCallExprDto {
    method: MethodSignatureDto;
    args: ValueDto[];
}

export interface PtrCallExprDto {
    ptr: ValueDto;
    method: MethodSignatureDto;
    args: ValueDto[];
}

export interface ThisRefDto {
    type: TypeDto;
}

export interface ParameterRefDto {
    index: number;
    type: TypeDto;
}

export interface ArrayRefDto {
    array: ValueDto;
    index: ValueDto;
    type: TypeDto;
}

export interface CaughtExceptionRefDto {
    type: TypeDto;
}

export interface GlobalRefDto {
    name: string;
    ref: ValueDto | null;
}

export interface ClosureFieldRefDto {
    base: LocalDto;
    fieldName: string;
    type: TypeDto;
}

export interface InstanceFieldRefDto {
    instance: ValueDto;
    field: FieldSignatureDto;
}

export interface StaticFieldRefDto {
    field: FieldSignatureDto;
}

export interface UnhandledValueDto extends UnhandledDto {
    type: TypeDto;
}

// Statement DTOs using polymorphic pattern
export type StmtDto =
    | Polymorphic<'AssignStmt', AssignStmtDto>
    | Polymorphic<'CallStmt', CallStmtDto>
    | Polymorphic<'IfStmt', IfStmtDto>
    | Polymorphic<'ReturnVoidStmt', ReturnVoidStmtDto>
    | Polymorphic<'ReturnStmt', ReturnStmtDto>
    | Polymorphic<'ThrowStmt', ThrowStmtDto>
    | UnhandledStmtDto;

export interface AssignStmtDto {
    left: ValueDto;
    right: ValueDto;
}

export interface CallStmtDto {
    expr: ValueDto;
}

export interface IfStmtDto {
    condition: ValueDto;
}

export interface ReturnVoidStmtDto { }

export interface ReturnStmtDto {
    arg: ValueDto;
}

export interface ThrowStmtDto {
    arg: ValueDto;
}

export interface UnhandledStmtDto extends UnhandledDto { }

// Basic Block and CFG DTOs
export interface BasicBlockDto {
    id: number;
    successors: number[];
    predecessors: number[];
    stmts: StmtDto[];
}

export interface CfgDto {
    blocks: BasicBlockDto[];
}

// Method Body DTO
export interface MethodBodyDto {
    locals: LocalDto[];
    cfg: CfgDto;
}

// Field DTO
export interface FieldDto {
    signature: FieldSignatureDto;
    modifiers: number;
    decorators: DecoratorDto[];
    questionToken: boolean;
    exclamationToken: boolean;
}

// Method DTO
export interface MethodDto {
    signature: MethodSignatureDto;
    modifiers: number;
    decorators: DecoratorDto[];
    typeParameters?: TypeDto[];
    body?: MethodBodyDto;
}

// Class DTO
export interface ClassDto {
    signature: ClassSignatureDto;
    modifiers: number;
    decorators: DecoratorDto[];
    typeParameters?: TypeDto[];
    category: ClassCategory;
    superClassName?: string;
    implementedInterfaceNames: string[];
    fields: FieldDto[];
    methods: MethodDto[];
}

// Namespace DTO
export interface NamespaceDto {
    signature: NamespaceSignatureDto;
    classes: ClassDto[];
    namespaces: NamespaceDto[];
}

// File DTO
export interface ArkFileDto {
    signature: FileSignatureDto;
    namespaces: NamespaceDto[];
    classes: ClassDto[];
    importInfos: ImportInfoDto[];
    exportInfos: ExportInfoDto[];
}

// Scene DTO
export interface SceneDto {
    files: ArkFileDto[];
    sdkFiles: ArkFileDto[];
}
