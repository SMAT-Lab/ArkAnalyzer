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

import { Type } from './Type';

/**
 * @category core/base
 */
export interface Value {
    /**
     * Return a list of values which are contained in this {@link Value}.
     * Value is a core interface in ArkAnalyzer, which may represent any value or expression.
     * @returns An **array** of values used by this value.
     */
    getUses(): Value[];

    /**
     * Return the type of this value. The interface is encapsulated in {@link Value}. 
     * The `Type` is defined in type.ts, such as **Any**, **Unknown**, **TypeParameter**, 
     * **UnclearReference**, **Primitive**, **Number**, **String**, etc.
     * @returns The type of this value.
     * @example
     * 1. In the declaration statement, determine the left-value type and right-value type.

    ```typescript
    let leftValue:Value;
    let rightValue:Value;
    ...
    if (leftValue.getType() instanceof UnknownType && 
        !(rightValue.getType() instanceof UnknownType) &&
        !(rightValue.getType() instanceof UndefinedType)) {
        ...
    }
    ```
     */
    getType(): Type;
}
