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

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'PTA');

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
        let stmtStat = (s: Stmt): void => {
            if (!(s instanceof ArkAssignStmt)) {
                return;
            }

            let lop = s.getLeftOp();
            if (visited.has(lop)) {
                return;
            }
            visited.add(lop);

            if (inferred.includes(lop)) {
                if (lop.getType() instanceof UnknownType) {
                    this.numInferedUnknownValue++;
                } else {
                    this.numInferedDiffTypeValue++;
                }
            } else {
                if (lop.getType() instanceof UnknownType) {
                    this.numNotInferedUnknownValue++;
                }
            }
            this.totalValuesInVisitedFunc++;
        };

        let inferred = Array.from(this.pta.getTypeDiffMap().keys());
        let visited = new Set();

        let cg = this.pta.getCallGraph();
        this.pta.getHandledFuncs().forEach(funcID => {
            let f = cg.getArkMethodByFuncID(funcID);
            f
                ?.getCfg()
                ?.getStmts()
                .forEach(s => stmtStat(s));
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
        // TODO: get PAG stat and CG stat
        let output: string;
        output = '==== Pointer analysis Statictics: ====\n';
        output = output + `Processed address\t${this.numProcessedAddr}\n`;
        output = output + `Processed copy\t\t${this.numProcessedCopy}\n`;
        output = output + `Processed load\t\t${this.numProcessedLoad}\n`;
        output = output + `Processed write\t\t${this.numProcessedWrite}\n`;
        output = output + `Real write\t\t${this.numRealWrite}\n`;
        output = output + `Real load\t\t${this.numRealLoad}\n`;
        output = output + `Processed This\t\t${this.numProcessedThis}\n\n`;
        output = output + `Unhandled function\t${this.numUnhandledFun}\n`;
        output = output + `Total values in visited function\t${this.totalValuesInVisitedFunc}\n`;
        output = output + `Infered Value unknown+different type\t${this.numInferedUnknownValue}+${this.numInferedDiffTypeValue}\n\n`;
        output = output + `Total Time\t\t${this.TotalTime} S\n`;
        output = output + `Total iterator Times\t${this.iterTimes}\n`;
        output = output + `RSS used\t\t${this.rssUsed.toFixed(3)} Mb\n`;
        output = output + `Heap used\t\t${this.heapUsed.toFixed(3)} Mb\n`;
        return output;
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
        let output: string;
        output = '==== PAG Statictics: ====\n';
        output = output + `Dynamic call\t\t${this.numDynamicCall}\n`;
        output = output + `Total function handled\t${this.numTotalFunction}\n`;
        output = output + `Total PAG Nodes\t\t${this.numTotalNode}\n`;
        return output;
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
        let output: string;
        output = '==== CG Statictics: ====\n';
        output = output + `CG construction Total Time\t\t${this.TotalTime} S\n`;
        output = output + `Real function\t\t${this.numReal}\n`;
        output = output + `Intrinsic function\t${this.numIntrinsic}\n`;
        output = output + `Constructor function\t${this.numConstructor}\n`;
        output = output + `Virtual function\t\t${this.numVirtual}\n`;
        output = output + `Blank function\t\t${this.numBlank}\n`;
        output = output + `Total\t\t\t${this.numTotalNode}\n`;
        return output;
    }
}
