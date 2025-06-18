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
import { ContextID } from '../pointerAnalysis/Context';
import { FuncID } from './CallGraph';

export type CallSiteID = number;

export interface ICallSite {
    callStmt: Stmt;
    args: Value[] | undefined;
    callerFuncID: FuncID;
}

export class CallSite implements ICallSite {
    public callStmt: Stmt;
    public args: Value[] | undefined;
    public calleeFuncID: FuncID;
    public callerFuncID: FuncID;

    constructor(s: Stmt, a: Value[] | undefined, ce: FuncID, cr: FuncID) {
        this.callStmt = s;
        this.args = a;
        this.calleeFuncID = ce;
        this.callerFuncID = cr;
    }
}

export class DynCallSite implements ICallSite {
    public callStmt: Stmt;
    public args: Value[] | undefined;
    public protentialCalleeFuncID: FuncID | undefined;
    public callerFuncID: FuncID;

    constructor(s: Stmt, a: Value[] | undefined, ptcCallee: FuncID | undefined, caller: FuncID) {
        this.callerFuncID = caller;
        this.callStmt = s;
        this.args = a;
        this.protentialCalleeFuncID = ptcCallee;
    }
}

export class CSCallSite extends CallSite {
    public cid: ContextID;

    constructor(id: ContextID, cs: CallSite) {
        super(cs.callStmt, cs.args, cs.calleeFuncID, cs.callerFuncID);
        this.cid = id;
    }
}