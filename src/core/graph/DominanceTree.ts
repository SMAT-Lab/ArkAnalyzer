import { DominanceFinder } from "./DominanceFinder";
import { BasicBlock } from "./BasicBlock";

export class DominanceTree {
    private blocks: BasicBlock[] = [];
    private blockToIdx = new Map<BasicBlock, number>();
    private children: number[][] = [];
    private parents: number[] = [];


    constructor(dominanceFinder: DominanceFinder) {
        this.blocks = dominanceFinder.getBlocks();
        this.blockToIdx = dominanceFinder.getBlockToIdx();
        let idoms = dominanceFinder.getImmediateDominators();

        // build the tree
        let treeSize = this.blocks.length;
        this.children = new Array(treeSize);
        this.parents = new Array(treeSize);
        for (let i = 0; i < treeSize; i++) {
            this.children[i] = new Array();
            this.parents[i] = -1;
        }
        for (let i = 0; i < treeSize; i++) {
            if (idoms[i] != i) {
                this.parents[i] = idoms[i];
                this.children[idoms[i]].push(i);
            }
        }
    }
    
    public getAllNodesDFS(): BasicBlock[] {
        let dfsBlocks = new Array<BasicBlock>();
        let queue = new Array<BasicBlock>();
        queue.push(this.getRoot());
        while (queue.length != 0) {
            let curr = queue.splice(0, 1)[0];
            dfsBlocks.push(curr);
            let childList = this.getChildren(curr);
            if (childList.length != 0) {
                for (let i = this.children.length - 1; i >= 0; i--) {
                    queue.splice(0, 0, childList[i]);
                }
            }
        }
        return dfsBlocks;
    }

    public getChildren(blcok: BasicBlock): BasicBlock[] {
        let childList = new Array<BasicBlock>();
        let idx = this.blockToIdx.get(blcok);
        for (const i of this.children[idx!]) {
            childList.push(this.blocks[i]);
        }
        return childList;
    }

    public getRoot(): BasicBlock {
        return this.blocks[0];
    }

}