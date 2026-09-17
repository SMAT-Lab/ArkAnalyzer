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

import { Canonicalizer } from '../../utils/Canonicalizer';

/**
 * 临时签名的索引表（组合 Canonicalizer.objectIdentity 策略）。
 *
 * 组合设计：注册/查ID/get/clear 委托 inner Canonicalizer（objectIdentity——Symbol 幂等
 * + 稠密 ID + 数组存储，与原独立实现完全同构）；本类仅追加 temp 空间独有的
 * retire（迁移置空）+ replacement（temp→formal 替换记录）+ 计数器 + 审计视图。
 *
 * 设计演进：
 * - 一版（refcount）：Map + 引用计数——release 配对要求高，已退役；
 * - 二版（弱表）：Map<id, WeakRef> + FinalizationRegistry——GC 时序不确定，已退役；
 * - 三版（独立索引表）：slots 数组 + 显式 retire + 替换记录（195 行独立实现）；
 * - 四版（组合，当前）：委托 Canonicalizer.objectIdentity + 追加 retire/replacement 层
 *   ——消除与 Canonicalizer 的代码重复，核心机制单一来源。
 *
 * 生命周期（全保留）：未 retire 的条目永不清——完整注册审计表。"推导中间垃圾"
 * 钉活到 Registry.dispose——知情权衡（JS 无法感知强可达对象的持有者消亡）。
 * 三数自洽：totalRegistered（inner.size）= liveCount + retiredCount（retiredIds.size）。
 */
export class TempSignatureCanonicalizer<S extends object> {
    /** objectIdentity 策略的注册/查ID/get/clear 核心（Symbol 幂等 + 稠密 ID + list 数组）。 */
    private readonly inner: Canonicalizer<S> = new Canonicalizer<S>();

    /** 已迁移（retire 置空）的 ID 集——get(id) 查此 Set 先于 inner.get(id)。 */
    private retiredIds = new Set<number>();

    /** temp → formal 替换记录（迁移时的归宿），get(id) miss 时的 fallback。 */
    private replacements = new Map<number, number>();

    /** 注册签名对象：同一实例重复注册复用同一 ID；新实例分配新 ID。 */
    public register(sig: S): number {
        return this.inner.getId(sig);
    }

    /**
     * 按 ID 取签名对象。已迁移（retire 置空）返回 undefined——消费方应查
     * {@link getReplacement} 获得 formal 归宿（三级查的 fallback）。
     */
    public get(id: number): S | undefined {
        if (this.retiredIds.has(id)) {
            return undefined;
        }
        return this.inner.get(id);
    }

    /** 查询签名对象的 tempSigID，不注册。未注册返回 -1。Symbol 在 retire 后不清（审计追溯保留）。 */
    public getExistingTempId(sig: S): number {
        return this.inner.getExistingId(sig);
    }

    /** 迁移置空（幂等）。供持有者显式重路由 formal 时经 retireWithReplacement 调用。 */
    public retire(id: number): void {
        if (!this.retiredIds.has(id) && this.inner.get(id) !== undefined) {
            this.retiredIds.add(id);
            this.inner.removeAt(id);
        }
    }

    /** 迁移置空 + 记录 formal 归宿（幂等；重复调用以首次记录为准）。 */
    public retireWithReplacement(id: number, formalId: number): void {
        this.retire(id);
        if (!this.replacements.has(id)) {
            this.replacements.set(id, formalId);
        }
    }

    /** 查询迁移记录的 formal 归宿。-1 = 无记录（未迁移或 clear 后重置）。 */
    public getReplacement(id: number): number {
        return this.replacements.get(id) ?? -1;
    }

    /**
     * 未迁移量（去洞活数）= inner.size() - retiredIds.size。
     * Named liveCount (not size) on purpose: the composed Canonicalizer.size() returns the
     * dense extent (holes included) — same name, opposite semantics silently breaks any
     * loop bound or capacity check that treats the two as interchangeable containers.
     * 三数自洽：totalRegistered = liveCount + retired。
     */
    public liveCount(): number {
        return this.inner.size() - this.retiredIds.size;
    }

    /** 历史注册总量 = inner.size()（含已置空）。 */
    public totalRegistered(): number {
        return this.inner.size();
    }

    /** 已迁移总量 = retiredIds.size。三数自洽：totalRegistered = liveCount + retired。 */
    public retired(): number {
        return this.retiredIds.size;
    }

    /** 全区间审计视图：[0, totalRegistered) 的全部 ID（含已置空——可经 getReplacement 追溯归宿）。 */
    public registeredIds(): number[] {
        const ids: number[] = [];
        for (let i = 0; i < this.inner.size(); i++) {
            ids.push(i);
        }
        return ids;
    }

    /** 遗留视图：未迁移（非空 slot）的 ID 集。 */
    public liveIds(): number[] {
        const ids: number[] = [];
        for (let i = 0; i < this.inner.size(); i++) {
            if (!this.retiredIds.has(i) && this.inner.get(i) !== undefined) {
                ids.push(i);
            }
        }
        return ids;
    }

    /** 索引表统计（同步即精确）。 */
    public getStats(): { liveCount: number; totalRegistered: number; retiredCount: number; replacedCount: number } {
        return {
            liveCount: this.liveCount(),
            totalRegistered: this.inner.size(),
            retiredCount: this.retiredIds.size,
            replacedCount: this.replacements.size,
        };
    }

    /** 清空：委托 inner.clear（Symbol 清理 + 换新 Symbol + 重置），追加本层状态重置。 */
    public clear(): void {
        this.inner.clear();
        this.retiredIds.clear();
        this.replacements.clear();
    }
}
