import { Stmt } from "../../core/base/Stmt";
import { Type } from "../../core/base/Type";
import { Value } from "../../core/base/Value";
import { MethodSignature } from "../../core/model/ArkSignature";

/**
 * 指针需要全局唯一，需要根据语句信息确定唯一位置
 */
export class Pointer {
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

export class PointerSet {
    private pointerSet: Set<Pointer>
    private identifier: Value // 用于表示指针集的唯一归属
    private fields: PointerSet[]

    constructor(identifier: Value) {
        this.identifier = identifier
        this.pointerSet = new Set()
    }

    public addPointer(pointer: Pointer) {
        // TODO: 重复性检查
        for (let pointer of this.pointerSet) {
            if (pointer.getLocation() == pointer.getLocation()) {
                return
            }
        }
        this.pointerSet.add(pointer)
    }

    public getIdentifier(): Value {
        return this.identifier
    }

    public getPointer(targetPointer: Pointer): Pointer | null {
        for (let pointer of this.pointerSet) {
            if (pointer == targetPointer) {
                return pointer
            }
        }
        return null
    }

    public getAllPointers(): Pointer[] {
        let results: Pointer[] = []
        for (let pointer of this.pointerSet) {
            results.push(pointer)
        }
        return results
    }

    public static comparePointerSet(a: PointerSet, b: PointerSet): boolean {
        // TODO: 比较规则涉及到Value接口的不同实现
        return a.identifier === b.identifier
    }

    public static calculateDifference(targetSet: Set<Pointer>, sourceSet: Set<Pointer>): Set<Pointer> {
        let difference = new Set(targetSet);
        for (let elem of sourceSet) {
            difference.delete(elem);
        }
        return difference;
    }
}

export class PointerPair {
    private identifier: Value
    private pointer: Pointer

    constructor(identifier: Value, pointer: Pointer) {
        this.identifier = identifier
        this.pointer = pointer
    }

    public getidentifier() {
        return this.identifier
    }

    public getPointer() {
        return this.pointer
    }
}