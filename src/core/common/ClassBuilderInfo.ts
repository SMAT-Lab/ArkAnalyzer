import * as ts from "typescript";
import { buildModifiers } from "./BuildModifiers";

export class Property {
    private propertyName: string;
    private modifiers: Set<string> = new Set<string>();
    private type: string;
    private questionToken: boolean = false; //whether exists "?"
    private exclamationToken: boolean = false; //whether exists "!"
    private initializer: string;

    public getPropertyName() {
        return this.propertyName;
    }

    public setPropertyName(propertyName: string) {
        this.propertyName = propertyName;
    }

    public getModifiers() {
        return this.modifiers;
    }

    public addModifier(modifier: string) {
        this.modifiers.add(modifier);
    }

    public getType() {
        return this.type;
    }

    public setType(type: string) {
        this.type = type;
    }

    public getQuestionToken() {
        return this.questionToken;
    }

    public setQuestionToken(questionToken: boolean) {
        this.questionToken = questionToken;
    }

    public getExclamationToken() {
        return this.exclamationToken;
    }

    public setExclamationToken(exclamationToken: boolean) {
        this.exclamationToken = exclamationToken;
    }

    public getInitializer() {
        return this.initializer;
    }

    public setInitializer(initializer: string) {
        this.initializer = initializer;
    }

    constructor() { }

    public build(propertyName: string, modifiers: Set<string>, type: string,
        questionToken: boolean, exclamationToken: boolean, initializer: string) {
        this.setPropertyName(propertyName);
        modifiers.forEach((modifier) => {
            this.addModifier(modifier);
        });
        this.setType(type);
        this.setQuestionToken(questionToken);
        this.setExclamationToken(exclamationToken);
        this.setInitializer(initializer);
    }
}

function buildProperty(member: ts.PropertyDeclaration): Property {
    let propertyName = (member.name as ts.Identifier).escapedText.toString();

    let modifiers: Set<string> = new Set<string>();
    if (member.modifiers) {
        modifiers = buildModifiers(member.modifiers);
    }

    let type: string = '';
    if (member.type) {
        type = ts.SyntaxKind[member.type.kind];
    }

    let questionToken: boolean = false;
    if (member.questionToken) {
        questionToken = true;
    }

    let exclamationToken: boolean = false;
    if (member.exclamationToken) {
        exclamationToken = true;
    }

    let initializer: string = '';
    if (member.initializer) {
        initializer = ts.SyntaxKind[member.initializer.kind];
    }

    let property = new Property();
    property.build(propertyName, modifiers, type, questionToken, exclamationToken, initializer);
    return property;
}

export class ClassInfo {
    className: string;
    modifiers: Set<string>;
    heritageClauses: Map<string, string>;
    properties: Property[];
    typeParameters: string[];
    constructor(className: string, modifiers: Set<string>,
        heritageClauses: Map<string, string>, properties: Property[],
        typeParameters: string[]) {
        this.className = className;
        this.modifiers = modifiers;
        this.heritageClauses = heritageClauses;
        this.properties = properties;
        this.typeParameters = typeParameters;
    }
}

// build class name, modifiers, heritageClauses, properties
export function buildClassInfo4ClassNode(node: ts.ClassDeclaration | ts.ClassExpression): ClassInfo {
    let name = node.name ? node.name.escapedText.toString() : '';

    let modifiers: Set<string> = new Set<string>();
    if (node.modifiers) {
        modifiers = buildModifiers(node.modifiers);
    }

    let heritageClausesMap: Map<string, string> = new Map<string, string>();
    node.heritageClauses?.forEach((heritageClause) => {
        heritageClause.types.forEach((type) => {
            let heritageClauseName:string = '';
            if (ts.isIdentifier(type.expression)) {
                heritageClauseName = (type.expression as ts.Identifier).escapedText.toString();
            }
            else if (ts.isPropertyAccessExpression(type.expression)) {
                heritageClauseName = handleisPropertyAccessExpression(type.expression);
            }
            heritageClausesMap.set(heritageClauseName, ts.SyntaxKind[heritageClause.token]);
        });
    });

    let properties: Property[] = [];
    node.members.forEach((member) => {
        if (ts.isPropertyDeclaration(member)) {
            properties.push(buildProperty(member));
        }
    });

    let typeParameters: string[] = [];
    node.typeParameters?.forEach((typeParameter) => {
        typeParameters.push((typeParameter.name as ts.Identifier).escapedText.toString());
    });
    return new ClassInfo(name, modifiers, heritageClausesMap, properties, typeParameters);
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