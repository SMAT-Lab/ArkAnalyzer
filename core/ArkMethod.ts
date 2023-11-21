import { ArkClass } from "./ArkClass";
import { ArkNamespace } from "./ArkNamespace";
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

    constructor(name: string, node: NodeA) {
        this.name = name;
        this.code = node.text;
        this.declaringClass = null;
        this.buildArkMethod(node);
    }

    public buildArkMethod(node:NodeA) {
        // TODO: check
        if ('ExportDeclaration') {
            this.isExported = true;
        }
        this.buildCfg(node);
    }

    // TODO: modify
    public buildCfg(node: NodeA) {
        //const ast: ASTree = new ASTree(this.code);
        this.cfg = new CFG(node, this.name);
    }
}