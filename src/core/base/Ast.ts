import * as ts from "typescript";
import { ClassInfo, buildClassInfo4ClassNode } from "../common/ClassBuilderInfo";
import { MethodInfo, buildMethodInfo4MethodNode } from "../common/MethodInfoBuilder";

/**
 * ast节点类，属性包括父节点，子节点列表，种类，文本内容，开始位置
 */
export class NodeA {
    parent: NodeA | null;
    children: NodeA[];
    kind: string;
    text: string;
    start: number;
    classNodeInfo: ClassInfo | undefined;
    methodNodeInfo: MethodInfo | undefined;
    instanceMap: Map<string, string> | undefined;
    line: number = -1;
    character: number = -1;

    constructor(node: ts.Node | undefined, parent: NodeA | null, children: NodeA[], text: string, start: number, kind: string, classNodeInfo?: ClassInfo, methodNodeInfo?: MethodInfo) {
        this.parent = parent;
        this.children = children;
        this.text = text;
        this.start = start;
        if (node == undefined) {
            this.kind = kind;
        }
        else {
            this.kind = ts.SyntaxKind[node.kind];
            if (this.kind == "Block" || this.parent === null) {
                this.instanceMap = new Map<string, string>();
            } else {
                this.instanceMap = undefined
            }
        }
        this.classNodeInfo = classNodeInfo;
        this.methodNodeInfo = methodNodeInfo;
    }

    public putInstanceMap(variableName: string, variableType: string): void {
        if (typeof this.instanceMap === "undefined") {
            // instanceMap 未初始化
            let parentNode = this.parent
            if (parentNode != null) {
                parentNode.putInstanceMap(variableName, variableType)
            }
        } else {
            // instanceMap 已初始化
            this.instanceMap.set(variableName, variableType)
        }
    }

    public checkInstanceMap(variableName: string): string | null {
        let parentNode = this.parent
        if (typeof this.instanceMap !== "undefined") {
            // instanceMap 已初始化
            if (this.instanceMap.has(variableName)) {
                let value = this.instanceMap.get(variableName);
                return value !== undefined ? value : null;
            }
        }
        if (parentNode != null) {
            return parentNode.checkInstanceMap(variableName)
        } else {
            return null;
        }
    }
}

/**
 * ast类，目前的构造方式是传ts代码，之后可以考虑传文件路径等
 */
export class ASTree {
    text: string;
    root: NodeA = new NodeA(undefined, null, [], "undefined", 0, "undefined");
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
            let ca: any;
            let classNodeInfo: ClassInfo | undefined;
            let methodNodeInfo: MethodInfo | undefined;

            if (ts.isClassDeclaration(child)) {
                classNodeInfo = buildClassInfo4ClassNode(child);
            }
            else if (ts.isClassExpression(child)) {
                //TODO
            }
            else if (ts.isFunctionDeclaration(child) || ts.isMethodDeclaration(child) || ts.isConstructorDeclaration(child) || ts.isArrowFunction(child)) {
                methodNodeInfo = buildMethodInfo4MethodNode(child);
            }

            ca = new NodeA(child, nodea, [], child.getText(this.sourceFile), child.getStart(this.sourceFile), "", classNodeInfo, methodNodeInfo);
            const { line, character } = ts.getLineAndCharacterOfPosition(
                this.sourceFile,
                child.getStart(this.sourceFile)
            );
            ca.line = line;
            ca.character = character;
            this.copyTree(ca, child);
            cas.push(ca);
            ca.parent = nodea;
        }
        nodea.children = cas;
    }

    // 建树
    buildTree() {
        const rootN = this.sourceFile.getChildren(this.sourceFile)[0]
        if (rootN == null)
            process.exit(0);
        const rootA = new NodeA(rootN, null, [], rootN.getText(this.sourceFile), rootN.getStart(this.sourceFile), "")
        const { line, character } = ts.getLineAndCharacterOfPosition(
            this.sourceFile,
            rootN.getStart(this.sourceFile)
        );
        rootA.line = line;
        rootA.character = character;
        this.root = rootA
        this.copyTree(rootA, rootN)
        // this.simplify(this.root);
    }

    singlePrintAST(node: NodeA, i: number) {
        console.log('   '.repeat(i) + node.kind)
        // console.log(' '.repeat(i) + node.kind + ":" + node.text)
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

    For2While(node: NodeA) {
        let semicolon1 = -1, semicolon2 = -1;
        for (let i = 0; i < node.children.length; i++) {
            if (node.children[i].kind == "SemicolonToken") {
                if (semicolon1 == -1)
                    semicolon1 = i;
                else
                    semicolon2 = i;
            }
        }
        let whileStatement = new NodeA(undefined, node.parent, [], "", -1, "WhileStatement");
        let whileKeyword = new NodeA(undefined, whileStatement, [], "while", -1, "WhileKeyword");
        let open = new NodeA(undefined, whileStatement, [], "(", -1, "OpenParenToken");
        let close = new NodeA(undefined, whileStatement, [], ")", -1, "CloseParenToken");
        let condition = node.children[semicolon1 + 1];
        let block = node.children[node.children.length - 1];
        block.parent = whileStatement;
        whileStatement.children = [whileKeyword, open, condition, close, block];
        if (!node.parent) {
            console.log("for without parent");
            process.exit();
        }
        node.parent.children[node.parent.children.indexOf(node)] = whileStatement;
        if (node.children[semicolon1 - 1].kind != "OpenParenToken") {
            let initKind = "";
            let initChild = node.children[semicolon1 - 1];
            if (initChild.kind == "VariableDeclarationList")
                initKind = "FirstStatement";
            else
                initKind = "ExpressionStatement";
            let semi = new NodeA(undefined, whileStatement, [], ";", -1, "SemicolonToken");
            let init = new NodeA(undefined, node.parent, [initChild, semi], initChild.text + ";", -1, initKind);
            node.parent.children.splice(node.parent.children.indexOf(whileStatement), 0, init);
        }
        if (node.children[semicolon2 - 1].kind != "CloseParenToken") {
            let updateChild = node.children[semicolon2 + 1];
            let semi = new NodeA(undefined, whileStatement, [], ";", -1, "SemicolonToken");
            let update = new NodeA(undefined, block, [updateChild, semi], updateChild.text + ";", -1, "ExpressionStatement");
            block.children[1].children.push(update);
        }
        this.updateParentText(block.children[1]);
    }

    findChildIndex(node: NodeA, kind: string): number {
        for (let i = 0; i < node.children.length; i++) {
            if (node.children[i].kind == kind)
                return i;
        }
        return -1;
    }

    forOfIn2For(node: NodeA): NodeA {
        let VariableDeclarationList = node.children[this.findChildIndex(node, "VariableDeclarationList")];
        let SyntaxList = VariableDeclarationList.children[this.findChildIndex(VariableDeclarationList, "SyntaxList")];
        let decl = SyntaxList.children[0].children[0].text;
        let array = node.children[this.findChildIndex(node, "Identifier")].text;
        let tempTree = new ASTree("for(let _i=0;_i<" + array + ".length;_i++)");
        let forStm = tempTree.root.children[0];
        forStm.parent = node.parent;
        if (node.parent)
            node.parent.children[node.parent.children.indexOf(node)] = forStm;
        let block = node.children[this.findChildIndex(node, "Block")];
        forStm.children[forStm.children.length - 1] = block;
        tempTree = new ASTree("let " + decl + "=" + array + "[_i];");
        let initStm = tempTree.root.children[0];
        block.children[1].children.splice(0, 0, initStm);
        this.updateParentText(forStm);
        return forStm;
    }

    simplify(node: NodeA) {
        if (node.kind == "ForInStatement" || node.kind == "ForOfStatement") {

            this.For2While(this.forOfIn2For(node));
        }
        if (node.kind == "ForStatement") {
            this.For2While(node);
        }
        for (let child of node.children) {
            this.simplify(child);
        }
    }

    updateParentText(node: NodeA) {
        if (!node)
            return;
        node.text = ""
        for (let child of node.children) {
            node.text += child.text;
            if (child.kind.includes("Keyword"))
                node.text += " ";
            if (node.kind == "SyntaxList" && child.kind.includes("Statement"))
                node.text += "\r\n";
        }
        if (node.parent)
            this.updateParentText(node.parent);
    }

    updateStart(node: NodeA) {
        for (let i = 0; i < node.children.length; i++) {
            if (i == 0) {
                node.children[i].start = node.start;
            }
            else {
                node.children[i].start = node.children[i - 1].start + node.children[i].text.length;
            }
            this.updateStart(node.children[i]);
        }
    }
}