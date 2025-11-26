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

import { ArkFile } from '../..';
import { Printer } from '../Printer';
import { serializeArkFile } from './JsonSerialization';

export class JsonPrinter extends Printer {
    constructor(private arkFile: ArkFile) {
        super();
    }

    public dump(): string {
        const dto = serializeArkFile(this.arkFile);
        return JSON.stringify(dto, null, 2);
    }
}
