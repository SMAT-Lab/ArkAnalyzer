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
import { ModuleLoadState } from '../../src';
import { ArkModule } from '../../src';
import { ModuleDepGraph, FileDepGraph } from '../../src';
import { SCCDetection } from '../../src';
import { ModuleAnalysisConfig } from '../../src';
import { ModuleDepthLevel } from '../../src';
import { ModuleBuilder } from '../../src';
import { ArkFile } from '../../src';
import { ArkClass } from '../../src';
import { ArkNamespace } from '../../src';
import { ArkMethod } from '../../src';
import { ModelUtils } from '../../src/core/common/ModelUtils';

const logger = Logger.getLogger(LOG_MODULE_TYPE.TOOL, 'ModuleAnalyseTest');

const OUTPUT_DIR = 'out/ModuleAnalyseTest';
fs.mkdirSync(OUTPUT_DIR, { recursive: true });
Logger.configure(path.join(OUTPUT_DIR, 'ModuleAnalyseTest.log'), LOG_LEVEL.ERROR, LOG_LEVEL.INFO, false);

const PROJECT_DIR = process.env.PROJECT_DIR || 'tests/resources/dependency/exampleProject/MyApplication4Files';
const MEMORY_LIMIT_MB = Number(process.env.MEMORY_LIMIT_MB) || 0;
const LOAD_LEVEL_NAME = (process.env.LOAD_LEVEL || 'BODIES').toUpperCase();
const LOAD_LEVEL: ModuleDepthLevel =
    LOAD_LEVEL_NAME === 'META'
        ? ModuleDepthLevel.META
        : LOAD_LEVEL_NAME === 'IMPORTS'
          ? ModuleDepthLevel.IMPORTS
          : LOAD_LEVEL_NAME === 'SIGNATURES'
            ? ModuleDepthLevel.SIGNATURES
            : ModuleDepthLevel.BODIES;

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

function loadStateLabel(state: ModuleLoadState): string {
    switch (state) {
        case ModuleLoadState.NOT_LOADED:
            return 'NOT_LOADED';
        case ModuleLoadState.META:
            return 'META';
        case ModuleLoadState.IMPORTS:
            return 'IMPORTS';
        case ModuleLoadState.SIGNATURES:
            return 'SIGNATURES';
        case ModuleLoadState.BODIES:
            return 'BODIES';
        default:
            return String(state);
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

interface CachedModuleState {
    name: string;
    loadState: ModuleLoadState;
}

interface MemorySnapshot {
    callbackIndex: number;
    topoIndex: number;
    topoTotal: number;
    moduleName: string;
    moduleType: ModuleType;
    loadState: ModuleLoadState;
    fileCount: number;
    rssMB: number;
    heapUsedMB: number;
    heapTotalMB: number;
    cachedModules: string[];
    cachedModuleStates: CachedModuleState[];
    downgradedModules: string[];
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
        config.setIncludeType(ModuleType.PROJECT, true);
        config.setIncludeType(ModuleType.OH_MODULES, true);
        config.setLoadLevel(ModuleDepthLevel.IMPORTS);
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

        // Check hypium import resolution BEFORE Scene B clears MODULES
        this.diagnoseHypiumResolution(sceneA);

        const { scene: sceneB, elapsed: tB } = this.buildSceneViaBuildSceneFromFiles();

        console.log(`Timing: analyseByModule=${tA}ms, buildSceneFromFiles=${tB}ms`);

        // Diagnostic: compare type resolution between A and B
        this.diagnoseTypeResolution(sceneA, sceneB);

        this.discrepancies = [];
        this.compareSceneFiles(sceneA, sceneB);
        this.reportDiscrepancies(tA, tB);

        logger.info('compareScenesFromAnalyseByModuleAndBuildSceneFromFiles end\n');
    }

    /**
     * Diagnose why A (analyseByModule) has @%unk types while B (buildSceneFromFiles) doesn't.
     * Checks buildStage, classesMap population, and specific class/method lookups.
     */
    private diagnoseTypeResolution(sceneA: Scene, sceneB: Scene): void {
        console.log('============ Type Resolution Diagnosis ============');

        const stageA = (sceneA as unknown as { buildStage: number }).buildStage;
        const stageB = (sceneB as unknown as { buildStage: number }).buildStage;
        console.log(`  Scene A buildStage: ${stageA} (INIT=0, SDK=1, CLASS_DONE=2, METHOD_DONE=3, COLLECTED=4,5, TYPE_INFERRED=6)`);
        console.log(`  Scene B buildStage: ${stageB}`);

        this.countResolvedStmts(sceneA, 'A (before inferTypes)');
        this.countResolvedStmts(sceneB, 'B');

        const target = this.findFileWithUnkStmt(sceneA);
        if (target) {
            this.diagnoseImportsForFile(target, sceneA, sceneB);
        }

        console.log('  --- Running scene.inferTypes() on Scene A ---');
        sceneA.inferTypes();
        this.countResolvedStmts(sceneA, 'A (after inferTypes)');
        console.log('====================================================');
    }

    private findFileWithUnkStmt(scene: Scene): ArkFile | null {
        for (const arkFile of scene.getFiles()) {
            if (arkFile.getFilePath().includes('oh_modules')) {
                continue;
            }
            if (!arkFile.getFilePath().endsWith('.ets')) {
                continue;
            }
            if (this.fileHasUnkComputeSampleSize(arkFile)) {
                return arkFile;
            }
        }
        return null;
    }

    private fileHasUnkComputeSampleSize(arkFile: ArkFile): boolean {
        for (const cls of ModelUtils.getAllClassesInFile(arkFile)) {
            for (const mtd of cls.getMethods()) {
                const body = mtd.getBody();
                if (!body) {
                    continue;
                }
                if (this.methodHasUnkComputeSampleSize(body)) {
                    return true;
                }
            }
        }
        return false;
    }

    private methodHasUnkComputeSampleSize(body: { getCfg: () => { getStmts: () => { toString: () => string }[] } }): boolean {
        for (const stmt of body.getCfg().getStmts()) {
            const str = stmt.toString();
            if (str.includes('@%unk') && str.includes('.computeSampleSize')) {
                return true;
            }
        }
        return false;
    }

    private diagnoseImportsForFile(target: ArkFile, sceneA: Scene, sceneB: Scene): void {
        console.log(`  --- Checking imports for: ${path.basename(target.getFilePath())} ---`);
        const importsA = target.getImportInfos();
        let nullExportCount = 0;
        let resolvedExportCount = 0;
        let nullImportSample = '';
        for (const imp of importsA) {
            const lazy = imp.getLazyExportInfo();
            const arkExp = lazy?.getArkExport();
            if (!arkExp) {
                nullExportCount++;
                if (!nullImportSample) {
                    nullImportSample = this.formatUnresolvedImport(imp, lazy, arkExp);
                }
            } else {
                resolvedExportCount++;
            }
        }
        console.log(`  Scene A imports: resolved=${resolvedExportCount}, unresolved=${nullExportCount}`);
        if (nullImportSample) {
            console.log(nullImportSample);
        }

        this.diagnoseUnresolvedImport(importsA, sceneA);

        const fileB = sceneB.getFile(target.getFileSignature());
        if (fileB) {
            const importsB = fileB.getImportInfos();
            let nullB = 0;
            let resolvedB = 0;
            let nullSampleB = '';
            for (const imp of importsB) {
                const lazy = imp.getLazyExportInfo();
                const arkExp = lazy?.getArkExport();
                if (!arkExp) {
                    nullB++;
                    if (!nullSampleB) {
                        nullSampleB = this.formatUnresolvedImport(imp, lazy, arkExp);
                    }
                } else {
                    resolvedB++;
                }
            }
            console.log(`  Scene B imports: resolved=${resolvedB}, unresolved=${nullB}`);
            if (nullSampleB) {
                console.log(nullSampleB);
            }
        }
    }

    private formatUnresolvedImport(
        imp: { getImportClauseName: () => string; getFrom: () => string | undefined },
        lazy: { getArkExport: () => unknown } | null,
        arkExp: unknown
    ): string {
        const lazyStr = lazy ? 'found' : 'null';
        const arkStr = arkExp ?? 'null';
        return `  ${imp.getImportClauseName()} from ${imp.getFrom()} → lazyExportInfo=${lazyStr}, arkExport=${arkStr}`;
    }

    private diagnoseUnresolvedImport(importsA: ReturnType<ArkFile['getImportInfos']>, sceneA: Scene): void {
        for (const imp of importsA) {
            const lazy = imp.getLazyExportInfo();
            if (lazy !== null) {
                continue;
            }
            const from = imp.getFrom();
            const originName = imp.getOriginName();
            console.log(`  --- Deep-dive: ${originName} from ${from} ---`);
            const { getArkFile: _getArkFile } = require('../../src/core/common/ModelUtils');
            const targetArkFile = _getArkFile(imp);
            console.log(`  getArkFile result: ${targetArkFile ? targetArkFile.getFilePath() : 'null'}`);
            const { ModuleUtils: _ModuleUtils } = require('../../src/utils/ModuleUtils');
            console.log(`  ModuleUtils.MODULES.size: ${_ModuleUtils.MODULES.size}`);
            console.log(`  @ohos/common in MODULES: ${_ModuleUtils.MODULES.has('@ohos/common')}`);
            if (_ModuleUtils.MODULES.has('@ohos/common')) {
                const modPath = _ModuleUtils.MODULES.get('@ohos/common');
                console.log(`  @ohos/common path: ${modPath.path}`);
            }
            this.checkConstantsFile(sceneA);
            if (targetArkFile) {
                this.checkExportInFile(targetArkFile, originName);
            }
            break;
        }
    }

    private checkConstantsFile(sceneA: Scene): void {
        const constantsPath = '/home/kubrickai/codes/resources/applications_photos_20260428/common/src/main/ets/default/model/common/Constants.ets';
        let foundInA = false;
        for (const f of sceneA.getFiles()) {
            if (f.getFilePath() === constantsPath) {
                foundInA = true;
                console.log(`  Constants.ets found in Scene A files. ExportInfos: ${f.getExportInfos().length}`);
                const exportNames = f
                    .getExportInfos()
                    .map((e: { getExportClauseName: () => string }) => e.getExportClauseName())
                    .slice(0, 10)
                    .join(', ');
                console.log(`  Export names: ${exportNames}`);
                break;
            }
        }
        if (!foundInA) {
            console.log(`  Constants.ets NOT found in Scene A files!`);
        }
    }

    private checkExportInFile(targetArkFile: ArkFile, originName: string): void {
        const expInfos = targetArkFile.getExportInfos();
        let foundExport = false;
        for (const ei of expInfos) {
            if (ei.getOriginName() === originName || ei.getExportClauseName() === originName) {
                foundExport = true;
                const clause = ei.getExportClauseName();
                const clauseType = ei.getExportClauseType();
                const arkSet = ei.getArkExport() ? 'set' : 'null/undefined';
                console.log(`  ExportInfo found: clause=${clause}, type=${clauseType}, arkExport=${arkSet}`);
                break;
            }
        }
        if (!foundExport) {
            console.log(`  ExportInfo NOT found in target file. Total export infos: ${expInfos.length}`);
            console.log(
                `  Export names: ${expInfos
                    .map((e: { getExportClauseName: () => string }) => e.getExportClauseName())
                    .slice(0, 10)
                    .join(', ')}`
            );
        }
    }

    private diagnoseHypiumResolution(sceneA: Scene): void {
        console.log('  --- Hypium Resolution Diagnosis ---');
        this.listHypiumModules(sceneA);
        this.checkHypiumInModuleUtils(sceneA);
        this.findHypiumImport(sceneA);
    }

    private listHypiumModules(sceneA: Scene): void {
        console.log('  === Registered modules ===');
        for (const mod of sceneA.getModules()) {
            const name = mod.getModuleName();
            const type = mod.getModuleType();
            const modPath = mod.getModulePath();
            const isHypium = name.includes('hypium') || modPath.includes('hypium');
            if (isHypium) {
                console.log(`  >> [${type}] ${name} @ ${modPath}`);
            }
        }
    }

    private checkHypiumInModuleUtils(sceneA: Scene): void {
        const { ModuleUtils: _ModuleUtils } = require('../../src/utils/ModuleUtils');
        console.log(`  ModuleUtils.MODULES.size: ${_ModuleUtils.MODULES.size}`);
        const hypiumEntry = _ModuleUtils.MODULES.get('@ohos/hypium');
        console.log(`  @ohos/hypium in MODULES: ${hypiumEntry ? 'YES' : 'NO'}`);
        if (!hypiumEntry) {
            return;
        }
        console.log(`  @ohos/hypium path: ${hypiumEntry.path}`);
        console.log(`  @ohos/hypium main: ${hypiumEntry.main}`);

        const { ModuleUtils: _MU } = require('../../src/utils/ModuleUtils');
        const realMain = _MU.getFileRealPath(hypiumEntry.main);
        console.log(`  main realPath: ${realMain}`);

        this.listHypiumFilesInScene(sceneA);

        if (realMain) {
            this.checkHypiumFileSignature(sceneA, realMain, hypiumEntry, _MU);
        }
    }

    private listHypiumFilesInScene(sceneA: Scene): void {
        console.log('  === Files in sceneA filesMap containing "hypium" ===');
        let hypiumFileCount = 0;
        for (const f of sceneA.getFiles()) {
            if (f.getFilePath().includes('hypium')) {
                hypiumFileCount++;
                if (hypiumFileCount <= 5) {
                    console.log(`    ${f.getFilePath()}`);
                }
            }
        }
        console.log(`  Total hypium files in filesMap: ${hypiumFileCount}`);
    }

    private checkHypiumFileSignature(
        sceneA: Scene,
        realMain: string,
        hypiumEntry: { main: string },
        _MU: typeof import('../../src/utils/ModuleUtils').ModuleUtils
    ): void {
        const fileName = path.relative(sceneA.getRealProjectDir(), realMain);
        const { FileSignature } = require('../../src/core/model/ArkSignature');
        const sig = new FileSignature(sceneA.getProjectName(), fileName);
        console.log(`  FileSignature: projectName=${sig.getProjectName()}, fileName=${sig.getFileName()}`);
        console.log(`  toMapKey: ${sig.toMapKey()}`);
        const arkFile = sceneA.getFile(sig);
        console.log(`  getFile result: ${arkFile ? arkFile.getFilePath() : 'null'}`);

        const indexTsPath = hypiumEntry.main.replace(/index$/, 'index.ts');
        const realTs = _MU.getFileRealPath(indexTsPath);
        if (realTs) {
            const tsFileName = path.relative(sceneA.getRealProjectDir(), realTs);
            const tsSig = new FileSignature(sceneA.getProjectName(), tsFileName);
            const tsArkFile = sceneA.getFile(tsSig);
            console.log(`  index.ts getFile: ${tsArkFile ? tsArkFile.getFilePath() : 'null'}`);
        }
    }

    private findHypiumImport(sceneA: Scene): void {
        for (const arkFile of sceneA.getFiles()) {
            if (arkFile.getFilePath().includes('oh_modules')) {
                continue;
            }
            for (const imp of arkFile.getImportInfos()) {
                if (imp.getFrom()?.includes('hypium')) {
                    const lazy = imp.getLazyExportInfo();
                    const arkExp = lazy?.getArkExport();
                    console.log(`  --- Import: ${imp.getImportClauseName()} from ${imp.getFrom()} ---`);
                    console.log(`    lazyExportInfo: ${lazy ? 'found' : 'null'}`);
                    console.log(`    arkExport: ${arkExp ? arkExp.constructor.name : 'null/undefined'}`);
                    return;
                }
            }
            return;
        }
    }

    private countResolvedStmts(scene: Scene, label: string): void {
        let unkCount = 0;
        let resolvedCount = 0;
        for (const arkFile of scene.getFiles()) {
            if (arkFile.getFilePath().includes('oh_modules')) {
                continue;
            }
            const counts = this.countFileStmts(arkFile);
            unkCount += counts.unk;
            resolvedCount += counts.resolved;
        }
        console.log(`  ${label}: @%unk=${unkCount}, resolved=${resolvedCount}, total=${unkCount + resolvedCount}`);
    }

    private countFileStmts(arkFile: ArkFile): { unk: number; resolved: number } {
        let unk = 0;
        let resolved = 0;
        for (const cls of ModelUtils.getAllClassesInFile(arkFile)) {
            for (const mtd of cls.getMethods()) {
                const body = mtd.getBody();
                if (!body) {
                    continue;
                }
                for (const stmt of body.getCfg().getStmts()) {
                    const str = stmt.toString();
                    if (str.includes('@%unk')) {
                        unk++;
                    } else if (str.includes('@applications') || str.includes('@openharmony') || str.includes('@built-in')) {
                        resolved++;
                    }
                }
            }
        }
        return { unk, resolved };
    }

    /**
     * Build a scene via analyseByModule (PROJECT at LOAD_LEVEL) with SDK configured,
     * and return it with elapsed time. Config matches testMemoryProfiling but without
     * GC or memory recording.
     */
    private buildSceneViaAnalyseByModule(): { scene: Scene; elapsed: number } {
        const sceneConfig = new SceneConfig();
        sceneConfig.buildFromProjectDir(PROJECT_DIR);
        SDK_CONFIGS.forEach(sdk => sceneConfig.getSdksObj().push(sdk));
        const scene = new Scene();
        scene.config(sceneConfig);

        const config = new ModuleAnalysisConfig();
        config.setIncludeType(ModuleType.PROJECT, true);
        config.setLoadLevel(ModuleDepthLevel.BODIES);
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
        // Only compare PROJECT module files (exclude oh_modules dependencies).
        const isProjectFile = (f: ArkFile): boolean => !f.getFilePath().includes('oh_modules');
        const filesA = sceneA.getFiles().filter(isProjectFile);
        const filesB = sceneB.getFiles().filter(isProjectFile);

        console.log(`Scene A (analyseByModule): ${filesA.length} PROJECT ArkFiles (excluded ${sceneA.getFiles().length - filesA.length} oh_modules)`);
        console.log(`Scene B (buildSceneFromFiles): ${filesB.length} PROJECT ArkFiles (excluded ${sceneB.getFiles().length - filesB.length} oh_modules)`);

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
                console.log(`ArkFile only in B: ${path.basename(f.getFilePath())}`);
            }
        }

        let comparedCount = 0;
        for (const fileA of filesA) {
            const filePath = fileA.getFilePath();
            const fileB = filesByPathB.get(filePath);
            if (!fileB) {
                console.log(`ArkFile only in A: ${path.basename(filePath)}`);
                continue;
            }
            this.compareArkFile(fileA, fileB);
            comparedCount++;
        }

        console.log(`Compared ${comparedCount} common PROJECT ArkFiles`);
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

        console.log('============ Scene Comparison Report (PROJECT files only) ============');
        console.log(`Timing: analyseByModule=${tA}ms, buildSceneFromFiles=${tB}ms`);
        console.log(`Total discrepancies: ${this.discrepancies.length} (${structural.length} structural, ${content.length} content)`);

        if (this.discrepancies.length === 0) {
            console.log('RESULT: All comparisons passed.');
            console.log('======================================================================');
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
        console.log('======================================================================');

        // Always show detailed discrepancies (not just when VERBOSE)
        this.logDiscrepancyDetails(structural, content);

        if (structural.length > 0) {
            console.log(`WARNING: ${structural.length} structural discrepancies found (not throwing, reporting only).`);
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
            this.printFileTopoOrder(module, fileDepGraph, moduleName);
            this.writeFileDepGraphDot(moduleName, fileDepGraph);
        }
        logger.info('====================================================================');
    }

    private printFileTopoOrder(module: ArkModule, fileDepGraph: FileDepGraph, moduleName: string): void {
        const fileTopo = fileDepGraph.getTopoOrder();
        if (fileTopo.length === 0) {
            return;
        }
        const label = `[${moduleTypeLabel(module.getModuleType())}] ${moduleName}`;
        logger.info(`--- File Topological Order for ${label} ---`);
        const fileNames = fileTopo.map(id => {
            const file = fileDepGraph.tryGetNode(id);
            return file ? path.basename(file.getFilePath()) : String(id);
        });
        for (let i = 0; i < fileNames.length; i++) {
            logger.info(`  [${i}] ${fileNames[i]}`);
        }
    }

    private writeFileDepGraphDot(moduleName: string, fileDepGraph: FileDepGraph): void {
        const safeModuleName = moduleName.replace(/[^a-zA-Z0-9_-]/g, '_');
        const lines: string[] = [];
        lines.push(`digraph FileDepGraph_${safeModuleName} {`);
        lines.push('    rankdir=LR;');

        for (const file of fileDepGraph.nodesItor()) {
            const fileName = path.basename(file.getFilePath());
            lines.push(`    "${fileName}";`);
        }

        this.appendFileDepEdges(lines, fileDepGraph);

        lines.push('}');
        logger.info('-------------------------------------------------------------------');

        const dotPath = path.join(OUTPUT_DIR, `FileDepGraph_${safeModuleName}.dot`);
        fs.writeFileSync(dotPath, lines.join('\n') + '\n');
        logger.info(`File dependency graph for ${moduleName} saved to ${dotPath}`);
    }

    private appendFileDepEdges(lines: string[], fileDepGraph: FileDepGraph): void {
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
    }

    // --- Memory profiling ---

    /**
     * Profile runtime memory usage and module cache states during analyseByModule.
     *
     * Uses environment variables MEMORY_LIMIT_MB (default 0=unlimited) and
     * Collects a snapshot in each callback invocation, then prints:
     * 1. Per-callback memory + topo position + cached module list
     * 2. Memory peak/valley summary
     * 3. Module cache changes (which modules were evicted/loaded between callbacks)
     * 4. Module dependency graph (via printTopoDependencyGraph)
     */
    public testMemoryProfiling(): void {
        logger.info('testMemoryProfiling start');
        logger.info(`LOAD_LEVEL=${LOAD_LEVEL_NAME}, MEMORY_LIMIT_MB=${MEMORY_LIMIT_MB}`);

        const sceneConfig = new SceneConfig();
        sceneConfig.buildFromProjectDir(PROJECT_DIR);
        SDK_CONFIGS.forEach(sdk => sceneConfig.getSdksObj().push(sdk));
        const scene = new Scene();
        scene.config(sceneConfig);
        scene.getOptions().memoryLimitMB = MEMORY_LIMIT_MB;

        const canForceGC = typeof (global as unknown as { gc?: () => void }).gc === 'function';
        logger.info(`Forced GC available: ${canForceGC}`);
        const forceGC = (): void => {
            if (canForceGC) {
                (global as unknown as { gc: () => void }).gc();
            }
        };

        const config = new ModuleAnalysisConfig();
        config.setIncludeType(ModuleType.PROJECT, true);
        config.setLoadLevel(LOAD_LEVEL);
        const snapshots: MemorySnapshot[] = [];
        let callbackIndex = 0;
        let prevCachedStates = new Map<string, ModuleLoadState>();

        scene.analyseByModule((module, scene) => {
            forceGC();
            const snap = this.collectMemorySnapshot(module, scene, callbackIndex++, prevCachedStates);
            prevCachedStates = new Map(snap.cachedModuleStates.map(cs => [cs.name, cs.loadState]));
            snapshots.push(snap);
        }, config);

        this.printMemoryReport(snapshots);
        this.printFinalMemory(forceGC);
        this.printTopoDependencyGraph(scene);

        logger.info('testMemoryProfiling end\n');
    }

    /**
     * Compare memory profiling between analyseByModule and buildSceneFromFiles.
     * Runs both methods on the same project, collecting peak/final memory and
     * elapsed time, then prints a side-by-side comparison table.
     */
    public testMemoryProfilingComparison(): void {
        logger.info('testMemoryProfilingComparison start');
        logger.info(`LOAD_LEVEL=${LOAD_LEVEL_NAME}, MEMORY_LIMIT_MB=${MEMORY_LIMIT_MB}`);

        const canForceGC = typeof (global as unknown as { gc?: () => void }).gc === 'function';
        logger.info(`Forced GC available: ${canForceGC}`);
        const forceGC = (): void => {
            if (canForceGC) {
                (global as unknown as { gc: () => void }).gc();
            }
        };
        const mb = (bytes: number): number => Number(bytes) / Number(1024 * 1024);

        const resultA = this.runAnalyseByModuleComparison(forceGC, mb);
        const resultB = this.runBuildSceneFromFilesComparison(forceGC, mb);
        this.printComparisonSummary(resultA, resultB, mb);
    }

    private runAnalyseByModuleComparison(
        forceGC: () => void,
        mb: (bytes: number) => number
    ): {
        elapsed: number;
        peakRss: number;
        peakHeap: number;
        finalRss: number;
        finalHeap: number;
        fileCount: number;
        moduleCount: number;
        snapshotCount: number;
    } {
        logger.info('\n========== Method 1: analyseByModule ==========');
        forceGC();
        const beforeA = process.memoryUsage();
        logger.info(`Before: RSS=${mb(beforeA.rss).toFixed(2)}MB, heapUsed=${mb(beforeA.heapUsed).toFixed(2)}MB`);

        const sceneConfigA = new SceneConfig();
        sceneConfigA.buildFromProjectDir(PROJECT_DIR);
        SDK_CONFIGS.forEach(sdk => sceneConfigA.getSdksObj().push(sdk));
        const sceneA = new Scene();
        sceneA.config(sceneConfigA);
        sceneA.getOptions().memoryLimitMB = MEMORY_LIMIT_MB;

        const config = new ModuleAnalysisConfig();
        config.setIncludeType(ModuleType.PROJECT, true);
        config.setLoadLevel(LOAD_LEVEL);
        const snapshotsA: MemorySnapshot[] = [];
        let cbIdx = 0;
        let peakRssA = 0;
        let peakHeapA = 0;
        let prevCachedStatesA = new Map<string, ModuleLoadState>();

        const startA = Date.now();
        sceneA.analyseByModule((module, scene) => {
            forceGC();
            const snap = this.collectMemorySnapshot(module, scene, cbIdx++, prevCachedStatesA);
            prevCachedStatesA = new Map(snap.cachedModuleStates.map(cs => [cs.name, cs.loadState]));
            snapshotsA.push(snap);
            const usage = process.memoryUsage();
            const rss = mb(usage.rss);
            const heap = mb(usage.heapUsed);
            if (rss > peakRssA) {
                peakRssA = rss;
            }
            if (heap > peakHeapA) {
                peakHeapA = heap;
            }
        }, config);
        const elapsedA = Date.now() - startA;

        forceGC();
        const afterA = process.memoryUsage();
        const finalRssA = mb(afterA.rss);
        const finalHeapA = mb(afterA.heapUsed);

        this.printMemoryReport(snapshotsA);
        logger.info(`analyseByModule: elapsed=${elapsedA}ms, peakRSS=${peakRssA.toFixed(2)}MB, peakHeap=${peakHeapA.toFixed(2)}MB`);
        logger.info(`  Final after GC: RSS=${finalRssA.toFixed(2)}MB, heapUsed=${finalHeapA.toFixed(2)}MB`);

        const filesA = sceneA.getFiles().filter(f => !f.getFilePath().includes('oh_modules'));
        const modulesA = sceneA.getModules().filter(m => m.getModuleType() !== ModuleType.SDK);
        logger.info(`  PROJECT ArkFiles=${filesA.length}, PROJECT modules=${modulesA.length}`);

        return {
            elapsed: elapsedA,
            peakRss: peakRssA,
            peakHeap: peakHeapA,
            finalRss: finalRssA,
            finalHeap: finalHeapA,
            fileCount: filesA.length,
            moduleCount: modulesA.length,
            snapshotCount: snapshotsA.length,
        };
    }

    private runBuildSceneFromFilesComparison(
        forceGC: () => void,
        mb: (bytes: number) => number
    ): {
        elapsed: number;
        peakRss: number;
        peakHeap: number;
        finalRss: number;
        finalHeap: number;
        fileCount: number;
    } {
        logger.info('\n========== Method 2: buildSceneFromFiles ==========');
        forceGC();
        const beforeB = process.memoryUsage();
        logger.info(`Before: RSS=${mb(beforeB.rss).toFixed(2)}MB, heapUsed=${mb(beforeB.heapUsed).toFixed(2)}MB`);

        const sceneConfigB = new SceneConfig();
        sceneConfigB.buildFromProjectDir(PROJECT_DIR);
        SDK_CONFIGS.forEach(sdk => sceneConfigB.getSdksObj().push(sdk));
        const sceneB = new Scene();

        let peakRssB = mb(beforeB.rss);
        let peakHeapB = mb(beforeB.heapUsed);
        const memTimer = setInterval(() => {
            const u = process.memoryUsage();
            const r = mb(u.rss);
            const h = mb(u.heapUsed);
            if (r > peakRssB) {
                peakRssB = r;
            }
            if (h > peakHeapB) {
                peakHeapB = h;
            }
        }, 500);

        const startB = Date.now();
        sceneB.buildSceneFromFiles(sceneConfigB);
        sceneB.inferTypes();
        const elapsedB = Date.now() - startB;

        clearInterval(memTimer);
        const afterB = process.memoryUsage();
        const peakRssBFinal = Math.max(peakRssB, mb(afterB.rss));
        const peakHeapBFinal = Math.max(peakHeapB, mb(afterB.heapUsed));

        forceGC();
        const afterGCB = process.memoryUsage();
        const finalRssB = mb(afterGCB.rss);
        const finalHeapB = mb(afterGCB.heapUsed);

        logger.info(`buildSceneFromFiles: elapsed=${elapsedB}ms, peakRSS=${peakRssBFinal.toFixed(2)}MB, peakHeap=${peakHeapBFinal.toFixed(2)}MB`);
        logger.info(`  Final after GC: RSS=${finalRssB.toFixed(2)}MB, heapUsed=${finalHeapB.toFixed(2)}MB`);

        const filesB = sceneB.getFiles().filter(f => !f.getFilePath().includes('oh_modules'));
        logger.info(`  PROJECT ArkFiles=${filesB.length}`);

        return {
            elapsed: elapsedB,
            peakRss: peakRssBFinal,
            peakHeap: peakHeapBFinal,
            finalRss: finalRssB,
            finalHeap: finalHeapB,
            fileCount: filesB.length,
        };
    }

    private printComparisonSummary(
        resultA: {
            elapsed: number;
            peakRss: number;
            peakHeap: number;
            finalRss: number;
            finalHeap: number;
            fileCount: number;
            moduleCount: number;
            snapshotCount: number;
        },
        resultB: {
            elapsed: number;
            peakRss: number;
            peakHeap: number;
            finalRss: number;
            finalHeap: number;
            fileCount: number;
        },
        _mb: (bytes: number) => number
    ): void {
        logger.info('\n========== Memory Profiling Comparison ==========');
        const rssDiff = resultB.finalRss - resultA.finalRss;
        const heapDiff = resultB.finalHeap - resultA.finalHeap;
        const peakRssDiff = resultB.peakRss - resultA.peakRss;
        const peakHeapDiff = resultB.peakHeap - resultA.peakHeap;
        const timeDiff = resultB.elapsed - resultA.elapsed;

        logger.info(`  Peak RSS: A=${resultA.peakRss.toFixed(2)}MB, B=${resultB.peakRss.toFixed(2)}MB, diff=${peakRssDiff.toFixed(2)}MB`);
        logger.info(`  Peak heapUsed: A=${resultA.peakHeap.toFixed(2)}MB, B=${resultB.peakHeap.toFixed(2)}MB, diff=${peakHeapDiff.toFixed(2)}MB`);
        logger.info(`  Final RSS after GC: A=${resultA.finalRss.toFixed(2)}MB, B=${resultB.finalRss.toFixed(2)}MB, diff=${rssDiff.toFixed(2)}MB`);
        logger.info(`  Final heapUsed after GC: A=${resultA.finalHeap.toFixed(2)}MB, B=${resultB.finalHeap.toFixed(2)}MB, diff=${heapDiff.toFixed(2)}MB`);
        logger.info(`  Elapsed: A=${resultA.elapsed}ms, B=${resultB.elapsed}ms, diff=${timeDiff}ms`);
        logger.info(`  PROJECT ArkFiles: A=${resultA.fileCount}, B=${resultB.fileCount}`);
        logger.info(`  Memory limit: ${MEMORY_LIMIT_MB || 'unlimited'}MB`);
        logger.info(`  Callbacks (module count): ${resultA.snapshotCount}`);
        logger.info('testMemoryProfilingComparison end\n');
    }

    private collectMemorySnapshot(module: ArkModule, scene: Scene, callbackIndex: number, prevCachedStates: Map<string, ModuleLoadState>): MemorySnapshot {
        const usage = process.memoryUsage();
        const depGraph = scene.getModuleDepGraph();
        let topoIndex = -1;
        let topoTotal = 0;
        if (depGraph) {
            const topo = depGraph.getTopoOrder();
            topoTotal = topo.length;
            topoIndex = topo.indexOf(scene.getModuleId(module));
        }
        const cachedModules: string[] = [];
        const cachedModuleStates: CachedModuleState[] = [];
        const downgradedModules: string[] = [];
        for (const m of scene.getModules()) {
            if (m.getModuleType() !== ModuleType.SDK && m.getLoadState() !== ModuleLoadState.NOT_LOADED) {
                const name = m.getModuleName();
                const state = m.getLoadState();
                cachedModules.push(name);
                cachedModuleStates.push({ name, loadState: state });
                const prevState = prevCachedStates.get(name);
                if (prevState !== undefined && state < prevState) {
                    downgradedModules.push(`${name}(${loadStateLabel(prevState)}→${loadStateLabel(state)})`);
                }
            }
        }
        return {
            callbackIndex,
            topoIndex,
            topoTotal,
            moduleName: module.getModuleName(),
            moduleType: module.getModuleType(),
            loadState: module.getLoadState(),
            fileCount: module.getFilesMap().size,
            rssMB: Number(usage.rss) / Number(1024 * 1024),
            heapUsedMB: Number(usage.heapUsed) / Number(1024 * 1024),
            heapTotalMB: Number(usage.heapTotal) / Number(1024 * 1024),
            cachedModules,
            cachedModuleStates,
            downgradedModules,
        };
    }

    private printFinalMemory(forceGC: () => void): void {
        forceGC();
        const usage = process.memoryUsage();
        logger.info('============ Final Memory (after analyseByModule) ============');
        logger.info(`  RSS:       ${(Number(usage.rss) / Number(1024 * 1024)).toFixed(2)}MB`);
        logger.info(`  heapUsed:  ${(Number(usage.heapUsed) / Number(1024 * 1024)).toFixed(2)}MB`);
        logger.info(`  heapTotal: ${(Number(usage.heapTotal) / Number(1024 * 1024)).toFixed(2)}MB`);
        logger.info('==============================================================');
    }

    private printMemoryReport(snapshots: MemorySnapshot[]): void {
        logger.info('============ Memory Profiling Report ============');
        this.printSnapshotTable(snapshots);
        this.printMemorySummary(snapshots);
        this.printCacheChanges(snapshots);
        logger.info('=================================================');
    }

    private printSnapshotTable(snapshots: MemorySnapshot[]): void {
        logger.info('--- Per-callback Snapshots ---');
        logger.info('  idx | topo  | module                                          | state      | files | RSS(MB) | heap(MB) | cached modules [loadState]');
        logger.info('  ----+-------+-------------------------------------------------+------------+-------+---------+----------+----------------');
        for (const s of snapshots) {
            const moduleLabel = `[${moduleTypeLabel(s.moduleType)}] ${s.moduleName}`;
            const topoLabel = `${s.topoIndex}/${s.topoTotal}`;
            const cachedLabel =
                s.cachedModuleStates.length > 0 ? s.cachedModuleStates.map(cs => `${cs.name}(${loadStateLabel(cs.loadState)})`).join(', ') : '(empty)';
            this.logSnapshotRow(s, topoLabel, moduleLabel, cachedLabel);
        }
    }

    private logSnapshotRow(s: MemorySnapshot, topoLabel: string, moduleLabel: string, cachedLabel: string): void {
        const cb = String(s.callbackIndex).padStart(3);
        const topo = topoLabel.padEnd(5);
        const mod = moduleLabel.padEnd(47);
        const state = loadStateLabel(s.loadState).padEnd(10);
        const files = String(s.fileCount).padStart(5);
        const rss = s.rssMB.toFixed(1).padStart(7);
        const heap = s.heapUsedMB.toFixed(1).padStart(8);
        logger.info(`  ${cb} | ${topo} | ${mod} | ${state} | ${files} | ${rss} | ${heap} | ${cachedLabel}`);
    }

    private printMemorySummary(snapshots: MemorySnapshot[]): void {
        let rssPeak = 0;
        let rssPeakIdx = 0;
        let rssMin = Infinity;
        let heapPeak = 0;
        let heapPeakIdx = 0;
        let heapMin = Infinity;
        for (const s of snapshots) {
            if (s.rssMB > rssPeak) {
                rssPeak = s.rssMB;
                rssPeakIdx = s.callbackIndex;
            }
            if (s.rssMB < rssMin) {
                rssMin = s.rssMB;
            }
            if (s.heapUsedMB > heapPeak) {
                heapPeak = s.heapUsedMB;
                heapPeakIdx = s.callbackIndex;
            }
            if (s.heapUsedMB < heapMin) {
                heapMin = s.heapUsedMB;
            }
        }
        const last = snapshots[snapshots.length - 1];
        const finalRss = last ? last.rssMB.toFixed(2) : 'N/A';
        const finalHeap = last ? last.heapUsedMB.toFixed(2) : 'N/A';
        logger.info('--- Memory Summary ---');
        logger.info(`  RSS:       peak=${rssPeak.toFixed(2)}MB (cb[${rssPeakIdx}]), min=${rssMin.toFixed(2)}MB, final=${finalRss}MB`);
        logger.info(`  heapUsed:  peak=${heapPeak.toFixed(2)}MB (cb[${heapPeakIdx}]), min=${heapMin.toFixed(2)}MB, final=${finalHeap}MB`);
    }

    private printCacheChanges(snapshots: MemorySnapshot[]): void {
        logger.info('--- Module Cache Changes ---');
        let anyChange = false;
        let totalDowngraded = 0;
        for (let i = 1; i < snapshots.length; i++) {
            const prev = new Set(snapshots[i - 1].cachedModules);
            const curr = new Set(snapshots[i].cachedModules);
            const evicted = [...prev].filter(n => !curr.has(n));
            const loaded = [...curr].filter(n => !prev.has(n));
            const downgraded = snapshots[i].downgradedModules;
            if (evicted.length === 0 && loaded.length === 0 && downgraded.length === 0) {
                continue;
            }
            anyChange = true;
            const parts: string[] = [];
            if (loaded.length > 0) {
                parts.push(`loaded: [${loaded.join(', ')}]`);
            }
            if (evicted.length > 0) {
                parts.push(`evicted: [${evicted.join(', ')}]`);
            }
            if (downgraded.length > 0) {
                parts.push(`downgraded: [${downgraded.join(', ')}]`);
                totalDowngraded += downgraded.length;
            }
            logger.info(`  cb[${snapshots[i - 1].callbackIndex}] -> cb[${snapshots[i].callbackIndex}]: ${parts.join('; ')}`);
        }
        if (!anyChange) {
            logger.info('  (no module cache changes detected between callbacks)');
        }
        logger.info(`  Total downgraded modules: ${totalDowngraded}`);
    }

    // --- Reference leak analysis ---

    /**
     * Analyze reference leaks after loading and unloading all modules.
     *
     * Loads all modules via analyseByModule, then unloads them all,
     * forces GC, and quantifies residual references by type.
     */
    public testReferenceLeaks(): void {
        logger.info('testReferenceLeaks start');

        const sceneConfig = new SceneConfig();
        sceneConfig.buildFromProjectDir(PROJECT_DIR);
        SDK_CONFIGS.forEach(sdk => sceneConfig.getSdksObj().push(sdk));
        const scene = new Scene();
        scene.config(sceneConfig);

        const config = new ModuleAnalysisConfig();
        config.setIncludeType(ModuleType.PROJECT, true);
        config.setIncludeType(ModuleType.OH_MODULES, true);
        config.setLoadLevel(ModuleDepthLevel.BODIES);

        const canForceGC = typeof (global as unknown as { gc?: () => void }).gc === 'function';
        const forceGC = (): void => {
            if (canForceGC) {
                (global as unknown as { gc: () => void }).gc();
            }
        };

        logger.info('--- Loading all modules ---');
        scene.analyseByModule(() => {}, config);
        forceGC();
        const afterLoad = process.memoryUsage();
        logger.info(`After load: RSS=${(afterLoad.rss / 1024 / 1024).toFixed(1)}MB, heapUsed=${(afterLoad.heapUsed / 1024 / 1024).toFixed(1)}MB`);

        const loadedStats = this.countReferences(scene);
        this.printRefStats('While loaded', loadedStats);

        this.unloadAllCachedModules(scene, forceGC, afterLoad);

        const leakedStats = this.countReferences(scene);
        this.printRefStats('After unload (leaks)', leakedStats);

        this.printGlobalMapStats(scene);

        logger.info('testReferenceLeaks end\n');
    }

    private unloadAllCachedModules(
        scene: Scene, forceGC: () => void, afterLoad: NodeJS.MemoryUsage
    ): void {
        logger.info('--- Unloading all modules ---');
        const builder = new ModuleBuilder(scene);
        const cache = scene.getModuleCache();
        if (cache) {
            for (const moduleId of cache.getLoadedModules()) {
                builder.unload(moduleId);
                cache.unregister(moduleId);
            }
            cache.clear();
        }
        forceGC();
        const afterUnload = process.memoryUsage();
        logger.info(`After unload: RSS=${(afterUnload.rss / 1024 / 1024).toFixed(1)}MB, heapUsed=${(afterUnload.heapUsed / 1024 / 1024).toFixed(1)}MB`);
        const deltaRss = ((afterUnload.rss - afterLoad.rss) / 1024 / 1024).toFixed(1);
        const deltaHeap = ((afterUnload.heapUsed - afterLoad.heapUsed) / 1024 / 1024).toFixed(1);
        logger.info(`Delta: RSS=${deltaRss}MB, heapUsed=${deltaHeap}MB`);
    }

    private printGlobalMapStats(scene: Scene): void {
        logger.info('--- ModelUtils.implicitArkUIBuilderMethods ---');
        logger.info(`  Size: ${ModelUtils.implicitArkUIBuilderMethods.size}`);

        logger.info('--- Scene global map sizes ---');
        logger.info(`  filesMap: ${scene.getFiles().length}`);
        logger.info(`  sdkArkFilesMap: ${scene.getSdkArkFiles().length}`);
    }

    private countReferences(scene: Scene): {
        importInfoCount: number;
        exportInfoCount: number;
        lazyExportInfoResolved: number;
        arkExportSet: number;
        heritageClassesResolved: number;
        extendedClassesCount: number;
    } {
        let importInfoCount = 0;
        let exportInfoCount = 0;
        let lazyExportInfoResolved = 0;
        let arkExportSet = 0;
        let heritageClassesResolved = 0;
        let extendedClassesCount = 0;

        for (const arkFile of scene.getFiles()) {
            for (const importInfo of arkFile.getImportInfos()) {
                importInfoCount++;
                const lazy = importInfo.getLazyExportInfo();
                if (lazy) {
                    lazyExportInfoResolved++;
                }
                if (lazy && lazy.getArkExport()) {
                    arkExportSet++;
                }
            }
            for (const exportInfo of arkFile.getExportInfos()) {
                exportInfoCount++;
                if (exportInfo.getArkExport()) {
                    arkExportSet++;
                }
            }
        }

        // Check ArkClass heritage and extended references
        for (const arkFile of scene.getFiles()) {
            for (const arkClass of ModelUtils.getAllClassesInFile(arkFile)) {
                const heritage = arkClass.getAllHeritageClasses();
                heritageClassesResolved += heritage.length;
                extendedClassesCount += arkClass.getExtendedClasses().size;
            }
        }

        return {
            importInfoCount,
            exportInfoCount,
            lazyExportInfoResolved,
            arkExportSet,
            heritageClassesResolved,
            extendedClassesCount,
        };
    }

    private printRefStats(
        label: string,
        stats: {
            importInfoCount: number;
            exportInfoCount: number;
            lazyExportInfoResolved: number;
            arkExportSet: number;
            heritageClassesResolved: number;
            extendedClassesCount: number;
        }
    ): void {
        logger.info(`--- ${label} ---`);
        logger.info(`  ImportInfo total: ${stats.importInfoCount}`);
        logger.info(`  ExportInfo total: ${stats.exportInfoCount}`);
        logger.info(`  ImportInfo.lazyExportInfo resolved (cross-file ref): ${stats.lazyExportInfoResolved}`);
        logger.info(`  ExportInfo.arkExport set (holds ArkClass/Method/Namespace): ${stats.arkExportSet}`);
        logger.info(`  ArkClass.heritageClasses.baseClass resolved (cross-file parent): ${stats.heritageClassesResolved}`);
        logger.info(`  ArkClass.extendedClasses total (parent→child back-ref): ${stats.extendedClassesCount}`);
    }
}

const moduleAnalyseTest = new ModuleAnalyseTest();
// moduleAnalyseTest.testModuleAnalysis();
// moduleAnalyseTest.compareScenesFromAnalyseByModuleAndBuildSceneFromFiles();
moduleAnalyseTest.testMemoryProfiling();
