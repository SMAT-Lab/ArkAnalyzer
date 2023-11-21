import { ArkClass } from "./ArkClass";
import { ArkFile } from "./ArkFile";
import { ArkMethod } from "./ArkMethod";
import { NodeA, ASTree } from "./base/Ast";


export class ArkNamespace {
    name: string;
    //myArkFile: ArkFile | null;
    code: string
    isExported: boolean = false;
    classes: ArkClass[] = [];
    methods: ArkMethod[] = [];
    // interfaces: ArkInterface[] = [];

    constructor(node: NodeA, name: string) {
        this.name = name;
        this.code = node.text;
        this.buildArkNamespaces(node);
    }

    public buildArkNamespaces(node: NodeA) {
        //TODO: check
        if (node.kind == 'NamespaceExportDeclaration') {
            this.isExported = true;
        }
        this.getClasses(node);
        this.getMethods(node);
    }

    public getClasses(nsNode: NodeA) {
        const nodeKinds: string[] = ['ClassDeclaration', '', ''];//TODO: check kind again
        let clsNode: NodeA[] = nsNode.walkChildren2Find(nodeKinds);
        for (let node of clsNode) {
            let name: string = 'clsName';//TODO
            let cls: ArkClass = new ArkClass(name, node);
            this.classes.push(cls);
        }
    }

    public getMethods(nsNode: NodeA) {
        const nodeKinds: string[] = ['FunctionDeclaration', '', ''];//TODO: check kind again
        let mthdNode: NodeA[] = nsNode.walkChildren2Find(nodeKinds);
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