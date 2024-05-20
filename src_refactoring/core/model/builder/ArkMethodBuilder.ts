import { NodeA } from "../../base/Ast";
import { ArkParameterRef, ArkThisRef } from "../../base/Ref";
import { ArkAssignStmt, ArkReturnStmt } from "../../base/Stmt";
import { LineColPosition } from "../../base/Position";
import { Type, UnknownType } from "../../base/Type";
import { Value } from "../../base/Value";
import { BodyBuilder } from "../../common/BodyBuilder";
import { MethodInfo, MethodParameter } from "../../common/MethodInfoBuilder";
import { Cfg } from "../../graph/Cfg";
import { ViewTree } from "../../graph/ViewTree";
import { ArkBody } from "../ArkBody";
import { ArkClass } from "../ArkClass";
import { ArkFile } from "../ArkFile";
import { MethodSignature, MethodSubSignature } from "../ArkSignature";
import { Decorator } from "../../base/Decorator";
import { ArkMethod } from "../ArkMethod";
import ts from "typescript";
import { buildModifiers, buildParameters, buildReturnType, buildTypeParameters, handlePropertyAccessExpression } from "./builderUtils";
import Logger from "../../../utils/logger";

const logger = Logger.getLogger();

export const arkMethodNodeKind = ['MethodDeclaration', 'Constructor', 'FunctionDeclaration', 'GetAccessor',
    'SetAccessor', 'ArrowFunction', 'FunctionExpression', 'MethodSignature', 'ConstructSignature', 'CallSignature'];

export type MethodLikeNode =
    ts.FunctionDeclaration |
    ts.MethodDeclaration |
    ts.ConstructorDeclaration |
    ts.ArrowFunction |
    ts.AccessorDeclaration |
    ts.FunctionExpression |
    ts.MethodSignature |
    ts.ConstructSignatureDeclaration |
    ts.CallSignatureDeclaration;

export function buildDefaultArkMethodFromArkClass(declaringClass: ArkClass, mtd: ArkMethod) {
    mtd.setDeclaringArkClass(declaringClass);
    mtd.setDeclaringArkFile();
    mtd.setName("_DEFAULT_ARK_METHOD");
    mtd.genSignature();

    // TODO: build cfg for default method
}

export function buildArkMethodFromArkClass(methodNode: MethodLikeNode, declaringClass: ArkClass, mtd: ArkMethod, sourceFile: ts.SourceFile) {

    mtd.setDeclaringArkClass(declaringClass);
    mtd.setDeclaringArkFile();

    mtd.setCode(methodNode.getText(sourceFile));
    const { line, character } = ts.getLineAndCharacterOfPosition(
        sourceFile,
        methodNode.getStart(sourceFile)
    );
    mtd.setLine(line + 1);
    mtd.setColumn(character + 1);

    let methodName = buildMethodName(methodNode);
    mtd.setName(methodName);

    buildParameters(methodNode.parameters, sourceFile).forEach((parameter) => {
        mtd.addParameter(parameter);
    });

    //TODO: remember to test abstract method
    let modifiers: Set<string | Decorator> = new Set<string | Decorator>();
    if ((!ts.isConstructSignatureDeclaration(methodNode)) && (!ts.isCallSignatureDeclaration(methodNode))) {
        if (methodNode.modifiers) {
            modifiers = buildModifiers(methodNode.modifiers, sourceFile);
        }
    }

    if (methodNode.type) {
        mtd.setReturnType(buildReturnType(methodNode.type, sourceFile));
    }
    
    if (methodNode.typeParameters) {
        buildTypeParameters(methodNode.typeParameters).forEach((typeParameter) => {
            mtd.addTypeParameter(typeParameter);
        });
    }

    mtd.genSignature();

    let bodyBuilder = new BodyBuilder(mtd.getSignature(), methodNode, mtd, sourceFile);
    mtd.setBody(bodyBuilder.build());
    mtd.getCfg().setDeclaringMethod(mtd);
    if (mtd.getName() == 'constructor' && mtd.getDeclaringArkClass()) {
        mtd.getCfg().constructorAddInit(mtd);
    }
    if (mtd.getSubSignature().toString() == 'render()' && !mtd.containsModifier('StaticKeyword') && declaringClass.getSuperClassName() == 'View') {
        declaringClass.setViewTree(new ViewTree(mtd));
    }
}

export function buildNormalArkMethodFromMethodInfo(methodInfo: MethodInfo, mtd: ArkMethod) {
    mtd.setName(methodInfo.name);

    methodInfo.modifiers.forEach((modifier) => {
        mtd.addModifier(modifier);
    });
    methodInfo.parameters.forEach(methodParameter => {
        mtd.addParameter(methodParameter);
    });

    mtd.setReturnType(methodInfo.returnType);


    methodInfo.typeParameters.forEach((typeParameter) => {
        mtd.addTypeParameter(typeParameter);
    });
}

function buildMethodName(node: MethodLikeNode): string {
    //TODO: consider function without name
    let name: string = '';
    let getAccessorName: string | undefined = undefined;
    if (ts.isFunctionDeclaration(node)) {
        name = node.name ? node.name.text : '';
    }
    else if (ts.isMethodDeclaration(node) || ts.isMethodSignature(node)) {
        if (ts.isIdentifier(node.name)) {
            name = (node.name as ts.Identifier).text;
        }
        else if (ts.isComputedPropertyName(node.name)) {
            if (ts.isPropertyAccessExpression(node.name.expression)) {
                name = handlePropertyAccessExpression(node.name.expression);
            }
        }
        else {
            logger.warn("Other method declaration type found!");
        }
    }
    //TODO, hard code
    else if (ts.isConstructorDeclaration(node)) {
        name = 'constructor';
    }
    else if (ts.isConstructSignatureDeclaration(node)) {
        name = 'construct-signature';
    }
    else if (ts.isCallSignatureDeclaration(node)) {
        name = "call-signature";
    }
    else if (ts.isGetAccessor(node) && ts.isIdentifier(node.name)) {
        name = 'Get-' + node.name.text;
        getAccessorName = node.name.text;
    }
    else if (ts.isSetAccessor(node) && ts.isIdentifier(node.name)) {
        name = 'Set-' + node.name.text;
    }
    return name;
}