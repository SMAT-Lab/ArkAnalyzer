import { ArkClass } from "./ArkClass";
import { ArkMethod, arkMethodNodeKind } from "./ArkMethod";
import { NodeA, ASTree } from "../base/Ast";
import { ArkInterface } from "./ArkInterface";
import { ArkFile } from "./ArkFile";
import { ExportInfo } from "../common/ExportBuilder";
import { ClassSignature, classSignatureCompare } from "./ArkSignature";


export class ArkNamespace {
    private name: string;
    private code: string
    private modifiers: Set<string> = new Set<string>();
    private memberMethods: ArkMethod[] = [];
    private memberClasses: ArkClass[] = [];
    private memberInterafaces: ArkInterface[] = [];
    private declaringArkFile: ArkFile;
    private declaringArkNamespace: ArkNamespace;
    private declaringInstance: ArkFile | ArkNamespace;
    private declaringType: string;
    private exportInfos: ExportInfo[] = [];
    //private memberNamespaces: ArkNamespace[] = [];
    private namespaces: ArkNamespace[] = [];
    private arkSignature: string;
    private arkInstancesMap: Map<string, any> = new Map<string, any>();
    private declaringSignature: string;

    constructor() { }

    public build(nsNode: NodeA, declaringInstance: ArkFile | ArkNamespace) {
        if (!nsNode.namespaceNodeInfo) {
            throw new Error('Error: There is no namespaceNodeInfo for this interface!');
        }

        this.setName(nsNode.namespaceNodeInfo.getName());
        if (declaringInstance instanceof ArkFile) {
            this.setDeclaringType("ArkFile");
        }
        else {
            this.setDeclaringType("ArkNamespace");
        }
        this.setDeclaringInstance(declaringInstance);
        this.genArkSignature();
        nsNode.namespaceNodeInfo.getModifiers().forEach((modifier) => {
            this.addModifier(modifier);
        });
        this.code = nsNode.text;

        let tmpNode = this.findIndicatedChild(nsNode, "ModuleBlock");
        if (tmpNode) {
            tmpNode = this.findIndicatedChild(tmpNode, "SyntaxList");
        }
        if (tmpNode) {
            this.buildNamespaceMembers(tmpNode);
        }
    }

    // TODO: check and update
    private buildNamespaceMembers(nsNode: NodeA) {
        for (let child of nsNode.children) {
            if (child.kind == 'ModuleDeclaration') {
                let ns: ArkNamespace = new ArkNamespace();
                ns.setDeclaringArkFile(this.declaringArkFile);
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
                interFace.setDeclaringArkFile(this.declaringArkFile);
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
                cls.buildArkClassFromAstNode(child, this.declaringArkFile);
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
                let defaultClass = this.declaringArkFile.getDefaultClass();
                mthd.buildArkMethodFromAstNode(child, defaultClass);
                defaultClass.addMethod(mthd);
                this.addArkInstance(mthd.getArkSignature(), mthd);
                mthd.getArkInstancesMap().forEach((value, key) => {
                    this.addArkInstance(key, value);
                });
                if (mthd.isExported()) {
                    this.addExportInfo(mthd);
                }
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

    public addNamespace(namespace: ArkNamespace) {
        this.namespaces.push(namespace);
    }

    public setDeclaringSignature(declaringSignature: string) {
        this.declaringSignature = declaringSignature;
    }

    public getArkSignature() {
        return this.arkSignature;
    }

    public setArkSignature(arkSignature: string) {
        this.arkSignature = arkSignature;
    }

    public genArkSignature() {
        this.arkSignature = this.declaringSignature + '.' + this.name;
    }

    public getArkInstancesMap() {
        return this.arkInstancesMap;
    }

    public getName() {
        return this.name;
    }

    public setName(name: string) {
        this.name = name;
    }

    public setDeclaringType(declaringType: string) {
        this.declaringType = declaringType;
    }

    public getDeclaringType() {
        return this.declaringType;
    }

    public getDeclaringInstance() {
        return this.declaringInstance;
    }

    public setDeclaringInstance(declaringInstance: ArkFile | ArkNamespace) {
        this.declaringInstance = declaringInstance;
    }

    public getDeclaringArkFile() {
        return this.declaringArkFile;
    }

    public setDeclaringArkFile(declaringArkFile: ArkFile) {
        this.declaringArkFile = declaringArkFile;
    }

    public getDeclaringArkNamespace() {
        return this.declaringArkNamespace;
    }

    public setDeclaringArkNamespace(declaringArkNamespace: ArkNamespace) {
        this.declaringArkNamespace = declaringArkNamespace;
    }

    public getModifiers() {
        return this.modifiers;
    }

    public addModifier(name: string) {
        this.modifiers.add(name);
    }

    public containsModifier(name: string) {
        return this.modifiers.has(name);
    }

    public addArkMethod(arkMethod: ArkMethod) {
        this.memberMethods.push(arkMethod);
    }

    public getClass(classSignature: string): ArkClass | null {
        let cls = this.memberClasses.find((obj) => {
            return (obj.getArkSignature() == classSignature);
        })
        if (cls) {
            return cls;
        }
        return null;
    }

    public updateClass(arkClass: ArkClass) {
        this.memberClasses.push(arkClass);
        arkClass.getMethods().forEach((mtd) => {
            this.addArkMethod(mtd);
        });
    }

    public addArkClass(arkClass: ArkClass) {
        if (this.getClass(arkClass.getArkSignature())) {
            this.updateClass(arkClass);
        }
        else {
            this.memberClasses.push(arkClass);
            arkClass.getMethods().forEach((mtd) => {
                this.addArkMethod(mtd);
            });
        }
    }

    public getClasses(): ArkClass[] {
        return this.memberClasses;
    }

    public getMethods(): ArkMethod[] {
        return this.memberMethods;
    }

    public isExported(): boolean {
        return this.containsModifier('ExportKeyword');
    }

    public getInterfaces(): ArkInterface[] {
        return this.memberInterafaces;
    }

    public addInterface(interFace: ArkInterface) {
        this.memberInterafaces.push(interFace);
    }

    public getExportInfos(): ExportInfo[] {
        return this.exportInfos;
    }

    public addExportInfos(exportInfo: ExportInfo) {
        this.exportInfos.push(exportInfo);
    }

    public addArkInstance(arkSignature: string, arkInstance: any) {
        this.arkInstancesMap.set(arkSignature, arkInstance);
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