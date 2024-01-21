import * as ts from "typescript";

export class ExportInfo {
    exportClauseName: string;
    exportClauseType: string;
    exportFrom: string | undefined;
    nameBeforeAs: string | undefined;
    constructor(exportClauseName: string, exportClauseType: string, exportFrom?: string, nameBeforeAs?: string) {
        this.exportClauseName = exportClauseName;
        this.exportClauseType = exportClauseType;
        this.exportFrom = exportFrom;
        this.nameBeforeAs = nameBeforeAs;
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
                exportInfos.push(new ExportInfo(exportClauseName, exportClauseType,
                    exportFrom, element.propertyName.escapedText.toString()));
            }
            else {
                exportInfos.push(new ExportInfo(exportClauseName, exportClauseType, exportFrom));
            }
        });
    }
    // just like: export * as xx from './yy'
    if (node.exportClause && ts.isNamespaceExport(node.exportClause)) {
        let exportClauseType = "NamespaceExport";
        if (ts.isIdentifier(node.exportClause.name)) {
            let exportClauseName = node.exportClause.name.escapedText.toString();
            let nameBeforeAs = '*';
            exportInfos.push(new ExportInfo(exportClauseName, exportClauseType, exportFrom, nameBeforeAs));
        }

    }

    // TODO: consider again
    // just like: export * from './yy'
    if (!node.exportClause && node.moduleSpecifier) {
        let exportClauseType = "NamespaceExport";
        let exportClauseName = '*';
        exportInfos.push(new ExportInfo(exportClauseName, exportClauseType, exportFrom));
    }

    return exportInfos;
}

function buildExportAssignmentNode(node: ts.ExportAssignment): ExportInfo[] {
    let exportInfos: ExportInfo[] = [];
    if (node.expression) {
        if (ts.isIdentifier(node.expression)) {
            let exportClauseType = "default";
            let exportClauseName = node.expression.escapedText.toString();
            exportInfos.push(new ExportInfo(exportClauseName, exportClauseType));
        }
        else if (ts.isObjectLiteralExpression(node.expression) && node.expression.properties) {
            let exportClauseType = "default-Obj";
            node.expression.properties.forEach((property) => {
                if (property.name && ts.isIdentifier(property.name)) {
                    let exportClauseName = property.name.escapedText.toString();
                    exportInfos.push(new ExportInfo(exportClauseName, exportClauseType));
                }
            });
        }
    }

    return exportInfos;
}