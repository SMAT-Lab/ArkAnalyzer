import { ArkClass } from "./ArkClass";
import { ArkFile } from "./ArkFile";

export class MethodSubSignature {
    methodName: string;
    parameters: any[] = [];
    returnType: any;
    constructor(methodName, parameters, returnType) {
        this.methodName = methodName;
        this.parameters = parameters;
        this.returnType = returnType;
    }
}

export class MethodSignature {
    arkFile: ArkFile;
    arkClass: ArkClass;
    methodSubSignature: MethodSubSignature;
    constructor(arkFile: ArkFile, subSignature: MethodSubSignature, arkClass?:ArkClass) {
        this.arkFile = arkFile;
        this.methodSubSignature = subSignature;
        if (arkClass) {
            this.arkClass = arkClass;
        }
    }
}

export class ClassSignature {
    arkFile: ArkFile;
    classType: string;
    constructor (arkFile:ArkFile, classType:string) {
        this.arkFile = arkFile;
        this.classType = classType;
    }
}