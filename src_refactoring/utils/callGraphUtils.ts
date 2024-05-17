import {Scene} from "../Scene";
import {ArkClass} from "../core/model/ArkClass";
import {ArkMethod} from "../core/model/ArkMethod";
import {ClassSignature, MethodSignature} from "../core/model/ArkSignature";
import Logger from "./logger";
import {ModelUtils} from "../core/common/ModelUtils";

const logger = Logger.getLogger();

export class MethodSignatureManager {
    private _workList: MethodSignature[] = [];
    private _processedList: MethodSignature[] = [];

    get workList(): MethodSignature[] {
        return this._workList;
    }

    set workList(list: MethodSignature[]) {
        this._workList = list;
    }

    get processedList(): MethodSignature[] {
        return this._processedList;
    }

    set processedList(list: MethodSignature[]) {
        this._processedList = list;
    }

    public findInWorkList(signature: MethodSignature): MethodSignature | undefined {
        return this.workList.find(item => item === signature);
    }

    public findInProcessedList(signature: MethodSignature): boolean {
        let result = this.processedList.find(item => item.toString() === signature.toString());
        return typeof result !== "undefined";
    }

    public addToWorkList(signature: MethodSignature): void {
        if (!isItemRegistered<MethodSignature>(
            signature, this.workList,
            (a, b) =>
                a.toString() === b.toString()
        )) {
            this.workList.push(signature);
        }
    }

    public addToProcessedList(signature: MethodSignature): void {
        if (!isItemRegistered<MethodSignature>(
            signature, this.processedList,
            (a, b) =>
                a === b
        )) {
            this.processedList.push(signature);
        }
    }

    public removeFromWorkList(signature: MethodSignature): void {
        this.workList = this.workList.filter(item => item !== signature);
    }

    public removeFromProcessedList(signature: MethodSignature): void {
        this.processedList = this.processedList.filter(item => item.toString() !== signature.toString());
    }
}

export class SceneManager {
    private _scene!: Scene;

    get scene(): Scene {
        return this._scene;
    }

    set scene(value: Scene) {
        this._scene = value;
    }

    public getMethod(method: MethodSignature): ArkMethod | null {
        let targetMethod = this._scene.getMethod(method);
        if (targetMethod == null) {
            // 支持SDK调用解析
            let sdkMap = this.scene.getSdkArkFilestMap()
            for (let file of sdkMap.values()) {
                if (file.getFileSignature().toString() == method.getDeclaringClassSignature().getDeclaringFileSignature().toString()) {
                    const methods = ModelUtils.getAllMethodsInFile(file);
                    for (let methodUnderFile of methods) {
                        if (method.toString() == methodUnderFile.getSignature().toString()) {
                            return methodUnderFile;
                        }
                    }
                }
            }
        }
        return targetMethod
    }

    public getClass(arkClass: ClassSignature): ArkClass | null {
        if (typeof arkClass.getClassName() === "undefined")
            return null
        let classInstance = this._scene.getClass(arkClass)
        if (classInstance == null) {
            let sdkOrTargetProjectFile = this._scene.getSdkArkFilestMap()
                .get(arkClass.getDeclaringFileSignature().toString())
            // TODO: support get sdk class, targetProject class waiting to be supported
            if (sdkOrTargetProjectFile != null) {
                for (let classUnderFile of ModelUtils.getAllClassesInFile(sdkOrTargetProjectFile)) {
                    if (classUnderFile.getSignature().toString() === arkClass.toString()) {
                        return classUnderFile
                    }
                }
            }
        }
        return classInstance
    }

    public getExtendedClasses(arkClass: ClassSignature): ArkClass[] {
        let sourceClass = this.getClass(arkClass)
        let classList = [sourceClass]   // 待处理类
        let extendedClasses: ArkClass[] = []      // 已经处理的类

        while (classList.length > 0) {
            let tempClass = classList.shift()
            if (tempClass == null)
                continue
            let firstLevelSubclasses: ArkClass[] = Array.from(tempClass.getExtendedClasses().values());

            if (firstLevelSubclasses) {
                for (let subclass of firstLevelSubclasses) {
                    if (!isItemRegistered<ArkClass>(
                        subclass, extendedClasses,
                        (a, b) =>
                            a.getSignature().toString() === b.getSignature().toString()
                    )) {
                        // 子类未处理，加入到classList
                        classList.push(subclass)
                    }
                }
            }

            // 当前类处理完毕，标记为已处理
            if (!isItemRegistered<ArkClass>(
                tempClass, extendedClasses,
                (a, b) =>
                    a.getSignature().toString() === b.getSignature().toString()
            )) {
                extendedClasses.push(tempClass)
            }
        }
        return extendedClasses
    }
}

export function isItemRegistered<T>(item: T, array: T[], compareFunc: (a: T, b: T) => boolean): boolean {
    for (let tempItem of array) {
        if (compareFunc(tempItem, item)) {
            return true;
        }
    }
    return false;
}

export function splitStringWithRegex(input: string): string[] {
    // 正则表达式匹配 "a.b.c()" 并捕获 "a" "b" "c"
    const regex = /^(\w+)\.(\w+)\.(\w+)\(\)$/;
    const match = input.match(regex);

    if (match) {
        // 返回捕获的部分，忽略整个匹配结果
        return match.slice(1);
    } else {
        // 如果输入不匹配，返回空数组
        return [];
    }
}

export function printCallGraphDetails(methods: Set<MethodSignature>, calls: Map<MethodSignature, MethodSignature[]>, rootDir: string): void {
    // 打印 Methods
    logger.info("Call Graph:\n")
    logger.info('\tMethods:');
    methods.forEach(method => {
        logger.info(`\t\t${method}`);
    });

    // 打印 Calls
    logger.info('\tCalls:');
    // 计算最长的method名称的长度，加上箭头和空格的长度
    const longestCallerLength = Array.from(calls.keys()).reduce((max, method) => Math.max(max, method.toString().length), 0);
    const arrow = '->';
    const spacesAfterArrow = '   ';
    const prefixLength = longestCallerLength + arrow.length + spacesAfterArrow.length;

    calls.forEach((calledMethods, method) => {
        // 对于每个调用源，只打印一次调用源和第一个目标方法
        const modifiedMethodName = `<${method}`;
        logger.info(`\t\t${modifiedMethodName.padEnd(4)}   ${arrow}`);

        for (let i = 0; i < calledMethods.length; i++) {
            const modifiedCalledMethod = `\t\t<${calledMethods[i]}`;
            logger.info(`\t\t${modifiedCalledMethod}`);
        }
        logger.info("\n")
    });
}

export function extractLastBracketContent(input: string): string {
    // 正则表达式匹配最后一个尖括号内的内容，直到遇到左圆括号
    const match = input.match(/<([^<>]*)\(\)>$/);
    if (match && match[1]) {
        return match[1].trim();
    }
    return "";
}