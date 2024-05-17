import { Type } from "./Type";


export interface Value {
    /** Return a list of values which are contained in this value */
    getUses(): Value[];

    /** Return the type of this value */
    getType():Type;
}

export enum ValueTag {
    TAINT,
}