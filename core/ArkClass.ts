import { ArkField } from "./ArkField";
import { ArkFile } from "./ArkFile";
import { ArkMethod } from "./ArkMethod";
import { ArkNamespace } from "./ArkNamespace";
import { NodeA } from "./base/Ast";
import { MethodSubSignature, ClassSignature } from "./ArkSignature";


export class ArkClass {
    name: string;
    code: string | null;
    declaringArkFile: ArkFile;
    classSignature: ClassSignature;
    isExported: boolean = false;
    superClassName: string | null;
    superClass: ArkClass | null;
    implementedInterfaces: ArkClass[] = [];
    implementedInterfaceNames: string[] = [];
    fields: ArkField[] = [];
    properties: string[] = [];//TODO: transform properties to fields
    methods: ArkMethod[] = [];

    constructor(clsNode: NodeA, arkFile:ArkFile) {
        this.code = clsNode.text;
        this.superClass = null;
        this.declaringArkFile = arkFile;
        this.buildArkClass(clsNode);
    }

    private buildArkClass(clsNode: NodeA) {
        this.classSignature = new ClassSignature(this.declaringArkFile, this.name);
        
        this.name = clsNode.classHeadInfo.name;
        if (clsNode.modifiers.indexOf('ExportKeyWord')) {
            this.isExported = true;
        }

        for (let [key, value] of clsNode.classHeadInfo.heritageClausesMap) {
            if (value == 'ExtendsKeyword') {
                this.superClassName = key;
            }
            else {
                this.implementedInterfaceNames.push(key);
            }
        }
        
        //TODO: string[] to ArkField[]
        this.properties = clsNode.classHeadInfo.properties;

        for (let child of clsNode.children) {
            if (child.kind == 'FunctionDeclaration') {
                let mthd: ArkMethod = new ArkMethod(child, this.declaringArkFile, this);
                this.methods.push(mthd);
            }
        }
    }

    //TODO
    public getMethod(methodSubSignature: MethodSubSignature): ArkMethod | null {
        for (let mthd of this.methods) {
            if (mthd.methodSubSignature == methodSubSignature) {
                return mthd;
            }
        }
        return null;
    }

    public getMethods(): ArkMethod[] {
        return this.methods;
    }
}