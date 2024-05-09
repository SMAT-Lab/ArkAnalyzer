import * as ts from "typescript";
import { buildGetAccessor2ArkField, buildHeritageClauses, buildIndexSignature2ArkField, buildModifiers, buildProperty2ArkField, buildTypeParameters } from "../../utils/builderUtils";
import Logger from "../../utils/logger";
import { Type } from "../base/Type";
import { ArkField } from "../model/ArkField";
import { LineColPosition } from "../base/Position";
import { Decorator } from "../base/Decorator";

const logger = Logger.getLogger();
export class ClassInfo {

    private modifiers: Set<string | Decorator> = new Set();
    private className: string = "";
    private typeParameters: Type[] = [];
    private heritageClauses: Map<string, string> = new Map();
    private originType: string = "";

    private members: ArkField[] = [];

    constructor() { }

    public build(modifiers: Set<string | Decorator>, className: string, typeParameters: Type[], heritageClauses: Map<string, string>,
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

export function buildClassInfo4ClassNode(node: ts.ClassDeclaration | ts.ClassExpression | ts.InterfaceDeclaration | ts.EnumDeclaration, sourceFile: ts.SourceFile): ClassInfo {

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

    let modifiers: Set<string | Decorator> = new Set<string | Decorator>();
    if (node.modifiers) {
        modifiers = buildModifiers(node.modifiers, sourceFile);
    }

    let name: string = node.name ? node.name.text : '';

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
            members.push(buildProperty2ArkField(member, sourceFile));
        }
        else if (ts.isIndexSignatureDeclaration(member)) {
            members.push(buildIndexSignature2ArkField(member, sourceFile));
        }
        else if (ts.isGetAccessor(member)) {
            members.push(buildGetAccessor2ArkField(member, sourceFile));
        }
        else if (ts.isMethodDeclaration(member) || ts.isConstructorDeclaration(member) || ts.isMethodSignature(member) ||
            ts.isConstructSignatureDeclaration(member) || ts.isSetAccessor(member) || ts.isCallSignatureDeclaration(member)
            || ts.isSemicolonClassElement(member)) {
            // skip these members
        }
        else {
            logger.warn("Please contact developers to support new arkfield type!");
        }
    });

    let classInfo: ClassInfo = new ClassInfo();
    classInfo.build(modifiers, name, typeParameters, heritageClauses, members, originType);

    return classInfo;
}