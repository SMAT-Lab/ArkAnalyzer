import { ArkClass } from "./ArkClass";
import { ArkField } from "./ArkField";
import { ArkMethod } from "./ArkMethod";
import { Stmt } from "./Stmt";

/**
 * 
 */
export class ArkFile {
    name: string;
    ast: Ast;

    importStmts:Stmt[] = []

    methods:ArkMethod[] = [];
    classes:ArkClass[] = []

    constructor(name: string, ast: Ast) {
        this.name = name;
        this.ast = ast;
    }
}