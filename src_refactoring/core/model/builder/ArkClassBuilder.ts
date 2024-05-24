import { NodeA } from "../../base/Ast";
import { Type } from "../../base/Type";
import { ViewTree } from "../../graph/ViewTree";
import { ArkField } from "../ArkField";
import { ArkFile } from "../ArkFile";
import { ArkMethod, arkMethodNodeKind } from "../ArkMethod";
import { ArkNamespace } from "../ArkNamespace";
import { ClassSignature, FieldSignature, MethodSignature } from "../ArkSignature";
import Logger from "../../../utils/logger";
import { LineColPosition } from "../../base/Position";
import { ObjectLiteralExpr } from "../../base/Expr";
import { FileSignature, NamespaceSignature } from "../ArkSignature";
import { Local } from "../../base/Local";
import { Decorator } from "../../base/Decorator";
import ts from "typescript";
import { ArkClass } from "../ArkClass";
import { buildArkMethodFromArkClass, buildDefaultArkMethodFromArkClass } from "./ArkMethodBuilder";
import { buildHeritageClauses, buildModifiers, buildTypeParameters } from "./builderUtils";
import { buildGetAccessor2ArkField, buildIndexSignature2ArkField, buildProperty2ArkField } from "./ArkFieldBuilder";

const logger = Logger.getLogger();

export type ClassLikeNode =
    ts.ClassDeclaration |
    ts.InterfaceDeclaration |
    ts.EnumDeclaration |
    ts.ClassExpression |
    ts.TypeLiteralNode;

export function buildDefaultArkClassFromArkFile(arkFile: ArkFile, defaultClass: ArkClass, astRoot: ts.SourceFile) {
    defaultClass.setDeclaringArkFile(arkFile);
    buildDefaultArkClass(defaultClass, astRoot);
}

export function buildDefaultArkClassFromArkNamespace(arkNamespace: ArkNamespace, defaultClass: ArkClass,
    nsNode: ts.ModuleDeclaration, sourceFile: ts.SourceFile) {
    defaultClass.setDeclaringArkNamespace(arkNamespace);
    defaultClass.setDeclaringArkFile(arkNamespace.getDeclaringArkFile());
    buildDefaultArkClass(defaultClass, sourceFile, nsNode);
}

export function buildNormalArkClassFromArkMethod(clsNode: ts.TypeLiteralNode,
    cls: ArkClass, sourceFile: ts.SourceFile) {
    if (cls.getDeclaringArkNamespace()) {
        buildNormalArkClassFromArkNamespace(clsNode, cls.getDeclaringArkNamespace(), cls, sourceFile);
    }
    else {
        buildNormalArkClassFromArkFile(clsNode, cls.getDeclaringArkFile(), cls, sourceFile);
    }
}

export function buildNormalArkClassFromArkFile(clsNode: ClassLikeNode,
    arkFile: ArkFile, cls: ArkClass, sourceFile: ts.SourceFile) {
    cls.setDeclaringArkFile(arkFile);
    cls.setCode(clsNode.getText(sourceFile));
    const { line, character } = ts.getLineAndCharacterOfPosition(
        sourceFile,
        clsNode.getStart(sourceFile)
    );
    cls.setLine(line + 1);
    cls.setColumn(character + 1);
    if (ts.isTypeLiteralNode(clsNode)) {
        const clsName = 'AnonymousClass-' + arkFile.getName() + '-' + arkFile.getAnonymousClassNumber();
        cls.setName(clsName);
    }
    buildNormalArkClass(clsNode, cls, sourceFile);
}

export function buildNormalArkClassFromArkNamespace(clsNode: ClassLikeNode,
    arkNamespace: ArkNamespace, cls: ArkClass, sourceFile: ts.SourceFile) {
    cls.setDeclaringArkNamespace(arkNamespace);
    cls.setDeclaringArkFile(arkNamespace.getDeclaringArkFile());
    cls.setCode(clsNode.getText(sourceFile));
    const { line, character } = ts.getLineAndCharacterOfPosition(
        sourceFile,
        clsNode.getStart(sourceFile)
    );
    cls.setLine(line + 1);
    cls.setColumn(character + 1);
    if (ts.isTypeLiteralNode(clsNode)) {
        const clsName = 'AnonymousClass-' + arkNamespace.getName() + '-' + arkNamespace.getAnonymousClassNumber();
        cls.setName(clsName);
    }
    buildNormalArkClass(clsNode, cls, sourceFile);
}

function buildDefaultArkClass(cls: ArkClass, sourceFile: ts.SourceFile, node?: ts.ModuleDeclaration) {
    cls.setName("_DEFAULT_ARK_CLASS");
    cls.genSignature();

    genDefaultArkMethod(cls, sourceFile, node);
}

function genDefaultArkMethod(cls: ArkClass, sourceFile: ts.SourceFile, node?: ts.ModuleDeclaration) {
    let defaultMethod = new ArkMethod();
    buildDefaultArkMethodFromArkClass(cls, defaultMethod, sourceFile, node);
    cls.setDefaultArkMethod(defaultMethod);
}

export function buildNormalArkClass(clsNode: ClassLikeNode,
    cls: ArkClass, sourceFile: ts.SourceFile) {
    if (!ts.isTypeLiteralNode(clsNode) && clsNode.name) {
        cls.setName(clsNode.name.text);
    }

    cls.genSignature();

    if ((!ts.isEnumDeclaration(clsNode)) && (!ts.isTypeLiteralNode(clsNode))) {
        if (clsNode.typeParameters) {
            buildTypeParameters(clsNode.typeParameters, sourceFile, cls).forEach((typeParameter) => {
                cls.addTypeParameter(typeParameter);
            });
        }

        if (clsNode.heritageClauses) {
            for (let [key, value] of buildHeritageClauses(clsNode.heritageClauses)) {
                if (value == 'ExtendsKeyword') {
                    cls.setSuperClassName(key);
                } else {
                    cls.addImplementedInterfaceName(key);
                }
            }
        }
    }

    if (!ts.isTypeLiteralNode(clsNode) && clsNode.modifiers) {
        buildModifiers(clsNode.modifiers, sourceFile).forEach((modifier) => {
            cls.addModifier(modifier);
        });
    }

    if (ts.isClassDeclaration(clsNode) || ts.isClassExpression(clsNode)) {
        cls.setOriginType("Class");
    }
    else if (ts.isInterfaceDeclaration(clsNode)) {
        cls.setOriginType("Interface");
    }
    else if (ts.isEnumDeclaration(clsNode)) {
        cls.setOriginType("Enum");
    }
    else {
        cls.setOriginType("TypeLiteral");
    }

    clsNode.members.forEach((member) => {
        if (ts.isPropertyDeclaration(member) || ts.isPropertySignature(member) || ts.isEnumMember(member)) {
            let field = buildProperty2ArkField(member, sourceFile, cls);
            checkInitializer(field, cls);
        }
        else if (ts.isIndexSignatureDeclaration(member)) {
            let field = buildIndexSignature2ArkField(member, sourceFile, cls);
            checkInitializer(field, cls);
        }
        else if (
            ts.isMethodDeclaration(member) ||
            ts.isConstructorDeclaration(member) ||
            ts.isMethodSignature(member) ||
            ts.isConstructSignatureDeclaration(member) ||
            ts.isAccessor(member) ||
            ts.isCallSignatureDeclaration(member)
        ) {
            let mthd: ArkMethod = new ArkMethod();
            buildArkMethodFromArkClass(member, cls, mthd, sourceFile);
            cls.addMethod(mthd);
            if (ts.isGetAccessor(member)) {
                let field = buildGetAccessor2ArkField(member, mthd, sourceFile);
                checkInitializer(field, cls);
            }
        }
        else if (ts.isSemicolonClassElement(member)) {
            logger.warn("Skip these members.");
        }
        else {
            logger.warn("Please contact developers to support new member type!");
        }
    });
}

function checkInitializer(field: ArkField, cls: ArkClass) {
    let initializer = field.getInitializer();
    if (initializer instanceof ObjectLiteralExpr) {
        let anonymousClass = initializer.getAnonymousClass();
        let newName = 'AnonymousClass-' + cls.getName() + '-' + field.getName();
        anonymousClass.setName(newName);
        anonymousClass.setDeclaringArkNamespace(cls.getDeclaringArkNamespace());
        anonymousClass.setDeclaringArkFile(cls.getDeclaringArkFile());
        anonymousClass.genSignature();
        anonymousClass.getMethods().forEach((mtd) => {
            mtd.setDeclaringArkClass(anonymousClass);
            mtd.setDeclaringArkFile();
            mtd.genSignature();
        });
    }
}