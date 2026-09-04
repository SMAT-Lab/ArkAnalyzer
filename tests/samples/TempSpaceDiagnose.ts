/*
 * Copyright (c) 2026 Huawei Device Co., Ltd.
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

/**
 * Temp-space diagnosis driver (run with --expose-gc):
 *
 *   node --expose-gc out/tests/samples/TempSpaceDiagnose.js [projectRoot] [projectName]
 *
 * Stages (each writes a heap snapshot + temp-space stats + memory usage):
 *   1. Controlled weak-ref experiment: register/drop/keep + gc => proves
 *      deref()===undefined <=> physically collected (no "dead but retained").
 *   2. buildScene        -> snap 1 (same job as registrations: KeepDuringJob pins all)
 *   3. job boundary + gc -> stats (how many build-phase temp sigs die immediately)
 *   4. inferTypes        -> snap 2 (same job: reproduces the "snapshot shows all temp"
 *                            arithmetic formal+total that looked like a leak)
 *   5. settle (gc x job boundaries)
 *        -> snap 3a BEFORE any sweeping stats call (dead targets already collected;
 *           WeakRef wrapper objects still held by the refs arrays)
 *        -> stats (sweep nulls dead slots)
 *        -> snap 3b (dead WeakRef wrappers now unreachable)
 *
 * Analyze the snapshots with script/analyze-heapsnapshot.js (instance counts +
 * automatic retainer grouping: weak-edge / IR anchor / formal list / refs array).
 */

import { Scene, SceneConfig } from '../../src';
import type { Sdk } from '../../src/Config';
import { SignatureCanonicalizerRegistry } from '../../src/core/common/SignatureCanonicalizerRegistry';
import { TempSignatureCanonicalizer } from '../../src/core/common/TempSignatureCanonicalizer';
import { writeHeapSnapshot } from 'v8';
import { resolve } from 'path';

const PROJECT_ROOT = process.argv[2] ?? 'tests/resources/viewtree/project';
const PROJECT_NAME = process.argv[3] ?? 'project';
const API_SDK_DIR = resolve('tests/resources/Sdk');

function gcFn(): (() => void) | undefined {
    return (globalThis as unknown as { gc?: () => void }).gc;
}

function mem(tag: string): void {
    const m = process.memoryUsage();
    console.log(`[mem]   ${tag}: heapUsed=${(m.heapUsed / 1048576).toFixed(1)}MB heapTotal=${(m.heapTotal / 1048576).toFixed(1)}MB`);
}

/** Prints temp stats (index-table: sync-exact, live = non-retired slots). */
function stats(tag: string): void {
    const s = SignatureCanonicalizerRegistry.getTempSpacesStats();
    const reg = SignatureCanonicalizerRegistry.getInstance();
    const formalField = reg.fieldSigCanonicalizer.size();
    const formalMethod = reg.methodSigCanonicalizer.size();
    const formalClass = reg.classSigCanonicalizer.size();
    console.log(
        `[stats] ${tag}:\n` +
            `        class: live=${s.class.liveCount} total=${s.class.totalRegistered} retired=${s.class.retiredCount} (formal=${formalClass})\n` +
            `        method: live=${s.method.liveCount} total=${s.method.totalRegistered} retired=${s.method.retiredCount} (formal=${formalMethod})\n` +
            `        field: live=${s.field.liveCount} total=${s.field.totalRegistered} retired=${s.field.retiredCount} (formal=${formalField})`
    );
}

function snap(name: string): void {
    const file = `out/diag-${name}.heapsnapshot`;
    console.log(`[snap]  writing ${file} ...`);
    writeHeapSnapshot(file);
    console.log(`[snap]  ${file} done`);
}

/** gc rounds across job boundaries (macrotask, NOT microtask — empirically required
 *  for WeakRef cell clearing / FinalizationRegistry callbacks). */
async function settleGc(rounds: number): Promise<void> {
    const gc = gcFn();
    if (gc === undefined) {
        console.log('[settle] gc() unavailable (start node with --expose-gc); skipping forced collection');
        return;
    }
    for (let i = 0; i < rounds; i++) {
        gc();
        await new Promise<void>(resolve => setImmediate(resolve));
    }
}

/**
 * Experiment 1 — controlled index-table semantics (三版；二版弱引用受控实验随弱表退役).
 * 1000 dropped + 100 anchored registrations:
 * - dropped => still retrievable (slot strong-hold, full-retention design);
 * - retire  => get() undefined + replacement record queryable (migration semantics).
 */
async function controlledIndexTableExperiment(): Promise<void> {
    console.log('\n=== Experiment 1: controlled index-table semantics ===');
    interface Sig {
        readonly name: string;
    }
    const c = new TempSignatureCanonicalizer<Sig>();
    const droppedIds: number[] = [];
    for (let i = 0; i < 1000; i++) {
        droppedIds.push(c.register({ name: `dropped-${i}` }));
    }
    const anchored: Sig[] = [];
    const anchoredIds: number[] = [];
    for (let i = 0; i < 100; i++) {
        const s: Sig = { name: `anchored-${i}` };
        anchored.push(s);
        anchoredIds.push(c.register(s));
    }
    // 全保留：丢弃唯一 JS 持有者后 slot 仍强持有——与 GC 时序无关，同步可断言。
    const stillHeld = droppedIds.filter(id => c.get(id) !== undefined).length;
    const liveCount = anchoredIds.filter(id => c.get(id) !== undefined).length;
    // 迁移语义：retire 置空 + 替换记录（三级查 fallback 的数据源）。
    const probeId = anchoredIds[0];
    c.retireWithReplacement(probeId, 88);
    const st = c.getStats();
    console.log(`[exp1]  dropped 1000 -> still retrievable (slot strong-hold): ${stillHeld} (expect 1000)`);
    console.log(`[exp1]  anchored 100  -> retrievable:                          ${liveCount} (expect 100)`);
    console.log(`[exp1]  retire probe -> get undefined: ${c.get(probeId) === undefined}, replacement: ${c.getReplacement(probeId)} (expect true, 88)`);
    console.log(`[exp1]  stats: live=${st.liveCount} total=${st.totalRegistered} retired=${st.retiredCount} (expect live=1099 total=1100 retired=1)`);
    void anchored;
}

async function main(): Promise<void> {
    console.log(`=== Temp-space diagnosis === node=${process.version} project=${PROJECT_ROOT}`);
    mem('start');

    await controlledIndexTableExperiment();

    console.log('\n=== Stage B: buildScene ===');
    console.log('\n=== Stage B: buildScene ===');
    const config = new SceneConfig();
    // The compiled out/ run cannot resolve the repo default config (config/arkanalyzer.json
    // with enableBuiltIn=true lives at src/../config via __dirname); force it explicitly so
    // the built-in SDK (node_modules/ohos-typescript/lib) is loaded. Attach the local API SDK
    // (tests/resources/Sdk) as well to approach production-scale signature counts.
    config.getOptions().enableBuiltIn = true;
    const apiSdk: Sdk = { name: '', path: API_SDK_DIR, moduleName: '' };
    config.buildConfig(PROJECT_NAME, PROJECT_ROOT, [apiSdk]);
    const scene = new Scene();
    scene.buildBasicInfo(config);
    scene.buildScene4HarmonyProject();
    stats('post-build (index-table: sync-exact)');
    mem('post-build');
    snap('1-postbuild');

    console.log('\n=== Stage B2: job boundary + gc after build (heap observation only) ===');
    await settleGc(3);
    stats('post-build (after gc — reads unchanged: sync-exact)');
    mem('post-build-settled');

    console.log('\n=== Stage C: inferTypes ===');
    scene.inferTypes();
    stats('post-infer (index-table: sync-exact)');
    mem('post-infer');
    snap('2-postinfer');

    console.log('\n=== Stage D: settle (gc x job boundaries — heap observation) ===');
    await settleGc(3);
    // Heap snapshot under full-retention: un-retired temp sigs (including working-set
    // garbage whose holders died) stay strongly held by the slot array — compare with
    // the weak-registry-era snapshots where they were collected after job boundaries.
    snap('3a-settled');
    stats('settled (reads unchanged: sync-exact)');
    mem('post-settle');

    console.log('\n=== Done. Snapshots: out/diag-*.heapsnapshot ===');
    console.log('Analyze with: node script/analyze-heapsnapshot.js out/diag-<stage>.heapsnapshot');
}

main()
    .then(() => process.exit(0))
    .catch(e => {
        console.error(e);
        process.exit(1);
    });
