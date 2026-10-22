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

import type { Stmt } from './Stmt';
import { Type } from './Type';

/**
 * The one shared read-only empty array documented at {@link Value.getUses}. Every implementation
 * hands back this same instance when it has nothing to report, so callers must never append to it.
 */
export const EMPTY_USES: Value[] = [];

/**
 * The one shared read-only empty array handed back when no using-statement has been recorded, e.g.
 * by `Local.getUsedStmts` and `GlobalRef.getUsedStmts`. Every value shares this instance, so
 * callers must never append to it.
 */
export const EMPTY_USED_STMTS: Stmt[] = [];

/**
 * @category core/base
 */
export interface Value {
    /**
     * Return a list of values which are contained in this {@link Value}.
     * Value is a core interface in ArkAnalyzer, which may represent any value or expression.
     * @param acc - Optional accumulator to append into instead of allocating a fresh array. Threading
     *              one accumulator through a traversal avoids the transient array per node that a
     *              recursive concat allocates.
     * @returns An **array** of values used by this value. When called without `acc` on a value that
     *          has no uses, implementations hand back one shared process-wide instance so the hot
     *          accessor stays allocation-free. Treat that array as read-only - appending to it would
     *          add the element to every other value's uses - and pass your own `acc` to append.
     */
    getUses(acc?: Value[]): Value[];

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
