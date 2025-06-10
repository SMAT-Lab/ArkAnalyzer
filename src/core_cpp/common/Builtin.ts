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

import { ClassSignature, FileSignature, MethodSignature, MethodSubSignature } from '../model/ArkSignature';
import { ClassType, GenericType, StringType } from '../base/Type';

export class Builtin {
    // built-in classes
    // TODO: Automatically obtain from the standard library
    public static OBJECT = 'Object';
    public static ARRAY = 'Array';
    public static SET = 'Set';
    public static MAP = 'Map';
    public static REGEXP = 'RegExp';

    public static BUILT_IN_CLASSES = this.buildBuiltInClasses();

    // signature for built-in class
    public static DUMMY_PROJECT_NAME = 'ES2015';
    public static DUMMY_FILE_NAME = 'BuiltinClass';

    public static BUILT_IN_CLASSES_FILE_SIGNATURE = Builtin.buildBuiltInClassesFileSignature();
    public static OBJECT_CLASS_SIGNATURE = this.buildBuiltInClassSignature(this.OBJECT);
    public static OBJECT_CLASS_TYPE = new ClassType(this.OBJECT_CLASS_SIGNATURE);
    public static ARRAY_CLASS_SIGNATURE = this.buildBuiltInClassSignature(this.ARRAY);
    public static SET_CLASS_SIGNATURE = this.buildBuiltInClassSignature(this.SET);
    public static MAP_CLASS_SIGNATURE = this.buildBuiltInClassSignature(this.MAP);
    public static REGEXP_CLASS_SIGNATURE = this.buildBuiltInClassSignature(this.REGEXP);
    public static REGEXP_CLASS_TYPE = new ClassType(this.REGEXP_CLASS_SIGNATURE);
    public static BUILT_IN_CLASS_SIGNATURE_MAP = this.buildBuiltInClassSignatureMap();

    // constants for iterator
    public static ITERATOR_FUNCTION = 'iterator';
    public static ITERATOR = 'Iterator';
    public static ITERATOR_NEXT = 'next';
    public static ITERATOR_RESULT = 'IteratorResult';
    public static ITERATOR_RESULT_DONE = 'done';
    public static ITERATOR_RESULT_VALUE = 'value';

    public static ITERATOR_CLASS_SIGNATURE = this.buildBuiltInClassSignature(this.ITERATOR);
    public static ITERATOR_RESULT_CLASS_SIGNATURE = this.buildBuiltInClassSignature(this.ITERATOR_RESULT);
    public static ITERATOR_CLASS_TYPE = new ClassType(this.ITERATOR_CLASS_SIGNATURE, [new GenericType('T')]);
    public static ITERATOR_RESULT_CLASS_TYPE = new ClassType(this.ITERATOR_RESULT_CLASS_SIGNATURE, [new GenericType('T')]);

    // constants for string
    public static TO_STRING = 'toString';
    public static TO_STRING_METHOD_SIGNATURE = new MethodSignature(
        ClassSignature.DEFAULT,
        new MethodSubSignature(this.TO_STRING, [], StringType.getInstance(), false)
    );

    private static buildBuiltInClasses(): Set<string> {
        const builtInClasses = new Set<string>();
        builtInClasses.add(this.OBJECT);
        builtInClasses.add(this.ARRAY);
        builtInClasses.add(this.SET);
        builtInClasses.add(this.MAP);
        builtInClasses.add(this.REGEXP);
        return builtInClasses;
    }

    private static buildBuiltInClassesFileSignature(): FileSignature {
        return new FileSignature(this.DUMMY_PROJECT_NAME, this.DUMMY_FILE_NAME);
    }

    public static buildBuiltInClassSignature(className: string): ClassSignature {
        return new ClassSignature(className, this.BUILT_IN_CLASSES_FILE_SIGNATURE);
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

    public static isBuiltinClass(className: string): boolean {
        return this.BUILT_IN_CLASSES.has(className);
    }
}
