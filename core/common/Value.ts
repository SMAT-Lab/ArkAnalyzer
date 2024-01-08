

export interface Value {
    getUses(): Value[];
}

export enum ValueTag {
    TAINT,
}