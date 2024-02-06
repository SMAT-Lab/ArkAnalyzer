import { Property } from "../common/ClassInfoBuilder";
import { InterfaceProperty } from "../common/InterfaceInfoBuilder";
import { ArkClass } from "./ArkClass";
import { ArkInterface } from "./ArkInterface";
import { FieldSignature } from "./ArkSignature";

export class ArkField {
    private code: string = "";
    private declaringClass: ArkClass;
    private declaringInterface: ArkInterface;
    private name: string = "";
    private type: string = "";
    private modifiers: Set<string> = new Set<string>();
    private fieldSignature: FieldSignature;
    private arkSignature: string;
    private questionToken: boolean = false;
    private exclamationToken: boolean = false;
    //private initializer 

    constructor() { }

    public buildFromArkInteraface(declaringInterface: ArkInterface, property: InterfaceProperty) {
        this.setDeclaringInterface(declaringInterface);
        this.setName(property.getPropertyName())
        this.setType(property.getType());
        property.getModifiers().forEach((modifier) => {
            this.addModifier(modifier);
        });
        this.genSignature();
    }

    public buildFromArkClass(declaringClass: ArkClass, property: Property) {
        this.setDeclaringClass(declaringClass);
        this.setName(property.getPropertyName())
        this.setType(property.getType());
        property.getModifiers().forEach((modifier) => {
            this.addModifier(modifier);
        });
        this.genSignature();
    }

    public getArkSignature() {
        return this.arkSignature;
    }

    public setArkSignature(arkSignature: string) {
        this.arkSignature = arkSignature;
    }

    public genArkSignature() {
        this.arkSignature = this.declaringInterface.getArkSignature() + '.' + this.name;
    }

    public getDeclaringClass() {
        return this.declaringClass;
    }

    public setDeclaringClass(declaringClass: ArkClass) {
        this.declaringClass = declaringClass;
    }

    public getDeclaringInterface() {
        return this.declaringInterface;
    }

    public setDeclaringInterface(declaringInterface: ArkInterface) {
        this.declaringInterface = declaringInterface;
    }

    public getCode() {
        return this.code;
    }

    public setCode(code: string) {
        this.code = code;
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

    public setType(type: string) {
        this.type = type;
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
        fieldSig.build(this.declaringClass.getSignature(), this.getName());
        this.setSignature(fieldSig);
        this.arkSignature = this.declaringClass.getArkSignature() + '.' + this.getName();
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

    public setQuestionToken(questionToken:boolean) {
        this.questionToken = questionToken;
    }

    public setExclamationToken(exclamationToken:boolean) {
        this.exclamationToken = exclamationToken;
    }

    public getQuestionToken() {
        return this.questionToken;
    }

    public getExclamationToken() {
        return this.exclamationToken;
    }
}