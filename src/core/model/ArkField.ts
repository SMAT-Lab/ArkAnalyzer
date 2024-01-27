import { Property } from "../common/ClassBuilderInfo";
import { ArkClass } from "./ArkClass";
import { FieldSignature } from "./ArkSignature";

export class ArkField {
    private declaringClass: ArkClass;
    private name: string;
    private type: string;
    private modifiers: Set<string> = new Set<string>();
    private fieldSignature: FieldSignature;

    public getDeclaringClass() {
        return this.declaringClass;
    }

    public setDeclaringClass(declaringClass: ArkClass) {
        this.declaringClass = declaringClass;
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

    constructor() { }

    public buildFromArkClass(declaringClass: ArkClass, property: Property) {
        this.setDeclaringClass(declaringClass);
        this.setName(property.propertyName)
        this.setType(property.type);
        property.modifiers.forEach((modifier) => {
            this.addModifier(modifier);
        });
        this.genSignature();
    }

    public genSignature() {
        let fieldSig = new FieldSignature();
        fieldSig.build(this.declaringClass.getSignature(), this.getName());
        this.setSignature(fieldSig);
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
}