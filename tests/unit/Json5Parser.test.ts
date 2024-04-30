import { fetchDependenciesFromFile } from '../../src/utils/json5parser';
import { assert, describe, expect, it } from 'vitest';
import path from 'path';

describe("fetchDependenciesFromFile Test", () => {
    it('true case', () => {
        let filePath = path.join(__dirname, '../../package.json');
        let map = fetchDependenciesFromFile(filePath);
        expect(map.size).toBe(0);
    })

    it('f case', () => {
        let filePath = path.join(__dirname, '../sample/sceneBoard.json5');
        let map = fetchDependenciesFromFile(filePath);
        expect(map.size).greaterThan(3);
        assert.isUndefined(map.get('@hw-hmos/abxconvertor'));
        console.log(map);
    })
})