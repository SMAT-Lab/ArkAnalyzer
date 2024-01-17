import {ArkFile} from "../core/model/ArkFile";
import {NodeA} from "../core/base/Ast";
import {ClassSignature} from "../core/model/ArkSignature";
import {ArkClass} from "../core/model/ArkClass";

export class ClassHierarchyAnalysis {
    methods: Set<string>;
    calls: Map<string, string[]>;
    arkFiles: ArkFile[] = [];
    tips: string = "Warning! This class of generating the call graph has been deprecated."

    constructor(methods: Set<string>, calls: Map<string, string[]>) {
        this.methods = methods;
        this.calls = calls;
    }

    public getFile(fileName: string): ArkFile | null {
        for (let arkFile of this.arkFiles) {
            if (arkFile.name == fileName) {
                return arkFile;
            }
        }
        return null;
    }

    public addMethod(method: string) {
        this.methods.add(method);
    }

    public addCall(sourceMethod: string, targetMethod: string) {
        if (this.calls.has(sourceMethod)) {
            if (!this.calls.get(sourceMethod)?.includes(targetMethod)) {
                this.calls.get(sourceMethod)?.push(targetMethod);
            }
        } else {
            this.calls.set(sourceMethod, [targetMethod]);
        }
    }

    private extractFunctionCallsCHA(
        arkFile: ArkFile,
        node: NodeA,
        indentLevel: number,
        currentFunction: string,
        currentClass: string | null = null) {

        if (node.kind == "ClassDeclaration") {
            for (let child of node.children) {
                if (child.kind == "Identifier") {
                    currentClass = child.text;
                }
            }
        }

        if (node.kind == "FunctionDeclaration") {
            for (let child of node.children) {
                if (child.kind == "Identifier") {
                    currentFunction = child.text
                    this.addMethod(currentFunction)
                }
            }
        }

        if (node.kind == "VariableDeclaration") {
            //
            let variableName = "", variableType = "";
            for (let child of node.children) {
                if (child.kind == "Identifier") {
                    variableName = child.text
                } else if (child.kind == "NewExpression") {
                    // TODO: 与类型推理接入
                    variableType = child.children[1].text;
                    node.putInstanceMap(variableName, variableType);
                }
            }
        }

        if (currentClass) {
            if (node.kind == "MethodDeclaration") {
                for (let child of node.children) {
                    if (child.kind == "Identifier") {
                        currentFunction = `${currentClass}.${child.text}`
                        this.addMethod(currentFunction)
                    }
                }
            } else if (node.kind == "Constructor") {
                currentFunction = `${currentClass}.constructor`;
                this.addMethod(currentFunction);
            }
        }

        if (node.kind == "CallExpression") {
            let calledFunction: string = '';
            // calledFunction = node.children[0].text
            let child = node.children[0]
            if (child.kind == "Identifier") {
                calledFunction = child.text
                this.addCall(currentFunction, calledFunction);
            } else if (child.kind == "PropertyAccessExpression") {
                let variable = child.children[0].text
                let classType = node.checkInstanceMap(variable)
                if (classType !== null) {
                    let classSignature = new ClassSignature(arkFile.name, classType);
                    let arkClass = arkFile.getClass(classSignature);
                    while (arkClass != null) {
                        let classMethods = arkClass.getMethods();
                        for (let method of classMethods) {
                            if (method.name == child.children[2].text) {
                                calledFunction = `${arkClass.name}.${method.name}`;
                                this.addCall(currentFunction, calledFunction);
                            }
                        }
                        arkClass = this.getFatherClass(arkClass.classSignature);
                    }
                } else {
                    calledFunction = child.text
                    this.addCall(currentFunction, calledFunction);
                }
            }
        }

        for (let c of node.children) {
            this.extractFunctionCallsCHA(arkFile, c, indentLevel + 1, currentFunction, currentClass);
        }
    }

    private extractFunctionCallsCHAByCFG() {

    }

    public processFiles(arkFiles: ArkFile[]) {
        this.arkFiles = arkFiles
        let currentFunction: string = 'dumpy';

        arkFiles.forEach((arkFile) => {
            currentFunction = 'dumpy';
            this.extractFunctionCallsCHA(arkFile, arkFile.ast.root, 1, currentFunction, null);
        });

        this.calls.delete('dumpy');
    }

    public processFilesByCFG(entrypoint: []) {
        let currentFunction: string = 'dumpy';
        let entryPoints = entrypoint

        for (let entry of entryPoints) {

        }


        this.calls.delete('dumpy');
    }

    public getFatherClass(classSignature: ClassSignature): ArkClass | null {
        let thisArkFile = this.getFile(classSignature.arkFile);
        if (thisArkFile == null) {
            throw new Error('No ArkFile found.');
        }

        let thisArkClass = thisArkFile.getClass(classSignature);
        if (thisArkClass == null) {
            throw new Error('No ArkClass found.');
        }
        let fatherName = thisArkClass?.superClassName;
        if (!fatherName) {
            return null;
        }
        // get father locally
        for (let cls of thisArkFile.getClasses()) {
            if (cls.name == fatherName) {
                return cls;
            }
        }
        // get father globally
        return this.getFatherClassGlobally(fatherName);
    }

    public getFatherClassGlobally(arkClassType: string): ArkClass | null {
        for (let fl of this.arkFiles) {
            for (let cls of fl.classes) {
                if (cls.isExported && cls.name == arkClassType) {
                    return cls;
                }
            }
        }
        return null;
    }

    public printCallGraphCHA() {
        console.log('');
        console.log('======================================');
        console.log(this.methods);
        console.log('--------------------------------------');
        console.log(this.calls);
    }
}
