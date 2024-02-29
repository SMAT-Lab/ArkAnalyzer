import { Constant } from "../base/Constant";
import { NullType, NumberType, StringType, Type, UndefinedType } from "../base/Type";

export class ValueUtil {
    private static readonly StringTypeDefaultInstance = new Constant('', StringType.getInstance());
    private static readonly NumberTypeDefaultInstance = new Constant('0', NumberType.getInstance());
    private static readonly UndefinedTypeDefaultInstance = new Constant('undefined', UndefinedType.getInstance());

    public static getDefaultInstance(type: Type): Constant {
        switch (type) {
            case StringType.getInstance():
                return this.getStringTypeDefaultValue();
            case NumberType.getInstance():
                return this.getNumberTypeDefaultValue();
            case UndefinedType.getInstance():
                return this.getUndefinedTypeDefaultValue();
            default:
                return new Constant('null', NullType.getInstance());
        }
    }

    public static getStringTypeDefaultValue(): Constant {
        return this.StringTypeDefaultInstance;
    }

    public static getNumberTypeDefaultValue(): Constant {
        return this.NumberTypeDefaultInstance;
    }

    public static getUndefinedTypeDefaultValue(): Constant {
        return this.UndefinedTypeDefaultInstance;
    }
}