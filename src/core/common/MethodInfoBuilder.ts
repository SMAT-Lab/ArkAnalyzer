import * as ts from "typescript";
import { buildModifiers, buildParameters, buildReturnType4Method, buildTypeParameters, handlePropertyAccessExpression } from "../../utils/builderUtils";
import Logger from "../../utils/logger";
import { Type } from "../base/Type";

const logger = Logger.getLogger();

export class ObjectBindingPatternParameter {
    private propertyName: string = "";
    private name: string = "";
    private optional: boolean = false;
    private initializer: string = "";

    constructor() { }

    public getName() {
        return this.name;
    }

    public setName(name: string) {
        this.name = name;
    }

    public getPropertyName() {
        return this.propertyName;
    }

    public setPropertyName(propertyName: string) {
        this.propertyName = propertyName;
    }

    public isOptional() {
        return this.optional;
    }

    public setOptional(optional: boolean) {
        this.optional = optional;
    }
}

export class ArrayBindingPatternParameter {
    private propertyName: string = "";
    private name: string = "";
    private optional: boolean = false;
    private initializer: string = "";

    constructor() { }

    public getName() {
        return this.name;
    }

    public setName(name: string) {
        this.name = name;
    }

    public getPropertyName() {
        return this.propertyName;
    }

    public setPropertyName(propertyName: string) {
        this.propertyName = propertyName;
    }

    public isOptional() {
        return this.optional;
    }

    public setOptional(optional: boolean) {
        this.optional = optional;
    }
}

export class MethodParameter {
    private name: string = "";
    private type: Type;
    private optional: boolean = false;
    private objElements: ObjectBindingPatternParameter[] = [];
    private arrayElements: ArrayBindingPatternParameter[] = [];

    constructor() { }

    public getName() {
        return this.name;
    }

    public setName(name: string) {
        this.name = name;
    }

    public getType() {
        return this.type;
    }

    public setType(type: Type) {
        this.type = type;
    }

    public isOptional() {
        return this.optional;
    }

    public setOptional(optional: boolean) {
        this.optional = optional;
    }

    public addObjElement(element: ObjectBindingPatternParameter) {
        this.objElements.push(element);
    }

    public getObjElements() {
        return this.objElements;
    }

    public setObjElements(objElements: ObjectBindingPatternParameter[]) {
        this.objElements = objElements;
    }

    public addArrayElement(element: ArrayBindingPatternParameter) {
        this.arrayElements.push(element);
    }

    public getArrayElements() {
        return this.arrayElements;
    }

    public setArrayElements(arrayElements: ArrayBindingPatternParameter[]) {
        this.arrayElements = arrayElements;
    }
}

export class MethodInfo {
    name: string;
    parameters: MethodParameter[];
    modifiers: Set<string>;
    returnType: Type;
    typeParameters: Type[];
    getAccessorName: string | undefined = undefined;

    constructor(name: string, parameters: MethodParameter[], modifiers: Set<string>, returnType: Type, typeParameters: Type[], getAccessorName?: string) {
        this.name = name;
        this.parameters = parameters;
        this.modifiers = modifiers;
        this.returnType = returnType;
        this.typeParameters = typeParameters;
        this.getAccessorName = getAccessorName;
    }

    public updateName4anonymousFunc(newName: string) {
        this.name = newName;
    }
}

//get function name, parameters, return type, etc.
export function buildMethodInfo4MethodNode(node: ts.FunctionDeclaration | ts.MethodDeclaration | ts.ConstructorDeclaration |
    ts.ArrowFunction | ts.AccessorDeclaration | ts.FunctionExpression | ts.MethodSignature | ts.ConstructSignatureDeclaration |
    ts.CallSignatureDeclaration, sourceFile: ts.SourceFile): MethodInfo {

    //TODO: consider function without name
    let name: string = '';
    let getAccessorName: string | undefined = undefined;
    if (ts.isFunctionDeclaration(node)) {
        name = node.name ? node.name.text : '';
    }
    else if (ts.isMethodDeclaration(node) || ts.isMethodSignature(node)) {
        if (ts.isIdentifier(node.name)) {
            name = (node.name as ts.Identifier).text;
        }
        else if (ts.isComputedPropertyName(node.name)) {
            if (ts.isPropertyAccessExpression(node.name.expression)) {
                name = handlePropertyAccessExpression(node.name.expression);
            }
        }
        else {
            logger.warn("Other method declaration type found!");
        }
    }
    //TODO, hard code
    else if (ts.isConstructorDeclaration(node)) {
        name = 'constructor';
    }
    else if (ts.isConstructSignatureDeclaration(node)) {
        name = 'construct-signature';
    }
    else if (ts.isCallSignatureDeclaration(node)) {
        name = "call-signature";
    }
    else if (ts.isGetAccessor(node) && ts.isIdentifier(node.name)) {
        name = 'Get-' + node.name.text;
        getAccessorName = node.name.text;
    }
    else if (ts.isSetAccessor(node) && ts.isIdentifier(node.name)) {
        name = 'Set-' + node.name.text;
    }

    let parameterTypes = buildParameters(node, sourceFile);

    //TODO: remember to test abstract method
    let modifiers: Set<string> = new Set<string>();
    if ((!ts.isConstructSignatureDeclaration(node)) && (!ts.isCallSignatureDeclaration(node))) {
        if (node.modifiers) {
            modifiers = buildModifiers(node.modifiers);
        }
    }

    let returnType = buildReturnType4Method(node, sourceFile);

    let typeParameters = buildTypeParameters(node);

    return new MethodInfo(name, parameterTypes, modifiers, returnType, typeParameters, getAccessorName);
}