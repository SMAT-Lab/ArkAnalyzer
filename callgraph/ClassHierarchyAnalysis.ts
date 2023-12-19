import {ArkFile} from "../core/ArkFile";
import {NodeA} from "../core/base/Ast";
import {ClassSignature} from "../core/ArkSignature";
import {ArkClass} from "../core/ArkClass";

export class ClassHierarchyAnalysis {
    methods: Set<string>;
    calls: Map<string, string[]>;
    arkFiles: ArkFile[] = [];
    instanceMap: Map<string, string>;

    constructor(methods: Set<string>, calls: Map<string, string[]>) {
        this.methods = methods;
        this.calls = calls;
        this.instanceMap = new Map<string, string>();
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
                    variableType = child.children[1].text;
                    this.instanceMap.set(variableName, variableType)
                    // TODO: 获取变量所属类
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

        // First child must be `Identifier`
        // examples of what gets skipped: `fs.readFile('lol.json')` or `ipc.on('something', () => {})`
        if (node.kind == "CallExpression") {
            let calledFunction: string = '';
            // calledFunction = node.children[0].text
            let child = node.children[0]
            if (child.kind == "Identifier") {
                calledFunction = child.text
                this.addCall(currentFunction, calledFunction);
            } else if (child.kind == "PropertyAccessExpression") {
                // TODO:对于形如{a}.{b}的方法调用
                // 查找a是否是变量，如果是则找到变量所属类，并获得所有的祖宗类
                // 对祖宗类查找是否存在相符的方法，并将所有符合的方法加入到call集合中
                let variable = child.children[0].text
                if (this.instanceMap.has(variable)) {
                    let classSignature = new ClassSignature(arkFile.name, "");
                    let arkClass = this.getFatherClass(classSignature);
                    while (arkClass != null) {
                        let classMethods = arkClass.getMethods();
                        for (let method of classMethods) {
                            if (method.name == child.children[1].text) {
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

    public processFiles(arkFiles: ArkFile[]) {
        this.arkFiles = arkFiles
        let currentFunction: string = 'dumpy';

        arkFiles.forEach((arkFile) => {
            currentFunction = 'dumpy';
            this.extractFunctionCallsCHA(arkFile, arkFile.ast.root, 1, currentFunction, null);
        });

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
        console.log('--------------------------------------');
        console.log(this.instanceMap);
    }
}
