import { CFG } from "../cfg";

class ArkFunction {
    name: string;
    exported: boolean = false;
    declaringClass: ArkClass | null;
    returnType: any;
    parameterTypes: any[] = [];

    stmts: Stmt[] = [];
    cfg: CFG | null;

    constructor(name: string) {
        this.name = name;

        this.declaringClass = null;

        this.cfg = null;
    }
}