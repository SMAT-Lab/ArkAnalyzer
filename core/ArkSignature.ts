
export class MethodSubSignature {
    methodName: string | undefined;
    parameters: string[] = [];
    returnType: string[] = [];
    constructor(methodName: string | undefined, parameters: string[], returnType: string[]) {
        this.methodName = methodName;
        this.parameters = parameters;
        this.returnType = returnType;
    }
}

export class MethodSignature {
    arkClass: ClassSignature;
    methodSubSignature: MethodSubSignature;
    constructor(subSignature: MethodSubSignature, arkClass:ClassSignature) {
        this.methodSubSignature = subSignature;
        this.arkClass = arkClass;
    }
}

export class ClassSignature {
    arkFile: string;
    classType: string | undefined;//TODO, support ArkClass or not?
    constructor (arkFile:string, classType:string | undefined) {
        this.arkFile = arkFile;
        this.classType = classType;
    }
}

//TODO, reconstruct
export function methodSignatureCompare (leftSig:MethodSignature, rightSig: MethodSignature): boolean {
    if (classSignatureCompare(leftSig.arkClass, rightSig.arkClass) && methodSubSignatureCompare(leftSig.methodSubSignature, rightSig.methodSubSignature)) {
        return true;
    }
    else {
        return false;
    }
}

export function methodSubSignatureCompare (leftSig:MethodSubSignature, rightSig: MethodSubSignature): boolean {
    if ((leftSig.methodName == rightSig.methodName) && arrayCompare(leftSig.parameters, rightSig.parameters) && arrayCompare(leftSig.returnType, rightSig.returnType)) {
        return true;
    }
    else {
        return false;
    }
}

export function classSignatureCompare (leftSig:ClassSignature, rightSig: ClassSignature): boolean {
    if ((leftSig.arkFile == rightSig.arkFile) && (leftSig.classType == rightSig.classType)) {
        return true;
    }
    else {
        return false;
    }
}

function arrayCompare(leftArray:any[], rightArray:any[]) {
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