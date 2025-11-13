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
    UnclearReferenceType,
    FunctionType,
} from '../../../core/base/Type';
import { PointerType, ReferenceType, ReferCategory, NapiType, SmartPointerType } from '../../base/Type';
import { TypeInference } from '../../common/TypeInference';
import { ArkField } from '../../../core/model/ArkField';
import { ArkClass } from '../../../core/model/ArkClass';
import { ArkMethod } from '../../../core/model/ArkMethod';
import { MethodParameter } from '../../../core/model/builder/ArkMethodBuilder';
import { modifierKind2CxxEnum } from '../../../core/model/ArkBaseModel';
import { buildGenericType } from '../../../core/model/builder/builderUtils';
import { CxxAstNode, CxxTranslationUnit } from '../../ast/ArkCxxAstNode';
import { Decorator } from '../../../core/base/Decorator';
import { buildArkMethodFromArkClass } from './ArkMethodBuilder';
import { ArkFile } from '../../../core/model/ArkFile';
import { BuiltinCxx } from '../../common/Builtin';

const FUNC_PTR_REGEX = /\(\s*\*\s*(?:\[\s*[^]]*\s*\])?\s*\)\s*\(\s*[^)]*\s*\)/;

function extractCommonModifiers(node: CxxAstNode): number {
    let modifiers: number = 0;
    if (!node.modifiers){
        return modifiers;
    }
    for (let i = 0; i < node.modifiers.length; i++) {
        if (Object.prototype.hasOwnProperty.call(node, 'modifiers')) {
            modifiers |= modifierKind2CxxEnum(node.modifiers[i]);
        }
    }
    if (Object.prototype.hasOwnProperty.call(node, 'storageClass')) {
        modifiers |= modifierKind2CxxEnum(node.storageClass ?? '');
    }
    return modifiers;
}

function hasOverrideAttr(inner: CxxAstNode[] | undefined): boolean {
    if (!inner) {
        return false;
    }
    return inner.some(child => child.kind === 'attribute(override)');
}

function getMtdModifier(node: CxxAstNode, modifiers: number): number {
    if (node.code.startsWith('virtual ')) {
        modifiers |= modifierKind2CxxEnum('virtual');
        // Definition of pure virtual function: virtual func()=0/virtual func()=0
        if (node.code.endsWith('= 0') || node.code.endsWith('=0')) {
            modifiers |= modifierKind2CxxEnum('pure virtual');
        }
    }
    if (hasOverrideAttr(node.inner)) {
        modifiers |= modifierKind2CxxEnum('override');
    }
    return modifiers;
}

export function buildModifiers(node: CxxAstNode): number {
    let modifiers = extractCommonModifiers(node);

    if (node.kind === 'CXXMethodDecl') {
        modifiers = getMtdModifier(node, modifiers);
    }
    if (node.kind === 'FriendDecl') {
        modifiers |= modifierKind2CxxEnum('friend');
    }
    return modifiers;
}

export function buildDecorators(node: CxxAstNode, sourceFile: CxxAstNode): Set<Decorator> {
    let decorators: Set<Decorator> = new Set();
    return decorators;
}

export function buildModifiersForCxxClass(cls: ArkClass): number {
    const mtds = cls.getMethods();
    for (const mtd of mtds) {
        // If a class contains a pure virtual member function, then the class is an abstract class.
        if (mtd.isPureVirtual()) {
            return modifierKind2CxxEnum('abstract');
        }
    }
    return 0;
}

export function buildTypeParameters(clsNode: CxxAstNode, sourceFile: CxxAstNode, arkInstance: ArkMethod | ArkClass): GenericType[] {
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
            defaultType = cxxNode2Type(innerNode.default, arkInstance, sourceFile);
        }
        let templateType = new GenericType(typename, defaultType);
        templateType.setIndex(++index);
        genericTypes.push(templateType);
    }
    return genericTypes;
}

export function buildParameters(params: CxxAstNode[], arkInstance: ArkMethod | ArkField, sourceFile: CxxAstNode): MethodParameter[] {
    let parameters: MethodParameter[] = [];
    if (!params || params.length === 0) {
        return [];
    }
    params.forEach((parameter: CxxAstNode) => {
        let methodParameter = new MethodParameter();

        // name
        if (parameter.name) {
            methodParameter.setName(parameter.name.toString());
        } else {
            methodParameter.setName('');
        }
        // Is it optional,If there are default parameters, they should be set as optional parameters
        if (parameter.inner.length > 0 && parameter.inner[parameter.inner.length - 1].kind !== 'TypeRef') {
            methodParameter.setOptional(true);
        }
        // type
        if (parameter.type) {
            methodParameter.setType(buildGenericType(cxxNode2Type(parameter.type.qualType, arkInstance, sourceFile, parameter), arkInstance));
        } else {
            methodParameter.setType(UnknownType.getInstance());
        }

        parameters.push(methodParameter);
    });
    return parameters;
}

export function buildReturnType(mtdNode: CxxAstNode, sourceFile: CxxAstNode, method: ArkMethod): Type {
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
        return cxxNode2Type(funcRetType, method, sourceFile);
    } else {
        return UnknownType.getInstance();
    }
}

export function isCxxFunctionPointer(type: string): boolean {
    return FUNC_PTR_REGEX.test(type);
}

export function buildFuncPtrType(funcPtrNode: CxxAstNode, arkMtd: ArkMethod, sourceFile: CxxAstNode | CxxTranslationUnit): Type {
    const anonymousMethod = new ArkMethod();
    const declaringClass = arkMtd.getDeclaringArkClass();
    buildArkMethodFromArkClass(funcPtrNode, declaringClass, anonymousMethod, sourceFile);
    const funcType = new FunctionType(anonymousMethod.getSignature());
    return new PointerType(funcType, 1);
}

/**
 *Convert C++AST node to Type
 *@ param nodeQualType - type information of C++AST node or string type
 *@ param arkInstance - Ark instance (method, class or field) that may contain generic information
 *@ param sourceFile - optional source file node
 *@ returns Type after conversion
 */
export function cxxNode2Type(
    nodeQualType: CxxAstNode | string,
    arkInstance: ArkMethod | ArkClass | ArkField | undefined,
    sourceFile?: CxxAstNode,
    currNode?: CxxAstNode
): Type {
    // Handle function pointer type
    if (currNode && arkInstance instanceof ArkMethod && isCxxFunctionPointer(currNode.type.qualType)) {
        return buildFuncPtrType(currNode, arkInstance, sourceFile!);
    }
    // Handle napi type
    if (typeof nodeQualType === 'string' && nodeQualType.startsWith('napi_') && nodeQualType !== 'napi_property_descriptor') {
        return new NapiType(nodeQualType);
    }
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
    const typeString = typeof nodeQualType === 'string' ? nodeQualType : nodeQualType.type.qualType;
    return buildTypeFromPreStr(typeString, arkInstance);
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
    let pointerLevel = 0;
    let referenceCount = 0;
    // 2. Handle pointers and references; only process if not an STL container
    if (!isCXXSTLContainer(preStr)) {
        referenceCount = (preStr.match(/&/g) || []).length;
        preStr = preStr.replace(/&/g, '').trim();
        pointerLevel = (preStr.match(/\*/g) || []).length;
        preStr = preStr.replace(/\*/g, '').trim();
    }
    // 3. Infer the type
    const postStr = convertDataType(preStr);
    let baseType: Type;
    if (postStr === 'unsupported') {
        baseType = buildTypeFromDerivedType(preStr, arkInstance);
    } else {
        baseType = TypeInference.buildTypeFromStr(postStr, preStr);
    }
    // Need to Handle precedence between pointers and other types/modifiers
    // 4. Wrap pointers and references
    if (pointerLevel > 0) { // && !(baseType instanceof FunctionPointer) || pointerLevel > 1
        baseType = new PointerType(baseType, pointerLevel);
    }
    if (referenceCount > 0) {
        return buildReferenceType(preStr, arkInstance, referenceCount, baseType);
    }
    if (preStr.includes('unique') || preStr.includes('shared') || preStr.includes('weak')) {
        // Locate the type represented by the smart pointer
        let baseType = cxxNode2Type(preStr.slice(preStr.indexOf('<') + 1, preStr.lastIndexOf('>')), undefined);
        return new SmartPointerType(baseType, 0, preStr);
    }
    if (preStr.includes('__unwrap_ref_decay')) {
        return cxxNode2Type(preStr.slice(preStr.indexOf('<') + 1, preStr.lastIndexOf('>')), undefined);
    }
    return baseType;
}

export function buildReferenceType(preStr: string, arkInstance: ArkMethod | ArkClass | ArkField | undefined, referenceCount: number, baseType: Type): Type {
    let referCategory = referenceCount % 2 === 1 ? ReferCategory.LVALUE_REF : ReferCategory.RVALUE_REF;
    if (baseType instanceof UnclearReferenceType) {
        baseType = cxxNode2Type(preStr, arkInstance);
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

export function isFuncInClassOrNamespace(callExpr: CxxAstNode): boolean {
    let callerNode = callExpr;
    while (callerNode.inner.length !== 0) {
        let innerNode = callerNode.inner[0];
        if ((innerNode.kind === 'NamespaceRef' && innerNode.name !== 'std') || innerNode.kind === 'TypeRef') {
            return true;
        }
        // case: namespace xxx { Func() {} }; using namespace xxx;   Func();
        if (isFuncWithoutNamespace(innerNode)) {
            return true;
        }
        callerNode = innerNode;
    }
    return false;
}

export function isFuncWithoutNamespace(node: CxxAstNode): boolean {
    return node.kind === 'DeclRefExpr' && node.referencedDecl?.kind === 'FunctionDecl' &&
        node.referencedDecl.scope !== undefined && node.referencedDecl.scope !== '' &&
        !node.referencedDecl!.scope!.includes(BuiltinCxx.CXXSTDREF) && node.referencedDecl!.scope !== BuiltinCxx.CXXSTD;
}

export function buildTypeFromDerivedType(preStr: string, arkInstance: ArkMethod | ArkClass | ArkField | undefined): Type {
    const outerPartMatch = preStr.match(/^([^<]+)/);
    const outerPart = outerPartMatch ? outerPartMatch[1] : null;
    let typeStr: string;
    let firstSpaceIndex: number;
    if (outerPart === null) {
        firstSpaceIndex = preStr.indexOf(' ');
        typeStr = firstSpaceIndex === -1 ? preStr : preStr.substring(firstSpaceIndex + 1);
    } else {
        firstSpaceIndex = outerPart.indexOf(' ');
        typeStr = firstSpaceIndex === -1 ? outerPart : outerPart.substring(firstSpaceIndex + 1);
    }
    const innerPartMatch = preStr.match(/<([^>]+)>/);
    const innerPart = innerPartMatch ? innerPartMatch[1] : null;
    let innerType = innerPart === null ? [] : [buildTypeFromPreStr(innerPart, arkInstance)];

    let arkClass: ArkClass | null = null;
    if (arkInstance instanceof ArkMethod || arkInstance instanceof ArkClass) {
        const file = arkInstance.getDeclaringArkFile?.();
        arkClass = file?.getClassWithName?.(typeStr) ?? getAnonymousClassByTypeCode(typeStr, file);
    }
    if (arkClass) {
        return new ClassType(arkClass.getSignature(), innerType);
    }
    return TypeInference.buildTypeFromStr(preStr);
}

/** Handling anonymous cases, such as '(unnamed struct ...)' */
function getAnonymousClassByTypeCode(typeCode: string, file: ArkFile): ArkClass | null {
    for (const cls of file.getClasses()) {
        if (cls.isAnonymousClass() && cls.getCode() === typeCode) {
            return cls;
        }
    }
    return null;
}

const typeMap: Record<string, string> = {
    bool: 'boolean',
    // String
    string: 'string',
    'std::string': 'string',
    char: 'string',
    'signed char': 'string',
    'unsigned char': 'string',
    wchar_t: 'string',
    char16_t: 'string',
    char32_t: 'string',
    'std::basic_string<char>': 'string',
    // Number
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
    size_t: 'number',
    intptr_t: 'number',
    uintptr_t: 'number',
    // void
    void: 'void',
    'std::type_info': 'type_info',
    'type_info': 'type_info',
};

export function convertDataType(typeName: string): string {
    return typeMap[typeName] ?? 'unsupported';
}
