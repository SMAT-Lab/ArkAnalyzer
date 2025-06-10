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

/**
 * @category core/base
 */
export class Decorator {
    kind: string;
    content: string = '';
    param: string = '';
    constructor(name: string) {
        this.kind = name;
    }
    public getKind(): string {
        return this.kind;
    }
    public setContent(content: string): void {
        this.content = content;
    }
    public getContent(): string {
        return this.content;
    }
    public setParam(param: string): void {
        this.param = param;
    }
    public getParam(): string {
        return this.param;
    }
    public toString(): string {
        return `@${this.content}`;
    }
}
