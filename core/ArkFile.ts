import fs from 'fs';

import { ArkClass } from "./ArkClass";
import { ArkMethod } from "./ArkMethod";
import { Statement } from "./base/Stmt";
import { NodeA, ASTree } from "./base/Ast";
import { ArkNamespace } from "./ArkNamespace";

/**
 * 
 */
export class ArkFile {
    name: string;
    code: string;
    ast: ASTree;
    importStmts: Statement[] = [];
    methods: ArkMethod[] = [];
    classes: ArkClass[] = [];
    nameSpaces: ArkNamespace[] = [];

    constructor(file: string) {
        this.name = file;
        this.code = fs.readFileSync(file, 'utf8');
        this.ast = new ASTree(this.code);
        this.buildArkFile();
    }

    // TODO: check and update
    private buildArkFile() {
        let children = this.ast.root?.children;
        for (let child of children) {
            if (child.kind == 'ImportDeclaration') {
                //
            }
            else if (child.kind == 'NamespaceKeyword') {
                let name: string = 'nsName';
                let ns: ArkNamespace = new ArkNamespace(name, child);
                this.nameSpaces.push(ns);
            }
            else if (child.kind == 'ClassDeclaration') {
                let name: string = 'clsName';
                let cls: ArkClass = new ArkClass(name, child);
                this.classes.push(cls);
            }
            else if (child.kind == 'FunctionDeclaration') {
                let name: string = 'mthdName';//TODO
                let mthd: ArkMethod = new ArkMethod(name, child);
                this.methods.push(mthd);
            }
        }
    }

    public getImportStmts(): Statement[] {
        return this.importStmts;
    }

    public getNamespaces(): ArkNamespace[] {
        return this.nameSpaces;
    }

    public getClasses(): ArkClass[] {
        return this.classes;
    }

    public getMethods(): ArkMethod[] {
        return this.methods;
    }
}