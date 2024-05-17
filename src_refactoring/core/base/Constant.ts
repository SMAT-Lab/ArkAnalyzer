import { Type, UnknownType } from "./Type";
import { Value } from "./Value";


export class Constant implements Value {
    private value: string;
    private type: Type;

    constructor(value: string, type: Type = UnknownType.getInstance()) {
        this.value = value;
        this.type = type;
    }

    public getValue(): string {
        return this.value;
    }

    public setValue(newValue: string): void {
        this.value = newValue;
    }

    public getUses(): Value[] {
        return [];
    }

    public getType(): Type {
        return this.type;
    }

    public setType(newType: Type): void {
        this.type = newType
    }

    public toString(): string {
        return this.value;
    }
}