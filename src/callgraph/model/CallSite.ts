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

import { Stmt } from '../../core/base/Stmt';
import { Value } from '../../core/base/Value';
import { FuncID } from './CallGraph';

export type CallSiteID = number;

export interface ICallSite {
    id: CallSiteID;
    callStmt: Stmt;
    args: Value[] | undefined;
    callerFuncID: FuncID;
    getCalleeFuncID(): FuncID | undefined;
}

export class CallSite implements ICallSite {
    public id: CallSiteID;
    public callStmt: Stmt;
    public args: Value[] | undefined;
    public calleeFuncID: FuncID;
    public callerFuncID: FuncID;

    constructor(id: CallSiteID, s: Stmt, a: Value[] | undefined, ce: FuncID, cr: FuncID) {
        this.id = id;
        this.callStmt = s;
        this.args = a;
        this.calleeFuncID = ce;
        this.callerFuncID = cr;
    }

    public getCalleeFuncID(): FuncID | undefined {
        return this.calleeFuncID;
    }
}

export class DynCallSite implements ICallSite {
    public id: CallSiteID;
    public callStmt: Stmt;
    public args: Value[] | undefined;
    public protentialCalleeFuncID: FuncID | undefined;
    public callerFuncID: FuncID;

    constructor(id: CallSiteID, s: Stmt, a: Value[] | undefined, ptcCallee: FuncID | undefined, caller: FuncID) {
        this.id = id;
        this.callerFuncID = caller;
        this.callStmt = s;
        this.args = a;
        this.protentialCalleeFuncID = ptcCallee;
    }

    public getCalleeFuncID(): FuncID | undefined {
        return this.protentialCalleeFuncID;
    }
}

export class CallSiteManager {
    private idToCallSiteMap: Map<CallSiteID, ICallSite> = new Map();
    private callSiteToIdMap: Map<ICallSite, CallSiteID> = new Map();
    private dynToStaticMap: Map<CallSiteID, CallSiteID[]> = new Map();

    public newCallSite(s: Stmt, a: Value[] | undefined, ce: FuncID, cr: FuncID): CallSite {
        let id = this.idToCallSiteMap.size;
        let callSite = new CallSite(id, s, a, ce, cr);
        this.idToCallSiteMap.set(id, callSite);
        this.callSiteToIdMap.set(callSite, id);
        return callSite;
    }

    public newDynCallSite(s: Stmt, a: Value[] | undefined, ptcCallee: FuncID | undefined, caller: FuncID): DynCallSite {
        let id = this.idToCallSiteMap.size;
        let callSite = new DynCallSite(id, s, a, ptcCallee, caller);
        this.idToCallSiteMap.set(id, callSite);
        this.callSiteToIdMap.set(callSite, id);
        return callSite;
    }

    public cloneCallSiteFromDyn(dynCallSite: DynCallSite, calleeFuncID: FuncID): CallSite {
        let clonedCS = this.dynToStaticMap.get(dynCallSite.id) ?? [];

        let foundCS = clonedCS
            .map(id => this.idToCallSiteMap.get(id) as CallSite)
            .find(cs => cs.calleeFuncID === calleeFuncID);

        if (foundCS) {
            return foundCS;
        }

        let staticCS = this.newCallSite(dynCallSite.callStmt, dynCallSite.args, calleeFuncID, dynCallSite.callerFuncID);
        clonedCS.push(staticCS.id);
        this.dynToStaticMap.set(dynCallSite.id, clonedCS);

        return staticCS;
    }

    public getCallSiteById(id: CallSiteID): ICallSite | undefined {
        return this.idToCallSiteMap.get(id);
    }
}