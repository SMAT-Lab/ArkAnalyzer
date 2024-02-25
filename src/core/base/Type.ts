import { ClassSignature, MethodSignature } from "../model/ArkSignature";

export abstract class Type { }


/** any type */
export class AnyType extends Type {
    private static readonly INSTANCE = new AnyType();

    public static getInstance(): AnyType {
        return this.INSTANCE;
    }

    constructor() {
        super();
    }

    public toString(): string {
        return 'any'
    }
}



/** unknown type */
export class UnknownType extends Type {
    private static readonly INSTANCE = new UnknownType();

    public static getInstance(): UnknownType {
        return this.INSTANCE;
    }

    constructor() {
        super();
    }

    public toString(): string {
        return 'unknown'
    }
}



/** unclear type */
export class UnclearType extends Type {
    private name: string;

    constructor(name: string) {
        super();
        this.name = name;
    }

    public getName() {
        return this.name;
    }

    public toString() {
        return this.name;
    }
}



/** primitive type */
export abstract class PrimitiveType extends Type {
    private name: string;

    constructor(name: string) {
        super();
        this.name = name;
    }

    public getName() {
        return this.name;
    }

    public toString() {
        return this.name;
    }
}

export class BooleanType extends PrimitiveType {
    private static readonly INSTANCE = new BooleanType();

    constructor() {
        super('boolean');
    }

    public static getInstance() {
        return this.INSTANCE;
    }
}

export class NumberType extends PrimitiveType {
    private static readonly INSTANCE = new NumberType();

    constructor() {
        super('number');
    }

    public static getInstance() {
        return this.INSTANCE;
    }
}

export class StringType extends PrimitiveType {
    private static readonly INSTANCE = new StringType();

    constructor() {
        super('string');
    }

    public static getInstance() {
        return this.INSTANCE;
    }
}

/** null type */
export class NullType extends PrimitiveType {
    private static readonly INSTANCE = new NullType();

    public static getInstance(): NullType {
        return this.INSTANCE;
    }

    constructor() {
        super('null');
    }
}

/** undefined type */
export class UndefinedType extends PrimitiveType {
    private static readonly INSTANCE = new UndefinedType();

    public static getInstance(): UndefinedType {
        return this.INSTANCE;
    }

    constructor() {
        super('undefined');
    }
}

/** literal type */
export class LiteralType extends PrimitiveType {
    private literalName: string | number;

    constructor(literalName: string | number) {
        super('literal');
        this.literalName = literalName;
    }

    public getliteralName(): string | number {
        return this.literalName;
    }

    public toString(): string {
        return this.getName() + ': ' + this.literalName;
    }
}

/** union types */
export class UnionType extends Type {
    private types: Type[];
    constructor(types: Type[]) {
        super();
        this.types = [...types];
    }

    public getTypes(): Type[] {
        return this.types;
    }
}

// types for function
/** void return type */
export class VoidType extends Type {
    private static readonly INSTANCE = new VoidType();

    public static getInstance(): VoidType {
        return this.INSTANCE;
    }

    constructor() {
        super();
    }

    public toString(): string {
        return 'void'
    }
}

export class NeverType extends Type {
    private static readonly INSTANCE = new NeverType();

    public static getInstance(): NeverType {
        return this.INSTANCE;
    }

    constructor() {
        super();
    }

    public toString(): string {
        return 'never'
    }
}

/** callable type */
export class CallableType extends Type {
    private methodSignature: MethodSignature;

    constructor(methodSignature: MethodSignature) {
        super();
        this.methodSignature = methodSignature;
    }

    public getMethodSignature(): MethodSignature {
        return this.methodSignature;
    }

    public toString(): string {
        return this.methodSignature.toString();
    }
}


export class ClassType extends Type {
    private classSignature: ClassSignature;

    constructor(classSignature: ClassSignature) {
        super();
        this.classSignature = classSignature;
    }

    public getClassSignature(): ClassSignature {
        return this.classSignature;
    }

    public toString(): string {
        return this.classSignature.toString();
    }
}

export class ArrayType extends Type {
    private baseType: Type;
    private dimension: number;

    constructor(baseType: Type, dimension: number) {
        super();
        this.baseType = baseType;
        this.dimension = dimension;
    }
}

export class AliasType extends Type {
    private originalType: Type;
    constructor(originalType: Type) {
        super();
        this.originalType = originalType;
    }

    public getOriginalType(): Type {
        return this.originalType;
    }

    public toString(): string {
        return 'alias: ' + this.originalType;
    }
}

export class ClassAliasType extends AliasType {
    constructor(classType: ClassType) {
        super(classType);
    }
}




// export class ObjectType extends Type {
//     private classSignature: ClassSignature;

//     public static readonly FUNCTION_CLASS_SIGNATURE = getFunctionClassSignature();
//     // private static readonly FUNCTION_TYPE_INSTANCE = new ObjectType(ObjectType.FUNCTION_CLASS_SIGNATURE);

//     public static readonly CLASS_CLASS_SIGNATURE = getFunctionClassSignature();
//     // private static readonly CLASS_TYPE_INSTANCE = new ObjectType(ObjectType.CLASS_CLASS_SIGNATURE);

//     constructor(classSignature: ClassSignature) {
//         super();
//         this.classSignature = classSignature;
//     }

//     // public static getFunctionTypeInstance(): ObjectType {
//     //     return ObjectType.FUNCTION_TYPE_INSTANCE;
//     // }

//     // public static getClassTypeInstance(): ObjectType {
//     //     return ObjectType.CLASS_TYPE_INSTANCE;
//     // }

//     public getClassSignature(): ClassSignature {
//         return this.classSignature;
//     }
// }

// export class FunctionType extends ObjectType {
//     private refMethodSignature: MethodSignature;

//     constructor(refMethodSignature: MethodSignature) {
//         super(ObjectType.FUNCTION_CLASS_SIGNATURE);
//         this.refMethodSignature = refMethodSignature;
//     }

//     public getRefMethodSignature(): MethodSignature {
//         return this.refMethodSignature;
//     }
// }

// export class ClassType extends ObjectType {
//     private refClassSignature: ClassSignature;

//     constructor(refClassSignature: ClassSignature) {
//         super(ObjectType.CLASS_CLASS_SIGNATURE);
//         this.refClassSignature = refClassSignature;
//     }

//     public getRefMethodSignature(): ClassSignature {
//         return this.refClassSignature;
//     }
// }

// // utils
// // default signature for class "Function"
// function getFunctionClassSignature(): ClassSignature {
//     const functionClassSignature = new ClassSignature();
//     //functionClassSignature.build('Typescript', 'Function');
//     return functionClassSignature;
// }

// // default signature for class "Class"
// function getClassClassSignature(): ClassSignature {
//     const functionClassSignature = new ClassSignature();
//     //functionClassSignature.build('Typescript', 'Class');
//     return functionClassSignature;
// }