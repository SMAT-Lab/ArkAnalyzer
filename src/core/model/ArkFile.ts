import fs from 'fs';
import path from 'path';
import { Scene } from '../../Scene';
import { ASTree, NodeA } from "../base/Ast";
import { ExportInfo } from '../common/ExportBuilder';
import { ImportInfo } from '../common/ImportBuilder';
import { ArkClass, buildDefaultArkClassFromArkFile, buildNormalArkClassFromArkFile } from "./ArkClass";
import { ArkEnum } from './ArkEnum';
import { ArkInterface } from './ArkInterface';
import { ArkMethod, arkMethodNodeKind, buildArkMethodFromArkClass } from "./ArkMethod";
import { ArkNamespace, buildArkNamespace } from "./ArkNamespace";
import { ClassSignature, FileSignature, MethodSignature, NamespaceSignature, classSignatureCompare, methodSignatureCompare } from "./ArkSignature";

/**
 * 
 */
export class ArkFile {

    private name: string; //name also means the relative path
    private absoluteFilePath: string;
    private projectDir: string;
    private projectName: string = "";
    private code: string;

    private ast: ASTree;

    private defaultClass: ArkClass;

    private namespaces: ArkNamespace[] = [];
    private classes: ArkClass[] = [];
    //private methods: ArkMethod[] = [];

    private importInfos: ImportInfo[] = [];
    private exportInfos: ExportInfo[] = [];

    private scene: Scene;

    /* // Deprecated
    private arkInstancesMap: Map<string, any> = new Map<string, any>();
    private arkSignature: string; */

    private fileSignature: FileSignature;

    constructor() { }

    /* // Deprecated
    public addArkInstance(arkSignature: string, arkInstance: any) {
        this.arkInstancesMap.set(arkSignature, arkInstance);
    }

    public getArkInstancesMap() {
        return this.arkInstancesMap;
    } */

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

    public getProjectDir(): string {
        return this.projectDir;
    }

    public getFilePath(): string {
        return this.absoluteFilePath;
    }

    public setFilePath(absoluteFilePath: string) {
        this.absoluteFilePath = absoluteFilePath;
    }

    public setCode(code: string) {
        this.code = code;
    }

    public getCode() {
        return this.code;
    }

    public getAst() {
        return this.ast;
    }

    public genAst() {
        this.ast = new ASTree(this.code);
    }

    /* public addArkMethod(arkMethod: ArkMethod) {
        for (let i = 0; i < this.methods.length; i++) {
            // check whether exits this method
            if (this.methods[i].getSignature().toString() == arkMethod.getSignature().toString()) {
                this.methods.slice(i, 1);
            }
        }
        this.methods.push(arkMethod);
    } */

    public updateClass(arkClass: ArkClass) {
        for (let i = 0; i < this.classes.length; i++) {
            if (this.classes[i].getSignature().toString() == arkClass.getSignature().toString()) {
                this.classes.splice(i, 1);
            }
        }
        this.classes.push(arkClass);
        // arkClass.getMethods().forEach((mtd) => {
        //     this.addArkMethod(mtd);
        // });
    }

    public addArkClass(arkClass: ArkClass) {
        if (this.getClass(arkClass.getSignature())) {
            this.updateClass(arkClass);
        }
        else {
            this.classes.push(arkClass);
            // arkClass.getMethods().forEach((mtd) => {
            //     this.addArkMethod(mtd);
            // });
        }
    }

    public getDefaultClass() {
        return this.defaultClass;
    }

    public setDefaultClass(defaultClass: ArkClass) {
        this.defaultClass = defaultClass;
    }

    public getNamespace(namespaceSignature: NamespaceSignature): ArkNamespace | null {
        const foundNamespace = this.namespaces.find(ns => ns.getNamespaceSignature().toString() == namespaceSignature.toString());
        return foundNamespace || null;
    }

    public getNamespaceAllTheFile(namespaceSignature: NamespaceSignature): ArkNamespace | null {
        let declaringNamespaceSignature = namespaceSignature.getDeclaringNamespaceSignature();
        if (!declaringNamespaceSignature) {
            this.namespaces.forEach((ns) => {
                if (ns.getNamespaceSignature().toString() == namespaceSignature.toString()) {
                    return ns;
                }
            });
            return null;
        }
        else {
            let declaringNamespace = this.getNamespaceAllTheFile(declaringNamespaceSignature);
            if (declaringNamespace) {
                return declaringNamespace.getNamespace(namespaceSignature);
            }
            return null;
        }
    }

    public getNamespaces(): ArkNamespace[] {
        return this.namespaces;
    }

    public getClass(classSignature: ClassSignature): ArkClass | null {
        const foundClass = this.classes.find(cls => cls.getSignature().toString() == classSignature.toString());
        return foundClass || null;
    }

    public getClasses(): ArkClass[] {
        return this.classes;
    }

    public addNamespace(namespace: ArkNamespace) {
        // this.classes.push(...namespace.getClasses());
        // this.methods.push(...namespace.getMethods());
        this.namespaces.push(namespace);
    }

    public getMethodAllTheFile(methodSignature: MethodSignature): ArkMethod | null {
        let namespaceSig = methodSignature.getDeclaringClassSignature().getDeclaringNamespaceSignature();
        if (namespaceSig != null) {
            let namespace = this.getNamespaceAllTheFile(namespaceSig);
            if (namespace) {
                return namespace.getMethodAllTheNamespace(methodSignature);
            }
            return null;
        }
        else {
            let classSig = methodSignature.getDeclaringClassSignature();
            let cls = this.getClass(classSig);
            if (cls) {
                return cls.getMethod(methodSignature);
            }
            return null;
        }
    }

    // Deprecated
    /* public getMethods(): ArkMethod[] {
        return this.methods;
    } */

    //TODO: err handle
    // Deprecated
    /* public getMethod(methodSignature: MethodSignature): ArkMethod | null {
        if (methodSignature.getDeclaringClassSignature().getClassName()) {
            let arkCls = this.getClass(methodSignature.getDeclaringClassSignature());
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
    } */

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

    /* // Deprecated
    public getArkSignature() {
        return this.arkSignature;
    }

    public setArkSignature(arkSignature: string) {
        this.arkSignature = arkSignature;
    } */

    public setProjectName(projectName: string) {
        this.projectName = projectName;
    }

    public getProjectName() {
        return this.projectName;
    }

    /* // Deprecated
    public genArkSignature() {
        //let tmpSig = transfer2UnixPath(this.name).replace(/\//g, '.');
        let tmpSig = transfer2UnixPath(this.name);
        tmpSig = tmpSig.replace(/\.d\.ts|\.ts$/, '');
        //tmpSig = tmpSig.replace(/\.ts$/, '');
        this.arkSignature = `<${tmpSig}>`;
    } */

    public genFileSignature() {
        let fileSignature = new FileSignature();
        fileSignature.setFileName(this.name);
        fileSignature.setProjectName(this.projectName);
        this.fileSignature = fileSignature;
    }

    public getFileSignature() {
        return this.fileSignature;
    }

}

export function buildArkFileFromFile(absoluteFilePath: string, projectDir: string, arkFile: ArkFile) {
    arkFile.setFilePath(absoluteFilePath);
    arkFile.setProjectDir(projectDir);
    arkFile.setName(path.relative(projectDir, absoluteFilePath));


    /* // Deprecated
    arkFile.genArkSignature(); */

    arkFile.genFileSignature();

    arkFile.setCode(fs.readFileSync(absoluteFilePath, 'utf8'));
    arkFile.genAst();

    genDefaultArkClass(arkFile);
    buildArkFile(arkFile);
}

function buildArkFile(arkFile: ArkFile) {
    let children = arkFile.getAst().root?.children;
    for (let child of children) {
        if (child.kind == 'ModuleDeclaration') {
            let ns: ArkNamespace = new ArkNamespace();
            ns.setDeclaringArkFile(arkFile);
            /* // Deprecated
            ns.setDeclaringSignature(arkFile.getArkSignature()); */

            buildArkNamespace(child, arkFile, ns);
            arkFile.addNamespace(ns);

            /* // Deprecated
            arkFile.addArkInstance(ns.getArkSignature(), ns);
            ns.getArkInstancesMap().forEach((value, key) => {
                arkFile.addArkInstance(key, value);
            }); */

            if (ns.isExported()) {
                addExportInfo(ns, arkFile);
            }
        }
        if (child.kind == 'ClassDeclaration' || child.kind == 'InterfaceDeclaration' || child.kind == 'EnumDeclaration') {
            let cls: ArkClass = new ArkClass();

            /* // Deprecated
            cls.setDeclaringSignature(arkFile.getArkSignature()); */

            buildNormalArkClassFromArkFile(child, arkFile, cls);
            arkFile.addArkClass(cls);

            /* // Deprecated
            arkFile.addArkInstance(cls.getArkSignature(), cls);
            cls.getArkInstancesMap().forEach((value, key) => {
                arkFile.addArkInstance(key, value);
            }); */

            if (cls.isExported()) {
                addExportInfo(cls, arkFile);
            }
        }
        if (arkMethodNodeKind.indexOf(child.kind) > -1) {
            let mthd: ArkMethod = new ArkMethod();

            /* // Deprecated
            mthd.setDeclaringSignature(arkFile.getArkSignature()); */

            buildArkMethodFromArkClass(child, arkFile.getDefaultClass(), mthd);
            arkFile.getDefaultClass().addMethod(mthd);
            // arkFile.addArkMethod(mthd);

            /* // Deprecated
            arkFile.addArkInstance(mthd.getArkSignature(), mthd);
            mthd.getArkInstancesMap().forEach((value, key) => {
                arkFile.addArkInstance(key, value);
            }); */

            if (mthd.isExported()) {
                addExportInfo(mthd, arkFile);
            }
        }
        if (child.kind == 'ImportDeclaration' || child.kind == 'ImportEqualsDeclaration') {
            //this.processImportDeclarationNode(child);
            child.importNodeInfo?.forEach((element) => {
                element.setDeclaringFilePath(arkFile.getFilePath());
                element.setProjectPath(arkFile.getProjectDir());
                element.setDeclaringArkFile(arkFile);

                /* // Deprecated
                element.setArkSignature(arkFile.getArkSignature()); */

                element.setImportFromSignature();
                arkFile.addImportInfos(element);

                /* // Deprecated
                arkFile.addArkInstance(element.getArkSignature(), element); */
            });
        }
        if (child.kind == 'ExportDeclaration' || child.kind == 'ExportAssignment') {
            //this.processExportDeclarationNode(child);
            child.exportNodeInfo?.forEach((element) => {

                /* // Deprecated
                element.setArkSignature(arkFile.getArkSignature()); */

                arkFile.addExportInfos(element);

                /* // Deprecated
                arkFile.addArkInstance(element.getArkSignature(), element); */
            });
        }
        if (child.kind == 'VariableStatement' || child.kind == 'FirstStatement') {
            //check ExportKeyword
            let childSyntaxNode = findIndicatedChild(child, 'SyntaxList');
            if (childSyntaxNode) {
                if (findIndicatedChild(childSyntaxNode, 'ExportKeyword')) {
                    processExportValAndFirstNode(child, arkFile);
                }
            }
        }
    }
}

function genDefaultArkClass(arkFile: ArkFile) {
    let defaultClass = new ArkClass();

    /* // Deprecated
    defaultClass.setDeclaringSignature(arkFile.getArkSignature()); */

    buildDefaultArkClassFromArkFile(arkFile.getAst().root, arkFile, defaultClass);
    arkFile.setDefaultClass(defaultClass);
    arkFile.addArkClass(defaultClass);
}

function findIndicatedChild(node: NodeA, childType: string): NodeA | null {
    for (let child of node.children) {
        if (child.kind == childType) {
            return child;
        }
    }
    return null;
}

function processExportValAndFirstNode(node: NodeA, arkFile: ArkFile): void {
    let exportClauseName: string = '';
    let exportClauseType: string = node.kind;
    let cld = findIndicatedChild(node, 'VariableDeclarationList');
    if (cld) {
        let c = findIndicatedChild(cld, 'SyntaxList');
        if (c) {
            let cc = findIndicatedChild(c, 'VariableDeclaration');
            if (cc) {
                let ccc = findIndicatedChild(cc, 'Identifier');
                if (ccc) {
                    exportClauseName = ccc.text;
                }
            }
        }
    }
    let exportInfo = new ExportInfo();
    exportInfo.build(exportClauseName, exportClauseType);

    /* // Deprecated
    exportInfo.setArkSignature(arkFile.getArkSignature()); */

    arkFile.addExportInfos(exportInfo);

    /* // Deprecated
    arkFile.addArkInstance(exportInfo.getArkSignature(), exportInfo); */
}

function addExportInfo(arkInstance: ArkMethod | ArkInterface | ArkClass | ArkNamespace |
    ArkEnum, arkFile: ArkFile) {
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
    //exportInfo.setArkSignature(this.arkSignature);
    arkFile.addExportInfos(exportInfo);
    // this.addArkInstance(exportInfo.getArkSignature(), exportInfo);
}