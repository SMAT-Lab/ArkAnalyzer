import * as ts from "typescript";

export class ImportInfo {
    importClauseName: string;
    importClauseType: string;
    importFrom: string | undefined;
    nameBeforeAs: string | undefined;
    constructor(importClauseName: string, importClauseType: string, importFrom?: string, nameBeforeAs?: string) {
        this.importClauseName = importClauseName;
        this.importClauseType = importClauseType;
        this.importFrom = importFrom;
        this.nameBeforeAs = nameBeforeAs;
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
    let importFrom: string | undefined;
    if (ts.isStringLiteral(node.moduleSpecifier)) {
        importFrom = node.moduleSpecifier.text;
    }

    // just like: import '../xxx'
    if (!node.importClause) {
        let importClauseName = '';
        let importClauseType = '';
        importInfos.push(new ImportInfo(importClauseName, importClauseType, importFrom));
    }

    //just like: import fs from 'fs'
    if (node.importClause && node.importClause.name && ts.isIdentifier(node.importClause.name)) {
        let importClauseName = node.importClause.name.escapedText.toString();
        let importClauseType = "Identifier";
        importInfos.push(new ImportInfo(importClauseName, importClauseType, importFrom));
    }

    // just like: import {xxx} from './yyy'
    if (node.importClause && node.importClause.namedBindings && ts.isNamedImports(node.importClause.namedBindings)) {
        let importClauseType = "NamedImports";
        if (node.importClause.namedBindings.elements) {
            node.importClause.namedBindings.elements.forEach((element) => {
                if (element.name && ts.isIdentifier(element.name)) {
                    let importClauseName = element.name.escapedText.toString();
                    if (element.propertyName && ts.isIdentifier(element.propertyName)) {
                        importInfos.push(new ImportInfo(importClauseName, importClauseType,
                            importFrom, element.propertyName.escapedText.toString()));
                    }
                    else {
                        importInfos.push(new ImportInfo(importClauseName, importClauseType, importFrom));
                    }
                }
            });
        }
    }

    // just like: import * as ts from 'typescript'
    if (node.importClause && node.importClause.namedBindings && ts.isNamespaceImport(node.importClause.namedBindings)) {
        let importClauseType = "NamespaceImport";
        if (node.importClause.namedBindings.name && ts.isIdentifier(node.importClause.namedBindings.name)) {
            let importClauseName = node.importClause.namedBindings.name.escapedText.toString();
            importInfos.push(new ImportInfo(importClauseName, importClauseType, importFrom));
        }
    }

    return importInfos;
}

function buildImportEqualsDeclarationNode(node: ts.ImportEqualsDeclaration): ImportInfo[] {
    let importInfos: ImportInfo[] = [];
    let importClauseType = "EqualsImport";
    if (node.moduleReference && ts.isExternalModuleReference(node.moduleReference) &&
        node.moduleReference.expression && ts.isStringLiteral(node.moduleReference.expression)) {
        let importFrom = node.moduleReference.expression.text;
        let importClauseName = node.name.escapedText.toString();
        importInfos.push(new ImportInfo(importClauseName, importClauseType, importFrom));
    }
    return importInfos;
}