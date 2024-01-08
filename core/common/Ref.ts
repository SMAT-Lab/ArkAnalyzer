import { Value } from "./Value";

export class ArkArrayRef implements Value {
    private base: Value;  // 数组变量
    private index: Value; // 索引

    constructor(base: Value, index: Value) {
        this.base = base;
        this.index = index;
    }

    public getBase(): Value {
        return this.base;
    }

    public getIndex(): Value {
        return this.index;
    }


    public getUses(): Value[] {
        let uses: Value[] = [this.base, this.index];
        return uses;
    }
}

export class ArkFieldRef implements Value {
    private base: Value;     // 属性变量
    private fieldName: string;
    // private fieldSignature: FieldSignature;  // 属性签名


    constructor(base: Value, fieldName: string) {
        this.base = base;
        this.fieldName = fieldName;
    }

    public getBase(): Value {
        return this.base;
    }

    public getFieldName(): string {
        return this.fieldName;
    }

    public getFieldSignature(): string {
        //TODO: add signature generation here.
        return "";
    }


    public getUses(): Value[] {
        let uses: Value[] = [];
        return uses;
    }
}
