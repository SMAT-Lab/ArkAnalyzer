import { Constant } from "../base/Constant";
import { NullType, NumberType, StringType, Type } from "../base/Type";

export class ValueUtil {
    private static readonly StringTypeDefaultInstance = new Constant('', StringType.getInstance());
    private static readonly NumberTypeDefaultInstance = new Constant('0', NumberType.getInstance());

    public static getDefaultInstance(type: Type): Constant {
        switch (type) {
            case StringType:
                return this.getStringTypeDefaultValue();
            case NumberType:
                return this.getNumberTypeDefaultValue();
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
}