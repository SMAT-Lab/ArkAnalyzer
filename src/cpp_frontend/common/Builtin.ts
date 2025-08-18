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

import { ClassSignature } from '../../core/model/ArkSignature';

export class BuiltinCxx {
    // built-in classes
    public static ARRAY = 'array';
    public static SET = 'set';
    public static MAP = 'map';
    public static UNORDERED_MAP = 'unordered_map';
    public static QUEUE = 'queue';
    public static DEQUE = 'deque';
    public static STACK = 'stack';
    public static LIST = 'list';
    public static VECTOR = 'vector';

    public static BUILT_IN_CLASSES = this.buildBuiltInClasses();

    // signature for built-in class
    public static DUMMY_PROJECT_NAME = 'std';

    private static buildBuiltInClasses(): Set<string> {
        const builtInClasses = new Set<string>();
        builtInClasses.add(this.ARRAY);
        builtInClasses.add(this.SET);
        builtInClasses.add(this.MAP);
        builtInClasses.add(this.UNORDERED_MAP);
        builtInClasses.add(this.QUEUE);
        builtInClasses.add(this.DEQUE);
        builtInClasses.add(this.STACK);
        builtInClasses.add(this.LIST);
        builtInClasses.add(this.VECTOR);
        return builtInClasses;
    }

    public static isBuiltinClass(classSignature: ClassSignature): boolean {
        const className = classSignature.getClassName();
        const projectName = classSignature.getDeclaringFileSignature().getProjectName();
        return this.BUILT_IN_CLASSES.has(className) && projectName === this.DUMMY_PROJECT_NAME;
    }
}
