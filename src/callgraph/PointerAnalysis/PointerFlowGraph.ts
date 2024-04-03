import { Value } from "../../core/base/Value";
import { Pointer, PointerTargetPair, PointerTarget } from "./Pointer";
import Logger, { LOG_LEVEL } from "../../utils/logger";

const logger = Logger.getLogger();

export class PointerFlowGraph {
    private pointerSet: Set<Pointer>
    private pointerFlowEdges: Map<Pointer, Pointer[]>

    constructor() {
        this.pointerFlowEdges = new Map()
        this.pointerSet = new Set()
    }

    /**
     * 指针的传播过程
     */
    public proPagate(identifier: Value, pointerTarget: PointerTarget): PointerTargetPair[] {
        const newWorkList: PointerTargetPair[] = []
        const initialPointerSetOfIdentifier = this.getPointerSetElement(identifier)
        // merge pointer into identifier pointerSet
        this.addPointerSetElement(initialPointerSetOfIdentifier, pointerTarget)

        const pointerFlowEdgesTargets = this.getPointerFlowEdges(initialPointerSetOfIdentifier)
        for (let pointerFlowEdge of pointerFlowEdgesTargets) {
            newWorkList.push(new PointerTargetPair(pointerFlowEdge, pointerTarget))
        }
        return newWorkList
    }

    public getPointerSet(): Set<Pointer> {
        return this.pointerSet;
    }

    public getPointerSetElement(identifier: Value): Pointer {
        const pointerSet = this.getPointerSet()
        for (let set of pointerSet) {
            if (set.getIdentifier() === identifier) {
                return set
            }
        }
        let newPointer = new Pointer(identifier)
        this.pointerSet.add(newPointer)
        return newPointer
    }

    public addPointerSetElement(pointerSet: Pointer, pointer: PointerTarget) {
        pointerSet.addPointerTarget(pointer)
    }

    public getPointerFlowEdges(sourcePointer: Pointer): Pointer[] {
        return this.pointerFlowEdges.get(sourcePointer) || [];
    }

    public addPointerFlowEdge(sourcePointer: Pointer, targetPointer: Pointer): PointerTargetPair[] {
        let newWorkList: PointerTargetPair[] = []
        if (!this.hasPointerFlowEdge(sourcePointer, targetPointer)) {
            const targets = this.pointerFlowEdges.get(sourcePointer) || [];
            targets.push(targetPointer);
            this.pointerFlowEdges.set(sourcePointer, targets);
            // this.pointerSet.add(sourcePointer);
            // this.pointerSet.add(targetPointer);

            let pointers = sourcePointer.getAllPointerTargets()
            for (let point of pointers) {
                newWorkList.push(new PointerTargetPair(
                    targetPointer, point
                ))
            }
        }
        return newWorkList
    }

    public hasPointerFlowEdge(sourcePointer: Pointer, targetPointer: Pointer): boolean {
        if (this.pointerFlowEdges.has(sourcePointer)) {
            // If it does, check if the targetPointer is in the array of targets
            const targets = this.pointerFlowEdges.get(sourcePointer);
            return targets ? targets.includes(targetPointer) : false;
        }
        return false;
    }

    public printPointerFlowGraph() {
        logger.info("PointerFlowGraph Elements: ")
        for (let element of this.getPointerSet()) {
            logger.info("\t"+element.toString())
        }
        logger.info("PointerFlowGraph Edges: ") 
        for (let element of this.pointerFlowEdges.keys()) {
            logger.info("\t"+element.toString())
            for (let values of this.getPointerFlowEdges(element)) {
                logger.info("\t\t"+values.toString())
            }
        }

    }
}