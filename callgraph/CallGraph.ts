import * as ts from "typescript";
const fs = require('fs');

export class CallGraph {
    methods: Set<string>;
    calls: Map<string, string[]>;
    constructor(methods: Set<string>, calls: Map<string, string[]>) {
        this.methods = methods;
        this.calls = calls;
    }

    public addMethod(method: string) {
        this.methods.add(method);
    }

    public addCall(sourceMethod: string, targetMethod: string) {
        if (this.calls.has(sourceMethod)) {
            this.calls.get(sourceMethod)?.push(targetMethod);
        } else {
            this.calls.set(sourceMethod, [targetMethod]);
        }
    }


    private extractFunctionCalls(node: ts.Node, sourceFile: ts.SourceFile, indentLevel: number, currentFunction:string) {
        // e.g `function hello()`
        if (ts.isFunctionDeclaration(node)) {
            node.forEachChild(child => {
                if (ts.isIdentifier(child)) {
                    const declaredFunction: string = child.getText(sourceFile);
                    currentFunction = declaredFunction;
                    this.addMethod(currentFunction);
                }
            });
        }

        // Arrow function
        if (
            ts.isVariableDeclaration(node) &&
            node.initializer &&
            ts.isArrowFunction(node.initializer) &&
            indentLevel === 3
        ) {
            const child = node.getChildAt(0, sourceFile);
            if (ts.isIdentifier(child)) {
                const declaredFunction: string = child.getText(sourceFile);
                currentFunction = declaredFunction;
                this.addMethod(currentFunction)
            }
        }

        // First child must be `Identifier`
        // examples of what gets skipped: `fs.readFile('lol.json')` or `ipc.on('something', () => {})`
        if (ts.isCallExpression(node)) {
            const child = node.getChildAt(0, sourceFile);
            if (ts.isIdentifier(child)) {
                const calledFunction: string = child.getText(sourceFile);
                this.addCall(currentFunction, calledFunction);
            }
        }
        node.forEachChild(child => this.extractFunctionCalls(child, sourceFile, indentLevel + 1, currentFunction));
    }


    public processFiles(filenames: string[]) {
        let currentFunction: string = 'dumpy';

        filenames.forEach((filename) => {

            const rootNodes: ts.Node[] = [];

            let codeAsString: string = '';

            let skipFile: boolean = false;

            try {
                codeAsString = fs.readFileSync(filename).toString();
            } catch (err) {
                console.log('File', filename, 'not found! - skipping');
                skipFile = true;
            }

            if (!skipFile) {
                const sourceFile: ts.SourceFile = ts.createSourceFile(filename, codeAsString, ts.ScriptTarget.Latest);

                sourceFile.forEachChild((child: ts.Node) => {
                    rootNodes.push(child)
                });

                rootNodes.forEach((node: ts.Node) => {
                    currentFunction = 'dumpy';
                    this.extractFunctionCalls(node, sourceFile, 1, currentFunction);
                });
            }

        });

        this.calls.delete('dumpy');
    }

    public printCallGraph() {
        console.log('');
        console.log('======================================');
        console.log(this.methods);
        console.log('--------------------------------------');
        console.log(this.calls);
        console.log('--------------------------------------');
    }
}