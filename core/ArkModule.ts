import { ArkClass } from "./ArkClass";
import { ArkField } from "./ArkField";
import { ArkMethod } from "./ArkMethod";
import { Stmt } from "./Stmt";

/**
 * A TS file is regarded as a module.
 */
export class ArkModule {
    name: string;

    importStmts:Stmt[] = []

    methods:ArkMethod[] = [];
    classes:ArkClass[] = []

    constructor(name: string) {
        this.name = name;
    }
}