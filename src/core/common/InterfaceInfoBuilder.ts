import * as ts from "typescript";
import { buildHeritageClauses, buildModifiers, buildParameters, buildReturnType4Method, buildTypeParameters, handleQualifiedName } from "../../utils/builderUtils";
import { Type, UnknownType } from "../base/Type";
import { ArkMethod } from "../model/ArkMethod";
import { TypeInference } from "./TypeInference";

export class InterfaceProperty {
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

export class IndexSig {
    modifiers: Set<string>;
    parameters: Map<string, Type>;
    type: Type = UnknownType.getInstance();

    public getModifiers() {
        return this.modifiers;
    }

    public setModifiers(modifiers: Set<string>) {
        this.modifiers = modifiers;
    }

    public getParameters() {
        return this.parameters;
    }

    public setParameters(parameters: Map<string, Type>) {
        this.parameters = parameters;
    }

    public getType() {
        return this.type;
    }

    public setType(type: Type) {
        this.type = type;
    }

    constructor() { }
}

export class InterfaceMember {
    memberType: string;
    memberParameters: Map<string, Type> | undefined;
    returnType: Type | undefined;
    property: InterfaceProperty | undefined;
    method: ArkMethod | undefined;
    index: IndexSig | undefined;
    constructSig: ArkMethod | undefined;

    constructor() { }

    public getMemberType() {
        return this.memberType;
    }

    public setMemberType(memberType: string) {
        this.memberType = memberType;
    }

    public getMemberParameters() {
        return this.memberParameters;
    }

    public setMemberParameters(memberParameters: Map<string, Type>) {
        this.memberParameters = memberParameters;
    }

    public getReturnType() {
        return this.returnType;
    }

    public setReturnType(returnType: Type) {
        this.returnType = returnType;
    }

    public getProperty() {
        return this.property;
    }

    public setProperty(property: InterfaceProperty) {
        this.property = property;
    }

    public getMethod() {
        return this.method;
    }

    public setMethod(method: ArkMethod) {
        this.method = method;
    }

    public getIndex() {
        return this.index;
    }

    public setIndex(index: IndexSig) {
        this.index = index;
    }

    public getConstructSig() {
        return this.constructSig;
    }

    public setConstructSig(constructSig: ArkMethod) {
        this.constructSig = constructSig;
    }

}

export class InterfaceInfo {
    interfaceName: string;
    modifiers: Set<string>;
    heritageClauses: Map<string, string>;
    //properties: InterfaceProperty[];
    members: InterfaceMember[];
    typeParameters: Type[];
    constructor(interfaceName: string, modifiers: Set<string>,
        heritageClauses: Map<string, string>, members: InterfaceMember[],
        typeParameters: Type[]) {
        this.interfaceName = interfaceName;
        this.modifiers = modifiers;
        this.heritageClauses = heritageClauses;
        this.members = members;
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

    let interfaceMembers: InterfaceMember[] = [];
    node.members.forEach((member) => {
        let interfaceMember = new InterfaceMember();
        if (ts.isPropertySignature(member)) {
            interfaceMember.setMemberType('PropertySignature');
            interfaceMember.setProperty(buildInterfaceProperty(member));
        }
        else if (ts.isCallSignatureDeclaration(member)) {
            interfaceMember.setMemberType('CallSignature');
            interfaceMember.setMemberParameters(buildParameters(member));
            interfaceMember.setReturnType(buildReturnType(member));
        }
        else if (ts.isMethodSignature(member)) {
            interfaceMember.setMemberType('MethodSignature');
            let mtdMember = new ArkMethod();
            // gen parameters
            buildParameters(member).forEach((type, name) => {
                mtdMember.addParameter(name, type);
            });
            // gen modifiers
            if (member.modifiers) {
                buildModifiers(member.modifiers).forEach((modifier) => {
                    mtdMember.addModifier(modifier);
                });
            }
            // gen name
            let name = node.name ? node.name.escapedText.toString() : '';
            mtdMember.setName(name);
            // gen return type
            mtdMember.setReturnType(buildReturnType4Method(member));
            // gen type parameters
            buildTypeParameters(member).forEach((typeParameter) => {
                mtdMember.addTypeParameter(typeParameter);
            });
            interfaceMember.setMethod(mtdMember);
        }
        else if (ts.isConstructSignatureDeclaration(member)) {
            interfaceMember.setMemberType('ConstructSignature');
            let constructMember = new ArkMethod();
            // gen parameters
            buildParameters(member).forEach((type, name) => {
                constructMember.addParameter(name, type);
            });
            let name: string = "_Constructor";
            constructMember.setName(name);
            // gen return type
            constructMember.setReturnType(buildReturnType4Method(member));
            // gen type parameters
            buildTypeParameters(member).forEach((typeParameter) => {
                //TODO
                console.log("Please add typeParameter support in ArkMethod");
            });
            interfaceMember.setConstructSig(constructMember);
        }
        else if (ts.isIndexSignatureDeclaration(member)) {
            interfaceMember.setMemberType('IndexSignature');
            let indexSig = new IndexSig();
            //gen parameters
            indexSig.setParameters(buildParameters(member));
            //gen type
            indexSig.setType(buildReturnType(member));
            //gen modifiers
            if (member.modifiers) {
                indexSig.setModifiers(buildModifiers(member.modifiers));
            }
            interfaceMember.setIndex(indexSig);
        }
        interfaceMembers.push(interfaceMember);
    });

    let typeParameters: Type[] = buildTypeParameters(node);
    return new InterfaceInfo(name, modifiers, heritageClausesMap, interfaceMembers, typeParameters);
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
    return TypeInference.buildTypeFromStr(returnType[0]);
}