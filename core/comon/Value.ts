

export interface Value {
    getUses(): Value[];
}


export interface LValue extends Value { }