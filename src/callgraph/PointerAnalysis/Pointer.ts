import { Local } from "../../core/base/Local";
import { Stmt } from "../../core/base/Stmt";
import { Type } from "../../core/base/Type";
import { Value } from "../../core/base/Value";
import { MethodSignature } from "../../core/model/ArkSignature";

// TODO: 对指向目标进行细分，后续PointerTarget将作为抽象类
export class PointerTarget {
    private type: Type
    // 后续如果有需要回溯到对应文件位置的情况后，需要改用具体数据结构，目前仅重复检查，暂时使用string
    private location: string

    constructor(type: Type, location: string) {
        this.type = type
        this.location = location
    }

    public getType(): Type {
        return this.type
    }

    public getLocation() {
        return this.location
    }

    public static genLocation(method: MethodSignature, stmt: Stmt): string {
        return method.toString() + stmt.getOriginPositionInfo()
    }
}

/**
 * 指针需要全局唯一，需要根据语句信息确定唯一位置
 */
export class Pointer {
    private pointerTargetSet: Set<PointerTarget>
    private identifier: Value // 用于表示指针集的唯一归属
    // private fields: PointerSet[]

    constructor(identifier: Value) {
        this.identifier = identifier
        this.pointerTargetSet = new Set()
    }

    public addPointerTarget(newPointerTarget: PointerTarget) {
        for (let pointerTarget of this.pointerTargetSet) {
            if (pointerTarget.getLocation() == pointerTarget.getLocation()) {
                return
            }
        }
        this.pointerTargetSet.add(newPointerTarget)
    }

    public getIdentifier(): Value {
        return this.identifier
    }

    public getPointerTarget(specificPointerTarget: PointerTarget): PointerTarget | null {
        for (let pointerTarget of this.pointerTargetSet) {
            if (pointerTarget == specificPointerTarget) {
                return pointerTarget
            }
        }
        return null
    }

    public getAllPointerTargets(): PointerTarget[] {
        let results: PointerTarget[] = []
        for (let pointerTarget of this.pointerTargetSet) {
            results.push(pointerTarget)
        }
        return results
    }

    public static comparePointerTargetSet(a: Pointer, b: Pointer): boolean {
        // TODO: 比较规则涉及到Value接口的不同实现
        return a.identifier === b.identifier
    }

    public static calculateDifference(targetSet: Set<PointerTarget>, sourceSet: Set<PointerTarget>): Set<PointerTarget> {
        let difference = new Set(targetSet);
        for (let elem of sourceSet) {
            difference.delete(elem);
        }
        return difference;
    }

    public toString() {
        let resultString = ""
        if (this.identifier instanceof Local) {
            resultString = (this.identifier as Local).getName()+" pointer: {"
        }
        for (let pointerTarget of this.pointerTargetSet) {
            resultString += " "+pointerTarget.getType()+"."+pointerTarget.getLocation()
        }
        return resultString + "}"
    }
}

export class PointerTargetPair {
    private pointer: Pointer
    private pointerTarget: PointerTarget

    constructor(pointer: Pointer, pointerTarget: PointerTarget) {
        this.pointer = pointer
        this.pointerTarget = pointerTarget
    }

    public getPointer() {
        return this.pointer
    }

    public getPointerTarget() {
        return this.pointerTarget
    }
}