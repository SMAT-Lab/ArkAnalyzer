

export interface Value {
    getUses(): Value[];

    toString(): string;
}

export enum ValueTag {
    TAINT,
}