

export interface Value {
    /** Return a list of values which are contained in this value */
    getUses(): Value[];
}

export enum ValueTag {
    TAINT,
}