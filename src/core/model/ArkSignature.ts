
import path from 'path';
export class MethodSubSignature {
    methodName: string | undefined;
    parameters: string[] = [];
    returnType: string[] = [];
    constructor(methodName: string | undefined, parameters: string[], returnType: string[]) {
        this.methodName = methodName;
        this.parameters = parameters;
        this.returnType = returnType;
    }

    public toString(): string {
        return `${this.methodName}(${this.parameters})`
    }
}

export class MethodSignature {
    arkClass: ClassSignature;
    methodSubSignature: MethodSubSignature;

    constructor(subSignature: MethodSubSignature, arkClass: ClassSignature) {
        this.methodSubSignature = subSignature;
        this.arkClass = arkClass;
    }

    //public toString(): string {
    //    return `[${this.arkClass.arkFile}.${this.arkClass.classType}].${this.methodSubSignature.methodName}`
    //}

    public toString(): string {
        return `<${this.arkClass.arkFile}>.<${this.arkClass.classType}>.<${this.methodSubSignature.methodName}(${this.methodSubSignature.parameters})>`;
    }
}

export class FieldSignature {
    arkClass: ClassSignature;
    fieldName: string;

    constructor(arkClass: ClassSignature, fieldName: string) {
        this.arkClass = arkClass;
        this.fieldName = fieldName;
    }

    public toString(): string {
        return `<${this.arkClass.arkFile}>.<${this.arkClass.classType}>.<${this.fieldName}>`
    }
}

export class ClassSignature {
    arkFile: string;
    classType: string | undefined;
    arkFileWithoutExt: string;
    constructor(arkFile: string, classType: string | undefined) {
        this.arkFile = arkFile;
        this.classType = classType;
        this.arkFileWithoutExt = path.dirname(arkFile) + '/' + path.basename(arkFile, path.extname(arkFile));
    }

    public toString(): string {
        return `<${this.arkFile}>.<${this.classType}>`
    }
}

//TODO, reconstruct
export function fieldSignatureCompare(leftSig: FieldSignature, rightSig: FieldSignature): boolean {
    if (classSignatureCompare(leftSig.arkClass, rightSig.arkClass) && (leftSig.fieldName == rightSig.fieldName)) {
        return true;
    }
    return false;
}

export function methodSignatureCompare(leftSig: MethodSignature, rightSig: MethodSignature): boolean {
    if (classSignatureCompare(leftSig.arkClass, rightSig.arkClass) && methodSubSignatureCompare(leftSig.methodSubSignature, rightSig.methodSubSignature)) {
        return true;
    }
    return false;
}

export function methodSubSignatureCompare(leftSig: MethodSubSignature, rightSig: MethodSubSignature): boolean {
    if ((leftSig.methodName == rightSig.methodName) && arrayCompare(leftSig.parameters, rightSig.parameters) && arrayCompare(leftSig.returnType, rightSig.returnType)) {
        return true;
    }
    return false;
}

export function classSignatureCompare(leftSig: ClassSignature, rightSig: ClassSignature): boolean {
    if ((leftSig.arkFile == rightSig.arkFile) && (leftSig.classType == rightSig.classType)) {
        return true;
    }
    return false;
}

function arrayCompare(leftArray: any[], rightArray: any[]) {
    if (leftArray.length != rightArray.length) {
        return false;
    }
    for (let i = 0; i < leftArray.length; i++) {
        if (leftArray[i] != rightArray[i]) {
            return false;
        }
    }
    return true;
}

function undateFilePath(filePath: string) {
    let reg = /\//g;
    let unixArkFilePath = path.posix.join(...filePath.split(/\\/));
    return unixArkFilePath.replace(reg, '.');
}