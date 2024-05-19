import { NodeA } from "../../base/Ast";
import { LineColPosition } from "../../base/Position";
import { ExportInfo } from "../ArkExport";
import { buildDefaultArkClassFromArkNamespace, buildNormalArkClassFromArkNamespace } from "./ArkClassBuilder";
import { ArkFile } from "../ArkFile";
import { buildArkMethodFromArkClass } from "./ArkMethodBuilder";
import ts from "typescript";
import { ArkNamespace } from "../ArkNamespace";
import { buildModifiers } from "./builderUtils";
import Logger from "../../../utils/logger";
import { buildExportInfo } from "./ArkExportBuilder";
import { ArkClass } from "../ArkClass";
import { ArkMethod } from "../ArkMethod";
import { Decorator } from "../../base/Decorator";

const logger = Logger.getLogger();

export function buildArkNamespace(node: ts.ModuleDeclaration, declaringInstance: ArkFile | ArkNamespace, ns: ArkNamespace, sourceFile: ts.SourceFile) {
    // ns name
    ns.setName(node.name.text);

    // modifiers
    if (node.modifiers) {
        buildModifiers(node.modifiers, sourceFile).forEach((modifier) => {
            ns.addModifier(modifier);
        });
    }

    if (declaringInstance instanceof ArkFile) {
        ns.setDeclaringType("ArkFile");
        ns.setDeclaringArkFile(declaringInstance);
    } else {
        ns.setDeclaringType("ArkNamespace");
        ns.setDeclaringArkNamespace(declaringInstance);
        ns.setDeclaringArkFile(declaringInstance.getDeclaringArkFile());
    }
    ns.setDeclaringInstance(declaringInstance);

    ns.genNamespaceSignature();

    // TODO: whether needed?
    ns.setCode(node.getText(sourceFile));

    // set line and column
    const { line, character } = ts.getLineAndCharacterOfPosition(
        sourceFile,
        node.getStart(sourceFile)
    );
    ns.setLine(line + 1);
    ns.setColumn(character + 1);

    // TODO
    genDefaultArkClass(ns);

    // build ns member
    if (node.body) {
        if (ts.isModuleBody(node.body)) {
            if (ts.isModuleBlock(node.body)) {
                buildNamespaceMembers(node.body, ns, sourceFile);
            }
            // NamespaceDeclaration extends ModuleDeclaration
            //TODO: Check
            else if (ts.isModuleDeclaration(node.body)) {
                logger.warn("This ModuleBody is an NamespaceDeclaration.");
                let childNs: ArkNamespace = new ArkNamespace();
                buildArkNamespace(node.body, ns, childNs, sourceFile)
            }
            else if (ts.isIdentifier(node.body)) {
                logger.warn("ModuleBody is Identifier.");
            }
            else {
                logger.warn("JSDocNamespaceDeclaration found.");
            }
        }
        else {
            logger.warn("JSDocNamespaceDeclaration found.");
        }
    }
}

// TODO: check and update
function buildNamespaceMembers(node: ts.ModuleBlock, namespace: ArkNamespace, sourceFile: ts.SourceFile) {
    const statements = node.statements;
    statements.forEach((child) => {
        if (
            ts.isModuleDeclaration(child)
            //child.kind === ts.SyntaxKind.ModuleDeclaration
        ) {
            let childNs: ArkNamespace = new ArkNamespace();
            childNs.setDeclaringArkNamespace(namespace);
            childNs.setDeclaringArkFile(namespace.getDeclaringArkFile());

            buildArkNamespace(child, namespace, childNs, sourceFile);
            namespace.addNamespace(childNs);

            if (childNs.isExported()) {
                let isDefault = childNs.getModifiers().has("DefaultKeyword");
                addExportInfo(childNs, namespace, isDefault);
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

            buildNormalArkClassFromArkNamespace(child, namespace, cls, sourceFile);
            namespace.addArkClass(cls);

            if (cls.isExported()) {
                let isDefault = cls.getModifiers().has("DefaultKeyword");
                addExportInfo(cls, namespace, isDefault);
            }
        }
        // TODO: Check
        else if (ts.isMethodDeclaration(child)) {
            logger.warn("This is a MethodDeclaration in ArkNamespace.");
            let mthd: ArkMethod = new ArkMethod();

            buildArkMethodFromArkClass(child, namespace.getDefaultClass(), mthd, sourceFile);
            namespace.getDefaultClass().addMethod(mthd);

            if (mthd.isExported()) {
                let isDefault = mthd.getModifiers().has("DefaultKeyword");
                addExportInfo(mthd, namespace, isDefault);
            }
        }
        else if (ts.isFunctionDeclaration(child)) {
            let mthd: ArkMethod = new ArkMethod();

            buildArkMethodFromArkClass(child, namespace.getDefaultClass(), mthd, sourceFile);
            namespace.getDefaultClass().addMethod(mthd);

            if (mthd.isExported()) {
                let isDefault = mthd.getModifiers().has("DefaultKeyword");
                addExportInfo(mthd, namespace, isDefault);
            }
        }
        else if (
            ts.isExportAssignment(child) ||
            ts.isExportDeclaration(child)
            //child.kind === ts.SyntaxKind.ExportAssignment ||
            //child.kind === ts.SyntaxKind.ExportDeclaration
        ) {
            let exportInfos = buildExportInfo(child, sourceFile);
            exportInfos.forEach((element) => {
                if (element.getModifiers().has("DefaultKeyword")) {
                    element.setDefault(true);
                }

                let elementImportInfo = element.getImportInfo();
                if (elementImportInfo) {
                    let arkFile = namespace.getDeclaringArkFile();
                    elementImportInfo.setDeclaringFilePath(arkFile.getFilePath());
                    elementImportInfo.setProjectPath(arkFile.getProjectDir());
                    elementImportInfo.setDeclaringArkFile(arkFile);

                    elementImportInfo.setImportFromSignature();
                    arkFile.addImportInfos(elementImportInfo);
                }

                namespace.addExportInfo(element);
            });
        }
        else {
            logger.info('Child joined default method of arkFile: ', ts.SyntaxKind[child.kind]);
            // join default method
        }
    });
}

function genDefaultArkClass(ns: ArkNamespace) {
    let defaultClass = new ArkClass();

    buildDefaultArkClassFromArkNamespace(ns, defaultClass);
    ns.setDefaultClass(defaultClass);
    ns.addArkClass(defaultClass);
}

// function findIndicatedChild(node: NodeA, childType: string): NodeA | null {
//     for (let child of node.children) {
//         if (child.kind == childType) {
//             return child;
//         }
//     }
//     return null;
// }

// function processExportValAndFirstNode(node: NodeA, ns: ArkNamespace, isDefault: boolean): void {
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

//     ns.addExportInfo(exportInfo);
// }

function addExportInfo(arkInstance: ArkMethod | ArkClass | ArkNamespace, ns: ArkNamespace, isDefault: boolean) {
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

    ns.addExportInfo(exportInfo);
}