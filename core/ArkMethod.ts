import { ArkClass } from "./ArkClass";
import { Stmt } from "./Stmt";

export class ArkMethod {
    name: string;
    exported: boolean = false;
    declaringClass: ArkClass | null;
    returnType: any;
    parameterTypes: any[] = [];

    stmts: Stmt[] = [];

    constructor(name: string) {
        this.name = name;

        this.declaringClass = null;
    }
}