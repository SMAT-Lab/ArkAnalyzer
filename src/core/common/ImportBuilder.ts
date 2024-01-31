import * as ts from "typescript";
import path from 'path';
import { transfer2UnixPath } from "../../utils/pathTransfer";

export class ImportInfo {
    private importClauseName: string;
    private importType: string;
    private importFrom: string;
    private nameBeforeAs: string | undefined;
    private clauseType: string = "";
    private declaringSignature: string;
    private arkSignature: string;
    private targetArkSignature: string;
    private sdkConfigPrefix = 'ohos|system|kit';
    private declaringFilePath:string;
    private projectPath:string;

    constructor() { }

    public build(importClauseName: string, importType: string, importFrom: string, nameBeforeAs?: string) {
        this.setImportClauseName(importClauseName);
        this.setImportType(importType);
        //if (importFrom) {
        //    importFrom = this.transfer2UnixPath(importFrom);
        //}
        this.setImportFrom(importFrom);
        this.setNameBeforeAs(nameBeforeAs);
    }

    public setDeclaringFilePath(declaringFilePath: string) {
        this.declaringFilePath = declaringFilePath;
    }

    public setProjectPath(projectPath: string) {
        this.projectPath = projectPath;
    }

    public setArkSignature(declaringSignature: string) {
        this.declaringSignature = declaringSignature;
        this.arkSignature = declaringSignature + '.' + this.importClauseName;
        this.genTargetArkSignature();
    }

    public genTargetArkSignature() {
        const pathReg1 = new RegExp("^(\\.\\.\\/\|\\.\\/)");
        const pathReg2 = new RegExp(`@(${this.sdkConfigPrefix})\[\.\|\/\]`);

        let tmpSig: string;
        // project internal imports
        if (pathReg1.test(this.importFrom)) {
            let tmpTargetPath = path.resolve(path.dirname(this.declaringFilePath), path.dirname(this.importFrom + '.ts'));
            let tmpSig1 = path.relative(this.projectPath, tmpTargetPath);
            tmpSig1 = transfer2UnixPath(tmpSig1).replace(/\//g, '.');
            tmpSig1 = tmpSig1 + '.' + path.basename(this.importFrom + '.ts', ".ts");
            if (this.nameBeforeAs) {
                tmpSig = tmpSig1 + '.' + this.nameBeforeAs;
            }
            else if (this.importType == 'NamespaceImport'){
                tmpSig = tmpSig1;
            }
            else {
                tmpSig = tmpSig1 + '.' + this.importClauseName;
            }
            this.setTargetArkSignature(tmpSig);
        }
        // local sdk related imports, e.g. openharmony sdk
        else if (pathReg2.test(this.importFrom)) {
            //let tmpSig: string;
            if (this.nameBeforeAs) {
                tmpSig = transfer2UnixPath(this.importFrom).replace(/\//g, '.') + '.' + this.nameBeforeAs;
            }
            else if (this.importType == 'NamespaceImport'){
                tmpSig = transfer2UnixPath(this.importFrom).replace(/\//g, '.');
            }
            else {
                tmpSig = transfer2UnixPath(this.importFrom).replace(/\//g, '.') + '.' + this.importClauseName;
            }
            this.setTargetArkSignature(tmpSig);
        }
        //third part npm package
        else {
            //console.log('pathReg3');
            //TODO: Attention to: @ohos/xxx
        }
    }

    public getArkSignature() {
        return this.arkSignature;
    }

    public getTargetArkSignature() {
        return this.targetArkSignature;
    }

    public setTargetArkSignature(targetArkSignature: string) {
        this.targetArkSignature = targetArkSignature;
    }

    public getImportClauseName() {
        return this.importClauseName;
    }

    public setImportClauseName(importClauseName: string) {
        this.importClauseName = importClauseName;
    }

    public getImportType() {
        return this.importType;
    }

    public setImportType(importType: string) {
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