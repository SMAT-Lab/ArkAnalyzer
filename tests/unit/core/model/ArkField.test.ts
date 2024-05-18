import { describe, expect, it } from "vitest"
import { ArkField } from "../../../../src/core/model/ArkField";
import { Decorator, TypeDecorator } from "../../../../src/core/base/Decorator";

describe("ArkField Test", () => {
    it('test getDecorators', async () => {
        let field = new ArkField();
        field.addModifier(new Decorator('State'));
        field.addModifier('static');
        field.addModifier('public');
        field.addModifier(new TypeDecorator());
        expect(field.getDecorators().length).eq(2);
    })
})