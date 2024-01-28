import * as ts from "typescript";
import { buildHeritageClauses, buildModifiers, buildTypeParameters, handleQualifiedName, handleisPropertyAccessExpression } from "../../utils/builderUtils";

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
        if (ts.isTypeReferenceNode(member.type)) {
            let referenceNodeName = member.type.typeName;
            if (ts.isQualifiedName(referenceNodeName)) {
                type = handleQualifiedName(referenceNodeName);
            }
            else if (ts.isIdentifier(referenceNodeName)) {
                type = referenceNodeName.escapedText.toString();
            }
        }
        else if (ts.isUnionTypeNode(member.type)) {
            member.type.types.forEach((tmpType) => {
                if (ts.isTypeReferenceNode(tmpType)) {
                    if (ts.isQualifiedName(tmpType.typeName)) {
                        type = type + handleQualifiedName(tmpType.typeName) + ' | ';
                    }
                    else if (ts.isIdentifier(tmpType.typeName)) {
                        type = type + tmpType.typeName.escapedText.toString() + ' | ';
                    }
                }
                else {
                    type = type + ts.SyntaxKind[tmpType.kind] + ' | ';
                }
            });
        }
        else {
            type = ts.SyntaxKind[member.type.kind];
        }
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

    let heritageClausesMap: Map<string, string> = buildHeritageClauses(node);

    let properties: Property[] = [];
    node.members.forEach((member) => {
        if (ts.isPropertyDeclaration(member)) {
            properties.push(buildProperty(member));
        }
    });

    let typeParameters: string[] = buildTypeParameters(node);
    return new ClassInfo(name, modifiers, heritageClausesMap, properties, typeParameters);
}