import { fetchDependenciesFromFile } from '../../src/utils/json5parser';
import { assert, describe, expect, it } from 'vitest';
import path from 'path';

describe("fetchDependenciesFromFile Test", () => {
    it('true case', () => {
        let filePath = path.join(__dirname, '../../package.json');
        let map = fetchDependenciesFromFile(filePath);
        assert.isDefined(map.dependencies);
    })

    it('f case', () => {
        let filePath = path.join(__dirname, '../sample/sceneBoard.json5');
        let map = fetchDependenciesFromFile(filePath);
        expect(Object.entries(map.dependencies as Object).length).greaterThan(3);
        assert.isDefined((map.dependencies as Object).hasOwnProperty('@hw-hmos/abxconvertor'));
    })
})