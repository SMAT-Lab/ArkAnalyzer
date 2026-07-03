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

import fs from 'fs';
import path from 'path';
import { Scene } from '../../src';
import { Logger, LOG_LEVEL, LOG_MODULE_TYPE } from '../../src';
import { SceneConfig } from '../../src';
import { ModuleType } from '../../src';
import { ModuleDepGraph, FileDepGraph } from '../../src';
import { SCCDetection } from '../../src';
import { ModuleAnalysisConfig } from '../../src';
import { ModuleDepthLevel } from '../../src';

const logger = Logger.getLogger(LOG_MODULE_TYPE.TOOL, 'ModuleAnalyseTest');

const OUTPUT_DIR = 'out/ModuleAnalyseTest';
fs.mkdirSync(OUTPUT_DIR, { recursive: true });
Logger.configure(path.join(OUTPUT_DIR, 'ModuleAnalyseTest.log'), LOG_LEVEL.ERROR, LOG_LEVEL.INFO, false);

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
    const config = new ModuleAnalysisConfig();
    config.setLoadLevel(ModuleType.PROJECT, ModuleDepthLevel.IMPORTS);
    config.setLoadLevel(ModuleType.OH_MODULES, ModuleDepthLevel.IMPORTS);
    config.setLoadLevel(ModuleType.SDK, ModuleDepthLevel.IMPORTS);
    scene.analyseByModule(module => {
        stats.push({
            name: module.getModuleName(),
            type: module.getModuleType(),
            path: module.getModulePath(),
            fileCount: module.getFilesMap().size,
        });
    }, config);

    stats.sort((a, b) => b.fileCount - a.fileCount);

    const projectName = scene.getSceneConfig()?.getTargetProjectName() || path.basename(PROJECT_DIR);

    logger.info('============ Module File Count Statistics ============');
    logger.info(`Project: ${projectName}`);
    logger.info(`Total modules: ${stats.length}`);
    const totalFiles = stats.reduce((sum, s) => sum + s.fileCount, 0);
    logger.info(`Total files: ${totalFiles}`);
    logger.info('------------------------------------------------------');
    for (const s of stats) {
        logger.info(`[${moduleTypeLabel(s.type)}] ${s.name}: ${s.fileCount} files  (${s.path})`);
    }
    logger.info('======================================================');

    detectCircularDependencies(scene);
    printTopoDependencyGraph(scene);
    printFileDependencyGraphs(scene);
}

function printFileDependencyGraphs(scene: Scene): void {
    logger.info('============ Intra-Module File Dependency Graphs (DOT) ============');
    for (const module of scene.getModules()) {
        const fileDepGraph: FileDepGraph | undefined = module.getFileDepGraph();
        if (!fileDepGraph) {
            continue;
        }

        const moduleName = module.getModuleName();
        const safeModuleName = moduleName.replace(/[^a-zA-Z0-9_-]/g, '_');
        const lines: string[] = [];
        lines.push(`digraph FileDepGraph_${safeModuleName} {`);
        lines.push('    rankdir=LR;');

        // Declare all file nodes
        for (const file of fileDepGraph.nodesItor()) {
            const fileName = path.basename(file.getFilePath());
            lines.push(`    "${fileName}";`);
        }

        // Emit all dependency edges to form a complete graph
        for (const file of fileDepGraph.nodesItor()) {
            const fileId = fileDepGraph.getNodeID(file);
            const srcName = path.basename(file.getFilePath());
            const succIds = fileDepGraph.getSuccFileIds(fileId);
            for (const dstId of succIds) {
                const dstFile = fileDepGraph.getNode(dstId);
                const dstName = path.basename(dstFile.getFilePath());
                lines.push(`    "${srcName}" -> "${dstName}";`);
            }
        }

        lines.push('}');
        logger.info('-------------------------------------------------------------------');

        // Save DOT file
        const dotPath = path.join(OUTPUT_DIR, `FileDepGraph_${safeModuleName}.dot`);
        fs.writeFileSync(dotPath, lines.join('\n') + '\n');
        logger.info(`File dependency graph for ${moduleName} saved to ${dotPath}`);
    }
    logger.info('====================================================================');
}

function detectCircularDependencies(scene: Scene): void {
    const depGraph: ModuleDepGraph | undefined = scene.getModuleDepGraph();
    if (!depGraph) {
        logger.warn('ModuleDepGraph is not available, skip circular dependency detection.');
        return;
    }

    const scc = new SCCDetection<ModuleDepGraph>(depGraph);
    scc.find();

    interface CycleModule {
        name: string;
        path: string;
    }
    const cycles: CycleModule[][] = [];
    const topoStack = scc.getTopoAndCollapsedNodeStack();
    for (const repId of topoStack) {
        if (!scc.nodeIsInCycle(repId)) {
            continue;
        }
        const memberIds = Array.from(scc.getMySCCNodes(repId));
        const modules = memberIds
            .map(id => {
                const module = depGraph.getNode(id);
                return {
                    name: module?.getModuleName() ?? String(id),
                    path: module?.getModulePath() ?? 'unknown',
                };
            })
            .sort((a, b) => a.name.localeCompare(b.name));
        cycles.push(modules);
    }

    logger.info('============ Circular Dependency (SCC) Detection ============');
    logger.info(`Total dependency edges: ${depGraph.getEdgeCount()}`);
    logger.info(`Cycles detected: ${cycles.length}`);
    logger.info('-------------------------------------------------------------');
    if (cycles.length === 0) {
        logger.info('No circular dependencies found.');
    } else {
        for (let i = 0; i < cycles.length; i++) {
            logger.info(`Cycle #${i + 1} (${cycles[i].length} modules):`);
            for (const m of cycles[i]) {
                logger.info(`    - ${m.name} (${m.path})`);
            }
        }
    }
    logger.info('=============================================================');
}

function printTopoDependencyGraph(scene: Scene): void {
    const depGraph: ModuleDepGraph | undefined = scene.getModuleDepGraph();
    if (!depGraph) {
        logger.warn('ModuleDepGraph is not available, skip topo dependency graph.');
        return;
    }

    const topo = depGraph.getTopoOrder();
    if (topo.length === 0) {
        logger.warn('Topo order is empty, skip topo dependency graph.');
        return;
    }

    logger.info('============ Topological Dependency Graph (DOT) ============');
    const lines: string[] = [];
    lines.push('digraph ModuleDepGraph {');
    lines.push('    rankdir=LR;');

    // Declare all nodes in topological order (depended-on first)
    for (const id of topo) {
        const module = depGraph.getNode(id);
        const name = module?.getModuleName() ?? String(id);
        lines.push(`    "${name}";`);
    }

    // Emit all dependency edges to form a complete graph
    for (const id of topo) {
        const module = depGraph.getNode(id);
        const srcName = module?.getModuleName() ?? String(id);
        const succIds = depGraph.getSuccModuleIds(id);
        for (const dstId of succIds) {
            const dstModule = depGraph.getNode(dstId);
            const dstName = dstModule?.getModuleName() ?? String(dstId);
            lines.push(`    "${srcName}" -> "${dstName}";`);
        }
    }

    lines.push('}');
    logger.info('=============================================================');

    // Save DOT file
    const dotPath = path.join(OUTPUT_DIR, 'ModuleDepGraph.dot');
    fs.writeFileSync(dotPath, lines.join('\n') + '\n');
    logger.info(`Module dependency graph saved to ${dotPath}`);
}

run();
