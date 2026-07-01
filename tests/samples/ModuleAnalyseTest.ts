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

import path from 'path';
import { Scene } from '../../src';
import { Logger, LOG_LEVEL, LOG_MODULE_TYPE } from '../../src';
import { SceneConfig } from '../../src';
import { ModuleType } from '../../src';
import { ModuleDepGraph } from '../../src';
import { SCCDetection } from '../../src';

const logger = Logger.getLogger(LOG_MODULE_TYPE.TOOL, 'MODULEANALYSETEST');
Logger.configure('', LOG_LEVEL.ERROR, LOG_LEVEL.INFO, false);

const PROJECT_DIR = 'tests/resources/dependency/exampleProject/MyApplication4Files';

interface ModuleStat {
    name: string;
    type: ModuleType;
    path: string;
    fileCount: number;
}

function moduleTypeLabel(type: ModuleType): string {
    switch (type) {
        case ModuleType.PROJECT:
            return 'PROJECT';
        case ModuleType.OH_MODULES:
            return 'OH_MODULES';
        case ModuleType.SDK:
            return 'SDK';
        default:
            return String(type);
    }
}

function run(): void {
    const sceneConfig = new SceneConfig();
    sceneConfig.buildFromProjectDir(PROJECT_DIR);
    const scene = new Scene();
    scene.config(sceneConfig);

    const stats: ModuleStat[] = [];
    scene.analyseByModule(module => {
        stats.push({
            name: module.getModuleName(),
            type: module.getModuleType(),
            path: module.getModulePath(),
            fileCount: module.getFilesMap().size,
        });
    });

    stats.sort((a, b) => b.fileCount - a.fileCount);

    const projectName = scene.getSceneConfig()?.getTargetProjectName() || path.basename(PROJECT_DIR);

    logger.info('============ Module File Count Statistics ============');
    logger.info(`Project: ${projectName}`);
    logger.info(`Total modules: ${stats.length}`);
    const totalFiles = stats.reduce((sum, s) => sum + s.fileCount, 0);
    logger.info(`Total files: ${totalFiles}`);
    logger.info('------------------------------------------------------');
    for (const s of stats) {
        logger.info(
            `[${moduleTypeLabel(s.type)}] ${s.name}: ${s.fileCount} files  (${s.path})`
        );
    }
    logger.info('======================================================');

    detectCircularDependencies(scene);
    printTopoDependencyGraph(scene);
}

function detectCircularDependencies(scene: Scene): void {
    const depGraph: ModuleDepGraph | undefined = scene.getModuleManager().getDepGraph();
    if (!depGraph) {
        logger.warn('ModuleDepGraph is not available, skip circular dependency detection.');
        return;
    }

    const scc = new SCCDetection<ModuleDepGraph>(depGraph);
    scc.find();

    const cycles: string[][] = [];
    const topoStack = scc.getTopoAndCollapsedNodeStack();
    for (const repId of topoStack) {
        if (!scc.nodeIsInCycle(repId)) {
            continue;
        }
        const memberIds = Array.from(scc.getMySCCNodes(repId));
        const names = memberIds
            .map(id => depGraph.getNode(id)?.getModuleName() ?? String(id))
            .sort();
        cycles.push(names);
    }

    logger.info('============ Circular Dependency (SCC) Detection ============');
    logger.info(`Total dependency edges: ${depGraph.getEdgeCount()}`);
    logger.info(`Cycles detected: ${cycles.length}`);
    logger.info('-------------------------------------------------------------');
    if (cycles.length === 0) {
        logger.info('No circular dependencies found.');
    } else {
        for (let i = 0; i < cycles.length; i++) {
            logger.info(`Cycle #${i + 1} (${cycles[i].length} modules): ${cycles[i].join(' -> ')}`);
        }
    }
    logger.info('=============================================================');
}

function printTopoDependencyGraph(scene: Scene): void {
    const depGraph: ModuleDepGraph | undefined = scene.getModuleManager().getDepGraph();
    if (!depGraph) {
        logger.warn('ModuleDepGraph is not available, skip topo dependency graph.');
        return;
    }

    const topo = depGraph.getTopoOrder();
    if (topo.length === 0) {
        logger.warn('Topo order is empty, skip topo dependency graph.');
        return;
    }

    logger.info('============ Topological Dependency Graph ============');
    logger.info('Modules in topological order (depended-on first):');
    logger.info('------------------------------------------------------');
    for (const id of topo) {
        const module = depGraph.getNode(id);
        const name = module?.getModuleName() ?? String(id);
        const succIds = depGraph.getSuccModuleIds(id);
        if (succIds.length === 0) {
            logger.info(`  ${name}`);
        } else {
            const succNames = succIds
                .map(sid => depGraph.getNode(sid)?.getModuleName() ?? String(sid))
                .join(', ');
            logger.info(`  ${name} -> [${succNames}]`);
        }
    }
    logger.info('======================================================');
}

run();
