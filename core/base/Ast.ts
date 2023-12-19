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
    //properties: any[] = [];
    classHeadInfo: any | undefined;
    functionHeadInfo: any | undefined;

    constructor(node: ts.Node | undefined, parent: NodeA | null, children: NodeA[], text: string, start: number, classHeadInfo?: any, functionHeadInfo?: any) {
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
        if (classHeadInfo != undefined) {
            this.classHeadInfo = classHeadInfo;
        }
        if (functionHeadInfo != undefined) {
            this.functionHeadInfo = functionHeadInfo;
        }
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
            let ca: any;
            let classHeadInfo;
            let functionHeadInfo;

            if (ts.isClassDeclaration(child)) {
                classHeadInfo = handleClassNode(child);
            }
            else if (ts.isFunctionDeclaration(child) || ts.isMethodDeclaration(child) || ts.isConstructorDeclaration(child) || ts.isArrowFunction(child)) {
                functionHeadInfo = handleFunctionNode(child);
            }

            ca = new NodeA(child, null, [], child.getText(this.sourceFile), child.getStart(this.sourceFile), classHeadInfo, functionHeadInfo);
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
        const rootA = new NodeA(rootN, null, [], rootN.getText(this.sourceFile), rootN.getStart(this.sourceFile))
        this.root = rootA
        this.copyTree(rootA, rootN)
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

function handleClassNode(node: ts.ClassDeclaration) {
    // get class name, export flag, super class, etc.
    let name = node.name?.escapedText.toString();

    let modifiers: string[] = [];
    if (node.modifiers != null) {
        for (let modifier of node.modifiers) {
            modifiers.push(ts.SyntaxKind[modifier.kind]);
        }
    }

    let heritageClausesMap = new Map();
    if (node.heritageClauses != null) {
        for (let heritageClause of node.heritageClauses) {
            for (let type of heritageClause.types) {
                let superClassName = (type.expression as ts.Identifier).escapedText;
                heritageClausesMap.set(superClassName, ts.SyntaxKind[heritageClause.token]);
            }
        }
    }

    let properties = new Map();
    if (node.members != null) {
        for (let member of node.members) {
            if (ts.isPropertyDeclaration(member)) {
                let key = (member.name as ts.Identifier).escapedText.toString();
                let value: string;
                if (member.type) {
                    value = ts.SyntaxKind[member.type.kind];
                }
                else if (member.initializer) {
                    value = ts.SyntaxKind[member.initializer.kind];
                }
                else {
                    value = 'undefined';
                }
                properties.set(key, value);
            }
        }
    }

    return { name, modifiers, heritageClausesMap, properties };
}



function handleFunctionNode(node: ts.FunctionDeclaration | ts.MethodDeclaration | ts.ConstructorDeclaration | ts.ArrowFunction) {
    //get function name, parameters, return type, etc.

    //TODO: consider function without name
    let name: string | undefined;
    if (ts.isFunctionDeclaration(node)) {
        name = node.name?.escapedText.toString();
    }
    else if (ts.isMethodDeclaration(node)) {
        name = (node.name as ts.Identifier).escapedText.toString();
    }
    //TODO, do not use hard code
    else if (ts.isConstructorDeclaration(node)) {
        name = 'Constructor';
    }

    // TODO: support question token which means optional parameter
    let parameterTypes: string[] = [];
    if (node.parameters != null) {
        for (let parameter of node.parameters) {
            if (parameter.type) {
                parameterTypes.push(ts.SyntaxKind[parameter.type.kind]);
            }
        }
    }

    let modifiers: string[] = [];
    if (node.modifiers != null) {
        for (let modifier of node.modifiers) {
            modifiers.push(ts.SyntaxKind[modifier.kind]);
        }
    }

    let returnType: string[] = [];
    if (node.type != null) {
        if (node.type.kind == ts.SyntaxKind.TypeLiteral) {
            for (let member of (node.type as ts.TypeLiteralNode).members) {
                let memberType = (member as ts.PropertySignature).type;
                if (memberType != undefined) {
                    returnType?.push(ts.SyntaxKind[memberType.kind]);
                }
            }
        }
        else {
            returnType.push(ts.SyntaxKind[node.type.kind]);
        }
    }
    return { name, modifiers, parameterTypes, returnType };
}