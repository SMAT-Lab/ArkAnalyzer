import * as ts from "typescript";
import { buildHeritageClauses, buildModifiers, buildParameters, buildReturnType4Method, buildTypeParameters, handleQualifiedName, handlePropertyAccessExpression } from "../../utils/builderUtils";
import { ArkMethod } from "../model/ArkMethod";

class InterfaceProperty {
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

function buildInterfaceProperty(member: ts.PropertySignature): InterfaceProperty {
    let propertyName = '';
    if (ts.isIdentifier(member.name)) {
        propertyName = member.name.escapedText.toString();
    }

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
                else if (ts.isLiteralTypeNode(tmpType)) {
                    type = type + ts.SyntaxKind[tmpType.literal.kind] + ' | ';
                }
                else {
                    type = type + ts.SyntaxKind[tmpType.kind] + ' | ';
                }
            });
        }
        else if (ts.isLiteralTypeNode(member.type)) {
            type = ts.SyntaxKind[member.type.literal.kind];
        }
        else {
            type = ts.SyntaxKind[member.type.kind];
        }
    }

    let questionToken: boolean = false;
    if (member.questionToken) {
        questionToken = true;
    }

    let property = new InterfaceProperty();
    property.build(propertyName, modifiers, type, questionToken);
    return property;
}

export class EnumMember {
    memberName: string;
    initializerType: string;
    initializer: string;

    constructor() { }

    public getMemberName() {
        return this.memberName;
    }

    public getInitializerType() {
        return this.initializerType;
    }

    public getInitializer() {
        return this.initializer;
    }

    public setMemberName(memberName: string) {
        this.memberName = memberName;
    }

    public setInitializerType(initializerType: string) {
        this.initializerType = initializerType;
    }

    public setInitializer(initializer: string) {
        this.initializer = initializer;
    }
}

export class EnumInfo {
    enumName: string;
    modifiers: Set<string>;
    members: EnumMember[];

    constructor(enumName: string, modifiers: Set<string>, members: EnumMember[]) {
        this.enumName = enumName;
        this.modifiers = modifiers;
        this.members = members;
    }
}

// build interface name, modifiers, heritageClauses, properties
export function buildEnumInfo4EnumNode(node: ts.EnumDeclaration): EnumInfo {
    let name = node.name ? node.name.escapedText.toString() : '';

    let modifiers: Set<string> = new Set<string>();
    if (node.modifiers) {
        modifiers = buildModifiers(node.modifiers);
    }

    let enumMembers: EnumMember[] = [];
    node.members.forEach((member) => {
        let enumMember = new EnumMember();
        if (ts.isStringLiteral(member.name)) {
            enumMember.setMemberName(member.name.text);
        }
        else {
            enumMember.setMemberName((member.name as ts.Identifier).escapedText.toString());
        }
        if (member.initializer) {
            enumMember.setInitializerType(ts.SyntaxKind[member.initializer.kind]);
            if (ts.isBinaryExpression(member.initializer)) {
                //TODO
                enumMember.setInitializer("TODO: isBinaryExpression");
            }
            else if (ts.isCallExpression(member.initializer)) {
                //TODO
                enumMember.setInitializer("TODO: isCallExpression");
            }
            else if (ts.isPropertyAccessExpression(member.initializer)) {
                enumMember.setInitializer(handlePropertyAccessExpression(member.initializer));
            }
            else if (ts.isStringLiteral(member.initializer)) {
                enumMember.setInitializer(member.initializer.text);
            }
            else if (ts.isNumericLiteral(member.initializer)) {
                enumMember.setInitializer(member.initializer.text);
            }
        }
        enumMembers.push(enumMember);
    });

    return new EnumInfo(name, modifiers, enumMembers);
}

function buildReturnType(node: ts.CallSignatureDeclaration | ts.IndexSignatureDeclaration) {
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
    return returnType;
}