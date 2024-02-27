import ts from "typescript";
import { LiteralType, Type, TypeLiteralType, UnclearType, UnionType, UnknownType } from "../core/base/Type";
import { TypeInference } from "../core/common/TypeInference";
import { MethodParameter } from "../core/common/MethodInfoBuilder";
import { buildProperty2ArkField } from "../core/common/ClassBuilder";
import { ArkField } from "../core/model/ArkField";

export function handleQualifiedName(node: ts.QualifiedName): string {
    let right = (node.right as ts.Identifier).escapedText.toString();
    let left: string = '';
    if (ts.SyntaxKind[node.left.kind] == 'Identifier') {
        left = (node.left as ts.Identifier).escapedText.toString();
    }
    else if (ts.SyntaxKind[node.left.kind] == 'QualifiedName') {
        left = handleQualifiedName(node.left as ts.QualifiedName);
    }
    let qualifiedName = left + '.' + right;
    return qualifiedName;
}

export function handlePropertyAccessExpression(node: ts.PropertyAccessExpression): string {
    let right = (node.name as ts.Identifier).escapedText.toString();
    let left: string = '';
    if (ts.SyntaxKind[node.expression.kind] == 'Identifier') {
        left = (node.expression as ts.Identifier).escapedText.toString();
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
        //console.log(name, modifier.kind, ts.SyntaxKind.AbstractKeyword);
        if (ts.SyntaxKind[modifier.kind] == 'FirstContextualKeyword') {
            modifiers.add('AbstractKeyword');
        }
        else if (ts.isDecorator(modifier)) {
            if (modifier.expression) {
                if (ts.isIdentifier(modifier.expression)) {
                    modifiers.add(modifier.expression.escapedText.toString());
                }
                else if (ts.isCallExpression(modifier.expression)) {
                    if (ts.isIdentifier(modifier.expression.expression)) {
                        modifiers.add(modifier.expression.expression.escapedText.toString());
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
                heritageClauseName = (type.expression as ts.Identifier).escapedText.toString();
            }
            else if (ts.isPropertyAccessExpression(type.expression)) {
                heritageClauseName = handlePropertyAccessExpression(type.expression);
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
            let parametersTypeStr = typeParameter.name.escapedText.toString();
            typeParameters.push(buildTypeFromPreStr(parametersTypeStr));
        }
        else {
            console.log("Other typeparameter found!!!");
        }
    });
    return typeParameters;
}

export function buildParameters(node: ts.FunctionDeclaration | ts.MethodDeclaration
    | ts.ConstructorDeclaration | ts.ArrowFunction | ts.AccessorDeclaration |
    ts.FunctionExpression | ts.CallSignatureDeclaration | ts.MethodSignature |
    ts.ConstructSignatureDeclaration | ts.IndexSignatureDeclaration) {
    let parameters: MethodParameter[] = [];
    node.parameters.forEach((parameter) => {
        let methodParameter = new MethodParameter();
        if (ts.isIdentifier(parameter.name)) {
            methodParameter.setName(parameter.name.escapedText.toString());
        }
        else {
            console.log("Parameter name is not identifier, please contact developers to support this!");
        }
        if (parameter.questionToken) {
            methodParameter.setOptional(true);
        }
        if (parameter.type) {
            if (ts.isTypeReferenceNode(parameter.type)) {
                let referenceNodeName = parameter.type.typeName;
                if (ts.isQualifiedName(referenceNodeName)) {
                    let parameterTypeStr = handleQualifiedName(referenceNodeName as ts.QualifiedName);
                    let parameterType = new UnclearType(parameterTypeStr);
                    methodParameter.setType(parameterType);
                }
                else if (ts.isIdentifier(referenceNodeName)) {
                    let parameterTypeStr = (referenceNodeName as ts.Identifier).escapedText.toString();
                    let parameterType = new UnclearType(parameterTypeStr);
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
                            parameterType = tmpType.typeName.escapedText.toString();
                        }
                        unionTypePara.push(new UnclearType(parameterType));
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
                        members.push(buildProperty2ArkField(member));
                    }
                    else {
                        console.log("Please contact developers to support new TypeLiteral member!");
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

        /* if (parameter.type) {
            if (ts.isTypeReferenceNode(parameter.type)) {
                let referenceNodeName = parameter.type.typeName;
                if (ts.isQualifiedName(referenceNodeName)) {
                    let parameterTypeStr = handleQualifiedName(referenceNodeName as ts.QualifiedName);
                    parameterTypes.set(parameterName, TypeInference.buildTypeFromStr(parameterTypeStr));
                }
                else if (ts.isIdentifier(referenceNodeName)) {
                    let parameterTypeStr = (referenceNodeName as ts.Identifier).escapedText.toString();
                    parameterTypes.set(parameterName, TypeInference.buildTypeFromStr(parameterTypeStr))
                }
            }
            else if (ts.isUnionTypeNode(parameter.type)) {
                let parameterType = '';
                parameter.type.types.forEach((tmpType) => {
                    if (ts.isTypeReferenceNode(tmpType)) {
                        if (ts.isQualifiedName(tmpType.typeName)) {
                            parameterType = parameterType + handleQualifiedName(tmpType.typeName) + ' | ';
                        }
                        else if (ts.isIdentifier(tmpType.typeName)) {
                            parameterType = parameterType + tmpType.typeName.escapedText.toString() + ' | ';
                        }
                    }
                    else if (ts.isLiteralTypeNode(tmpType)) {
                        parameterType = parameterType + ts.SyntaxKind[tmpType.literal.kind] + ' | ';
                    }
                    else {
                        parameterType = parameterType + ts.SyntaxKind[tmpType.kind] + ' | ';
                    }
                });
                parameterTypes.set(parameterName, TypeInference.buildTypeFromStr(parameterType));
            }
            else if (ts.isLiteralTypeNode(parameter.type)) {
                parameterTypes.set(parameterName, TypeInference.buildTypeFromStr(ts.SyntaxKind[parameter.type.literal.kind]));
            }
            else {
                parameterTypes.set(parameterName, TypeInference.buildTypeFromStr(ts.SyntaxKind[parameter.type.kind]));
            }
        }
        else {
            parameterTypes.set(parameterName, UnknownType.getInstance());
        } */
        parameters.push(methodParameter);
    });
    return parameters;
}

export function buildReturnType4Method(node: ts.FunctionDeclaration | ts.MethodDeclaration |
    ts.ConstructorDeclaration | ts.ArrowFunction | ts.AccessorDeclaration |
    ts.FunctionExpression | ts.MethodSignature | ts.ConstructSignatureDeclaration |
    ts.CallSignatureDeclaration) {
    if (node.type) {
        if (ts.isTypeLiteralNode(node.type)) {
            console.log("Return type is TypeLiteral, please contact developers to add support for this!");
            return new UnknownType();
            /* for (let member of node.type.members) {
                let memberType = (member as ts.PropertySignature).type;
                if (memberType) {
                    returnType.push(ts.SyntaxKind[memberType.kind]);
                }
            } */
        }
        else if (ts.isTypeReferenceNode(node.type)) {
            let referenceNodeName = node.type.typeName;
            let typeName = "";
            if (ts.isQualifiedName(referenceNodeName)) {
                typeName = handleQualifiedName(referenceNodeName);
            }
            else if (ts.isIdentifier(referenceNodeName)) {
                typeName = referenceNodeName.escapedText.toString();
            }
            return new UnclearType(typeName);
            /* let referenceNodeName = node.type.typeName;
            if (ts.isQualifiedName(referenceNodeName)) {
                returnType.push(handleQualifiedName(referenceNodeName));
            }
            else if (ts.isIdentifier(referenceNodeName)) {
                returnType.push(referenceNodeName.escapedText.toString());
            } */
        }
        else if (ts.isUnionTypeNode(node.type)) {
            let unionType: Type[] = [];
            node.type.types.forEach((tmpType) => {
                if (ts.isTypeReferenceNode(tmpType)) {
                    console.log("Union return type contains TypeReference, please contact developers to add support for this!");
                    return new UnknownType();
                }
                else if (ts.isLiteralTypeNode(tmpType)) {
                    let literalType: LiteralType = new LiteralType(ts.SyntaxKind[tmpType.literal.kind]);
                    unionType.push(literalType);
                }
                else {
                    unionType.push(buildTypeFromPreStr(ts.SyntaxKind[tmpType.kind]));
                }
            });
            /* let tmpReturnType = '';
            node.type.types.forEach((tmpType) => {
                if (ts.isTypeReferenceNode(tmpType)) {
                    if (ts.isQualifiedName(tmpType.typeName)) {
                        tmpReturnType = tmpReturnType + handleQualifiedName(tmpType.typeName) + ' | ';
                    }
                    else if (ts.isIdentifier(tmpType.typeName)) {
                        tmpReturnType = tmpReturnType + tmpType.typeName.escapedText.toString() + ' | ';
                    }
                }
                else if (ts.isLiteralTypeNode(tmpType)) {
                    tmpReturnType = tmpReturnType + ts.SyntaxKind[tmpType.literal.kind] + ' | ';
                }
                else {
                    tmpReturnType = tmpReturnType + ts.SyntaxKind[tmpType.kind] + ' | ';
                }
            }); */
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