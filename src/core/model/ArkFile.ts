import fs from 'fs';
import path from 'path';
import { ArkClass } from "./ArkClass";
import { ArkMethod } from "./ArkMethod";
import { NodeA, ASTree } from "../base/Ast";
import { ArkNamespace } from "./ArkNamespace";
import { ClassSignature, MethodSignature, methodSignatureCompare, classSignatureCompare } from "./ArkSignature";
import { ExportInfo } from '../common/ExportBuilder';
import { ImportInfo } from '../common/ImportBuilder';
import { Scene } from '../../Scene';

/**
 * 
 */
export class ArkFile {
    name: string;
    projectDir: string;
    code: string;
    ast: ASTree;
    methods: ArkMethod[] = [];
    classes: ArkClass[] = [];
    defaultClass!: ArkClass;
    nameSpaces: ArkNamespace[] = [];
    importInfos: ImportInfo[] = [];
    exportInfos: ExportInfo[] = [];

    scene:Scene|null=null;

    constructor(file: string, projectDir: string) {
        this.name = path.relative(projectDir, file);//use relative path
        this.projectDir = projectDir;
        this.code = fs.readFileSync(file, 'utf8');
        this.ast = new ASTree(this.code);
        this.genDefaultArkClass();
        this.buildArkFile();
        this.collectAllMethods();
    }

    private genDefaultArkClass() {
        this.defaultClass = new ArkClass(this.ast.root, this);
        this.classes.push(this.defaultClass);
    }

    private processExportValAndFirstNode(node: NodeA): void {
        let exportClauseName: string = '';
        let exportClauseType: string = node.kind;
        let cld = this.findIndicatedChild(node, 'VariableDeclarationList');
        if (cld) {
            let c = this.findIndicatedChild(cld, 'SyntaxList');
            if (c) {
                let cc = this.findIndicatedChild(c, 'VariableDeclaration');
                if (cc) {
                    let ccc = this.findIndicatedChild(cc, 'Identifier');
                    if (ccc) {
                        exportClauseName = ccc.text;
                    }
                }
            }
        }
        this.exportInfos.push(new ExportInfo(exportClauseName, exportClauseType));
    }

    private findIndicatedChild(node: NodeA, childType: string): NodeA | null {
        for (let child of node.children) {
            if (child.kind == childType) {
                return child;
            }
        }
        return null;
    }

    // TODO: check and update
    private buildArkFile() {
        let children = this.ast.root?.children;
        for (let child of children) {
            //else if (child.kind == 'NamespaceKeyword') {
            //    let ns: ArkNamespace = new ArkNamespace(child, this);
            //    this.nameSpaces.push(ns);
            //}
            if (child.kind == 'ClassDeclaration') {
                let cls: ArkClass = new ArkClass(child, this);
                this.classes.push(cls);
                if (cls.isExported) {
                    let exportClauseName: string = cls.name;
                    let exportClauseType: string = "Class";
                    this.exportInfos.push(new ExportInfo(exportClauseName, exportClauseType));
                }
            }
            if (child.kind == 'FunctionDeclaration' || child.kind == 'GetAccessor' || child.kind == 'SetAccessor') {
                let mthd: ArkMethod = new ArkMethod(child, this, this.defaultClass);
                this.defaultClass.methods.push(mthd);
                if (mthd.isExported) {
                    let exportClauseName: string = mthd.name;
                    let exportClauseType: string = "Method";
                    this.exportInfos.push(new ExportInfo(exportClauseName, exportClauseType));
                }
            }
            if (child.kind == 'ImportDeclaration' || child.kind == 'ImportEqualsDeclaration') {
                //this.processImportDeclarationNode(child);
                child.importNodeInfo?.forEach((element) => {
                    this.importInfos.push(element);
                });
            }
            if (child.kind == 'ExportDeclaration' || child.kind == 'ExportAssignment') {
                //this.processExportDeclarationNode(child);
                child.exportNodeInfo?.forEach((element) => {
                    this.exportInfos.push(element);
                });
            }
            if (child.kind == 'VariableStatement' || child.kind == 'FirstStatement') {
                //check ExportKeyword
                let childSyntaxNode = this.findIndicatedChild(child, 'SyntaxList');
                if (childSyntaxNode) {
                    if (this.findIndicatedChild(childSyntaxNode, 'ExportKeyword')) {
                        this.processExportValAndFirstNode(child);
                    }
                }
            }
        }
    }

    public getNamespaces(): ArkNamespace[] {
        return this.nameSpaces;
    }

    public getClasses(): ArkClass[] {
        return this.classes;
    }

    public getClass(classSignature: ClassSignature): ArkClass | null {
        let cls = this.classes.find((obj) => {
            return classSignatureCompare(obj.classSignature, classSignature);
        })
        if (cls) {
            return cls;
        }
        return null;
    }

    public collectAllMethods() {
        this.classes.forEach((cls) => {
            cls.methods.forEach((mtd) => {
                this.methods.push(mtd);
            });
        });
    }

    public getMethods(): ArkMethod[] {
        return this.methods;
    }

    //TODO: err handle
    public getMethod(methodSignature: MethodSignature): ArkMethod | null {
        if (methodSignature.arkClass.classType) {
            let arkCls = this.getClass(methodSignature.arkClass);
            if (arkCls) {
                return arkCls.getMethod(methodSignature.methodSubSignature);
            }
            else {
                throw new Error('MethodSignature wrong. No ArkClass found.');
            }
        }
        else {
            let mtd = this.methods.find((obj) => {
                return methodSignatureCompare(obj.methodSignature, methodSignature);
            })
            if (mtd) {
                return mtd;
            }
        }
        return null;
    }
}