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


import { ArkBaseModel } from '../model/ArkBaseModel';
import { ArkFile, Language } from '../model/ArkFile';
import { Stmt } from '../base/Stmt';
import { Value } from '../base/Value';
import { ArkTs2InferenceBuilder, ArkTsInferenceBuilder, JsInferenceBuilder } from './arkts/ArkTsInference';

import { AbcInferenceBuilder } from './abc/AbcInference';
import { InferLanguage } from './ValueInference';


export type ArkModel = ArkBaseModel | ArkFile | Stmt;
type ArkIR = ArkModel | Value;


/**
 * Interface defining the core inference operation
 */
export interface Inference {
    /**
     * Performs inference on a given model
     * @param model - The ArkIR model to perform inference on
     * @returns Inference result
     */
    doInfer(model: ArkIR): any;
}

/**
 * Interface defining a complete inference workflow with pre/post processing steps
 */
export interface InferenceFlow {
    /**
     * Preparation steps before performing inference
     * @param model - The ArkIR model to prepare for inference
     * @returns Preparation result
     */
    preInfer(model: ArkIR): any;

    /**
     * Main inference operation
     * @param model - The ArkIR model to perform inference on
     * @returns Inference result
     */
    infer(model: ArkIR): any;

    /**
     * Cleanup and processing after inference completes
     * @param model - The ArkIR model that was processed
     * @returns Post-processing result
     */
    postInfer(model: ArkIR): any;
}


export class InferenceManager {
    private static instance: InferenceManager;
    private inferenceMap: Map<InferLanguage, Inference>;

    private constructor() {
        this.inferenceMap = new Map<InferLanguage, Inference>();
    }

    public static getInstance(): InferenceManager {
        if (!InferenceManager.instance) {
            InferenceManager.instance = new InferenceManager();
        }
        return InferenceManager.instance;
    }

    public getInference(lang: Language): Inference {
        const inferLanguage = this.changeToInferLanguage(lang);
        let inference = this.inferenceMap.get(inferLanguage);
        if (!inference) {
            if (inferLanguage === InferLanguage.ARK_TS1_1) {
                inference = new ArkTsInferenceBuilder().buildFileInference();
            } else if (inferLanguage === InferLanguage.ABC) {
                inference = new AbcInferenceBuilder().buildFileInference();
            } else if (inferLanguage === InferLanguage.JAVA_SCRIPT) {
                inference = new JsInferenceBuilder().buildFileInference();
            } else if (inferLanguage === InferLanguage.ARK_TS1_2) {
                inference = new ArkTs2InferenceBuilder().buildFileInference();
            } else {
                throw new Error('Inference not supported');
            }
            this.inferenceMap.set(inferLanguage, inference);
        }
        return inference;
    }

    private changeToInferLanguage(lang: Language): InferLanguage {
        if (lang === Language.ARKTS1_1 || lang === Language.TYPESCRIPT) {
            return InferLanguage.ARK_TS1_1;
        } else if (lang === Language.ABC) {
            return InferLanguage.ABC;
        } else if (lang === Language.JAVASCRIPT) {
            return InferLanguage.JAVA_SCRIPT;
        } else if (lang === Language.ARKTS1_2) {
            return InferLanguage.ARK_TS1_2;
        }
        return InferLanguage.UNKNOWN;
    }
}