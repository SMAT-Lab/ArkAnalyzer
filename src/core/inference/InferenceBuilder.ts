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
import { InferLanguage, valueCtors, ValueInference } from './ValueInference';
import { Value } from '../base/Value';

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
