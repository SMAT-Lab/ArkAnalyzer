import {ClassSignature, MethodSignature} from "../core/model/ArkSignature";
import {Scene} from "../Scene";
import {ArkMethod} from "../core/model/ArkMethod";
import {ArkClass} from "../core/model/ArkClass";


export class MethodSignatureManager {
    private _workList: MethodSignature[] = [];
    private _processedList: string[] = [];

    get workList(): MethodSignature[] {
        return this._workList;
    }

    set workList(list: MethodSignature[]) {
        this._workList = list;
    }

    get processedList(): string[] {
        return this._processedList;
    }

    set processedList(list: string[]) {
        this._processedList = list;
    }

    public findInWorkList(signature: MethodSignature): MethodSignature | undefined {
        return this.workList.find(item => item === signature);
    }

    public findInProcessedList(signature: MethodSignature): string {
        return this.processedList.find(item => item === signature.toString());
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
        if (!isItemRegistered<string>(
            signature.toString(), this.processedList,
            (a, b) =>
                a === b
        )) {
            this.processedList.push(signature.toString());
        }
    }

    public removeFromWorkList(signature: MethodSignature): void {
        this.workList = this.workList.filter(item => item !== signature);
    }

    public removeFromProcessedList(signature: MethodSignature): void {
        this.processedList = this.processedList.filter(item => item !== signature.toString());
    }
}

export class SceneManager {
    private _scene: Scene;

    get scene(): Scene {
        return this._scene;
    }

    set scene(value: Scene) {
        this._scene = value;
    }

    public getMethod(method: MethodSignature): ArkMethod | null {
        this._scene.getMethod(method.arkClass.arkFile,
            method.methodSubSignature.methodName,
            method.methodSubSignature.parameters,
            [],
            method.arkClass.classType
        )
        return null;
    }

    public getClass(arkClass: ClassSignature): ArkClass | null {
        return this._scene.getClass(arkClass.arkFile, arkClass.classType)
    }

    public getExtendedClasses(arkClass: ClassSignature): ArkClass[] {
        let sourceClass = this.getClass(arkClass)
        let classList = [sourceClass]   // 待处理类
        let extendedClasses: ArkClass[] = []      // 已经处理的类

        while (classList.length > 0) {
            let tempClass = classList.shift()
            let firstLevelSubclasses = this.scene.extendedClasses.get(
                tempClass.classSignature.toString())

            if (firstLevelSubclasses) {
                for (let subclass of firstLevelSubclasses) {
                    if (!isItemRegistered<ArkClass>(
                        subclass, extendedClasses,
                        (a, b) =>
                            a.classSignature.toString() === b.classSignature.toString()
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
                    a.classSignature.toString() === b.classSignature.toString()
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