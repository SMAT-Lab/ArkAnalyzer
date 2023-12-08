import fs from 'fs';

import { ArkClass } from "./ArkClass";
import { ArkMethod } from "./ArkMethod";
import { Statement } from "./base/Stmt";
import { NodeA, ASTree } from "./base/Ast";
import { ArkNamespace } from "./ArkNamespace";
import { ClassSignature, MethodSignature, methodSignatureCompare, classSignatureCompare } from "./ArkSignature";

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
                this.importStmts.push(new Statement('', child.text));
            }
            //else if (child.kind == 'NamespaceKeyword') {
            //    let ns: ArkNamespace = new ArkNamespace(child, this);
            //    this.nameSpaces.push(ns);
            //}
            else if (child.kind == 'ClassDeclaration') {
                let cls: ArkClass = new ArkClass(child, this);
                this.classes.push(cls);
            }
            else if (child.kind == 'FunctionDeclaration') {
                let mthd: ArkMethod = new ArkMethod(child, this, undefined);
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

    public getClass(classSignature: ClassSignature): ArkClass | null {
        let cls = this.classes.find((obj) => {
            return classSignatureCompare(obj.classSignature, classSignature);
        })
        if (cls) {
            return cls;
        }
        return null;
    }

    public getMethods(): ArkMethod[] {
        return this.methods;
    }

    //TODO: err handle
    public getMethod(methodSignature: MethodSignature): ArkMethod | null  {
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