import ts, { isClassDeclaration } from "typescript";

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

export function handleisPropertyAccessExpression(node: ts.PropertyAccessExpression): string {
    let right = (node.name as ts.Identifier).escapedText.toString();
    let left: string = '';
    if (ts.SyntaxKind[node.expression.kind] == 'Identifier') {
        left = (node.expression as ts.Identifier).escapedText.toString();
    }
    else if (ts.isPropertyAccessExpression(node.expression)) {
        left = handleisPropertyAccessExpression(node.expression as ts.PropertyAccessExpression);
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
                heritageClauseName = handleisPropertyAccessExpression(type.expression);
            }
            heritageClausesMap.set(heritageClauseName, ts.SyntaxKind[heritageClause.token]);
        });
    });
    return heritageClausesMap;
}

export function buildTypeParameters(node: ts.ClassDeclaration | ts.ClassExpression |
    ts.InterfaceDeclaration | ts.FunctionDeclaration | ts.MethodDeclaration |
    ts.ConstructorDeclaration | ts.ArrowFunction | ts.AccessorDeclaration |
    ts.FunctionExpression | ts.MethodSignature | ts.ConstructSignatureDeclaration): string[] {
    let typeParameters: string[] = [];
    node.typeParameters?.forEach((typeParameter) => {
        if (ts.isIdentifier(typeParameter.name)) {
            typeParameters.push(typeParameter.name.escapedText.toString());
        }
    });
    return typeParameters;
}

export function buildParameters(node: ts.FunctionDeclaration | ts.MethodDeclaration
    | ts.ConstructorDeclaration | ts.ArrowFunction | ts.AccessorDeclaration |
    ts.FunctionExpression | ts.CallSignatureDeclaration | ts.MethodSignature |
    ts.ConstructSignatureDeclaration | ts.IndexSignatureDeclaration) {
    let parameterTypes: Map<string, string> = new Map();
    node.parameters.forEach((parameter) => {
        let parameterName = ts.isIdentifier(parameter.name) ? parameter.name.escapedText.toString() : '';
        if (parameter.questionToken) {
            parameterName = parameterName + '?';
        }
        if (parameter.type) {
            if (ts.isTypeReferenceNode(parameter.type)) {
                let referenceNodeName = parameter.type.typeName;
                if (ts.isQualifiedName(referenceNodeName)) {
                    parameterTypes.set(parameterName, handleQualifiedName(referenceNodeName as ts.QualifiedName));
                }
                else if (ts.isIdentifier(referenceNodeName)) {
                    parameterTypes.set(parameterName, (referenceNodeName as ts.Identifier).escapedText.toString())
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
                parameterTypes.set(parameterName, parameterType);
            }
            else if (ts.isLiteralTypeNode(parameter.type)) {
                parameterTypes.set(parameterName, ts.SyntaxKind[parameter.type.literal.kind]);
            }
            else {
                parameterTypes.set(parameterName, ts.SyntaxKind[parameter.type.kind]);
            }
        }
        else {
            parameterTypes.set(parameterName, '');
        }
    });
    return parameterTypes;
}

export function buildReturnType4Method(node: ts.FunctionDeclaration | ts.MethodDeclaration |
    ts.ConstructorDeclaration | ts.ArrowFunction | ts.AccessorDeclaration |
    ts.FunctionExpression | ts.MethodSignature | ts.ConstructSignatureDeclaration) {
    let returnType: string[] = [];
    if (node.type) {
        if (node.type.kind == ts.SyntaxKind.TypeLiteral) {
            for (let member of (node.type as ts.TypeLiteralNode).members) {
                let memberType = (member as ts.PropertySignature).type;
                if (memberType) {
                    returnType.push(ts.SyntaxKind[memberType.kind]);
                }
            }
        }
        else if (ts.isTypeReferenceNode(node.type)) {
            let referenceNodeName = node.type.typeName;
            if (ts.isQualifiedName(referenceNodeName)) {
                returnType.push(handleQualifiedName(referenceNodeName));
            }
            else if (ts.isIdentifier(referenceNodeName)) {
                returnType.push(referenceNodeName.escapedText.toString());
            }
        }
        else if (ts.isUnionTypeNode(node.type)) {
            let tmpReturnType = '';
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
            });
            returnType.push(tmpReturnType);
        }
        else if (ts.isLiteralTypeNode(node.type)) {
            returnType.push(ts.SyntaxKind[node.type.literal.kind]);
        }
        else {
            returnType.push(ts.SyntaxKind[node.type.kind]);
        }
    }
    return returnType;
}