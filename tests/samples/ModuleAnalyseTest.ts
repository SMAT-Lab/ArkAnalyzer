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
import { ArkFile } from '../../src';
import { ArkClass } from '../../src';
import { ArkNamespace } from '../../src';
import { ArkMethod } from '../../src';

const logger = Logger.getLogger(LOG_MODULE_TYPE.TOOL, 'ModuleAnalyseTest');

const OUTPUT_DIR = 'out/ModuleAnalyseTest';
fs.mkdirSync(OUTPUT_DIR, { recursive: true });
Logger.configure(path.join(OUTPUT_DIR, 'ModuleAnalyseTest.log'), LOG_LEVEL.ERROR, LOG_LEVEL.INFO, false);

const PROJECT_DIR = process.env.PROJECT_DIR || 'tests/resources/dependency/exampleProject/MyApplication4Files';
const VERBOSE = process.env.VERBOSE === 'true';

const SDK_BASE = '/home/kubrickai/codes/resources/commandline-tools-linux-x64-6.1.1.280/command-line-tools/sdk/default';
const SDK_CONFIGS = [
    { name: 'hms', path: `${SDK_BASE}/hms/ets`, moduleName: '' },
    { name: 'openharmony', path: `${SDK_BASE}/openharmony/ets`, moduleName: '' },
];

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

// --- Structured comparison types ---

enum DiscrepancyCategory {
    STRUCTURAL,
    CONTENT,
}

enum ModelType {
    ARK_FILE = 'ArkFile',
    ARK_NAMESPACE = 'ArkNamespace',
    ARK_CLASS = 'ArkClass',
    ARK_METHOD = 'ArkMethod',
    ARK_FIELD = 'ArkField',
    IMPORT_INFO = 'ImportInfo',
    EXPORT_INFO = 'ExportInfo',
    METHOD_BODY = 'MethodBody',
}

interface Discrepancy {
    category: DiscrepancyCategory;
    filePath: string;
    modelType: ModelType;
    label: string;
    valueA?: string;
    valueB?: string;
}

class ModuleAnalyseTest {
    private discrepancies: Discrepancy[] = [];

    /**
     * Build the scene via analyseByModule at IMPORTS level and log module statistics,
     * circular dependencies, topological dependency graph, and file dependency graphs.
     */
    public testModuleAnalysis(): void {
        logger.info('testModuleAnalysis start');

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

        this.detectCircularDependencies(scene);
        this.printTopoDependencyGraph(scene);
        this.printFileDependencyGraphs(scene);

        logger.info('testModuleAnalysis end\n');
    }

    /**
     * Compare the scene built via analyseByModule against the scene built via
     * buildSceneFromFiles. Verifies structural and content equivalence of the IR
     * produced by both approaches.
     */
    public compareScenesFromAnalyseByModuleAndBuildSceneFromFiles(): void {
        logger.info('compareScenesFromAnalyseByModuleAndBuildSceneFromFiles start');

        const { scene: sceneA, elapsed: tA } = this.buildSceneViaAnalyseByModule();
        const { scene: sceneB, elapsed: tB } = this.buildSceneViaBuildSceneFromFiles();

        console.log(`Timing: analyseByModule=${tA}ms, buildSceneFromFiles=${tB}ms`);

        this.discrepancies = [];
        this.compareSceneFiles(sceneA, sceneB);
        this.reportDiscrepancies(tA, tB);

        logger.info('compareScenesFromAnalyseByModuleAndBuildSceneFromFiles end\n');
    }

    /**
     * Build a scene via analyseByModule (PROJECT at BODIES, OH_MODULES/SDK at IMPORTS)
     * with type inference enabled, and return it with elapsed time.
     */
    private buildSceneViaAnalyseByModule(): { scene: Scene; elapsed: number } {
        const sceneConfig = new SceneConfig();
        sceneConfig.buildFromProjectDir(PROJECT_DIR);
        SDK_CONFIGS.forEach(sdk => sceneConfig.getSdksObj().push(sdk));
        const scene = new Scene();
        scene.config(sceneConfig);

        const config = new ModuleAnalysisConfig();
        config.setLoadLevel(ModuleType.PROJECT, ModuleDepthLevel.BODIES);
        config.setLoadLevel(ModuleType.OH_MODULES, ModuleDepthLevel.BODIES);
        config.setLoadLevel(ModuleType.SDK, ModuleDepthLevel.BODIES);
        config.setEnableTypeInference(true);
        logger.info('=== analyseByModule build start ===');
        const start = Date.now();
        scene.analyseByModule(() => {}, config);
        const elapsed = Date.now() - start;
        logger.info(`=== analyseByModule build end (${elapsed}ms) ===`);
        return { scene, elapsed };
    }

    /**
     * Build a scene via buildSceneFromFiles with type inference, and return it with elapsed time.
     * The type inference call is added to match the analysis result level of analyseByModule.
     */
    private buildSceneViaBuildSceneFromFiles(): { scene: Scene; elapsed: number } {
        const sceneConfig = new SceneConfig();
        sceneConfig.buildFromProjectDir(PROJECT_DIR);
        SDK_CONFIGS.forEach(sdk => sceneConfig.getSdksObj().push(sdk));
        const scene = new Scene();
        logger.info('=== buildSceneFromFiles build start ===');
        const start = Date.now();
        scene.buildSceneFromFiles(sceneConfig);
        scene.inferTypes();
        const elapsed = Date.now() - start;
        logger.info(`=== buildSceneFromFiles build end (${elapsed}ms) ===`);
        return { scene, elapsed };
    }

    // --- Comparison methods (push to this.discrepancies) ---

    private compareSceneFiles(sceneA: Scene, sceneB: Scene): void {
        const filesA = sceneA.getFiles();
        const filesB = sceneB.getFiles();

        logger.info(`Scene A (analyseByModule): ${filesA.length} ArkFiles`);
        logger.info(`Scene B (buildSceneFromFiles): ${filesB.length} ArkFiles`);

        const filesByPathB = new Map<string, ArkFile>();
        for (const f of filesB) {
            filesByPathB.set(f.getFilePath(), f);
        }

        const filesByPathA = new Set<string>();
        for (const f of filesA) {
            filesByPathA.add(f.getFilePath());
        }

        for (const f of filesB) {
            if (!filesByPathA.has(f.getFilePath())) {
                logger.info(`ArkFile only in B: ${f.getFilePath()}`);
            }
        }

        let comparedCount = 0;
        for (const fileA of filesA) {
            const filePath = fileA.getFilePath();
            const fileB = filesByPathB.get(filePath);
            if (!fileB) {
                logger.info(`ArkFile only in A: ${filePath}`);
                continue;
            }
            this.compareArkFile(fileA, fileB);
            comparedCount++;
        }

        logger.info(`Compared ${comparedCount} common ArkFiles`);
    }

    private compareArkFile(fileA: ArkFile, fileB: ArkFile): void {
        const filePath = fileA.getFilePath();
        this.compareNamespaces(fileA.getNamespaces(), fileB.getNamespaces(), filePath, ModelType.ARK_NAMESPACE);
        this.compareClasses(fileA.getClasses(), fileB.getClasses(), filePath, ModelType.ARK_CLASS);
        this.compareCountAndContent(
            fileA.getImportInfos(),
            fileB.getImportInfos(),
            imp => `${imp.getImportClauseName()}|${imp.getFrom() ?? ''}|${imp.getImportType()}`,
            filePath,
            ModelType.IMPORT_INFO
        );
        this.compareCountAndContent(
            fileA.getExportInfos(),
            fileB.getExportInfos(),
            exp => `${exp.getExportClauseName()}|${exp.getFrom() ?? ''}|${exp.getExportClauseType()}`,
            filePath,
            ModelType.EXPORT_INFO
        );
    }

    private compareNamespaces(namespacesA: ArkNamespace[], namespacesB: ArkNamespace[], filePath: string, label: ModelType): void {
        const nsMapB = new Map<string, ArkNamespace>();
        for (const ns of namespacesB) {
            nsMapB.set(ns.getName(), ns);
        }

        for (const nsA of namespacesA) {
            const nsName = nsA.getName();
            const nsB = nsMapB.get(nsName);
            if (!nsB) {
                this.addStructural(filePath, label, `'${nsName}' exists in A but not in B`);
                continue;
            }
            this.compareNamespaces(nsA.getNamespaces(), nsB.getNamespaces(), filePath, ModelType.ARK_NAMESPACE);
            this.compareClasses(nsA.getClasses(), nsB.getClasses(), filePath, ModelType.ARK_CLASS);
            this.compareCountAndContent(
                nsA.getExportInfos(),
                nsB.getExportInfos(),
                exp => `${exp.getExportClauseName()}|${exp.getFrom() ?? ''}|${exp.getExportClauseType()}`,
                filePath,
                ModelType.EXPORT_INFO
            );
        }
    }

    private compareClasses(classesA: ArkClass[], classesB: ArkClass[], filePath: string, label: ModelType): void {
        const classMapB = new Map<string, ArkClass>();
        for (const cls of classesB) {
            classMapB.set(cls.getName(), cls);
        }

        for (const clsA of classesA) {
            const clsName = clsA.getName();
            const clsB = classMapB.get(clsName);
            if (!clsB) {
                this.addStructural(filePath, ModelType.ARK_CLASS, `'${clsName}' exists in A but not in B`);
                continue;
            }
            this.compareCountAndContent(clsA.getMethods(), clsB.getMethods(), (m: ArkMethod) => m.getSubSignature().toString(), filePath, ModelType.ARK_METHOD);
            this.compareCountAndContent(clsA.getFields(), clsB.getFields(), f => f.getName(), filePath, ModelType.ARK_FIELD);

            const methodMapB = new Map<string, ArkMethod>();
            for (const m of clsB.getMethods()) {
                methodMapB.set(m.getSubSignature().toString(), m);
            }
            for (const methodA of clsA.getMethods()) {
                const subSig = methodA.getSubSignature().toString();
                const methodB = methodMapB.get(subSig);
                if (!methodB) {
                    continue;
                }
                this.compareMethodBody(methodA, methodB, filePath, `'${clsName}' method '${subSig}'`);
            }
        }
    }

    private compareMethodBody(methodA: ArkMethod, methodB: ArkMethod, filePath: string, label: string): void {
        const bodyA = methodA.getBody();
        const bodyB = methodB.getBody();

        if (bodyA && !bodyB) {
            this.addContent(filePath, ModelType.METHOD_BODY, `${label} body exists in A but not in B`);
            return;
        }
        if (!bodyA && bodyB) {
            this.addContent(filePath, ModelType.METHOD_BODY, `${label} body exists in B but not in A`);
            return;
        }
        if (!bodyA && !bodyB) {
            return;
        }

        const cfgA = bodyA!.getCfg();
        const cfgB = bodyB!.getCfg();
        const stmtsA = cfgA.getStmts();
        const stmtsB = cfgB.getStmts();

        if (stmtsA.length !== stmtsB.length) {
            this.addContent(filePath, ModelType.METHOD_BODY, `${label} stmt count mismatch`, String(stmtsA.length), String(stmtsB.length));
        }

        const maxLen = Math.min(stmtsA.length, stmtsB.length);
        for (let i = 0; i < maxLen; i++) {
            const strA = stmtsA[i].toString();
            const strB = stmtsB[i].toString();
            if (strA !== strB) {
                this.addContent(filePath, ModelType.METHOD_BODY, `${label} stmt[${i}] content mismatch`, strA, strB);
            }
        }

        const localsA = bodyA!.getLocals();
        const localsB = bodyB!.getLocals();
        if (localsA.size !== localsB.size) {
            this.addContent(filePath, ModelType.METHOD_BODY, `${label} locals count mismatch`, String(localsA.size), String(localsB.size));
        }
    }

    private compareCountAndContent<T>(arrA: T[], arrB: T[], keyFn: (item: T) => string, filePath: string, modelType: ModelType): void {
        if (arrA.length !== arrB.length) {
            this.addStructural(filePath, modelType, `count mismatch`, String(arrA.length), String(arrB.length));
        }

        const keysA = arrA.map(keyFn).sort();
        const keysB = arrB.map(keyFn).sort();

        const maxLen = Math.max(keysA.length, keysB.length);
        for (let i = 0; i < maxLen; i++) {
            const kA = i < keysA.length ? keysA[i] : '<missing>';
            const kB = i < keysB.length ? keysB[i] : '<missing>';
            if (kA !== kB) {
                this.addStructural(filePath, modelType, `content mismatch at [${i}]`, kA, kB);
            }
        }
    }

    // --- Discrepancy builders ---

    private addStructural(filePath: string, modelType: ModelType, label: string, valueA?: string, valueB?: string): void {
        this.discrepancies.push({ category: DiscrepancyCategory.STRUCTURAL, filePath, modelType, label, valueA, valueB });
    }

    private addContent(filePath: string, modelType: ModelType, label: string, valueA?: string, valueB?: string): void {
        this.discrepancies.push({ category: DiscrepancyCategory.CONTENT, filePath, modelType, label, valueA, valueB });
    }

    // --- Report ---

    private reportDiscrepancies(tA: number, tB: number): void {
        const structural = this.discrepancies.filter(d => d.category === DiscrepancyCategory.STRUCTURAL);
        const content = this.discrepancies.filter(d => d.category === DiscrepancyCategory.CONTENT);

        console.log('============ Scene Comparison Report ============');
        console.log(`Timing: analyseByModule=${tA}ms, buildSceneFromFiles=${tB}ms`);
        console.log(`Total discrepancies: ${this.discrepancies.length} (${structural.length} structural, ${content.length} content)`);

        if (this.discrepancies.length === 0) {
            console.log('RESULT: All comparisons passed.');
            console.log('==================================================');
            return;
        }

        // Summary by model type
        const byModelType = new Map<ModelType, { structural: number; content: number }>();
        for (const d of this.discrepancies) {
            const entry = byModelType.get(d.modelType) ?? { structural: 0, content: 0 };
            if (d.category === DiscrepancyCategory.STRUCTURAL) {
                entry.structural++;
            } else {
                entry.content++;
            }
            byModelType.set(d.modelType, entry);
        }
        console.log('--- Summary by model type: ---');
        for (const [modelType, counts] of byModelType) {
            console.log(`  ${modelType}: ${counts.structural} structural, ${counts.content} content`);
        }
        console.log('==================================================');

        if (VERBOSE) {
            this.logDiscrepancyDetails(structural, content);
        }

        if (structural.length > 0) {
            throw new Error(`Scene comparison failed with ${structural.length} structural discrepancies`);
        }
    }

    private logDiscrepancyDetails(structural: Discrepancy[], content: Discrepancy[]): void {
        if (structural.length > 0) {
            console.log('--- Structural discrepancies: ---');
            for (const d of structural) {
                this.logDiscrepancy(d);
            }
        }
        if (content.length > 0) {
            console.log('--- Content discrepancies: ---');
            for (const d of content) {
                this.logDiscrepancy(d);
            }
        }
    }

    private logDiscrepancy(d: Discrepancy): void {
        const fileName = path.basename(d.filePath);
        const parts = [`[${fileName}] ${d.label}`];
        if (d.valueA !== undefined || d.valueB !== undefined) {
            parts.push(`A='${d.valueA ?? '<missing>'}'`, `B='${d.valueB ?? '<missing>'}'`);
        }
        console.log(`  [${d.modelType}] ${parts.join('  ')}`);
    }

    // --- Diagnostic methods ---

    private detectCircularDependencies(scene: Scene): void {
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

    private printTopoDependencyGraph(scene: Scene): void {
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

        // Print module topological order (depended-on first)
        logger.info('============ Module Topological Order ============');
        const orderNames = topo.map(id => depGraph.getNode(id)?.getModuleName() ?? String(id));
        for (let i = 0; i < orderNames.length; i++) {
            logger.info(`  [${i}] ${orderNames[i]}`);
        }
        logger.info('==================================================');

        logger.info('============ Topological Dependency Graph (DOT) ============');
        const lines: string[] = [];
        lines.push('digraph ModuleDepGraph {');
        lines.push('    rankdir=LR;');

        for (const id of topo) {
            const module = depGraph.getNode(id);
            const name = module?.getModuleName() ?? String(id);
            lines.push(`    "${name}";`);
        }

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

        const dotPath = path.join(OUTPUT_DIR, 'ModuleDepGraph.dot');
        fs.writeFileSync(dotPath, lines.join('\n') + '\n');
        logger.info(`Module dependency graph saved to ${dotPath}`);
    }

    private printFileDependencyGraphs(scene: Scene): void {
        logger.info('============ Intra-Module File Dependency Graphs (DOT) ============');
        for (const module of scene.getModules()) {
            const fileDepGraph: FileDepGraph | undefined = module.getFileDepGraph();
            if (!fileDepGraph) {
                continue;
            }

            const moduleName = module.getModuleName();

            // Print file topological order (depended-on first)
            const fileTopo = fileDepGraph.getTopoOrder();
            if (fileTopo.length > 0) {
                logger.info(`--- File Topological Order for [${moduleTypeLabel(module.getModuleType())}] ${moduleName} ---`);
                const fileNames = fileTopo.map(id => {
                    const file = fileDepGraph.tryGetNode(id);
                    return file ? path.basename(file.getFilePath()) : String(id);
                });
                for (let i = 0; i < fileNames.length; i++) {
                    logger.info(`  [${i}] ${fileNames[i]}`);
                }
            }

            const safeModuleName = moduleName.replace(/[^a-zA-Z0-9_-]/g, '_');
            const lines: string[] = [];
            lines.push(`digraph FileDepGraph_${safeModuleName} {`);
            lines.push('    rankdir=LR;');

            for (const file of fileDepGraph.nodesItor()) {
                const fileName = path.basename(file.getFilePath());
                lines.push(`    "${fileName}";`);
            }

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

            const dotPath = path.join(OUTPUT_DIR, `FileDepGraph_${safeModuleName}.dot`);
            fs.writeFileSync(dotPath, lines.join('\n') + '\n');
            logger.info(`File dependency graph for ${moduleName} saved to ${dotPath}`);
        }
        logger.info('====================================================================');
    }
}

const moduleAnalyseTest = new ModuleAnalyseTest();
moduleAnalyseTest.testModuleAnalysis();
moduleAnalyseTest.compareScenesFromAnalyseByModuleAndBuildSceneFromFiles();
