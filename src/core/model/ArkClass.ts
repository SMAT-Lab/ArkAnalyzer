import { ArkField } from "./ArkField";
import { ArkFile } from "./ArkFile";
import { ArkMethod } from "./ArkMethod";
import { ArkNamespace } from "./ArkNamespace";
import { NodeA } from "../base/Ast";
import { MethodSubSignature, ClassSignature, methodSubSignatureCompare } from "./ArkSignature";
import { Property } from "../common/ClassBuilderInfo";


export class ArkClass {
    name!: string;
    code: string | null;
    declaringArkFile: ArkFile;
    classSignature!: ClassSignature;
    isExported: boolean = false;
    superClassName: string | undefined;
    superClass: ArkClass | null;
    implementedInterfaces: ArkClass[] = [];
    implementedInterfaceNames: string[] = [];
    fields: ArkField[] = [];
    properties: Property[] = [];
    methods: ArkMethod[] = [];
    defaultMethod!: ArkMethod;
    modifiers: Set<string> = new Set<string>();

    constructor(clsNode: NodeA, arkFile: ArkFile) {
        this.code = clsNode.text;
        this.superClass = null;
        this.declaringArkFile = arkFile;
        if (clsNode.kind != 'ClassDeclaration') {
            this.buildDefaultArkClass(clsNode);
        }
        else {
            this.buildArkClass(clsNode);
        }
    }

    private genDefaultMethod(clsNode: NodeA) {
        this.defaultMethod = new ArkMethod(clsNode, this.declaringArkFile, this);
        this.methods.push(this.defaultMethod);
    }

    private buildDefaultArkClass(clsNode: NodeA) {
        this.name = "_DEFAULT_ARK_CLASS";
        this.classSignature = new ClassSignature(this.declaringArkFile.name, this.name);
        this.genDefaultMethod(clsNode);
    }

    private buildArkClass(clsNode: NodeA) {
        if (!clsNode.classNodeInfo) {
            throw new Error('Error: There is no classNodeInfo for this class!');
        }
        this.name = clsNode.classNodeInfo.className;
        this.classSignature = new ClassSignature(this.declaringArkFile.name, this.name);

        this.modifiers = clsNode.classNodeInfo.modifiers;
        if (this.modifiers.has('ExportKeyword')) {
            this.isExported = true;
        }

        for (let [key, value] of clsNode.classNodeInfo.heritageClauses) {
            if (value == 'ExtendsKeyword') {
                this.superClassName = key;
            }
            else {
                this.implementedInterfaceNames.push(key);
            }
        }

        this.properties = clsNode.classNodeInfo.properties;
        this.properties.forEach((property) => {
            this.fields.push(new ArkField(this, property));
        });

        // generate ArkMethods of this class
        for (let child of clsNode.children) {
            if (child.kind == 'SyntaxList') {
                for (let cld of child.children) {
                    if (cld.kind == 'MethodDeclaration' || cld.kind == 'Constructor') {
                        let mthd: ArkMethod = new ArkMethod(cld, this.declaringArkFile, this);
                        this.methods.push(mthd);
                    }
                }
            }
        }
    }

    public getMethod(methodSubSignature: MethodSubSignature): ArkMethod | null {
        for (let mthd of this.methods) {
            if (methodSubSignatureCompare(mthd.methodSubSignature, methodSubSignature)) {
                return mthd;
            }
        }
        return null;
    }

    public getMethods(): ArkMethod[] {
        return this.methods;
    }
}