import { ArkClass } from "./ArkClass";
import { ArkMethod } from "./ArkMethod";
import { NodeA, ASTree } from "../base/Ast";


export class ArkNamespace {
    name: string;
    code: string
    isExported: boolean = false;
    classes: ArkClass[] = [];
    methods: ArkMethod[] = [];

    constructor(name: string, nsNode: NodeA) {
        this.name = name;
        this.code = nsNode.text;
        this.buildArkNamespaces(nsNode);
    }

    // TODO: check and update
    private buildArkNamespaces(nsNode: NodeA) {
        for (let child of nsNode.children) {
            if (child.kind == 'ClassDeclaration') {
                let name: string = 'clsName';
                let cls: ArkClass = new ArkClass(name, child);
                this.classes.push(cls);
            }
            else if (child.kind == 'FunctionDeclaration') {
                let name: string = 'mthdName';
                let mthd: ArkMethod = new ArkMethod(name, child);
                this.methods.push(mthd);
            }
        }
    }

    public getClasses(): ArkClass[] {
        return this.classes;
    }

    public getMethods(): ArkMethod[] {
        return this.methods;
    }
}