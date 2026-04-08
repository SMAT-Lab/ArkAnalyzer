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

import { InferenceBuilder } from '../../core/inference/InferenceBuilder';
import { ClassInference, FileInference, ImportInfoInference, MethodInference, StmtInference } from '../../core/inference/ModelInference';
import { InferLanguage } from '../../core/inference/ValueInference';
import { getCxxValueInferences } from './CxxValueInference';
import {
    CxxClassInference,
    CxxFileInference,
    CxxImportInference,
    CxxMethodInference,
    CxxStmtInference,
} from './CxxModelInference';

export class CxxInferenceBuilder extends InferenceBuilder {

    public buildFileInference(): FileInference {
        return new CxxFileInference(this.buildImportInfoInference(), this.buildClassInference());
    }

    public buildImportInfoInference(): ImportInfoInference {
        return new CxxImportInference();
    }

    public buildClassInference(): ClassInference {
        return new CxxClassInference(this.buildMethodInference());
    }

    public buildMethodInference(): MethodInference {
        return new CxxMethodInference(this.buildStmtInference());
    }

    public buildStmtInference(): StmtInference {
        const valueInferences = this.getValueInferences(InferLanguage.COMMON);
        getCxxValueInferences().forEach(e => valueInferences.push(e));
        return new CxxStmtInference(valueInferences);
    }
}
