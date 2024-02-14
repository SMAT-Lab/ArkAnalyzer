import { ClassSignature, MethodSignature } from "../model/ArkSignature";

export class Type { }

export class ObjectType extends Type {
    private classSignature: ClassSignature;

    public static readonly FUNCTION_CLASS_SIGNATURE = getFunctionClassSignature();
    // private static readonly FUNCTION_TYPE_INSTANCE = new ObjectType(ObjectType.FUNCTION_CLASS_SIGNATURE);

    public static readonly CLASS_CLASS_SIGNATURE = getFunctionClassSignature();
    // private static readonly CLASS_TYPE_INSTANCE = new ObjectType(ObjectType.CLASS_CLASS_SIGNATURE);

    constructor(classSignature: ClassSignature) {
        super();
        this.classSignature = classSignature;
    }

    // public static getFunctionTypeInstance(): ObjectType {
    //     return ObjectType.FUNCTION_TYPE_INSTANCE;
    // }

    // public static getClassTypeInstance(): ObjectType {
    //     return ObjectType.CLASS_TYPE_INSTANCE;
    // }

    public getClassSignature(): ClassSignature {
        return this.classSignature;
    }
}

export class FunctionType extends ObjectType {
    private refMethodSignature: MethodSignature;

    constructor(refMethodSignature: MethodSignature) {
        super(ObjectType.FUNCTION_CLASS_SIGNATURE);
        this.refMethodSignature = refMethodSignature;
    }

    public getRefMethodSignature(): MethodSignature {
        return this.refMethodSignature;
    }
}

export class ClassType extends ObjectType {
    private refClassSignature: ClassSignature;

    constructor(refClassSignature: ClassSignature) {
        super(ObjectType.CLASS_CLASS_SIGNATURE);
        this.refClassSignature = refClassSignature;
    }

    public getRefMethodSignature(): ClassSignature {
        return this.refClassSignature;
    }
}

export class UnknownType extends Type {
    private static readonly INSTANCE = new UnknownType();

    public static getInstance(): UnknownType {
        return UnknownType.INSTANCE;
    }

    constructor() {
        super();
    }

    public toString(): string {
        return 'unknown'
    }
}



// utils
// default signature for class "Function"
function getFunctionClassSignature(): ClassSignature {
    const functionClassSignature = new ClassSignature();
    //functionClassSignature.build('Typescript', 'Function');
    return functionClassSignature;
}

// default signature for class "Class"
function getClassClassSignature(): ClassSignature {
    const functionClassSignature = new ClassSignature();
    //functionClassSignature.build('Typescript', 'Class');
    return functionClassSignature;
}