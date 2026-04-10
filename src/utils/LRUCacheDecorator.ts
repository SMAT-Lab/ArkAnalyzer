/*
 * Copyright (c) 2024-2026 Huawei Device Co., Ltd.
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
 * LRU Cache Decorator — method-level caching with Least Recently Used eviction.
 *
 * Usage:
 *   import { LRUCache, clearLRUCache } from './LRUCacheDecorator';
 *
 *   class Foo {
 *       // Basic: cache up to 4096 entries (default)
 *       @LRUCache()
 *       static resolve(path: string): string { ... }
 *
 *       // Custom capacity
 *       @LRUCache(1024)
 *       static lookup(id: number): string { ... }
 *
 *       // Custom key generator — useful when you want case-insensitive keys,
 *       // partial-argument keys, or any custom serialization.
 *       @LRUCache(4096, (srcPath) => srcPath.toLowerCase())
 *       static getFileRealPath(srcPath: string): string { ... }
 *   }
 *
 *   // Clear the cache of a decorated method (e.g. on dispose)
 *   clearLRUCache(Foo, 'resolve');
 */

const LRU_CACHE_SYMBOL = Symbol('LRUCache');

/**
 * A function that generates a cache key from method arguments.
 */
export type KeyGenerator = (...args: any[]) => string;

const defaultKeyGenerator: KeyGenerator = (...args: any[]) => args.join();

/**
 * LRU (Least Recently Used) cache decorator for methods.
 * Caches return values based on method arguments, evicting the oldest entry
 * when the cache reaches maxSize.
 *
 * @param maxSize - Maximum number of entries to keep in the cache.
 * @param keyGenerator - Optional custom function to generate cache keys from method arguments.
 */
export function LRUCache(maxSize: number = 4096, keyGenerator?: KeyGenerator) {
    const resolveKey = keyGenerator ?? defaultKeyGenerator;
    const cache = new Map<string, any>();
    return function (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = function (this: any, ...args: any[]) {
            const key = resolveKey(...args);
            if (cache.has(key)) {
                const value = cache.get(key);
                cache.delete(key);
                cache.set(key, value);
                return value;
            }
            const result = originalMethod.apply(this, args);
            if (cache.size >= maxSize) {
                const firstKey = cache.keys().next().value;
                if (firstKey) {
                    cache.delete(firstKey);
                }
            }
            cache.set(key, result);
            return result;
        };

        (descriptor.value as any)[LRU_CACHE_SYMBOL] = cache;
    };
}

/**
 * Clear the LRU cache associated with a decorated method.
 * @param target - The class (for static methods) or instance (for instance methods).
 * @param propertyKey - The method name.
 */
export function clearLRUCache(target: any, propertyKey: string): void {
    const cache = target[propertyKey]?.[LRU_CACHE_SYMBOL] as Map<string, any> | undefined;
    cache?.clear();
}
