import * as ts from "typescript";
import { buildModifiers } from "./BuildModifiers";

export class Property {
    propertyName: string;
    modifiers: Set<string>;
    type: string;
    questionToken: boolean = false; //whether exists "?"
    exclamationToken: boolean = false; //whether exists "!"
    initializer: string;
    constructor(propertyName: string, modifiers: Set<string>, type: string,
        questionToken: boolean, exclamationToken: boolean, initializer: string) {
        this.propertyName = propertyName;
        this.modifiers = modifiers;
        this.type = type;
        this.questionToken = questionToken;
        this.exclamationToken = exclamationToken;
        this.initializer = initializer;
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

    return new Property(propertyName, modifiers, type, questionToken, exclamationToken, initializer);
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
export function buildClassInfo4ClassNode(node: ts.ClassDeclaration): ClassInfo {
    let name = node.name ? node.name.escapedText.toString() : '';

    let modifiers: Set<string> = new Set<string>();
    if (node.modifiers) {
        modifiers = buildModifiers(node.modifiers);
    }

    let heritageClausesMap: Map<string, string> = new Map<string, string>();
    node.heritageClauses?.forEach((heritageClause) => {
        heritageClause.types.forEach((type) => {
            let heritageClauseName = (type.expression as ts.Identifier).escapedText.toString();
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