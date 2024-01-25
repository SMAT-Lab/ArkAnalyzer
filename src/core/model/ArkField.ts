import { Property } from "../common/ClassBuilderInfo";
import { ArkClass } from "./ArkClass";
import { FieldSignature } from "./ArkSignature";

export class ArkField {
    declaringClass: ArkClass;
    name: string;
    type: string;
    modifiers: Set<string> = new Set<string>();

    constructor(declaringClass: ArkClass, property: Property) {
        this.declaringClass = declaringClass;
        this.name = property.propertyName;
        this.type = property.type;
        this.modifiers = property.modifiers;
    }

    public getSignature(): FieldSignature {
        return new FieldSignature(this.declaringClass.classSignature, this.name);
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