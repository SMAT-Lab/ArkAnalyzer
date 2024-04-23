import fs from 'fs';
import path from 'path';
import sourceMap, {BasicSourceMapConsumer} from 'source-map';
import {Scene} from '../../Scene';
import {ASTree, NodeA} from "../base/Ast";
import {ExportInfo} from '../common/ExportBuilder';
import {ImportInfo} from '../common/ImportBuilder';
import {ArkClass, buildDefaultArkClassFromArkFile, buildNormalArkClassFromArkFile} from "./ArkClass";
import {ArkMethod, arkMethodNodeKind, buildArkMethodFromArkClass} from "./ArkMethod";
import {ArkNamespace, buildArkNamespace} from "./ArkNamespace";
import {ClassSignature, FileSignature, MethodSignature, NamespaceSignature} from "./ArkSignature";
import {LineColPosition} from '../base/Position';

export const notStmtOrExprKind = ['ModuleDeclaration', 'ClassDeclaration', 'InterfaceDeclaration', 'EnumDeclaration', 'ExportDeclaration',
    'ExportAssignment', 'MethodDeclaration', 'Constructor', 'FunctionDeclaration', 'GetAccessor', 'SetAccessor', 'ArrowFunction',
    'FunctionExpression', 'MethodSignature', 'ConstructSignature', 'CallSignature'];

/**
 *
 */
export class ArkFile {

    private name: string; //name also means the relative path
    private absoluteFilePath: string;
    private projectDir: string;
    private projectName: string = "";
    private code: string;

    private defaultClass: ArkClass;

    private namespaces: ArkNamespace[] = [];
    private classes: ArkClass[] = [];

    private importInfos: ImportInfo[] = [];
    private exportInfos: ExportInfo[] = [];

    private scene: Scene;

    private fileSignature: FileSignature;

    private sourceMap: sourceMap.SourceMapConsumer;

    constructor() {
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
        } else {
            this.classes.push(arkClass);
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
        this.namespaces.push(namespace);
    }

    public getMethodAllTheFile(methodSignature: MethodSignature): ArkMethod | null {
        let returnVal: ArkMethod | null = null;
        let namespaceSig = methodSignature.getDeclaringClassSignature().getDeclaringNamespaceSignature();
        if (namespaceSig != null) {
            let namespace = this.getNamespaceAllTheFile(namespaceSig);
            if (namespace) {
                returnVal = namespace.getMethodAllTheNamespace(methodSignature);
            }
        } else {
            let classSig = methodSignature.getDeclaringClassSignature();
            let cls = this.getClass(classSig);
            if (cls) {
                returnVal = cls.getMethod(methodSignature);
            }
        }
        return returnVal;
    }

    public getClassAllTheFile(classSignature: ClassSignature): ArkClass | null {
        let returnVal: ArkClass | null = null;
        let fileSig = classSignature.getDeclaringFileSignature();
        if (fileSig.toString() != this.fileSignature.toString()) {
            return null;
        } else {
            let namespaceSig = classSignature.getDeclaringNamespaceSignature();
            if (namespaceSig) {
                let ns = this.getNamespaceAllTheFile(namespaceSig);
                if (ns) {
                    returnVal = ns.getClass(classSignature);
                }
            } else {
                returnVal = this.getClass(classSignature);
            }
        }
        return returnVal;
    }

    public getNamespaceAllTheFile(namespaceSignature: NamespaceSignature): ArkNamespace | null {
        let returnVal: ArkNamespace | null = null;
        let declaringNamespaceSignature = namespaceSignature.getDeclaringNamespaceSignature();
        if (!declaringNamespaceSignature) {
            this.namespaces.forEach((ns) => {
                if (ns.getNamespaceSignature().toString() == namespaceSignature.toString()) {
                    returnVal = ns;
                }
            });
        } else {
            let declaringNamespace = this.getNamespaceAllTheFile(declaringNamespaceSignature);
            if (declaringNamespace) {
                returnVal = declaringNamespace.getNamespace(namespaceSignature);
            }
        }
        return returnVal;
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

    public setProjectName(projectName: string) {
        this.projectName = projectName;
    }

    public getProjectName() {
        return this.projectName;
    }

    public genFileSignature() {
        let fileSignature = new FileSignature();
        fileSignature.setFileName(this.name);
        fileSignature.setProjectName(this.projectName);
        this.fileSignature = fileSignature;
    }

    public getFileSignature() {
        return this.fileSignature;
    }

    public getAllMethodsUnderThisFile(): ArkMethod[] {
        let methods: ArkMethod[] = [];
        this.classes.forEach((cls) => {
            methods.push(...cls.getMethods());
        });
        this.namespaces.forEach((ns) => {
            methods.push(...ns.getAllMethodsUnderThisNamespace());
        });
        return methods;
    }

    public getAllClassesUnderThisFile(): ArkClass[] {
        let classes: ArkClass[] = [];
        classes.push(...this.classes);
        this.namespaces.forEach((ns) => {
            classes.push(...ns.getAllClassesUnderThisNamespace());
        });
        return classes;
    }

    public getAllNamespacesUnderThisFile(): ArkNamespace[] {
        let namespaces: ArkNamespace[] = [];
        namespaces.push(...this.namespaces);
        this.namespaces.forEach((ns) => {
            namespaces.push(...ns.getAllNamespacesUnderThisNamespace());
        });
        return namespaces;
    }

    private async initSourceMap() {
        if (this.sourceMap) {
            return;
        }
        let mapFilePath: string = this.getFilePath() + '.map';
        if (fs.existsSync(mapFilePath)) {
            this.sourceMap = await new sourceMap.SourceMapConsumer(fs.readFileSync(mapFilePath, 'utf-8'));
        }
    }

    public async getEtsOriginalPositionFor(position: LineColPosition): Promise<LineColPosition> {
        if (position.getColNo() < 0 || position.getLineNo() < 1) {
            return new LineColPosition(0, 0);
        }
        await this.initSourceMap();
        let result = this.sourceMap?.originalPositionFor({
            line: position.getLineNo(),
            column: position.getColNo(),
            bias: sourceMap.SourceMapConsumer.LEAST_UPPER_BOUND
        });
        if (result && result.line) {
            return new LineColPosition(result.line, result.column as number);
        }
        return new LineColPosition(0, 0);
    }

    public async getEtsSource(line: number): Promise<string> {
        if (line < 1) {
            return '';
        }
        await this.initSourceMap();
        let map = (this.sourceMap as BasicSourceMapConsumer).sources[0];
        if (!fs.existsSync(map)) {
            map = path.join(path.dirname(this.absoluteFilePath), map);
        }

        if (!fs.existsSync(map)) {
            return '';
        }

        let lines = fs.readFileSync(map, 'utf8').split('\n');
        if (lines.length < line) {
            return '';
        }
        return lines[line - 1];
    }
}

export function buildArkFileFromFile(absoluteFilePath: string, projectDir: string, arkFile: ArkFile) {
    arkFile.setFilePath(absoluteFilePath);
    arkFile.setProjectDir(projectDir);
    arkFile.setName(path.relative(projectDir, absoluteFilePath));

    arkFile.genFileSignature();

    arkFile.setCode(fs.readFileSync(absoluteFilePath, 'utf8'));
    const astTree = new ASTree(arkFile.getCode());

    genDefaultArkClass(arkFile, astTree);
    buildArkFile(arkFile, astTree);
}

function buildArkFile(arkFile: ArkFile, astTree: ASTree) {
    let children = astTree.root?.children;
    for (let child of children) {
        if (child.kind == 'ModuleDeclaration') {
            let ns: ArkNamespace = new ArkNamespace();
            ns.setDeclaringArkFile(arkFile);

            buildArkNamespace(child, arkFile, ns);
            arkFile.addNamespace(ns);

            if (ns.isExported()) {
                let isDefault = ns.getModifiers().has("DefaultKeyword");
                addExportInfo(ns, arkFile, isDefault);
            }
        }
        if (child.kind == 'ClassDeclaration' || child.kind == 'InterfaceDeclaration' || child.kind == 'EnumDeclaration') {
            let cls: ArkClass = new ArkClass();

            buildNormalArkClassFromArkFile(child, arkFile, cls);
            arkFile.addArkClass(cls);

            if (cls.isExported()) {
                let isDefault = cls.getModifiers().has("DefaultKeyword");
                addExportInfo(cls, arkFile, isDefault);
            }
        }
        if (arkMethodNodeKind.indexOf(child.kind) > -1) {
            let mthd: ArkMethod = new ArkMethod();

            buildArkMethodFromArkClass(child, arkFile.getDefaultClass(), mthd);
            arkFile.getDefaultClass().addMethod(mthd);

            if (mthd.isExported()) {
                let isDefault = mthd.getModifiers().has("DefaultKeyword");
                addExportInfo(mthd, arkFile, isDefault);
            }
        }
        if (child.kind == 'ImportDeclaration' || child.kind == 'ImportEqualsDeclaration') {
            child.importNodeInfo?.forEach((element) => {
                element.setDeclaringFilePath(arkFile.getFilePath());
                element.setProjectPath(arkFile.getProjectDir());
                element.setDeclaringArkFile(arkFile);

                element.setImportFromSignature();
                arkFile.addImportInfos(element);

            });
        }
        if (child.kind == 'ExportDeclaration' || child.kind == 'ExportAssignment') {
            child.exportNodeInfo?.forEach((element) => {
                if (findIndicatedChild(child, 'DefaultKeyword')) {
                    element.setDefault(true);
                }

                let elementImportInfo = element.getImportInfo();
                if (elementImportInfo) {
                    elementImportInfo.setDeclaringFilePath(arkFile.getFilePath());
                    elementImportInfo.setProjectPath(arkFile.getProjectDir());
                    elementImportInfo.setDeclaringArkFile(arkFile);

                    elementImportInfo.setImportFromSignature();
                    arkFile.addImportInfos(elementImportInfo);
                }

                arkFile.addExportInfos(element);
            });
        }
        if (child.kind == 'VariableStatement' || child.kind == 'FirstStatement') {
            //check ExportKeyword
            let childSyntaxNode = findIndicatedChild(child, 'SyntaxList');
            let isDefault = findIndicatedChild(child, 'DefaultKeyword') ? true : false;
            if (childSyntaxNode) {
                if (findIndicatedChild(childSyntaxNode, 'ExportKeyword')) {
                    processExportValAndFirstNode(child, arkFile, isDefault);
                }
            }
        }
    }
}

function genDefaultArkClass(arkFile: ArkFile, astTree: ASTree) {
    let defaultClass = new ArkClass();

    buildDefaultArkClassFromArkFile(astTree.root, arkFile, defaultClass);
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

function processExportValAndFirstNode(node: NodeA, arkFile: ArkFile, isDefault: boolean): void {
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

    arkFile.addExportInfos(exportInfo);
}

function addExportInfo(arkInstance: ArkMethod | ArkClass | ArkNamespace, arkFile: ArkFile, isDefault: boolean) {
    let exportClauseName: string = arkInstance.getName();
    let exportClauseType: string;
    if (arkInstance instanceof ArkMethod) {
        exportClauseType = "Method";
    } else if (arkInstance instanceof ArkClass) {
        exportClauseType = "Class";
    } else {
        exportClauseType = "ArkNamespace";
    }
    let exportInfo = new ExportInfo();
    exportInfo.build(exportClauseName, exportClauseType);
    exportInfo.setDefault(isDefault);
    arkFile.addExportInfos(exportInfo);
}