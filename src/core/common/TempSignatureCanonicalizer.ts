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
 * 弱引用的最小形态（ES2021 WeakRef；本项目 target 为 es2016 未含其 lib，
 * 运行时 Node 14+ 原生支持，此处仅补类型）。
 */
interface MinimalWeakRef<T extends object> {
    deref(): T | undefined;
}
type WeakRefCtorType = new <T extends object>(target: T) => MinimalWeakRef<T>;
const WeakRefCtor: WeakRefCtorType = (globalThis as unknown as { WeakRef: WeakRefCtorType }).WeakRef;

/**
 * 临时签名的弱注册表（弱引用语义）。
 *
 * 设计（替换原"引用语义 + refcount"模型——该模型的 refcount 在推断期 Type 替换
 * 丢弃路径上无增减闭环，计数虚高且 canonicalizer 强引用签名对象导致内存泄漏）：
 *
 * 1. ID 挂在签名对象的 symbol 属性上（对象自带键）：
 *    - register(sig) 的 sig 必为活对象——symbol 命中即"我注册过"，复用 ID 安全；
 *    - 死槽只出现在 refs 数组（WeakRef deref 为 undefined），新 register 永不
 *      命中死槽，无"B 复用 A 的 ID 导致错误共享"风险。
 *
 * 2. refs 数组持 WeakRef（非强引用）：最后一个持有者（Type/Signature 对象自身
 *    强引用签名实例作为锚点）死亡后，签名对象可被 GC 回收——内存泄漏根治。
 *
 * 3. size() 为主动清扫式：全表 deref，死槽置 undefined，返回精确存活量。
 *    存活量 = 仍被持有者锚定的未解析签名数（含 Builtin stubCache 常驻基线——
 *    共享 stub 被缓存强引用，SDK 解析后仍计入）。注意 KeepDuringJob 语义：
 *    清扫会把对象钉活至当前 GC job 结束，调用频率应保持低（推断结束 1 次）。
 *
 * 3b. 两层内存真相（读数解读，机制实证）：
 *    - 死 stub 的堆内存：WeakRef 不阻止回收——对象被判死后首次 major GC 即
 *      释放（这部分内存始终是及时释放的）；
 *    - WeakRef 条目（读数）：条目清空发生在 GC 之后的 job 边界（V8
 *      ClearKeptObjects）——同步时点（如推断刚结束）的 live 读数是含
 *      pending-dead 的上界；促使条目清理见 Registry.settleTempSpaces
 *      （--expose-gc 进程下多轮 gc × 跨 job 边界，机制验证的最小充分手段）。
 *
 * 4. 归因预留：弱注册表只回答"该签名现在是否存活"，不回答"谁在持有"（JS 语言
 *    无引用自省）。清扫后的存活集是未来 debugTempUsage(sigId) 反向扫描
 *    （遍历存活 model 的 locals/fields/返回类型，命中即持有者，
 *    经 Local.getUsedStmts() 归因到 stmt）的精确输入集——refcount 模型因虚高
 *    提供不了这个集合。
 */
export class TempSignatureCanonicalizer<S extends object> {
    private idSymbol: symbol = Symbol('ArkAnalyzerTempSigId');
    /** ID → 弱引用（死槽为 undefined，不复用）。 */
    private refs: (MinimalWeakRef<S> | undefined)[] = [];

    /**
     * 注册签名对象：同一实例重复注册复用同一 ID；新实例分配新 ID。
     * sig 必为活对象（方法入参），因此 symbol 命中即可安全复用。
     */
    public register(sig: S): number {
        const keyed = sig as { [key: symbol]: number | undefined };
        const existing = keyed[this.idSymbol];
        if (existing !== undefined) {
            // 该实例注册过且仍持有效弱引用（实例活着，WeakRef 必未死）。
            return existing;
        }
        const id = this.refs.length;
        keyed[this.idSymbol] = id;
        this.refs.push(new WeakRefCtor<S>(sig));
        return id;
    }

    /**
     * 按 ID 取签名对象。对象已被 GC 回收时返回 undefined（死槽）。
     */
    public get(id: number): S | undefined {
        return this.refs[id]?.deref();
    }

    /**
     * 查询签名对象的 tempSigID，不注册。未注册返回 -1。
     */
    public getExistingTempId(sig: S): number {
        const keyed = sig as { [key: symbol]: number | undefined };
        const existing = keyed[this.idSymbol];
        return existing === undefined ? -1 : existing;
    }

    /**
     * 精确存活量：主动清扫全表（死槽置 undefined），返回仍存活（被持有者锚定）
     * 的签名数。低频调用（推断结束后检查用）。
     */
    public size(): number {
        return this.sweep();
    }

    /**
     * 历史注册总量（含已回收），调试用途。
     */
    public totalRegistered(): number {
        return this.refs.length;
    }

    /**
     * 弱注册表统计（与 size() 共用同一次清扫，避免双重钉活对象）：
     * - liveCount：存活（仍被锚定）的签名数——含 Builtin stub 池等常驻基线；
     * - totalRegistered：历史注册总量（含已回收）；
     * - deadSlots：死槽数（total − live）——大于 0 即发生过 GC 回收的证据，
     *   反映回收活跃度（与 liveCount 联合解读：live 高 dead 低 = 真未解析多；
     *   dead 高 = 多数为已被推断替换丢弃的历史噪声）。
     */
    public getStats(): { liveCount: number; totalRegistered: number; deadSlots: number } {
        const liveCount = this.sweep();
        const total = this.refs.length;
        return { liveCount, totalRegistered: total, deadSlots: total - liveCount };
    }

    /** 单次清扫：死槽置 undefined，返回存活数。 */
    private sweep(): number {
        let liveCount = 0;
        for (let i = 0; i < this.refs.length; i++) {
            const ref = this.refs[i];
            if (ref !== undefined && ref.deref() === undefined) {
                this.refs[i] = undefined; // 死槽清理（位置不复用，见类注释）
            } else if (ref !== undefined) {
                liveCount++;
            }
        }
        return liveCount;
    }

    /**
     * 清空：活对象移除 symbol 属性，全部状态重置。
     */
    public clear(): void {
        for (const ref of this.refs) {
            const sig = ref?.deref();
            if (sig !== undefined) {
                delete (sig as { [key: symbol]: number | undefined })[this.idSymbol];
            }
        }
        this.refs = [];
        this.idSymbol = Symbol('ArkAnalyzerTempSigId');
    }
}
