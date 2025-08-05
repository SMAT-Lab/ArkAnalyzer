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

import type { Value } from '../core/base/Value';
import {
    ArkAliasTypeDefineStmt, ArkAssignStmt,
    ArkIfStmt,
    ArkInvokeStmt,
    ArkReturnStmt,
    ArkReturnVoidStmt,
    ArkThrowStmt,
    Stmt,
} from '../core/base/Stmt';
import {
    AbstractBinopExpr, AbstractExpr, AbstractInvokeExpr, AliasTypeExpr, ArkAwaitExpr,
    ArkCastExpr,
    ArkConditionExpr, ArkDeleteExpr, ArkInstanceInvokeExpr,
    ArkInstanceOfExpr, ArkNewArrayExpr, ArkNewExpr,
    ArkNormalBinopExpr, ArkPhiExpr, ArkPtrInvokeExpr, ArkStaticInvokeExpr,
    ArkTypeOfExpr, ArkUnopExpr, ArkYieldExpr,
} from '../core/base/Expr';
import { FallAction, MethodCtx } from './Pass';
import {
    BigIntConstant,
    BooleanConstant,
    Constant,
    NullConstant,
    NumberConstant,
    StringConstant, UndefinedConstant,
} from '../core/base/Constant';
import Logger, { LOG_MODULE_TYPE } from '../utils/logger';
import type { ArkMethod } from '../core/model/ArkMethod';
import { Local } from '../core/base/Local';
import {
    AbstractFieldRef,
    AbstractRef, ArkCaughtExceptionRef,
    ArkInstanceFieldRef,
    ArkParameterRef,
    ArkStaticFieldRef, ArkThisRef, ClosureFieldRef, GlobalRef,
} from '../core/base/Ref';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'Inst');

/**
 * Represents a function type that processes a value and context, optionally returning a FallAction to control flow.
 * This function is invoked with a value of type T , a context object and a method object, and it can decide whether to skip subsequent passes.

 * @param value:T - The inst to be executed
 * @param ctx:MethodCtx - The method context of this inst
 * @param mtd:ArkMethod - The method of this inst
 * @returns  If a FallAction is returned, it indicates the action to take regarding skipping or halting further processing.
 *           Returning nothing or void implies no special action, allowing the next passes to execute normally.
 */
export interface InstPass<T> {
    (value: T, ctx: MethodCtx, mtd: ArkMethod): FallAction | void;
}

type IndexOf<T extends readonly any[]> = Extract<keyof T, `${number}`>;

/**
 * Represents all statement types used within the system.
 */
const STMTS = [
    ArkAssignStmt,
    ArkInvokeStmt,
    ArkIfStmt,
    ArkReturnStmt,
    ArkReturnVoidStmt,
    ArkThrowStmt,
    ArkAliasTypeDefineStmt,
    Stmt,
] as const;

/**
 * class of stmts
 */
export type StmtClass = typeof STMTS[number];

/**
 * stmts classes
 */
export type StmtTy = {
    [K in IndexOf<typeof STMTS>]: InstanceType<typeof STMTS[K]>;
}[IndexOf<typeof STMTS>];

type StmtPass = {
    [K in IndexOf<typeof STMTS>]: InstPass<InstanceType<typeof STMTS[K]>>;
}[IndexOf<typeof STMTS>];

type StmtList<S extends StmtClass> = [S, InstPass<InstanceType<S>>[] | InstPass<InstanceType<S>>];

/**
 * Represents an initialization statement type derived from the `STMTS` constant.
 * This type maps each index of the `STMTS` array to a corresponding `StmtList` type,
 * effectively creating a union of all possible statement list types defined by `STMTS`.
 * It is used to ensure type safety and consistency when working with statement lists
 * associated with the `STMTS` entries.
 */
export type StmtInit = {
    [K in IndexOf<typeof STMTS>]: StmtList<typeof STMTS[K]>;
}[IndexOf<typeof STMTS>];


/**
 * Represents all values types used within the system.
 */
const VALUES = [
    // expr
    AliasTypeExpr,
    ArkUnopExpr,
    ArkPhiExpr,
    ArkCastExpr,
    ArkInstanceOfExpr,
    ArkTypeOfExpr,
    ArkNormalBinopExpr,
    ArkConditionExpr,
    AbstractBinopExpr,
    ArkYieldExpr,
    ArkAwaitExpr,
    ArkDeleteExpr,
    ArkNewArrayExpr,
    ArkNewExpr,
    ArkPtrInvokeExpr,
    ArkStaticInvokeExpr,
    ArkInstanceInvokeExpr,
    AbstractInvokeExpr,
    AbstractExpr,
    // ref
    ClosureFieldRef,
    GlobalRef,
    ArkCaughtExceptionRef,
    ArkThisRef,
    ArkParameterRef,
    ArkStaticFieldRef,
    ArkInstanceFieldRef,
    AbstractFieldRef,
    AbstractRef,
    // constant
    UndefinedConstant,
    NullConstant,
    StringConstant,
    BigIntConstant,
    NumberConstant,
    BooleanConstant,
    Constant,
    // local
    Local,
] as const;

/**
 * class of stmts
 */
type ValueClass = typeof VALUES[number];

/**
 * stmts classes
 */
export type ValueTy = {
    [K in IndexOf<typeof VALUES>]: InstanceType<typeof VALUES[K]>;
}[IndexOf<typeof VALUES>];

type ValuePass = {
    [K in IndexOf<typeof VALUES>]: InstPass<InstanceType<typeof VALUES[K]>>;
}[IndexOf<typeof VALUES>];

type ValuePair<S extends ValueClass> = [S, InstPass<InstanceType<S>>[] | InstPass<InstanceType<S>>];

/**
 * Represents an initialization value for a specific index in the VALUES array.
 * This type maps each index of the VALUES array to a corresponding ValuePair type,
 * ensuring that only valid initialization values for the given index are allowed.
 * The resulting type is a union of all possible ValuePair types derived from the VALUES array.
 */
export type ValueInit = {
    [K in IndexOf<typeof VALUES>]: ValuePair<typeof VALUES[K]>;
}[IndexOf<typeof VALUES>];

/**
 * the dispatch table, it can be cached
 */
export class Dispatch {
    name: string = 'dispatch';
    readonly stmts: StmtClass[] = [];
    readonly smap: Map<StmtClass, StmtPass[]> = new Map();
    readonly values: ValueClass[] = [];
    readonly vmap: Map<ValueClass, ValuePass[]> = new Map();

    constructor(stmts: StmtInit[] = [], values: ValueInit[] = []) {
        this.stmts = stmts.map(v => v[0]);
        const smap = new Map();
        for (const [k, v] of stmts) {
            if (Array.isArray(v)) {
                smap.set(k, v);
            } else {
                smap.set(k, [v]);
            }
        }
        // replace it, in case of modified
        this.smap = smap;
        this.values = values.map(v => v[0]);
        const vmap = new Map();
        for (const [k, v] of values) {
            if (Array.isArray(v)) {
                vmap.set(k, v);
            } else {
                vmap.set(k, [v]);
            }
        }
        // replace it, in case of modified
        this.vmap = vmap;
    }
}

/**
 * the ArkIR dispatcher, to dispatch stmts and values actions
 */
export class Dispatcher {
    // shared context between instructions
    private readonly ctx: MethodCtx;
    // action when match stmts
    protected fallAction: FallAction = FallAction.Break;
    // dispatch table
    private readonly dispatch: Dispatch;
    // value cache to prevent cycle dependencies
    private cache: Set<any> = new Set();

    constructor(ctx: MethodCtx, dispatch: Dispatch = new Dispatch()) {
        this.ctx = ctx;
        this.dispatch = dispatch;
    }

    dispatchStmt(mtd: ArkMethod, stmt: Stmt): void {
        logger.debug(`dispatch stmt ${stmt}`);
        const tys = this.dispatch.stmts;
        for (let ty of tys) {
            if (stmt instanceof ty) {
                let pass = this.dispatch.smap.get(ty) ?? [];
                for (const p of pass) {
                    p(stmt as any, this.ctx, mtd);
                }
                if (this.fallAction === FallAction.Break) {
                    break;
                }
            }
        }
        for (let use of stmt.getUses()) {
            this.dispatchValue(mtd, use);
        }
    }

    dispatchValue(mtd: ArkMethod, value: Value): void {
        logger.debug(`dispatch value ${value}`);
        // skip uses if there is no value pass
        if (this.dispatch.values.length === 0) {
            return;
        }
        if (this.cache.has(value)) {
            return;
        }
        this.cache.add(value);
        const tys = this.dispatch.values;
        for (let ty of tys) {
            if (value instanceof ty) {
                let pass = this.dispatch.vmap.get(ty) ?? [];
                for (const p of pass) {
                    p(value as any, this.ctx, mtd);
                }
                if (this.fallAction === FallAction.Break) {
                    break;
                }
            }
        }
        for (let use of value.getUses()) {
            this.dispatchValue(mtd, use);
        }
    }
}