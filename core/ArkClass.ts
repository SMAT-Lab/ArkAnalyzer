import { ArkField } from "./ArkField";
import { ArkFile } from "./ArkFile";
import { ArkMethod } from "./ArkMethod";
import { ArkNamespace } from "./ArkNamespace";
import { NodeA } from "./base/Ast";


export class ArkClass {
    name: string;
    code: string | null;
    isExported: boolean = false;
    superClass: ArkClass | null;
    implementedInterfaces: ArkClass[] = [];//TODO: check
    fields: ArkField[] = [];
    methods: ArkMethod[] = [];

    constructor(name: string, clsNode: NodeA) {
        this.name = name;
        this.code = clsNode.text;
        this.superClass = null;
        this.buildArkClass(clsNode);
    }

    // TODO: check and update
    private buildArkClass(nsNode: NodeA) {
        for (let child of nsNode.children) {
            if (child.kind == 'FunctionDeclaration') {
                let name: string = 'mthdName';
                let mthd: ArkMethod = new ArkMethod(name, child);
                this.methods.push(mthd);
            }
        }
    }

    public getMethods(): ArkMethod[] {
        return this.methods;
    }
}