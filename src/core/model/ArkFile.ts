import fs from 'fs';
import { ArkClass } from "./ArkClass";
import { ArkMethod } from "./ArkMethod";
import { NodeA, ASTree } from "../base/Ast";
import { ArkNamespace } from "./ArkNamespace";
import { ClassSignature, MethodSignature, methodSignatureCompare, classSignatureCompare } from "./ArkSignature";

/**
 * 
 */

class ImportInfo {
    importClauseName: string;
    importClauseType: string;
    importFrom: string;
    constructor(importClauseName: string, importClauseType: string, importFrom: string) {
        this.importClauseName = importClauseName;
        this.importClauseType = importClauseType;
        this.importFrom = importFrom;
    }
}

class ExportInfo {
    exportClauseName: string;//ExtAdder of "export { ExtendedAdder as ExtAdder}"
    exportClauseType: string;
    exportFrom: string;
    asName: string;//ExtendedAdder of "export { ExtendedAdder as ExtAdder}"
    constructor(exportClauseName: string, exportClauseType: string, exportFrom: string, asName: string) {
        this.exportClauseName = exportClauseName;
        this.exportClauseType = exportClauseType;
        this.exportFrom = exportFrom;
        this.asName = asName;
    }
}

export class ArkFile {
    name: string;
    code: string;
    ast: ASTree;
    methods: ArkMethod[] = [];
    classes: ArkClass[] = [];
    defaultClass!: ArkClass;
    nameSpaces: ArkNamespace[] = [];
    importInfo: ImportInfo[] = [];
    exportInfo: ExportInfo[] = [];

    constructor(file: string) {
        this.name = file;
        this.code = fs.readFileSync(file, 'utf8');
        this.ast = new ASTree(this.code);
        this.genDefaultArkClass();
        this.buildArkFile();
        this.collectAllMethods();
    }

    private genDefaultArkClass() {
        this.defaultClass = new ArkClass(this.ast.root, this);
        this.classes.push(this.defaultClass);
    }

    private processImportDeclarationNode(node: NodeA): void {
        let importFrom: string = '';
        let importClauseName: string = '';
        let importClauseType: string = '';
        let fromNode = this.findIndicatedChild(node, 'StringLiteral');
        importFrom = fromNode ? fromNode.text : '';
        let clauseNode = this.findIndicatedChild(node, 'ImportClause');
        if (clauseNode) {
            if (clauseNode.children[0].kind == 'Identifier') {
                importClauseType = "Identifier";
                importClauseName = clauseNode.children[0].text;
                this.importInfo.push(new ImportInfo(importClauseName, importClauseType, importFrom));
            }
            else if (clauseNode.children[0].kind == 'NamedImports') {
                importClauseType = "NamedImports";
                let namedImport = clauseNode.children[0].children[1];
                for (let cld of namedImport.children) {
                    importClauseName = cld.text;
                    this.importInfo.push(new ImportInfo(importClauseName, importClauseType, importFrom));
                }
            }
            else if (clauseNode.children[0].kind == 'NamespaceImport') {
                importClauseType = "NamespaceImport";
                let nameSpaceImport = clauseNode.children[0].children[2];
                importClauseName = nameSpaceImport.text;
                this.importInfo.push(new ImportInfo(importClauseName, importClauseType, importFrom));
            }
        }
    }

    private processImportEqualsDeclarationNode(node: NodeA): void {
        let importFrom: string = '';
        let importClauseName: string = '';
        let importClauseType: string = 'ImportEqualsDeclaration';
        let nameNode = this.findIndicatedChild(node, 'Identifier');
        importClauseName = nameNode ? nameNode.text : '';
        let refNode = this.findIndicatedChild(node, 'ExternalModuleReference');
        if (refNode) {
            let fromNode = this.findIndicatedChild(refNode, 'StringLiteral');
            importFrom = fromNode ? fromNode.text : '';
        }
        this.importInfo.push(new ImportInfo(importClauseName, importClauseType, importFrom));
    }

    private processExportDeclarationNode(node: NodeA): void {
        let exportFrom: string = '';
        let exportClauseName: string = '';
        let exportClauseType: string = '';
        let asName = '';
        if (this.findIndicatedChild(node, 'NamedExports')) {
            exportClauseType = "NamedExports";
            let namedExportSyntaxExportSpecifier = node.children[1].children[1].children[0];
            if (namedExportSyntaxExportSpecifier.children.length == 1) {
                exportClauseName = namedExportSyntaxExportSpecifier.children[0].text;
            }
            else if (namedExportSyntaxExportSpecifier.children.length == 3) {
                if (namedExportSyntaxExportSpecifier.children[1].kind == 'AsKeyword') {
                    asName = namedExportSyntaxExportSpecifier.children[0].text;
                    exportClauseName = namedExportSyntaxExportSpecifier.children[2].text;
                }
            }
            this.exportInfo.push(new ExportInfo(exportClauseName, exportClauseType, exportFrom, asName));
        }
        else if (this.findIndicatedChild(node, 'NamespaceExport')) {
            exportClauseType = "NamespaceExport";
            let stringNode = this.findIndicatedChild(node, 'StringLiteral');
            exportFrom = stringNode ? stringNode.text : '';
            asName = '*';
            for (let cld of node.children[1].children) {
                if (cld.kind == 'Identifier') {
                    exportClauseName = cld.text;
                }
            }
            this.exportInfo.push(new ExportInfo(exportClauseName, exportClauseType, exportFrom, asName));
        }
        else if (node.children[1].kind == 'AsteriskToken') {
            exportClauseType = "AsteriskToken";
            let stringNode = this.findIndicatedChild(node, 'StringLiteral');
            exportFrom = stringNode ? stringNode.text : '';
            exportClauseName = "*";
            this.exportInfo.push(new ExportInfo(exportClauseName, exportClauseType, exportFrom, asName));
        }
    }

    private processExportValAndFirstNode(node: NodeA): void {
        let exportFrom: string = '';
        let exportClauseName: string = '';
        let exportClauseType: string = node.kind;
        let asName = '';
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
        this.exportInfo.push(new ExportInfo(exportClauseName, exportClauseType, exportFrom, asName));
    }

    private findIndicatedChild(node: NodeA, childType: string): NodeA | null {
        for (let child of node.children) {
            if (child.kind == childType) {
                return child;
            }
        }
        return null;
    }

    // TODO: check and update
    private buildArkFile() {
        let children = this.ast.root?.children;
        for (let child of children) {
            //else if (child.kind == 'NamespaceKeyword') {
            //    let ns: ArkNamespace = new ArkNamespace(child, this);
            //    this.nameSpaces.push(ns);
            //}
            if (child.kind == 'ClassDeclaration') {
                let cls: ArkClass = new ArkClass(child, this);
                this.classes.push(cls);
                if (cls.isExported) {
                    let exportFrom: string = '';
                    let exportClauseName: string = cls.name;
                    let exportClauseType: string = "Class";
                    let asName = '';
                    this.exportInfo.push(new ExportInfo(exportClauseName, exportClauseType, exportFrom, asName));
                }
            }
            else if (child.kind == 'FunctionDeclaration') {
                let mthd: ArkMethod = new ArkMethod(child, this, this.defaultClass);
                this.defaultClass.methods.push(mthd);
                if (mthd.isExported) {
                    let exportFrom: string = '';
                    let exportClauseName: string = mthd.name;
                    let exportClauseType: string = "Method";
                    let asName = '';
                    this.exportInfo.push(new ExportInfo(exportClauseName, exportClauseType, exportFrom, asName));
                }
            }
            else if (child.kind == 'ImportDeclaration') {
                this.processImportDeclarationNode(child);
            }
            else if (child.kind == 'ImportEqualsDeclaration') {
                this.processImportEqualsDeclarationNode(child);
            }
            else if (child.kind == 'ExportDeclaration') {
                this.processExportDeclarationNode(child);
            }
            else if (child.kind == 'ExportAssignment') {
                //this is a default export
                let exportFrom: string = '';
                let exportClauseName: string = child.children[2].text;
                let exportClauseType: string = 'default';
                let asName = '';
                this.exportInfo.push(new ExportInfo(exportClauseName, exportClauseType, exportFrom, asName));
            }
            else if (child.kind == 'VariableStatement' || child.kind == 'FirstStatement') {
                //check ExportKeyword
                let childSyntaxNode = this.findIndicatedChild(child, 'SyntaxList');
                if (childSyntaxNode) {
                    let exportKeyWordNode = this.findIndicatedChild(childSyntaxNode, 'ExportKeyword');
                    if (exportKeyWordNode) {
                        this.processExportValAndFirstNode(child);
                    }
                }
            }
        }
    }

    public getNamespaces(): ArkNamespace[] {
        return this.nameSpaces;
    }

    public getClasses(): ArkClass[] {
        return this.classes;
    }

    public getClass(classSignature: ClassSignature): ArkClass | null {
        let cls = this.classes.find((obj) => {
            return classSignatureCompare(obj.classSignature, classSignature);
        })
        if (cls) {
            return cls;
        }
        return null;
    }

    public collectAllMethods() {
        this.classes.forEach((cls) => {
            cls.methods.forEach((mtd) => {
                this.methods.push(mtd);
            });
        });
    }

    public getMethods(): ArkMethod[] {
        return this.methods;
    }

    //TODO: err handle
    public getMethod(methodSignature: MethodSignature): ArkMethod | null {
        if (methodSignature.arkClass.classType) {
            let arkCls = this.getClass(methodSignature.arkClass);
            if (arkCls) {
                return arkCls.getMethod(methodSignature.methodSubSignature);
            }
            else {
                throw new Error('MethodSignature wrong. No ArkClass found.');
            }
        }
        else {
            let mtd = this.methods.find((obj) => {
                return methodSignatureCompare(obj.methodSignature, methodSignature);
            })
            if (mtd) {
                return mtd;
            }
        }
        return null;
    }
}