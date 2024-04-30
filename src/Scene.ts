import fs from 'fs';
import path from 'path';

import {SceneConfig} from './Config';
import {AbstractCallGraph} from "./callgraph/AbstractCallGraphAlgorithm";
import {ClassHierarchyAnalysisAlgorithm} from "./callgraph/ClassHierarchyAnalysisAlgorithm";
import {RapidTypeAnalysisAlgorithm} from "./callgraph/RapidTypeAnalysisAlgorithm";
import {VariablePointerAnalysisAlogorithm} from './callgraph/VariablePointerAnalysisAlgorithm';
import {ImportInfo, updateSdkConfigPrefix} from './core/common/ImportBuilder';
import {ModelUtils} from './core/common/ModelUtils';
import {TypeInference} from './core/common/TypeInference';
import {VisibleValue} from './core/common/VisibleValue';
import {ArkClass} from "./core/model/ArkClass";
import {ArkFile, buildArkFileFromFile} from "./core/model/ArkFile";
import {ArkMethod} from "./core/model/ArkMethod";
import {ArkNamespace} from "./core/model/ArkNamespace";
import {ClassSignature, FileSignature, MethodSignature, NamespaceSignature} from "./core/model/ArkSignature";
import Logger from "./utils/logger";
import {transfer2UnixPath} from './utils/pathTransfer';
import ts from "typescript";
import nullTypingsInstaller = ts.server.nullTypingsInstaller;

const logger = Logger.getLogger();

/**
 * The Scene class includes everything in the analyzed project.
 * We should be able to re-generate the project's code based on this class.
 */
export class Scene {
    private projectName: string = '';
    private projectFiles: Map<string, string> = new Map<string, string>();
    private realProjectDir: string;
    private realProjectOriginDir: string;

    // TODO: type of key should be signature object
    private sdkArkFilestMap: Map<string, ArkFile> = new Map<string, ArkFile>();

    private extendedClasses: Map<string, ArkClass[]> = new Map();
    private globalImportInfos: ImportInfo[] = [];

    private ohosSdkPath: string;
    private kitSdkPath: string;
    private systemSdkPath: string;

    private otherSdkMap: Map<string, string>;

    private sdkFilesProjectMap: Map<string[], string> = new Map<string[], string>();

    // values that are visible in curr scope
    private visibleValue: VisibleValue = new VisibleValue();

    // signature to model
    private filesMap: Map<FileSignature, ArkFile> = new Map();
    private namespacesMap: Map<NamespaceSignature, ArkNamespace> = new Map();
    private classesMap: Map<ClassSignature, ArkClass> = new Map();
    private methodsMap: Map<MethodSignature, ArkMethod> = new Map();

    constructor(sceneConfig: SceneConfig) {
        this.projectName = sceneConfig.getTargetProjectName();
        this.projectFiles = sceneConfig.getProjectFiles();
        this.realProjectDir = fs.realpathSync(sceneConfig.getTargetProjectDirectory());
        this.realProjectOriginDir = fs.realpathSync(sceneConfig.getTargetProjectOriginDirectory());

        this.ohosSdkPath = sceneConfig.getOhosSdkPath();
        this.kitSdkPath = sceneConfig.getKitSdkPath();
        this.systemSdkPath = sceneConfig.getSystemSdkPath();
        this.sdkFilesProjectMap = sceneConfig.getSdkFilesMap();

        this.otherSdkMap = sceneConfig.getOtherSdkMap();

        // add sdk reative path to Import builder
        this.configImportSdkPrefix();

        this.genArkFiles();

        //post actions

        this.collectProjectImportInfos();
    }

    public getRealProjectDir(): string {
        return this.realProjectDir;
    }

    public getProjectName(): string {
        return this.projectName;
    }

    private configImportSdkPrefix() {
        if (this.ohosSdkPath) {
            updateSdkConfigPrefix("ohos", path.relative(this.realProjectDir, this.ohosSdkPath));
        }
        if (this.kitSdkPath) {
            updateSdkConfigPrefix("kit", path.relative(this.realProjectDir, this.kitSdkPath));
        }
        if (this.systemSdkPath) {
            updateSdkConfigPrefix("system", path.relative(this.realProjectDir, this.systemSdkPath));
        }
        if (this.otherSdkMap) {
            this.otherSdkMap.forEach((value, key) => {
                updateSdkConfigPrefix(key, path.relative(this.realProjectDir, value));
            });
        }
    }

    private genArkFiles() {
        this.sdkFilesProjectMap.forEach((value, key) => {
            if (key.length != 0) {
                const sdkProjectName = value;
                let realSdkProjectDir = "";
                if (sdkProjectName == "ohos") {
                    realSdkProjectDir = fs.realpathSync(this.ohosSdkPath);
                } else if (sdkProjectName == "kit") {
                    realSdkProjectDir = fs.realpathSync(this.kitSdkPath);
                } else if (sdkProjectName == "system") {
                    realSdkProjectDir = fs.realpathSync(this.systemSdkPath);
                } else {
                    let sdkPath = this.otherSdkMap.get(value);
                    if (sdkPath) {
                        realSdkProjectDir = fs.realpathSync(sdkPath);
                    }
                }

                key.forEach((file) => {
                    logger.info('=== parse file:', file);
                    let arkFile: ArkFile = new ArkFile();
                    arkFile.setProjectName(sdkProjectName);
                    buildArkFileFromFile(file, realSdkProjectDir, arkFile);
                    arkFile.setScene(this);
                    this.sdkArkFilestMap.set(arkFile.getFileSignature().toString(), arkFile);
                });
            }
        });

        this.projectFiles.forEach((value, key) => {
            logger.info('=== parse file:', key);
            let arkFile: ArkFile = new ArkFile();
            arkFile.setProjectName(this.projectName);
            arkFile.setOhPackageJson5Path(value);
            buildArkFileFromFile(key, this.realProjectDir, arkFile);
            arkFile.setScene(this);
            this.filesMap.set(arkFile.getFileSignature(), arkFile);
        });
    }

    public getFile(fileSignature: FileSignature): ArkFile | null {
        return this.filesMap.get(fileSignature) || null;
    }

    public getFiles(): ArkFile[] {
        return Array.from(this.filesMap.values());
    }

    public getSdkArkFilestMap() {
        return this.sdkArkFilestMap;
    }

    public getNamespace(namespaceSignature: NamespaceSignature): ArkNamespace | null {
        return this.getNamespacesMap().get(namespaceSignature) || null;
    }

    private getNamespacesMap(): Map<NamespaceSignature, ArkNamespace> {
        if (this.namespacesMap.size == 0) {
            for (const file of this.getFiles()) {
                ModelUtils.getAllNamespacesInFile(file).forEach((namespace) => {
                    this.namespacesMap.set(namespace.getNamespaceSignature(), namespace);
                })
            }
        }
        return this.namespacesMap;
    }

    public getNamespaces(): ArkNamespace[] {
        return Array.from(this.getNamespacesMap().values());
    }

    public getClass(classSignature: ClassSignature): ArkClass | null {
        return this.getClassesMap().get(classSignature) || null;
    }

    private getClassesMap(): Map<ClassSignature, ArkClass> {
        if (this.classesMap.size == 0) {
            for (const file of this.getFiles()) {
                for (const cls of file.getClasses()) {
                    this.classesMap.set(cls.getSignature(), cls);
                }
            }
            for (const namespace of this.getNamespacesMap().values()) {
                for (const cls of namespace.getClasses()) {
                    this.classesMap.set(cls.getSignature(), cls);
                }
            }
        }
        return this.classesMap;
    }

    public getClasses(): ArkClass[] {
        return Array.from(this.getClassesMap().values());
    }

    public getMethod(methodSignature: MethodSignature): ArkMethod | null {
        return this.getMethodsMap().get(methodSignature) || null;
    }

    private getMethodsMap(): Map<MethodSignature, ArkMethod> {
        if (this.methodsMap.size == 0) {
            for (const cls of this.getClassesMap().values()) {
                for (const method of cls.getMethods()) {
                    this.methodsMap.set(method.getSignature(), method);
                }
            }
        }
        return this.methodsMap;
    }

    public getMethods(): ArkMethod[] {
        return Array.from(this.getMethodsMap().values());
    }

    public hasMainMethod(): boolean {
        return false;
    }

    //Get the set of entry points that are used to build the call graph.
    public getEntryPoints() {
        return [];
    }

    /** get values that is visible in curr scope */
    public getVisibleValue(): VisibleValue {
        return this.visibleValue;
    }

    public makeCallGraphCHA(entryPoints: MethodSignature[]): AbstractCallGraph {
        let callGraphCHA: AbstractCallGraph
        callGraphCHA = new ClassHierarchyAnalysisAlgorithm(this);
        callGraphCHA.loadCallGraph(entryPoints)
        return callGraphCHA
    }

    public makeCallGraphRTA(entryPoints: MethodSignature[]): AbstractCallGraph {
        let callGraphRTA: AbstractCallGraph
        callGraphRTA = new RapidTypeAnalysisAlgorithm(this);
        callGraphRTA.loadCallGraph(entryPoints)
        return callGraphRTA
    }

    public makeCallGraphVPA(entryPoints: MethodSignature[]): AbstractCallGraph {
        // WIP context-insensitive 上下文不敏感
        let callGraphVPA: AbstractCallGraph
        callGraphVPA = new VariablePointerAnalysisAlogorithm(this);
        callGraphVPA.loadCallGraph(entryPoints)
        return callGraphVPA
    }

    /**
     * 对每个method方法体内部进行类型推导，将变量类型填入
     */
    public inferTypes() {
        const typeInference = new TypeInference(this);
        for (let arkFile of this.getFiles()) {
            for (let arkClass of arkFile.getClasses()) {
                for (let arkMethod of arkClass.getMethods()) {
                    typeInference.inferTypeInMethod(arkMethod);
                }
            }
        }

        // get class hierarchy
        this.genExtendedClasses()
    }

    public inferSimpleTypes() {
        const typeInference = new TypeInference(this);
        for (let arkFile of this.getFiles()) {
            for (let arkClass of arkFile.getClasses()) {
                for (let arkMethod of arkClass.getMethods()) {
                    typeInference.inferSimpleTypeInMethod(arkMethod);
                }
            }
        }
    }

    private collectProjectImportInfos() {
        this.getFiles().forEach((arkFile) => {
            arkFile.getImportInfos().forEach((importInfo) => {
                this.globalImportInfos.push(importInfo);
            });
        });
    }

    private genExtendedClasses() {
        this.getClassesMap().forEach((cls) => {
            let superClassName = cls.getSuperClassName();
            let superClass: ArkClass | null = null;

            superClass = ModelUtils.getClassWithNameFromClass(superClassName, cls);

            if (superClass != null) {
                cls.setSuperClass(superClass);
                superClass.addExtendedClass(cls);
            }
        });
    }

    public findOriginPathFromTransformedPath(tsPath: string) {
        let relativePath = path.relative(this.realProjectDir, tsPath);
        let relativePathWithoutExt = relativePath.replace(/\.ts$/, '');
        let resPath = '';
        if (fs.existsSync(tsPath + '.map')) {
            resPath = path.join(this.realProjectOriginDir, relativePathWithoutExt) + '.ets';
        } else {
            resPath = path.join(this.realProjectOriginDir, relativePath);
        }
        return transfer2UnixPath(resPath);
    }

    public getClassMap(): Map<FileSignature | NamespaceSignature, ArkClass[]> {
        const classMap: Map<FileSignature | NamespaceSignature, ArkClass[]> = new Map();
        for (const file of this.getFiles()) {
            const fileClass: ArkClass[] = [];
            const namespaceStack: ArkNamespace[] = [];
            const parentMap: Map<ArkNamespace, ArkNamespace | ArkFile> = new Map();
            const finalNamespaces: ArkNamespace[] = [];
            for (const arkClass of file.getClasses()) {
                fileClass.push(arkClass);
            }
            for (const ns of file.getNamespaces()) {
                namespaceStack.push(ns);
                parentMap.set(ns, file);
            }

            classMap.set(file.getFileSignature(), fileClass);
            const stack = [...namespaceStack];
            // 第一轮遍历，加上每个namespace自己的class
            while (namespaceStack.length > 0) {
                const ns = namespaceStack.shift()!;
                const nsClass: ArkClass[] = [];
                for (const arkClass of ns.getClasses()) {
                    nsClass.push(arkClass)
                }
                classMap.set(ns.getNamespaceSignature(), nsClass);
                if (ns.getNamespaces().length == 0) {
                    finalNamespaces.push(ns);
                } else {
                    for (const nsns of ns.getNamespaces()) {
                        namespaceStack.push(nsns);
                        parentMap.set(nsns, ns);
                    }
                }
            }
            // 第二轮遍历，父节点加上子节点的export的class
            while (finalNamespaces.length > 0) {
                const finalNS = finalNamespaces.shift()!;
                const exportClass = [];
                for (const arkClass of finalNS.getClasses()) {
                    if (arkClass.isExported()) {
                        exportClass.push(arkClass);
                    }
                }
                let p = finalNS;
                while (p.isExported()) {
                    const parent = parentMap.get(p)!;
                    if (parent instanceof ArkNamespace) {
                        classMap.get(parent.getNamespaceSignature())?.push(...exportClass);
                        p = parent;
                    } else if (parent instanceof ArkFile) {
                        classMap.get(parent.getFileSignature())?.push(...exportClass);
                        break;
                    }
                }
                const parent = parentMap.get(finalNS)!;
                if (parent instanceof ArkNamespace && !finalNamespaces.includes(parent)) {
                    finalNamespaces.push(parent);
                }
            }
        }

        for (const file of this.getFiles()) {
            // 文件加上import的class，包括ns的
            const importClasses: ArkClass[] = [];
            const importNameSpaces: ArkNamespace[] = [];
            for (const importInfo of file.getImportInfos()) {
                const importClass = ModelUtils.getClassInImportInfoWithName(importInfo.getImportClauseName(), file);
                if (importClass && !importClasses.includes(importClass)) {
                    importClasses.push(importClass);
                }
                const importNameSpace = ModelUtils.getNamespaceInImportInfoWithName(importInfo.getImportClauseName(), file);
                if (importNameSpace && !importNameSpaces.includes(importNameSpace)) {
                    try {
                        // 遗留问题：只统计了项目文件，没统计sdk文件内部的引入
                        const importNameSpaceClasses = classMap.get(importNameSpace.getNamespaceSignature())!;
                        importClasses.push(...importNameSpaceClasses.filter(c => !importClasses.includes(c) && c.getName() != '_DEFAULT_ARK_CLASS'));
                    } catch {
                        // console.log(importNameSpace)
                    }

                }
            }
            const fileClasses = classMap.get(file.getFileSignature())!;
            fileClasses.push(...importClasses.filter(c => !fileClasses.includes(c)));
            // 子节点加上父节点的class
            const namespaceStack = [...file.getNamespaces()];
            for (const ns of namespaceStack) {
                const nsClasses = classMap.get(ns.getNamespaceSignature())!;
                nsClasses.push(...fileClasses.filter(c => !nsClasses.includes(c) && c.getName() != '_DEFAULT_ARK_CLASS'));
            }
            while (namespaceStack.length > 0) {
                const ns = namespaceStack.shift()!;
                const nsClasses = classMap.get(ns.getNamespaceSignature())!;
                for (const nsns of ns.getNamespaces()) {
                    const nsnsClasses = classMap.get(nsns.getNamespaceSignature())!;
                    nsnsClasses.push(...nsClasses.filter(c => !nsnsClasses.includes(c) && c.getName() != '_DEFAULT_ARK_CLASS'));
                    namespaceStack.push(nsns);
                }
            }
        }
        return classMap;
    }
}