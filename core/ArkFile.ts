import fs from 'fs';

import { ArkClass } from "./ArkClass";
import { ArkField } from "./ArkField";
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

    public buildArkFile() {
        this.getImportStmts();
        //TODO: reconstruct below 3 functions
        this.getNamespaces();
        this.getClasses();
        this.getMethods();
    }

    public getImportStmts() {
        //
    }

    public getNamespaces() {
        //遍历AST节点获取namespace
        const nodeKinds: string[] = ['NamespaceKeyword', '', ''];//TODO: check kind again
        let nsNode: NodeA[] = this.ast.walkAST2Find(nodeKinds);
        for (let node of nsNode) {
            let name: string = 'nsName';
            let ns: ArkNamespace = new ArkNamespace(node, name);
            this.nameSpaces.push(ns);
        }
    }

    // TODO: check
    public getClasses() {
        //遍历AST节点获取Classes
        const nodeKinds: string[] = ['ClassDeclaration', '', ''];//TODO: check kind again
        let clsNode: NodeA[] = this.ast.walkAST2Find(nodeKinds);
        for (let node of clsNode) {
            let name: string = 'clsName';
            let cls: ArkClass = new ArkClass(name, node);
            this.classes.push(cls);
        }
    }

    public getMethods() {
        const nodeKinds: string[] = ['FunctionDeclaration', '', ''];//TODO: check kind again
        let mthdNode: NodeA[] = this.ast.walkAST2Find(nodeKinds);
        for (let node of mthdNode) {
            let name: string = 'mthdName';//TODO
            let mthd: ArkMethod = new ArkMethod(name, node);
            this.methods.push(mthd);
        }
    }

    // TODO: need or not?
    public getInterfaces() {
        //
    }

}