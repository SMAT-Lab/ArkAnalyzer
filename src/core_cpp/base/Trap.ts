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

import { BasicBlock } from '../graph/BasicBlock';

export class Trap {
    private readonly tryBlocks: BasicBlock[];
    private readonly catchBlocks: BasicBlock[];

    constructor(tryBlocks: BasicBlock[], catchBlocks: BasicBlock[]) {
        this.tryBlocks = tryBlocks;
        this.catchBlocks = catchBlocks;
    }

    public getTryBlocks(): BasicBlock[] {
        return this.tryBlocks;
    }

    public getCatchBlocks(): BasicBlock[] {
        return this.catchBlocks;
    }
}
