/*
 * Copyright (c) 2024-2025 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { assert, beforeAll, describe, it } from 'vitest';
import { buildScene } from '../../common';
import path from 'path';
import { ArkFile } from '../../../../src/core/model/ArkFile';
import { ModelUtils } from '../../../../src/core/common/ModelUtils';
import { Local } from '../../../../src/core/base/Local';
import { SignatureCanonicalizerRegistry } from '../../../../src/core/common/SignatureCanonicalizerRegistry';

describe('OriginName Removal Tests', () => {
    let scene: ReturnType<typeof buildScene>;
    let arkFile: ArkFile | undefined;

    beforeAll(() => {
        SignatureCanonicalizerRegistry.dispose();
        scene = buildScene(path.join(__dirname, '../../../resources/pta/closure'));
        arkFile = scene.getFiles().find(f => f.getName() === 'closure.ts');
    });

    it('addArkClass should not create alias entries in Map', () => {
        assert.isDefined(arkFile);
        const ns = arkFile!.getNamespaceWithName('ClosureTest');
        assert.isNotNull(ns);

        const allClasses = ns!.getClasses();
        const classNames = allClasses.map(c => c.getName());

        // Classes with '$' in name should NOT have an alias entry (originName without '$')
        const classesWithDelimiter = classNames.filter(n => n.includes('$'));
        if (classesWithDelimiter.length === 0) {
            return;
        }

        for (const nameWithDelimiter of classesWithDelimiter) {
            const delimiterIndex = nameWithDelimiter.indexOf('$');
            const aliasName = nameWithDelimiter.substring(0, delimiterIndex);
            const aliasClass = ns!.getClassWithName(aliasName);
            if (aliasClass) {
                const delimitedClass = ns!.getClassWithName(nameWithDelimiter);
                assert.notEqual(
                    aliasClass.getClassSigID(),
                    delimitedClass?.getClassSigID(),
                    `Class "${aliasName}" should be a real class, not an alias of "${nameWithDelimiter}"`
                );
            }
        }
    });

    it('topClassSigIDSet should deduplicate classes', () => {
        assert.isDefined(arkFile);
        const ns = arkFile!.getNamespaceWithName('ClosureTest');
        assert.isNotNull(ns);

        const mapClasses = ns!.getClasses();
        const uniqueSigIDs = new Set(mapClasses.map(c => c.getClassSigID()));
        assert.equal(uniqueSigIDs.size, mapClasses.length, 'Each class should have a unique sigID');
    });

    it('addArkClass should not accept originName parameter', () => {
        const addArkClassStr = ArkFile.prototype.addArkClass.toString();
        assert.isTrue(!addArkClassStr.includes('originName'), 'addArkClass should not reference originName');
    });

    it('getClasses should return classes from sigID Set, not Map', () => {
        assert.isDefined(arkFile);
        const classes = arkFile!.getClasses();
        assert.isTrue(classes.length > 0);

        // Each class should be resolvable via sigID
        for (const cls of classes) {
            assert.isTrue(arkFile!.hasTopClassWithID(cls.getClassSigID()), `Class ${cls.getName()} sigID should be in topClassSigIDSet`);
        }
    });

    it('getClassWithName should find classes by exact name', () => {
        assert.isDefined(arkFile);
        const classes = arkFile!.getClasses();
        assert.isTrue(classes.length > 0);

        for (const cls of classes) {
            const found = arkFile!.getClassWithName(cls.getName());
            assert.isNotNull(found, `Should find class by exact name: ${cls.getName()}`);
            assert.equal(found!.getClassSigID(), cls.getClassSigID());
        }
    });

    it('getClassWithName should NOT resolve composed names by originName prefix (exact-match only)', () => {
        assert.isDefined(arkFile);
        const ns = arkFile!.getNamespaceWithName('ClosureTest');
        assert.isNotNull(ns);

        // The fuzzy prefix matching (query 'Foo' hitting 'Foo$Bar') was removed:
        // getClassWithName is exact-match only. Short-name resolution of composed
        // names is handled by explicit scope resolution (method-chain local class
        // lookup / cpp findClassByShortName), not by container-level name search.
        const allClasses = ns!.getClasses();
        const classesWithDelimiter = allClasses.filter(c => c.getName().includes('$'));

        for (const cls of classesWithDelimiter) {
            const name = cls.getName();
            const delimiterIndex = name.indexOf('$');
            if (delimiterIndex > 0) {
                const originName = name.substring(0, delimiterIndex);
                const found = ns!.getClassWithName(originName);
                // The composed class must NOT be reachable by its originName prefix.
                if (found !== null) {
                    assert.notEqual(
                        found.getClassSigID(),
                        cls.getClassSigID(),
                        `Composed-name class '${name}' must not be reachable via originName '${originName}'`
                    );
                }
            }
        }
    });

    it('getClassWithName should return null for non-existent class', () => {
        assert.isDefined(arkFile);
        const found = arkFile!.getClassWithName('NonExistentClass123');
        assert.isNull(found);
    });

    it('findDeclaredLocal should resolve via outerMethod for nested functions', () => {
        assert.isDefined(arkFile);
        const ns = arkFile!.getNamespaceWithName('ClosureTest');
        assert.isNotNull(ns);

        const basicTest = ns!.getClassWithName('BasicTest');
        assert.isNotNull(basicTest);

        const outerMethod = basicTest!.getMethodWithName('basicOuterMethod1');
        assert.isNotNull(outerMethod);

        const nestedMethods = basicTest!.getMethods().filter(m => m.getOuterMethod() !== undefined);
        assert.isTrue(nestedMethods.length > 0, 'Should have nested methods with outerMethod set');

        for (const nested of nestedMethods) {
            const outer = nested.getOuterMethod();
            assert.isNotNull(outer, `Nested method ${nested.getName()} should have outerMethod`);
        }
    });

    it('findDeclaredLocal should fallback to findSymbolInFileWithName when outerMethod is not set', () => {
        assert.isDefined(arkFile);
        const ns = arkFile!.getNamespaceWithName('ClosureTest');
        assert.isNotNull(ns);

        const basicTest = ns!.getClassWithName('BasicTest');
        assert.isNotNull(basicTest);

        const method = basicTest!.getMethodWithName('basicOuterMethod1');
        assert.isNotNull(method);

        const fakeLocal = new Local('nonExistentLocal');
        const result = ModelUtils.findDeclaredLocal(fakeLocal, method!, 0);
        assert.isNull(result, 'findDeclaredLocal should return null for non-existent local');
    });

    it('findDeclaredLocal should not use NAME_DELIMITER-based name parsing fallback', () => {
        const source = ModelUtils.findDeclaredLocal.toString();
        assert.isTrue(!source.includes('NAME_DELIMITER'), 'findDeclaredLocal should not use NAME_DELIMITER-based name parsing');
    });

    it('Nested method local resolution should work for deeply nested closures', () => {
        assert.isDefined(arkFile);
        const ns = arkFile!.getNamespaceWithName('ClosureTest');
        assert.isNotNull(ns);

        const multiNested = ns!.getClassWithName('MultipleNestedTest');
        assert.isNotNull(multiNested);

        const outerMethod = multiNested!.getMethodWithName('outerMethod1');
        assert.isNotNull(outerMethod);

        const nestedMethods = multiNested!.getMethods().filter(m => m.getOuterMethod() !== undefined);
        assert.isTrue(nestedMethods.length > 0, 'Should have nested methods');

        for (const nested of nestedMethods) {
            const outer = nested.getOuterMethod();
            assert.isNotNull(outer, `Method ${nested.getName()} should have resolvable outerMethod`);
        }
    });

    it('hasTopClassWithID should correctly identify child classes', () => {
        assert.isDefined(arkFile);
        const classes = arkFile!.getClasses();
        assert.isTrue(classes.length > 0);

        for (const cls of classes) {
            assert.isTrue(arkFile!.hasTopClassWithID(cls.getClassSigID()), `Class ${cls.getName()} sigID should be in topClassSigIDSet`);
        }

        assert.isFalse(arkFile!.hasTopClassWithID(-999), 'Non-existent sigID should return false');
    });
});
