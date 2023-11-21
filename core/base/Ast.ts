import * as ts from "typescript";
import * as fs from 'fs';

/**
 * ast节点类，属性包括父节点，子节点列表，种类，文本内容，开始位置
 */
export class NodeA {
    parent: NodeA | null;
    children: NodeA[];
    kind: string;
    text: string;
    start: number;

    constructor(node: ts.Node | undefined, parent: NodeA | null, children: NodeA[], text: string, start: number) {
        this.parent = parent;
        this.children = children;
        this.text = text;
        this.start = start;
        if (node == undefined) {
            this.kind = "undefined";
        }
        else {
            this.kind = ts.SyntaxKind[node.kind];
        }
    }

    public walkChildren2Find(kinds: string[]): NodeA[] {
        return [];
    }
}

/**
 * ast类，目前的构造方式是传ts代码，之后可以考虑传文件路径等
 */
export class ASTree {
    text: string;
    root: NodeA = new NodeA(undefined, null, [], "undefined", 0);
    sourceFile: ts.SourceFile;
    constructor(text: string) {
        this.text = text;
        this.sourceFile = ts.createSourceFile(
            "example.ts",
            this.text,
            ts.ScriptTarget.Latest
        );
        this.buildTree();

    }

    /**
     * 复制typescript的ast，因为typescript的ast的节点不能直接操作，因此通过之前自己建立的节点类进行复制
     * @param nodea 复制到nodea
     * @param node 要复制的节点node
     * @returns 
     */
    copyTree(nodea: NodeA, node: ts.Node | undefined) {
        let children = node?.getChildren(this.sourceFile);
        if (children == null) {
            return;
        }
        let cas: NodeA[] = [];
        for (let child of children) {
            let ca = new NodeA(child, null, [], child.getText(this.sourceFile), child.getStart(this.sourceFile))
            this.copyTree(ca, child)
            cas.push(ca)
            ca.parent = nodea
        }
        nodea.children = cas
    }

    // 建树
    buildTree() {
        const rootN = this.sourceFile.getChildren(this.sourceFile)[0]
        if (rootN == null)
            process.exit(0);
        const rootA = new NodeA(rootN, null, [], rootN.getText(this.sourceFile), rootN.getStart(this.sourceFile))
        this.root = rootA
        this.copyTree(rootA, rootN)
    }

    walkAST2Find(asTree: ASTree): NodeA[] {
        return [];
    }

    singlePrintAST(node: NodeA, i: number) {
        console.log(' '.repeat(i) + node.kind)
        if (node.children == null)
            return;
        for (let c of node.children) {
            this.singlePrintAST(c, i + 1)
        }
    }

    printAST() {
        if (this.root == null) {
            console.log("no root")
        }
        this.singlePrintAST(this.root, 0)
    }
}
