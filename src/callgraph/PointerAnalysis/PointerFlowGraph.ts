import { Value } from "../../core/base/Value";
import { Pointer, PointerPair, PointerSet } from "./Pointer";

export class PointerFlowGraph {
    private pointerSet: Set<PointerSet>
    private pointerFlowEdges: Map<PointerSet, PointerSet[]>

    constructor() {
        this.pointerFlowEdges = new Map()
        this.pointerSet = new Set()
    }

    /**
     * 指针的传播过程
     */
    public proPagate(identifier: Value, pointer: Pointer): PointerPair[] {
        const newWorkList: PointerPair[] = []
        const initialPointerSetOfIdentifier = this.getPointerSetElement(identifier)
        // merge pointer into identifier pointerSet
        this.addPointerSetElement(initialPointerSetOfIdentifier, pointer)

        const pointerFlowEdges = this.getPointerFlowEdges(initialPointerSetOfIdentifier)
        for (let pointerFlowEdge of pointerFlowEdges) {
            newWorkList.push(new PointerPair(pointerFlowEdge.getIdentifier(), pointer))
        }
        return newWorkList
    }

    public getPointerSet(): Set<PointerSet> {
        return this.pointerSet;
    }

    public getPointerSetElement(identifier: Value): PointerSet {
        const pointerSet = this.getPointerSet()
        for (let set of pointerSet) {
            if (set.getIdentifier() === identifier) {
                return set
            }
        }
        return new PointerSet(identifier)
    }

    public addPointerSetElement(pointerSet: PointerSet, pointer: Pointer) {
        pointerSet.addPointer(pointer)
    }

    public getPointerFlowEdges(sourcePointer: PointerSet): PointerSet[] {
        return this.pointerFlowEdges.get(sourcePointer) || [];
    }

    public addPointerSetFlowEdge(sourcePointer: PointerSet, targetPointer: PointerSet): PointerPair[] {
        let newWorkList: PointerPair[] = []
        if (!this.hasPointerSetFlowEdge(sourcePointer, targetPointer)) {
            const targets = this.pointerFlowEdges.get(sourcePointer) || [];
            targets.push(targetPointer);
            this.pointerFlowEdges.set(sourcePointer, targets);
            this.pointerSet.add(sourcePointer);
            this.pointerSet.add(targetPointer);

            let pointers = sourcePointer.getAllPointers()
            for (let point of pointers) {
                newWorkList.push(new PointerPair(
                    targetPointer.getIdentifier(), point
                ))
            }
        }
        return newWorkList
    }

    public hasPointerSetFlowEdge(sourcePointer: PointerSet, targetPointer: PointerSet): boolean {
        if (this.pointerFlowEdges.has(sourcePointer)) {
            // If it does, check if the targetPointer is in the array of targets
            const targets = this.pointerFlowEdges.get(sourcePointer);
            return targets ? targets.includes(targetPointer) : false;
        }
        return false;
    }
}