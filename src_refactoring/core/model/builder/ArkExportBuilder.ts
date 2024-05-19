import * as ts from "typescript";
import {LineColPosition} from "../../base/Position";
import { ExportInfo } from "../ArkExport";
import { Decorator } from "../../base/Decorator";
import { buildModifiers } from "./builderUtils";

export function buildExportInfo(node: ts.Statement, sourceFile: ts.SourceFile): ExportInfo[] {
    if (ts.isExportDeclaration(node)) {
        return buildExportDeclarationNode(node, sourceFile);
    }
    else if (ts.isExportAssignment(node)) {
        return buildExportAssignmentNode(node, sourceFile);
    }
    return [];
}

function buildExportDeclarationNode(node: ts.ExportDeclaration, sourceFile: ts.SourceFile): ExportInfo[] {
    const originTsPosition = LineColPosition.buildFromNode(node, sourceFile);
    const tsSourceCode = node.getText(sourceFile);

    let exportInfos: ExportInfo[] = [];
    let exportFrom: string | undefined;
    if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
        exportFrom = node.moduleSpecifier.text;
    }

    const modifiers: Set<string | Decorator> = new Set<string | Decorator>()
    if (node.modifiers) {
        buildModifiers(node.modifiers, sourceFile).forEach((modifier) => {
            modifiers.add(modifier);
        });
    }

    // just like: export {xxx as x} from './yy'
    if (node.exportClause && ts.isNamedExports(node.exportClause) && node.exportClause.elements) {
        let exportClauseType = "NamedExports";
        node.exportClause.elements.forEach((element) => {
            let exportClauseName = element.name.text;
            if (element.propertyName && ts.isIdentifier(element.propertyName)) {
                let exportInfo = new ExportInfo();
                exportInfo.build(exportClauseName, exportClauseType, originTsPosition, modifiers, exportFrom, element.propertyName.text);
                exportInfo.setTsSourceCode(tsSourceCode);
                exportInfos.push(exportInfo);
            } else {
                let exportInfo = new ExportInfo();
                exportInfo.build(exportClauseName, exportClauseType, originTsPosition, modifiers, exportFrom);
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
            exportInfo.build(exportClauseName, exportClauseType, originTsPosition, modifiers, exportFrom, nameBeforeAs);
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
        exportInfo.build(exportClauseName, exportClauseType, originTsPosition, modifiers, exportFrom);
        exportInfo.setTsSourceCode(tsSourceCode);
        exportInfos.push(exportInfo);
    }

    return exportInfos;
}

function buildExportAssignmentNode(node: ts.ExportAssignment, sourceFile: ts.SourceFile): ExportInfo[] {
    const originTsPosition = LineColPosition.buildFromNode(node, sourceFile);
    const tsSourceCode = node.getText(sourceFile);

    let exportInfos: ExportInfo[] = [];
    const modifiers: Set<string | Decorator> = new Set<string | Decorator>()
    if (node.modifiers) {
        buildModifiers(node.modifiers, sourceFile).forEach((modifier) => {
            modifiers.add(modifier);
        });
    }
    if (node.expression) {
        if (ts.isIdentifier(node.expression)) {
            let exportClauseType = "default";
            let exportClauseName = node.expression.text;
            let exportInfo = new ExportInfo();
            exportInfo.build(exportClauseName, exportClauseType, originTsPosition, modifiers);
            exportInfo.setTsSourceCode(tsSourceCode);
            exportInfos.push(exportInfo);
        } else if (ts.isObjectLiteralExpression(node.expression) && node.expression.properties) {
            let exportClauseType = "default-Obj";
            node.expression.properties.forEach((property) => {
                if (property.name && ts.isIdentifier(property.name)) {
                    let exportClauseName = property.name.text;
                    let exportInfo = new ExportInfo();
                    exportInfo.build(exportClauseName, exportClauseType, originTsPosition, modifiers);
                    exportInfo.setTsSourceCode(tsSourceCode);
                    exportInfos.push(exportInfo);
                }
            });
        }
    }

    return exportInfos;
}