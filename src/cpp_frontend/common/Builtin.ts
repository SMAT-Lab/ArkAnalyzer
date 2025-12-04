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

import { ClassSignature, FileSignature } from '../../core/model/ArkSignature';
import { ClassType, GenericType } from '../../core/base/Type';

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
    public static UNORDERED_SET = 'unordered_set';
    public static PRIORITY_QUEUE = 'priority_queue';
    public static FORWARD_LIST = 'forward_list';
    public static MULTISET = 'multiset';
    public static MULTIMAP = 'multimap';
    public static UNORDERED_MULTIMAP = 'unordered_multimap';
    public static UNORDERED_MULTISET = 'unordered_multiset';
    public static OBJECT = 'Object';
    public static REGEXP = 'RegExp';
    public static CXXSTD = 'std';
    public static CXXSTDREF = 'std::';
    public static TYPENAME_KEYWORD = 'typename ';

    public static BUILT_IN_CLASSES = this.buildBuiltInClasses();

    public static DUMMY_PROJECT_NAME = 'CXX/std';
    public static DUMMY_FILE_NAME = 'BuiltinClass';

    public static BUILT_IN_CLASSES_FILE_SIGNATURE = BuiltinCxx.buildBuiltInClassesFileSignature();
    public static OBJECT_CLASS_SIGNATURE = this.buildBuiltInClassSignature(this.OBJECT);
    public static OBJECT_CLASS_TYPE = new ClassType(this.OBJECT_CLASS_SIGNATURE);
    public static ARRAY_CLASS_SIGNATURE = this.buildBuiltInClassSignature(this.ARRAY);
    public static SET_CLASS_SIGNATURE = this.buildBuiltInClassSignature(this.SET);
    public static MAP_CLASS_SIGNATURE = this.buildBuiltInClassSignature(this.MAP);
    public static REGEXP_CLASS_SIGNATURE = this.buildBuiltInClassSignature(this.REGEXP);
    public static REGEXP_CLASS_TYPE = new ClassType(this.REGEXP_CLASS_SIGNATURE);
    public static BUILT_IN_CLASS_SIGNATURE_MAP = this.buildBuiltInClassSignatureMap();

    // signature for built-in class


    public static ITERATOR_FUNCTION = 'iterator';
    public static ITERATOR = 'IterableIterator';
    public static ITERATOR_NEXT = 'iterator++';
    public static ITERATOR_RESULT = 'operator*';
    public static ITERATOR_RESULT_BEGIN = 'begin';
    public static ITERATOR_RESULT_END = 'end';
    public static ITERATOR_VALUE = '*';

    public static ITERATOR_CLASS_SIGNATURE = this.buildBuiltInClassSignature(this.ITERATOR);
    public static ITERATOR_RESULT_CLASS_SIGNATURE = this.buildBuiltInClassSignature(this.ITERATOR_RESULT);
    public static ITERATOR_CLASS_TYPE = new ClassType(this.ITERATOR_CLASS_SIGNATURE, [new GenericType('T')]);
    public static ITERATOR_RESULT_CLASS_TYPE = new ClassType(this.ITERATOR_RESULT_CLASS_SIGNATURE, [new GenericType('T')]);
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

    private static buildBuiltInClassesFileSignature(): FileSignature {
        return new FileSignature(this.DUMMY_PROJECT_NAME, this.DUMMY_FILE_NAME);
    }

    public static buildBuiltInClassSignature(className: string): ClassSignature {
        return new ClassSignature(className, this.BUILT_IN_CLASSES_FILE_SIGNATURE);
    }
    public static isBuiltinClass(classSignature: ClassSignature): boolean {
        const className = classSignature.getClassName();
        const projectName = classSignature.getDeclaringFileSignature().getProjectName();
        return this.BUILT_IN_CLASSES.has(className) && projectName === this.DUMMY_PROJECT_NAME;
    }

    private static buildBuiltInClassSignatureMap(): Map<string, ClassSignature> {
        const builtInClassSignatureMap = new Map<string, ClassSignature>();
        builtInClassSignatureMap.set(this.OBJECT, this.OBJECT_CLASS_SIGNATURE);
        builtInClassSignatureMap.set(this.ARRAY, this.ARRAY_CLASS_SIGNATURE);
        builtInClassSignatureMap.set(this.SET, this.SET_CLASS_SIGNATURE);
        builtInClassSignatureMap.set(this.MAP, this.MAP_CLASS_SIGNATURE);
        builtInClassSignatureMap.set(this.REGEXP, this.REGEXP_CLASS_SIGNATURE);
        return builtInClassSignatureMap;
    }
}
