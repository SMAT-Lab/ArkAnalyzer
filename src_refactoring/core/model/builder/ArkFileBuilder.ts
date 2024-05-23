import fs from 'fs';
import path from 'path';
import ts from 'typescript';
import { ArkFile } from '../ArkFile';
import { ArkNamespace } from '../ArkNamespace';
import Logger from "../../../utils/logger";
import { buildDefaultArkClassFromArkFile, buildNormalArkClassFromArkFile } from './ArkClassBuilder';
import { buildArkMethodFromArkClass } from './ArkMethodBuilder';
import { buildImportInfo } from './ArkImportBuilder';
import { buildExportInfo } from './ArkExportBuilder';
import { buildArkNamespace } from './ArkNamespaceBuilder';
import { ArkClass } from '../ArkClass';
import { ArkMethod } from '../ArkMethod';
import { LineColPosition } from '../../base/Position';
import { ExportInfo } from '../ArkExport';

const logger = Logger.getLogger();

export const notStmtOrExprKind = ['ModuleDeclaration', 'ClassDeclaration', 'InterfaceDeclaration', 'EnumDeclaration', 'ExportDeclaration',
    'ExportAssignment', 'MethodDeclaration', 'Constructor', 'FunctionDeclaration', 'GetAccessor', 'SetAccessor', 'ArrowFunction',
    'FunctionExpression', 'MethodSignature', 'ConstructSignature', 'CallSignature'];

/**
* Entry of building ArkFile instance
*
* @param arkFile 
* @returns
*/
export function buildArkFileFromFile(absoluteFilePath: string, projectDir: string, arkFile: ArkFile) {
    arkFile.setFilePath(absoluteFilePath);
    arkFile.setProjectDir(projectDir);
    arkFile.setName(path.relative(projectDir, absoluteFilePath));

    arkFile.genFileSignature();

    arkFile.setCode(fs.readFileSync(arkFile.getFilePath(), 'utf8'));
    const sourceFile = ts.createSourceFile(
        "example.ts",
        arkFile.getCode(),
        ts.ScriptTarget.Latest
    );
    genDefaultArkClass(arkFile, sourceFile);
    buildArkFile(arkFile, sourceFile);
}

/**
* Building ArkFile instance
*
* @param arkFile 
* @param astRoot
* @returns
*/
function buildArkFile(arkFile: ArkFile, astRoot: ts.SourceFile) {
    const statements = astRoot.statements;
    statements.forEach((child) => {
        if (
            ts.isModuleDeclaration(child)
            //child.kind === ts.SyntaxKind.ModuleDeclaration
        ) {
            let ns: ArkNamespace = new ArkNamespace();
            ns.setDeclaringArkFile(arkFile);

            buildArkNamespace(child, arkFile, ns, astRoot);
            arkFile.addNamespace(ns);

            if (ns.isExported()) {
                let isDefault = ns.getModifiers().has("DefaultKeyword");
                addExportInfo(ns, arkFile, isDefault);
            }
        }
        else if (
            ts.isClassDeclaration(child) ||
            ts.isInterfaceDeclaration(child) ||
            ts.isEnumDeclaration(child)
            //child.kind === ts.SyntaxKind.ClassDeclaration
            //child.kind === ts.SyntaxKind.InterfaceDeclaration
            //child.kind === ts.SyntaxKind.EnumDeclaration
        ) {
            let cls: ArkClass = new ArkClass();

            buildNormalArkClassFromArkFile(child, arkFile, cls, astRoot);
            arkFile.addArkClass(cls);

            if (cls.isExported()) {
                let isDefault = cls.getModifiers().has("DefaultKeyword");
                addExportInfo(cls, arkFile, isDefault);
            }
        }
        // TODO: Check
        else if (ts.isMethodDeclaration(child)) {
            logger.warn("This is a MethodDeclaration in ArkFile.");
            let mthd: ArkMethod = new ArkMethod();

            buildArkMethodFromArkClass(child, arkFile.getDefaultClass(), mthd, astRoot);
            arkFile.getDefaultClass().addMethod(mthd);

            if (mthd.isExported()) {
                let isDefault = mthd.getModifiers().has("DefaultKeyword");
                addExportInfo(mthd, arkFile, isDefault);
            }
        }
        else if (ts.isFunctionDeclaration(child)) {
            let mthd: ArkMethod = new ArkMethod();

            buildArkMethodFromArkClass(child, arkFile.getDefaultClass(), mthd, astRoot);
            arkFile.getDefaultClass().addMethod(mthd);

            if (mthd.isExported()) {
                let isDefault = mthd.getModifiers().has("DefaultKeyword");
                addExportInfo(mthd, arkFile, isDefault);
            }
        }
        else if (
            ts.isImportEqualsDeclaration(child) ||
            ts.isImportDeclaration(child)
            //child.kind === ts.SyntaxKind.ImportEqualsDeclaration ||
            //child.kind === ts.SyntaxKind.ImportDeclaration
        ) {
            let importInfos = buildImportInfo(child, astRoot);
            importInfos?.forEach((element) => {
                element.setDeclaringFilePath(arkFile.getFilePath());
                element.setProjectPath(arkFile.getProjectDir());
                element.setDeclaringArkFile(arkFile);

                element.setImportFromSignature();
                arkFile.addImportInfos(element);

            });
        }
        else if (
            ts.isExportAssignment(child) ||
            ts.isExportDeclaration(child)
            //child.kind === ts.SyntaxKind.ExportAssignment ||
            //child.kind === ts.SyntaxKind.ExportDeclaration
        ) {
            let exportInfos = buildExportInfo(child, astRoot);
            exportInfos.forEach((element) => {
                if (element.getModifiers().has("DefaultKeyword")) {
                    element.setDefault(true);
                }

                let elementImportInfo = element.getImportInfo();
                if (elementImportInfo) {
                    elementImportInfo.setDeclaringFilePath(arkFile.getFilePath());
                    elementImportInfo.setProjectPath(arkFile.getProjectDir());
                    elementImportInfo.setDeclaringArkFile(arkFile);

                    elementImportInfo.setImportFromSignature();
                    arkFile.addImportInfos(elementImportInfo);
                }

                arkFile.addExportInfos(element);
            });
        }
        else {
            logger.info('Child joined default method of arkFile: ', ts.SyntaxKind[child.kind]);
            // join default method
        }
    });

    // TODO: Check
    // if (child.kind == 'VariableStatement' || child.kind == 'FirstStatement') {
    //     //check ExportKeyword
    //     let childSyntaxNode = findIndicatedChild(child, 'SyntaxList');
    //     let isDefault = findIndicatedChild(child, 'DefaultKeyword') ? true : false;
    //     if (childSyntaxNode) {
    //         if (findIndicatedChild(childSyntaxNode, 'ExportKeyword')) {
    //             processExportValAndFirstNode(child, arkFile, isDefault);
    //         }
    //     }
    // }
}

function genDefaultArkClass(arkFile: ArkFile, astRoot: ts.SourceFile) {
    let defaultClass = new ArkClass();

    buildDefaultArkClassFromArkFile(arkFile, defaultClass, astRoot);
    arkFile.setDefaultClass(defaultClass);
    arkFile.addArkClass(defaultClass);
}

// function findIndicatedChild(node: NodeA, childType: string): NodeA | null {
//     for (let child of node.children) {
//         if (child.kind == childType) {
//             return child;
//         }
//     }
//     return null;
// }

// function processExportValAndFirstNode(node: NodeA, arkFile: ArkFile, isDefault: boolean): void {
//     let exportClauseName: string = '';
//     let exportClauseType: string = node.kind;
//     let cld = findIndicatedChild(node, 'VariableDeclarationList');
//     if (cld) {
//         let c = findIndicatedChild(cld, 'SyntaxList');
//         if (c) {
//             let cc = findIndicatedChild(c, 'VariableDeclaration');
//             if (cc) {
//                 let ccc = findIndicatedChild(cc, 'Identifier');
//                 if (ccc) {
//                     exportClauseName = ccc.text;
//                 }
//             }
//         }
//     }
//     let exportInfo = new ExportInfo();
//     exportInfo.build(exportClauseName, exportClauseType, new LineColPosition(-1, -1));
//     exportInfo.setDefault(isDefault);

//     arkFile.addExportInfos(exportInfo);
// }

function addExportInfo(arkInstance: ArkMethod | ArkClass | ArkNamespace, arkFile: ArkFile, isDefault: boolean) {
    let exportClauseName: string = arkInstance.getName();
    let exportClauseType: string;
    if (arkInstance instanceof ArkMethod) {
        exportClauseType = "Method";
    } else if (arkInstance instanceof ArkClass) {
        exportClauseType = "Class";
    } else {
        exportClauseType = "ArkNamespace";
    }
    const modifiers = arkInstance.getModifiers();
    let exportInfo = new ExportInfo();
    exportInfo.build(exportClauseName, exportClauseType, new LineColPosition(-1, -1), modifiers);
    exportInfo.setDefault(isDefault);
    arkFile.addExportInfos(exportInfo);
}