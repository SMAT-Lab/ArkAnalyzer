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

    constructor(name: string, node: NodeA) {
        this.name = name;
        this.code = node.text;
        this.superClass = null;
        this.buildArkClass(node);
    }

    public buildArkClass(node: NodeA) {
        // TODO: check
        if (node.kind == 'ExportDeclaration') {
            this.isExported = true;
        }
        // TODO:
        if ('ExtendsKeyword') {
            this.superClass = null;
        }
        this.getMethods(node);
    }

    public getMethods(clsNode: NodeA) {
        const nodeKinds: string[] = ['FunctionDeclaration', '', ''];//TODO: check kind again
        let mthdNode: NodeA[] = clsNode.walkChildren2Find(nodeKinds);
        for (let node of mthdNode) {
            let name: string = 'mthdName';//TODO
            let mthd: ArkMethod = new ArkMethod(name, node);
            this.methods.push(mthd);
        }
    }

}