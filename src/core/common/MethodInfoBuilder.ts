import * as ts from "typescript";
import { buildModifiers, buildTypeParameters, handleQualifiedName, handleisPropertyAccessExpression } from "../../utils/builderUtils";

export class MethodInfo {
    name: string;
    parameters: Map<string, string>;
    modifiers: Set<string>;
    returnType: string[];
    typeParameters: string[];

    constructor(name: string, parameters: Map<string, string>, modifiers: Set<string>, returnType: string[], typeParameters: string[]) {
        this.name = name;
        this.parameters = parameters;
        this.modifiers = modifiers;
        this.returnType = returnType;
        this.typeParameters = typeParameters;
    }

    public updateName4anonymousFunc(newName: string) {
        this.name = newName;
    }
}

//get function name, parameters, return type, etc.
export function buildMethodInfo4MethodNode(node: ts.FunctionDeclaration | ts.MethodDeclaration | ts.ConstructorDeclaration |
    ts.ArrowFunction | ts.AccessorDeclaration | ts.FunctionExpression): MethodInfo {

    //TODO: consider function without name
    let name: string = '';
    if (ts.isFunctionDeclaration(node)) {
        name = node.name ? node.name.escapedText.toString() : '';
    }
    else if (ts.isMethodDeclaration(node)) {
        //debugger;
        if (ts.isIdentifier(node.name)) {
            name = (node.name as ts.Identifier).escapedText.toString();
        }
        else if (ts.isComputedPropertyName(node.name)) {
            if (ts.isPropertyAccessExpression(node.name.expression)) {
                name = handleisPropertyAccessExpression(node.name.expression);
            }
        }
    }
    //TODO, hard code
    else if (ts.isConstructorDeclaration(node)) {
        name = '_Constructor';
    }
    else if (ts.isGetAccessor(node) && ts.isIdentifier(node.name)) {
        name = 'Get-' + node.name.escapedText.toString();
    }
    else if (ts.isSetAccessor(node) && ts.isIdentifier(node.name)) {
        name = 'Set-' + node.name.escapedText.toString();
    }

    // TODO: support question token which means optional parameter
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
                    else {
                        parameterType = parameterType + ts.SyntaxKind[tmpType.kind] + ' | ';
                    }
                });
                parameterTypes.set(parameterName, parameterType);
            }
            else {
                parameterTypes.set(parameterName, ts.SyntaxKind[parameter.type.kind]);
            }
        }
        else {
            parameterTypes.set(parameterName, '');
        }
    });

    //TODO: remember to test abstract method
    let modifiers: Set<string> = new Set<string>();
    if (node.modifiers) {
        modifiers = buildModifiers(node.modifiers);
    }

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
        else {
            returnType.push(ts.SyntaxKind[node.type.kind]);
        }
    }

    let typeParameters: string[] = buildTypeParameters(node);
    
    return new MethodInfo(name, parameterTypes, modifiers, returnType, typeParameters);
}