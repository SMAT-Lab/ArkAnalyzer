import * as ts from "typescript";
import { ImportInfo } from "./ArkImport";
import { LineColPosition } from "../base/Position";
import { Decorator } from "../base/Decorator";

export class ExportInfo {
    exportClauseName: string;
    exportClauseType: string;
    exportFrom: string | undefined;
    nameBeforeAs: string | undefined;
    declaringSignature: string;
    isDefault: boolean = false;
    importInfo: ImportInfo | undefined;
    private modifiers: Set<string | Decorator> = new Set<string | Decorator>();

    private originTsPosition: LineColPosition;
    private tsSourceCode: string;

    constructor() {
    }

    public build(exportClauseName: string, exportClauseType: string, originTsPosition: LineColPosition,
        modifiers: Set<string | Decorator>, exportFrom?: string, nameBeforeAs?: string) {
        this.setExportClauseName(exportClauseName);
        this.setExportClauseType(exportClauseType);
        modifiers.forEach((modifier) => {
            this.addModifier(modifier);
        });
        this.setExportFrom(exportFrom);
        this.setNameBeforeAs(nameBeforeAs);
        this.setOriginTsPosition(originTsPosition);
        this.genImportInfo();
    }

    public getExportClauseName() {
        return this.exportClauseName;
    }

    public setExportClauseName(exportClauseName: string) {
        this.exportClauseName = exportClauseName;
    }

    public getExportClauseType() {
        return this.exportClauseType;
    }

    public setExportClauseType(exportClauseType: string) {
        this.exportClauseType = exportClauseType;
    }

    public getModifiers() {
        return this.modifiers;
    }

    public addModifier(name: string | Decorator) {
        this.modifiers.add(name);
    }

    public getExportFrom() {
        return this.exportFrom;
    }

    public setExportFrom(exportFrom: string | undefined) {
        this.exportFrom = exportFrom;
    }

    public getNameBeforeAs() {
        return this.nameBeforeAs;
    }

    public setNameBeforeAs(nameBeforeAs: string | undefined) {
        this.nameBeforeAs = nameBeforeAs;
    }

    public setDefault(isDefault: boolean) {
        this.isDefault = isDefault;
    }

    public getDefault() {
        return this.isDefault;
    }

    public setImportInfo(importInfo: ImportInfo | undefined) {
        this.importInfo = importInfo;
    }

    public getImportInfo() {
        return this.importInfo;
    }

    private genImportInfo() {
        if (this.exportFrom != undefined) {
            let importInfo = new ImportInfo();
            importInfo.build(this.exportClauseName, this.exportClauseType, this.exportFrom, this.originTsPosition, this.modifiers, this.nameBeforeAs);
            this.setImportInfo(importInfo);
        }
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