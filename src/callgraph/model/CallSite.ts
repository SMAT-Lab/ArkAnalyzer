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

/**
 * 调用点 ID 的类型别名，全局唯一递增分配。
 */
export type CallSiteID = number;

/**
 * 调用点统一接口。
 * 一个调用点表示调用图中一条 `caller → callee` 边在 caller 侧的来源语句信息。
 */
export interface ICallSite {
    /** 全局唯一标识 */
    id: CallSiteID;
    /** 触发该调用的语句（通常是 ArkInvokeStmt） */
    callStmt: Stmt;
    /** 调用参数列表，若语句不包含参数信息则为 undefined */
    args: Value[] | undefined;
    /** 调用方方法 ID */
    callerFuncID: FuncID;
    /** 获取被调用方方法 ID */
    getCalleeFuncID(): FuncID | undefined;
}

/**
 * 静态调用点。
 *
 * 表示一条**确定**的 `caller → callee` 调用边：在构建调用图时（CHA/RTA/PTA），
 * 调用语句的目标方法已被解析为具体的 calleeFuncID，不再发生变化。
 *
 * 与 {@link DynCallSite} 相对，后者在创建时 callee 未知或仅为候选，
 * 需要在后续指针分析阶段被克隆为确定性的静态调用点。
 */
export class CallSite implements ICallSite {
    /** 全局唯一标识 */
    public id: CallSiteID;
    /** 触发该调用的语句（通常是 ArkInvokeStmt） */
    public callStmt: Stmt;
    /** 调用参数列表，若语句不包含参数信息则为 undefined */
    public args: Value[] | undefined;
    /** 被调用方方法 ID */
    public calleeFuncID: FuncID;
    /** 调用方方法 ID */
    public callerFuncID: FuncID;
    /**
     * 当该调用点对应一条 **callback 调用边** 时，argIndex 表示 callback
     * 是原始调用语句的第几个入参（0-based）。
     *
     * 例如语句 `button.onClick(callback)` 中，callback 是第 0 个入参，
     * 则为该 callback 创建的 CallSite 的 argIndex = 0。
     *
     * 对于非 callback 类型的普通调用边，此字段为 undefined。
     */
    readonly argIndex?: number;

    constructor(id: CallSiteID, s: Stmt, a: Value[] | undefined, ce: FuncID, cr: FuncID, argIndex?: number) {
        this.id = id;
        this.callStmt = s;
        this.args = a;
        this.calleeFuncID = ce;
        this.callerFuncID = cr;
        this.argIndex = argIndex;
    }

    public getCalleeFuncID(): FuncID | undefined {
        return this.calleeFuncID;
    }
}

/**
 * 动态调用点。
 *
 * 表示一条**不确定**的调用边：在调用图构建初期，调用语句的 callee 尚未确定
 * （典型场景为通过函数类型变量发起的间接调用 `fn()`），仅记录一个候选 callee
 * 或留空，等待指针分析（PTA）阶段将实际指向的方法解析出来后，
 * 再通过 {@link CallSiteManager.cloneCallSiteFromDyn} 克隆为确定性的 {@link CallSite}。
 */
export class DynCallSite implements ICallSite {
    /** 全局唯一标识 */
    public id: CallSiteID;
    /** 触发该调用的语句（通常是 ArkInvokeStmt） */
    public callStmt: Stmt;
    /** 调用参数列表，若语句不包含参数信息则为 undefined */
    public args: Value[] | undefined;
    /** 候选被调用方方法 ID，在创建时可能不确定 */
    public potentialCalleeFuncID: FuncID | undefined;
    /** 调用方方法 ID */
    public callerFuncID: FuncID;

    constructor(id: CallSiteID, s: Stmt, a: Value[] | undefined, ptcCallee: FuncID | undefined, caller: FuncID) {
        this.id = id;
        this.callerFuncID = caller;
        this.callStmt = s;
        this.args = a;
        this.potentialCalleeFuncID = ptcCallee;
    }

    public getCalleeFuncID(): FuncID | undefined {
        return this.potentialCalleeFuncID;
    }
}

/**
 * 调用点全局管理器。
 *
 * 负责为 {@link CallSite} 和 {@link DynCallSite} 分配全局唯一 ID，
 * 维护 ID → 调用点、调用点 → ID 的双向映射，
 * 以及动态调用点到其克隆出的静态调用点集合的映射。
 */
export class CallSiteManager {
    private idToCallSiteMap: Map<CallSiteID, ICallSite> = new Map();
    private callSiteToIdMap: Map<ICallSite, CallSiteID> = new Map();
    private dynToStaticMap: Map<CallSiteID, CallSiteID[]> = new Map();

    /**
     * 创建并注册一个静态调用点。
     * @param s - 触发调用的语句
     * @param a - 调用参数列表
     * @param ce - 被调用方方法 ID
     * @param cr - 调用方方法 ID
     * @returns 新建的全局唯一静态调用点
     */
    public newCallSite(s: Stmt, a: Value[] | undefined, ce: FuncID, cr: FuncID): CallSite {
        let id = this.idToCallSiteMap.size;
        let callSite = new CallSite(id, s, a, ce, cr);
        this.idToCallSiteMap.set(id, callSite);
        this.callSiteToIdMap.set(callSite, id);
        return callSite;
    }

    /**
     * 创建并注册一个动态调用点。
     * @param s - 触发调用的语句
     * @param a - 调用参数列表
     * @param ptcCallee - 候选被调用方方法 ID，不确定时传 undefined
     * @param caller - 调用方方法 ID
     * @returns 新建的全局唯一动态调用点
     */
    public newDynCallSite(s: Stmt, a: Value[] | undefined, ptcCallee: FuncID | undefined, caller: FuncID): DynCallSite {
        let id = this.idToCallSiteMap.size;
        let callSite = new DynCallSite(id, s, a, ptcCallee, caller);
        this.idToCallSiteMap.set(id, callSite);
        this.callSiteToIdMap.set(callSite, id);
        return callSite;
    }

    /**
     * 从一个动态调用点克隆出一个确定 callee 的静态调用点。
     *
     * 同一个动态调用点可被多次克隆（对应指针分析解析出的多个实际 callee），
     * 已存在相同 callee 的克隆时直接复用，避免重复创建。
     *
     * @param dynCallSite - 原始动态调用点
     * @param calleeFuncID - 解析出的确定被调用方方法 ID
     * @returns 克隆出的静态调用点（新建或已存在的）
     */
    public cloneCallSiteFromDyn(dynCallSite: DynCallSite, calleeFuncID: FuncID): CallSite {
        let clonedCS = this.dynToStaticMap.get(dynCallSite.id) ?? [];

        let foundCS = clonedCS.map(id => this.idToCallSiteMap.get(id) as CallSite).find(cs => cs.calleeFuncID === calleeFuncID);

        if (foundCS) {
            return foundCS;
        }

        let staticCS = this.newCallSite(dynCallSite.callStmt, dynCallSite.args, calleeFuncID, dynCallSite.callerFuncID);
        clonedCS.push(staticCS.id);
        this.dynToStaticMap.set(dynCallSite.id, clonedCS);

        return staticCS;
    }

    /**
     * 根据 ID 查询调用点。
     * @param id - 调用点全局唯一 ID
     * @returns 对应的调用点，不存在时返回 undefined
     */
    public getCallSiteById(id: CallSiteID): ICallSite | undefined {
        return this.idToCallSiteMap.get(id);
    }
}
