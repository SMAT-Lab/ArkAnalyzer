/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
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
 * A ContextItem represents a unique context in the program.
 */
export interface ContextItem {
    readonly id: number;
    getSignature(): string;
}

export class CallSiteContextItem implements ContextItem {
    readonly id: number;
    readonly callSiteId: number;
    readonly calleeFuncId: number;

    constructor(id: number, callSiteId: number, calleeFuncId: number) {
        this.id = id;
        this.callSiteId = callSiteId;
        this.calleeFuncId = calleeFuncId;
    }

    getSignature(): string {
        return `CS:${this.callSiteId}-${this.calleeFuncId}`;
    }
}

export class ObjectContextItem implements ContextItem {
    readonly id: number;
    readonly nodeID: number;

    constructor(id: number, allocationSiteId: number) {
        this.id = id;
        this.nodeID = allocationSiteId;
    }

    getSignature(): string {
        return `OBJ:${this.nodeID}`;
    }
}

export class FuncContextItem implements ContextItem {
    readonly id: number;
    readonly funcID: number;

    constructor(id: number, funcID: number) {
        this.id = id;
        this.funcID = funcID;
    }

    getSignature(): string {
        return `FUNC:${this.funcID}`;
    }
}

/**
 * Manages the creation and unique identification of all ContextItems.
 * This ensures that each unique item (based on its signature) has one and only one ID.
 */
export class ContextItemManager {
    private itemToIdMap: Map<string, number> = new Map();
    private idToItemMap: Map<number, ContextItem> = new Map();
    private nextItemId: number = 0;

    public getOrCreateCallSiteItem(callSiteId: number, calleeFuncID: number): CallSiteContextItem {
        const signature = `CS:${callSiteId}-${calleeFuncID}`;
        if (this.itemToIdMap.has(signature)) {
            const id = this.itemToIdMap.get(signature)!;
            return this.idToItemMap.get(id) as CallSiteContextItem;
        }

        const id = this.nextItemId++;
        const item = new CallSiteContextItem(id, callSiteId, calleeFuncID);
        this.itemToIdMap.set(signature, id);
        this.idToItemMap.set(id, item);
        return item;
    }

    public getOrCreateObjectItem(allocationSiteId: number): ObjectContextItem {
        const signature = `OBJ:${allocationSiteId}`;
        if (this.itemToIdMap.has(signature)) {
            const id = this.itemToIdMap.get(signature)!;
            return this.idToItemMap.get(id) as ObjectContextItem;
        }

        const id = this.nextItemId++;
        const item = new ObjectContextItem(id, allocationSiteId);
        this.itemToIdMap.set(signature, id);
        this.idToItemMap.set(id, item);
        return item;
    }

    public getOrCreateFuncItem(calleeFuncID: number): FuncContextItem {
        const signature = `FUNC:${calleeFuncID}`;
        if (this.itemToIdMap.has(signature)) {
            const id = this.itemToIdMap.get(signature)!;
            return this.idToItemMap.get(id) as FuncContextItem;
        }

        const id = this.nextItemId++;
        const item = new FuncContextItem(id, calleeFuncID);
        this.itemToIdMap.set(signature, id);
        this.idToItemMap.set(id, item);
        return item;
    }

    public getItem(id: number): ContextItem | undefined {
        return this.idToItemMap.get(id);
    }
}