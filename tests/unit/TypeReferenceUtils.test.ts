import { assert, describe, expect, it } from "vitest";
import * as tr from "../../src/utils/typeReferenceUtils";
import { k } from "vitest/dist/reporters-LqC_WI4d";
import { NodeA } from "../../src/core/base/Ast";
import { ArrayType, BooleanType, NumberType, StringType } from "../../src/core/base/Type";


describe("isPrimaryType Test", () => {
    it('true case', () => {
        assert.isTrue(tr.isPrimaryType("null"))
    })
    it('false case', () => {
        assert.isFalse(tr.isPrimaryType("map"))
    })
})

describe("isPrimaryTypeKeyword Test", () => {
    it('true case', () => {
        assert.isTrue(tr.isPrimaryTypeKeyword("BooleanKeyword"))
    })
    it('false case', () => {
        assert.isFalse(tr.isPrimaryTypeKeyword("map"))
    })
})

describe("resolvePrimaryTypeKeyword Test", () => {
    it('normal case', () => {
        const keywords = ["NumberKeyword", "StringKeyword", "NullKeyword", "String", "BooleanKeyword"]
        keywords.forEach(key => {
            let expect = key;
            if (key.length > 7) {
                expect = key.substring(0, key.length - 7).toLowerCase();
            }
            assert.equal(tr.resolvePrimaryTypeKeyword(key), expect);
        })

    })
    it('empty case', () => {
        assert.isEmpty(tr.resolvePrimaryTypeKeyword("map"))
    })
})

describe("splitType Test", () => {
    it('normal case 1', () => {
        let actucal = tr.splitType("this is a test case   ", " ")
        expect(actucal.length).toBe(5);
        assert.equal(actucal[4], "case");
    })
    it('normal case 2', () => {
        let actucal = tr.splitType("this is  a tool", "")
        expect(actucal.length).toBe(11);
    })
    it('normal case 3', () => {
        let actucal = tr.splitType("", ",")
        assert.isEmpty(actucal);
    })
})

describe("transformArrayToString Test", () => {
    it('normal case 1', () => {
        assert.equal(tr.transformArrayToString(["a", "b"]), "a|b");
    })
    it('normal case 2', () => {
        assert.equal(tr.transformArrayToString([1, 2]), "1|2");
    })
})

describe("buildTypeReferenceString Test", () => {
    it('normal case 1', () => {
        const n1 = new NodeA(undefined, null, [], "unknown", 0, "", undefined, undefined, undefined, undefined, undefined);
        const n2 = new NodeA(undefined, null, [], "test", 0, "DotToken", undefined, undefined, undefined, undefined, undefined);
        const n3 = new NodeA(undefined, null, [], "vi", 0, "Identifier", undefined, undefined, undefined, undefined, undefined);
        assert.equal(tr.buildTypeReferenceString([n1, n2, n3]), ".vi");
    })
})

describe("resolveBinaryResultType Test", () => {
    let str = StringType.getInstance();
    let num = NumberType.getInstance();
    it('+ case 1', () => {
        assert.isTrue(tr.resolveBinaryResultType(str, str, "+") instanceof StringType);
    })
    it('+ case 2', () => {
        assert.isTrue(tr.resolveBinaryResultType(num, str, "+") instanceof StringType);
    })
    it('+ case 3', () => {
        assert.isTrue(tr.resolveBinaryResultType(num, num, "+") instanceof NumberType);
    })
    let arr = new ArrayType(str, 1);
    it('+ case 4', () => {
        assert.isNull(tr.resolveBinaryResultType(arr, num, "+"));
    })
    it('- case 1', () => {
        assert.isNull(tr.resolveBinaryResultType(str, str, "-"));
    })
    it('/ case 1', () => {
        assert.isTrue(tr.resolveBinaryResultType(num, num, "/") instanceof NumberType);
    })
    it('< case 1', () => {
        assert.isTrue(tr.resolveBinaryResultType(str, str, "<") instanceof BooleanType);
    })
    it('& case 1', () => {
        assert.isTrue(tr.resolveBinaryResultType(num, num, "&") instanceof NumberType);
    })
    it('>>> case 1', () => {
        assert.isNull(tr.resolveBinaryResultType(str, num, ">>>"));
    })
})


