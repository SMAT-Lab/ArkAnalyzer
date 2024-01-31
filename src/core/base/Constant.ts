import { Value } from "./Value";


export class Constant implements Value {
    private value: string;
    private type: string;

    constructor(value: string, type: string = 'any') {
        this.value = value;
        this.type = type;
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
        // let outStr = this.value;
        // if (this.type == 'string') {
        //     outStr = '\'' + outStr + '\'';
        // }
        return this.value;
    }
}