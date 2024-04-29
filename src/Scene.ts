import fs from 'fs';
import path from 'path';

import { SceneConfig } from './Config';
import { AbstractCallGraph } from "./callgraph/AbstractCallGraphAlgorithm";
import { ClassHierarchyAnalysisAlgorithm } from "./callgraph/ClassHierarchyAnalysisAlgorithm";
import { RapidTypeAnalysisAlgorithm } from "./callgraph/RapidTypeAnalysisAlgorithm";
import { VariablePointerAnalysisAlogorithm } from './callgraph/VariablePointerAnalysisAlgorithm';
import { ImportInfo, updateSdkConfigPrefix } from './core/common/ImportBuilder';
import { ModelUtils } from './core/common/ModelUtils';
import { TypeInference } from './core/common/TypeInference';
import { VisibleValue } from './core/common/VisibleValue';
import { ArkClass } from "./core/model/ArkClass";
import { ArkFile, buildArkFileFromFile } from "./core/model/ArkFile";
import { ArkMethod } from "./core/model/ArkMethod";
import { ArkNamespace } from "./core/model/ArkNamespace";
import { ClassSignature, FileSignature, MethodSignature, NamespaceSignature } from "./core/model/ArkSignature";
import Logger from "./utils/logger";
import { transfer2UnixPath } from './utils/pathTransfer';

const logger = Logger.getLogger();

/**
 * The Scene class includes everything in the analyzed project.
 * We should be able to re-generate the project's code based on this class.
 */
export class Scene {
    projectName: string = '';
    projectFiles: string[] = [];
    realProjectDir: string;
    realProjectOriginDir: string;

    arkFiles: ArkFile[] = [];
    //sdkArkFiles: ArkFile[] = [];
    private targetProjectArkFilesMap: Map<string, ArkFile> = new Map<string, ArkFile>();
    private sdkArkFilestMap: Map<string, ArkFile> = new Map<string, ArkFile>();

    extendedClasses: Map<string, ArkClass[]> = new Map();
    globalImportInfos: ImportInfo[] = [];

    private ohosSdkPath: string;
    private kitSdkPath: string;
    private systemSdkPath: string;

    private otherSdkMap: Map<string, string>;

    private sdkFilesProjectMap: Map<string[], string> = new Map<string[], string>();

    // values that are visible in curr scope
    private visibleValue: VisibleValue = new VisibleValue();

    // all classes and methods, just for demo
    private allClasses: ArkClass[] = [];
    private allMethods: ArkMethod[] = [];
    private classCached: Map<ClassSignature, ArkClass | null> = new Map();

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

        this.projectFiles.forEach((file) => {
            logger.info('=== parse file:', file);
            let arkFile: ArkFile = new ArkFile();
            arkFile.setProjectName(this.projectName);
            buildArkFileFromFile(file, this.realProjectDir, arkFile);
            arkFile.setScene(this);
            this.arkFiles.push(arkFile);
            this.targetProjectArkFilesMap.set(arkFile.getFileSignature().toString(), arkFile);
        });
    }

    public getFile(fileSignature: FileSignature): ArkFile | null {
        const foundFile = this.arkFiles.find(fl => fl.getFileSignature().toString() == fileSignature.toString());
        return foundFile || null;
    }

    public getFiles() {
        return this.arkFiles;
    }

    public getTargetProjectArkFilesMap() {
        return this.targetProjectArkFilesMap;
    }

    public getSdkArkFilestMap() {
        return this.sdkArkFilestMap;
    }

    public getNamespace(namespaceSignature: NamespaceSignature | string): ArkNamespace | null {
        let returnVal: ArkNamespace | null = null;
        if (namespaceSignature instanceof NamespaceSignature) {
            let fileSig = namespaceSignature.getDeclaringFileSignature();
            this.arkFiles.forEach((fl) => {
                if (fl.getFileSignature().toString() == fileSig.toString()) {
                    returnVal = fl.getNamespaceAllTheFile(namespaceSignature);
                }
            });
        } else {
            this.getAllNamespacesUnderTargetProject().forEach((ns) => {
                if (ns.getNamespaceSignature().toString() == namespaceSignature) {
                    returnVal = ns;
                }
            });
        }
        return returnVal;
    }

    public getClass(classSignature: ClassSignature | string): ArkClass | null {
        let classSearched: ArkClass | null = null;
        if (classSignature instanceof ClassSignature) {
            if (this.classCached.has(classSignature)) {
                classSearched = this.classCached.get(classSignature) || null;
            } else {
                const fileSig = classSignature.getDeclaringFileSignature().toString();
                const arkFile = this.targetProjectArkFilesMap.get(fileSig);
                if (arkFile) {
                    classSearched = arkFile.getClassAllTheFile(classSignature);
                }
                this.classCached.set(classSignature, classSearched);
            }
        } else {
            this.getAllClassesUnderTargetProject().forEach((cls) => {
                if (cls.getSignature().toString() == classSignature) {
                    classSearched = cls;
                }
            });
        }
        return classSearched;
    }

    public getMethod(methodSignature: MethodSignature | string): ArkMethod | null {
        let returnVal: ArkMethod | null = null;
        if (methodSignature instanceof MethodSignature) {
            let fileSig = methodSignature.getDeclaringClassSignature().getDeclaringFileSignature();
            this.arkFiles.forEach((fl) => {
                if (fl.getFileSignature().toString() == fileSig.toString()) {
                    returnVal = fl.getMethodAllTheFile(methodSignature);
                }
            });
        } else {
            this.getAllMethodsUnderTargetProject().forEach((mtd) => {
                if (mtd.getSignature().toString() == methodSignature) {
                    returnVal = mtd;
                }
            });
        }
        return returnVal;
    }

    public getAllNamespacesUnderTargetProject(): ArkNamespace[] {
        let namespaces: ArkNamespace[] = [];
        this.arkFiles.forEach((fl) => {
            namespaces.push(...fl.getAllNamespacesUnderThisFile());
        });
        return namespaces;
    }

    public getAllClassesUnderTargetProject(): ArkClass[] {
        if (this.allClasses.length == 0) {
            this.arkFiles.forEach((fl) => {
                this.allClasses.push(...fl.getAllClassesUnderThisFile());
            });
        }
        return this.allClasses;
    }

    public getAllMethodsUnderTargetProject(): ArkMethod[] {
        if (this.allMethods.length == 0) {
            this.arkFiles.forEach((fl) => {
                this.allMethods.push(...fl.getAllMethodsUnderThisFile());
            });
        }
        return this.allMethods;
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
        for (let arkFile of this.arkFiles) {
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
        for (let arkFile of this.arkFiles) {
            for (let arkClass of arkFile.getClasses()) {
                for (let arkMethod of arkClass.getMethods()) {
                    typeInference.inferSimpleTypeInMethod(arkMethod);
                }
            }
        }
    }

    private collectProjectImportInfos() {
        this.arkFiles.forEach((arkFile) => {
            arkFile.getImportInfos().forEach((importInfo) => {
                this.globalImportInfos.push(importInfo);
            });
        });
    }

    private genExtendedClasses() {
        let allClasses = this.getAllClassesUnderTargetProject();
        allClasses.forEach((cls) => {
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
        }
        else {
            resPath = path.join(this.realProjectOriginDir, relativePath);
        }
        return transfer2UnixPath(resPath);
    }

    public getClassMap(): Map<FileSignature | NamespaceSignature, ArkClass[]> {
        const classMap: Map<FileSignature | NamespaceSignature, ArkClass[]> = new Map();
        for (const file of this.arkFiles){
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
                }
                else {
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
        
        for (const file of this.arkFiles) {
            // 文件加上import的class，包括ns的
            const importClasses: ArkClass[] = [];
            const importNameSpaces: ArkNamespace[] = [];
            for (const importInfo of file.getImportInfos()){
                const importClass = ModelUtils.getClassInImportInfoWithName(importInfo.getImportClauseName(), file);
                if (importClass && !importClasses.includes(importClass)) {
                    importClasses.push(importClass);
                }
                const importNameSpace = ModelUtils.getNamespaceInImportInfoWithName(importInfo.getImportClauseName(),file);
                if (importNameSpace && !importNameSpaces.includes(importNameSpace)) {
                    const importNameSpaceClasses = classMap.get(importNameSpace.getNamespaceSignature())!;
                    importClasses.push(...importNameSpaceClasses.filter(c => !importClasses.includes(c) && c.getName() != '_DEFAULT_ARK_CLASS'));
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