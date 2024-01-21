import * as ts from "typescript";
import { buildModifiers } from "./BuildModifiers";

export class MethodInfo {
    name: string;
    parameterTypes: string[];
    modifiers: Set<string>;
    returnType: string[];

    constructor(name: string, parameterTypes: string[], modifiers: Set<string>, returnType: string[]) {
        this.name = name;
        this.parameterTypes = parameterTypes;
        this.modifiers = modifiers;
        this.returnType = returnType;
    }
}

//get function name, parameters, return type, etc.
export function buildMethodInfo4MethodNode(node: ts.FunctionDeclaration | ts.MethodDeclaration | ts.ConstructorDeclaration | ts.ArrowFunction): MethodInfo {

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

    // TODO: support question token which means optional parameter
    let parameterTypes: string[] = [];
    node.parameters.forEach((parameter) => {
        if (parameter.type) {
            if (parameter.type.kind == ts.SyntaxKind.TypeReference) {
                let referenceNodeName = (parameter.type as ts.TypeReferenceNode).typeName;
                if (ts.SyntaxKind[referenceNodeName.kind] == 'QualifiedName') {
                    parameterTypes.push(handleQualifiedName(referenceNodeName as ts.QualifiedName));
                }
                else if (ts.SyntaxKind[referenceNodeName.kind] == 'Identifier') {
                    parameterTypes.push((referenceNodeName as ts.Identifier).escapedText.toString())
                }
            }
            else {
                parameterTypes.push(ts.SyntaxKind[parameter.type.kind]);
            }
        }
        else {
            parameterTypes.push('');
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
    let left:string = '';
    if (ts.SyntaxKind[node.left.kind] == 'Identifier') {
        left = (node.left as ts.Identifier).escapedText.toString();
    }
    else if (ts.SyntaxKind[node.left.kind] == 'QualifiedName') {
        left = handleQualifiedName(node.left as ts.QualifiedName);
    }
    let qualifiedName = left + '.' + right;
    return qualifiedName;
}