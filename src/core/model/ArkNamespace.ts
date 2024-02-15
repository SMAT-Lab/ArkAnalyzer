import { NodeA } from "../base/Ast";
import { ExportInfo } from "../common/ExportBuilder";
import { ArkClass, buildDefaultArkClassFromArkNamespace, buildNormalArkClassFromArkNamespace } from "./ArkClass";
import { ArkEnum } from "./ArkEnum";
import { ArkFile } from "./ArkFile";
import { ArkInterface } from "./ArkInterface";
import { ArkMethod, arkMethodNodeKind, buildArkMethodFromArkClass } from "./ArkMethod";
import { NamespaceSignature } from "./ArkSignature";


export class ArkNamespace {
    private name: string;
    private code: string

    private declaringArkFile: ArkFile;
    private declaringArkNamespace: ArkNamespace | null = null;

    private declaringInstance: ArkFile | ArkNamespace;
    private declaringType: string;

    private modifiers: Set<string> = new Set<string>();
    private exportInfos: ExportInfo[] = [];

    private defaultClass: ArkClass;

    private namespaces: ArkNamespace[] = [];
    private classes: ArkClass[] = [];
    private methods: ArkMethod[] = [];

    private arkSignature: string;
    private arkInstancesMap: Map<string, any> = new Map<string, any>();
    private declaringSignature: string;

    private namespaceSignature: NamespaceSignature;

    constructor() { }

    public addNamespace(namespace: ArkNamespace) {
        this.classes.push(...namespace.getClasses());
        this.methods.push(...namespace.getMethods());
        this.namespaces.push(namespace);
    }

    public getNamespaces(): ArkNamespace[] {
        return this.namespaces;
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

    public genNamespaceSignature() {
        let namespaceSignature = new NamespaceSignature();
        namespaceSignature.setNamespaceName(this.name);
        namespaceSignature.setDeclaringFileSignature(this.declaringArkFile.getFileSignature());
        if (this.declaringArkNamespace) {
            namespaceSignature.setDeclaringNamespaceSignature(this.declaringArkNamespace.getNamespaceSignature());
        }
        this.namespaceSignature = namespaceSignature;
    }

    public getNamespaceSignature() {
        return this.namespaceSignature;
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

    public getCode() {
        return this.code;
    }

    public setCode(code: string) {
        this.code = code;
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
        for (let i = 0; i < this.methods.length; i++) {
            // check whether exits this method
            if (this.methods[i].getSignature().toString() == arkMethod.getSignature().toString()) {
                this.methods.slice(i, 1);
            }
        }
        this.methods.push(arkMethod);
    }

    public getClass(classSignature: string): ArkClass | null {
        let cls = this.classes.find((obj) => {
            return (obj.getSignature().toString() == classSignature);
        })
        if (cls) {
            return cls;
        }
        return null;
    }

    public updateClass(arkClass: ArkClass) {
        for (let i = 0; i < this.classes.length; i++) {
            if (this.classes[i].getSignature().toString() == arkClass.getSignature().toString()) {
                this.classes.splice(i, 1);
            }
        }
        this.classes.push(arkClass);
        arkClass.getMethods().forEach((mtd) => {
            this.addArkMethod(mtd);
        });
    }

    public addArkClass(arkClass: ArkClass) {
        if (this.getClass(arkClass.getArkSignature())) {
            this.updateClass(arkClass);
        }
        else {
            this.classes.push(arkClass);
            arkClass.getMethods().forEach((mtd) => {
                this.addArkMethod(mtd);
            });
        }
    }

    public getClasses(): ArkClass[] {
        return this.classes;
    }

    public getMethods(): ArkMethod[] {
        return this.methods;
    }

    public isExported(): boolean {
        return this.containsModifier('ExportKeyword');
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

    public getDefaultClass() {
        return this.defaultClass;
    }

    public setDefaultClass(defaultClass: ArkClass) {
        this.defaultClass = defaultClass;
    }
}

export function buildArkNamespace(nsNode: NodeA, declaringInstance: ArkFile | ArkNamespace, ns: ArkNamespace) {
    if (!nsNode.namespaceNodeInfo) {
        throw new Error('Error: There is no namespaceNodeInfo for this ModuleDeclaration!');
    }

    ns.setName(nsNode.namespaceNodeInfo.getName());

    if (declaringInstance instanceof ArkFile) {
        ns.setDeclaringType("ArkFile");
        ns.setDeclaringArkFile(declaringInstance);
    }
    else {
        ns.setDeclaringType("ArkNamespace");
        ns.setDeclaringArkNamespace(declaringInstance);
        ns.setDeclaringArkFile(declaringInstance.getDeclaringArkFile());
    }
    ns.setDeclaringInstance(declaringInstance);
    ns.genArkSignature();
    ns.genNamespaceSignature();

    nsNode.namespaceNodeInfo.getModifiers().forEach((modifier) => {
        ns.addModifier(modifier);
    });

    ns.setCode(nsNode.text);

    let tmpNode = findIndicatedChild(nsNode, "ModuleBlock");
    if (tmpNode) {
        tmpNode = findIndicatedChild(tmpNode, "SyntaxList");
    }
    if (tmpNode) {
        genDefaultArkClass(tmpNode, ns);
        buildNamespaceMembers(tmpNode, ns);
    }
}

// TODO: check and update
function buildNamespaceMembers(nsNode: NodeA, namespace: ArkNamespace) {
    for (let child of nsNode.children) {
        if (child.kind == 'ModuleDeclaration') {
            let ns: ArkNamespace = new ArkNamespace();
            //ns.setDeclaringArkFile(this.declaringArkFile);
            ns.setDeclaringSignature(ns.getArkSignature());
            buildArkNamespace(child, namespace, ns);
            namespace.addNamespace(ns);

            namespace.addArkInstance(ns.getArkSignature(), ns);
            ns.getArkInstancesMap().forEach((value, key) => {
                namespace.addArkInstance(key, value);
            });

            if (ns.isExported()) {
                addExportInfo(ns, namespace);
            }
        }
        if (child.kind == 'ClassDeclaration' || child.kind == 'InterfaceDeclaration' || child.kind == 'EnumDeclaration') {
            let cls: ArkClass = new ArkClass();
            cls.setDeclaringSignature(namespace.getArkSignature());
            buildNormalArkClassFromArkNamespace(child, namespace, cls);
            namespace.addArkClass(cls);

            namespace.addArkInstance(cls.getArkSignature(), cls);
            cls.getArkInstancesMap().forEach((value, key) => {
                namespace.addArkInstance(key, value);
            });

            if (cls.isExported()) {
                addExportInfo(cls, namespace);
            }
        }
        if (arkMethodNodeKind.indexOf(child.kind) > -1) {
            let mthd: ArkMethod = new ArkMethod();
            mthd.setDeclaringSignature(namespace.getArkSignature());
            //let defaultClass = this.declaringArkFile.getDefaultClass();
            buildArkMethodFromArkClass(child, namespace.getDefaultClass(), mthd);
            namespace.getDefaultClass().addMethod(mthd);
            namespace.addArkMethod(mthd);

            namespace.addArkInstance(mthd.getArkSignature(), mthd);
            mthd.getArkInstancesMap().forEach((value, key) => {
                namespace.addArkInstance(key, value);
            });

            if (mthd.isExported()) {
                addExportInfo(mthd, namespace);
            }
        }
        if (child.kind == 'ExportDeclaration' || child.kind == 'ExportAssignment') {
            //this.processExportDeclarationNode(child);
            child.exportNodeInfo?.forEach((element) => {
                element.setArkSignature(namespace.getArkSignature());
                namespace.addExportInfos(element);

                namespace.addArkInstance(element.getArkSignature(), element);
            });
        }
        if (child.kind == 'VariableStatement' || child.kind == 'FirstStatement') {
            //check ExportKeyword
            let childSyntaxNode = findIndicatedChild(child, 'SyntaxList');
            if (childSyntaxNode) {
                if (findIndicatedChild(childSyntaxNode, 'ExportKeyword')) {
                    processExportValAndFirstNode(child, namespace);
                }
            }
        }
    }
}

function genDefaultArkClass(nsNode: NodeA, ns: ArkNamespace) {
    let defaultClass = new ArkClass();
    defaultClass.setDeclaringSignature(ns.getArkSignature());
    buildDefaultArkClassFromArkNamespace(nsNode, ns, defaultClass);
    ns.setDefaultClass(defaultClass);
    ns.addArkClass(defaultClass);
}

function findIndicatedChild(node: NodeA, childType: string): NodeA | null {
    for (let child of node.children) {
        if (child.kind == childType) {
            return child;
        }
    }
    return null;
}

function processExportValAndFirstNode(node: NodeA, ns: ArkNamespace): void {
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
    exportInfo.setArkSignature(ns.getArkSignature());
    ns.addExportInfos(exportInfo);
    ns.addArkInstance(exportInfo.getArkSignature(), exportInfo);
}

function addExportInfo(arkInstance: ArkMethod | ArkInterface | ArkClass | ArkNamespace | ArkEnum, ns: ArkNamespace) {
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
    exportInfo.setArkSignature(ns.getArkSignature());
    ns.addExportInfos(exportInfo);
    // this.addArkInstance(exportInfo.getArkSignature(), exportInfo);
}