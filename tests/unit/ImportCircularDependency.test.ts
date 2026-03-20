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
 * WITHOUT WARRANTIES OR CONDITIONS OF KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the License.
 */

/**
 * Issue #915: Type inference stack overflow on circular dependencies.
 * Verifies that build and resolution complete without throwing when circular imports exist.
 */
import { assert, describe, it } from 'vitest';
import path from 'path';
import { FileSignature, Scene, SceneConfig } from '../../src';

// --- Constants ---

const PROJECT_NAME = 'circularImport';
const RESOURCES_DIR = path.join(__dirname, '../resources/circularImport');
const INFERENCE_TIMEOUT_MS = 10000;

/** File sets for each circular dependency scenario */
const CIRCULAR_INHERITANCE_FILES = ['ExtendA.ts', 'ExtendB.ts'] as const;
const CIRCULAR_REEXPORT_FILES = ['LazyA.ts', 'LazyB.ts', 'LazyConsumer.ts'] as const;
const EXPORT_STAR_REEXPORT_FILES = ['VisitedA.ts', 'VisitedB.ts', 'VisitedConsumer.ts'] as const;

// --- Helpers ---

/**
 * Builds a scene from the given file list with built-in disabled.
 * Used to isolate circular dependency scenarios.
 */
function buildSceneFromFiles(fileNames: readonly string[]): Scene {
    const config = new SceneConfig();
    config.buildFromProjectFiles(PROJECT_NAME, RESOURCES_DIR, [...fileNames]);
    config.getOptions().enableBuiltIn = false;

    const scene = new Scene();
    scene.buildSceneFromFiles(config);
    scene.inferTypes();
    return scene;
}

/** Asserts that both files and their exported classes exist in the scene */
function assertCircularClassesLoaded(scene: Scene, fileA: string, fileB: string, classA: string, classB: string): void {
    const arkFileA = scene.getFile(new FileSignature(PROJECT_NAME, fileA));
    const arkFileB = scene.getFile(new FileSignature(PROJECT_NAME, fileB));
    assert.isDefined(arkFileA, `${fileA} should be loaded`);
    assert.isDefined(arkFileB, `${fileB} should be loaded`);

    assert.isDefined(arkFileA?.getClassWithName(classA), `${classA} class should exist`);
    assert.isDefined(arkFileB?.getClassWithName(classB), `${classB} class should exist`);
}

// --- Tests ---

describe('Issue #915: Circular import - expected behavior', () => {
    describe('Circular class inheritance', () => {
        it('completes build and inference without stack overflow (ExtendA ↔ ExtendB)', { timeout: INFERENCE_TIMEOUT_MS }, () => {
            const scene = buildSceneFromFiles(CIRCULAR_INHERITANCE_FILES);
            assertCircularClassesLoaded(scene, 'ExtendA.ts', 'ExtendB.ts', 'ExtendA', 'ExtendB');
        });
    });

    describe('Circular re-export (getLazyExportInfo)', () => {
        it('completes without stack overflow; may return null for undefined circular symbol', { timeout: INFERENCE_TIMEOUT_MS }, () => {
            const scene = buildSceneFromFiles(CIRCULAR_REEXPORT_FILES);
            const consumer = scene.getFile(new FileSignature(PROJECT_NAME, 'LazyConsumer.ts'));
            assert.isDefined(consumer, 'LazyConsumer.ts should be loaded');

            const importInfo = consumer?.getImportInfoBy('Sym');
            assert.isDefined(importInfo, 'Consumer should import Sym');

            const exportInfo = importInfo!.getLazyExportInfo();
            assert.isTrue(exportInfo === null || exportInfo !== undefined,
                'getLazyExportInfo must complete without stack overflow (null allowed for circular undefined)');
        });
    });

    describe('Export * with re-export (visited coverage)', () => {
        it('resolves local export when export * would overwrite (VisitedA defines X, VisitedB re-exports)', {
            timeout: INFERENCE_TIMEOUT_MS
        }, () => {
            const scene = buildSceneFromFiles(EXPORT_STAR_REEXPORT_FILES);
            const consumer = scene.getFile(new FileSignature(PROJECT_NAME, 'VisitedConsumer.ts'));
            assert.isDefined(consumer, 'VisitedConsumer.ts should be loaded');

            const importInfo = consumer?.getImportInfoBy('X');
            assert.isDefined(importInfo, 'Consumer should import X');

            const exportInfo = importInfo!.getLazyExportInfo();
            assert.isDefined(exportInfo, 'getLazyExportInfo must complete without stack overflow');
            assert.isDefined(exportInfo!.getArkExport(), 'X must resolve from VisitedA (export const X = 1)');
        });
    });
});
