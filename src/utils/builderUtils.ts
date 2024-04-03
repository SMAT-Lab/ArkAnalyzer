import ts from "typescript";
import { LiteralType, Type, TypeLiteralType, UnclearReferenceType, UnionType, UnknownType } from "../core/base/Type";
import { ArrayBindingPatternParameter, MethodParameter, ObjectBindingPatternParameter } from "../core/common/MethodInfoBuilder";
import { TypeInference } from "../core/common/TypeInference";
import { ArkField } from "../core/model/ArkField";
import Logger from "./logger";
import { LineColPosition } from "../core/base/Position";

const logger = Logger.getLogger();

export function handleQualifiedName(node: ts.QualifiedName): string {
    let right = (node.right as ts.Identifier).text;
    let left: string = '';
    if (ts.SyntaxKind[node.left.kind] == 'Identifier') {
        left = (node.left as ts.Identifier).text;
    }
    else if (ts.SyntaxKind[node.left.kind] == 'QualifiedName') {
        left = handleQualifiedName(node.left as ts.QualifiedName);
    }
    let qualifiedName = left + '.' + right;
    return qualifiedName;
}

export function handlePropertyAccessExpression(node: ts.PropertyAccessExpression): string {
    let right = (node.name as ts.Identifier).text;
    let left: string = '';
    if (ts.SyntaxKind[node.expression.kind] == 'Identifier') {
        left = (node.expression as ts.Identifier).text;
    }
    else if (ts.isStringLiteral(node.expression)) {
        left = node.expression.text;
    }
    else if (ts.isPropertyAccessExpression(node.expression)) {
        left = handlePropertyAccessExpression(node.expression as ts.PropertyAccessExpression);
    }
    let propertyAccessExpressionName = left + '.' + right;
    return propertyAccessExpressionName;
}

export function buildModifiers(modifierArray: ts.NodeArray<ts.ModifierLike>): Set<string> {
    let modifiers: Set<string> = new Set<string>();
    modifierArray.forEach((modifier) => {
        //TODO: find reason!!
        if (ts.SyntaxKind[modifier.kind] == 'FirstContextualKeyword') {
            modifiers.add('AbstractKeyword');
        }
        else if (ts.isDecorator(modifier)) {
            if (modifier.expression) {
                if (ts.isIdentifier(modifier.expression)) {
                    modifiers.add(modifier.expression.text);
                }
                else if (ts.isCallExpression(modifier.expression)) {
                    if (ts.isIdentifier(modifier.expression.expression)) {
                        modifiers.add(modifier.expression.expression.text);
                    }
                }
            }
        }
        else {
            modifiers.add(ts.SyntaxKind[modifier.kind]);
        }
    });
    return modifiers;
}

export function buildHeritageClauses(node: ts.ClassDeclaration | ts.ClassExpression | ts.InterfaceDeclaration): Map<string, string> {
    let heritageClausesMap: Map<string, string> = new Map<string, string>();
    node.heritageClauses?.forEach((heritageClause) => {
        heritageClause.types.forEach((type) => {
            let heritageClauseName: string = '';
            if (ts.isIdentifier(type.expression)) {
                heritageClauseName = (type.expression as ts.Identifier).text;
            }
            else if (ts.isPropertyAccessExpression(type.expression)) {
                heritageClauseName = handlePropertyAccessExpression(type.expression);
            }
            else {
                logger.warn("Other type expression found!!!");
            }
            heritageClausesMap.set(heritageClauseName, ts.SyntaxKind[heritageClause.token]);
        });
    });
    return heritageClausesMap;
}

export function buildTypeParameters(node: ts.ClassDeclaration | ts.ClassExpression |
    ts.InterfaceDeclaration | ts.FunctionDeclaration | ts.MethodDeclaration |
    ts.ConstructorDeclaration | ts.ArrowFunction | ts.AccessorDeclaration |
    ts.FunctionExpression | ts.MethodSignature | ts.ConstructSignatureDeclaration |
    ts.CallSignatureDeclaration): Type[] {
    let typeParameters: Type[] = [];
    node.typeParameters?.forEach((typeParameter) => {
        if (ts.isIdentifier(typeParameter.name)) {
            let parametersTypeStr = typeParameter.name.text;
            typeParameters.push(buildTypeFromPreStr(parametersTypeStr));
        }
        else {
            logger.warn("Other typeparameter found!!!");
        }
    });
    return typeParameters;
}

export function buildParameters(node: ts.FunctionDeclaration | ts.MethodDeclaration
    | ts.ConstructorDeclaration | ts.ArrowFunction | ts.AccessorDeclaration |
    ts.FunctionExpression | ts.CallSignatureDeclaration | ts.MethodSignature |
    ts.ConstructSignatureDeclaration | ts.IndexSignatureDeclaration, sourceFile: ts.SourceFile) {
    let parameters: MethodParameter[] = [];
    node.parameters.forEach((parameter) => {
        let methodParameter = new MethodParameter();
        if (ts.isIdentifier(parameter.name)) {
            methodParameter.setName(parameter.name.text);
        }
        else if (ts.isObjectBindingPattern(parameter.name)) {
            methodParameter.setName("ObjectBindingPattern");
            let elements: ObjectBindingPatternParameter[] = [];
            parameter.name.elements.forEach((element) => {
                let paraElement = new ObjectBindingPatternParameter();
                if (element.propertyName) {
                    if (ts.isIdentifier(element.propertyName)) {
                        paraElement.setPropertyName(element.propertyName.text);
                    }
                    else {
                        logger.warn("New propertyName of ObjectBindingPattern found, please contact developers to support this!");
                    }
                }

                if (element.name) {
                    if (ts.isIdentifier(element.name)) {
                        paraElement.setName(element.name.text);
                    }
                    else {
                        logger.warn("New name of ObjectBindingPattern found, please contact developers to support this!");
                    }
                }

                if (element.initializer) {
                    logger.warn("TODO: support ObjectBindingPattern initializer.");
                }

                if (element.dotDotDotToken) {
                    paraElement.setOptional(true);
                }
                elements.push(paraElement);
            });
            methodParameter.setObjElements(elements);
        }
        else if (ts.isArrayBindingPattern(parameter.name)) {
            methodParameter.setName("ArrayBindingPattern");
            let elements: ArrayBindingPatternParameter[] = [];
            parameter.name.elements.forEach((element) => {
                let paraElement = new ArrayBindingPatternParameter();
                if (ts.isBindingElement(element)) {
                    if (element.propertyName) {
                        if (ts.isIdentifier(element.propertyName)) {
                            paraElement.setPropertyName(element.propertyName.text);
                        }
                        else {
                            logger.warn("New propertyName of ArrayBindingPattern found, please contact developers to support this!");
                        }
                    }

                    if (element.name) {
                        if (ts.isIdentifier(element.name)) {
                            paraElement.setName(element.name.text);
                        }
                        else {
                            logger.warn("New name of ArrayBindingPattern found, please contact developers to support this!");
                        }
                    }

                    if (element.initializer) {
                        logger.warn("TODO: support ArrayBindingPattern initializer.");
                    }

                    if (element.dotDotDotToken) {
                        paraElement.setOptional(true);
                    }
                }
                else if (ts.isOmittedExpression(element)) {
                    logger.warn("TODO: support OmittedExpression for ArrayBindingPattern parameter name.");
                }
                elements.push(paraElement);
            });
            methodParameter.setArrayElements(elements);
        }
        else {
            logger.warn("Parameter name is not identifier, please contact developers to support this!");
        }
        if (parameter.questionToken) {
            methodParameter.setOptional(true);
        }
        if (parameter.type) {
            if (ts.isTypeReferenceNode(parameter.type)) {
                let referenceNodeName = parameter.type.typeName;
                if (ts.isQualifiedName(referenceNodeName)) {
                    let parameterTypeStr = handleQualifiedName(referenceNodeName as ts.QualifiedName);
                    let parameterType = new UnclearReferenceType(parameterTypeStr);
                    methodParameter.setType(parameterType);
                }
                else if (ts.isIdentifier(referenceNodeName)) {
                    let parameterTypeStr = (referenceNodeName as ts.Identifier).text;
                    let parameterType = new UnclearReferenceType(parameterTypeStr);
                    methodParameter.setType(parameterType);
                }
            }
            else if (ts.isUnionTypeNode(parameter.type)) {
                let unionTypePara: Type[] = [];
                parameter.type.types.forEach((tmpType) => {
                    if (ts.isTypeReferenceNode(tmpType)) {
                        let parameterType = "";
                        if (ts.isQualifiedName(tmpType.typeName)) {
                            parameterType = handleQualifiedName(tmpType.typeName);
                        }
                        else if (ts.isIdentifier(tmpType.typeName)) {
                            parameterType = tmpType.typeName.text;
                        }
                        unionTypePara.push(new UnclearReferenceType(parameterType));
                    }
                    else if (ts.isLiteralTypeNode(tmpType)) {
                        unionTypePara.push(buildTypeFromPreStr(ts.SyntaxKind[tmpType.literal.kind]));
                    }
                    else {
                        unionTypePara.push(buildTypeFromPreStr(ts.SyntaxKind[tmpType.kind]));
                    }
                });
                methodParameter.setType(new UnionType(unionTypePara));
            }
            else if (ts.isLiteralTypeNode(parameter.type)) {
                methodParameter.setType(buildTypeFromPreStr(ts.SyntaxKind[parameter.type.literal.kind]));
            }
            else if (ts.isTypeLiteralNode(parameter.type)) {
                let members: ArkField[] = [];
                parameter.type.members.forEach((member) => {
                    if (ts.isPropertySignature(member)) {
                        members.push(buildProperty2ArkField(member, sourceFile));
                    }
                    else if (ts.isIndexSignatureDeclaration(member)) {
                        members.push(buildIndexSignature2ArkField(member, sourceFile));
                    }
                    else if (ts.isConstructSignatureDeclaration(member)) {
                        //Bug, To be fixed
                        //members.push(buildMethodInfo4MethodNode(member));
                    }
                    else if (ts.isCallSignatureDeclaration(member)) {
                        //Bug, To be fixed
                        //members.push(buildMethodInfo4MethodNode(member));
                    }
                    else {
                        logger.warn("Please contact developers to support new TypeLiteral member!");
                    }
                });
                let type = new TypeLiteralType();
                type.setMembers(members);
                methodParameter.setType(type);
            }
            else {
                methodParameter.setType(buildTypeFromPreStr(ts.SyntaxKind[parameter.type.kind]));
            }
        }
        else {
            methodParameter.setType(UnknownType.getInstance());
        }

        parameters.push(methodParameter);
    });
    return parameters;
}

export function buildReturnType4Method(node: ts.FunctionDeclaration | ts.MethodDeclaration |
    ts.ConstructorDeclaration | ts.ArrowFunction | ts.AccessorDeclaration |
    ts.FunctionExpression | ts.MethodSignature | ts.ConstructSignatureDeclaration |
    ts.CallSignatureDeclaration | ts.IndexSignatureDeclaration, sourceFile: ts.SourceFile) {
    if (node.type) {
        if (ts.isTypeLiteralNode(node.type)) {
            let members: ArkField[] = [];
            node.type.members.forEach((member) => {
                if (ts.isPropertySignature(member)) {
                    members.push(buildProperty2ArkField(member, sourceFile));
                }
                else if (ts.isIndexSignatureDeclaration(member)) {
                    members.push(buildIndexSignature2ArkField(member, sourceFile));
                }
                else {
                    logger.warn("Please contact developers to support new TypeLiteral member!");
                }
            });
            let type = new TypeLiteralType();
            type.setMembers(members);
            return type;
        }
        else if (ts.isTypeReferenceNode(node.type)) {
            let referenceNodeName = node.type.typeName;
            let typeName = "";
            if (ts.isQualifiedName(referenceNodeName)) {
                typeName = handleQualifiedName(referenceNodeName);
            }
            else if (ts.isIdentifier(referenceNodeName)) {
                typeName = referenceNodeName.text;
            }
            else {
                logger.warn("New type of referenceNodeName found! Please contact developers to support this.");
            }
            return new UnclearReferenceType(typeName);
        }
        else if (ts.isUnionTypeNode(node.type)) {
            let unionType: Type[] = [];
            node.type.types.forEach((tmpType) => {
                if (ts.isTypeReferenceNode(tmpType)) {
                    let typeName = "";
                    if (ts.isIdentifier(tmpType.typeName)) {
                        typeName = tmpType.typeName.text;
                    }
                    else if (ts.isQualifiedName(tmpType.typeName)) {
                        typeName = handleQualifiedName(tmpType.typeName);
                    }
                    else if (ts.isTypeLiteralNode(tmpType.typeName)) {
                        logger.warn("Type name is TypeLiteral, please contact developers to add support for this!");
                    }
                    else {
                        logger.warn("New type name of TypeReference in UnionType.");
                    }
                    unionType.push(new UnclearReferenceType(typeName));
                }
                else if (ts.isLiteralTypeNode(tmpType)) {
                    let literalType: LiteralType = new LiteralType(ts.SyntaxKind[tmpType.literal.kind]);
                    unionType.push(literalType);
                }
                else {
                    unionType.push(buildTypeFromPreStr(ts.SyntaxKind[tmpType.kind]));
                }
            });
            return unionType;
        }
        else if (ts.isLiteralTypeNode(node.type)) {
            let literalType: LiteralType = new LiteralType(ts.SyntaxKind[node.type.literal.kind]);
            return literalType;
        }
        else {
            return buildTypeFromPreStr(ts.SyntaxKind[node.type.kind]);
        }
    }
    return new UnknownType();
}

export function buildTypeFromPreStr(preStr: string) {
    let postStr = "";
    switch (preStr) {
        case 'BooleanKeyword':
            postStr = "boolean";
            break;
        case 'NumberKeyword':
            postStr = "number";
            break;
        case 'StringKeyword':
            postStr = "string";
            break;
        case 'UndefinedKeyword':
            postStr = "undefined";
            break;
        case 'NullKeyword':
            postStr = "null";
            break;
        case 'AnyKeyword':
            postStr = "any";
            break;
        case 'VoidKeyword':
            postStr = "void";
            break;
        case 'NeverKeyword':
            postStr = "never";
            break;
        default:
            postStr = preStr;
    }
    return TypeInference.buildTypeFromStr(postStr);
}

export function buildProperty2ArkField(member: ts.PropertyDeclaration | ts.PropertySignature | ts.EnumMember, sourceFile: ts.SourceFile): ArkField {
    let field = new ArkField();
    field.setFieldType(ts.SyntaxKind[member.kind]);
    field.setOriginPosition(LineColPosition.buildFromNode(member, sourceFile));

    if (ts.isComputedPropertyName(member.name)) {
        if (ts.isIdentifier(member.name.expression)) {
            let propertyName = member.name.expression.text;
            field.setName(propertyName);
        }
        else if (ts.isPropertyAccessExpression(member.name.expression)) {
            field.setName(handlePropertyAccessExpression(member.name.expression));
        }
        else {
            logger.warn("Other property expression type found!");
        }
    }
    else if (ts.isIdentifier(member.name)) {
        let propertyName = member.name.text;
        field.setName(propertyName);
    }
    else {
        logger.warn("Other property type found!");
    }

    if (!ts.isEnumMember(member) && member.modifiers) {
        let modifiers = buildModifiers(member.modifiers);
        modifiers.forEach((modifier) => {
            field.addModifier(modifier);
        });
    }

    if (!ts.isEnumMember(member) && member.type) {
        field.setType(buildFieldType(member.type));
    }

    if (!ts.isEnumMember(member) && member.questionToken) {
        field.setQuestionToken(true);
    }

    if (ts.isPropertyDeclaration(member) && member.exclamationToken) {
        field.setExclamationToken(true);
    }

    return field;
}

export function buildIndexSignature2ArkField(member: ts.IndexSignatureDeclaration, sourceFile: ts.SourceFile): ArkField {
    let field = new ArkField();
    field.setFieldType(ts.SyntaxKind[member.kind]);
    //parameters
    field.setParameters(buildParameters(member, sourceFile));
    field.setOriginPosition(LineColPosition.buildFromNode(member, sourceFile));
    //modifiers
    if (member.modifiers) {
        buildModifiers(member.modifiers).forEach((modifier) => {
            field.addModifier(modifier);
        });
    }
    //type
    field.setType(buildReturnType4Method(member, sourceFile));
    return field;
}

export function buildGetAccessor2ArkField(member: ts.GetAccessorDeclaration, sourceFile: ts.SourceFile): ArkField {
    let field = new ArkField();
    if (ts.isIdentifier(member.name)) {
        field.setName(member.name.text);
    }
    else {
        logger.warn("Please contact developers to support new type of GetAccessor name!");
        field.setName('');
    }
    field.setFieldType(ts.SyntaxKind[member.kind]);
    field.setOriginPosition(LineColPosition.buildFromNode(member, sourceFile));
    return field;
}

function buildFieldType(fieldType: ts.TypeNode): Type {
    if (ts.isUnionTypeNode(fieldType)) {
        let unionType: Type[] = [];
        fieldType.types.forEach((tmpType) => {
            if (ts.isTypeReferenceNode(tmpType)) {
                let tmpTypeName = "";
                if (ts.isQualifiedName(tmpType.typeName)) {
                    tmpTypeName = handleQualifiedName(tmpType.typeName);
                }
                else if (ts.isIdentifier(tmpType.typeName)) {
                    tmpTypeName = tmpType.typeName.text;
                }
                else {
                    logger.warn("Other property type found!");
                }
                unionType.push(new UnclearReferenceType(tmpTypeName));
            }
            else if (ts.isLiteralTypeNode(tmpType)) {
                unionType.push(buildTypeFromPreStr(ts.SyntaxKind[tmpType.literal.kind]));
            }
            else {
                unionType.push(buildTypeFromPreStr(ts.SyntaxKind[tmpType.kind]));
            }
        });
        return unionType;
    }
    else if (ts.isTypeReferenceNode(fieldType)) {
        let tmpTypeName = "";
        let referenceNodeName = fieldType.typeName;
        if (ts.isQualifiedName(referenceNodeName)) {
            tmpTypeName = handleQualifiedName(referenceNodeName);
        }
        else if (ts.isIdentifier(referenceNodeName)) {
            tmpTypeName = referenceNodeName.text;
        }
        return new UnclearReferenceType(tmpTypeName);
    }
    else if (ts.isLiteralTypeNode(fieldType)) {
        return buildTypeFromPreStr(ts.SyntaxKind[fieldType.literal.kind]);
    }
    else {
        return buildTypeFromPreStr(ts.SyntaxKind[fieldType.kind]);
    }
}