/*
 * Copyright (c) 2026 Huawei Device Co., Ltd.
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

function createLiteralInMethod(): void {
    let leftSourceValue = 1;
    let rightSourceValue = 2;
    let literalObject = { leftValue: leftSourceValue, rightValue: rightSourceValue };
}

class SourceFieldHolder {
    sourceValue: number = 0;
}

function createLiteralFromOtherClassField(sourceFieldHolder: SourceFieldHolder) {
    let targetObject = {
        targetValue: sourceFieldHolder.sourceValue,
    };
}

class ClassFieldLiteralHolder {
    sourceValue: number = 0;
    literalObject = {
        targetValue: this.sourceValue,
    };
}