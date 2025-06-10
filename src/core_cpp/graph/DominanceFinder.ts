/*
 * Copyright (c) 2024-2025 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { BasicBlock } from './BasicBlock';
import { Cfg } from './Cfg';

export class DominanceFinder {
    private blocks: BasicBlock[] = [];
    private blockToIdx = new Map<BasicBlock, number>();
    private idoms: number[] = [];
    private domFrontiers: number[][] = [];

    constructor(cfg: Cfg) {
        this.blocks = Array.from(cfg.getBlocks());
        for (let i = 0; i < this.blocks.length; i++) {
            let block = this.blocks[i];
            this.blockToIdx.set(block, i);
        }
        const startingBlock = cfg.getStartingBlock();

        // calculate immediate dominator for each block
        this.idoms = new Array<number>(this.blocks.length);
        this.idoms[0] = 0;
        for (let i = 1; i < this.idoms.length; i++) {
            this.idoms[i] = -1;
        }
        let isChanged = true;
        while (isChanged) {
            isChanged = false;
            for (const block of this.blocks) {
                if (block === startingBlock) {
                    continue;
                }
                let blockIdx = this.blockToIdx.get(block) as number;
                let preds = Array.from(block.getPredecessors());
                let newIdom = this.getFirstDefinedBlockPredIdx(preds);
                if (preds.length <= 0 || newIdom === -1) {
                    continue;
                }
                for (const pred of preds) {
                    let predIdx = this.blockToIdx.get(pred) as number;
                    this.idoms[predIdx] !== -1 ? (newIdom = this.intersect(newIdom, predIdx)) : null;
                }
                if (this.idoms[blockIdx] !== newIdom) {
                    this.idoms[blockIdx] = newIdom;
                    isChanged = true;
                }
            }
        }

        // calculate dominance frontiers for each block
        this.domFrontiers = new Array(this.blocks.length);
        for (let i = 0; i < this.domFrontiers.length; i++) {
            this.domFrontiers[i] = new Array<number>();
        }
        for (const block of this.blocks) {
            let preds = Array.from(block.getPredecessors());
            if (preds.length <= 1) {
                continue;
            }
            let blockIdx = this.blockToIdx.get(block) as number;
            for (const pred of preds) {
                let predIdx = this.blockToIdx.get(pred) as number;
                while (predIdx !== this.idoms[blockIdx]) {
                    this.domFrontiers[predIdx].push(blockIdx);
                    predIdx = this.idoms[predIdx];
                }
            }
        }
    }

    public getDominanceFrontiers(block: BasicBlock): Set<BasicBlock> {
        if (!this.blockToIdx.has(block)) {
            throw new Error('The given block: ' + block + ' is not in Cfg!');
        }
        let idx = this.blockToIdx.get(block) as number;
        let dfs = new Set<BasicBlock>();
        let dfsIdx = this.domFrontiers[idx];
        for (const dfIdx of dfsIdx) {
            dfs.add(this.blocks[dfIdx]);
        }
        return dfs;
    }

    public getBlocks(): BasicBlock[] {
        return this.blocks;
    }

    public getBlockToIdx(): Map<BasicBlock, number> {
        return this.blockToIdx;
    }

    public getImmediateDominators(): number[] {
        return this.idoms;
    }

    private getFirstDefinedBlockPredIdx(preds: BasicBlock[]): number {
        for (const block of preds) {
            let idx = this.blockToIdx.get(block) as number;
            if (this.idoms[idx] !== -1) {
                return idx;
            }
        }
        return -1;
    }

    private intersect(a: number, b: number): number {
        while (a !== b) {
            if (a > b) {
                a = this.idoms[a];
            } else {
                b = this.idoms[b];
            }
        }
        return a;
    }
}
