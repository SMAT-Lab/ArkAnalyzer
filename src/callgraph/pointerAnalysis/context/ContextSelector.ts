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

import { CallGraph, FuncID, ICallSite } from '../../model/CallGraph';
import { CallSiteContext, Context, ContextCache, ContextID, DUMMY_CID, FuncContext, ObjContext } from './Context';
import { ContextItemManager } from './ContextItem';
import path from 'path';
import * as fs from 'fs';

/**
 * Top layer of context
 */

export let emptyID: number = -1;
export interface ContextSelector {
    ctxCache: ContextCache;
    ctxManager: ContextItemManager;
    selectContext(callerContextID: ContextID, callSite: ICallSite, obj: number, calleeFunc: number): ContextID;
    emptyContext(id: number): ContextID;
    getContextID(context: Context): ContextID;
    dump(path: string, cg: CallGraph): void;
}

export class KCallSiteContextSelector implements ContextSelector {
    private k: number;
    ctxCache: ContextCache;
    ctxManager: ContextItemManager;

    constructor(k: number) {
        this.k = k;
        this.ctxCache = new ContextCache();
        this.ctxManager = new ContextItemManager();
    }

    public selectContext(callerContextID: ContextID, callSite: ICallSite, obj: number, callee: number): ContextID {
        let callerContext = this.ctxCache.getContext(callerContextID);
        let calleeFuncID = callSite.getCalleeFuncID();
        if (!callerContext || !calleeFuncID) {
            return DUMMY_CID;
        }

        let calleeContext = callerContext.append(callSite.id, calleeFuncID, this.k, this.ctxManager);
        return this.ctxCache.getOrNewContextID(calleeContext);
    }

    public emptyContext(id: number): ContextID {
        let emptyContext = CallSiteContext.newEmpty();
        return this.ctxCache.getOrNewContextID(emptyContext);
    }

    public getContextID(context: Context): ContextID {
        return this.ctxCache.getOrNewContextID(context);
    }

    public dump(dir: string, cg: CallGraph): void {
        const content = this.ctxCache.dump(this.ctxManager, cg);
        const filePath = path.join(dir, 'context.txt');
        fs.writeFileSync(filePath, content, 'utf8');
    }
}

// WIP
export class KObjContextSelector implements ContextSelector {
    private k: number;
    ctxCache: ContextCache;
    ctxManager: ContextItemManager;

    constructor(k: number) {
        this.k = k;
        this.ctxCache = new ContextCache();
        this.ctxManager = new ContextItemManager();
    }

    public selectContext(callerContextID: ContextID, callSite: ICallSite, obj: number, callee: number): ContextID {
        let callerContext = this.ctxCache.getContext(callerContextID);
        if (!callerContext) {
            return DUMMY_CID;
        }

        if (obj === emptyID) {
            return callerContextID;
        }

        let calleeContext = callerContext.append(0, obj, this.k, this.ctxManager);
        return this.ctxCache.getOrNewContextID(calleeContext);
    }

    public emptyContext(id: number): ContextID {
        let emptyContext = ObjContext.newEmpty();
        return this.ctxCache.getOrNewContextID(emptyContext);
    }

    public getContextID(context: Context): ContextID {
        return this.ctxCache.getOrNewContextID(context);
    }

    public dump(dir: string, cg: CallGraph): void {
    }
}

export class KFuncContextSelector implements ContextSelector {
    private k: number;
    ctxCache: ContextCache;
    ctxManager: ContextItemManager;

    constructor(k: number) {
        this.k = k;
        this.ctxCache = new ContextCache();
        this.ctxManager = new ContextItemManager();
    }

    public selectContext(callerContextID: ContextID, callSite: ICallSite, obj: number, funcID: number): ContextID {
        let callerContext = this.ctxCache.getContext(callerContextID);
        if (!callerContext) {
            return DUMMY_CID;
        }

        let calleeContext = callerContext.append(0, funcID, this.k, this.ctxManager);
        return this.ctxCache.getOrNewContextID(calleeContext);
    }

    public emptyContext(funcID: FuncID): ContextID {
        let emptyContext = FuncContext.newEmpty();
        let calleeContext = emptyContext.append(0, funcID, this.k, this.ctxManager);
        return this.ctxCache.getOrNewContextID(calleeContext);
    }

    public getContextID(context: Context): ContextID {
        return this.ctxCache.getOrNewContextID(context);
    }

    public dump(dir: string, cg: CallGraph): void {
        const content = this.ctxCache.dump(this.ctxManager, cg);
        const filePath = path.join(dir, 'context.txt');
        fs.writeFileSync(filePath, content, 'utf8');
    }
}