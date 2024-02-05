
import path from 'path';
export class MethodSubSignature {
    private methodName: string = '';
    private parameters: string[] = [];
    private returnType: string[] = [];

    public getMethodName() {
        return this.methodName;
    }

    public setMethodName(methodName: string) {
        this.methodName = methodName;
    }

    public getParameters() {
        return this.parameters;
    }

    public addParameter(Parameter: string) {
        this.parameters.push(Parameter);
    }

    public getReturnType() {
        return this.returnType;
    }

    public addReturnType(type: string) {
        this.returnType.push(type);
    }

    constructor() { }

    build(methodName: string, parameters: Map<string, string>, returnType: string[]) {
        this.setMethodName(methodName);
        parameters.forEach((value, key) => {
            this.addParameter(key);
        });
        returnType.forEach((type) => {
            this.addReturnType(type);
        });
    }

    public toString(): string {
        return `${this.getMethodName()}(${this.getParameters()})`
    }
}

export class MethodSignature {
    private arkClass: ClassSignature = new ClassSignature();
    private methodSubSignature: MethodSubSignature = new MethodSubSignature();

    public getArkClass() {
        return this.arkClass;
    }

    public setArkClass(classSig: ClassSignature) {
        this.arkClass = classSig;
    }

    public getMethodSubSignature() {
        return this.methodSubSignature;
    }

    public setMethodSubSignature(methodSubSig: MethodSubSignature) {
        this.methodSubSignature = methodSubSig;
    }

    constructor() { }

    public build(subSignature: MethodSubSignature, arkClass: ClassSignature) {
        this.setArkClass(arkClass);
        this.setMethodSubSignature(subSignature);
    }

    public toString(): string {
        return `<${this.arkClass.getArkFile()}>.<${this.getArkClass().getClassType()}>.<${this.getMethodSubSignature().getMethodName()}(${this.getMethodSubSignature().getParameters()})>`;
    }
}

export class FieldSignature {
    private arkClass: ClassSignature = new ClassSignature();
    private fieldName: string = '';

    public getArkClass() {
        return this.arkClass;
    }

    public setArkClass(classSig: ClassSignature) {
        this.arkClass = classSig;
    }

    public getFieldName() {
        return this.fieldName;
    }

    public setFieldName(fieldName: string) {
        this.fieldName = fieldName;
    }

    constructor() { }
    public build(arkClass: ClassSignature, fieldName: string) {
        this.setArkClass(arkClass);
        this.setFieldName(fieldName);
    }

    public toString(): string {
        return `<${this.getArkClass().getArkFile()}>.<${this.getArkClass().getClassType()}>.<${this.getFieldName()}>`
    }
}

export class InterfaceSignature {
    private arkFile: string = '';
    private interfaceName: string = '';
    private arkFileWithoutExt: string = '';

    public getArkFile() {
        return this.arkFile;
    }

    public setArkFile(arkFile: string) {
        this.arkFile = arkFile;
    }

    public getInterfaceName() {
        return this.interfaceName;
    }

    public setInterfaceName(interfaceName: string) {
        this.interfaceName = interfaceName;
    }

    constructor() { }

    public build(arkFile: string, interfaceName: string) {
        this.setArkFile(arkFile);
        this.setInterfaceName(interfaceName);
        this.arkFileWithoutExt = path.dirname(arkFile) + '/' + path.basename(arkFile, path.extname(arkFile));
    }

    public toString(): string {
        return `<${this.getArkFile()}>.<#Interface#>.<${this.getInterfaceName()}>`
    }
}

export class ClassSignature {
    private arkFile: string = '';
    private classType: string = '';
    private arkFileWithoutExt: string = '';

    public getArkFile() {
        return this.arkFile;
    }

    public setArkFile(arkFile: string) {
        this.arkFile = arkFile;
    }

    public getClassType() {
        return this.classType;
    }

    public setClassType(classType: string) {
        this.classType = classType;
    }

    constructor() { }

    public build(arkFile: string, classType: string) {
        this.setArkFile(arkFile);
        this.setClassType(classType);
        this.arkFileWithoutExt = path.dirname(arkFile) + '/' + path.basename(arkFile, path.extname(arkFile));
    }

    public toString(): string {
        return `<${this.getArkFile()}>.<${this.getClassType()}>`
    }
}

//TODO, reconstruct
export function fieldSignatureCompare(leftSig: FieldSignature, rightSig: FieldSignature): boolean {
    if (classSignatureCompare(leftSig.getArkClass(), rightSig.getArkClass()) && (leftSig.getFieldName() == rightSig.getFieldName())) {
        return true;
    }
    return false;
}

export function methodSignatureCompare(leftSig: MethodSignature, rightSig: MethodSignature): boolean {
    if (classSignatureCompare(leftSig.getArkClass(), rightSig.getArkClass()) && methodSubSignatureCompare(leftSig.getMethodSubSignature(), rightSig.getMethodSubSignature())) {
        return true;
    }
    return false;
}

export function methodSubSignatureCompare(leftSig: MethodSubSignature, rightSig: MethodSubSignature): boolean {
    if ((leftSig.getMethodName() == rightSig.getMethodName()) && arrayCompare(leftSig.getParameters(), rightSig.getParameters()) && arrayCompare(leftSig.getReturnType(), rightSig.getReturnType())) {
        return true;
    }
    return false;
}

export function classSignatureCompare(leftSig: ClassSignature, rightSig: ClassSignature): boolean {
    if ((leftSig.getArkFile() == rightSig.getArkFile()) && (leftSig.getClassType() == rightSig.getClassType())) {
        return true;
    }
    return false;
}

export function interfaceSignatureCompare(leftSig: InterfaceSignature, rightSig: InterfaceSignature): boolean {
    if ((leftSig.getArkFile() == rightSig.getArkFile()) && (leftSig.getInterfaceName() == rightSig.getInterfaceName())) {
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

export function genSignature4ImportClause(arkFileName: string, importClauseName: string): string {
    return `<${arkFileName}>.<${importClauseName}>`;
}