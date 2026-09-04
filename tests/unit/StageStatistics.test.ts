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

import { describe, expect, it } from 'vitest';
import path from 'path';
import { Scene, SceneConfig } from '../../src';
import { StageName } from '../../src/statistics/StageStatistics';
import { StageStatisticsReporter } from '../../src/statistics/StageStatisticsReporter';

describe('StageStatistics integration Test', () => {
    it('builder sub-stages are collected when enableStatistics is on', () => {
        const config = new SceneConfig({ enableStatistics: true });
        config.buildFromProjectDir(path.resolve('tests/resources/pta/Container'));
        config.getSdksObj().push({ name: 'ohos', path: './node_modules/typescript/lib', moduleName: '' });
        const scene = new Scene();
        scene.buildSceneFromProjectDir(config);
        scene.inferTypes();

        const data = scene.getStageStatistics();
        expect(data).toBeDefined();
        const names = data!.stages.map(s => s.name.split('#')[0]);
        // SceneBuilder 迁移后的细分构建阶段 + 总阶段。
        expect(names).toContain(StageName.Builder);
        expect(names).toContain(StageName.BuilderParseConfigs);
        expect(names).toContain(StageName.BuilderSdk);
        expect(names).toContain(StageName.BuilderFiles);
        expect(names).toContain(StageName.BuilderBodies);
        // SDK 子阶段（round21：file build 与类型推导拆分）。
        expect(names).toContain(StageName.BuilderSdkFiles);
        expect(names).toContain(StageName.BuilderSdkInfer);
        // 推断阶段（新架构无 InferTypesInit——零排序遍历）。
        expect(names).toContain(StageName.InferTypes);
        expect(names).toContain(StageName.InferTypesFinalize);
        // 每个阶段有非负时长与内存快照。
        for (const stage of data!.stages) {
            expect(stage.durationMs).toBeGreaterThanOrEqual(0);
            expect(stage.memBefore.rssMB).toBeGreaterThanOrEqual(0);
            expect(stage.memAfter.rssMB).toBeGreaterThanOrEqual(0);
            expect(stage.memPeak.rssMB).toBeGreaterThanOrEqual(stage.memBefore.rssMB);
        }
        // 层级关系：细分阶段的 parent 指向其外层阶段（唯一名）。
        const byName = new Map(data!.stages.map(s => [s.name, s]));
        expect(byName.get(StageName.BuilderParseConfigs)?.parent).toBe(StageName.Builder);
        expect(byName.get(StageName.BuilderSdk)?.parent).toBe(StageName.Builder);
        expect(byName.get(StageName.BuilderFiles)?.parent).toBe(StageName.Builder);
        expect(byName.get(StageName.BuilderBodies)?.parent).toBe(StageName.Builder);
        expect(byName.get(StageName.BuilderSdkFiles)?.parent).toBe(StageName.BuilderSdk);
        expect(byName.get(StageName.BuilderSdkInfer)?.parent).toBe(StageName.BuilderSdk);
        // 签名空间快照：两个时点（post-build / post-infer），数据非负且自洽。
        const labels = data!.signatureSnapshots.map(s => s.label);
        expect(labels).toContain('post-build');
        expect(labels).toContain('post-infer');
        for (const snap of data!.signatureSnapshots) {
            for (const count of Object.values(snap.formal)) {
                expect(count).toBeGreaterThanOrEqual(0);
            }
            for (const space of [snap.temp.class, snap.temp.method, snap.temp.field]) {
                expect(space.liveCount).toBeGreaterThanOrEqual(0);
                expect(space.totalRegistered).toBe(space.liveCount + space.retiredCount);
            }
            // pta/Container 场景含 ohos SDK：formal class/method 空间非空。
            expect(snap.formal.class).toBeGreaterThan(0);
            expect(snap.formal.method).toBeGreaterThan(0);
        }
        // 报告文本：层级缩进 + Signature section。
        const reportText = StageStatisticsReporter.exportToText(StageStatisticsReporter.generateReport(data!));
        expect(reportText).toContain('Stage Statistics');
        expect(reportText).toContain('Signature Statistics');
        expect(reportText).toContain('[post-build]');
        expect(reportText).toContain('[post-infer]');
        // SDK 子阶段行比外层缩进两级（builder 顶层 -> builderSdk 一级 -> 子阶段两级）。
        const lines = reportText.split('\n');
        const sdkSubLine = lines.find(l => l.includes(`[${StageName.BuilderSdkFiles}]`));
        expect(sdkSubLine).toBeDefined();
        expect(sdkSubLine!.startsWith('    [')).toBe(true);
        // 总时长与全局内存快照有效。
        expect(data!.totalDurationMs).toBeGreaterThan(0);
        expect(data!.globalMemBefore.rssMB).toBeGreaterThan(0);
        expect(data!.globalMemPeak.rssMB).toBeGreaterThanOrEqual(data!.globalMemBefore.rssMB);
    });

    it('statistics is off by default (no stages, no data)', () => {
        const config = new SceneConfig();
        config.buildFromProjectDir(path.resolve('tests/resources/pta/Container'));
        config.getSdksObj().push({ name: 'ohos', path: './node_modules/typescript/lib', moduleName: '' });
        const scene = new Scene();
        scene.buildSceneFromProjectDir(config);
        scene.inferTypes();
        expect(scene.getStageStatistics()).toBeUndefined();
    });

    it('printStageStatistics marks the report as written', () => {
        const config = new SceneConfig({ enableStatistics: true });
        config.buildFromProjectDir(path.resolve('tests/resources/pta/Container'));
        config.getSdksObj().push({ name: 'ohos', path: './node_modules/typescript/lib', moduleName: '' });
        const scene = new Scene();
        scene.buildSceneFromProjectDir(config);
        scene.printStageStatistics();
        // 幂等：重复打印不再产生副作用（statsReportWritten 已置位）。
        expect(() => scene.printStageStatistics()).not.toThrow();
        // exit hook 不会重复输出（statsReportWritten 已置位）。
        scene.dispose();
    });

    it('exportStageStatisticsReport writes a report file', () => {
        const config = new SceneConfig({ enableStatistics: true });
        config.buildFromProjectDir(path.resolve('tests/resources/pta/Container'));
        config.getSdksObj().push({ name: 'ohos', path: './node_modules/typescript/lib', moduleName: '' });
        const scene = new Scene();
        scene.buildSceneFromProjectDir(config);
        const outPath = path.join(process.env.TEMP ?? './out', 'stage-stats-test-report.txt');
        const written = scene.exportStageStatisticsReport(outPath);
        expect(written).toBe(true);
        // 禁用时导出返回 false。
        const plainScene = new Scene();
        expect(plainScene.exportStageStatisticsReport(outPath)).toBe(false);
        scene.dispose();
    });
});
