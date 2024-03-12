import { NodeA } from "../base/Ast";
import { ExportInfo } from "../common/ExportBuilder";
import { ArkClass, buildDefaultArkClassFromArkNamespace, buildNormalArkClassFromArkNamespace } from "./ArkClass";
import { ArkFile } from "./ArkFile";
import { ArkMethod, arkMethodNodeKind, buildArkMethodFromArkClass } from "./ArkMethod";
import { ClassSignature, MethodSignature, NamespaceSignature } from "./ArkSignature";


export class ArkNamespace {
    private name: string;
    private code: string
    private line: number = -1;
    private declaringArkFile: ArkFile;
    private declaringArkNamespace: ArkNamespace | null = null;

    private declaringInstance: ArkFile | ArkNamespace;
    private declaringType: string;

    private modifiers: Set<string> = new Set<string>();
    private exportInfos: ExportInfo[] = [];

    private defaultClass: ArkClass;

    private namespaces: ArkNamespace[] = [];
    private classes: ArkClass[] = [];

    private namespaceSignature: NamespaceSignature;

    constructor() { }

    public getMethodAllTheNamespace(methodSignature: MethodSignature): ArkMethod | null {
        let classSig = methodSignature.getDeclaringClassSignature();
        let cls = this.getClassAllTheNamespace(classSig);
        if (cls) {
            return cls.getMethod(methodSignature);
        }
        return null;
    }

    public getClassAllTheNamespace(classSignature: ClassSignature): ArkClass | null {
        if (classSignature.getDeclaringFileSignature().toString() != this.getNamespaceSignature().getDeclaringFileSignature().toString()) {
            return null;
        }
        let nsSig = classSignature.getDeclaringNamespaceSignature();
        if (nsSig) {
            let ns = this.getNamespaceAllTheNamespace(nsSig);
            if (ns) {
                return ns.getClassAllTheNamespace(classSignature);
            }
        }
        return null;
    }

    public addNamespace(namespace: ArkNamespace) {
        this.namespaces.push(namespace);
    }

    public getNamespace(namespaceSignature: NamespaceSignature): ArkNamespace | null {
        const foundNamespace = this.namespaces.find(ns => ns.getNamespaceSignature().toString() == namespaceSignature.toString());
        return foundNamespace || null;
    }

    public getNamespaceAllTheNamespace(namespaceSignature: NamespaceSignature): ArkNamespace | null {
        let returnVal: ArkNamespace | null = null;
        let declaringNamespaceSignature = namespaceSignature.getDeclaringNamespaceSignature();

        if (!declaringNamespaceSignature) {
            return null;
        }

        if (declaringNamespaceSignature.toString() == this.namespaceSignature.toString()) {
            this.namespaces.forEach((ns) => {
                if (ns.getNamespaceSignature().toString() == namespaceSignature.toString()) {
                    returnVal = ns;
                }
            });
        }
        else {
            let declaringNamespace = this.getNamespaceAllTheNamespace(declaringNamespaceSignature);
            if (declaringNamespace) {
                returnVal = declaringNamespace.getNamespace(namespaceSignature);
            }
        }
        return returnVal;
    }

    public getNamespaces(): ArkNamespace[] {
        return this.namespaces;
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

    public getClass(classSignature: ClassSignature): ArkClass | null {
        const foundClass = this.classes.find(cls => cls.getSignature().toString() == classSignature.toString());
        return foundClass || null;
    }

    public getClasses(): ArkClass[] {
        return this.classes;
    }

    public updateClass(arkClass: ArkClass) {
        for (let i = 0; i < this.classes.length; i++) {
            if (this.classes[i].getSignature().toString() == arkClass.getSignature().toString()) {
                this.classes.splice(i, 1);
            }
        }
        this.classes.push(arkClass);
    }

    public addArkClass(arkClass: ArkClass) {
        if (this.getClass(arkClass.getSignature())) {
            this.updateClass(arkClass);
        }
        else {
            this.classes.push(arkClass);
        }
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

    public getDefaultClass() {
        return this.defaultClass;
    }

    public setDefaultClass(defaultClass: ArkClass) {
        this.defaultClass = defaultClass;
    }

    public getAllMethodsUnderThisNamespace(): ArkMethod[] {
        let methods: ArkMethod[] = [];
        this.classes.forEach((cls) => {
            methods.push(...cls.getMethods());
        });
        this.namespaces.forEach((ns) => {
            methods.push(...ns.getAllMethodsUnderThisNamespace());
        });
        return methods;
    }

    public getAllClassesUnderThisNamespace(): ArkClass[] {
        let classes: ArkClass[] = [];
        classes.push(...this.classes);
        this.namespaces.forEach((ns) => {
            classes.push(...ns.getAllClassesUnderThisNamespace());
        });
        return classes;
    }

    public getAllNamespacesUnderThisNamespace(): ArkNamespace[] {
        let namespaces: ArkNamespace[] = [];
        namespaces.push(...this.namespaces);
        this.namespaces.forEach((ns) => {
            namespaces.push(...ns.getAllNamespacesUnderThisNamespace());
        });
        return namespaces;
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

    ns.genNamespaceSignature();

    nsNode.namespaceNodeInfo.getModifiers().forEach((modifier) => {
        ns.addModifier(modifier);
    });

    ns.setCode(nsNode.text);
    ns.setLine(nsNode.line);

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

            buildArkNamespace(child, namespace, ns);
            namespace.addNamespace(ns);

            if (ns.isExported()) {
                let isDefault = namespace.getModifiers().has("DefaultKeyword");
                addExportInfo(ns, namespace, isDefault);
            }
        }
        if (child.kind == 'ClassDeclaration' || child.kind == 'InterfaceDeclaration' || child.kind == 'EnumDeclaration') {
            let cls: ArkClass = new ArkClass();

            buildNormalArkClassFromArkNamespace(child, namespace, cls);
            namespace.addArkClass(cls);

            if (cls.isExported()) {
                let isDefault = cls.getModifiers().has("DefaultKeyword");
                addExportInfo(cls, namespace, isDefault);
            }
        }
        if (arkMethodNodeKind.indexOf(child.kind) > -1) {
            let mthd: ArkMethod = new ArkMethod();
            buildArkMethodFromArkClass(child, namespace.getDefaultClass(), mthd);
            namespace.getDefaultClass().addMethod(mthd);

            if (mthd.isExported()) {
                let isDefault = mthd.getModifiers().has("DefaultKeyword");
                addExportInfo(mthd, namespace, isDefault);
            }
        }
        if (child.kind == 'ExportDeclaration' || child.kind == 'ExportAssignment') {
            child.exportNodeInfo?.forEach((element) => {

                if (findIndicatedChild(child, 'DefaultKeyword')) {
                    element.setDefault(true);
                }
                namespace.addExportInfos(element);
            });
        }
        if (child.kind == 'VariableStatement' || child.kind == 'FirstStatement') {
            //check ExportKeyword
            let childSyntaxNode = findIndicatedChild(child, 'SyntaxList');
            let isDefault = findIndicatedChild(child, 'DefaultKeyword') ? true : false;
            if (childSyntaxNode) {
                if (findIndicatedChild(childSyntaxNode, 'ExportKeyword')) {
                    processExportValAndFirstNode(child, namespace, isDefault);
                }
            }
        }
    }
}

function genDefaultArkClass(defaultClassNode: NodeA, ns: ArkNamespace) {
    let defaultClass = new ArkClass();

    buildDefaultArkClassFromArkNamespace(defaultClassNode, ns, defaultClass);
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

function processExportValAndFirstNode(node: NodeA, ns: ArkNamespace, isDefault:boolean): void {
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
    exportInfo.setDefault(isDefault);

    ns.addExportInfos(exportInfo);
}

function addExportInfo(arkInstance: ArkMethod | ArkClass | ArkNamespace, ns: ArkNamespace, isDefault: boolean) {
    let exportClauseName: string = arkInstance.getName();
    let exportClauseType: string;
    if (arkInstance instanceof ArkMethod) {
        exportClauseType = "Method";
    }
    else if (arkInstance instanceof ArkClass) {
        exportClauseType = "Class";
    }
    else {
        exportClauseType = "ArkNamespace";
    }
    let exportInfo = new ExportInfo();
    exportInfo.build(exportClauseName, exportClauseType);
    exportInfo.setDefault(isDefault);

    ns.addExportInfos(exportInfo);
}