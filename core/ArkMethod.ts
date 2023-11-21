import { ArkClass } from "./ArkClass";
import { ASTree, NodeA } from "./base/Ast";
import { CFG } from "./base/Cfg";

export class ArkMethod {
    name: string;
    code: string;
    isExported: boolean = false;
    declaringClass: ArkClass | null;
    returnType: any;
    parameterTypes: any[] = [];
    implementedInterfaces: ArkClass[] = [];
    cfg: CFG | null = null;

    constructor(name: string, mtdNode: NodeA) {
        this.name = name;
        this.code = mtdNode.text;
        this.declaringClass = null;
        this.buildArkMethod(mtdNode);
    }

    public buildArkMethod(mtdNode: NodeA) {
        // TODO: check
        if ('ExportDeclaration') {
            this.isExported = true;
        }
        this.buildCfg(mtdNode);
    }

    // TODO: modify
    private buildCfg(mtdNode: NodeA) {
        //const ast: ASTree = new ASTree(this.code);
        this.cfg = new CFG(mtdNode, this.name);
    }

    public getCFG() {
        return this.cfg;
    }
}