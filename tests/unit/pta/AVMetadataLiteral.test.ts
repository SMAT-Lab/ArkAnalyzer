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

import { describe, expect, it } from 'vitest';
import path from 'path';
import { Scene, SceneConfig } from '../../../src';
import { ArkClass } from '../../../src/core/model/ArkClass';
import { FileSignature } from '../../../src/core/model/ArkSignature';
import { SignatureCanonicalizerRegistry } from '../../../src/core/common/SignatureCanonicalizerRegistry';

// 对象字面量赋值 SDK 声明类型的字段写穿回归（inferAnonymousClass / assignAnonField）：
// 推断期"类型对齐而非签名过户"——SDK 类字段 model 与 initializer 保持原样。
describe('object literal to SDK type: field isolation Test', () => {
    it('SDK field initializer stays empty and models stay intact after inference', () => {
        const config = new SceneConfig();
        config.buildFromProjectDir(path.resolve('tests/resources/pta/AVMetadataLiteral'));
        config.getSdksObj().push({ moduleName: '', name: 'etsSdk', path: path.resolve('tests/resources/Sdk') });
        const scene = new Scene();
        scene.buildSceneFromProjectDir(config);
        // 推断前基线：SDK 字段 initializer 为空。
        const sdkSigFile = new FileSignature('etsSdk', 'api/@ohos.multimedia.media.d.ts');
        const sdkFile = scene.getFile(sdkSigFile)!;
        expect(sdkFile).toBeDefined();
        const sdkClass: ArkClass | undefined = Array.from(SignatureCanonicalizerRegistry.getInstance().classSigCanonicalizer.getModels()).find(
            c => c.getName() === 'AVMetadata'
        );
        expect(sdkClass).toBeDefined();
        const sdkAlbum = sdkClass!.getFieldWithName('album');
        expect(sdkAlbum).toBeDefined();
        expect(sdkAlbum!.getInitializer().length).toBe(0);

        scene.inferTypes();

        // ① 核心：SDK 类字段 initializer 保持为空（字面量赋值语句不写穿）。
        expect(sdkAlbum!.getInitializer().length).toBe(0);
        const sdkArtist = sdkClass!.getFieldWithName('albumArtist');
        expect(sdkArtist!.getInitializer().length).toBe(0);

        // ② SDK 字段 model 仍是构建时实例（未被匿名字段顶替）。
        const reg = SignatureCanonicalizerRegistry.getInstance();
        expect(reg.fieldSigCanonicalizer.getModel(sdkAlbum!.getFieldSigID())).toBe(sdkAlbum);

        // ③ 匿名类字段 initializer 携带字面量赋值语句。
        const projFile = scene.getFiles().find(f => f.getName().endsWith('avmetadata.ts'));
        expect(projFile).toBeDefined();
        const anonClass = projFile!.getClasses().find(c => c.isAnonymousClass());
        expect(anonClass).toBeDefined();
        const anonAlbum = anonClass!.getFieldWithName('album');
        expect(anonAlbum).toBeDefined();
        expect(anonAlbum!.getInitializer().length).toBeGreaterThan(0);

        // ④ 匿名类字段 type 已对齐 SDK 字段声明类型（string）。
        expect(anonAlbum!.getType().toString()).toBe(sdkAlbum!.getType().toString());

        // ⑤ 匿名类字段身份一致：fieldSigID 与类索引中的 ID 相同（无两 ID 分裂）。
        expect(anonClass!.hasTopFieldWithID(anonAlbum!.getFieldSigID())).toBe(true);

        // ⑥ init stmt 的 fieldRef 仍持有 SDK 字段签名（master 兼容的 IR 形态）。
        const initStmt = anonAlbum!.getInitializer()[anonAlbum!.getInitializer().length - 1];
        const leftOp = (initStmt as { getLeftOp?: () => unknown }).getLeftOp?.() as { getFieldSignature?: () => { toString(): string } } | undefined;
        expect(leftOp?.getFieldSignature?.()?.toString()).toBe(sdkAlbum!.getSignature().toString());

        // ⑦ 精确类型优先（narrowing）：枚举成员 initializer 推导出的 EnumValueType
        //    保留，不被 SDK 接口字段的声明类型（宽泛枚举 ClassType）覆盖。
        //    复刻 audio.AudioRendererInfo.usage 场景（SDK 接口字段类型为枚举时，
        //    对象字面量字段应精确到枚举成员）。
        const anonHdrType = anonClass!.getFieldWithName('hdrType');
        expect(anonHdrType).toBeDefined();
        const anonHdrTypeStr = anonHdrType!.getType().toString();
        expect(anonHdrTypeStr).toContain('AV_HDR_TYPE_NONE');
        const sdkHdrType = sdkClass!.getFieldWithName('hdrType');
        expect(sdkHdrType).toBeDefined();
        expect(anonHdrTypeStr).not.toBe(sdkHdrType!.getType().toString());
    });
});
