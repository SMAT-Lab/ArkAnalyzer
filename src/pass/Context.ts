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

export type AnyKey<T> = { new(): T };

export interface CtxArg {
    readonly name: string;
}

// uniq map for uniq type as key
export type UniMap<T> = Map<AnyKey<T>, T>;

interface Upper {
    readonly upper: Upper;
    readonly unreachable: boolean;
}

/**
 * Represents the root implementation of the Upper interface.
 * Provides a singleton instance to ensure a single point of access.
 * The class is designed to maintain immutability for its properties.
 * The `getInstance` method allows retrieval of the singleton instance.
 */
export class UpperRoot implements Upper {
    readonly upper: any;
    readonly unreachable = true;
    private static INSTANCE = new UpperRoot();

    static getInstance(): UpperRoot {
        return UpperRoot.INSTANCE;
    }
}

/**
 * Represents a context that manages a map of arguments and provides methods to manipulate them.
 * Implements the Upper interface, allowing for hierarchical structures.
 * The context maintains a reference to its upper context and provides utilities to traverse the hierarchy.
 *
 * The `unreachable` property indicates whether this context is considered unreachable in the hierarchy.
 * The `upper` property refers to the parent or enclosing context.
 * The `args` property is a map that stores key-value pairs specific to this context.
 *
 * Provides methods to retrieve, add, and remove entries from the argument map.
 * Allows traversal to the root context in the hierarchy by following the chain of upper contexts.
 */
export class Context<U extends Upper, T> implements Upper {
    unreachable: boolean = false;
    upper: U;
    protected args: UniMap<T>;

    constructor(upper: U) {
        this.upper = upper;
        this.args = new Map();
    }

    get<K extends T>(k: AnyKey<K>): K | undefined {
        return this.args.get(k) as K;
    }

    set<K extends T>(k: AnyKey<K>, v: K): void {
        this.args.set(k, v);
    }

    remove<K extends T>(k: AnyKey<K>): K | undefined {
        const v = this.get(k);
        this.args.delete(k);
        return v;
    }

    root(): Upper {
        let up: Upper = this;
        // upper is root,
        while (!up.upper.unreachable) {
            up = up.upper;
        }
        return up;
    }
}