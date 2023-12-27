import { Value, LValue } from "./Value";

export class Local implements LValue {
    private name: string;

    constructor(name: string) {
        this.name = name;
    }

    public getName(): string {
        return this.name;
    }

    public getUses(): Value[] {
        return [];
    }
}