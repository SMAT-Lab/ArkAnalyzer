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
    FunctionType,
    GenericType,
    Type,
    UnclearReferenceType,
    UnionType,
    UnknownType,
} from '../../../core/base/Type';
import { CxxArrayType, CxxNonType, PointerType, ReferCategory, ReferenceType } from '../../base/Type';
import { TypeInference } from '../../common/TypeInference';
import { ArkField } from '../../../core/model/ArkField';
import { ArkClass } from '../../../core/model/ArkClass';
import { ArkMethod } from '../../../core/model/ArkMethod';
import { MethodParameter } from '../../../core/model/builder/ArkMethodBuilder';
import { modifierKind2CxxEnum } from '../../../core/model/ArkBaseModel';
import { buildGenericType } from '../../../core/model/builder/builderUtils';
import { CxxAstNode, CxxTranslationUnit, defaultArg } from '../../ast/ArkCxxAstNode';
import { Decorator } from '../../../core/base/Decorator';
import { buildArkMethodFromArkClass } from './ArkMethodBuilder';
import { ArkFile } from '../../../core/model/ArkFile';
import { BuiltinCxx } from '../../common/Builtin';
import { CxxModelUtils } from '../../common/ModelUtils';
import Logger, { LOG_MODULE_TYPE } from '../../../utils/logger';

const FUNC_PTR_REGEX = /\(\s*\*\s*(?:\[\s*[^]]*\s*\])?\s*\)\s*\(\s*[^)]*\s*\)/;
const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'ArkValueTransformer');

function extractCommonModifiers(node: CxxAstNode): number {
    let modifiers: number = 0;
    if (!node.modifiers) {
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
        if (innerNode.kind === 'TemplateTypeParmDecl') {
            let defaultType;
            if (innerNode.inner && innerNode.inner.length > 0) {
                innerNode.default = innerNode.inner[0].type.qualType;
            }
            if (innerNode.defaultArg) {
                defaultType = cxxNode2Type(innerNode, arkInstance);
            }
            let templateType = new GenericType(innerNode.name, defaultType);
            templateType.setIndex(++index);
            genericTypes.push(templateType);
        } else if (innerNode.kind === 'NonTypeTemplateParmDecl') {
            let templateType;
            if (innerNode.type.qualType === 'auto') {
                templateType = new CxxNonType(innerNode.name, undefined, true);
            } else {
                const nonType = cxxNode2Type(innerNode, arkInstance, sourceFile);
                templateType = new CxxNonType(innerNode.name, nonType);
            }
            templateType.setIndex(++index);
            genericTypes.push(templateType);
        }
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
            methodParameter.setType(buildGenericType(cxxNode2Type(parameter, arkInstance, sourceFile, parameter), arkInstance));
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
        if (nodeType?.qualType) {
            const qualType = nodeType.qualType;
            if (qualType.includes('noexcept') && !qualType.includes('noexcept(false)')) {
                method.addModifier(modifierKind2CxxEnum('noexcept'));
            }
        }
        let isLambdaFunc = nodeType.qualType.startsWith('(lambda at');
        if (!isLambdaFunc) {
            // Retrieve the function return value portion from the function signature
            mtdNode.type.qualType = nodeType.qualType.split('(')[0].trim();
        } else if (mtdNode.inner[0]?.inner[0]?.type.qualType.includes(' -> ')) {
            // Handle lambda functions with return values
            mtdNode.type.qualType = mtdNode.inner[0].inner[0].type.qualType.split(' -> ')[1];
        } else {
            // Lambda function without return value
            return UnknownType.getInstance();
        }
        return cxxNode2Type(mtdNode, method, sourceFile);
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
    nodeQualType: CxxAstNode,
    arkInstance: ArkMethod | ArkClass | ArkField | undefined,
    sourceFile?: CxxAstNode,
    currNode?: CxxAstNode,
    defaultArg?: defaultArg,
): Type {
    if (defaultArg) {
        return buildTypeFromPreStr(defaultArg.type.qualType, nodeQualType as CxxAstNode, arkInstance);
    }

    // Handle function pointer type
    if (currNode && arkInstance instanceof ArkMethod && isCxxFunctionPointer(currNode.type.qualType)) {
        return buildFuncPtrType(currNode, arkInstance, sourceFile!);
    }
    // Default processing
    let typeString = getTrueTypeString(nodeQualType);
    if (typeString === '') {
        return UnknownType.getInstance();
    }
    if (nodeQualType.kind === 'InitListExpr' && typeString === 'void') {
        let multipleTypePara: Type[] = [];
        nodeQualType.inner.forEach((item: CxxAstNode) => {
            multipleTypePara.push(cxxNode2Type(item, arkInstance, sourceFile));
        });
        return new UnionType(multipleTypePara);
    }

    return buildTypeFromPreStr(typeString, nodeQualType, arkInstance);
}

function getTrueTypeString(nodeQualType: CxxAstNode): string {
    if (nodeQualType.kind === 'CXXTypeidExpr' && nodeQualType.typeArg) {
        return nodeQualType.typeArg.desugaredQualType ?? nodeQualType.typeArg.qualType;
    } else if (['TemplateTypeParmDecl', 'TemplateTypeParmVarDecl'].includes(nodeQualType.kind) && nodeQualType.defaultArg) {
        return nodeQualType.defaultArg.type.desugaredQualType ?? nodeQualType.defaultArg.type.qualType;
    } else if (nodeQualType.type){
        return nodeQualType.type.desugaredQualType ?? nodeQualType.type.qualType;
    }
    return '';
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
export function buildTypeFromPreStr(preStr: string, node: CxxAstNode, arkInstance: ArkMethod | ArkClass | ArkField | undefined): Type {
    // 1. Remove modifiers such as const/static/mutable
    preStr = preStr.replace(/\b(const|static|mutable)\s*\b/g, '');

    // 2. One traversal simultaneously counts the number of references and pointers, and constructs a base string without references
    let referenceCount = 0;
    let pointerLevel = 0;
    let baseStr = '';
    for (let i = 0; i < preStr.length; i++) {
        const char = preStr[i];
        if (char === '&') {
            referenceCount++;
        } else if (char === '*') {
            pointerLevel++;
            baseStr += char;  // Keep * characters
        } else {
            baseStr += char;  // Keep other characters
        }
    }
    baseStr = baseStr.trim();  // Remove the leading and trailing spaces

    // 3. Handling reference types
    if (referenceCount > 0) {
        return buildReferenceType(baseStr, referenceCount, node, arkInstance);
    }

    // 4. Array judgment
    if (baseStr.includes('[') && baseStr.includes(']')) {
        return buildArrayType(baseStr, node, arkInstance);
    }

    // 5. Handling pointer types

    if (pointerLevel > 0) {
        baseStr = baseStr.replace(/\*/g, '').trim();
        return buildPointerType(baseStr, pointerLevel, node, arkInstance);
    }

    // 6. template
    let templateTypes: GenericType[] | undefined;
    if (arkInstance instanceof ArkMethod) {
        templateTypes = arkInstance.getGenericTypes() ?? arkInstance.getDeclaringArkClass()?.getGenericsTypes();
    } else if (arkInstance instanceof ArkClass) {
        templateTypes = arkInstance.getGenericsTypes();
    }
    if (templateTypes) {
        for (const t of templateTypes) {
            if (preStr === t.getName()) {
                return t;
            }
        }
    }

    // 7. Base type
    const baseTypeStr = convertDataType(baseStr);
    if (baseTypeStr !== 'unsupported') {
        return TypeInference.buildTypeFromStr(baseTypeStr, baseStr);
    }

    // 8.STL Type and custom type
    return buildTypeFromDerivedType(baseStr, node, arkInstance);
}

export function buildArrayType(qualType: string, node: CxxAstNode, arkInstance: ArkMethod | ArkClass | ArkField | undefined): Type {
    const count = qualType.match(/\[/g)?.length ?? 0;
    let baseType = buildTypeFromPreStr(qualType.slice(0, qualType.indexOf('[')) +
        qualType.slice(qualType.lastIndexOf(']') + 1), node, arkInstance);
    let dimensionSizes: number[] = [];
    const dimensionMatches = qualType.match(/\[(\d*)\]/g);
    if (dimensionMatches) {
        dimensionSizes = dimensionMatches.map(dim => {
            const numStr = dim.match(/\d+/)?.[0];
            return numStr ? parseInt(numStr, 10) : 0;
        });
    } else {
        // If dimensions cannot be extracted from the string, try getting them from node-INNER
        try {
            for (let i = 0; i < count; i++) {
                dimensionSizes.push(Number(node.inner[i].value) ?? 0);
            }
        } catch (e) {
            logger.error('this node case is unexpect');
        }
    }
    if (baseType instanceof UnclearReferenceType) {
        return new CxxArrayType(new UnclearReferenceType(qualType.slice(0, qualType.indexOf('['))), count);
    }
    return new CxxArrayType(baseType, count, dimensionSizes);
}

export function buildPointerType(preStr: string, pointerLevel: number, node: CxxAstNode, arkInstance: ArkMethod | ArkClass | ArkField | undefined): Type {
    let baseType = buildTypeFromPreStr(preStr, node, arkInstance);
    const pointerType = new PointerType(baseType, pointerLevel);
    let oriStr = node.type.qualType;
    const starIndex = oriStr.indexOf('*');
    if (starIndex === -1) {
        return pointerType;
    }
    // Analyze the const keywords to the left and right of the asterisk
    const leftPart = oriStr.substring(0, starIndex);
    const rightPart = oriStr.substring(starIndex + 1);

    pointerType.setIsPointerToVolatileType(/\bvolatile\b/.test(leftPart));
    pointerType.setIsVolatilePointer(/\bvolatile\b/.test(rightPart));
    pointerType.setIsPointerToConst(/\bconst\b/.test(leftPart));
    pointerType.setIsConstPointer(/\bconst\b/.test(rightPart));

    return pointerType;
}

export function buildReferenceType(preStr: string, referenceCount: number, node: CxxAstNode, arkInstance: ArkMethod | ArkClass | ArkField | undefined): Type {
    let referCategory = referenceCount % 2 === 1 ? ReferCategory.LVALUE_REF : ReferCategory.RVALUE_REF;
    // cxxTodo: this need to confirm;
    preStr = preStr.replace(/(\(\))+$/g, '');
    let baseType = buildTypeFromPreStr(preStr, node, arkInstance);
    if (baseType instanceof GenericType && referenceCount % 2 === 0) {
        referCategory = ReferCategory.UNIVERSAL_REF;
    }
    return new ReferenceType(baseType, referCategory);
}

export function isCXXSTLContainer(qualType: string): boolean {
    let STLContainerPtn = /(set|map|vector|queue|deque|stack|list|pair)<[^>]*>/g;
    return STLContainerPtn.test(qualType);
}

export function isFuncInClassOrNamespace(callNode: CxxAstNode): boolean {
    return callNode.kind === 'DeclRefExpr' && callNode.inner.length === 0 &&
        callNode.code.includes('::') && !callNode.code.startsWith(BuiltinCxx.CXXSTDREF);

}

export function isCxxBasicString(qualType: string): boolean {
    const preType = qualType.replace(/\b(const|static|mutable)\s*\b/g, '');
    return convertDataType(preType) === 'string';
}

export function buildTypeFromDerivedType(preStr: string, node: CxxAstNode, arkInstance: ArkMethod | ArkClass | ArkField | undefined): Type {
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
    let innerType = innerPart === null ? [] : [buildTypeFromPreStr(innerPart, node, arkInstance)];

    let arkClass: ArkClass | null = null;
    if (arkInstance instanceof ArkMethod || arkInstance instanceof ArkClass) {
        const file = arkInstance.getDeclaringArkFile?.();
        arkClass = file?.getClassWithName?.(typeStr) ??
            getAnonymousClassByTypeCode(typeStr, file) ??
            CxxModelUtils.getClassFromAnonymousNamespaceByName(typeStr, file);
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
    'unsignedchar': 'string',
    wchar_t: 'string',
    char16_t: 'string',
    char32_t: 'string',
    'std::basic_string<char>': 'string',
    'basic_string<char>': 'string',
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
    const formattedTypeName = typeName.replace(BuiltinCxx.CXXSTDREF, '');
    return typeMap[formattedTypeName] ?? 'unsupported';
}
