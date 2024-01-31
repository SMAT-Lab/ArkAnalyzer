import * as ts from "typescript";

export class ExportInfo {
    exportClauseName: string;
    exportClauseType: string;
    exportFrom: string | undefined;
    nameBeforeAs: string | undefined;
    declaringSignature: string;
    arkSignature: string;

    constructor() { }

    public build(exportClauseName: string, exportClauseType: string, exportFrom?: string, nameBeforeAs?: string) {
        this.setExportClauseName(exportClauseName);
        this.setExportClauseType(exportClauseType);
        this.setExportFrom(exportFrom);
        this.setNameBeforeAs(nameBeforeAs);
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

    public setArkSignature(declaringSignature:string) {
        this.declaringSignature = declaringSignature;
        this.arkSignature = declaringSignature + '.' + this.exportClauseName;
    }

    public getArkSignature() {
        return this.arkSignature;
    }
}

export function buildExportInfo4ExportNode(node: ts.ExportDeclaration | ts.ExportAssignment): ExportInfo[] {
    if (ts.isExportDeclaration(node)) {
        return buildExportDeclarationNode(node);
    }
    else {
        return buildExportAssignmentNode(node);
    }
}

function buildExportDeclarationNode(node: ts.ExportDeclaration): ExportInfo[] {
    let exportInfos: ExportInfo[] = [];
    let exportFrom: string | undefined;
    if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
        exportFrom = node.moduleSpecifier.text;
    }

    // just like: export {xxx as x} from './yy'
    if (node.exportClause && ts.isNamedExports(node.exportClause) && node.exportClause.elements) {
        let exportClauseType = "NamedExports";
        node.exportClause.elements.forEach((element) => {
            let exportClauseName = element.name.escapedText.toString();
            if (element.propertyName && ts.isIdentifier(element.propertyName)) {
                let exportInfo = new ExportInfo();
                exportInfo.build(exportClauseName, exportClauseType, exportFrom, element.propertyName.escapedText.toString());
                exportInfos.push(exportInfo);
            }
            else {
                let exportInfo = new ExportInfo();
                exportInfo.build(exportClauseName, exportClauseType, exportFrom);
                exportInfos.push(exportInfo);
            }
        });
    }
    // just like: export * as xx from './yy'
    if (node.exportClause && ts.isNamespaceExport(node.exportClause)) {
        let exportClauseType = "NamespaceExport";
        if (ts.isIdentifier(node.exportClause.name)) {
            let exportClauseName = node.exportClause.name.escapedText.toString();
            let nameBeforeAs = '*';
            let exportInfo = new ExportInfo();
            exportInfo.build(exportClauseName, exportClauseType, exportFrom, nameBeforeAs);
            exportInfos.push(exportInfo);
        }

    }

    // TODO: consider again
    // just like: export * from './yy'
    if (!node.exportClause && node.moduleSpecifier) {
        let exportClauseType = "NamespaceExport";
        let exportClauseName = '*';
        let exportInfo = new ExportInfo();
        exportInfo.build(exportClauseName, exportClauseType, exportFrom);
        exportInfos.push(exportInfo);
    }

    return exportInfos;
}

function buildExportAssignmentNode(node: ts.ExportAssignment): ExportInfo[] {
    let exportInfos: ExportInfo[] = [];
    if (node.expression) {
        if (ts.isIdentifier(node.expression)) {
            let exportClauseType = "default";
            let exportClauseName = node.expression.escapedText.toString();
            let exportInfo = new ExportInfo();
            exportInfo.build(exportClauseName, exportClauseType);
            exportInfos.push(exportInfo);
        }
        else if (ts.isObjectLiteralExpression(node.expression) && node.expression.properties) {
            let exportClauseType = "default-Obj";
            node.expression.properties.forEach((property) => {
                if (property.name && ts.isIdentifier(property.name)) {
                    let exportClauseName = property.name.escapedText.toString();
                    let exportInfo = new ExportInfo();
                    exportInfo.build(exportClauseName, exportClauseType);
                    exportInfos.push(exportInfo);
                }
            });
        }
    }

    return exportInfos;
}