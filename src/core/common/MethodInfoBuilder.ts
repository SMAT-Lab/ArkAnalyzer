import * as ts from "typescript";
import { buildModifiers } from "./BuildModifiers";

export class MethodInfo {
    name: string;
    parameters: Map<string, string>;
    modifiers: Set<string>;
    returnType: string[];

    constructor(name: string, parameters: Map<string, string>, modifiers: Set<string>, returnType: string[]) {
        this.name = name;
        this.parameters = parameters;
        this.modifiers = modifiers;
        this.returnType = returnType;
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
        name = (node.name as ts.Identifier).escapedText.toString();
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
        if (parameter.type) {
            if (parameter.type.kind == ts.SyntaxKind.TypeReference) {
                let referenceNodeName = (parameter.type as ts.TypeReferenceNode).typeName;
                if (ts.SyntaxKind[referenceNodeName.kind] == 'QualifiedName' ||
                    ts.SyntaxKind[referenceNodeName.kind] == 'FirstNode') {
                    parameterTypes.set(parameterName, handleQualifiedName(referenceNodeName as ts.QualifiedName));
                }
                else if (ts.SyntaxKind[referenceNodeName.kind] == 'Identifier') {
                    parameterTypes.set(parameterName, (referenceNodeName as ts.Identifier).escapedText.toString())
                }
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
        else {
            returnType.push(ts.SyntaxKind[node.type.kind]);
        }
    }

    return new MethodInfo(name, parameterTypes, modifiers, returnType);
}

function handleQualifiedName(node: ts.QualifiedName): string {
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