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
    ClassType,
    GenericType,
    Type,
    UnknownType,
    PointerType,
    ReferenceType,
    ReferCategory,
    UnclearReferenceType,
    FunctionPointer,
} from '../../../core/base/Type';
import { TypeInference } from '../../common/TypeInference';
import { ArkField } from '../../../core/model/ArkField';
import { ArkClass } from '../../../core/model/ArkClass';
import { ArkMethod } from '../../../core/model/ArkMethod';
import { MethodParameter } from '../../../core/model/builder/ArkMethodBuilder';
import { modifierKind2EnumCpp } from '../../../core/model/ArkBaseModel';
import { buildGenericType } from '../../../core/model/builder/builderUtils';
import { CppAstNode, CppTypeInfo } from '../../../ast/ArkCxxAstNode';
import { Decorator } from '../../../core/base/Decorator';

function extractCommonModifiers(node: CppAstNode): number {
    let modifiers: number = 0;
    const nodeType: string = node?.type?.qualType ?? '';

    if (Object.prototype.hasOwnProperty.call(node, 'access')) {
        modifiers |= modifierKind2EnumCpp(node.access ?? '');
    }
    if (Object.prototype.hasOwnProperty.call(node, 'storageClass')) {
        modifiers |= modifierKind2EnumCpp(node.storageClass ?? '');
    }
    if (nodeType.includes('const')) {
        modifiers |= modifierKind2EnumCpp('const');
    }
    return modifiers;
}

function hasOverrideAttr(inner: CppAstNode[] | undefined): boolean {
    if (!inner) {
        return false;
    }
    return inner.some(child => child.kind === 'attribute(override)');
}

function getMtdModifier(node: CppAstNode, modifiers: number): number {
    if (node.code.startsWith('virtual ')) {
        modifiers |= modifierKind2EnumCpp('virtual');
        // Definition of pure virtual function: virtual func()=0/virtual func()=0
        if (node.code.endsWith('= 0') || node.code.endsWith('=0')) {
            modifiers |= modifierKind2EnumCpp('pure virtual');
        }
    }
    if (hasOverrideAttr(node.inner)) {
        modifiers |= modifierKind2EnumCpp('override');
    }
    return modifiers;
}

export function buildModifiers(node: CppAstNode): number {
    let modifiers = extractCommonModifiers(node);

    if (node.kind === 'CXXMethodDecl') {
        modifiers = getMtdModifier(node, modifiers);
    }
    if (node.kind === 'FriendDecl') {
        modifiers |= modifierKind2EnumCpp('friend');
    }
    return modifiers;
}

export function buildDecorators(node: CppAstNode, sourceFile: CppAstNode): Set<Decorator> {
    let decorators: Set<Decorator> = new Set();
    return decorators;
}

export function buildModifiersForCxxCls(cls: ArkClass): number {
    const mtds = cls.getMethods();
    for (const mtd of mtds) {
        // 如果类内有纯虚的成员函数，则该类是抽象类
        if (mtd.isPureVirtual()) {
            return modifierKind2EnumCpp('abstract');
        }
    }
    return 0;
}

export function buildTypeParameters(clsNode: CppAstNode, sourceFile: CppAstNode, arkInstance: ArkMethod | ArkClass): GenericType[] {
    const genericTypes: GenericType[] = [];
    let index = -1;
    for (const innerNode of clsNode.inner) {
        if (innerNode.kind !== 'TemplateTypeParameter') {
            continue;
        }
        let typename = innerNode.name;
        let defaultType;
        if (innerNode.inner && innerNode.inner.length > 0) {
            innerNode.default = innerNode.inner[0].type.qualType;
        }
        if (innerNode.default) {
            defaultType = cppNode2Type(innerNode.default, arkInstance, sourceFile);
        }
        let templateType = new GenericType(typename, defaultType);
        templateType.setIndex(++index);
        genericTypes.push(templateType);
    }
    return genericTypes;
}

export function buildParameters(params: CppAstNode[], arkInstance: ArkMethod | ArkField, sourceFile: CppAstNode): MethodParameter[] {
    let parameters: MethodParameter[] = [];
    if (!params || params.length === 0) {
        return [];
    }
    params.forEach((parameter: CppAstNode) => {
        let methodParameter = new MethodParameter();

        // name
        if (parameter.name) {
            methodParameter.setName(parameter.name.toString());
        } else {
            methodParameter.setName('');
        }
        // type
        if (parameter.type) {
            methodParameter.setType(buildGenericType(cppNode2Type(parameter.type.qualType, arkInstance, sourceFile), arkInstance));
        } else {
            methodParameter.setType(UnknownType.getInstance());
        }

        parameters.push(methodParameter);
    });
    return parameters;
}

export function buildReturnType(mtdNode: CppAstNode, sourceFile: CppAstNode, method: ArkMethod): Type {
    let nodeType = mtdNode.type;
    if (nodeType) {
        let funcRetType;
        let isLambdaFunc = nodeType.qualType.startsWith('(lambda at');
        if (!isLambdaFunc) {
            // Ordinary function
            funcRetType = nodeType.qualType.split('(')[0].trim();
        } else if (mtdNode.inner[0]?.inner[0]?.type.qualType.includes(' -> ')) {
            // Handle lambda functions with return values
            funcRetType = mtdNode.inner[0].inner[0].type.qualType.split(' -> ')[1];
        } else {
            // Lambda function without return value
            return UnknownType.getInstance();
        }
        return cppNode2Type(funcRetType, method, sourceFile);
    } else {
        return UnknownType.getInstance();
    }
}

/**
 *Convert C++AST node to Type
 *@ param nodeQualType - type information of C++AST node or string type
 *@ param arkInstance - Ark instance (method, class or field) that may contain generic information
 *@ param sourceFile - optional source file node
 *@ returns Type after conversion
 */
export function cppNode2Type(nodeQualType: CppAstNode | string, arkInstance: ArkMethod | ArkClass | ArkField | undefined, sourceFile?: CppAstNode): Type {
    // Handle special type
    if (nodeQualType === 'void () const') {
        return buildTypeFromPreStr('VoidKeyword', arkInstance);
    }
    // Handle generic types
    let templateTypes: GenericType[] | undefined;
    if (arkInstance instanceof ArkMethod) {
        templateTypes = arkInstance.getGenericTypes() ?? arkInstance.getDeclaringArkClass()?.getGenericsTypes();
    } else if (arkInstance instanceof ArkClass) {
        templateTypes = arkInstance.getGenericsTypes();
    }
    if (templateTypes) {
        for (const t of templateTypes) {
            if (nodeQualType === t.getName()) {
                return t;
            }
        }
    }

    // Default processing
    return buildTypeFromPreStr(nodeQualType.toString(), arkInstance);
}

/**
 *The corresponding Type object is constructed according to the pre type string and the optional Ark instance.
 *
 *The main processing flow of this function includes:
 *1 Remove modifiers (such as const, static, mutable);
 *2 Judge whether it is a function pointer, and handle pointers and references;
 *3 Type inference to generate basic types;
 *4 Wrap the final Type object according to the pointer level and the number of references.
 *
 *@ param preStr The original pre type string, such as "const int *" or "std:: vector<int>&"
 *@ param arkInstance The optional ArkMethod, ArkClass or ArkField instances are used to assist type construction
 *@ returns Type object constructed
 */
export function buildTypeFromPreStr(preStr: string, arkInstance: ArkMethod | ArkClass | ArkField | undefined): Type {
    // 1. Remove modifiers such as const/static/mutable
    preStr = preStr.replace(/\b(const|static|mutable)\s*\b/g, '');
    let isFuncPtr = false;
    const funcPtrRegex = /\(\s*\*\s*\)\s*\(\s*[^)]*\s*\)/;
    if (funcPtrRegex.test(preStr)){
        isFuncPtr = true;
    }
    let pointerLevel = 0;
    let referenceCount = 0;
    // 2. Handle pointers and references; only process if not an STL container
    if (!isCXXSTLContainer(preStr)) {
        referenceCount = (preStr.match(/&/g) || []).length;
        preStr = preStr.replace(/&/g, '').trim();
        pointerLevel = (preStr.match(/\*/g) || []).length;
        if (isFuncPtr){
            preStr = preStr.replace(/(\*)(\*+)/g, '$1').trim();
        } else {
            preStr = preStr.replace(/\*/g, '').trim();
        }
    }

    // 3. Infer the type
    const postStr = convertDataType(preStr);
    let baseType: Type;
    if (isFuncPtr){
        const info: CppTypeInfo = { qualType: preStr };
        baseType = new FunctionPointer(info);
    } else if (postStr === 'unsupported'){
        baseType = buildTypeFromDerivedType(preStr, arkInstance);
    } else {
        baseType = TypeInference.buildTypeFromStr(postStr, preStr);
    }
    // Need to Handle precedence between pointers and other types/modifiers
    // 4. Wrap pointers and references
    if (pointerLevel > 0 && !(baseType instanceof FunctionPointer) || pointerLevel > 1) {
        baseType = new PointerType(baseType, pointerLevel);
    }
    // Handle reference types
    if (referenceCount > 0) {
        return buildReferenceType(preStr, arkInstance, referenceCount, baseType);
    }
    return baseType;
}

export function buildReferenceType(preStr: string, arkInstance: ArkMethod | ArkClass | ArkField | undefined, referenceCount: number, baseType: Type): Type {
    let referCategory = referenceCount % 2 === 1 ? ReferCategory.LVALUE_REF : ReferCategory.RVALUE_REF;
    if (baseType instanceof UnclearReferenceType) {
        baseType = cppNode2Type(preStr, arkInstance);
    }
    if (baseType instanceof GenericType && referenceCount % 2 === 0) {
        referCategory = ReferCategory.UNIVERSAL_REF;
    }
    return new ReferenceType(baseType, referCategory);
}

export function isCXXSTLContainer(qualType: string):boolean {
    let STLContainerPtn = /(set|map|vector|queue|deque|stack|list|pair)<[^>]*>/g;
    return STLContainerPtn.test(qualType);
}

export function buildTypeFromDerivedType(preStr: string, arkInstance: ArkMethod | ArkClass | ArkField | undefined): Type {
    const outerPartMatch = preStr.match(/^([^<]+)/);
    const outerPart = outerPartMatch ? outerPartMatch[1] : null;
    let typeStr: string;
    if (outerPart === null) {
        typeStr = preStr.trim().split(' ')[0];
    } else {
        typeStr = outerPart.trim().split(' ')[0];
    }
    const innerPartMatch = preStr.match(/<([^>]+)>/);
    const innerPart = innerPartMatch ? innerPartMatch[1] : null;
    let innerType = innerPart === null ? [] : [buildTypeFromPreStr(innerPart, arkInstance)];

    let arkClass: ArkClass | null = null;
    if (arkInstance instanceof ArkMethod || arkInstance instanceof ArkClass) {
        const file = arkInstance.getDeclaringArkFile?.();
        arkClass = file?.getClassWithName?.(typeStr) ?? null;
    }
    if (arkClass) {
        return new ClassType(arkClass.getSignature(), innerType);
    }
    return TypeInference.buildTypeFromStr(preStr);
}

const typeMap: Record<string, string> = {
    bool: 'boolean',
    //字符串相关
    string: 'string',
    'std::string': 'string',
    char: 'string',
    'signed char': 'string',
    wchar_t: 'string',
    char16_t: 'string',
    char32_t: 'string',
    'std::basic_string<char>': 'string',
    // 数字相关
    short: 'number',
    'unsigned short': 'number',
    'unsigned int': 'number',
    int: 'number',
    long: 'number',
    'unsigned long': 'number',
    'long long': 'number',
    'unsigned long long': 'number',
    float: 'number',
    double: 'number',
    'long double': 'number',
    uint8_t: 'number',
    uint16_t: 'number',
    uint32_t: 'number',
    uint64_t: 'number',
    int8_t: 'number',
    int16_t: 'number',
    int32_t: 'number',
    int64_t: 'number',
    // void
    void: 'void',
};

export function convertDataType(typeName: string): string {
    return typeMap[typeName] ?? 'unsupported';
}
