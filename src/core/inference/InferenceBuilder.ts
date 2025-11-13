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


import { ClassInference, FileInference, ImportInfoInference, MethodInference, StmtInference } from './ModelInference';
import Logger, { LOG_MODULE_TYPE } from '../../utils/logger';
import { ValueInference } from './ValueInference';
import { Value } from '../base/Value';

const valueCtors: Map<Function, InferLanguage> = new Map<Function, InferLanguage>();
const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'InferenceBuilder');

export enum InferLanguage {
    UNKNOWN = -1,
    COMMON = 0,
    ARK_TS1_1 = 1,
    ARK_TS1_2 = 2,
    JAVA_SCRIPT = 3,
    CXX = 21,
    ABC = 51
}

export function Bind(lang: InferLanguage = InferLanguage.COMMON): Function {
    return (constructor: new () => ValueInference<Value>) => {
        valueCtors.set(constructor, lang);
        logger.info('the ValueInference %s registered.', constructor.name);
        return constructor;
    };
}

import('./ValueInference');

export abstract class InferenceBuilder {

    public buildFileInference(): FileInference {
        return new FileInference(this.buildImportInfoInference(), this.buildClassInference());
    }

    public abstract buildImportInfoInference(): ImportInfoInference;

    public buildClassInference(): ClassInference {
        return new ClassInference(this.buildMethodInference());
    }

    public buildMethodInference(): MethodInference {
        return new MethodInference(this.buildStmtInference());
    }

    public abstract buildStmtInference(): StmtInference;

    public getValueInferences(lang: InferLanguage): ValueInference<Value>[] {
        return Array.from(valueCtors.entries()).filter(entry => entry[1] === lang)
            .map(entry => {
                const valueCtor = entry[0] as any;
                return new valueCtor();
            });
    }
}
