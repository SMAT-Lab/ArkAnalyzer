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
import { ArkInterface } from './ArkInterface';
import { transfer2UnixPath } from '../../utils/pathTransfer';

/**
 * 
 */
export class ArkFile {
    private name: string;
    private filePath: string;
    private projectDir: string;
    private code: string;
    private ast: ASTree;
    private methods: ArkMethod[] = [];
    private classes: ArkClass[] = [];
    private interfaces: ArkInterface[] = [];
    private defaultClass: ArkClass;
    private namespaces: ArkNamespace[] = [];
    private importInfos: ImportInfo[] = [];
    private exportInfos: ExportInfo[] = [];
    private scene: Scene;
    private arkInstancesMap: Map<string, any> = new Map<string, any>();
    private arkSignature: string;

    constructor() { }

    public buildArkFileFromSourceFile(sourceFile: string, projectDir: string) {
        this.filePath = sourceFile;
        this.projectDir = projectDir;
        this.setName(path.relative(projectDir, sourceFile));
        this.genArkSignature();
        this.setCode(fs.readFileSync(sourceFile, 'utf8'));
        this.genAst();
        this.genDefaultArkClass();
        this.buildArkFile();
    }

    private buildArkFile() {
        let children = this.ast.root?.children;
        for (let child of children) {
            if (child.kind == 'ModuleDeclaration') {
                let ns: ArkNamespace = new ArkNamespace();
                ns.setDeclaringArkFile(this);
                ns.setDeclaringSignature(this.arkSignature);
                ns.build(child, this);
                this.addNamespace(ns);
                this.addArkInstance(ns.getArkSignature(), ns);
                ns.getArkInstancesMap().forEach((value, key) => {
                    this.addArkInstance(key, value);
                });
                if (ns.isExported()) {
                    this.addExportInfo(ns);
                }
            }
            if (child.kind == 'InterfaceDeclaration') {
                let interFace: ArkInterface = new ArkInterface();
                interFace.setDeclaringArkFile(this);
                interFace.setDeclaringSignature(this.arkSignature);
                interFace.build(child, this);
                this.addInterface(interFace);
                this.addArkInstance(interFace.getArkSignature(), interFace);
                interFace.getArkInstancesMap().forEach((value, key) => {
                    this.addArkInstance(key, value);
                });
                if (interFace.isExported()) {
                    this.addExportInfo(interFace);
                }
            }
            if (child.kind == 'ClassDeclaration') {
                let cls: ArkClass = new ArkClass();
                cls.setDeclaringSignature(this.arkSignature);
                cls.buildArkClassFromAstNode(child, this);
                this.addArkClass(cls);
                this.addArkInstance(cls.getArkSignature(), cls);
                cls.getArkInstancesMap().forEach((value, key) => {
                    this.addArkInstance(key, value);
                });
                if (cls.isExported()) {
                    this.addExportInfo(cls);
                }
            }
            if (arkMethodNodeKind.indexOf(child.kind) > -1) {
                let mthd: ArkMethod = new ArkMethod();
                mthd.setDeclaringSignature(this.arkSignature);
                mthd.buildArkMethodFromAstNode(child, this.defaultClass);
                this.defaultClass.addMethod(mthd);
                this.addArkInstance(mthd.getArkSignature(), mthd);
                mthd.getArkInstancesMap().forEach((value, key) => {
                    this.addArkInstance(key, value);
                });
                if (mthd.isExported()) {
                    this.addExportInfo(mthd);
                }
            }
            if (child.kind == 'ImportDeclaration' || child.kind == 'ImportEqualsDeclaration') {
                //this.processImportDeclarationNode(child);
                //TODO: handle importFrom
                child.importNodeInfo?.forEach((element) => {
                    element.setDeclaringFilePath(this.filePath);
                    element.setProjectPath(this.projectDir);
                    element.setArkSignature(this.arkSignature);
                    this.importInfos.push(element);
                    this.addArkInstance(element.getArkSignature(), element);
                });
            }
            if (child.kind == 'ExportDeclaration' || child.kind == 'ExportAssignment') {
                //this.processExportDeclarationNode(child);
                child.exportNodeInfo?.forEach((element) => {
                    element.setArkSignature(this.arkSignature);
                    this.exportInfos.push(element);
                    this.addArkInstance(element.getArkSignature(), element);
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
            if (child.kind == 'EnumDeclaration') {
                //TODO
            }
        }
    }

    public addArkInstance(arkSignature: string, arkInstance: any) {
        this.arkInstancesMap.set(arkSignature, arkInstance);
    }

    public getArkInstancesMap() {
        return this.arkInstancesMap;
    }

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
        defaultClass.setDeclaringSignature(this.arkSignature);
        defaultClass.buildArkClassFromAstNode(this.ast.root, this);
        this.setDefaultClass(defaultClass);
        this.addArkClass(this.defaultClass);
    }

    public getNamespaces(): ArkNamespace[] {
        return this.namespaces;
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

    public getInterfaces(): ArkInterface[] {
        return this.interfaces;
    }

    public addInterface(interFace: ArkInterface) {
        this.interfaces.push(interFace);
    }

    public addNamespace(namespace: ArkNamespace) {
        this.namespaces.push(namespace);
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

    public getArkSignature() {
        return this.arkSignature;
    }

    public setArkSignature(arkSignature: string) {
        this.arkSignature = arkSignature;
    }

    public genArkSignature() {
        //let tmpSig = transfer2UnixPath(this.name).replace(/\//g, '.');
        let tmpSig = transfer2UnixPath(this.name);
        tmpSig = tmpSig.replace(/\.d\.ts|\.ts$/, '');
        this.arkSignature = `<${tmpSig}>`;
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
        exportInfo.setArkSignature(this.arkSignature);
        this.exportInfos.push(exportInfo);
        this.addArkInstance(exportInfo.getArkSignature(), exportInfo);
    }

    private addExportInfo(arkInstance: ArkMethod | ArkInterface | ArkClass | ArkNamespace) {
        let exportClauseName: string = arkInstance.getName();
        let exportClauseType: string;
        if (arkInstance instanceof ArkMethod) {
            exportClauseType = "Method";
        }
        else if (arkInstance instanceof ArkClass) {
            exportClauseType = "Class";
        }
        else if (arkInstance instanceof ArkInterface) {
            exportClauseType = "Interface";
        }
        else {
            exportClauseType = "ArkNamespace";
        }
        let exportInfo = new ExportInfo();
        exportInfo.build(exportClauseName, exportClauseType);
        exportInfo.setArkSignature(this.arkSignature);
        this.exportInfos.push(exportInfo);
        this.addArkInstance(exportInfo.getArkSignature(), exportInfo);
    }
}