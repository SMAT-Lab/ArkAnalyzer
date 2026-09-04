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

/**
 * 临时签名的索引表（三版，B 轮；替换二版的 WeakRef 弱注册表）。
 *
 * 设计演进：
 * - 一版（refcount）：Map<id, sig> + 引用计数——release 配对要求高、计数不精确
 *   （R10 共享场景 register 1 次持有 2~N 个），已退役；
 * - 二版（弱表）：Map<id, WeakRef> + FinalizationRegistry 三层自动销毁——GC 驱动
 *   的条目清理带 KeepDuringJob 时序不确定性，WeakRef/FR 对 V8 GC 有真实开销，
 *   已退役（round20/B 轮）；
 * - 三版（索引表，当前）：slot 数组强引用 + 单调 nextId + 显式 retire（迁移置空）
 *   + temp→formal 替换记录。持有者的存活锚点职责由 slot 统一接管（持有者锚删除
 *   随 B 轮批 2/3 落地——slot[id] === register 时的传入实例，取回逐字节等价）。
 *
 * 1. 存储结构：`slots: (S | undefined)[]`——下标即 tempSigID，强引用签名实例；
 *    置空（retire）= 已迁移。
 *    - ID 从 0 单调分配、永不复用（FieldSignature.hashCode 混入 tempSigID，
 *      复用会造成同值签名 hash 语义混乱）；
 *    - register(sig) 的 sig 必为活对象——symbol 属性命中即"我注册过"，复用 ID
 *      安全；retire 后 symbol 保留（审计追溯），同实例再次 register 返回原 ID
 *      （消费方经 getReplacement 直达 formal——"下一处直接使用 formal ID"）。
 *
 * 2. 生命周期（全保留，设计决策 §26.3）：未 retire 的 slot 永不强清——slot 是
 *    完整注册审计表（任何 temp ID 可追溯取回，弱表给不了的能力）。"推导中间
 *    垃圾"（持有者已死但未 retire 的条目）钉活到 Registry.dispose——内存代价
 *    知情权衡（量级压缩靠 A2 源头减量，非注册侧清理）。强引用下无自动清理是
 *    JS 根本约束（无 finalizer 可感知强可达对象的持有者消亡）。
 *
 * 3. 迁移与替换记录：retireWithReplacement(id, formalId) 在持有者显式重路由到
 *    formal 时调用（slot 置空 + replacements 记录 temp→formal 归宿）。共享该
 *    temp 签名的其他持有者（R10）经 getReplacement 找到 formal ID（三级查的
 *    fallback），或惰性物化写回自己的 formal SigID 字段（tempSigID 保留作
 *    "曾 temp"审计痕迹）。
 *
 * 4. 可观测性（同步即精确——无 pending-dead 窗口，settle 的 gc 轮次已退役）：
 *    三数自洽 totalRegistered = liveCount + retiredCount；liveIds（非空 slot
 *    遗留视图）/ registeredIds（全区间审计视图，含已置空——可经 getReplacement
 *    追溯归宿）/ replacedCount（有 formal 归宿记录的迁移数，≤ retired）。
 */
export class TempSignatureCanonicalizer<S extends object> {
    /** slot 数组：下标 = tempSigID，强引用；undefined = 已迁移（retire）。 */
    private slots: (S | undefined)[] = [];
    /** 单调递增的下一个 ID，永不复用（= 历史注册总量）。 */
    private nextId: number = 0;
    /** 未迁移（非空 slot）计数——register 新分配 ++ / retire 置空 --。 */
    private liveCount: number = 0;
    /** 已迁移（置空）计数。 */
    private retiredCount: number = 0;
    /** temp → formal 替换记录（迁移时的归宿），get(id) miss 时的 fallback。 */
    private replacements = new Map<number, number>();

    private idSymbol: symbol = Symbol('ArkAnalyzerTempSigId');

    /** 注册签名对象：同一实例重复注册复用同一 ID；新实例分配新 ID。 */
    public register(sig: S): number {
        const keyed = sig as { [key: symbol]: number | undefined };
        const existing = keyed[this.idSymbol];
        if (existing !== undefined) {
            return existing;
        }
        const id = this.nextId++;
        keyed[this.idSymbol] = id;
        this.slots[id] = sig;
        this.liveCount++;
        return id;
    }

    /**
     * 按 ID 取签名对象。已迁移（retire 置空）返回 undefined——消费方应查
     * {@link getReplacement} 获得 formal 归宿（三级查的 fallback）。
     */
    public get(id: number): S | undefined {
        return this.slots[id];
    }

    /**
     * 查询签名对象的 tempSigID，不注册。未注册返回 -1。
     * symbol 在 retire 后不清（实例属性，审计追溯保留）。
     */
    public getExistingTempId(sig: S): number {
        const keyed = sig as { [key: symbol]: number | undefined };
        const existing = keyed[this.idSymbol];
        return existing === undefined ? -1 : existing;
    }

    /** 迁移置空（幂等）。供持有者显式重路由 formal 时经 retireWithReplacement 调用。 */
    public retire(id: number): void {
        if (this.slots[id] !== undefined) {
            this.slots[id] = undefined;
            this.retiredCount++;
            this.liveCount--;
        }
    }

    /**
     * 迁移置空 + 记录 formal 归宿（幂等；重复调用以首次记录为准）。
     * 共享该 temp 签名的其他持有者经 {@link getReplacement} 拿到 formal ID。
     */
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
     * 未迁移（非空 slot）量——"最终遗留的 temp sig 数"（含推导中间垃圾与未成功
     * 推导的活签名；全保留语义下二者由审计视图区分归因）。
     */
    public size(): number {
        return this.liveCount;
    }

    /** 历史注册总量（= nextId，永不复用）。 */
    public totalRegistered(): number {
        return this.nextId;
    }

    /** 已迁移（置空）总量。三数自洽：totalRegistered = size + retired。 */
    public retired(): number {
        return this.retiredCount;
    }

    /** 全区间审计视图：[0, nextId) 的全部 ID（含已置空——可经 getReplacement 追溯归宿）。 */
    public registeredIds(): number[] {
        const ids: number[] = [];
        for (let i = 0; i < this.nextId; i++) {
            ids.push(i);
        }
        return ids;
    }

    /** 遗留视图：非空 slot 的 ID 集。 */
    public liveIds(): number[] {
        const ids: number[] = [];
        for (let i = 0; i < this.nextId; i++) {
            if (this.slots[i] !== undefined) {
                ids.push(i);
            }
        }
        return ids;
    }

    /**
     * 索引表统计（同步即精确）：
     * - liveCount：未迁移（非空 slot）的签名数；
     * - totalRegistered：历史注册总量（nextId）；
     * - retiredCount：已迁移（置空）总量——total = live + retired 三数自洽；
     * - replacedCount：有 formal 归宿记录的迁移数（≤ retired）。
     */
    public getStats(): { liveCount: number; totalRegistered: number; retiredCount: number; replacedCount: number } {
        return {
            liveCount: this.liveCount,
            totalRegistered: this.nextId,
            retiredCount: this.retiredCount,
            replacedCount: this.replacements.size,
        };
    }

    /**
     * 清空：活对象移除 symbol 属性，全部状态重置（ID 空间归零重用）。
     */
    public clear(): void {
        for (const sig of this.slots) {
            if (sig !== undefined) {
                delete (sig as { [key: symbol]: number | undefined })[this.idSymbol];
            }
        }
        this.slots = [];
        this.nextId = 0;
        this.liveCount = 0;
        this.retiredCount = 0;
        this.replacements = new Map();
        this.idSymbol = Symbol('ArkAnalyzerTempSigId');
    }
}
