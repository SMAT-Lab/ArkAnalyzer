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

import { ArkAssignStmt, Stmt } from '../../core/base/Stmt';
import { UnknownType } from '../../core/base/Type';
import { CallGraphNode, CallGraphNodeKind } from '../model/CallGraph';
import { PointerAnalysis } from '../pointerAnalysis/PointerAnalysis';
import Logger, { LOG_MODULE_TYPE } from '../../utils/logger';
import { Local } from '../../core/base/Local';
import { ArkThisRef } from '../../core/base/Ref';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'PTA');
const LABEL_WIDTH = 55;

abstract class StatTraits {
    TotalTime: number = 0;
    startTime: number = 0;
    endTime: number = 0;

    public getStat(): string {
        return '';
    }

    public printStat(): void {
        logger.trace(this.getStat());
    }
}

export class PTAStat extends StatTraits {
    pta: PointerAnalysis;
    numProcessedAddr: number = 0;
    numProcessedCopy: number = 0;
    numProcessedLoad: number = 0;
    numProcessedWrite: number = 0;
    numProcessedThis: number = 0;
    numRealWrite: number = 0;
    numRealLoad: number = 0;

    numUnhandledFun: number = 0;
    numTotalValuesInHandedFun: number = 0;
    numTotalHandledValue: number = 0;

    // Original type is UnknownType but inferred by PTA
    numInferedUnknownValue: number = 0;
    // Original type is not UnknownType and inferred with different type by PTA
    numInferedDiffTypeValue: number = 0;
    // Total number of values in the functions visited by PTA
    totalValuesInVisitedFunc: number = 0;
    // Original type is UnkonwnType and not inferred by PTA as well
    numNotInferedUnknownValue: number = 0;
    numUnhandledFunc: number = 0;

    iterTimes: number = 0;

    startMemUsage: any;
    endMemUsage: any;
    rssUsed: number = 0;
    heapUsed: number = 0;

    constructor(pta: PointerAnalysis) {
        super();
        this.pta = pta;
    }

    public startStat(): void {
        this.startTime = this.getNow();
        this.startMemUsage = process.memoryUsage();
    }

    public endStat(): void {
        this.endTime = this.getNow();
        this.endMemUsage = process.memoryUsage();
        this.TotalTime = (this.endTime - this.startTime) / 1000;
        this.rssUsed = Number(this.endMemUsage.rss - this.startMemUsage.rss) / Number(1024 * 1024);
        this.heapUsed = Number(this.endMemUsage.heapTotal - this.startMemUsage.heapTotal) / Number(1024 * 1024);
        this.getInferedStat();
        this.getUnhandledFuncStat();
    }

    public getNow(): number {
        return new Date().getTime();
    }

    private getInferedStat(): void {
        let dm = this.pta.getTypeDiffMap();
        
        for (let [v] of dm) {
            if (v instanceof Local) {
                if (v.getName() === 'this') {
                    continue;
                }

                let s = v.getDeclaringStmt();
                if (s instanceof ArkAssignStmt && 
                    s.getLeftOp() instanceof Local && 
                    (s.getLeftOp() as Local).getName() === 'this' && 
                    s.getRightOp() instanceof ArkThisRef) {
                    continue;
                }

                if (v.getType() instanceof UnknownType) {
                    this.numInferedUnknownValue++;
                } else {
                    this.numInferedDiffTypeValue++;
                }
            } else {
                if (v.getType() instanceof UnknownType) {
                    this.numInferedUnknownValue++;
                } else {
                    this.numInferedDiffTypeValue++;
                }
            }
        }

        this.getNotInferredUnknownStat();
    }

    private getNotInferredUnknownStat(): void {
        let inferred = new Set(this.pta.getTypeDiffMap().keys());
        let visited = new Set();
        
        let stmtStat = (s: Stmt): void => {
            if (!(s instanceof ArkAssignStmt)) {
                return;
            }

            let lop = s.getLeftOp();
            if (visited.has(lop)) {
                return;
            }
            visited.add(lop);

            if (!inferred.has(lop) && lop.getType() instanceof UnknownType) {
                this.numNotInferedUnknownValue++;
            }
            this.totalValuesInVisitedFunc++;
        };

        let cg = this.pta.getCallGraph();
        this.pta.getHandledFuncs().forEach(funcID => {
            let f = cg.getArkMethodByFuncID(funcID);
            f?.getCfg()?.getStmts().forEach(s => stmtStat(s));
        });
    }

    private getUnhandledFuncStat(): void {
        let cg = this.pta.getCallGraph();
        this.pta.getUnhandledFuncs().forEach(funcID => {
            let cgNode = cg.getNode(funcID);
            if ((cgNode as CallGraphNode).isSdkMethod()) {
                return;
            }

            let f = cg.getArkMethodByFuncID(funcID);
            if (f) {
                this.numUnhandledFun++;
            }
        });
    }

    public getStat(): string {
        const title = ' Pointer Analysis Statistics ';
        const padding = '='.repeat((LABEL_WIDTH - title.length) / 2);

        return `${padding}${title}${padding}
${'Processed address'.padEnd(LABEL_WIDTH)}${this.numProcessedAddr}
${'Processed copy'.padEnd(LABEL_WIDTH)}${this.numProcessedCopy}
${'Processed load'.padEnd(LABEL_WIDTH)}${this.numProcessedLoad}
${'Processed write'.padEnd(LABEL_WIDTH)}${this.numProcessedWrite}
${'Real write'.padEnd(LABEL_WIDTH)}${this.numRealWrite}
${'Real load'.padEnd(LABEL_WIDTH)}${this.numRealLoad}
${'Processed This'.padEnd(LABEL_WIDTH)}${this.numProcessedThis}
${'Unhandled function'.padEnd(LABEL_WIDTH)}${this.numUnhandledFun}
${'Total values in visited function'.padEnd(LABEL_WIDTH)}${this.totalValuesInVisitedFunc}
${'Infered Value unknown+different type'.padEnd(LABEL_WIDTH)}${this.numInferedUnknownValue}+${this.numInferedDiffTypeValue}
${'Total Time'.padEnd(LABEL_WIDTH)}${this.TotalTime} S
${'Total iterator Times'.padEnd(LABEL_WIDTH)}${this.iterTimes}
${'RSS used'.padEnd(LABEL_WIDTH)}${this.rssUsed.toFixed(3)} Mb
${'Heap used'.padEnd(LABEL_WIDTH)}${this.heapUsed.toFixed(3)} Mb`;
    }

    public printStat(): void {
        logger.trace(this.getStat());
    }
}

export class PAGStat extends StatTraits {
    numDynamicCall: number = 0;
    numTotalFunction: number = 0;
    numTotalNode: number = 0;

    public getStat(): string {
        const title = ' PAG Statistics ';
        const padding = '='.repeat((LABEL_WIDTH - title.length) / 2);

        return `${padding}${title}${padding}
${`PAG Dynamic call`.padEnd(LABEL_WIDTH)}${this.numDynamicCall}
${`Total function handled`.padEnd(LABEL_WIDTH)}${this.numTotalFunction}
${`Total PAG Nodes`.padEnd(LABEL_WIDTH)}${this.numTotalNode}`;
    }

    public printStat(): void {
        logger.trace(this.getStat());
    }
}

export class CGStat extends StatTraits {
    //real, vitual, intrinsic, constructor
    numTotalNode: number = 0;
    numReal: number = 0;
    numVirtual: number = 0;
    numIntrinsic: number = 0;
    numConstructor: number = 0;
    numBlank: number = 0;

    public startStat(): void {
        this.startTime = new Date().getTime();
    }

    public endStat(): void {
        this.endTime = new Date().getTime();
        this.TotalTime = (this.endTime - this.startTime) / 1000;
    }

    public addNodeStat(kind: CallGraphNodeKind): void {
        switch (kind) {
            case CallGraphNodeKind.real:
                this.numReal++;
                break;
            case CallGraphNodeKind.vitual:
                this.numVirtual++;
                break;
            case CallGraphNodeKind.constructor:
                this.numConstructor++;
                break;
            case CallGraphNodeKind.intrinsic:
                this.numIntrinsic++;
                break;
            default:
                this.numBlank++;
        }
        this.numTotalNode++;
    }

    public getStat(): string {
        const title = ' CG Statistics ';
        const padding = '='.repeat((LABEL_WIDTH - title.length) / 2);

        return `${padding}${title}${padding}
${'CG construction Total Time'.padEnd(LABEL_WIDTH)}${this.TotalTime} S
${'Real function'.padEnd(LABEL_WIDTH)}${this.numReal}
${'Intrinsic function'.padEnd(LABEL_WIDTH)}${this.numIntrinsic}
${'Constructor function'.padEnd(LABEL_WIDTH)}${this.numConstructor}
${'Virtual function'.padEnd(LABEL_WIDTH)}${this.numVirtual}
${'Blank function'.padEnd(LABEL_WIDTH)}${this.numBlank}
${'Total'.padEnd(LABEL_WIDTH)}${this.numTotalNode}`;
    }
}
