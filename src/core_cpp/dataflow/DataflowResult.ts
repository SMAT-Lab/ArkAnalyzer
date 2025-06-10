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

import { Stmt } from '../base/Stmt';
import { Fact } from './Fact';

export class DataflowResult {
    stmt2InFacts: Map<Stmt, Fact> = new Map<Stmt, Fact>();
    stmt2OutFacts: Map<Stmt, Fact> = new Map<Stmt, Fact>();

    //should we specifically keep global facts or just embedding them into the two maps above
    globalFacts: Set<Fact> = new Set<Fact>();
}
