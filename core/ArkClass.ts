import { ArkField } from "./ArkField";
import { ArkFile } from "./ArkFile";
import { ArkMethod } from "./ArkMethod";
import { ArkNamespace } from "./ArkNamespace";
import { NodeA } from "./base/Ast";
import { MethodSubSignature, ClassSignature } from "./ArkSignature";


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
    properties: string[] = [];//TODO: transform properties to fields
    methods: ArkMethod[] = [];

    constructor(clsNode: NodeA, arkFile:ArkFile) {
        this.code = clsNode.text;
        this.superClass = null;
        this.declaringArkFile = arkFile;
        this.buildArkClass(clsNode);
    }

    private buildArkClass(clsNode: NodeA) {
        this.name = clsNode.classHeadInfo.name;
        this.classSignature = new ClassSignature(this.declaringArkFile, this.name);
        
        let mdfs:string[] = clsNode.classHeadInfo.modifiers;
        if (mdfs.find(element => element === 'ExportKeyword')) {
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

        //console.log(clsNode.children);
        for (let child of clsNode.children) {
            if (child.kind == 'SyntaxList') {
                //console.log(child.children);
                for (let cld of child.children) {
                    //console.log(cld);
                    if (cld.kind == 'MethodDeclaration' || cld.kind == 'Constructor') {
                        let mthd: ArkMethod = new ArkMethod(cld, this.declaringArkFile, this);
                        this.methods.push(mthd);
                    }
                }
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