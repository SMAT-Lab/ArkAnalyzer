import * as ts from "typescript";
import { buildHeritageClauses, buildIndexSignature2ArkField, buildModifiers, buildProperty2ArkField, buildTypeParameters } from "../../utils/builderUtils";
import { Type } from "../base/Type";
import { ArkField } from "../model/ArkField";

export class ClassInfo {

    private modifiers: Set<string> = new Set();
    private className: string = "";
    private typeParameters: Type[] = [];
    private heritageClauses: Map<string, string> = new Map();
    private originType: string = "";

    private members: ArkField[] = [];

    constructor() { }

    public build(modifiers: Set<string>, className: string, typeParameters: Type[], heritageClauses: Map<string, string>,
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

    public setTypeParameters(typeParameters: Type[]) {
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

    let typeParameters: Type[] = [];
    if (!ts.isEnumDeclaration(node)) {
        typeParameters = buildTypeParameters(node);
    }

    let heritageClauses: Map<string, string> = new Map();
    if (!ts.isEnumDeclaration(node)) {
        heritageClauses = buildHeritageClauses(node);
    }

    let members: ArkField[] = [];
    node.members.forEach((member) => {
        if (ts.isPropertyDeclaration(member) || ts.isPropertySignature(member) || ts.isEnumMember(member)) {
            members.push(buildProperty2ArkField(member));
        }
        else if (ts.isIndexSignatureDeclaration(member)) {
            members.push(buildIndexSignature2ArkField(member));
        }
        else if (ts.isMethodDeclaration(member) || ts.isConstructorDeclaration(member) || ts.isMethodSignature(member) ||
            ts.isConstructSignatureDeclaration(member) || ts.isAccessor(member) || ts.isCallSignatureDeclaration(member)
            || ts.isSemicolonClassElement(member)) {
            // skip these members
        }
        else {
            console.log("Please contact developers to support new arkfield type!");
        }
    });

    let classInfo: ClassInfo = new ClassInfo();
    classInfo.build(modifiers, name, typeParameters, heritageClauses, members, originType);

    return classInfo;
}