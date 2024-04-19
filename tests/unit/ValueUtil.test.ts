import { Constant } from "../../src/core/base/Constant";
import { NullType, NumberType, StringType, UndefinedType } from "../../src/core/base/Type";
import { ValueUtil } from "../../src/core/common/ValueUtil";
import { assert, describe, expect, it } from "vitest";

describe("ValueUtil Test", () => {
    it('string case', () => {
        let type = StringType.getInstance();
        expect(ValueUtil.getDefaultInstance(type))
            .toEqual(ValueUtil.getStringTypeDefaultValue());
    })
    it('normal case 2', () => {
        let type = NumberType.getInstance();
        expect(ValueUtil.getDefaultInstance(type))
            .toEqual(ValueUtil.getNumberTypeDefaultValue());
    })
    it('normal case 3', () => {
        let type = UndefinedType.getInstance();
        expect(ValueUtil.getDefaultInstance(type))
            .toEqual(ValueUtil.getUndefinedTypeDefaultValue());
    })
    it('normal case 4', () => {
        let type = NullType.getInstance();
        expect(ValueUtil.getDefaultInstance(type))
            .toEqual(new Constant('null', type));
    })
})