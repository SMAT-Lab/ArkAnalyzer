import fs from 'fs';

import { ArkClass } from "./ArkClass";
import { ArkMethod } from "./ArkMethod";
import { Statement } from "./base/Stmt";
import { NodeA, ASTree } from "./base/Ast";
import { ArkNamespace } from "./ArkNamespace";
import { ClassSignature, MethodSignature } from "./ArkSignature";

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
                console.log("Yifei-2");
                let cls: ArkClass = new ArkClass(child, this);
                this.classes.push(cls);
            }
            else if (child.kind == 'FunctionDeclaration') {
                let mthd: ArkMethod = new ArkMethod(child, this);
                this.methods.push(mthd);
            }
        }
        console.log(this.importStmts);
        console.log("#######Yifei-1#######");
        console.log(this.methods);
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
        for (let cls of this.classes) {
            if (cls.classSignature == classSignature) {
                return cls;
            }
        }
        return null;
    }

    public getMethods(): ArkMethod[] {
        return this.methods;
    }

    //TODO
    public getMethod(methodSignature: MethodSignature): ArkMethod | null {
        if (methodSignature.arkClass) {
            return methodSignature.arkClass.getMethod(methodSignature.methodSubSignature);
        }
        else {
            for (let mthd of this.methods) {
                if (mthd.methodSignature == methodSignature) {
                    return mthd;
                }
            }
        }
        return null;
    }
}