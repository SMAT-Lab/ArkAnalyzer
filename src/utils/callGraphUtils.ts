import { ClassSignature, MethodSignature } from "../core/model/ArkSignature";
import { Scene } from "../Scene";
import { ArkMethod } from "../core/model/ArkMethod";
import { ArkClass } from "../core/model/ArkClass";


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
        return this._scene.getMethod(
            method
        );
    }

    public getClass(arkClass: ClassSignature): ArkClass | null {
        if (typeof arkClass.getClassName() === "undefined")
            return null
        return this._scene.getClass(arkClass)
    }

    public getExtendedClasses(arkClass: ClassSignature): ArkClass[] {
        let sourceClass = this.getClass(arkClass)
        let classList = [sourceClass]   // 待处理类
        let extendedClasses: ArkClass[] = []      // 已经处理的类

        while (classList.length > 0) {
            let tempClass = classList.shift()
            if (tempClass == null)
                continue
            let firstLevelSubclasses = this.scene.extendedClasses.get(
                tempClass.getSignature().toString())

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
    console.log("\nCall Graph:\n")
    console.log('\tMethods:');
    methods.forEach(method => {
        console.log(`\t\t${method}`);
    });

    // 打印 Calls
    console.log('\tCalls:');
    // 计算最长的method名称的长度，加上箭头和空格的长度
    const longestCallerLength = Array.from(calls.keys()).reduce((max, method) => Math.max(max, method.toString().length), 0);
    const arrow = '->';
    const spacesAfterArrow = '   ';
    const prefixLength = longestCallerLength + arrow.length + spacesAfterArrow.length;

    calls.forEach((calledMethods, method) => {
        // 对于每个调用源，只打印一次调用源和第一个目标方法
        const modifiedMethodName = `<${method}`;
        console.log(`\t\t${modifiedMethodName.padEnd(4)}   ${arrow}`);

        for (let i = 0; i < calledMethods.length; i++) {
            const modifiedCalledMethod = `\t\t<${calledMethods[i]}`;
            console.log(`\t\t${modifiedCalledMethod}`);
        }
        console.log("\n")
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