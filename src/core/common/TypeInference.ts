import { AnyType, BooleanType, NeverType, NullType, NumberType, StringType, Type, UndefinedType, UnknownType, VoidType } from "../base/Type";

export class TypeInference {
    // Deal only with simple situations
    public static buildTypeFromStr(typeStr: string): Type {
        switch (typeStr) {
            case 'boolean':
                return BooleanType.getInstance();
            case 'number':
                return NumberType.getInstance();
            case 'string':
                return StringType.getInstance();
            case 'undefined':
                return UndefinedType.getInstance();
            case 'null':
                return NullType.getInstance();
            case 'any':
                return AnyType.getInstance();
            case 'void':
                return VoidType.getInstance();
            case 'never':
                return NeverType.getInstance();
            default:
                return UnknownType.getInstance();
        }
    }
}