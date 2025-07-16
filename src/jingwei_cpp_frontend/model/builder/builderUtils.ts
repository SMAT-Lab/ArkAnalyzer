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

import ts, { HeritageClause } from 'ohos-typescript';
import {
    AliasType,
    ArrayType,
    ClassType,
    FunctionType,
    GenericType,
    TupleType,
    Type,
    UnclearReferenceType,
    UnionType,
    UnknownType,
    PointerType,
    ReferenceType,
    ReferCategory
} from '../../../core/base/Type';
import { TypeInference } from '../../common/TypeInference';
import { ArkField } from '../../../core/model/ArkField';
import { ArkClass } from '../../../core/model/ArkClass';
import { ArkMethod } from '../../../core/model/ArkMethod';
import { Decorator } from '../../../core/base/Decorator';
import { MethodParameter } from '../../../core/model/builder/ArkMethodBuilder';
import { modifierKind2Enum, modifierKind2EnumCpp } from '../../../core/model/ArkBaseModel';


// const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'builderUtils');

export function handleQualifiedName(node: ts.QualifiedName): string {
    let right = (node.right as ts.Identifier).text;
    let left: string = '';
    if (node.left.kind === ts.SyntaxKind.Identifier) {
        left = (node.left as ts.Identifier).text;
    } else if (node.left.kind === ts.SyntaxKind.QualifiedName) {
        left = handleQualifiedName(node.left as ts.QualifiedName);
    }
    let qualifiedName = left + '.' + right;
    return qualifiedName;
}

export function handlePropertyAccessExpression(node: ts.PropertyAccessExpression): string {
    let right = (node.name as ts.Identifier).text;
    let left: string = '';
    if (ts.SyntaxKind[node.expression.kind] === 'Identifier') {
        left = (node.expression as ts.Identifier).text;
    } else if (ts.isStringLiteral(node.expression)) {
        left = node.expression.text;
    } else if (ts.isPropertyAccessExpression(node.expression)) {
        left = handlePropertyAccessExpression(node.expression as ts.PropertyAccessExpression);
    }
    let propertyAccessExpressionName = left + '.' + right;
    return propertyAccessExpressionName;
}

export function buildDecorators(node: ts.Node, sourceFile: ts.SourceFile): Set<Decorator> {
    let decorators: Set<Decorator> = new Set();
    ts.getAllDecorators(node).forEach(decoratorNode => {
        let decorator = parseDecorator(decoratorNode);
        if (decorator) {
            decorator.setContent(decoratorNode.expression.getText(sourceFile));
            decorators.add(decorator);
        }
    });
    return decorators;
}

function parseDecorator(node: ts.Decorator): Decorator | undefined {
    if (!node.expression) {
        return undefined;
    }

    let expression = node.expression;
    if (ts.isIdentifier(expression)) {
        return new Decorator(expression.text);
    }
    if (!ts.isCallExpression(expression) || !ts.isIdentifier(expression.expression)) {
        return undefined;
    }

    let decorator = new Decorator(expression.expression.text);

    if (expression.arguments.length > 0) {
        const arg = expression.arguments[0];
        if (ts.isArrowFunction(arg) && ts.isIdentifier(arg.body)) {
            decorator.setParam(arg.body.text);
        }
    }

    return decorator;
}

function extractCommonModifiers(node:any):number{
    let modifiers: number = 0;
    const nodeType: string = node?.type?.qualType ?? "";

    if (Object.prototype.hasOwnProperty.call(node, "access")){
        modifiers |= modifierKind2Enum(node.access);
    }
    if (Object.prototype.hasOwnProperty.call(node, "storageClass")){
        modifiers |= modifierKind2Enum(node.storageClass);
    }
    if (nodeType.includes("const")){
        modifiers |= modifierKind2EnumCpp("const");
    }
    return modifiers;
}

function hasOvverrideAttr(inner: any[] |undefined):boolean{
    if (!inner) return false;
    return inner.some(child => child.kind === "attribute(override)");
}

function getMtdModifier(node: any, modifiers: number) {
    if (node.code.startsWith('virtual ')) {
        modifiers |= modifierKind2EnumCpp('virtual');
        // 纯虚函数的定义：virtual func() = 0 / virtual func() =0
        if (node.code.endsWith('= 0') || node.code.endsWith('=0')) {
            modifiers |= modifierKind2EnumCpp('pure virtual');
        }
    }
    if (hasOvverrideAttr(node.inner)) {
        modifiers |= modifierKind2EnumCpp('override');
    }
    return modifiers;
}

export function buildModifiers(node: any): number {
    let modifiers = extractCommonModifiers(node);

    if (node.kind === 'CXXMethodDecl'){
        modifiers = getMtdModifier(node, modifiers);
    }
    if (node.kind === "FriendDecl"){
        modifiers |= modifierKind2EnumCpp("friend");
    }

    return modifiers;
}

export function buildModifiersForCxxCls(cls: ArkClass): number {
    const mtds = cls.getMethods();
    for (const mtd of mtds) {
        // 如果类内有纯虚的成员函数，则该类是抽象类
        if (mtd.isPureVirtual()) {
            return modifierKind2EnumCpp("abstract");
        }
    }
    return 0;
}

export function buildHeritageClauses(heritageClauses?: ts.NodeArray<HeritageClause>): Map<string, string> {
    let heritageClausesMap: Map<string, string> = new Map<string, string>();
    heritageClauses?.forEach(heritageClause => {
        heritageClause.types.forEach(type => {
            let heritageClauseName: string = '';
            if (type.typeArguments) {
                heritageClauseName = type.getText();
            } else if (ts.isIdentifier(type.expression)) {
                heritageClauseName = (type.expression as ts.Identifier).text;
            } else if (ts.isPropertyAccessExpression(type.expression)) {
                heritageClauseName = handlePropertyAccessExpression(type.expression);
            } else {
                heritageClauseName = type.getText();
            }
            heritageClausesMap.set(heritageClauseName, ts.SyntaxKind[heritageClause.token]);
        });
    });
    return heritageClausesMap;
}

export function buildTypeParameters(
    clsNode: any,
    sourceFile: ts.SourceFile,
    arkInstance: ArkMethod | ArkClass
): GenericType[] {
    const genericTypes: GenericType[] = [];
    let index = -1;
    for(const innerNode of clsNode.inner) {
        if(innerNode.kind !== 'TemplateTypeParameter'){
            continue;
        }
        let typename = innerNode.name;
        let defaultType;
        if(innerNode.inner && innerNode.inner.length > 0){
            innerNode.default = innerNode.inner[0].type.qualType;
        }
        if(innerNode.default){
            defaultType = cppNode2Type(innerNode.default,sourceFile,arkInstance);
        }
        let templateType = new GenericType(typename,defaultType);
        templateType.setIndex(++index);
        genericTypes.push(templateType);
    }
    return genericTypes;
}

export function buildParameters(params: any, arkInstance: ArkMethod | ArkField, sourceFile: any): MethodParameter[] {
    let parameters: MethodParameter[] = []
    if (!params || params.length === 0) {
        return [];
    }
    params.forEach((parameter:any) => {
        let methodParameter = new MethodParameter();

        // name
        if (parameter.name) {
            methodParameter.setName(parameter.name.toString());
        } else {
            methodParameter.setName("")
        }
        // type
        if (parameter.type) {
            methodParameter.setType(buildGenericType(cppNode2Type(parameter.type.qualType, sourceFile, arkInstance), arkInstance));
        } else {
            methodParameter.setType(UnknownType.getInstance());
        }

        parameters.push(methodParameter);
    });
    return parameters;
}

export function buildGenericType(type: Type, arkInstance: ArkMethod | ArkField | AliasType): Type {
    function replace(urType: UnclearReferenceType): Type {
        const typeName = urType.getName();
        let gType;
        if (arkInstance instanceof AliasType) {
            gType = arkInstance.getGenericTypes()?.find(f => f.getName() === typeName);
        } else {
            if (arkInstance instanceof ArkMethod) {
                gType = arkInstance.getGenericTypes()?.find(f => f.getName() === typeName);
            }
            if (!gType) {
                gType = arkInstance
                    .getDeclaringArkClass()
                    .getGenericsTypes()
                    ?.find(f => f.getName() === typeName);
            }
        }
        if (gType) {
            return gType;
        }
        const types = urType.getGenericTypes();
        for (let i = 0; i < types.length; i++) {
            const mayType = types[i];
            if (mayType instanceof UnclearReferenceType) {
                types[i] = replace(mayType);
            }
        }
        return urType;
    }

    if (type instanceof UnclearReferenceType) {
        return replace(type);
    } else if (type instanceof ClassType && arkInstance instanceof AliasType) {
        type.setRealGenericTypes(arkInstance.getGenericTypes());
    } else if (type instanceof UnionType || type instanceof TupleType) {
        const types = type.getTypes();
        for (let i = 0; i < types.length; i++) {
            const mayType = types[i];
            if (mayType instanceof UnclearReferenceType) {
                types[i] = replace(mayType);
            }
        }
    } else if (type instanceof ArrayType) {
        const baseType = type.getBaseType();
        if (baseType instanceof UnclearReferenceType) {
            type.setBaseType(replace(baseType));
        }
    } else if (type instanceof FunctionType) {
        const returnType = type.getMethodSignature().getType();
        if (returnType instanceof UnclearReferenceType) {
            type.getMethodSignature().getMethodSubSignature().setReturnType(replace(returnType));
        }
    }
    return type;
}

export function buildReturnType(mtdNode: any, sourceFile: any, method: ArkMethod): Type {
    let nodeType = mtdNode.type;
    if (nodeType){
        let funcRetType;
        let isLambdaFunc = nodeType.qualType.startsWith('(lambda at');
        if (!isLambdaFunc){ //普通函数
            funcRetType = nodeType.qualType.split('(')[0].trim();
        } else if (mtdNode.inner[0]?.inner[0]?.type.qualType.includes(' -> ')){ //处理带返回值的lambda函数
            funcRetType = mtdNode.inner[0].inner[0].type.qualType.split(' -> ')[1];
        } else { // 不带返回值的lambda函数
            return UnknownType.getInstance();
        }
        return cppNode2Type(funcRetType, sourceFile, method);
    } else {
        return UnknownType.getInstance();
    }
}

export function cppNode2Type(
    nodeQualType: any,
    sourceFile: any,
    arkInstance: ArkMethod | ArkClass | ArkField,
): Type {
    // 处理特殊类型
    if (nodeQualType === 'void () const') {
        return buildTypeFromPreStr('VoidKeyword');
    }
    // 处理泛型类型
    let templateTypes: GenericType[] | undefined;
    if (arkInstance instanceof ArkMethod) {
        templateTypes = arkInstance.getGenericTypes() ?? arkInstance.getDeclaringArkClass()?.getGenericsTypes();
    } else if (arkInstance instanceof ArkClass) {
        templateTypes = arkInstance.getGenericsTypes();
    }
    if (templateTypes) {
        for (const t of templateTypes) {
            if (nodeQualType === t.getName()) return t;
        }
    }
    // 默认处理
    return buildTypeFromPreStr(nodeQualType, arkInstance);
}

export function buildTypeFromPreStr(preStr: string, arkInstance: any = null): Type {
    // 1. 去除const/static/mutable 等修饰符
    preStr = preStr.replace(/\b(const|static|mutable)\s*\b/g, '');
    let pointerLevel = 0, referenceCount = 0;
    // 2. 处理指针和引用，仅非STL容器处理
    if (!isCXXSTLContainer(preStr)){
        referenceCount = (preStr.match(/&/g) || []).length;
        preStr = preStr.replace(/&/g, '').trim();
        pointerLevel = (preStr.match(/\*/g) || []).length;
        preStr = preStr.replace(/\*/g, '').trim();
    }

    // 3. 推断类型
    const postStr = convertDataType(preStr);
    const baseType = (postStr === 'unsupported')
        ? buildTypeFromDerivedType(preStr, arkInstance)
        : TypeInference.buildTypeFromStr(postStr, preStr);
    // 4. 包装指针和引用
    if (referenceCount > 0){
        const referCategory = (referenceCount % 2 === 1)
            ? ReferCategory.LVALUE_REF
            : ReferCategory.RVALUE_REF;
        return new ReferenceType(
            pointerLevel > 0 ? new PointerType(baseType, pointerLevel): baseType,
            referCategory
        );
    }
    // 待处理: 指针与其他类型/修饰符的优先级
    if (pointerLevel > 0){
        return new PointerType(baseType, pointerLevel);
    }
    return baseType;
}

export function isCXXSTLContainer(qualType: string){
    let STLContainerPtn = /(set|map|vector|queue|deque|stack|list|pair)<[^>]*>/g;
    return STLContainerPtn.test(qualType);
}

export function buildTypeFromDerivedType(
    preStr: string,
    arkInstance: ArkMethod | ArkClass | ArkField,
): Type {
    const outerPartMatch = preStr.match(/^([^<]+)/);
    const outerPart = outerPartMatch ? outerPartMatch[1] : null;
    let typeStr: string, isPtr: boolean, isRef: boolean;
    if (outerPart === null) {
        typeStr = preStr.trim().split(' ')[0];
        isPtr = preStr.includes(' *');
        isRef = preStr.includes(' &');
    } else {
        typeStr = outerPart.trim().split(' ')[0];
        isPtr = outerPart.includes(' *');
        isRef = outerPart.includes(' &');
    }
    const innerPartMatch = preStr.match(/<([^>]+)>/);
    const innerPart = innerPartMatch ? innerPartMatch[1] : null;
    let innerType = innerPart === null ? [] : [buildTypeFromPreStr(innerPart, null)];

    let arkClass: ArkClass | null = null;
    if (arkInstance instanceof ArkMethod || arkInstance instanceof ArkClass) {
        const file = arkInstance.getDeclaringArkFile?.();
        arkClass = file?.getClassWithName?.(typeStr) ?? null;
    }
    if (arkClass) {
        const suffix = isPtr ? '*' : isRef ? '&' : undefined;
        return new ClassType(arkClass.getSignature(), innerType, suffix);
    }
    return TypeInference.buildTypeFromStr('unsupported');
}

const typeMap: Record<string, string> = {
    'bool': 'boolean',
    //字符串相关
    'string': 'string',
    'std::string': 'string',
    'char': 'string',
    'signed char': 'string',
    'wchar_t': 'string',
    'char16_t': 'string',
    'char32_t': 'string',
    'std::basic_string<char>': 'string',
    // 数字相关
    'short': 'number',
    'unsigned short': 'number',
    'unsigned int': 'number',
    'int': 'number',
    'long': 'number',
    'unsigned long': 'number',
    'long long': 'number',
    'unsigned long long': 'number',
    'float': 'number',
    'double': 'number',
    'long double': 'number',
    'uint8_t': 'number',
    'uint16_t': 'number',
    'uint32_t': 'number',
    'uint64_t': 'number',
    'int8_t': 'number',
    'int16_t': 'number',
    'int32_t': 'number',
    'int64_t': 'number',
    // void
    'void': 'void',
};

export function convertDataType(typeName: string): string{
    return typeMap[typeName] ?? 'unsupported';
}