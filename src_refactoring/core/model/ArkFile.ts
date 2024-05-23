import fs from 'fs';
import path from 'path';
import sourceMap, { BasicSourceMapConsumer } from 'source-map';
import { Scene } from '../../Scene';
import { ExportInfo } from './ArkExport';
import { ImportInfo } from './ArkImport';
import { ArkClass } from "./ArkClass";
import { ArkNamespace } from "./ArkNamespace";
import { ClassSignature, FileSignature, NamespaceSignature } from "./ArkSignature";
import { LineColPosition } from '../base/Position';

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

    // name to model
    private namespaces: Map<string, ArkNamespace> = new Map<string, ArkNamespace>(); // don't contain nested namespaces
    private classes: Map<string, ArkClass> = new Map<string, ArkClass>(); // don't contain class in namespace

    private importInfos: ImportInfo[] = [];
    private exportInfos: ExportInfo[] = [];

    private scene: Scene;

    private fileSignature: FileSignature;

    private sourceMap: sourceMap.SourceMapConsumer;

    private ohPackageJson5Path: string[] = [];

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

    public addArkClass(arkClass: ArkClass) {
        this.classes.set(arkClass.getName(), arkClass);
    }

    public getDefaultClass() {
        return this.defaultClass;
    }

    public setDefaultClass(defaultClass: ArkClass) {
        this.defaultClass = defaultClass;
    }

    public getNamespace(namespaceSignature: NamespaceSignature): ArkNamespace | null {
        const namespaceName = namespaceSignature.getNamespaceName();
        return this.getNamespaceWithName(namespaceName);
    }

    public getNamespaceWithName(namespaceName: string): ArkNamespace | null {
        return this.namespaces.get(namespaceName) || null;
    }

    public getNamespaces(): ArkNamespace[] {
        return Array.from(this.namespaces.values());
    }

    public getClass(classSignature: ClassSignature): ArkClass | null {
        const className = classSignature.getClassName();
        return this.getClassWithName(className);
    }

    public getClassWithName(Class: string): ArkClass | null {
        return this.classes.get(Class) || null;
    }

    public getClasses(): ArkClass[] {
        return Array.from(this.classes.values());
    }

    public addNamespace(namespace: ArkNamespace) {
        this.namespaces.set(namespace.getName(), namespace);
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

    public setOhPackageJson5Path(ohPackageJson5Path: string[]) {
        this.ohPackageJson5Path = ohPackageJson5Path;
    }

    public getOhPackageJson5Path() {
        return this.ohPackageJson5Path;
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

    public getAllNamespacesUnderThisFile(): ArkNamespace[] {
        let namespaces: ArkNamespace[] = [];
        namespaces.push(...this.namespaces.values());
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
        if (!this.sourceMap) {
            return '';
        }
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
        return lines.slice(0, line).join('\n');
    }
}

// export function buildArkFileFromFile(absoluteFilePath: string, projectDir: string, arkFile: ArkFile) {
//     arkFile.setFilePath(absoluteFilePath);
//     arkFile.setProjectDir(projectDir);
//     arkFile.setName(path.relative(projectDir, absoluteFilePath));

//     arkFile.genFileSignature();

//     arkFile.setCode(fs.readFileSync(absoluteFilePath, 'utf8'));
//     const astTree = new ASTree(arkFile.getCode());
//     const sourceFile = ts.createSourceFile(
//         "example.ts",
//         this.text,
//         ts.ScriptTarget.Latest
//     );
//     genDefaultArkClass(arkFile, sourceFile);
//     buildArkFile(arkFile, sourceFile);
// }

// function buildArkFile(arkFile: ArkFile, astTree: ts.Node) {
//     let children = astTree.root?.children;
//     for (let child of children) {
//         if (child.kind == 'ModuleDeclaration') {
//             let ns: ArkNamespace = new ArkNamespace();
//             ns.setDeclaringArkFile(arkFile);

//             buildArkNamespace(child, arkFile, ns);
//             arkFile.addNamespace(ns);

//             if (ns.isExported()) {
//                 let isDefault = ns.getModifiers().has("DefaultKeyword");
//                 addExportInfo(ns, arkFile, isDefault);
//             }
//         }
//         if (
//             child.kind == 'ClassDeclaration' ||
//             child.kind == 'InterfaceDeclaration' ||
//             child.kind == 'EnumDeclaration'
//         ) {
//             let cls: ArkClass = new ArkClass();

//             buildNormalArkClassFromArkFile(child, arkFile, cls);
//             arkFile.addArkClass(cls);

//             if (cls.isExported()) {
//                 let isDefault = cls.getModifiers().has("DefaultKeyword");
//                 addExportInfo(cls, arkFile, isDefault);
//             }
//         }
//         if (arkMethodNodeKind.indexOf(child.kind) > -1) {
//             let mthd: ArkMethod = new ArkMethod();

//             buildArkMethodFromArkClass(child, arkFile.getDefaultClass(), mthd);
//             arkFile.getDefaultClass().addMethod(mthd);

//             if (mthd.isExported()) {
//                 let isDefault = mthd.getModifiers().has("DefaultKeyword");
//                 addExportInfo(mthd, arkFile, isDefault);
//             }
//         }
//         if (child.kind == 'ImportDeclaration' || child.kind == 'ImportEqualsDeclaration') {
//             child.importNodeInfo?.forEach((element) => {
//                 element.setDeclaringFilePath(arkFile.getFilePath());
//                 element.setProjectPath(arkFile.getProjectDir());
//                 element.setDeclaringArkFile(arkFile);

//                 element.setImportFromSignature();
//                 arkFile.addImportInfos(element);

//             });
//         }
//         if (child.kind == 'ExportDeclaration' || child.kind == 'ExportAssignment') {
//             child.exportNodeInfo?.forEach((element) => {
//                 if (findIndicatedChild(child, 'DefaultKeyword')) {
//                     element.setDefault(true);
//                 }

//                 let elementImportInfo = element.getImportInfo();
//                 if (elementImportInfo) {
//                     elementImportInfo.setDeclaringFilePath(arkFile.getFilePath());
//                     elementImportInfo.setProjectPath(arkFile.getProjectDir());
//                     elementImportInfo.setDeclaringArkFile(arkFile);

//                     elementImportInfo.setImportFromSignature();
//                     arkFile.addImportInfos(elementImportInfo);
//                 }

//                 arkFile.addExportInfos(element);
//             });
//         }
//         if (child.kind == 'VariableStatement' || child.kind == 'FirstStatement') {
//             //check ExportKeyword
//             let childSyntaxNode = findIndicatedChild(child, 'SyntaxList');
//             let isDefault = findIndicatedChild(child, 'DefaultKeyword') ? true : false;
//             if (childSyntaxNode) {
//                 if (findIndicatedChild(childSyntaxNode, 'ExportKeyword')) {
//                     processExportValAndFirstNode(child, arkFile, isDefault);
//                 }
//             }
//         }
//     }
// }

// function genDefaultArkClass(arkFile: ArkFile, astRoot: ts.Node) {
//     let defaultClass = new ArkClass();

//     buildDefaultArkClassFromArkFile(astTree.root, arkFile, defaultClass);
//     arkFile.setDefaultClass(defaultClass);
//     arkFile.addArkClass(defaultClass);
// }

// function findIndicatedChild(node: NodeA, childType: string): NodeA | null {
//     for (let child of node.children) {
//         if (child.kind == childType) {
//             return child;
//         }
//     }
//     return null;
// }

// function processExportValAndFirstNode(node: NodeA, arkFile: ArkFile, isDefault: boolean): void {
//     let exportClauseName: string = '';
//     let exportClauseType: string = node.kind;
//     let cld = findIndicatedChild(node, 'VariableDeclarationList');
//     if (cld) {
//         let c = findIndicatedChild(cld, 'SyntaxList');
//         if (c) {
//             let cc = findIndicatedChild(c, 'VariableDeclaration');
//             if (cc) {
//                 let ccc = findIndicatedChild(cc, 'Identifier');
//                 if (ccc) {
//                     exportClauseName = ccc.text;
//                 }
//             }
//         }
//     }
//     let exportInfo = new ExportInfo();
//     exportInfo.build(exportClauseName, exportClauseType, new LineColPosition(-1, -1));
//     exportInfo.setDefault(isDefault);

//     arkFile.addExportInfos(exportInfo);
// }

// function addExportInfo(arkInstance: ArkMethod | ArkClass | ArkNamespace, arkFile: ArkFile, isDefault: boolean) {
//     let exportClauseName: string = arkInstance.getName();
//     let exportClauseType: string;
//     if (arkInstance instanceof ArkMethod) {
//         exportClauseType = "Method";
//     } else if (arkInstance instanceof ArkClass) {
//         exportClauseType = "Class";
//     } else {
//         exportClauseType = "ArkNamespace";
//     }
//     let exportInfo = new ExportInfo();
//     exportInfo.build(exportClauseName, exportClauseType, new LineColPosition(-1, -1));
//     exportInfo.setDefault(isDefault);
//     arkFile.addExportInfos(exportInfo);
// }