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
 * + 稠密 ID + 数组存储）；本类仅追加 temp 空间独有的 retire（迁移置空）与替换记录。
 *
 * retire 状态与归宿记录合并存储在单个三态槽表 {@link retireSlots}（4B/ID）：
 * 0 = live；-1 = 已迁移无归宿；>0 = 已迁移且值为 formal 归宿（formalId ≥ 1，
 * 0 为 DEFAULT 不可作归宿）。读写判定共用一次数组读，两份状态由单写点保证同步。
 *
 * 生命周期（全保留）：未 retire 的条目永不清——完整注册审计表。"推导中间垃圾"
 * 钉活到 Registry.dispose——知情权衡（JS 无法感知强可达对象的持有者消亡）。
 * 三数自洽：totalRegistered（inner.size）= liveCount + retiredCount。
 */
export class TempSignatureCanonicalizer<S extends object> {
    /** objectIdentity 策略的注册/查ID/get/clear 核心（Symbol 幂等 + 稠密 ID + list 数组）。 */
    private readonly inner: Canonicalizer<S> = new Canonicalizer<S>();

    /**
     * 三态槽表（下标 = temp SigID）：0 = live；-1 = 已迁移无归宿；>0 = 已迁移，
     * 值为 formal 归宿。get/getReplacement 的判定共用此一次数组读。
     */
    private retireSlots = new Int32Array(1024);

    /** 注册签名对象：同一实例重复注册复用同一 ID；新实例分配新 ID。扩容保证槽表覆盖全部已分配 ID。 */
    public register(sig: S): number {
        const id = this.inner.getId(sig);
        this.ensureCapacity(id);
        return id;
    }

    /**
     * 按 ID 取签名对象。已迁移（三态槽非 0）返回 undefined——消费方应查
     * {@link getReplacement} 获得 formal 归宿（三级查的 fallback）。
     * register 的同步扩容保证已分配 ID 均在槽表界内；越界（未注册）与负 ID
     * 经 inner.get 返回 undefined。
     */
    public get(id: number): S | undefined {
        if (this.retireSlots[id] !== 0) {
            return undefined;
        }
        return this.inner.get(id);
    }

    /** 查询签名对象的 tempSigID，不注册。未注册返回 -1。Symbol 在 retire 后不清（审计追溯保留）。 */
    public getExistingTempId(sig: S): number {
        return this.inner.getExistingId(sig);
    }

    /**
     * 迁移置空（幂等）。合法性以 inner.size() 为权威上界（register 分配保证 id <
     * inner.size()，且 inner.size 只增不减）+ inner 槽有值才迁移。槽表覆盖全部已分配
     * ID 的不变式由 register 维护（分配即扩容），此处三态读界内安全。
     */
    public retire(id: number): void {
        if (id < 0 || id >= this.inner.size() || this.inner.get(id) === undefined) {
            return;
        }
        if (this.retireSlots[id] === 0) {
            this.retireSlots[id] = -1;
            this.inner.removeAt(id);
        }
    }

    /**
     * 迁移置空 + 记录 formal 归宿（幂等；重复调用以首次记录为准——槽为 -1 才写入，
     * 已 >0 不覆盖）。live 时先经 {@link retire} 迁移；从未注册的 ID 不记录归宿
     * （live 态写归宿会污染 get 判定）。
     */
    public retireWithReplacement(id: number, formalId: number): void {
        this.retire(id);
        if (this.retireSlots[id] === -1) {
            this.retireSlots[id] = formalId;
        }
    }

    /** 查询迁移记录的 formal 归宿。-1 = 无记录（未迁移 / 已迁移无归宿）。 */
    public getReplacement(id: number): number {
        return this.retireSlots[id] > 0 ? this.retireSlots[id] : -1;
    }

    /**
     * 未迁移量（去洞活数）= totalRegistered() - retiredCount()。
     * Named liveCount (not size) on purpose: the composed Canonicalizer.size() returns the
     * dense extent (holes included) — same name, opposite semantics silently breaks any
     * loop bound or capacity check that treats the two as interchangeable containers.
     * 三数自洽：totalRegistered = liveCount + retired。
     */
    public liveCount(): number {
        return this.totalRegistered() - this.retiredCount();
    }

    /** 累计注册总量 = inner.size()（含已置空）。 */
    public totalRegistered(): number {
        return this.inner.size();
    }

    /** 已迁移总量 = 三态槽表非零槽数。三数自洽：totalRegistered = liveCount + retired。 */
    public retired(): number {
        return this.retiredCount();
    }

    /** 全区间审计视图：[0, totalRegistered) 的全部 ID（含已置空——可经 getReplacement 追溯归宿）。 */
    public registeredIds(): number[] {
        const ids: number[] = [];
        for (let i = 0; i < this.inner.size(); i++) {
            ids.push(i);
        }
        return ids;
    }

    /** 未迁移（非空 slot）的 ID 集视图。 */
    public liveIds(): number[] {
        const ids: number[] = [];
        for (let i = 0; i < this.inner.size(); i++) {
            if (this.retireSlots[i] === 0 && this.inner.get(i) !== undefined) {
                ids.push(i);
            }
        }
        return ids;
    }

    /** 索引表统计（同步即精确；计数为遍历槽表，仅 statistics 低频调用）。 */
    public getStats(): { liveCount: number; totalRegistered: number; retiredCount: number; replacedCount: number } {
        return {
            liveCount: this.liveCount(),
            totalRegistered: this.totalRegistered(),
            retiredCount: this.retiredCount(),
            replacedCount: this.replacedCount(),
        };
    }

    /** 清空：委托 inner.clear（Symbol 清理 + 换新 Symbol + 重置），追加本层状态重置。 */
    public clear(): void {
        this.inner.clear();
        this.retireSlots = new Int32Array(1024);
    }

    private retiredCount(): number {
        let count = 0;
        for (let i = 0; i < this.retireSlots.length; i++) {
            if (this.retireSlots[i] !== 0) {
                count++;
            }
        }
        return count;
    }

    private replacedCount(): number {
        let count = 0;
        for (let i = 0; i < this.retireSlots.length; i++) {
            if (this.retireSlots[i] > 0) {
                count++;
            }
        }
        return count;
    }

    /**
     * 扩容。唯一调用点是 register（分配即扩容）——维护"槽表覆盖全部已分配 ID"
     * 的不变式，所有读点的三态判定由此界内安全。快速路径一次下标比较；慢路径按
     * inner.size ×1.1 前瞻扩容（推导期约 5% 的注册增长被余量直接吸收，全程零再扩容）。
     */
    private ensureCapacity(requiredIdx: number): void {
        if (requiredIdx < this.retireSlots.length) {
            return;
        }
        const newLength = Math.ceil(this.inner.size() * 1.1);
        const next = new Int32Array(newLength);
        next.set(this.retireSlots);
        this.retireSlots = next;
    }
}
