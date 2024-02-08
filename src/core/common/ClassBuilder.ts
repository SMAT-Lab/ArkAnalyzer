import * as ts from "typescript";
import { buildHeritageClauses, buildModifiers, buildTypeParameters, handleQualifiedName, handlePropertyAccessExpression } from "../../utils/builderUtils";
import { ArkField } from "../model/ArkField";

export class ClassInfo {

    private modifiers: Set<string> = new Set();
    private className: string = "";
    private typeParameters: string[] = [];
    private heritageClauses: Map<string, string> = new Map();
    private originType: string = "";

    private members: ArkField[] = [];

    constructor() { }

    public build(modifiers: Set<string>, className: string, typeParameters: string[], heritageClauses: Map<string, string>,
        members: ArkField[], originType: string) {
        this.modifiers = modifiers;
        this.className = className;
        this.typeParameters = typeParameters;
        this.heritageClauses = heritageClauses;
        this.members = members;
        this.originType = originType;
    }

    public getClassName() {
        return this.className;
    }

    public setClassName(className: string) {
        this.className = className;
    }

    public getmodifiers() {
        return this.modifiers;
    }

    public setmodifiers(modifiers: Set<string>) {
        this.modifiers = modifiers;
    }

    public getTypeParameters() {
        return this.typeParameters;
    }

    public setTypeParameters(typeParameters: string[]) {
        this.typeParameters = typeParameters;
    }

    public getHeritageClauses() {
        return this.heritageClauses;
    }

    public setHeritageClauses(heritageClauses: Map<string, string>) {
        this.heritageClauses = heritageClauses;
    }

    public getOriginType() {
        return this.originType;
    }

    public setOriginType(originType: string) {
        this.originType = originType;
    }

    public getMembers() {
        return this.members;
    }

    public setMembers(members: ArkField[]) {
        this.members = members;
    }
}

export function buildClassInfo4ClassNode(node: ts.ClassDeclaration | ts.ClassExpression | ts.InterfaceDeclaration | ts.EnumDeclaration): ClassInfo {

    let originType: string = "";
    if (ts.isClassDeclaration(node) || ts.isClassExpression(node)) {
        originType = "Class";
    }
    else if (ts.isInterfaceDeclaration(node)) {
        originType = "Interface";
    }
    else {
        originType = "Enum";
    }

    let modifiers: Set<string> = new Set<string>();
    if (node.modifiers) {
        modifiers = buildModifiers(node.modifiers);
    }

    let name: string = node.name ? node.name.escapedText.toString() : '';

    let typeParameters: string[] = [];
    if (!ts.isEnumDeclaration(node)) {
        typeParameters = buildTypeParameters(node);
    }

    let heritageClauses: Map<string, string> = new Map();
    if (!ts.isEnumDeclaration(node)) {
        heritageClauses = buildHeritageClauses(node);
    }

    let members: ArkField[] = [];
    node.members.forEach((member) => {
        if (ts.isPropertyDeclaration(member) || ts.isPropertySignature(member)) {
            members.push(buildProperty2ArkField(member));
        }
        if (ts.isIndexSignatureDeclaration(member)) {
            console.log("TODO: Index signature");
        }
    });

    let classInfo: ClassInfo = new ClassInfo();
    classInfo.build(modifiers, name, typeParameters, heritageClauses, members, originType);

    return classInfo;
}

function buildProperty2ArkField(member: ts.PropertyDeclaration | ts.PropertySignature | ts.EnumMember): ArkField {
    let field = new ArkField();

    //field.setCode(member.getText().toString());

    if (ts.isComputedPropertyName(member.name)) {
        if (ts.isIdentifier(member.name.expression)) {
            let propertyName = member.name.expression.escapedText.toString();
            field.setName(propertyName);
        }
        else if (ts.isPropertyAccessExpression(member.name.expression)) {
            field.setName(handlePropertyAccessExpression(member.name.expression));
        }
        else {
            console.log("Other property expression type found!");
        }
    }
    else if (ts.isIdentifier(member.name)) {
        let propertyName = member.name.escapedText.toString();
        field.setName(propertyName);
    }
    else {
        console.log("Other property type found!");
    }

    if (!ts.isEnumMember(member) && member.modifiers) {
        let modifiers = buildModifiers(member.modifiers);
        modifiers.forEach((modifier) => {
            field.addModifier(modifier);
        });
    }

    if (!ts.isEnumMember(member) && member.type) {
        field.setType(buildFieldType(member.type));
    }

    if (!ts.isEnumMember(member) && member.questionToken) {
        field.setQuestionToken(true);
    }

    if (ts.isPropertyDeclaration(member) && member.exclamationToken) {
        field.setExclamationToken(true);
    }

    return field;
}

function buildFieldType(fieldType: ts.TypeNode): string {
    let type: string = '';

    if (ts.isUnionTypeNode(fieldType)) {
        fieldType.types.forEach((tmpType) => {
            if (ts.isTypeReferenceNode(tmpType)) {
                if (ts.isQualifiedName(tmpType.typeName)) {
                    type = type + handleQualifiedName(tmpType.typeName) + ' | ';
                }
                else if (ts.isIdentifier(tmpType.typeName)) {
                    type = type + tmpType.typeName.escapedText.toString() + ' | ';
                }
                else {
                    console.log("Other property type found!");
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
    else if (ts.isTypeReferenceNode(fieldType)) {
        let referenceNodeName = fieldType.typeName;
        if (ts.isQualifiedName(referenceNodeName)) {
            type = handleQualifiedName(referenceNodeName);
        }
        else if (ts.isIdentifier(referenceNodeName)) {
            type = referenceNodeName.escapedText.toString();
        }
    }
    else if (ts.isLiteralTypeNode(fieldType)) {
        type = ts.SyntaxKind[fieldType.literal.kind];
    }
    else {
        type = ts.SyntaxKind[fieldType.kind];
    }

    return type;
}