import * as ts from "typescript";
import {ImportInfo} from "./ImportBuilder";
import {LineColPosition} from "../base/Position";

export class ExportInfo {
    exportClauseName: string;
    exportClauseType: string;
    exportFrom: string | undefined;
    nameBeforeAs: string | undefined;
    declaringSignature: string;
    isDefault: boolean = false;
    importInfo: ImportInfo | undefined;

    private originTsPosition: LineColPosition;
    private tsSourceCode: string;

    constructor() {
    }

    public build(exportClauseName: string, exportClauseType: string, originTsPosition: LineColPosition, exportFrom?: string, nameBeforeAs?: string) {
        this.setExportClauseName(exportClauseName);
        this.setExportClauseType(exportClauseType);
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
            importInfo.build(this.exportClauseName, this.exportClauseType, this.exportFrom, this.originTsPosition, this.nameBeforeAs);
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

export function buildExportInfo4ExportNode(node: ts.ExportDeclaration | ts.ExportAssignment, sourceFile: ts.SourceFile): ExportInfo[] {
    if (ts.isExportDeclaration(node)) {
        return buildExportDeclarationNode(node, sourceFile);
    } else {
        return buildExportAssignmentNode(node, sourceFile);
    }
}

function buildExportDeclarationNode(node: ts.ExportDeclaration, sourceFile: ts.SourceFile): ExportInfo[] {
    const originTsPosition = LineColPosition.buildFromNode(node, sourceFile);
    const tsSourceCode = node.getText(sourceFile);

    let exportInfos: ExportInfo[] = [];
    let exportFrom: string | undefined;
    if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
        exportFrom = node.moduleSpecifier.text;
    }

    // just like: export {xxx as x} from './yy'
    if (node.exportClause && ts.isNamedExports(node.exportClause) && node.exportClause.elements) {
        let exportClauseType = "NamedExports";
        node.exportClause.elements.forEach((element) => {
            let exportClauseName = element.name.text;
            if (element.propertyName && ts.isIdentifier(element.propertyName)) {
                let exportInfo = new ExportInfo();
                exportInfo.build(exportClauseName, exportClauseType, originTsPosition, exportFrom, element.propertyName.text);
                exportInfo.setTsSourceCode(tsSourceCode);
                exportInfos.push(exportInfo);
            } else {
                let exportInfo = new ExportInfo();
                exportInfo.build(exportClauseName, exportClauseType, originTsPosition, exportFrom);
                exportInfo.setTsSourceCode(tsSourceCode);
                exportInfos.push(exportInfo);
            }
        });
    }
    // just like: export * as xx from './yy'
    if (node.exportClause && ts.isNamespaceExport(node.exportClause)) {
        let exportClauseType = "NamespaceExport";
        if (ts.isIdentifier(node.exportClause.name)) {
            let exportClauseName = node.exportClause.name.text;
            let nameBeforeAs = '*';
            let exportInfo = new ExportInfo();
            exportInfo.build(exportClauseName, exportClauseType, originTsPosition, exportFrom, nameBeforeAs);
            exportInfo.setTsSourceCode(tsSourceCode);
            exportInfos.push(exportInfo);
        }

    }

    // TODO: consider again
    // just like: export * from './yy'
    if (!node.exportClause && node.moduleSpecifier) {
        let exportClauseType = "NamespaceExport";
        let exportClauseName = '*';
        let exportInfo = new ExportInfo();
        exportInfo.build(exportClauseName, exportClauseType, originTsPosition, exportFrom);
        exportInfo.setTsSourceCode(tsSourceCode);
        exportInfos.push(exportInfo);
    }

    return exportInfos;
}

function buildExportAssignmentNode(node: ts.ExportAssignment, sourceFile: ts.SourceFile): ExportInfo[] {
    const originTsPosition = LineColPosition.buildFromNode(node, sourceFile);
    const tsSourceCode = node.getText(sourceFile);

    let exportInfos: ExportInfo[] = [];
    if (node.expression) {
        if (ts.isIdentifier(node.expression)) {
            let exportClauseType = "default";
            let exportClauseName = node.expression.text;
            let exportInfo = new ExportInfo();
            exportInfo.build(exportClauseName, exportClauseType, originTsPosition);
            exportInfo.setTsSourceCode(tsSourceCode);
            exportInfos.push(exportInfo);
        } else if (ts.isObjectLiteralExpression(node.expression) && node.expression.properties) {
            let exportClauseType = "default-Obj";
            node.expression.properties.forEach((property) => {
                if (property.name && ts.isIdentifier(property.name)) {
                    let exportClauseName = property.name.text;
                    let exportInfo = new ExportInfo();
                    exportInfo.build(exportClauseName, exportClauseType, originTsPosition);
                    exportInfo.setTsSourceCode(tsSourceCode);
                    exportInfos.push(exportInfo);
                }
            });
        }
    }

    return exportInfos;
}