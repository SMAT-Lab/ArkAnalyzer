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

import { ClassSignature } from '../../../core/model/ArkSignature';
import { ClassType, GenericType } from '../../../core/base/Type';
import { Builtin } from '../../../core/common/Builtin';

/**
 * C++ built-in container names, syntax constants, and signature stubs.
 *
 * Signatures created here are **unclear stubs** (declaring file = FileSignature.DEFAULT) that
 * live in the temp canonicalizer and are resolved to real signatures during type inference.
 */
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
    public static ANONYMOUS_NAMESPACE_REF = '(anonymous namespace)::';
    public static OPERATOR_ISTREAM = 'operator>>';
    public static OPERATOR_OSTREAM = 'operator<<';

    public static BUILT_IN_CLASSES = this.buildBuiltInClasses();

    // iterator constants (C++ range-for lowering)
    public static ITERATOR_FUNCTION = 'iterator';
    public static ITERATOR = 'IterableIterator';
    public static ITERATOR_NEXT = 'iterator++';
    public static ITERATOR_RESULT = 'operator*';
    public static ITERATOR_RESULT_BEGIN = 'begin';
    public static ITERATOR_RESULT_END = 'end';
    public static ITERATOR_VALUE = '*';

    // --- Stable unclear stubs (shared per name, delegate to core Builtin's cache) ---

    /**
     * Unclear stub signature for a built-in class name (shared instance per name).
     * Delegates to the core Builtin cache so that core and C++ consumers of the same
     * name (e.g. 'Object') share one stub instance — and thus one temp SigID.
     */
    public static getBuiltinClassSignature(className: string): ClassSignature {
        return Builtin.getBuiltinClassSignature(className);
    }

    public static get OBJECT_CLASS_SIGNATURE(): ClassSignature {
        return this.getBuiltinClassSignature(this.OBJECT);
    }
    public static get OBJECT_CLASS_TYPE(): ClassType {
        return new ClassType(this.OBJECT_CLASS_SIGNATURE);
    }
    public static get ARRAY_CLASS_SIGNATURE(): ClassSignature {
        return this.getBuiltinClassSignature(this.ARRAY);
    }
    public static get SET_CLASS_SIGNATURE(): ClassSignature {
        return this.getBuiltinClassSignature(this.SET);
    }
    public static get MAP_CLASS_SIGNATURE(): ClassSignature {
        return this.getBuiltinClassSignature(this.MAP);
    }
    public static get REGEXP_CLASS_SIGNATURE(): ClassSignature {
        return this.getBuiltinClassSignature(this.REGEXP);
    }
    public static get REGEXP_CLASS_TYPE(): ClassType {
        return new ClassType(this.REGEXP_CLASS_SIGNATURE);
    }

    public static get ITERATOR_CLASS_SIGNATURE(): ClassSignature {
        return this.getBuiltinClassSignature(this.ITERATOR);
    }
    public static get ITERATOR_RESULT_CLASS_SIGNATURE(): ClassSignature {
        return this.getBuiltinClassSignature(this.ITERATOR_RESULT);
    }
    public static get ITERATOR_CLASS_TYPE(): ClassType {
        return new ClassType(this.ITERATOR_CLASS_SIGNATURE, [new GenericType('T')]);
    }
    public static get ITERATOR_RESULT_CLASS_TYPE(): ClassType {
        return new ClassType(this.ITERATOR_RESULT_CLASS_SIGNATURE, [new GenericType('T')]);
    }

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

    /**
     * Whether the signature is an unresolved (stub) built-in container class.
     * The old projectName check is replaced by the unclear check: stubs are unclear,
     * while real parsed / resolved classes have concrete declaring files.
     */
    public static isBuiltinClass(classSignature: ClassSignature): boolean {
        return this.BUILT_IN_CLASSES.has(classSignature.getClassName()) && classSignature.isUnclear();
    }
}
