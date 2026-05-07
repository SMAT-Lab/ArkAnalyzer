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
    private blocks: BasicBlock[];
    private blockToIdx: Map<BasicBlock, number>;
    private idoms: number[];
    private domFrontiers: number[][];

    constructor(cfg: Cfg) {
        this.blocks = Array.from(cfg.getBlocks());
        this.blockToIdx = this.buildBlockIndex();
        this.idoms = this.computeImmediateDominators(cfg.getStartingBlock());
        this.domFrontiers = this.computeDominanceFrontiers();
    }

    private buildBlockIndex(): Map<BasicBlock, number> {
        const blockToIdx = new Map<BasicBlock, number>();
        for (let i = 0; i < this.blocks.length; i++) {
            blockToIdx.set(this.blocks[i], i);
        }
        return blockToIdx;
    }

    private computeImmediateDominators(startingBlock: BasicBlock | undefined): number[] {
        const idoms = new Array<number>(this.blocks.length).fill(-1);
        if (idoms.length === 0) {
            return idoms;
        }
        idoms[0] = 0;

        let isChanged = true;
        while (isChanged) {
            isChanged = false;
            for (const block of this.blocks) {
                if (block === startingBlock) {
                    continue;
                }
                const blockIdx = this.blockToIdx.get(block) as number;
                const preds = Array.from(block.getPredecessors());
                let newIdom = this.getFirstDefinedBlockPredIdx(preds, idoms);
                if (preds.length <= 0 || newIdom === -1) {
                    continue;
                }

                for (const pred of preds) {
                    const predIdx = this.blockToIdx.get(pred) as number;
                    if (idoms[predIdx] !== -1) {
                        newIdom = this.intersect(newIdom, predIdx, idoms);
                    }
                }
                if (idoms[blockIdx] !== newIdom) {
                    idoms[blockIdx] = newIdom;
                    isChanged = true;
                }
            }
        }
        return idoms;
    }

    private computeDominanceFrontiers(): number[][] {
        const domFrontiers = new Array<number[]>(this.blocks.length);
        for (let i = 0; i < domFrontiers.length; i++) {
            domFrontiers[i] = [];
        }

        for (const block of this.blocks) {
            const preds = Array.from(block.getPredecessors());
            if (preds.length <= 1) {
                continue;
            }
            const blockIdx = this.blockToIdx.get(block) as number;
            for (const pred of preds) {
                let predIdx = this.blockToIdx.get(pred) as number;
                while (predIdx !== this.idoms[blockIdx]) {
                    domFrontiers[predIdx].push(blockIdx);
                    predIdx = this.idoms[predIdx];
                }
            }
        }
        return domFrontiers;
    }

    public getDominanceFrontiers(block: BasicBlock): Set<BasicBlock> {
        if (!this.blockToIdx.has(block)) {
            throw new Error('The given block: ' + block + ' is not in Cfg!');
        }
        const idx = this.blockToIdx.get(block) as number;
        const dfs = new Set<BasicBlock>();
        for (const dfIdx of this.domFrontiers[idx]) {
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

    private getFirstDefinedBlockPredIdx(preds: BasicBlock[], idoms: number[]): number {
        for (const block of preds) {
            const idx = this.blockToIdx.get(block) as number;
            if (idoms[idx] !== -1) {
                return idx;
            }
        }
        return -1;
    }

    private intersect(a: number, b: number, idoms: number[]): number {
        while (a !== b) {
            if (a > b) {
                a = idoms[a];
            } else {
                b = idoms[b];
            }
        }
        return a;
    }
}
