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

import * as fs from 'fs';
import { createPtsCollectionCtor, IPtsCollection, PtsCollectionType } from './PtsDS';
import { NodeID } from '../../core/graph/BaseExplicitGraph';

export enum PtaAnalysisScale {
    WholeProgram = 0,
    MethodLevel = 1,
}

export enum ContextType {
    CallSite = 0,
    Obj = 1,
    Func = 2,
}

export class PointerAnalysisConfig {
    private static instance: PointerAnalysisConfig;

    public kLimit: number;
    public contextType: ContextType;
    public outputDirectory: string;
    public detectTypeDiff: boolean;
    public dotDump: boolean;
    public debug: boolean;
    public analysisScale: PtaAnalysisScale;
    public ptsCollectionType: PtsCollectionType;
    public ptsCollectionCtor: new () => IPtsCollection<NodeID>;

    /*
     * Note: DO NOT use `new PointerAnalysisConfig` to initialize ptaconfig
     *       Use PointerAnalysisConfig.create() for singleton pattern
     */
    constructor(
        kLimit: number,
        contextType: ContextType,
        outputDirectory: string,
        detectTypeDiff: boolean = false,
        dotDump: boolean = false,
        debug: boolean = false,
        analysisScale: PtaAnalysisScale = PtaAnalysisScale.WholeProgram,
        ptsCoType = PtsCollectionType.Set
    ) {
        if (kLimit > 5) {
            throw new Error('K Limit too large');
        }
        this.kLimit = kLimit;

        this.outputDirectory = outputDirectory;
        this.detectTypeDiff = detectTypeDiff;
        this.dotDump = dotDump;
        this.debug = debug;
        this.analysisScale = analysisScale;
        this.ptsCollectionType = ptsCoType;
        this.ptsCollectionCtor = createPtsCollectionCtor<NodeID>(ptsCoType);
        this.contextType = contextType;

        if (!fs.existsSync(outputDirectory)) {
            fs.mkdirSync(outputDirectory, { recursive: true });
        }
    }

    /*
     * Set static field to be null, then all related objects could be freed by GC.
     * Class PointerAnalysisConfig has been exported by ArkAnalyzer, the dispose method should be called by users themselves before free this class.
     */
    public static dispose(): void {
        // @ts-expect-error: only be used to free the memory
        this.instance = null;
    }

    /*
     * Create Singleton instance
     * The instance can be created multi-times and be overwrited
     */
    public static create(
        kLimit: number,
        outputDirectory: string,
        detectTypeDiff: boolean = false,
        dotDump: boolean = false,
        debug: boolean = false,
        analysisScale: PtaAnalysisScale = PtaAnalysisScale.WholeProgram,
        ptsCoType = PtsCollectionType.Set,
        contextType: ContextType = ContextType.Func,
    ): PointerAnalysisConfig {
        PointerAnalysisConfig.instance = new PointerAnalysisConfig(
            kLimit,
            contextType,
            outputDirectory,
            detectTypeDiff,
            dotDump,
            debug,
            analysisScale,
            ptsCoType
        );
        return PointerAnalysisConfig.instance;
    }

    /*
     * Get Singleton instance
     */
    public static getInstance(): PointerAnalysisConfig {
        if (!PointerAnalysisConfig.instance) {
            throw new Error('PTA config: instance is not existing');
        }
        return PointerAnalysisConfig.instance;
    }
}
