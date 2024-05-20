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
    ts.ClassExpression;

export function buildDefaultArkClassFromArkFile(arkFile: ArkFile, defaultClass: ArkClass) {
    defaultClass.setDeclaringArkFile(arkFile);
    buildDefaultArkClass(defaultClass);
}

export function buildDefaultArkClassFromArkNamespace(arkNamespace: ArkNamespace, defaultClass: ArkClass) {
    defaultClass.setDeclaringArkNamespace(arkNamespace);
    defaultClass.setDeclaringArkFile(arkNamespace.getDeclaringArkFile());
    buildDefaultArkClass(defaultClass);
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
    cls.genSignature();
    buildNormalArkClass(clsNode, cls, sourceFile);
}

function buildDefaultArkClass(cls: ArkClass) {
    cls.setName("_DEFAULT_ARK_CLASS");
    cls.genSignature();
    genDefaultArkMethod(cls);
}

function genDefaultArkMethod(cls: ArkClass) {
    let defaultMethod = new ArkMethod();
    buildDefaultArkMethodFromArkClass(cls, defaultMethod);
    cls.setDefaultArkMethod(defaultMethod);
}

function buildNormalArkClass(clsNode: ts.ClassDeclaration | ts.ClassExpression | ts.InterfaceDeclaration | ts.EnumDeclaration,
    cls: ArkClass, sourceFile: ts.SourceFile) {
    if (clsNode.name) {
        cls.setName(clsNode.name.text);
    }

    if (!ts.isEnumDeclaration(clsNode)) {
        if (clsNode.typeParameters) {
            buildTypeParameters(clsNode.typeParameters).forEach((typeParameter) => {
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

    if (clsNode.modifiers) {
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
    else {
        cls.setOriginType("Enum");
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