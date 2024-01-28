import * as ts from "typescript";
import { buildHeritageClauses, buildModifiers, buildTypeParameters, handleQualifiedName, handleisPropertyAccessExpression } from "../../utils/builderUtils";

export class Property {
    private propertyName: string;
    private modifiers: Set<string> = new Set<string>();
    private type: string;
    private parameters: Map<string, string> | undefined;
    private questionToken: boolean = false; //whether exists "?"

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

    public getParameters() {
        return this.parameters;
    }

    public setParameters(parameters: Map<string, string> | undefined) {
        this.parameters = parameters;
    }

    constructor() { }

    public build(propertyName: string, modifiers: Set<string>, type: string, questionToken: boolean,
        parameters?: Map<string, string>) {
        this.setPropertyName(propertyName);
        modifiers.forEach((modifier) => {
            this.addModifier(modifier);
        });
        this.setType(type);
        this.setQuestionToken(questionToken);
        this.setParameters(parameters);
    }
}

function buildProperty(member: ts.PropertySignature): Property {
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

    let property = new Property();
    property.build(propertyName, modifiers, type, questionToken);
    return property;
}

export class InterfaceInfo {
    interfaceName: string;
    modifiers: Set<string>;
    heritageClauses: Map<string, string>;
    properties: Property[];
    typeParameters: string[];
    constructor(interfaceName: string, modifiers: Set<string>,
        heritageClauses: Map<string, string>, properties: Property[],
        typeParameters: string[]) {
        this.interfaceName = interfaceName;
        this.modifiers = modifiers;
        this.heritageClauses = heritageClauses;
        this.properties = properties;
        this.typeParameters = typeParameters;
    }
}

// build interface name, modifiers, heritageClauses, properties
export function buildInterfaceInfo4InterfaceNode(node: ts.InterfaceDeclaration): InterfaceInfo {
    let name = node.name ? node.name.escapedText.toString() : '';

    let modifiers: Set<string> = new Set<string>();
    if (node.modifiers) {
        modifiers = buildModifiers(node.modifiers);
    }

    let heritageClausesMap: Map<string, string> = buildHeritageClauses(node);

    let properties: Property[] = [];
    node.members.forEach((member) => {
        if (ts.isPropertySignature(member)) {
            properties.push(buildProperty(member));
        }
        else if (ts.isCallSignatureDeclaration(member)) {
            //
        }
        else if (ts.isMethodSignature(member)) {
            //
        }
        else if (ts.isConstructSignatureDeclaration(member)) {
            //
        }
        else if (ts.isIndexSignatureDeclaration(member)) {
            //
        }
    });

    let typeParameters: string[] = buildTypeParameters(node);
    return new InterfaceInfo(name, modifiers, heritageClausesMap, properties, typeParameters);
}