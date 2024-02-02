import { ClassSignature } from "../model/ArkSignature";
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

export abstract class AbstractFieldRef extends AbstractRef {
    private fieldName: string;

    constructor(fieldName: string) {
        super();
        this.fieldName = fieldName;
    }

    public getFieldName(): string {
        return this.fieldName;
    }

    public getFieldSignature(): string {
        //TODO: add signature generation here.
        return "";
    }
}

export class ArkInstanceFieldRef extends AbstractFieldRef {
    private base: Local;       // which obj this field belong to

    constructor(base: Local, fieldName: string) {
        super(fieldName);
        this.base = base;
    }

    public getBase(): Local {
        return this.base;
    }

    public setBase(newBase: Local): void {
        this.base = newBase;
    }

    public getUses(): Value[] {
        let uses: Value[] = [];
        uses.push(this.base);
        uses.push(...this.base.getUses());
        return uses;
    }

    public toString(): string {
        return this.base.toString() + '.' + this.getFieldName();
    }
}

export class ArkStaticFieldRef extends AbstractFieldRef {
    constructor(fieldName: string) {
        super(fieldName);
    }

    public getUses(): Value[] {
        let uses: Value[] = [];
        return uses;
    }

    public toString(): string {
        return this.getFieldName();
    }
}

export class ArkParameterRef extends AbstractRef {
    private index: number;
    private paramType: string;

    constructor(index: number, paramType: string) {
        super();
        this.index = index;
        this.paramType = paramType;
    }

    public getIndex(): number {
        return this.index;
    }

    public getType(): string {
        return this.paramType;
    }

    public getUses(): Value[] {
        let uses: Value[] = [];
        return uses;
    }

    public toString(): string {
        return 'parameter' + this.index + ': ' + this.paramType;
    }
}


export class ArkThisRef extends AbstractRef {
    private type: string;

    constructor(type: string) {
        super();
        this.type = type;
    }

    public getType(): string {
        return this.type;
    }

    public getUses(): Value[] {
        let uses: Value[] = [];
        return uses;
    }

    public toString(): string {
        return 'this: ' + this.type;
    }
}

export class ArkCaughtExceptionRef extends AbstractRef {
    private type: string;

    constructor(type: string) {
        super();
        this.type = type;
    }

    public getType(): string {
        return this.type;
    }

    public getUses(): Value[] {
        let uses: Value[] = [];
        return uses;
    }

    public toString(): string {
        return 'caughtexception: ' + this.type;
    }
}

// for class expression assignment
export class ArkClassRef extends AbstractRef {
    private classSignature: ClassSignature;

    constructor(classSignature: ClassSignature) {
        super();
        this.classSignature = classSignature;
    }

    public getClassSignature(): ClassSignature {
        return this.classSignature;
    }

    public getUses(): Value[] {
        let uses: Value[] = [];
        return uses;
    }

    public toString(): string {
        return this.classSignature.toString();
    }
}

// for method expression assignment
// export class ArkMethodRef extends AbstractRef {
//     private methodSignature: MethodSignature;

//     constructor(methodSignature: MethodSignature) {
//         super();
//         this.methodSignature = methodSignature;
//     }

//     public getMethodSignature(): MethodSignature {
//         return this.methodSignature;
//     }

//     public getUses(): Value[] {
//         let uses: Value[] = [];
//         return uses;
//     }

//     public toString(): string {
//         return this.methodSignature.toString();
//     }
// }