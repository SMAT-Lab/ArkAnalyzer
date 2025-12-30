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

import ts, { HeritageClause, ParameterDeclaration, TypeNode, TypeParameterDeclaration } from 'ohos-typescript';
import {
    AliasType,
    ArrayType,
    ClassType,
    FunctionType,
    GenericType,
    IntersectionType,
    TupleType,
    Type,
    UnclearReferenceType,
    UnionType,
    UnknownType,
} from '../../base/Type';
import { TypeInference } from '../../common/TypeInference';
import { ArkField } from '../ArkField';
import Logger, { LOG_MODULE_TYPE } from '../../../utils/logger';
import { ArkClass } from '../ArkClass';
import { ArkMethod } from '../ArkMethod';
import { Decorator } from '../../base/Decorator';
import {
    ArrayBindingPatternParameter,
    buildArkMethodFromArkClass,
    MethodParameter,
    ObjectBindingPatternParameter,
} from './ArkMethodBuilder';
import { buildNormalArkClassFromArkMethod } from './ArkClassBuilder';
import { Builtin } from '../../common/Builtin';
import { modifierKind2Enum } from '../ArkBaseModel';
import { ArkValueTransformer } from '../../common/ArkValueTransformer';
import { KeyofTypeExpr, TypeQueryExpr } from '../../base/TypeExpr';
import {
    ANY_KEYWORD,
    BIGINT_KEYWORD,
    BOOLEAN_KEYWORD,
    NEVER_KEYWORD,
    NULL_KEYWORD,
    NUMBER_KEYWORD,
    STRING_KEYWORD,
    THIS_NAME,
    UNDEFINED_KEYWORD,
    VOID_KEYWORD,
} from '../../common/TSConst';
import { ArkSignatureBuilder } from './ArkSignatureBuilder';
import { ArkInstanceFieldRef } from '../../base/Ref';
import { Local } from '../../base/Local';
import { Value } from '../../base/Value';
import { FullPosition } from '../../base/Position';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'builderUtils');

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

export function buildModifiers(node: ts.Node): number {
    let modifiers: number = 0;

    if (ts.canHaveModifiers(node)) {
        ts.getModifiers(node)?.forEach(modifier => {
            modifiers |= modifierKind2Enum(modifier.kind);
        });
    }

    return modifiers;
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
    typeParameters: ts.NodeArray<TypeParameterDeclaration>,
    sourceFile: ts.SourceFile,
    arkInstance: ArkMethod | ArkClass
): GenericType[] {
    const genericTypes: GenericType[] = [];
    let index = 0;
    if (arkInstance instanceof ArkMethod) {
        const len = arkInstance.getDeclaringArkClass().getGenericsTypes()?.length;
        if (len) {
            index = len;
        }
    }
    typeParameters.forEach(typeParameter => {
        const genericType = tsNode2Type(typeParameter, sourceFile, arkInstance);
        if (genericType instanceof GenericType) {
            genericType.setIndex(index++);
            genericTypes.push(genericType);
        }

        if (typeParameter.modifiers) {
            logger.warn('This typeparameter has modifiers.');
        }

        if (typeParameter.expression) {
            logger.warn('This typeparameter has expression.');
        }
    });
    return genericTypes;
}

function buildObjectBindingPatternParam(methodParameter: MethodParameter, paramNameNode: ts.ObjectBindingPattern): void {
    methodParameter.setName('ObjectBindingPattern');
    let elements: ObjectBindingPatternParameter[] = [];
    paramNameNode.elements.forEach(element => {
        let paraElement = new ObjectBindingPatternParameter();
        if (element.propertyName) {
            if (ts.isIdentifier(element.propertyName)) {
                paraElement.setPropertyName(element.propertyName.text);
            } else {
                logger.warn('New propertyName of ObjectBindingPattern found, please contact developers to support this!');
            }
        }

        if (element.name) {
            if (ts.isIdentifier(element.name)) {
                paraElement.setName(element.name.text);
            } else {
                logger.warn('New name of ObjectBindingPattern found, please contact developers to support this!');
            }
        }

        if (element.initializer) {
            logger.warn('TODO: support ObjectBindingPattern initializer.');
        }

        if (element.dotDotDotToken) {
            paraElement.setOptional(true);
        }
        elements.push(paraElement);
    });
    methodParameter.setObjElements(elements);
}

function buildBindingElementOfBindingPatternParam(element: ts.BindingElement, paraElement: ArrayBindingPatternParameter): void {
    if (element.propertyName) {
        if (ts.isIdentifier(element.propertyName)) {
            paraElement.setPropertyName(element.propertyName.text);
        } else {
            logger.warn('New propertyName of ArrayBindingPattern found, please contact developers to support this!');
        }
    }

    if (element.name) {
        if (ts.isIdentifier(element.name)) {
            paraElement.setName(element.name.text);
        } else {
            logger.warn('New name of ArrayBindingPattern found, please contact developers to support this!');
        }
    }

    if (element.initializer) {
        logger.warn('TODO: support ArrayBindingPattern initializer.');
    }

    if (element.dotDotDotToken) {
        paraElement.setOptional(true);
    }
}

function buildArrayBindingPatternParam(methodParameter: MethodParameter, paramNameNode: ts.ArrayBindingPattern): void {
    methodParameter.setName('ArrayBindingPattern');
    let elements: ArrayBindingPatternParameter[] = [];
    paramNameNode.elements.forEach(element => {
        let paraElement = new ArrayBindingPatternParameter();
        if (ts.isBindingElement(element)) {
            buildBindingElementOfBindingPatternParam(element, paraElement);
        } else if (ts.isOmittedExpression(element)) {
            logger.warn('TODO: support OmittedExpression for ArrayBindingPattern parameter name.');
        }
        elements.push(paraElement);
    });
    methodParameter.setArrayElements(elements);
}

export function buildParameters(params: ts.NodeArray<ParameterDeclaration>, arkInstance: ArkMethod | ArkField, sourceFile: ts.SourceFile,
                                paramsPosition: Map<string, FullPosition>): MethodParameter[] {
    let parameters: MethodParameter[] = [];
    params.forEach(parameter => {
        let methodParameter = new MethodParameter();

        // name
        if (ts.isIdentifier(parameter.name)) {
            methodParameter.setName(parameter.name.text);
            paramsPosition.set(parameter.name.text, FullPosition.buildFromNode(parameter.name, sourceFile));
        } else if (ts.isObjectBindingPattern(parameter.name)) {
            buildObjectBindingPatternParam(methodParameter, parameter.name);
            paramsPosition.set('ObjectBindingPattern', FullPosition.buildFromNode(parameter.name, sourceFile));
        } else if (ts.isArrayBindingPattern(parameter.name)) {
            buildArrayBindingPatternParam(methodParameter, parameter.name);
            paramsPosition.set('ArrayBindingPattern', FullPosition.buildFromNode(parameter.name, sourceFile));
        } else {
            logger.warn('Parameter name is not identifier, ObjectBindingPattern nor ArrayBindingPattern, please contact developers to support this!');
        }

        // questionToken
        if (parameter.questionToken) {
            methodParameter.setOptional(true);
        }

        // type
        if (parameter.type) {
            methodParameter.setType(buildGenericType(tsNode2Type(parameter.type, sourceFile, arkInstance), arkInstance));
        } else {
            methodParameter.setType(UnknownType.getInstance());
        }

        // initializer
        if (parameter.initializer) {
            // For param with initializer, it is actually optional param. The cfgBuilder will do the last initializer things.
            methodParameter.setOptional(true);
        }

        // dotDotDotToken
        if (parameter.dotDotDotToken) {
            methodParameter.setRestFlag(true);
        }

        // modifiers
        if (parameter.modifiers) {
            //
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

export function buildReturnType(node: TypeNode, sourceFile: ts.SourceFile, method: ArkMethod): Type {
    if (node) {
        return tsNode2Type(node, sourceFile, method);
    } else {
        return UnknownType.getInstance();
    }
}

export function tsNode2Type(
    typeNode: ts.TypeNode | ts.TypeParameterDeclaration,
    sourceFile: ts.SourceFile,
    arkInstance: ArkMethod | ArkClass | ArkField
): Type {
    if (ts.isTypeReferenceNode(typeNode)) {
        const genericTypes: Type[] = [];
        if (typeNode.typeArguments) {
            for (const typeArgument of typeNode.typeArguments) {
                genericTypes.push(tsNode2Type(typeArgument, sourceFile, arkInstance));
            }
        }
        let referenceNodeName = typeNode.typeName;
        if (ts.isQualifiedName(referenceNodeName)) {
            let parameterTypeStr = handleQualifiedName(referenceNodeName as ts.QualifiedName);
            return new UnclearReferenceType(parameterTypeStr, genericTypes);
        } else {
            let parameterTypeStr = referenceNodeName.text;
            if (parameterTypeStr === Builtin.OBJECT) {
                return Builtin.OBJECT_CLASS_TYPE;
            }
            return new UnclearReferenceType(parameterTypeStr, genericTypes);
        }
    } else if (ts.isUnionTypeNode(typeNode) || ts.isIntersectionTypeNode(typeNode)) {
        let multipleTypePara: Type[] = [];
        typeNode.types.forEach(tmpType => {
            multipleTypePara.push(tsNode2Type(tmpType, sourceFile, arkInstance));
        });
        if (ts.isUnionTypeNode(typeNode)) {
            return new UnionType(multipleTypePara);
        } else {
            return new IntersectionType(multipleTypePara);
        }
    } else if (ts.isLiteralTypeNode(typeNode)) {
        return ArkValueTransformer.resolveLiteralTypeNode(typeNode, sourceFile);
    } else if (ts.isTypeLiteralNode(typeNode)) {
        let cls: ArkClass = new ArkClass();
        let declaringClass: ArkClass;

        if (arkInstance instanceof ArkMethod) {
            declaringClass = arkInstance.getDeclaringArkClass();
        } else if (arkInstance instanceof ArkField) {
            declaringClass = arkInstance.getDeclaringArkClass();
        } else {
            declaringClass = arkInstance;
        }
        if (declaringClass.getDeclaringArkNamespace()) {
            cls.setDeclaringArkNamespace(declaringClass.getDeclaringArkNamespace());
            cls.setDeclaringArkFile(declaringClass.getDeclaringArkFile());
        } else {
            cls.setDeclaringArkFile(declaringClass.getDeclaringArkFile());
        }
        buildNormalArkClassFromArkMethod(typeNode, cls, sourceFile);

        return new ClassType(cls.getSignature());
    } else if (ts.isFunctionTypeNode(typeNode)) {
        let mtd: ArkMethod = new ArkMethod();
        let cls: ArkClass;
        if (arkInstance instanceof ArkMethod) {
            cls = arkInstance.getDeclaringArkClass();
        } else if (arkInstance instanceof ArkClass) {
            cls = arkInstance;
        } else {
            cls = arkInstance.getDeclaringArkClass();
        }
        buildArkMethodFromArkClass(typeNode, cls, mtd, sourceFile);
        return new FunctionType(mtd.getSignature());
    } else if (ts.isTypeParameterDeclaration(typeNode)) {
        const name = typeNode.name.text;
        let defaultType;
        if (typeNode.default) {
            defaultType = tsNode2Type(typeNode.default, sourceFile, arkInstance);
        }
        let constraint;
        if (typeNode.constraint) {
            constraint = tsNode2Type(typeNode.constraint, sourceFile, arkInstance);
        }
        return new GenericType(name, defaultType, constraint);
    } else if (ts.isTupleTypeNode(typeNode)) {
        const types: Type[] = [];
        typeNode.elements.forEach(element => {
            types.push(tsNode2Type(element, sourceFile, arkInstance));
        });
        return new TupleType(types);
    } else if (ts.isArrayTypeNode(typeNode)) {
        return new ArrayType(tsNode2Type((typeNode as ts.ArrayTypeNode).elementType, sourceFile, arkInstance), 1);
    } else if (ts.isParenthesizedTypeNode(typeNode)) {
        return tsNode2Type(typeNode.type, sourceFile, arkInstance);
    } else if (ts.isTypeOperatorNode(typeNode)) {
        return buildTypeFromTypeOperator(typeNode as ts.TypeOperatorNode, sourceFile, arkInstance);
    } else if (ts.isTypeQueryNode(typeNode)) {
        return buildTypeFromTypeQuery(typeNode as ts.TypeQueryNode, sourceFile, arkInstance);
    } else if (typeNode.kind === ts.SyntaxKind.ObjectKeyword) {
        // TODO: type object which is different from Object is needed to support, such as let a: object = {}
        return new UnclearReferenceType('object');
    } else {
        return buildTypeFromPreStr(ts.SyntaxKind[typeNode.kind]);
    }
}

export function buildTypeFromPreStr(preStr: string): Type {
    let postStr = '';
    switch (preStr) {
        case 'BooleanKeyword':
            postStr = BOOLEAN_KEYWORD;
            break;
        case 'FalseKeyword':
            postStr = BOOLEAN_KEYWORD;
            break;
        case 'TrueKeyword':
            postStr = BOOLEAN_KEYWORD;
            break;
        case 'NumberKeyword':
            postStr = NUMBER_KEYWORD;
            break;
        case 'NumericLiteral':
            postStr = NUMBER_KEYWORD;
            break;
        case 'FirstLiteralToken':
            postStr = NUMBER_KEYWORD;
            break;
        case 'StringKeyword':
            postStr = STRING_KEYWORD;
            break;
        case 'StringLiteral':
            postStr = STRING_KEYWORD;
            break;
        case 'UndefinedKeyword':
            postStr = UNDEFINED_KEYWORD;
            break;
        case 'NullKeyword':
            postStr = NULL_KEYWORD;
            break;
        case 'AnyKeyword':
            postStr = ANY_KEYWORD;
            break;
        case 'VoidKeyword':
            postStr = VOID_KEYWORD;
            break;
        case 'NeverKeyword':
            postStr = NEVER_KEYWORD;
            break;
        case 'BigIntKeyword':
            postStr = BIGINT_KEYWORD;
            break;
        default:
            postStr = preStr;
    }
    return TypeInference.buildTypeFromStr(postStr);
}

function buildTypeFromTypeOperator(typeOperatorNode: ts.TypeOperatorNode, sourceFile: ts.SourceFile, arkInstance: ArkMethod | ArkClass | ArkField): Type {
    const typeNode = typeOperatorNode.type;
    let type = tsNode2Type(typeNode, sourceFile, arkInstance);

    switch (typeOperatorNode.operator) {
        case ts.SyntaxKind.ReadonlyKeyword: {
            if (type instanceof ArrayType || type instanceof TupleType) {
                type.setReadonlyFlag(true);
            }
            return type;
        }
        case ts.SyntaxKind.KeyOfKeyword:
            return new KeyofTypeExpr(type);
        case ts.SyntaxKind.UniqueKeyword:
            return UnknownType.getInstance();
        default:
            return UnknownType.getInstance();
    }
}

function buildTypeFromTypeQuery(typeQueryNode: ts.TypeQueryNode, sourceFile: ts.SourceFile, arkInstance: ArkMethod | ArkClass | ArkField): Type {
    const exprNameNode = typeQueryNode.exprName;
    let opValue: Value;
    if (ts.isQualifiedName(exprNameNode)) {
        if (exprNameNode.left.getText(sourceFile) === THIS_NAME) {
            const fieldName = exprNameNode.right.getText(sourceFile);
            if (arkInstance instanceof ArkMethod) {
                const fieldSignature =
                    arkInstance.getDeclaringArkClass().getFieldWithName(fieldName)?.getSignature() ??
                    ArkSignatureBuilder.buildFieldSignatureFromFieldName(fieldName);
                const baseLocal =
                    arkInstance.getBody()?.getLocals().get(THIS_NAME) ??
                    new Local(
                        THIS_NAME,
                        new ClassType(arkInstance.getDeclaringArkClass().getSignature(), arkInstance.getDeclaringArkClass().getGenericsTypes())
                    );
                opValue = new ArkInstanceFieldRef(baseLocal, fieldSignature);
            } else if (arkInstance instanceof ArkClass) {
                const fieldSignature =
                    arkInstance.getFieldWithName(fieldName)?.getSignature() ?? ArkSignatureBuilder.buildFieldSignatureFromFieldName(fieldName);
                const baseLocal = new Local(THIS_NAME, new ClassType(arkInstance.getSignature(), arkInstance.getGenericsTypes()));
                opValue = new ArkInstanceFieldRef(baseLocal, fieldSignature);
            } else {
                const fieldSignature = arkInstance.getSignature();
                const baseLocal = new Local(
                    THIS_NAME,
                    new ClassType(arkInstance.getDeclaringArkClass().getSignature(), arkInstance.getDeclaringArkClass().getGenericsTypes())
                );
                opValue = new ArkInstanceFieldRef(baseLocal, fieldSignature);
            }
        } else {
            const exprName = exprNameNode.getText(sourceFile);
            opValue = new Local(exprName, UnknownType.getInstance());
        }
    } else {
        const exprName = exprNameNode.escapedText.toString();
        opValue = new Local(exprName, UnknownType.getInstance());
    }

    let expr = new TypeQueryExpr(opValue);
    if (typeQueryNode.typeArguments) {
        for (const typeArgument of typeQueryNode.typeArguments) {
            expr.addGenericType(tsNode2Type(typeArgument, sourceFile, arkInstance));
        }
    }
    return expr;
}
