import * as ts from "typescript";
import { buildModifiers, buildParameters, buildReturnType4Method, buildTypeParameters, handlePropertyAccessExpression } from "../../utils/builderUtils";
import { Type } from "../base/Type";

export class MethodInfo {
    name: string;
    parameters: Map<string, Type>;
    modifiers: Set<string>;
    returnType: Type;
    typeParameters: Type[];

    constructor(name: string, parameters: Map<string, Type>, modifiers: Set<string>, returnType: Type, typeParameters: Type[]) {
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
                name = handlePropertyAccessExpression(node.name.expression);
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

    let parameterTypes = buildParameters(node);

    //TODO: remember to test abstract method
    let modifiers: Set<string> = new Set<string>();
    if (node.modifiers) {
        modifiers = buildModifiers(node.modifiers);
    }

    let returnType = buildReturnType4Method(node);

    let typeParameters = buildTypeParameters(node);

    return new MethodInfo(name, parameterTypes, modifiers, returnType, typeParameters);
}