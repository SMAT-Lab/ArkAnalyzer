/*
 * Temporary diagnostic: dump BaseChangeInfer IR. DELETE after diagnosis.
 */
import { describe, it } from 'vitest';
import path from 'path';
import { FileSignature } from '../../src';
import { ArkIRClassPrinter } from '../../src/save/arkir/ArkIRClassPrinter';
import { buildScene } from './common';

describe('TMP diag: BaseChangeInfer dump', () => {
    it('dump', () => {
        const scene = buildScene(path.join(__dirname, '../resources/inferType'));
        const fileId = new FileSignature(scene.getProjectName(), 'inferSample.ts');
        const file = scene.getFile(fileId);
        const cls = file!.getClassWithName('BaseChangeInfer');
        const printer = new ArkIRClassPrinter(cls!);
        const actual = printer.dump().split('\n');
        for (let i = 0; i < actual.length; i++) {
            console.log(`[A] ${actual[i]}`);
        }
    });
});
