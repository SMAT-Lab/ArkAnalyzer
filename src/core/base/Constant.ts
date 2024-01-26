import { Value } from "./Value";


export class Constant implements Value {
    private value: string;
    private type: string;

    constructor(value: string) {
        this.value = value;
        this.type = ""
    }

    public getValue(): string {
        return this.value;
    }

    public getUses(): Value[] {
        return [];
    }

    public getType(): string {
        return this.type;
    }

    public setType(type: string): void {
        this.type = type
    }

    public toString(): string {
        return this.value;
    }
}