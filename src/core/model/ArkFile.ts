import fs from 'fs';
import path from 'path';
import { ArkClass } from "./ArkClass";
import { ArkMethod, arkMethodNodeKind } from "./ArkMethod";
import { NodeA, ASTree } from "../base/Ast";
import { ArkNamespace } from "./ArkNamespace";
import { ClassSignature, MethodSignature, methodSignatureCompare, classSignatureCompare } from "./ArkSignature";
import { ExportInfo } from '../common/ExportBuilder';
import { ImportInfo } from '../common/ImportBuilder';
import { Scene } from '../../Scene';

/**
 * 
 */
export class ArkFile {
    private name: string;
    private projectDir: string;
    private code: string;
    private ast: ASTree;
    private methods: ArkMethod[] = [];
    private classes: ArkClass[] = [];
    private defaultClass: ArkClass;
    private nameSpaces: ArkNamespace[] = [];
    private importInfos: ImportInfo[] = [];
    private exportInfos: ExportInfo[] = [];
    private scene: Scene;

    constructor() { }

    public setName(name: string) {
        this.name = name;
    }

    public getName() {
        return this.name;
    }

    public setScene(scene: Scene) {
        this.scene = scene;
    }

    public getScene() {
        return this.scene;
    }

    public setProjectDir(projectDir: string) {
        this.projectDir = projectDir;
    }

    public setCode(code: string) {
        this.code = code;
    }

    public getAst() {
        return this.ast;
    }

    private genAst() {
        this.ast = new ASTree(this.code);
    }

    //TODO: add signature check to update
    public addArkMethod(arkMethod: ArkMethod) {
        this.methods.push(arkMethod);
    }

    //TODO: update
    public updateClass(arkClass: ArkClass) {
        this.classes.push(arkClass);
        arkClass.getMethods().forEach((mtd) => {
            this.addArkMethod(mtd);
        });
    }

    public addArkClass(arkClass: ArkClass) {
        if (this.getClass(arkClass.getSignature())) {
            this.updateClass(arkClass);
        }
        else {
            this.classes.push(arkClass);
            arkClass.getMethods().forEach((mtd) => {
                this.addArkMethod(mtd);
            });
        }
    }

    public getDefaultClass() {
        return this.defaultClass;
    }

    public setDefaultClass(defaultClass: ArkClass) {
        this.defaultClass = defaultClass;
    }

    public genDefaultArkClass() {
        let defaultClass = new ArkClass();
        defaultClass.buildArkClassFromAstNode(this.ast.root, this);
        this.setDefaultClass(defaultClass);
        this.addArkClass(this.defaultClass);
    }

    public getNamespaces(): ArkNamespace[] {
        return this.nameSpaces;
    }

    public getClass(classSignature: ClassSignature): ArkClass | null {
        let cls = this.classes.find((obj) => {
            return classSignatureCompare(obj.getSignature(), classSignature);
        })
        if (cls) {
            return cls;
        }
        return null;
    }

    public getClasses(): ArkClass[] {
        return this.classes;
    }

    public getMethods(): ArkMethod[] {
        return this.methods;
    }

    //TODO: err handle
    public getMethod(methodSignature: MethodSignature): ArkMethod | null {
        if (methodSignature.getArkClass().getClassType()) {
            let arkCls = this.getClass(methodSignature.getArkClass());
            if (arkCls) {
                return arkCls.getMethod(methodSignature.getMethodSubSignature());
            }
            else {
                throw new Error('MethodSignature wrong. No ArkClass found.');
            }
        }
        else {
            let mtd = this.methods.find((obj) => {
                return methodSignatureCompare(obj.getSignature(), methodSignature);
            })
            if (mtd) {
                return mtd;
            }
        }
        return null;
    }

    public getImportInfos(): ImportInfo[] {
        return this.importInfos;
    }

    public addImportInfos(importInfo: ImportInfo) {
        this.importInfos.push(importInfo);
    }

    public getExportInfos(): ExportInfo[] {
        return this.exportInfos;
    }

    public addExportInfos(exportInfo: ExportInfo) {
        this.exportInfos.push(exportInfo);
    }

    public buildArkFileFromSourceFile(sourceFile: string, projectDir: string) {
        this.setName(path.relative(projectDir, sourceFile));
        this.setCode(fs.readFileSync(sourceFile, 'utf8'));
        this.setProjectDir(projectDir);
        this.genAst();
        this.genDefaultArkClass();
        this.buildArkFile();
    }

    private buildArkFile() {
        let children = this.ast.root?.children;
        for (let child of children) {
            //if (child.kind == 'NamespaceKeyword') {
            //    let ns: ArkNamespace = new ArkNamespace(child, this);
            //    this.nameSpaces.push(ns);
            //}

            if (child.kind == 'ClassDeclaration') {
                let cls: ArkClass = new ArkClass();
                cls.buildArkClassFromAstNode(child, this);
                this.addArkClass(cls);
                if (cls.isExported()) {
                    let exportClauseName: string = cls.getName();
                    let exportClauseType: string = "Class";
                    let exportInfo = new ExportInfo();
                    exportInfo.build(exportClauseName, exportClauseType);
                    this.exportInfos.push(exportInfo);
                }
            }
            if (arkMethodNodeKind.indexOf(child.kind) > -1) {
                let mthd: ArkMethod = new ArkMethod();
                mthd.buildArkMethodFromAstNode(child, this.defaultClass);
                this.defaultClass.addMethod(mthd);
                if (mthd.isExported()) {
                    let exportClauseName: string = mthd.getName();
                    let exportClauseType: string = "Method";
                    let exportInfo = new ExportInfo();
                    exportInfo.build(exportClauseName, exportClauseType);
                    this.exportInfos.push(exportInfo);
                }
            }
            if (child.kind == 'ImportDeclaration' || child.kind == 'ImportEqualsDeclaration') {
                //this.processImportDeclarationNode(child);
                child.importNodeInfo?.forEach((element) => {
                    this.importInfos.push(element);
                });
            }
            if (child.kind == 'ExportDeclaration' || child.kind == 'ExportAssignment') {
                //this.processExportDeclarationNode(child);
                child.exportNodeInfo?.forEach((element) => {
                    this.exportInfos.push(element);
                });
            }
            if (child.kind == 'VariableStatement' || child.kind == 'FirstStatement') {
                //check ExportKeyword
                let childSyntaxNode = this.findIndicatedChild(child, 'SyntaxList');
                if (childSyntaxNode) {
                    if (this.findIndicatedChild(childSyntaxNode, 'ExportKeyword')) {
                        this.processExportValAndFirstNode(child);
                    }
                }
            }
        }
    }

    private findIndicatedChild(node: NodeA, childType: string): NodeA | null {
        for (let child of node.children) {
            if (child.kind == childType) {
                return child;
            }
        }
        return null;
    }

    private processExportValAndFirstNode(node: NodeA): void {
        let exportClauseName: string = '';
        let exportClauseType: string = node.kind;
        let cld = this.findIndicatedChild(node, 'VariableDeclarationList');
        if (cld) {
            let c = this.findIndicatedChild(cld, 'SyntaxList');
            if (c) {
                let cc = this.findIndicatedChild(c, 'VariableDeclaration');
                if (cc) {
                    let ccc = this.findIndicatedChild(cc, 'Identifier');
                    if (ccc) {
                        exportClauseName = ccc.text;
                    }
                }
            }
        }
        let exportInfo = new ExportInfo();
        exportInfo.build(exportClauseName, exportClauseType);
        this.exportInfos.push(exportInfo);
    }
}