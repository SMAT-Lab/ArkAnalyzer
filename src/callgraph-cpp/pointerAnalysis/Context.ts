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

import { FuncID } from '../model/CallGraph';

export type ContextID = number;
export const DUMMY_CID = 0;

class Context {
    private contextElems: number[];
    static sEmptyCtx: Context = new Context([]);

    constructor(contextElems: number[] = []) {
        this.contextElems = contextElems;
    }

    static newEmpty(): Context {
        return new Context();
    }

    static new(contextElems: number[]): Context {
        return new Context(contextElems);
    }

    // use old context and a new element to create a new k-limited Context
    static newKLimitedContext(oldCtx: Context, elem: number, k: number): Context {
        let elems: number[] = [];
        if (k > 0) {
            elems.push(elem);
            if (oldCtx.contextElems.length < k) {
                elems = elems.concat(oldCtx.contextElems);
            } else {
                elems = elems.concat(oldCtx.contextElems.slice(0, k - 1));
            }
        }
        return new Context(elems);
    }

    static kLimitedContext(ctx: Context, k: number): Context {
        if (ctx.length() <= k) {
            return new Context(ctx.contextElems);
        } else {
            const elems = ctx.contextElems.slice(0, k);
            return new Context(elems);
        }
    }

    public length(): number {
        return this.contextElems.length;
    }

    public get(index: number): number {
        if (index < 0 || index >= this.contextElems.length) {
            throw new Error('Index out of bounds');
        }
        return this.contextElems[index];
    }

    public toString(): String {
        return this.contextElems.join('-');
    }
}

class ContextCache {
    private contextList: Context[] = [];
    private contextToIDMap: Map<String, number> = new Map();

    constructor() {
        this.contextList = [];
        this.contextToIDMap = new Map();
    }

    public getOrNewContextID(context: Context): ContextID {
        let cStr = context.toString();
        if (this.contextToIDMap.has(cStr)) {
            return this.contextToIDMap.get(cStr) as ContextID;
        } else {
            // real cid start from 1
            const id = this.contextList.length;
            this.contextList.push(context);
            this.contextToIDMap.set(cStr, id);
            return id;
        }
    }

    public updateContext(id: ContextID, newContext: Context, oldContext: Context): boolean {
        if (this.contextList.length < id) {
            return false;
        }
        this.contextList[id] = newContext;
        let oldCStr = oldContext.toString();
        let newCStr = newContext.toString();
        this.contextToIDMap.delete(oldCStr);
        this.contextToIDMap.set(newCStr, id);
        return true;
    }

    public getContextID(context: Context): ContextID | undefined {
        let cStr = context.toString();
        if (this.contextToIDMap.has(cStr)) {
            return this.contextToIDMap.get(cStr) as ContextID;
        }

        return undefined;
    }

    public getContext(id: number): Context | undefined {
        if (id > this.contextList.length) {
            return undefined;
        }
        return this.contextList[id];
    }

    public getContextList(): Context[] {
        return this.contextList;
    }
}

export class KLimitedContextSensitive {
    k: number;
    ctxCache: ContextCache;

    constructor(k: number) {
        this.k = k;
        this.ctxCache = new ContextCache();
        // put dummy cid
        this.getEmptyContextID();
    }

    public emptyContext(): Context {
        return new Context([]);
    }

    public getEmptyContextID(): ContextID {
        return this.getContextID(Context.newEmpty());
    }

    public getContextID(context: Context): ContextID {
        return this.ctxCache.getOrNewContextID(context);
    }

    public getContextByID(context_id: number): Context | undefined {
        return this.ctxCache.getContext(context_id);
    }

    public getNewContextID(callerFuncId: FuncID): ContextID {
        return this.ctxCache.getOrNewContextID(Context.new([callerFuncId]));
    }

    public getOrNewContext(callerCid: ContextID, calleeFuncId: FuncID, findCalleeAsTop: boolean = false): ContextID {
        const callerCtx = this.ctxCache.getContext(callerCid);
        if (!callerCtx) {
            throw new Error(`Context with id ${callerCid} not found.`);
        }

        const calleeNewCtx = Context.newKLimitedContext(callerCtx, calleeFuncId, this.k);
        if (findCalleeAsTop) {
            const calleeAsTopCtx = Context.newKLimitedContext(Context.sEmptyCtx, calleeFuncId, this.k);
            let topID = this.ctxCache.getContextID(calleeAsTopCtx);
            if (topID) {
                this.ctxCache.updateContext(topID, calleeNewCtx, calleeAsTopCtx);
                return topID;
            }
        }

        const calleeCid = this.ctxCache.getOrNewContextID(calleeNewCtx);
        return calleeCid;
    }
}
