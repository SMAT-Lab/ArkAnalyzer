import * as ts from "typescript";
import path from 'path';

export class ImportInfo {
    private importClauseName: string;
    private importType: string;
    private importFrom: string;
    private nameBeforeAs: string | undefined;
    private clauseType: string = "";

    public getImportClauseName() {
        return this.importClauseName;
    }

    public setImportClauseName(importClauseName: string) {
        this.importClauseName = importClauseName;
    }

    public getimportType() {
        return this.importClauseName;
    }

    public setimportType(importType: string) {
        this.importType = importType;
    }

    public getImportFrom() {
        return this.importFrom;
    }

    public setImportFrom(importFrom: string) {
        this.importFrom = importFrom;
    }

    public getNameBeforeAs() {
        return this.nameBeforeAs;
    }

    public setNameBeforeAs(nameBeforeAs: string | undefined) {
        this.nameBeforeAs = nameBeforeAs;
    }

    public getClauseType() {
        return this.clauseType;
    }

    public setClauseType(clauseType: string) {
        this.clauseType = clauseType;
    }

    private transfer2UnixPath(path2Do: string) {
        return path.posix.join(...path2Do.split(/\\/));
    }

    constructor() { }

    public build(importClauseName: string, importType: string, importFrom: string, nameBeforeAs?: string) {
        this.setImportClauseName(importClauseName);
        this.setimportType(importType);
        //if (importFrom) {
        //    importFrom = this.transfer2UnixPath(importFrom);
        //}
        this.setImportFrom(importFrom);
        this.setNameBeforeAs(nameBeforeAs);
    }
}

export function buildImportInfo4ImportNode(node: ts.ImportDeclaration | ts.ImportEqualsDeclaration): ImportInfo[] {
    if (ts.isImportDeclaration(node)) {
        return buildImportDeclarationNode(node);
    }
    else {
        return buildImportEqualsDeclarationNode(node);
    }
}

function buildImportDeclarationNode(node: ts.ImportDeclaration): ImportInfo[] {
    let importInfos: ImportInfo[] = [];
    let importFrom: string = '';
    if (ts.isStringLiteral(node.moduleSpecifier)) {
        importFrom = node.moduleSpecifier.text;
    }

    // just like: import '../xxx'
    if (!node.importClause) {
        let importClauseName = '';
        let importType = '';
        let importInfo = new ImportInfo();
        importInfo.build(importClauseName, importType, importFrom);
        importInfos.push(importInfo);
    }

    //just like: import fs from 'fs'
    if (node.importClause && node.importClause.name && ts.isIdentifier(node.importClause.name)) {
        let importClauseName = node.importClause.name.escapedText.toString();
        let importType = "Identifier";
        let importInfo = new ImportInfo();
        importInfo.build(importClauseName, importType, importFrom);
        importInfos.push(importInfo);
    }

    // just like: import {xxx} from './yyy'
    if (node.importClause && node.importClause.namedBindings && ts.isNamedImports(node.importClause.namedBindings)) {
        let importType = "NamedImports";
        if (node.importClause.namedBindings.elements) {
            node.importClause.namedBindings.elements.forEach((element) => {
                if (element.name && ts.isIdentifier(element.name)) {
                    let importClauseName = element.name.escapedText.toString();
                    if (element.propertyName && ts.isIdentifier(element.propertyName)) {
                        let importInfo = new ImportInfo();
                        importInfo.build(importClauseName, importType, importFrom, element.propertyName.escapedText.toString());
                        importInfos.push(importInfo);
                    }
                    else {
                        let importInfo = new ImportInfo();
                        importInfo.build(importClauseName, importType, importFrom)
                        importInfos.push(importInfo);
                    }
                }
            });
        }
    }

    // just like: import * as ts from 'typescript'
    if (node.importClause && node.importClause.namedBindings && ts.isNamespaceImport(node.importClause.namedBindings)) {
        let importType = "NamespaceImport";
        if (node.importClause.namedBindings.name && ts.isIdentifier(node.importClause.namedBindings.name)) {
            let importClauseName = node.importClause.namedBindings.name.escapedText.toString();
            let importInfo = new ImportInfo();
            importInfo.build(importClauseName, importType, importFrom);
            importInfos.push(importInfo);
        }
    }

    return importInfos;
}

function buildImportEqualsDeclarationNode(node: ts.ImportEqualsDeclaration): ImportInfo[] {
    let importInfos: ImportInfo[] = [];
    let importType = "EqualsImport";
    if (node.moduleReference && ts.isExternalModuleReference(node.moduleReference) &&
        node.moduleReference.expression && ts.isStringLiteral(node.moduleReference.expression)) {
        let importFrom = node.moduleReference.expression.text;
        let importClauseName = node.name.escapedText.toString();
        let importInfo = new ImportInfo()
        importInfo.build(importClauseName, importType, importFrom);
        importInfos.push(importInfo);
    }
    return importInfos;
}