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
} from '../../../../core/base/Type';
import { AutoType, CxxArrayType, CxxNonType, PointerType, ReferCategory, ReferenceType } from '../../base/Type';
import { TypeInference } from '../../common/TypeInference';
import { ArkField } from '../../../../core/model/ArkField';
import { ArkClass } from '../../../../core/model/ArkClass';
import { ArkMethod } from '../../../../core/model/ArkMethod';
import { MethodParameter } from '../../../../core/model/builder/ArkMethodBuilder';
import { ModifierType, modifierKind2CxxEnum } from '../../../../core/model/ArkBaseModel';
import { buildGenericType } from '../../../../core/model/builder/builderUtils';
import { AstKind, CXX_PRIMITIVE_TYPE_MAP, CxxAstNode, CxxTranslationUnit } from '../../utils/ArkCxxAstNode';
import { cxxStorageClassToString } from '../../utils/cppUtils';
import { Decorator } from '../../../../core/base/Decorator';
import { buildArkMethodFromArkClass } from './ArkMethodBuilder';
import { BuiltinCxx } from '../../common/Builtin';
import { CxxModelUtils } from '../../common/ModelUtils';
import Logger, { LOG_MODULE_TYPE } from '../../../../utils/logger';

const FUNC_PTR_REGEX = /\(\s*\*\s*(?:\[\s*[^]]*\s*\])?\s*\)\s*\(\s*[^)]*\s*\)/;
const STORAGE_MODIFIER_PATTERN = /\b(const|static|mutable)\s*\b/g;
const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'ArkValueTransformer');

interface ParsedPreStrShape {
    referenceCount: number;
    pointerLevel: number;
    baseStr: string;
    pointerBaseStr: string;
}

interface DerivedTypeParts {
    typeStr: string;
    innerPart: string | null;
}

function stripStarsFromBaseStr(baseStr: string): string {
    if (!baseStr.includes('*')) {
        return baseStr;
    }
    const withoutStars: string[] = [];
    for (let i = 0; i < baseStr.length; i++) {
        if (baseStr[i] !== '*') {
            withoutStars.push(baseStr[i]);
        }
    }
    return trimCharParts(withoutStars);
}

function computePreStrShape(modifierStripped: string): ParsedPreStrShape {
    let referenceCount = 0;
    let pointerLevel = 0;
    const parts: string[] = [];
    for (let i = 0; i < modifierStripped.length; i++) {
        const char = modifierStripped[i];
        if (char === '&') {
            referenceCount++;
        } else if (char === '*') {
            pointerLevel++;
            parts.push(char);
        } else {
            parts.push(char);
        }
    }
    const baseStr = trimCharParts(parts);
    const pointerBaseStr = pointerLevel > 0 ? stripStarsFromBaseStr(baseStr) : baseStr;
    return {
        referenceCount,
        pointerLevel,
        baseStr,
        pointerBaseStr,
    };
}

/** Build-scoped string parsers used by C++ type-string conversion. Cleared via {@link clearCxxTypeStringCache}. */
class CxxTypeStringCache {
    private static readonly stripCache = new Map<string, string>();
    private static readonly shapeCache = new Map<string, ParsedPreStrShape>();
    private static readonly derivedPartsCache = new Map<string, DerivedTypeParts>();
    private static readonly dataTypeCache = new Map<string, string>();

    private static getOrCompute<V>(cache: Map<string, V>, key: string, compute: () => V): V {
        if (cache.has(key)) {
            return cache.get(key)!;
        }
        const value = compute();
        cache.set(key, value);
        return value;
    }

    public static dispose(): void {
        this.stripCache.clear();
        this.shapeCache.clear();
        this.derivedPartsCache.clear();
        this.dataTypeCache.clear();
    }

    public static stripStorageModifiers(preStr: string): string {
        return this.getOrCompute(this.stripCache, preStr, () => preStr.replace(STORAGE_MODIFIER_PATTERN, ''));
    }

    public static parsePreStrShape(modifierStripped: string): ParsedPreStrShape {
        return this.getOrCompute(this.shapeCache, modifierStripped, () => computePreStrShape(modifierStripped));
    }

    public static parseDerivedTypeParts(preStr: string): DerivedTypeParts {
        return this.getOrCompute(this.derivedPartsCache, preStr, () => {
            const ltIndex = preStr.indexOf('<');
            let outerPart: string | null;
            if (preStr.length === 0 || preStr[0] === '<') {
                outerPart = null;
            } else {
                outerPart = ltIndex === -1 ? preStr : preStr.slice(0, ltIndex);
            }

            let typeStr: string;
            if (outerPart === null) {
                const firstSpaceIndex = preStr.indexOf(' ');
                typeStr = firstSpaceIndex === -1 ? preStr : preStr.slice(firstSpaceIndex + 1);
            } else {
                const firstSpaceIndex = outerPart.indexOf(' ');
                typeStr = firstSpaceIndex === -1 ? outerPart : outerPart.slice(firstSpaceIndex + 1);
            }

            let innerPart: string | null = null;
            if (ltIndex !== -1) {
                const gtIndex = preStr.indexOf('>', ltIndex + 1);
                if (gtIndex !== -1 && gtIndex > ltIndex + 1) {
                    innerPart = preStr.slice(ltIndex + 1, gtIndex);
                }
            }

            return { typeStr, innerPart };
        });
    }

    public static convertDataType(typeName: string): string {
        return this.getOrCompute(this.dataTypeCache, typeName, () => {
            const formattedTypeName = typeName.replace(BuiltinCxx.CXXSTDREF, '');
            return CXX_PRIMITIVE_TYPE_MAP[formattedTypeName] ?? 'unsupported';
        });
    }
}

function trimCharParts(parts: string[]): string {
    let start = 0;
    let end = parts.length;
    while (start < end && parts[start] === ' ') {
        start++;
    }
    while (end > start && parts[end - 1] === ' ') {
        end--;
    }
    return parts.slice(start, end).join('');
}

/** Clears build-scoped caches for C++ type-string parsing in this module. */
export function clearCxxTypeStringCache(): void {
    CxxTypeStringCache.dispose();
}

function extractCommonModifiers(node: CxxAstNode): number {
    let modifiers = node.modifierFlags ?? 0;
    if (node.storageClass !== undefined) {
        modifiers |= modifierKind2CxxEnum(cxxStorageClassToString(node.storageClass));
    }
    return modifiers;
}

function hasOverrideAttr(inner: CxxAstNode[] | undefined): boolean {
    if (!inner) {
        return false;
    }
    return inner.some(child => child.kind === AstKind.AttributeOverride);
}

function isPureVirtualMethod(node: CxxAstNode): boolean {
    if (node.inner?.some(child => child.kind === AstKind.CompoundStmt)) {
        return false;
    }
    return node.inner?.some(child =>
        child.kind === AstKind.IntegerLiteral && child.value === '0'
    ) ?? false;
}

function getMtdModifier(node: CxxAstNode, modifiers: number): number {
    if ((modifiers & ModifierType.VIRTUAL) !== 0) {
        if (isPureVirtualMethod(node)) {
            modifiers |= ModifierType.PURE_VIRTUAL;
        }
    }
    if (hasOverrideAttr(node.inner)) {
        modifiers |= ModifierType.OVERRIDE;
    }
    return modifiers;
}

export function buildModifiers(node: CxxAstNode): number {
    let modifiers = extractCommonModifiers(node);

    if (node.kind === AstKind.CXXMethodDecl) {
        modifiers = getMtdModifier(node, modifiers);
    }
    if (node.kind === AstKind.FriendDecl) {
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
        if (innerNode.kind === AstKind.TemplateTypeParmDecl) {
            let defaultType;
            if (innerNode.defaultArg) {
                defaultType = cxxNode2Type(innerNode, arkInstance);
            }
            let templateType = new GenericType(innerNode.name, defaultType);
            templateType.setIndex(++index);
            genericTypes.push(templateType);
        } else if (innerNode.kind === AstKind.NonTypeTemplateParmDecl) {
            let templateType;
            if (innerNode.type.qualType === 'auto') {
                templateType = new CxxNonType(innerNode.name, AutoType.getInstance());
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
        if (parameter.inner.length > 0 && parameter.inner[parameter.inner.length - 1].kind !== AstKind.TypeRef) {
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
): Type {
    // Handle function pointer type
    if (currNode && arkInstance instanceof ArkMethod && isCxxFunctionPointer(currNode.type.qualType)) {
        return buildFuncPtrType(currNode, arkInstance, sourceFile!);
    }
    // Default processing
    let typeString = getTrueTypeString(nodeQualType);
    if (typeString === '') {
        return UnknownType.getInstance();
    }
    if (nodeQualType.kind === AstKind.InitListExpr && typeString === 'void') {
        let multipleTypePara: Type[] = [];
        nodeQualType.inner.forEach((item: CxxAstNode) => {
            multipleTypePara.push(cxxNode2Type(item, arkInstance, sourceFile));
        });
        return new UnionType(multipleTypePara);
    }

    return buildTypeFromPreStr(typeString, nodeQualType, arkInstance);
}

function getTrueTypeString(nodeQualType: CxxAstNode): string {
    if (nodeQualType.kind === AstKind.CXXTypeidExpr && nodeQualType.typeArg) {
        return nodeQualType.typeArg.desugaredQualType ?? nodeQualType.typeArg.qualType;
    } else if ([AstKind.TemplateTypeParmDecl, AstKind.TemplateTypeParmVarDecl].includes(nodeQualType.kind) && nodeQualType.defaultArg) {
        return nodeQualType.defaultArg.desugaredQualType ?? nodeQualType.defaultArg.qualType;
    } else if (nodeQualType.type) {
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
    const stripped = CxxTypeStringCache.stripStorageModifiers(preStr);
    const { referenceCount, pointerLevel, baseStr, pointerBaseStr } = CxxTypeStringCache.parsePreStrShape(stripped);

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
        return buildPointerType(pointerBaseStr, pointerLevel, node, arkInstance);
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
            if (stripped === t.getName()) {
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
            // When a node is of reference type, the processing strategy is to parse the type as much as possible,
            // so it is not directly parsed according to Unclear Reference.
            // At this time, the type field cannot obtain array length information.
            logger.warn(node + 'this node case is unexpect');
            return TypeInference.buildTypeFromStr(qualType);
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
    if (callNode.kind !== AstKind.DeclRefExpr) {
        return false;
    }
    const qualifiedName = callNode.name ?? '';
    if (!qualifiedName.includes('::') || qualifiedName.startsWith(BuiltinCxx.CXXSTDREF)) {
        return false;
    }
    return callNode.inner.length === 0 ||
        callNode.inner.some(child =>
            (child.kind === AstKind.NamespaceRef || child.kind === AstKind.TypeRef) &&
            child.name !== BuiltinCxx.CXXSTD
        );
}

export function isCxxBasicString(qualType: string): boolean {
    return convertDataType(CxxTypeStringCache.stripStorageModifiers(qualType)) === 'string';
}

export function buildTypeFromDerivedType(preStr: string, node: CxxAstNode, arkInstance: ArkMethod | ArkClass | ArkField | undefined): Type {
    const { typeStr, innerPart } = CxxTypeStringCache.parseDerivedTypeParts(preStr);
    let innerType = innerPart === null ? [] : [buildTypeFromPreStr(innerPart, node, arkInstance)];
    if (arkInstance instanceof ArkMethod) {
        // Obtain the use of alias types
        let aliasType = arkInstance.getBody()?.getAliasTypeByName(typeStr);
        if (aliasType) {
            return aliasType;
        }
    }
    let arkClass: ArkClass | null = null;
    if (arkInstance instanceof ArkMethod || arkInstance instanceof ArkClass) {
        const file = arkInstance.getDeclaringArkFile?.();
        arkClass = file?.getClassWithName?.(typeStr) ??
            CxxModelUtils.getClassFromAnonymousNamespaceByName(typeStr, file);
        // Obtain the use of alias types
        let aliasType =
            file?.getDefaultClass().getDefaultArkMethod()?.getBody()?.getAliasTypeByName(typeStr);
        if (aliasType) {
            return aliasType;
        }
    }
    if (arkClass) {
        return new ClassType(arkClass.getSignature(), innerType);
    }
    return TypeInference.buildTypeFromStr(preStr);
}

export function convertDataType(typeName: string): string {
    return CxxTypeStringCache.convertDataType(typeName);
}
