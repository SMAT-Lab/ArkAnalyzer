/*
 * Copyright (c) 2026 Huawei Device Co., Ltd.
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

import { SignatureCanonicalizer, Canonicalizable } from './SignatureCanonicalizer';

/**
 * A canonicalizer that stores both signature instances and model instances,
 * unified by the same dense integer ID space.
 *
 * Extends {@link SignatureCanonicalizer} with a `models` array that maps
 * ID → model object. This eliminates the need for a separate `Map<number, Model>`
 * — the canonicalizer itself serves as both the signature registry and the model store.
 *
 * ID 0 is reserved for DEFAULT signatures and does not correspond to any model
 * (`models[0]` remains `undefined`).
 *
 * @template S - The signature type, must implement {@link Canonicalizable}
 * @template M - The model type associated with the signature
 */
export class SignatureModelCanonicalizer<S extends Canonicalizable, M> extends SignatureCanonicalizer<S> {
    private models: (M | undefined)[] = [];

    /**
     * Register a model at the given ID.
     *
     * The ID must have been allocated by `getId(sig)` or `intern(sig)` first.
     * Typically called right after `getId(sig)` returns a new or existing ID:
     * ```
     * const id = canonicalizer.getId(sig);
     * canonicalizer.setModel(id, model);
     * ```
     *
     * @param id - The integer ID (>= 0)
     * @param model - The model to associate with this ID
     */
    public setModel(id: number, model: M): void {
        this.models[id] = model;
    }

    /**
     * Get the model associated with an integer ID.
     *
     * @param id - The integer ID
     * @returns The model, or `undefined` if no model is registered at this ID
     *          (including ID 0 which is reserved for DEFAULT signatures)
     */
    public getModel(id: number): M | undefined {
        return this.models[id];
    }

    /**
     * Remove the model at the given ID.
     *
     * Sets `models[id]` to `undefined`. The ID itself is not recycled —
     * the signature entry in the canonicalizer remains, but the model is no
     * longer accessible via `getModel(id)`.
     *
     * @param id - The integer ID
     */
    public removeModel(id: number): void {
        this.models[id] = undefined;
    }

    /**
     * Get all registered models (excluding `undefined` entries).
     *
     * @returns An array of all models currently registered
     */
    public getModels(): M[] {
        const result: M[] = [];
        for (let i = 0; i < this.models.length; i++) {
            const m = this.models[i];
            if (m !== undefined) {
                result.push(m);
            }
        }
        return result;
    }

    /**
     * Clear all registered models, keeping the signature table intact.
     *
     * Used when models need to be rebuilt (e.g., after type inference modifies
     * method signatures) but the signature ID mappings should remain stable.
     * Unlike {@link clear}, the signature canonicalizer entries are preserved.
     */
    public clearModels(): void {
        this.models = [];
    }

    /**
     * Clear all signatures, models, and reset the canonicalizer.
     */
    public clear(): void {
        super.clear();
        this.models = [];
    }
}
