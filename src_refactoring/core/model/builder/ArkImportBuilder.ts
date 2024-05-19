import * as ts from "typescript";
import path from 'path';
import fs from 'fs';
import { transfer2UnixPath } from "../../../utils/pathTransfer";
import { ArkFile } from "../ArkFile";
import { Scene } from "../../../Scene";
import { LineColPosition } from "../../base/Position";
import { ImportInfo } from "../ArkImport";
import { buildModifiers } from "./builderUtils";
import { Decorator } from "../../base/Decorator";

export function buildImportInfo(node: ts.ImportEqualsDeclaration | ts.ImportDeclaration, sourceFile: ts.SourceFile): ImportInfo[] {
    if (ts.isImportDeclaration(node)) {
        return buildImportDeclarationNode(node, sourceFile);
    }
    else if (ts.isImportEqualsDeclaration(node)) {
        return buildImportEqualsDeclarationNode(node, sourceFile);
    }
    return [];
}

function buildImportDeclarationNode(node: ts.ImportDeclaration, sourceFile: ts.SourceFile): ImportInfo[] {
    const originTsPosition = LineColPosition.buildFromNode(node, sourceFile);
    const tsSourceCode = node.getText(sourceFile);

    let importInfos: ImportInfo[] = [];
    let importFrom: string = '';
    if (ts.isStringLiteral(node.moduleSpecifier)) {
        importFrom = node.moduleSpecifier.text;
    }

    const modifiers: Set<string | Decorator> = new Set<string | Decorator>()
    if (node.modifiers) {
        buildModifiers(node.modifiers, sourceFile).forEach((modifier) => {
            modifiers.add(modifier);
        });
    }

    // just like: import '../xxx'
    if (!node.importClause) {
        let importClauseName = '';
        let importType = '';
        let importInfo = new ImportInfo();
        importInfo.build(importClauseName, importType, importFrom, originTsPosition, modifiers);
        importInfo.setTsSourceCode(tsSourceCode);
        importInfos.push(importInfo);
    }

    //just like: import fs from 'fs'
    if (node.importClause && node.importClause.name && ts.isIdentifier(node.importClause.name)) {
        let importClauseName = node.importClause.name.text;
        let importType = "Identifier";
        let importInfo = new ImportInfo();
        importInfo.build(importClauseName, importType, importFrom, originTsPosition, modifiers);
        importInfo.setTsSourceCode(tsSourceCode);
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
                        importInfo.build(importClauseName, importType, importFrom, originTsPosition, modifiers, element.propertyName.text);
                        importInfo.setTsSourceCode(tsSourceCode);
                        importInfos.push(importInfo);
                    } else {
                        let importInfo = new ImportInfo();
                        importInfo.build(importClauseName, importType, importFrom, originTsPosition, modifiers);
                        importInfo.setTsSourceCode(tsSourceCode);
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
            importInfo.build(importClauseName, importType, importFrom, originTsPosition, modifiers, nameBeforeAs);
            importInfo.setTsSourceCode(tsSourceCode);
            importInfos.push(importInfo);
        }
    }

    return importInfos;
}

function buildImportEqualsDeclarationNode(node: ts.ImportEqualsDeclaration, sourceFile: ts.SourceFile): ImportInfo[] {
    const originTsPosition = LineColPosition.buildFromNode(node, sourceFile);
    const tsSourceCode = node.getText(sourceFile);

    let importInfos: ImportInfo[] = [];
    let importType = "EqualsImport";
    const modifiers: Set<string | Decorator> = new Set<string | Decorator>()
    if (node.modifiers) {
        buildModifiers(node.modifiers, sourceFile).forEach((modifier) => {
            modifiers.add(modifier);
        });
    }
    if (node.moduleReference && ts.isExternalModuleReference(node.moduleReference) &&
        node.moduleReference.expression && ts.isStringLiteral(node.moduleReference.expression)) {
        let importFrom = node.moduleReference.expression.text;
        let importClauseName = node.name.text;
        let importInfo = new ImportInfo()
        importInfo.build(importClauseName, importType, importFrom, originTsPosition, modifiers);
        importInfo.setTsSourceCode(tsSourceCode);
        importInfos.push(importInfo);
    }
    return importInfos;
}

export function getOriginPath(importFrom: string, arkFile: ArkFile) {
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
                    } else if (v.startsWith('file:')) {
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