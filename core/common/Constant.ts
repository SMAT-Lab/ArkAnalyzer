import { Value } from "./Value";


export class Constant implements Value {
    private value: string;

    constructor(value: string) {
        this.value = value;
    }

    public getUses(): Value[] {
        return [];
    }
}