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

import { SignatureCanonicalizerRegistry } from './SignatureCanonicalizerRegistry';
import { FileSignature, NamespaceSignature, ClassSignature, FieldSignature, MethodSignature, AliasClassSignature } from '../model/ArkSignature';
import { ArkFile } from '../model/ArkFile';
import { ArkNamespace } from '../model/ArkNamespace';
import { ArkClass } from '../model/ArkClass';
import { ArkField } from '../model/ArkField';
import { AliasType, ArrayType, ClassType, EnumValueType, FunctionType, IntersectionType, LexicalEnvType, TupleType, Type, UnionType } from '../base/Type';
import { AbstractInvokeExpr } from '../base/Expr';
import { AbstractFieldRef, GlobalRef } from '../base/Ref';
import { TempSignatureCanonicalizer } from './TempSignatureCanonicalizer';
import { Canonicalizable } from './SignatureCanonicalizer';
import Logger, { LOG_MODULE_TYPE } from '../../utils/logger';

const logger = Logger.getLogger(LOG_MODULE_TYPE.ARKANALYZER, 'CanonicalizerValidator');

/**
 * 签名 canonicalizer 的内部结构校验器（仅开发调试用）。
 *
 * 每个 formal 空间的校验规则互不相同（class 空间存在别名折叠语义、method 空间存在
 * declare-only 合法无 model 条目等），因此各空间独立实现各自的 validateXxxSpace，
 * 不做统一泛型模板；待多个空间落地后若出现真实重复，再抽取公共部分。
 *
 * 通过 `SceneOptions.validateCanonicalizers` 开启（默认关闭）。
 */
export class CanonicalizerValidator {
    /**
     * 校验 formal file 空间的结构不变量，规则如下：
     *
     * R1a  DEFAULT 保留位契约（正向断言）：ID 0 必须存在 DEFAULT 签名条目。
     *      缺失说明 registry 初始化损坏（internDefaults 未执行或被破坏）。
     *
     * R1b  DEFAULT 保留位契约（正向断言）：ID 0 的 model 必须为 undefined。
     *      models[0] 设计上永久空置（registerFile 有 id > 0 守卫）；若被绕过守卫
     *      直接 setModel(0, ...) 挂载，视为保留位被侵占。
     *
     * R2   ID 稠密性：[1, size) 内每个 ID 都必须有签名条目。
     *      出现空洞说明条目结构损坏（理论上不可达，防御性检查）。
     *
     * R3   model 完备性：[1, size) 内每个 ID 必须有对应的 ArkFile model。
     *      两种可能来路：① disposeModule 驱逐态（removeFile 删 model 留 sig，合法、
     *      可 reload 自愈）；② 新代码引入的空洞（bug）。本工具不区分二者，
     *      全部报告，由开发者结合场景判断。
     *
     * R4   model 回指一致性：挂载在 ID i 的 ArkFile，其 getFileSigID() 必须等于 i。
     *      回指不一致会导致查询路径走 stale 兜底（error 日志 + 返回 DEFAULT）。
     *
     * R5   签名值唯一性：任意两个不同 ID 不得持有 equals() 相等的签名。
     *      canonicalizer 本身按 hash+equals 去重，正常情况下同值必同 ID；本规则
     *      违规当且仅当 hash/equals 契约破裂（如给 FileSignature 加字段进了 equals
     *      忘了进 hash）。契约保证"equals 相等 → hash 相等"，故违规对必落在同一
     *      hash 分组内，按 hashCode 分组后组内两两比较即可，均摊 O(n)。
     *      ID 0 的 DEFAULT 签名参与分组比较——这是值域坍缩不变量的守卫：所有用
     *      UNKNOWN 常量（%unk/%unk）构造的签名必须 intern 到 ID 0，不得出现第二个。
     *
     * R6   model 挂载唯一性：同一 ArkFile 实例不得挂载于多个 ID。
     *      双挂载意味着模型索引错乱，Scene.getFile 查询结果将不一致。
     *
     * R7   project/SDK ID 边界一致性（仅边界已设置时检查，见
     *      SignatureCanonicalizerRegistry.markProjectFileBoundary）：
     *      [1, first) 内有 model 的 ID，其 isProjectFile() 必须为 false；
     *      [first, size) 内有 model 的 ID，其 isProjectFile() 必须为 true。
     *      违反说明构建时序回归（如边界设置后仍有 SDK 文件注册）或 ArkFile 的
     *      projectFile 标志被误标。ID 0（DEFAULT）不参与本规则。
     *
     * 执行语义：所有规则全量执行、任何违规不中断；违规逐条收集（规则号 + ID +
     * 签名描述），一次性汇总报告——无论违规多少都给出完整清单。全部规则均为
     * error 级：任何一条违规即意味着某项不变量被打破。
     *
     * @returns 全部违规描述（空数组 = 空间干净）。
     */
    public static validateFileSpace(): string[] {
        const violations: string[] = [];
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const canonicalizer = reg.fileSigCanonicalizer;
        // R5 辅助结构：按缓存的 hashCode 分组签名。
        const byHash: Map<number, { id: number; sig: FileSignature }[]> = new Map();
        // R6 辅助结构：已见过的 model 实例，用于检测双挂载。
        const seenModels: Set<ArkFile> = new Set();

        const defaultSig = canonicalizer.get(0);
        if (defaultSig === undefined) {
            // R1a
            violations.push(`[file] R1a: ID 0 has no signature entry — the DEFAULT reserved slot is missing`);
        } else {
            // R1b
            if (canonicalizer.getModel(0) !== undefined) {
                violations.push(`[file] R1b: ID 0 (DEFAULT slot) unexpectedly holds a model`);
            }
            byHash.set(defaultSig.getHashCode(), [{ id: 0, sig: defaultSig }]);
        }

        const size = canonicalizer.size();
        // R7 边界：循环外取一次。
        const boundary = reg.getFirstProjectFileSigID();
        for (let id = 1; id < size; id++) {
            const sig = canonicalizer.get(id);
            if (sig === undefined) {
                // R2
                violations.push(`[file] R2: ID ${id} is inside [0, size=${size}) but has no signature entry`);
                continue;
            }

            // R5（累积）
            let group = byHash.get(sig.getHashCode());
            if (group === undefined) {
                group = [];
                byHash.set(sig.getHashCode(), group);
            }
            group.push({ id, sig });

            const model = canonicalizer.getModel(id);
            if (model === undefined) {
                // R3
                violations.push(`[file] R3: ID ${id} (${sig.toString()}) has no model`);
                continue;
            }

            // R4
            const back = model.getFileSigID();
            if (back !== id) {
                violations.push(`[file] R4: model at ID ${id} (${sig.toString()}) back-points to ${back}`);
            }

            // R6
            if (seenModels.has(model)) {
                violations.push(`[file] R6: model at ID ${id} (${sig.toString()}) is mounted at more than one ID`);
            } else {
                seenModels.add(model);
            }

            // R7
            if (boundary !== -1) {
                const expectedProject = id >= boundary;
                if (model.isProjectFile() !== expectedProject) {
                    violations.push(
                        `[file] R7: ID ${id} (${sig.toString()}) is ${model.isProjectFile() ? 'a project file' : 'an SDK file'} ` +
                            `but sits ${expectedProject ? 'at/after' : 'before'} the project/SDK boundary ${boundary}`
                    );
                }
            }
        }

        // R5（检查）：组内两两 equals。分组大小几乎恒为 1，均摊 O(n)。
        for (const group of byHash.values()) {
            for (let i = 0; i < group.length; i++) {
                for (let j = i + 1; j < group.length; j++) {
                    if (group[i].sig.equals(group[j].sig)) {
                        violations.push(
                            `[file] R5: IDs ${group[i].id} and ${group[j].id} hold equal signatures ` +
                                `(${group[i].sig.toString()}) — hash/equals contract broken`
                        );
                    }
                }
            }
        }

        return violations;
    }

    /**
     * 校验 formal namespace 空间的结构不变量，规则如下：
     *
     * N1a  DEFAULT 保留位契约（正向断言）：ID 0 必须存在 DEFAULT 签名条目。
     *
     * N1b  DEFAULT 保留位契约（正向断言）：ID 0 的 model 必须为 undefined。
     *
     * N2   ID 稠密性：[1, size) 内每个 ID 都必须有签名条目。
     *
     * N3   model 完备性：[1, size) 内每个 ID 必须有对应的 ArkNamespace model。
     *      两种可能来路：① disposeModule 驱逐态（removeNamespace 删 model 留 sig，
     *      合法、可 reload 自愈）；② 签名值仅被惰性 intern（NamespaceSignature.
     *      getNamespaceSigID）而无真实 ArkNamespace 注册——ArkNamespace.setSignature
     *      已带自愈补挂，出现即为新路径逃逸。全部报告，由开发者结合场景判断。
     *
     * N4   model 回指一致性：挂载在 ID i 的 ArkNamespace，其 getNamespaceSigID()
     *      必须等于 i。
     *
     * N5   签名值唯一性：任意两个不同 ID 不得持有 equals() 相等的签名（守卫
     *      hash/equals 契约与 DEFAULT 值域坍缩；原理同 file 空间 R5）。
     *
     * N6   model 挂载唯一性：同一 ArkNamespace 实例不得挂载于多个 ID。
     *
     * N7   链完整性（仅对 model 存活的条目检查；驱逐态条目的链检查跳过——N3 已
     *      报告其驱逐，父/子链完整性以存活侧为准）：
     *      N7a  嵌套 ns：declaringNamespaceSigID 非 undefined 时，父 namespace 的
     *          model 必须存在（disposeModule 同文件整树驱逐，父驱逐子存活 = 驱逐
     *          不完整或手工构造逃逸）；
     *      N7b  嵌套 ns：父 model 的 top 列表必须含本 ID（父子互联正确）；
     *      N7c  顶层 ns：declaringNamespaceSigID 为 undefined 时，declaring file
     *          的 model 必须存在且其 top 列表含本 ID（file 侧互联正确）。
     *
     * 执行语义：所有规则全量执行、任何违规不中断；违规逐条收集（规则号 + ID +
     * 签名描述），一次性汇总报告。全部规则均为 error 级。
     *
     * @returns 全部违规描述（空数组 = 空间干净）。
     */
    public static validateNamespaceSpace(): string[] {
        const violations: string[] = [];
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const canonicalizer = reg.namespaceSigCanonicalizer;
        // N5 辅助结构：按缓存的 hashCode 分组签名。
        const byHash: Map<number, { id: number; sig: NamespaceSignature }[]> = new Map();
        // N6 辅助结构：已见过的 model 实例，用于检测双挂载。
        const seenModels: Set<ArkNamespace> = new Set();

        const defaultSig = canonicalizer.get(0);
        if (defaultSig === undefined) {
            // N1a
            violations.push(`[namespace] N1a: ID 0 has no signature entry — the DEFAULT reserved slot is missing`);
        } else {
            // N1b
            if (canonicalizer.getModel(0) !== undefined) {
                violations.push(`[namespace] N1b: ID 0 (DEFAULT slot) unexpectedly holds a model`);
            }
            byHash.set(defaultSig.getHashCode(), [{ id: 0, sig: defaultSig }]);
        }

        const size = canonicalizer.size();
        for (let id = 1; id < size; id++) {
            const sig = canonicalizer.get(id);
            if (sig === undefined) {
                // N2
                violations.push(`[namespace] N2: ID ${id} is inside [0, size=${size}) but has no signature entry`);
                continue;
            }

            // N5（累积）
            let group = byHash.get(sig.getHashCode());
            if (group === undefined) {
                group = [];
                byHash.set(sig.getHashCode(), group);
            }
            group.push({ id, sig });

            const model = canonicalizer.getModel(id);
            if (model === undefined) {
                // N3
                violations.push(`[namespace] N3: ID ${id} (${sig.toString()}) has no model`);
                continue;
            }

            // N4
            const back = model.getNamespaceSigID();
            if (back !== id) {
                violations.push(`[namespace] N4: model at ID ${id} (${sig.toString()}) back-points to ${back}`);
            }

            // N6
            if (seenModels.has(model)) {
                violations.push(`[namespace] N6: model at ID ${id} (${sig.toString()}) is mounted at more than one ID`);
            } else {
                seenModels.add(model);
            }

            // N7a/N7b/N7c（仅存活条目）
            const parentSigID = sig.getDeclaringNamespaceSigID();
            if (parentSigID !== undefined) {
                const parentModel = canonicalizer.getModel(parentSigID);
                if (parentModel === undefined) {
                    // N7a
                    violations.push(`[namespace] N7a: ID ${id} (${sig.toString()}) has parent SigID ${parentSigID} with no model`);
                } else if (!parentModel.hasTopNamespaceWithID(id)) {
                    // N7b
                    violations.push(`[namespace] N7b: ID ${id} (${sig.toString()}) is not in parent ${parentSigID}'s top-namespace list`);
                }
            } else {
                const fileModel: ArkFile | undefined = reg.fileSigCanonicalizer.getModel(sig.getDeclaringFileSigID());
                if (fileModel === undefined) {
                    // N7c
                    violations.push(
                        `[namespace] N7c: top-level ID ${id} (${sig.toString()}) has declaring file SigID ${sig.getDeclaringFileSigID()} with no model`
                    );
                } else if (!fileModel.hasTopNamespaceWithID(id)) {
                    // N7c
                    violations.push(`[namespace] N7c: top-level ID ${id} (${sig.toString()}) is not in its declaring file's top-namespace list`);
                }
            }
        }

        // N5（检查）：组内两两 equals。分组大小几乎恒为 1，均摊 O(n)。
        for (const group of byHash.values()) {
            for (let i = 0; i < group.length; i++) {
                for (let j = i + 1; j < group.length; j++) {
                    if (group[i].sig.equals(group[j].sig)) {
                        violations.push(
                            `[namespace] N5: IDs ${group[i].id} and ${group[j].id} hold equal signatures ` +
                                `(${group[i].sig.toString()}) — hash/equals contract broken`
                        );
                    }
                }
            }
        }

        return violations;
    }

    /**
     * 校验 formal class 空间的结构不变量，规则如下：
     *
     * C1a  DEFAULT 保留位契约（正向断言）：ID 0 必须存在 DEFAULT 签名条目。
     *
     * C1b  DEFAULT 保留位契约（正向断言）：ID 0 的 model 必须为 undefined。
     *
     * C2   ID 稠密性：[1, size) 内每个 ID 都必须有签名条目（防御性检查）。
     *
     * C3   model 完备性：[1, size) 内每个 ID 必须有对应的 ArkClass model。
     *      两种可能来路：① disposeModule 驱逐态（removeClassModel 删 model 留
     *      sig，合法、可 reload 自愈）；② 显式 getId intern 无 model——生产路径
     *      已随 ClassType 路由重构（formal 只读命中 / temp 弱注册兜底）清零，
     *      formal 空间写入点收敛为 internDefaults + ArkClass.setSignature，出现
     *      即为 tests 手工构造或未来新代码逃逸（ArkClass.setSignature 的
     *      existing≥0 分支不注册语义由本规则持续守护）。全部报告，开发者判别。
     *
     * C4   model 回指一致性：挂载在 ID i 的 ArkClass，其 getClassSigID() 必须
     *      等于 i。
     *
     * C5   签名值唯一性：任意两个不同 ID 不得持有 equals() 相等的签名（守卫
     *      hash/equals 契约与 DEFAULT 值域坍缩；原理同 file R5）。
     *      注：U+（display 归一化）后 AliasClassSignature 的 aliasName **参与**
     *      equals/hash——alias 是独立 formal 条目（同 aliasName+同 origin 维度
     *      折叠、异名/与 origin 互不相等），本规则即守护该独立 ID 语义（两个
     *      alias ID 值相等 = 契约破坏）。
     *
     * C6   model 挂载唯一性：同一 ArkClass 实例不得挂载于多个 ID。
     *
     * C7   挂载链完整性（仅对 model 存活条目检查；驱逐态条目链检查跳过——C3 已
     *      报告其驱逐，链完整性以存活侧为准；单 Scene 单次构建生命周期声明覆盖）：
     *      C7a  嵌套类：declaringNamespaceSigID 非 undefined 时，父 namespace
     *           的 model 必须存在（父驱逐子存活 = 驱逐不完整或手工构造逃逸）；
     *      C7b  嵌套类：父 ns 的 topClass 列表必须含本 ID（hasTopClassWithID）；
     *      C7c  顶层类：declaring file 的 model 必须存在且其 topClass 列表
     *           含本 ID。
     *
     * 执行语义：所有规则全量执行、任何违规不中断；违规逐条收集（规则号 + ID +
     * 签名描述），一次性汇总报告。全部规则均为 error 级。
     *
     * @returns 全部违规描述（空数组 = 空间干净）。
     */
    public static validateClassSpace(): string[] {
        const violations: string[] = [];
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const canonicalizer = reg.classSigCanonicalizer;
        // C5 辅助结构：按缓存的 hashCode 分组签名。
        const byHash: Map<number, { id: number; sig: ClassSignature }[]> = new Map();
        // C6 辅助结构：已见过的 model 实例，用于检测双挂载。
        const seenModels: Set<ArkClass> = new Set();

        const defaultSig = canonicalizer.get(0);
        if (defaultSig === undefined) {
            // C1a
            violations.push(`[class] C1a: ID 0 has no signature entry — the DEFAULT reserved slot is missing`);
        } else {
            // C1b
            if (canonicalizer.getModel(0) !== undefined) {
                violations.push(`[class] C1b: ID 0 (DEFAULT slot) unexpectedly holds a model`);
            }
            byHash.set(defaultSig.getHashCode(), [{ id: 0, sig: defaultSig }]);
        }

        const size = canonicalizer.size();
        for (let id = 1; id < size; id++) {
            const sig = canonicalizer.get(id);
            if (sig === undefined) {
                // C2
                violations.push(`[class] C2: ID ${id} is inside [0, size=${size}) but has no signature entry`);
                continue;
            }

            // C5（累积）
            let group = byHash.get(sig.getHashCode());
            if (group === undefined) {
                group = [];
                byHash.set(sig.getHashCode(), group);
            }
            group.push({ id, sig });

            const model = canonicalizer.getModel(id);
            if (model === undefined) {
                // C3
                violations.push(`[class] C3: ID ${id} (${sig.toString()}) has no model`);
                continue;
            }

            // U+（display 归一化）：alias 条目（AliasClassSignature 一等 formal 签名）
            // 按设计双注册 origin 的 ArkClass model——C4 的回指（model.getClassSigID()
            // 指向 origin ID）、C6 的多 ID 挂载（origin model 同时挂 origin/alias ID）、
            // C7 的挂载链（父 ns/顶层 file 的 top-class 列表只含 origin ID）均为合法
            // 共享形态（round12 declare 全槽同构）；origin 条目自身的 C4/C6/C7 检查
            // 照常执行，模型一致性由其守护。
            const isAliasEntry = sig instanceof AliasClassSignature;

            // C4
            const back = model.getClassSigID();
            if (!isAliasEntry && back !== id) {
                violations.push(`[class] C4: model at ID ${id} (${sig.toString()}) back-points to ${back}`);
            }

            // C6
            if (!isAliasEntry) {
                if (seenModels.has(model)) {
                    violations.push(`[class] C6: model at ID ${id} (${sig.toString()}) is mounted at more than one ID`);
                } else {
                    seenModels.add(model);
                }
            }

            // C7a/C7b/C7c（仅存活条目；alias 条目豁免——挂载链以 origin 条目为准）
            const parentSigID = sig.getDeclaringNamespaceSigID();
            if (!isAliasEntry && parentSigID !== undefined) {
                const parentModel = reg.namespaceSigCanonicalizer.getModel(parentSigID);
                if (parentModel === undefined) {
                    // C7a
                    violations.push(`[class] C7a: ID ${id} (${sig.toString()}) has declaring namespace SigID ${parentSigID} with no model`);
                } else if (!parentModel.hasTopClassWithID(id)) {
                    // C7b
                    violations.push(`[class] C7b: ID ${id} (${sig.toString()}) is not in parent namespace ${parentSigID}'s top-class list`);
                }
            } else if (!isAliasEntry) {
                const fileModel: ArkFile | undefined = reg.fileSigCanonicalizer.getModel(sig.getDeclaringFileSigID());
                if (fileModel === undefined) {
                    // C7c
                    violations.push(
                        `[class] C7c: top-level ID ${id} (${sig.toString()}) has declaring file SigID ${sig.getDeclaringFileSigID()} with no model`
                    );
                } else if (!fileModel.hasTopClassWithID(id)) {
                    // C7c
                    violations.push(`[class] C7c: top-level ID ${id} (${sig.toString()}) is not in its declaring file's top-class list`);
                }
            }
        }

        // C5（检查）：组内两两 equals。分组大小几乎恒为 1，均摊 O(n)。
        for (const group of byHash.values()) {
            for (let i = 0; i < group.length; i++) {
                for (let j = i + 1; j < group.length; j++) {
                    if (group[i].sig.equals(group[j].sig)) {
                        violations.push(
                            `[class] C5: IDs ${group[i].id} and ${group[j].id} hold equal signatures ` +
                                `(${group[i].sig.toString()}) — hash/equals contract broken`
                        );
                    }
                }
            }
        }

        return violations;
    }

    /**
     * 校验 formal field 空间的结构不变量，规则如下：
     *
     * F1a  DEFAULT 保留位契约（正向断言）：ID 0 必须存在 DEFAULT 签名条目。
     *
     * F1b  DEFAULT 保留位契约（正向断言）：ID 0 的 model 必须为 undefined。
     *
     * F2   ID 稠密性：[1, size) 内每个 ID 都必须有签名条目（防御性检查）。
     *
     * F3   model 完备性：[1, size) 内每个 ID 必须有对应的 ArkField model。
     *      两种可能来路：① 驱逐态（disposeModule / pruneNonKeptClasses 的
     *      removeField 删 model 留 sig，合法、reload 由 addField 兜底自愈——
     *      窗口期报告属预期）；② 引用侧 namespace 声明签名（genFieldSignature
     *      等构造的 ns 重载，无 ArkField model，值语义合法形态）及未来新代码
     *      逃逸。全部报告，由开发者结合场景判断。
     *
     * F4   model 回指一致性：挂载在 ID i 的 ArkField，其 getFieldSigID() 必须
     *      等于 i（field 单轨——无 method 空间的 impl/declare 双槽复杂度）。
     *
     * F4b  双侧声明类一致性：model.getDeclaringClassID() 必须等于
     *      sig.getDeclaringClassSigID()（ArkField 与 FieldSignature 独立维护
     *      两处 declaring ClassSigID，能抓 builder 不一致 bug）。
     *      注意 breakInternalReferences 将 declaringClassID 置 -1 的窗口形态
     *      （unload 后半，model 残留期）——该形态同时被 F3（若 model 已删）
     *      或本规则（model 仍在但 ID=-1）捕获，属驱逐窗口预期报告。
     *
     * F5   签名值唯一性：任意两个不同 ID 不得持有 equals() 相等的签名
     *      （hash 分组 + 组内两两比较；ID 0 种入守卫 DEFAULT 值域坍缩）。
     *      注记：type 不参与身份（equals/hashCode 只含 fieldName + staticFlag +
     *      四个 declaring SigID）；setType/setStaticFlag 可在 intern 后原地改值
     *      且不重算 hash（hash-equal 是 equals-equal 的合法超集，算法不受影响）。
     *
     * F6   model 挂载唯一性：同一 ArkField 实例不得挂载于多个 ID（按 model 槽
     *      唯一口径——AbcInference 同名重复推断产生的非 model 别名实例是值语义
     *      合法形态，不属违规）。
     *
     * F7   挂载链完整性（仅对 model 存活条目检查）：
     *      F7a  declaring class 的 model 必须存在（class 驱逐后 field 存活 =
     *           驱逐不完整——P0 修复后此形态应仅出现在合法驱逐窗口之外）；
     *      F7b  该 class 的字段索引必须含本 ID：hasTopFieldWithID(i) ||
     *           hasTopStaticFieldWithID(i)——联合判定（不区分数组）：index
     *           signature 存在签名 staticFlag=true 但按 modifier tag 挂实例
     *           数组的既有不一致形态，联合判定免误报。
     *      注记：model 侧不存在 namespace 声明的 ArkField（ns 声明签名仅在
     *      引用侧，无 F7 的 ns 分支）；查询走 sig.getDeclaringClassSigID()
     *      formal 直查（不经 declaringSignatureDisplay——U+ 后 declaringClass
     *      为 AliasClassSignature 时 SigID 是独立的 alias ID，formal 直查命中
     *      alias 条目，display 仅影响展示）。
     *
     * 执行语义：所有规则全量执行、任何违规不中断；违规逐条收集（规则号 + ID +
     * 签名描述），一次性汇总报告。全部规则均为 error 级。
     *
     * @returns 全部违规描述（空数组 = 空间干净）。
     */
    public static validateFieldSpace(): string[] {
        const violations: string[] = [];
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const canonicalizer = reg.fieldSigCanonicalizer;
        // F5 辅助结构：按缓存的 hashCode 分组签名。
        const byHash: Map<number, { id: number; sig: FieldSignature }[]> = new Map();
        // F6 辅助结构：已见过的 model 实例，用于检测双挂载。
        const seenModels: Set<ArkField> = new Set();

        const defaultSig = canonicalizer.get(0);
        if (defaultSig === undefined) {
            // F1a
            violations.push(`[field] F1a: ID 0 has no signature entry — the DEFAULT reserved slot is missing`);
        } else {
            // F1b
            if (canonicalizer.getModel(0) !== undefined) {
                violations.push(`[field] F1b: ID 0 (DEFAULT slot) unexpectedly holds a model`);
            }
            byHash.set(defaultSig.getHashCode(), [{ id: 0, sig: defaultSig }]);
        }

        const size = canonicalizer.size();
        for (let id = 1; id < size; id++) {
            const sig = canonicalizer.get(id);
            if (sig === undefined) {
                // F2
                violations.push(`[field] F2: ID ${id} is inside [0, size=${size}) but has no signature entry`);
                continue;
            }

            // F5（累积）
            let group = byHash.get(sig.getHashCode());
            if (group === undefined) {
                group = [];
                byHash.set(sig.getHashCode(), group);
            }
            group.push({ id, sig });

            const model = canonicalizer.getModel(id);
            if (model === undefined) {
                // F3
                violations.push(`[field] F3: ID ${id} (${sig.toString()}) has no model`);
                continue;
            }

            // F4
            const back = model.getFieldSigID();
            if (back !== id) {
                violations.push(`[field] F4: model at ID ${id} (${sig.toString()}) back-points to ${back}`);
            }

            // F4b
            const modelDeclClassID = model.getDeclaringClassID();
            const sigDeclClassID = sig.getDeclaringClassSigID();
            if (modelDeclClassID !== sigDeclClassID) {
                violations.push(
                    `[field] F4b: model at ID ${id} (${sig.toString()}) has declaringClassID ${modelDeclClassID} ` +
                        `but the signature declares ${sigDeclClassID}`
                );
            }

            // F6
            if (seenModels.has(model)) {
                violations.push(`[field] F6: model at ID ${id} (${sig.toString()}) is mounted at more than one ID`);
            } else {
                seenModels.add(model);
            }

            // F7a/F7b（仅存活条目）
            const classModel = reg.classSigCanonicalizer.getModel(sigDeclClassID ?? -1);
            if (classModel === undefined) {
                // F7a（含 sigDeclClassID 为 undefined/-1 的非法 model 侧形态：
                // model 侧 field 一律 class 声明，ns/unclear 声明不该出现。）
                violations.push(`[field] F7a: ID ${id} (${sig.toString()}) has declaring class SigID ${sigDeclClassID} with no model`);
            } else if (!classModel.hasTopFieldWithID(id) && !classModel.hasTopStaticFieldWithID(id)) {
                // F7b（联合判定，见函数头注记）
                violations.push(`[field] F7b: ID ${id} (${sig.toString()}) is in neither of declaring class ${sigDeclClassID}'s field indexes`);
            }
        }

        // F5（检查）：组内两两 equals。分组大小几乎恒为 1，均摊 O(n)。
        for (const group of byHash.values()) {
            for (let i = 0; i < group.length; i++) {
                for (let j = i + 1; j < group.length; j++) {
                    if (group[i].sig.equals(group[j].sig)) {
                        violations.push(
                            `[field] F5: IDs ${group[i].id} and ${group[j].id} hold equal signatures ` +
                                `(${group[i].sig.toString()}) — hash/equals contract broken`
                        );
                    }
                }
            }
        }

        return violations;
    }

    /**
     * 校验 formal method 空间的结构不变量，规则如下：
     *
     * 前置设计契约（闭包双签名，BodyBuilder.updateNestedMethodWithClosures 的
     * 终态为设计行为）：重签后 model[id1]=M（旧签名，类索引锚定——枚举入口）
     * 与 model[id2]=M（新签名含闭包参数——invoke expr 消费面）双注册合法，
     * topMethodSigIDs 持 id1 不变、id2 不入索引（保证 getMethods 枚举唯一，
     * 实测 ENUM-DUP=0）。
     *
     * M1a  DEFAULT 保留位契约（正向断言）：ID 0 必须存在 DEFAULT 签名条目。
     *
     * M1b  DEFAULT 保留位契约（正向断言）：ID 0 的 model 必须为 undefined。
     *
     * M2   ID 稠密性：[1, size) 内每个 ID 都必须有签名条目（防御性检查）。
     *
     * M3   model 完备性（实证修正口径）：无 model 的条目按 declaring class
     *      存活判定分类——declaring class 的 model 存活 → 视为 declare-only
     *      合法态跳过（实证：SDK 接口 overload 声明条目（如 ObjectConstructor.
     *      create/freeze 的非首声明）与 W3 闭包 declare 重签产物均为此形态，
     *      单资源达千条量级，属构建常态而非洞）；declaring class 不明（-1/0）
     *      或 class model 已删（驱逐窗口外）→ 报告。驱逐窗口内的条目随 reload
     *      由 addMethod 兜底自愈。
     *
     * M4   挂载槽一致性（方法级三方持有，闭包双签名适配）：model[i] 存在时，
     *      i === M.getMethodSigID() ∨ M.declareSigIDs ∋ i ∨ 某存活类方法索引
     *      ∋ i。闭包 id1 经索引持有 ✓、id2 经 self-id ✓；违规 = 孤儿挂载
     *      （无任何持有方的 model 残留，如驱逐窗口 legacy 槽）。
     *
     * M4b  双侧声明类一致：model.getDeclaringClassID() === sig 的
     *      declaringClassSigID（独立双维护点，抓 builder 不同步）。copyMembers
     *      跨类挂载双侧同指 from 类 → 不误报 ✓。
     *
     * M5   签名值唯一（hash 分组 + 组内两两 equals，ID 0 种入守卫值域坍缩）。
     *      注记：declaringClassTempSigID 参与 equals——temp 版与 formal 版是
     *      合法分裂条目非重复；returnType 进 equals 不进 hash（仅返回类型不同
     *      的重载合法分 ID）。
     *
     * M6   反向链检查（非实例唯一——闭包双挂载已合法化）：存活类方法索引
     *      （含 default/init 三个旁路 ID 字段）的每个条目 ID 必须有 model
     *      （抓索引断链：驱逐 desync、索引损坏）。
     *
     * M7   declaring class model 存在（sig 侧 -1 temp / 0 跳过并注记；
     *      class 驱逐后 method 存活 = 驱逐不完整形态）。
     *
     * 执行语义：所有规则全量执行、任何违规不中断；违规逐条收集（规则号 + ID +
     * 签名描述），一次性汇总报告。全部规则均为 error 级。
     *
     * @returns 全部违规描述（空数组 = 空间干净）。
     */
    public static validateMethodSpace(): string[] {
        const violations: string[] = [];
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const canonicalizer = reg.methodSigCanonicalizer;
        // M5 辅助结构：按缓存的 hashCode 分组签名。
        const byHash: Map<number, { id: number; sig: MethodSignature }[]> = new Map();

        const defaultSig = canonicalizer.get(0);
        if (defaultSig === undefined) {
            // M1a
            violations.push(`[method] M1a: ID 0 has no signature entry — the DEFAULT reserved slot is missing`);
        } else {
            // M1b
            if (canonicalizer.getModel(0) !== undefined) {
                violations.push(`[method] M1b: ID 0 (DEFAULT slot) unexpectedly holds a model`);
            }
            byHash.set(defaultSig.getHashCode(), [{ id: 0, sig: defaultSig }]);
        }

        // M4/M6 辅助结构（单遍构建）：
        // 索引持有集：存活类方法索引（含 default/init 旁路 ID）的每个条目 ID。
        const indexHeld = new Set<number>();
        // 索引条目清单（class model + ID），供 M6 反向链检查。
        const indexEntries: { clsID: number; id: number }[] = [];
        for (let clsID = 1; clsID < reg.classSigCanonicalizer.size(); clsID++) {
            const cls = reg.classSigCanonicalizer.getModel(clsID);
            if (cls === undefined) {
                continue;
            }
            for (const ids of cls.getMethodNameIndex()?.values() ?? []) {
                for (const id of ids) {
                    indexHeld.add(id);
                    indexEntries.push({ clsID, id });
                }
            }
            for (const ids of cls.getStaticMethodNameIndex()?.values() ?? []) {
                for (const id of ids) {
                    indexHeld.add(id);
                    indexEntries.push({ clsID, id });
                }
            }
        }

        const size = canonicalizer.size();
        for (let id = 1; id < size; id++) {
            const sig = canonicalizer.get(id);
            if (sig === undefined) {
                // M2
                violations.push(`[method] M2: ID ${id} is inside [0, size=${size}) but has no signature entry`);
                continue;
            }

            // M5（累积）
            let group = byHash.get(sig.getHashCode());
            if (group === undefined) {
                group = [];
                byHash.set(sig.getHashCode(), group);
            }
            group.push({ id, sig });

            const model = canonicalizer.getModel(id);
            if (model === undefined) {
                // M3（实证修正口径）：declaring class 存活 → declare-only 合法跳过。
                const declClassID = sig.getDeclaringClassSigID();
                if (declClassID === undefined || declClassID <= 0 || reg.classSigCanonicalizer.getModel(declClassID) === undefined) {
                    violations.push(`[method] M3: ID ${id} (${sig.toString()}) has no model and its declaring class is not alive`);
                }
                continue;
            }

            // M4（三方持有）
            const selfID = model.getMethodSigID();
            const declareHeld = (model.getDeclareSigIDs() ?? []).includes(id);
            // U+（display 归一化）：alias 条目（declaringClass 为 AliasClassSignature
            // 的一等 formal 签名）按设计双注册 origin model——model 由 origin 条目
            // （selfID）持有，alias 条目本身不进 self/declare/index 任何一方，属
            // 合法共享形态（round12 declare 全槽同构）。
            const sigDeclClassForAlias = sig.getDeclaringClassSigID();
            const isAliasEntry = sigDeclClassForAlias > 0 && reg.classSigCanonicalizer.get(sigDeclClassForAlias) instanceof AliasClassSignature;
            if (!isAliasEntry && id !== selfID && !declareHeld && !indexHeld.has(id)) {
                violations.push(`[method] M4: model at ID ${id} (${sig.toString()}) is held by no one (not self/declare/index)`);
            }

            // M4b（alias 条目跳过：sig 的 declaringClassSigID 是 alias ID，与 origin
            // model 的 declaringClassID 必然不同——双注册的设计内形态）
            const modelDeclClassID = model.getDeclaringClassID();
            const sigDeclClassID = sig.getDeclaringClassSigID();
            if (!isAliasEntry && modelDeclClassID !== sigDeclClassID) {
                violations.push(
                    `[method] M4b: model at ID ${id} (${sig.toString()}) has declaringClassID ${modelDeclClassID} ` +
                        `but the signature declares ${sigDeclClassID}`
                );
            }

            // M7（declaring class model 存在；-1 temp / 0 跳过）
            if (sigDeclClassID !== undefined && sigDeclClassID > 0 && reg.classSigCanonicalizer.getModel(sigDeclClassID) === undefined) {
                violations.push(`[method] M7: ID ${id} (${sig.toString()}) has declaring class SigID ${sigDeclClassID} with no model`);
            }
        }

        // M6（反向链）：索引条目必须有 model。
        for (const { clsID, id } of indexEntries) {
            if (canonicalizer.getModel(id) === undefined) {
                violations.push(`[method] M6: class ${clsID}'s method index holds ID ${id} with no model`);
            }
        }

        // M5（检查）：组内两两 equals。分组大小几乎恒为 1，均摊 O(n)。
        for (const group of byHash.values()) {
            for (let i = 0; i < group.length; i++) {
                for (let j = i + 1; j < group.length; j++) {
                    if (group[i].sig.equals(group[j].sig)) {
                        violations.push(
                            `[method] M5: IDs ${group[i].id} and ${group[j].id} hold equal signatures ` +
                                `(${group[i].sig.toString()}) — hash/equals contract broken`
                        );
                    }
                }
            }
        }

        return violations;
    }

    // ---------------------------------------------------------------------
    // Temp weak-registry spaces validation
    // ---------------------------------------------------------------------

    /**
     * 校验三个 temp 弱注册空间（class/method/field）的结构不变量，规则如下：
     *
     * T1  非陈旧性：非空 slot 的值不得已存在于 formal 空间。temp 注册的前提是
     *     formal miss；若后来同值签名进入 formal（真实模型注册），该 slot 即
     *     过期——消费方已可从 formal 解析，成为"可迁移未迁移"的陈旧残留
     *     （持有者下次重路由 formal 命中时经 retireWithReplacement 置空）。
     *     （注意：不做"全部 unclear"强断言——ClassType/FunctionType/Ref 等注册源
     *     的条件是 formal miss，clear-but-unregistered 条目为设计内合法形态。）
     *
     * T2  register 幂等守护：槽位 ID ↔ 实例自带 symbol ID 双向一致。register 按
     *     对象恒等幂等分配 ID（同实例复用、新实例新 ID），同一实例出现在两个
     *     槽位（或实例自带 ID 与槽位不符）意味着 symbol 标记被破坏。
     *
     * T3  持有者 ID 有效性（B 轮三版索引表语义）：持有结构上声明的 temp SigID
     *     必须指向非空 slot（未迁移）或有替换记录的已置空 slot（已迁移，惰性
     *     物化痕迹态 formalID≥0 && tempSigID≠undefined 亦经此规则覆盖）。
     *     两者皆无 = stale（Registry clear/dispose 后的残留）或从未注册的 ID
     *     （构造 bug）。持有结构（判据一律用注册标记字段 getTempSigID /
     *     getDeclaringClassTempSigID）：
     *     - tempClass：ClassType（getTempSigID）、FieldSignature/MethodSignature
     *       的 declaringClassTempSigID
     *     - tempMethod：FunctionType/LexicalEnvType/AbstractInvokeExpr（getTempSigID）
     *     - tempField：EnumValueType、AbstractFieldRef 即 ArkInstanceFieldRef/
     *       ArkStaticFieldRef（getTempSigID）
     *
     * T4  持有可达性——**已退役**（B 轮，round20）：三版索引表 slot 强持有下，
     *     "存活但无持有者"的 GC 驱动判定失去意义（slot 本身就是持有者，全保留
     *     是设计决策——推导中间垃圾钉活到 dispose 属知情权衡，见 §26.3）。
     *     若 C 轮引入 prune，再按需新建对应审计规则。
     *
     * 执行语义：所有规则全量执行、任何违规不中断；全部为 error 级。
     *
     * @returns 全部违规描述（空数组 = 三个空间干净）。
     */
    public static validateTempSpaces(): string[] {
        return this.runTempSpaceValidation();
    }

    private static runTempSpaceValidation(): string[] {
        const reg = SignatureCanonicalizerRegistry.getInstance();
        const violations: string[] = [];
        violations.push(...this.validateTempSpaceEntries('class', reg.tempClassSigCanonicalizer, reg.classSigCanonicalizer));
        violations.push(...this.validateTempSpaceEntries('method', reg.tempMethodSigCanonicalizer, reg.methodSigCanonicalizer));
        violations.push(...this.validateTempSpaceEntries('field', reg.tempFieldSigCanonicalizer, reg.fieldSigCanonicalizer));
        this.checkTempHolderIDs(violations);
        return violations;
    }

    /** T1 + T2：单空间的条目级校验。 */
    private static validateTempSpaceEntries<S extends Canonicalizable>(
        space: string,
        temp: TempSignatureCanonicalizer<S>,
        formal: { getExistingId(sig: S): number }
    ): string[] {
        const violations: string[] = [];
        for (const id of temp.registeredIds()) {
            const sig = temp.get(id);
            if (sig === undefined) {
                continue;
            }
            // T1: the value must not have landed in formal after the temp registration.
            const formalId = formal.getExistingId(sig);
            if (formalId !== -1) {
                violations.push(`[temp-${space}] T1: live entry ${id} (${sig.toString()}) also exists in formal (ID ${formalId}) — stale temp registration`);
            }
            // T2: register idempotency — the instance's self-carried temp ID must equal its slot.
            const selfId = temp.getExistingTempId(sig);
            if (selfId !== id) {
                violations.push(
                    `[temp-${space}] T2: slot ${id} (${sig.toString()}) holds an instance whose self-carried temp ID is ${selfId === -1 ? 'unregistered' : selfId} — register idempotency broken`
                );
            }
        }
        return violations;
    }

    /**
     * 模型树遍历（registry models 枚举，含 SDK）：执行 T3 持有者 ID 有效性校验
     * （B 轮三版索引表语义——锚删除后持有者只剩 ID，校验对象从"锚实例注册一致"
     * 改为"声明 ID 指向非空 slot 或有替换记录"）。
     */
    private static checkTempHolderIDs(violations: string[]): void {
        const reg = SignatureCanonicalizerRegistry.getInstance();

        const checkTempID = (space: string, tempSigID: number | undefined, holderDesc: string): void => {
            if (tempSigID === undefined) {
                return;
            }
            const temp =
                space === 'class' ? reg.tempClassSigCanonicalizer : space === 'method' ? reg.tempMethodSigCanonicalizer : reg.tempFieldSigCanonicalizer;
            const slotLive = temp.get(tempSigID) !== undefined;
            const hasReplacement = temp.getReplacement(tempSigID) !== -1;
            if (!slotLive && !hasReplacement) {
                violations.push(
                    `[temp-${space}] T3: ${holderDesc} declares temp SigID ${tempSigID} that is neither a live slot nor has a replacement record — stale or unregistered ID`
                );
            }
        };

        const visitedTypes = new Set<Type>();
        const visitType = (type: Type | undefined | null, holderDesc: string): void => {
            if (type === undefined || type === null || visitedTypes.has(type)) {
                return;
            }
            visitedTypes.add(type);
            if (type instanceof ClassType) {
                checkTempID('class', type.getTempSigID(), `${holderDesc} (ClassType)`);
                for (const gt of type.getRealGenericTypes() ?? []) {
                    visitType(gt, holderDesc);
                }
            } else if (type instanceof FunctionType) {
                checkTempID('method', type.getTempSigID(), `${holderDesc} (FunctionType)`);
                for (const gt of type.getRealGenericTypes() ?? []) {
                    visitType(gt, holderDesc);
                }
            } else if (type instanceof LexicalEnvType) {
                checkTempID('method', type.getTempSigID(), `${holderDesc} (LexicalEnvType)`);
                for (const closure of type.getClosures()) {
                    visitType(closure.getType(), holderDesc);
                }
            } else if (type instanceof EnumValueType) {
                checkTempID('field', type.getTempSigID(), `${holderDesc} (EnumValueType)`);
            } else if (type instanceof UnionType || type instanceof IntersectionType || type instanceof TupleType) {
                for (const t of type.getTypes()) {
                    visitType(t, holderDesc);
                }
            } else if (type instanceof ArrayType) {
                visitType(type.getBaseType(), holderDesc);
            } else if (type instanceof AliasType) {
                visitType(type.getOriginalType(), holderDesc);
            }
        };

        const visitValue = (value: unknown, holderDesc: string): void => {
            if (value instanceof AbstractInvokeExpr) {
                checkTempID('method', value.getTempSigID(), `${holderDesc} (invoke expr)`);
                for (const arg of value.getArgs()) {
                    visitValue(arg, holderDesc);
                }
                visitType(value.getType(), holderDesc);
            } else if (value instanceof AbstractFieldRef) {
                checkTempID('field', value.getTempSigID(), `${holderDesc} (field ref)`);
                visitType(value.getType(), holderDesc);
            } else if (value instanceof GlobalRef) {
                visitValue(value.getRef(), holderDesc);
            }
        };

        for (const cls of reg.classSigCanonicalizer.getModels()) {
            if (cls === undefined) {
                continue;
            }
            const classDesc = `class ${cls.getName()}`;
            for (const rt of cls.getRealTypes() ?? []) {
                visitType(rt, classDesc);
            }
            for (const method of cls.getMethods()) {
                const methodSig = method.getSignature();
                const methodDesc = `${classDesc} method ${method.getName()}`;
                checkTempID('class', methodSig.getDeclaringClassTempSigID(), `${methodDesc} (MethodSignature declaring)`);
                visitType(methodSig.getMethodSubSignature().getReturnType(), methodDesc);
                for (const param of methodSig.getMethodSubSignature().getParameters()) {
                    visitType(param.getType(), methodDesc);
                }
                const body = method.getBody();
                if (body !== undefined) {
                    for (const local of body.getLocals().values()) {
                        visitType(local.getType(), methodDesc);
                    }
                    const usedGlobals = body.getUsedGlobals();
                    if (usedGlobals !== undefined) {
                        for (const gv of usedGlobals.values()) {
                            visitValue(gv, methodDesc);
                        }
                    }
                    for (const stmt of body.getCfg().getStmts()) {
                        for (const v of stmt.getDefAndUses()) {
                            visitValue(v, methodDesc);
                        }
                    }
                }
            }
            for (const field of cls.getFields()) {
                const fieldSig = field.getSignature();
                const fieldDesc = `${classDesc} field ${field.getName()}`;
                checkTempID('class', fieldSig.getDeclaringClassTempSigID(), `${fieldDesc} (FieldSignature declaring)`);
                visitType(fieldSig.getType(), fieldDesc);
            }
        }
    }

    /**
     * 校验全部已注册空间，输出一份合并汇总（完整全貌，绝不截断）。
     * @returns 全部空间干净时返回 true。
     */
    public static validateAll(): boolean {
        const violations = [
            ...this.validateFileSpace(),
            ...this.validateNamespaceSpace(),
            ...this.validateClassSpace(),
            ...this.validateFieldSpace(),
            ...this.validateMethodSpace(),
            ...this.validateTempSpaces(),
        ];
        if (violations.length > 0) {
            logger.error(`Canonicalizer validation failed with ${violations.length} violation(s):\n  - ${violations.join('\n  - ')}`);
            return false;
        }
        logger.info('Canonicalizer validation successes, everything is ok.');
        return true;
    }
}
