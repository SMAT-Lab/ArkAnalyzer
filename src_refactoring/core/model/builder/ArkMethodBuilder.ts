import {Type} from "../../base/Type";
import {BodyBuilder} from "../../common/BodyBuilder";
import {ViewTree} from "../../graph/ViewTree";
import {ArkClass} from "../ArkClass";
import {Decorator} from "../../base/Decorator";
import {ArkMethod} from "../ArkMethod";
import ts from "typescript";
import {
    buildModifiers,
    buildParameters,
    buildReturnType,
    buildTypeParameters,
    handlePropertyAccessExpression
} from "./builderUtils";
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
    ts.CallSignatureDeclaration |
    ts.FunctionTypeNode;

export function buildDefaultArkMethodFromArkClass(declaringClass: ArkClass, mtd: ArkMethod,
                                                  sourceFile: ts.SourceFile, node?: ts.ModuleDeclaration) {
    mtd.setDeclaringArkClass(declaringClass);
    mtd.setDeclaringArkFile();
    mtd.setName("_DEFAULT_ARK_METHOD");
    mtd.genSignature();

    const defaultMethodNode = node ? node : sourceFile;

    let bodyBuilder = new BodyBuilder(mtd.getSignature(), defaultMethodNode, mtd, sourceFile);
    mtd.setBody(bodyBuilder.build());
    mtd.getCfg().setDeclaringMethod(mtd);
}

export function buildArkMethodFromArkClass(methodNode: MethodLikeNode, declaringClass: ArkClass, mtd: ArkMethod, sourceFile: ts.SourceFile) {

    mtd.setDeclaringArkClass(declaringClass);
    mtd.setDeclaringArkFile();

    mtd.setCode(methodNode.getText(sourceFile));
    const {line, character} = ts.getLineAndCharacterOfPosition(
        sourceFile,
        methodNode.getStart(sourceFile)
    );
    mtd.setLine(line + 1);
    mtd.setColumn(character + 1);

    if (mtd.getName() == undefined) {
        let methodName = buildMethodName(methodNode, declaringClass);
        mtd.setName(methodName);
    }


    buildParameters(methodNode.parameters, mtd, sourceFile).forEach((parameter) => {
        mtd.addParameter(parameter);
    });

    //TODO: remember to test abstract method
    let modifiers: Set<string | Decorator> = new Set<string | Decorator>();
    if (
        (!ts.isConstructSignatureDeclaration(methodNode)) &&
        (!ts.isCallSignatureDeclaration(methodNode)) &&
        (!ts.isFunctionTypeNode(methodNode))
    ) {
        if (methodNode.modifiers) {
            modifiers = buildModifiers(methodNode.modifiers, sourceFile);
        }
    }

    if (methodNode.type) {
        mtd.setReturnType(buildReturnType(methodNode.type, sourceFile, mtd));
    }

    if (methodNode.typeParameters) {
        buildTypeParameters(methodNode.typeParameters, sourceFile, mtd).forEach((typeParameter) => {
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
    if ((mtd.getSubSignature().toString() == 'render()' && !mtd.containsModifier('StaticKeyword') && declaringClass.getSuperClassName() == 'View')
        || (mtd.getSubSignature().toString() == 'initialRender()' && !mtd.containsModifier('StaticKeyword') && declaringClass.getSuperClassName() == 'ViewPU')) {
        declaringClass.setViewTree(new ViewTree(mtd));
    }
}

// export function buildNormalArkMethodFromMethodInfo(methodInfo: MethodInfo, mtd: ArkMethod) {
//     mtd.setName(methodInfo.name);

//     methodInfo.modifiers.forEach((modifier) => {
//         mtd.addModifier(modifier);
//     });
//     methodInfo.parameters.forEach(methodParameter => {
//         mtd.addParameter(methodParameter);
//     });

//     mtd.setReturnType(methodInfo.returnType);


//     methodInfo.typeParameters.forEach((typeParameter) => {
//         mtd.addTypeParameter(typeParameter);
//     });
// }

function buildMethodName(node: MethodLikeNode, declaringClass: ArkClass): string {
    let name: string = '';
    let getAccessorName: string | undefined = undefined;
    if (ts.isFunctionDeclaration(node)) {
        if (node.name) {
            name = node.name.text;
        }
    } else if (ts.isFunctionTypeNode(node)) {

    } else if (ts.isMethodDeclaration(node) || ts.isMethodSignature(node)) {
        if (ts.isIdentifier(node.name)) {
            name = (node.name as ts.Identifier).text;
        } else if (ts.isComputedPropertyName(node.name)) {
            if (ts.isPropertyAccessExpression(node.name.expression)) {
                name = handlePropertyAccessExpression(node.name.expression);
            }
        } else {
            logger.warn("Other method declaration type found!");
        }
    }
    //TODO, hard code
    else if (ts.isConstructorDeclaration(node)) {
        name = 'constructor';
    } else if (ts.isConstructSignatureDeclaration(node)) {
        name = 'construct-signature';
    } else if (ts.isCallSignatureDeclaration(node)) {
        name = "call-signature";
    } else if (ts.isGetAccessor(node) && ts.isIdentifier(node.name)) {
        name = 'Get-' + node.name.text;
        getAccessorName = node.name.text;
    } else if (ts.isSetAccessor(node) && ts.isIdentifier(node.name)) {
        name = 'Set-' + node.name.text;
    } else if (ts.isArrowFunction(node)) {
        //TODO
    }
    return name;
}

export class ObjectBindingPatternParameter {
    private propertyName: string = "";
    private name: string = "";
    private optional: boolean = false;
    private initializer: string = "";

    constructor() {
    }

    public getName() {
        return this.name;
    }

    public setName(name: string) {
        this.name = name;
    }

    public getPropertyName() {
        return this.propertyName;
    }

    public setPropertyName(propertyName: string) {
        this.propertyName = propertyName;
    }

    public isOptional() {
        return this.optional;
    }

    public setOptional(optional: boolean) {
        this.optional = optional;
    }
}

export class ArrayBindingPatternParameter {
    private propertyName: string = "";
    private name: string = "";
    private optional: boolean = false;
    private initializer: string = "";

    constructor() {
    }

    public getName() {
        return this.name;
    }

    public setName(name: string) {
        this.name = name;
    }

    public getPropertyName() {
        return this.propertyName;
    }

    public setPropertyName(propertyName: string) {
        this.propertyName = propertyName;
    }

    public isOptional() {
        return this.optional;
    }

    public setOptional(optional: boolean) {
        this.optional = optional;
    }
}

export class MethodParameter {
    private name: string = "";
    private type: Type;
    private optional: boolean = false;
    private objElements: ObjectBindingPatternParameter[] = [];
    private arrayElements: ArrayBindingPatternParameter[] = [];

    constructor() {
    }

    public getName() {
        return this.name;
    }

    public setName(name: string) {
        this.name = name;
    }

    public getType() {
        return this.type;
    }

    public setType(type: Type) {
        this.type = type;
    }

    public isOptional() {
        return this.optional;
    }

    public setOptional(optional: boolean) {
        this.optional = optional;
    }

    public addObjElement(element: ObjectBindingPatternParameter) {
        this.objElements.push(element);
    }

    public getObjElements() {
        return this.objElements;
    }

    public setObjElements(objElements: ObjectBindingPatternParameter[]) {
        this.objElements = objElements;
    }

    public addArrayElement(element: ArrayBindingPatternParameter) {
        this.arrayElements.push(element);
    }

    public getArrayElements() {
        return this.arrayElements;
    }

    public setArrayElements(arrayElements: ArrayBindingPatternParameter[]) {
        this.arrayElements = arrayElements;
    }
}