import { Local } from "./Local";
import { Value } from "./Value";

export abstract class AbstractRef implements Value {
    abstract getUses(): Value[];    
}

export class ArkArrayRef extends AbstractRef {
    private base: Local;  // 数组变量
    private index: Value; // 索引

    constructor(base: Local, index: Value) {
        super();
        this.base = base;
        this.index = index;
    }

    public getBase(): Value {
        return this.base;
    }

    public setBase(newBase: Local): void {
        this.base = newBase;
    }

    public getIndex(): Value {
        return this.index;
    }

    public setIndex(newIndex: Value): void {
        this.index = newIndex;
    }


    public getUses(): Value[] {
        let uses: Value[] = [];
        uses.push(this.base);
        uses.push(...this.base.getUses());
        uses.push(this.index);
        uses.push(...this.index.getUses());
        return uses;
    }

    public toString(): string {
        return this.base + '[' + this.index + ']';
    }
}

export class ArkFieldRef extends AbstractRef {
    private base: Local;     // 属性变量
    private fieldName: string;
    // private fieldSignature: FieldSignature;  // 属性签名    


    constructor(base: Local, fieldName: string) {
        super();
        this.base = base;
        this.fieldName = fieldName;
    }

    public getBase(): Local {
        return this.base;
    }

    public setBase(newBase: Local): void {
        this.base = newBase;
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
        uses.push(this.base);
        uses.push(...this.base.getUses());
        return uses;
    }

    public toString(): string {
        return this.base.toString() + '.' + this.fieldName;
    }
}
