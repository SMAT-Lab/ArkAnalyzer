import { NodeA } from "../base/Ast";
import { ArkParameterRef, ArkThisRef } from "../base/Ref";
import { ArkAssignStmt, ArkReturnStmt } from "../base/Stmt";
import { LineColPosition } from "../base/Position";
import { Type, UnknownType } from "../base/Type";
import { Value } from "../base/Value";
import { BodyBuilder } from "../common/BodyBuilder";
import { MethodInfo, MethodParameter } from "../common/MethodInfoBuilder";
import { Cfg } from "../graph/Cfg";
import { ViewTree } from "../graph/ViewTree";
import { ArkBody } from "./ArkBody";
import { ArkClass } from "./ArkClass";
import { ArkFile } from "./ArkFile";
import { MethodSignature, MethodSubSignature } from "./ArkSignature";
import { Decorator } from "../base/Decorator";

export const arkMethodNodeKind = ['MethodDeclaration', 'Constructor', 'FunctionDeclaration', 'GetAccessor',
    'SetAccessor', 'ArrowFunction', 'FunctionExpression', 'MethodSignature', 'ConstructSignature', 'CallSignature'];

export class ArkMethod {
    private name: string;
    private code: string;
    private line: number = -1;
    private column: number = -1;

    private etsPosition: LineColPosition;

    private declaringArkFile: ArkFile;
    private declaringArkClass: ArkClass;

    private returnType: Type = UnknownType.getInstance();
    private parameters: MethodParameter[] = [];
    private modifiers: Set<string | Decorator> = new Set<string | Decorator>();
    private typeParameters: Type[] = [];

    private methodSignature: MethodSignature;
    private methodSubSignature: MethodSubSignature;

    private body: ArkBody;
    private loadStateDecorators: boolean = false;
    private viewTree: ViewTree;

    constructor() {
    }

    public getName() {
        return this.name;
    }

    public setName(name: string) {
        this.name = name;
    }

    public getCode() {
        return this.code;
    }

    public setCode(code: string) {
        this.code = code;
    }

    public getLine() {
        return this.line;
    }

    public setLine(line: number) {
        this.line = line;
    }

    public getColumn() {
        return this.column;
    }

    public setColumn(column: number) {
        this.column = column;
    }

    public setEtsPositionInfo(position: LineColPosition) {
        this.etsPosition = position;
    }

    public async getEtsPositionInfo(): Promise<LineColPosition> {
        if (!this.etsPosition) {
            let arkFile = this.declaringArkFile;
            const etsPosition = await arkFile.getEtsOriginalPositionFor(new LineColPosition(this.line, this.column));
            this.setEtsPositionInfo(etsPosition);
        }
        return this.etsPosition;
    }

    public getDeclaringArkClass() {
        return this.declaringArkClass;
    }

    public setDeclaringArkClass(declaringArkClass: ArkClass) {
        this.declaringArkClass = declaringArkClass;
    }

    public getDeclaringArkFile() {
        return this.declaringArkFile;
    }

    public setDeclaringArkFile() {
        this.declaringArkFile = this.getDeclaringArkClass().getDeclaringArkFile();
    }

    public isExported(): boolean {
        return this.modifiers.has('ExportKeyword');
    }

    public isDefaultArkMethod(): boolean {
        return this.getName() === "_DEFAULT_ARK_METHOD";
    }

    public getParameters() {
        return this.parameters;
    }

    public addParameter(methodParameter: MethodParameter) {
        this.parameters.push(methodParameter);
    }

    public getReturnType() {
        return this.returnType;
    }

    public setReturnType(type: Type) {
        this.returnType = type;
        if (this.methodSubSignature) {
            this.methodSubSignature.setReturnType(type);
        }
    }

    public getSignature() {
        return this.methodSignature;
    }

    public setSignature(methodSignature: MethodSignature) {
        this.methodSignature = methodSignature;
    }

    public getSubSignature() {
        return this.methodSubSignature;
    }

    public setSubSignature(methodSubSignature: MethodSubSignature) {
        this.methodSubSignature = methodSubSignature;
    }

    public genSignature() {
        let mtdSubSig = new MethodSubSignature();
        mtdSubSig.setMethodName(this.name);
        mtdSubSig.setParameters(this.parameters);
        mtdSubSig.setReturnType(this.returnType);
        this.setSubSignature(mtdSubSig);

        let mtdSig = new MethodSignature();
        mtdSig.setDeclaringClassSignature(this.declaringArkClass.getSignature());
        mtdSig.setMethodSubSignature(mtdSubSig);
        this.setSignature(mtdSig);
    }

    public getModifiers() {
        return this.modifiers;
    }

    public addModifier(name: string | Decorator) {
        this.modifiers.add(name);
    }

    public getTypeParameter() {
        return this.typeParameters;
    }

    public addTypeParameter(typeParameter: Type) {
        this.typeParameters.push(typeParameter);
    }

    public containsModifier(name: string) {
        return this.modifiers.has(name);
    }

    public getBody() {
        return this.body;
    }

    public setBody(body: ArkBody) {
        this.body = body;
    }

    public getCfg(): Cfg {
        return this.body.getCfg();
    }

    public getOriginalCfg() {
        return this.body.getOriginalCfg();
    }

    public getParameterInstances(): Value[] {
        // 获取方法体中参数Local实例
        let stmts = this.getCfg().getStmts()
        let results: Value[] = []
        for (let stmt of stmts) {
            if (stmt instanceof ArkAssignStmt) {
                if (stmt.getRightOp() instanceof ArkParameterRef) {
                    results.push((stmt as ArkAssignStmt).getLeftOp())
                }
            }
            if (results.length == this.getParameters().length) {
                return results
            }
        }
        return results
    }

    public getThisInstance(): Value | null {
        // 获取方法体中This实例
        let stmts = this.getCfg().getStmts()
        let results: Value[] = []
        for (let stmt of stmts) {
            if (stmt instanceof ArkAssignStmt) {
                if (stmt.getRightOp() instanceof ArkThisRef) {
                    return stmt.getLeftOp()
                }
            }
        }
        return null
    }

    public getReturnValues(): Value[] {
        // 获取方法体中return值实例
        let resultValues: Value[] = []
        let stmts = this.getCfg().getStmts()
        for (let stmt of stmts) {
            if (stmt instanceof ArkReturnStmt) {
                resultValues.push(stmt.getOp())
            }
        }
        return resultValues
    }

    public async getDecorators(): Promise<Decorator[]> {
        await this.loadStateDecoratorFromEts();

        return Array.from(this.modifiers).filter((item) => {
            return item instanceof Decorator;
        }) as Decorator[];
    }

    public async hasBuilderDecorator(): Promise<boolean> {
        let decorators = await this.getDecorators();
        return decorators.filter((value) => {
            return value.getKind() == 'Builder';
        }).length != 0;
    }

    private async loadStateDecoratorFromEts() {
        if (this.loadStateDecorators) {
            return;
        }

        let position = await this.getEtsPositionInfo();
        let content = await this.getDeclaringArkFile().getEtsSource(position.getLineNo() + 1);
        let regex = new RegExp(`@([\\w]*)[export|default|function|public|static|private|async\\s]*${this.getName()}`, 'gi');
        let match = regex.exec(content);
        if (match) {
            let decorator = new Decorator(match[1]);
            decorator.setContent(match[1]);
            this.addModifier(decorator);
        }
        this.loadStateDecorators = true;
    }

    public async getViewTree(): Promise<ViewTree> {
        if (await this.hasViewTree()) {
            if (!this.viewTree) {
                this.viewTree = new ViewTree(this);
            }
            if (!this.viewTree.isInitialized()) {
                await this.viewTree.buildViewTree();
            }
        }
        return this.viewTree;
    }

    public async hasViewTree(): Promise<boolean> {
        return await this.hasBuilderDecorator();
    }
}

export function buildArkMethodFromArkClass(methodNode: NodeA, declaringClass: ArkClass, mtd: ArkMethod) {

    mtd.setDeclaringArkClass(declaringClass);
    mtd.setDeclaringArkFile();

    if (arkMethodNodeKind.indexOf(methodNode.kind) > -1) {
        buildNormalArkMethodFromAstNode(methodNode, mtd);
    } else {
        mtd.setName("_DEFAULT_ARK_METHOD");
    }
    mtd.genSignature();
    if (methodNode.kind != "SyntaxList") {
        methodNode = methodNode.children[methodNode.children.length - 1].children[1];
    }
    let bodyBuilder = new BodyBuilder(mtd.getSignature(), methodNode, mtd);
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

export function buildNormalArkMethodFromAstNode(methodNode: NodeA, mtd: ArkMethod) {
    mtd.setCode(methodNode.text);
    mtd.setLine(methodNode.line + 1);
    mtd.setColumn(methodNode.character + 1);

    if (!methodNode.methodNodeInfo) {
        throw new Error('Error: There is no methodNodeInfo for this method!');
    }
    mtd.setName(methodNode.methodNodeInfo.name);

    methodNode.methodNodeInfo.modifiers.forEach((modifier) => {
        mtd.addModifier(modifier);
    });
    methodNode.methodNodeInfo.parameters.forEach(methodParameter => {
        mtd.addParameter(methodParameter);
    });

    mtd.setReturnType(methodNode.methodNodeInfo.returnType);


    methodNode.methodNodeInfo.typeParameters.forEach((typeParameter) => {
        mtd.addTypeParameter(typeParameter);
    });
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