import { Stmt } from "../../core/base/Stmt";
import { Type } from "../../core/base/Type";
import { Value } from "../../core/base/Value";
import { FieldSignature, MethodSignature } from "../../core/model/ArkSignature";

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

export abstract class Pointer {
    private pointerTargetSet: Set<PointerTarget>

    constructor() {
        this.pointerTargetSet = new Set()
    }

    public addPointerTarget(newPointerTarget: PointerTarget) {
        for (let pointerTarget of this.pointerTargetSet) {
            if (pointerTarget.getLocation() == newPointerTarget.getLocation()) {
                return
            }
        }
        this.pointerTargetSet.add(newPointerTarget)
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
}

export class LocalPointer extends Pointer {
    private identifier: Value // 用于表示指针集的唯一归属

    constructor(identifier: Value) {
        super()
        this.identifier = identifier
    }

    public getIdentifier(): Value {
        return this.identifier
    }

    public toString() {
        let resultString = "[LocalPointer] "
        resultString += this.getIdentifier().toString() + " pointer: {"
        const pointerTargets = this.getAllPointerTargets()
        for (let pointerTarget of pointerTargets) {
            resultString += " " + pointerTarget.getType() + "." + pointerTarget.getLocation()
        }
        return resultString + "}"
    }
}

/**
 * TODO: 需要考虑在调用类的属性的时候如何将同一个类的不同实例区分开
 * 目前想法是让InstanceFieldPointer的标识符属性改成LocalPointer，这样能够区分具体构造位置
 */

export class InstanceFieldPointer extends Pointer {
    // private identifier: Value // 用于表示指针集的唯一归属
    private basePointerTarget: PointerTarget
    private fieldSignature: FieldSignature

    constructor(basePointerTarget: PointerTarget, field: FieldSignature) {
        super()
        this.basePointerTarget = basePointerTarget
        this.fieldSignature = field
    }

    public getBasePointerTarget() {
        return this.basePointerTarget
    }

    public getFieldSignature() {
        return this.fieldSignature
    }

    public toString() {
        let resultString = "[InstanceFieldPointer] "
        resultString += this.getBasePointerTarget().getType()
            + "." + this.fieldSignature.getFieldName() + " pointer: {"
        const pointerTargets = this.getAllPointerTargets()
        for (let pointerTarget of pointerTargets) {
            resultString += " " + pointerTarget.getType() + "." + pointerTarget.getLocation()
        }
        return resultString + "}"
    }
}

export class StaticFieldPointer extends Pointer {
    private fieldSignature: FieldSignature

    constructor(field: FieldSignature) {
        super()
        this.fieldSignature = field
    }

    public getFieldSignature() {
        return this.fieldSignature
    }

    public toString() {
        let resultString = "[StaticFieldPointer] "
        resultString += this.fieldSignature.getDeclaringClassSignature().getClassName() + "."
            + this.fieldSignature.getFieldName() + " pointer: {"
        const pointerTargets = this.getAllPointerTargets()
        for (let pointerTarget of pointerTargets) {
            resultString += " " + pointerTarget.getType() + "." + pointerTarget.getLocation()
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