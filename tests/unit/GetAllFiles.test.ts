import { getAllFiles } from "../../src/utils/getAllFiles";
import { assert, describe, expect, it } from "vitest";

describe("getAllFiles Test", () => {
    it('normal case 1', () => {
        let files = getAllFiles(".vscode.sample", [".json"]);
        expect(files.length).toBe(1);
        assert.isTrue(files[0].includes("launch.json"));
    })
    it('normal case 2', () => {
        let files = ["test"];
        getAllFiles(".vscode.sample", [".json"], files);
        expect(files.length).toBe(2);
        assert.isTrue(files[1].includes("launch.json"));
    })
    it('normal case 3', () => {
        let files = getAllFiles("tests", [".json", ".ts"]);
        assert.isNotNull(undefined);
        assert.isNotNull(files.find(file => file.includes("sample.ts")));
        assert.isNotNull(files.find(file => file.includes("TypeTestConfig.ts")));
    })
    it('not exist path case', () => {
        let files = getAllFiles("nonexist", [".json"]);
        expect(files.length).toBe(0);
    })
})