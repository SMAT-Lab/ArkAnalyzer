

export interface Value {
    /** Return a list of values which are contained in this value */
    getUses(): Value[];

    /** For print */
    toString(): string;
}

export enum ValueTag {
    TAINT,
}