import * as ts from "typescript";
import path from 'path';
import fs from 'fs';
import { transfer2UnixPath } from "../../utils/pathTransfer";
import { ArkFile } from "./ArkFile";
import { FileSignature } from "./ArkSignature";
import { Scene } from "../../Scene";
import { LineColPosition } from "../base/Position";
import { getOriginPath } from "./builder/arkImportBuilder";
import { Decorator } from "../base/Decorator";

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
    private modifiers: Set<string | Decorator> = new Set<string | Decorator>();

    private declaringArkFile: ArkFile;

    private importFromSignature: string | FileSignature = "";
    private importProjectType: string = "ThirdPartPackage";
    private declaringFilePath: string;
    private projectPath: string;

    private originTsPosition: LineColPosition;
    private tsSourceCode: string;

    constructor() {
    }

    public build(importClauseName: string, importType: string, importFrom: string, originTsPosition: LineColPosition,
        modifiers: Set<string | Decorator>, nameBeforeAs?: string) {
        this.setImportClauseName(importClauseName);
        this.setImportType(importType);
        this.setImportFrom(importFrom);
        this.setOriginTsPosition(originTsPosition);
        modifiers.forEach((modifier) => {
            this.addModifier(modifier);
        });
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
                } else if (pathReg3.test(this.importFrom)) {
                    tmpSig = '@etsSdk/kits/' + this.importFrom + ': ';
                }
                this.setImportProjectType("SDKProject");
                this.importFromSignature = tmpSig;
                return;
            } else {
                const pathReg4 = new RegExp(`@(${key})\\/`);
                if (pathReg4.test(this.importFrom)) {
                    this.setImportProjectType("SDKProject");
                    this.importFromSignature = this.importFrom + ': ';
                    return;
                }
            }
        });
        // path map defined in oh-package.json5
        // const ohPkgReg = new RegExp('^@');
        //if (ohPkgReg.test(this.importFrom)) {
        let originImportPath: string = getOriginPath(this.importFrom, this.declaringArkFile);
        if (originImportPath != '') {
            this.setImportProjectType("TargetProject");
            const relativeImportPath: string = path.relative(this.projectPath, originImportPath);
            importFromSignature.setFileName(relativeImportPath);
            importFromSignature.setProjectName(this.declaringArkFile.getProjectName());
            this.importFromSignature = importFromSignature.toString();
            return;
        }
        //}
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

    public getModifiers() {
        return this.modifiers;
    }

    public addModifier(name: string | Decorator) {
        this.modifiers.add(name);
    }

    private transfer2UnixPath(path2Do: string) {
        return path.posix.join(...path2Do.split(/\\/));
    }

    public setOriginTsPosition(originTsPosition: LineColPosition): void {
        this.originTsPosition = originTsPosition;
    }

    public getOriginTsPosition(): LineColPosition {
        return this.originTsPosition;
    }

    public setTsSourceCode(tsSourceCode: string): void {
        this.tsSourceCode = tsSourceCode;
    }

    public getTsSourceCode(): string {
        return this.tsSourceCode;
    }
}
