import { ArkFieldRef } from "../base/Ref";
import { ArkClass } from "./ArkClass";
import { ArkFile } from "./ArkFile";

export class ArkField {
    declaringClass: ArkClass;
    name: string;

    modifiers: Set<string> = new Set<string>();

    constructor(declaringClass: ArkClass, name: string) {
        this.declaringClass = declaringClass;
        this.name = name;
    }

    public getSignature(): string {
        return `<${this.declaringClass.name}.${this.name}>`;
    }

    public isStatic(): boolean {
        if (this.modifiers.has("static")) {
            return true;
        }

        return false;
    }
}