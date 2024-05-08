import * as ts from "typescript";
import path from 'path';
import fs from 'fs';
import { transfer2UnixPath } from "../../utils/pathTransfer";
import { ArkFile } from "../model/ArkFile";
import { FileSignature } from "../model/ArkSignature";
import { Scene } from "../../Scene";

var sdkPathMap: Map<string, string> = new Map();

export function updateSdkConfigPrefix(sdkName: string, sdkRelativePath: string) {
    sdkPathMap.set(sdkName, transfer2UnixPath(sdkRelativePath));
}

export class ImportInfo {
    private importClauseName: string;
    private importType: string;
    private importFrom: string;
    private nameBeforeAs: string | undefined;
    private clauseType: string = "";

    private declaringArkFile: ArkFile;

    private importFromSignature: string | FileSignature = "";
    private importProjectType: string = "ThirdPartPackage";
    private declaringFilePath: string;
    private projectPath: string;

    constructor() {
    }

    public build(importClauseName: string, importType: string, importFrom: string, nameBeforeAs?: string) {
        this.setImportClauseName(importClauseName);
        this.setImportType(importType);
        this.setImportFrom(importFrom);
        this.setNameBeforeAs(nameBeforeAs);
    }

    public getImportFromSignature() {
        return this.importFromSignature;
    }

    public getImportProjectType() {
        return this.importProjectType;
    }

    public setImportProjectType(importProjectType: string) {
        this.importProjectType = importProjectType;
    }

    public setDeclaringFilePath(declaringFilePath: string) {
        this.declaringFilePath = declaringFilePath;
    }

    public setDeclaringArkFile(declaringArkFile: ArkFile) {
        this.declaringArkFile = declaringArkFile;
    }

    public setProjectPath(projectPath: string) {
        this.projectPath = projectPath;
    }

    public setImportFromSignature() {
        let importFromSignature = new FileSignature();
        // project internal imports
        const pathReg1 = new RegExp("^(\\.\\.\\/\|\\.\\/)");
        if (pathReg1.test(this.importFrom)) {
            this.setImportProjectType("TargetProject");
            //get real target path of importfrom
            let realImportFromPath = path.resolve(path.dirname(this.declaringFilePath), this.importFrom);
            //get relative path from project dir to real target path of importfrom
            let tmpSig1 = path.relative(this.projectPath, realImportFromPath);
            //tmpSig1 = tmpSig1.replace(/^\.\//, '');
            importFromSignature.setFileName(tmpSig1);
            importFromSignature.setProjectName(this.declaringArkFile.getProjectName());
            this.importFromSignature = importFromSignature;
            return;
        }

        // external imports, e.g. @ohos., @kit.
        sdkPathMap.forEach((value, key) => {
            // e.g. @ohos., @kit.
            if (key == 'etsSdk') {
                const pathReg2 = new RegExp(`@ohos\\.`);
                const pathReg3 = new RegExp(`@kit\\.`);
                let tmpSig = '';
                if (pathReg2.test(this.importFrom)) {
                    tmpSig = '@etsSdk/api/' + this.importFrom + ': ';
                }
                else if (pathReg3.test(this.importFrom)) {
                    tmpSig = '@etsSdk/kits/' + this.importFrom + ': ';
                }
                this.setImportProjectType("SDKProject");
                this.importFromSignature = tmpSig;
                return;
            }
            else {
                const pathReg4 = new RegExp(`@(${key})\\/`);
                if (pathReg4.test(this.importFrom)) {
                    this.setImportProjectType("SDKProject");
                    this.importFromSignature = this.importFrom + ': ';
                    return;
                }
            }
        });
        // path map
        // start with '@', but not in sdk, defined in oh-package.json5
        const ohPkgReg = new RegExp('^@');
        if (ohPkgReg.test(this.importFrom)) {
            let originImportPath: string = getOriginPath(this.importFrom, this.declaringArkFile);
            if (originImportPath != '') {
                this.setImportProjectType("TargetProject");
                const relativeImportPath: string = path.relative(this.projectPath, originImportPath);
                importFromSignature.setFileName(relativeImportPath);
                importFromSignature.setProjectName(this.declaringArkFile.getProjectName());
                this.importFromSignature = importFromSignature.toString();
                return;
            }
        }
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
    } else {
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
        let importClauseName = node.importClause.name.text;
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
                    let importClauseName = element.name.text;
                    if (element.propertyName && ts.isIdentifier(element.propertyName)) {
                        let importInfo = new ImportInfo();
                        importInfo.build(importClauseName, importType, importFrom, element.propertyName.text);
                        importInfos.push(importInfo);
                    } else {
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
            let importClauseName = node.importClause.namedBindings.name.text;
            let importInfo = new ImportInfo();
            let nameBeforeAs = '*';
            importInfo.build(importClauseName, importType, importFrom, nameBeforeAs);
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
        let importClauseName = node.name.text;
        let importInfo = new ImportInfo()
        importInfo.build(importClauseName, importType, importFrom);
        importInfos.push(importInfo);
    }
    return importInfos;
}

function getOriginPath(importFrom: string, arkFile: ArkFile) {
    let res = '';
    const scene: Scene = arkFile.getScene();
    const ohPkgFiles: string[] = arkFile.getOhPackageJson5Path();
    for (let i = ohPkgFiles.length - 1; i >= 0; i--) {
        let ohPkgContentMap = scene.getOhPkgContentMap();
        let info = ohPkgContentMap.get(ohPkgFiles[i]);
        if (info != undefined) {
            return ohPkgMatch(info.dependencies, importFrom, ohPkgFiles[i], ohPkgContentMap);
        }
    }
    return res;
}

function ohPkgMatch(dependencies: unknown, importFrom: string, ohFilePath: string,
    ohPkgContentMap: Map<string, { [k: string]: unknown }>): string {
    let originPath = '';
    if (!fs.statSync(ohFilePath).isDirectory()) {
        ohFilePath = path.dirname(ohFilePath);
    }
    if (dependencies instanceof Object) {
        Object.entries(dependencies).forEach(([k, v]) => {
            if (importFrom.startsWith(k)) {
                const pattern = new RegExp("^(\\.\\.\\/\|\\.\\/)");
                if (typeof (v) === 'string') {
                    if (pattern.test(v)) {
                        originPath = path.join(ohFilePath, v);
                    }
                    else if (v.startsWith('file:')) {
                        originPath = path.join(ohFilePath, v.replace(/^file:/, ''));
                    }
                    // check originPath: file? dir? hap? etc.
                    if ((fs.existsSync(originPath)) && (fs.statSync(originPath).isDirectory())) {
                        let info = ohPkgContentMap.get(path.join(originPath, 'oh-package.json5'));
                        if (info != undefined) {
                            let fileName = info.main;
                            if (typeof (fileName) === 'string') {
                                originPath = path.join(originPath, fileName);
                            }
                        }
                    }
                }
            }
        });
    }
    return originPath;
}