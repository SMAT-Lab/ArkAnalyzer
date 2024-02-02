import { Stmt } from "./Stmt";
import { Type, UnknownType } from "./Type";
import { Value } from "./Value";

export class Local implements Value {
    private name: string;
    // TODO:将valueType归一化至type，采用自定义Type类型
    private type: string;
    private valueType: Type;

    private originalValue: Value | null;

    private declaringStmt: Stmt | null;
    private usedStmts: Stmt[];

    constructor(name: string) {
        this.name = name;
        this.type = 'any';

        this.originalValue = null;
        this.declaringStmt = null;
        this.usedStmts = [];

        this.valueType = UnknownType.getInstance();
    }

    public getName(): string {
        return this.name;
    }

    public setName(name: string): void {
        this.name = name
    }

    // TODO:归一至getValueType
    public getType(): string {
        return this.type;
    }

    public getValueType(): Type {
        return this.valueType;
    }

    public setValueType(newType: Type): void {
        this.valueType = newType;
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