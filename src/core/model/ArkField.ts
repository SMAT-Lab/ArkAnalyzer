import { Type } from "../base/Type";
import { MethodParameter } from "../common/MethodInfoBuilder";
import { ArkClass } from "./ArkClass";
import { FieldSignature } from "./ArkSignature";

export class ArkField {
    private name: string = "";
    private code: string = "";
    private fieldType: string = "";

    private declaringClass: ArkClass;
    //private declaringInterface: ArkInterface;

    private type: Type;
    private parameters: MethodParameter[] = [];
    private typeParameters: Type[] = [];
    private modifiers: Set<string> = new Set<string>();
    private questionToken: boolean = false;
    private exclamationToken: boolean = false;

    private fieldSignature: FieldSignature;

    /* // Deprecated
    private arkSignature: string; */

    //private initializer

    constructor() { }

    /* // Deprecated
    public getArkSignature() {
        return this.arkSignature;
    }

    public setArkSignature(arkSignature: string) {
        this.arkSignature = arkSignature;
    }

    public genArkSignature() {
        this.arkSignature = this.declaringInterface.getArkSignature() + '.' + this.name;
    } */

    public getDeclaringClass() {
        return this.declaringClass;
    }

    public setDeclaringClass(declaringClass: ArkClass) {
        this.declaringClass = declaringClass;
    }

    public getCode() {
        return this.code;
    }

    public setCode(code: string) {
        this.code = code;
    }

    public getFieldType() {
        return this.fieldType;
    }

    public setFieldType(fieldType: string) {
        this.fieldType = fieldType;
    }

    public getName() {
        return this.name;
    }

    public setName(name: string) {
        this.name = name;
    }

    public getType() {
        return this.type;
    }

    public setType(type: Type) {
        this.type = type;
    }

    public getParameters() {
        return this.parameters;
    }

    public setParameters(parameters: MethodParameter[]) {
        this.parameters = parameters;
    }

    public addParameter(parameter: MethodParameter) {
        this.typeParameters.push(parameter);
    }

    public getTypeParameters() {
        return this.typeParameters;
    }

    public setTypeParameters(typeParameters: Type[]) {
        this.typeParameters = typeParameters;
    }

    public addTypeParameters(typeParameter: Type) {
        this.typeParameters.push(typeParameter);
    }

    public getModifiers() {
        return this.modifiers;
    }

    public addModifier(modifier: string) {
        this.modifiers.add(modifier);
    }

    public getSignature(): FieldSignature {
        return this.fieldSignature;
    }

    public setSignature(fieldSig: FieldSignature) {
        this.fieldSignature = fieldSig;
    }

    public genSignature() {
        let fieldSig = new FieldSignature();
        fieldSig.setType(this.type);
        fieldSig.setDeclaringClassSignature(this.declaringClass.getSignature());
        fieldSig.setFieldName(this.name);
        this.setSignature(fieldSig);

        /* // Deprecated
        this.arkSignature = this.declaringClass.getArkSignature() + '.' + this.getName(); */
    }

    public isStatic(): boolean {
        if (this.modifiers.has("StaticKeyword")) {
            return true;
        }
        return false;
    }

    public isProtected(): boolean {
        if (this.modifiers.has("ProtectedKeyword")) {
            return true;
        }
        return false;
    }

    public isPrivate(): boolean {
        if (this.modifiers.has("PrivateKeyword")) {
            return true;
        }
        return false;
    }

    public isPublic(): boolean {
        if (this.modifiers.has("PublicKeyword")) {
            return true;
        }
        return false;
    }

    public isReadonly(): boolean {
        if (this.modifiers.has("ReadonlyKeyword")) {
            return true;
        }
        return false;
    }

    public setQuestionToken(questionToken: boolean) {
        this.questionToken = questionToken;
    }

    public setExclamationToken(exclamationToken: boolean) {
        this.exclamationToken = exclamationToken;
    }

    public getQuestionToken() {
        return this.questionToken;
    }

    public getExclamationToken() {
        return this.exclamationToken;
    }
}