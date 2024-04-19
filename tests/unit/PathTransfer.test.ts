import { transfer2UnixPath } from "../../src/utils/pathTransfer";
import { describe, expect, it } from "vitest";

describe("getAllFiles Test", () => {
    it('normal case 1', () => {
        expect(transfer2UnixPath("\\Users\\abc\\.ssh\\")).toEqual("Users/abc/.ssh");
    })
    it('normal case 2', () => {
        expect(transfer2UnixPath("\\")).toEqual(".");
    })
    it('normal case 3', () => {
        expect(transfer2UnixPath("")).toEqual(".");
    })
    it('normal case 4', () => {
        expect(transfer2UnixPath("\\a\\\\b\\c")).toEqual("a/b/c");
    })
    it('normal case 5', () => {
        expect(transfer2UnixPath("a\\\\b\\c")).toEqual("a/b/c");
    })
    it('normal case 6', () => {
        expect(transfer2UnixPath("\\b\\")).toEqual("b");
    })
})