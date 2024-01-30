import { Stmt } from "./Stmt";
import { Value } from "./Value";

export class Local implements Value {
    private name: string;
    private type: string;

    private originalValue: Value | null;

    private declaringStmt: Stmt | null;
    private usedStmts: Stmt[];

    constructor(name: string) {
        this.name = name;
        this.type = 'any';

        this.originalValue = null;
        this.declaringStmt = null;
        this.usedStmts = [];
    }

    public getName(): string {
        return this.name;
    }

    public setName(name: string): void {
        this.name = name
    }

    public getType(): string {
        return this.type;
    }

    public setType(type: string): void {
        this.type = type
    }

    public getOriginalValue(): Value | null {
        return this.originalValue;
    }

    public setOriginalValue(originalValue: Value): void {
        this.originalValue = originalValue;
    }

    public getDeclaringStmt(): Stmt | null {
        return this.declaringStmt;
    }

    public setDeclaringStmt(declaringStmt: Stmt) {
        this.declaringStmt = declaringStmt;
    }


    public getUses(): Value[] {
        return [];
    }

    public addUsedStmt(usedStmt: Stmt) {
        this.usedStmts.push(usedStmt);
    }

    public getUsedStmts(): Stmt[] {
        return this.usedStmts;
    }

    public toString(): string {
        return this.getName();
    }
}