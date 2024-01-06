

export interface Value {
    getUses(): Value[];
}

export enum ValueTag {
    TAINT,
}

export interface LValue extends Value { }